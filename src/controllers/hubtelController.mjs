import client from "../db.mjs";
import axios from "axios"
const HUBTEL_CHECKOUT_URL = 'https://payproxyapi.hubtel.com/items/initiate';
const HUBTEL_AUTH_HEADER = 'Basic TTFEeHJsQTpjMzliMjgyZGQ1NmY0OWNhYTViNWNlYzExZTYyMTlhNw=='; // Replace with your actual credentials
const HUBTEL_TXN_STATUS_URL = 'https://api-txnstatus.hubtel.com/transactions/2029967/status'

// Hubtel webhook endpoint
export const hubtelWebhookUrl = async (req, res) => {
  const payload = req.body;

  if (!payload || !payload.Data) {
    return res.status(400).send("Invalid webhook structure");
  }

  const data = payload.Data;

  const {
    AmountPaid,
    Fee,
    Amount,
    Charges,
    AmountAfterCharges,
    Description,
    ClientReference,
    TransactionId,
    ExternalTransactionId,
    AmountCharged,
    OrderId,
  } = data;

  try {
    // Optional: check for duplicate TransactionId
    const { rows: existing } = await client.query(
      'SELECT * FROM webhooks WHERE transaction_id = $1',
      [TransactionId]
    );

    if (existing.length > 0) {
      console.log('Duplicate webhook. Skipping.');
      return res.status(200).send('Duplicate webhook');
    }

    // Insert into webhooks table
    await client.query(
      `INSERT INTO webhooks (
        client_reference,
        amount_paid,
        amount,
        amount_after_charges,
        charges,
        fee,
        transaction_id,
        external_transaction_id,
        order_id,
        description,
        raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        ClientReference,
        AmountPaid,
        Amount,
        AmountAfterCharges,
        Charges,
        Fee,
        TransactionId,
        ExternalTransactionId,
        OrderId,
        Description,
        payload
      ]
    );

    console.log('Webhook saved for reference:', ClientReference);
    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error saving webhook:', error);
    res.status(500).send('Server error');
  }
};


export const hubtelCheckout = async (req, res) => {
  const { amount, description, reference } = req.body;

  if (!amount || !description || !reference) {
    return res.status(400).json({ error: 'Missing amount, description, or reference' });
  }

  try {
    const response = await axios.post(
      HUBTEL_CHECKOUT_URL,
      { 
        totalAmount: amount,
        description: description,
        callbackUrl: `https://sfmyward.space/api/payment/webhook/hubtel-payment`, // Replace with your real webhook
        returnUrl: `http://localhost:5173/dashboard/confirmSmsPayment?clientReference=${reference}`,
        cancellationUrl: 'http://localhost:5173/dashboard/bulkMessage',
        merchantAccountNumber: '2029967',
        clientReference: reference
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': HUBTEL_AUTH_HEADER,
          'Cache-Control': 'no-cache'
        }
      }
    );

    // Return payment page link
    return res.status(200).json({
      message: 'Checkout initiated successfully',
      data: response.data
    });
  } catch (error) {
    console.error('Hubtel Checkout Error:', error?.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to initiate checkout',
      details: error?.response?.data || error.message
    });
  }
};

export const verifyHubtelPayment = async (req, res) => {
  const { clientReference, schoolId } = req.params;

  try {
    const response = await axios.get(
      `${HUBTEL_TXN_STATUS_URL}?clientReference=${clientReference}`,
      {
        headers: {
          Authorization: HUBTEL_AUTH_HEADER,
        },
      }
    );

    console.log('Hubtel Response:', response.data);

    const status = response.data?.data?.status;

    if (status === 'Success') {
      const smsUnitsToAdd = 100;
      await client.query(
        'UPDATE schools SET sms_units = sms_units + $1 WHERE id = $2',
        [smsUnitsToAdd, schoolId]
      );

      await client.query(
        'INSERT INTO sms_transactions (school_id, client_reference, amount, status) VALUES ($1, $2, $3, $4) ON CONFLICT (client_reference) DO NOTHING',
        [schoolId, clientReference, response.data.data.amount, status]
      );

      return res.status(200).json({ message: 'SMS units updated successfully.', status: 'Success' });
    }

    return res.status(400).json({ message: 'Transaction not successful yet.', status });
  } catch (err) {
    console.error('Transaction verification error:', err?.response?.data || err.message);
    return res.status(err?.response?.status || 500).json({
      message: 'Error verifying transaction.',
      error: err?.response?.data || err.message,
    });
  }
};
