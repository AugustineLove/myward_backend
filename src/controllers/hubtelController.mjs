import client from "../db.mjs";


// Hubtel webhook endpoint
const webhoookUrl = async (req, res) => {
    const event = req.body;
  
    const {
      transactionId,
      clientReference,
      amountPaid,
      status,
      customerName,
      paymentDateTime
    } = event;
  
    try {
      // Avoid duplicate entries
      const { rows: existing } = await client.query(
        'SELECT * FROM webhooks WHERE transaction_id = $1',
        [transactionId]
      );
  
      if (existing.length > 0) {
        console.log('Duplicate webhook. Skipping.');
        return res.status(200).send('Duplicate webhook');
      }
  
      // Insert into DB
      await client.query(
        `INSERT INTO webhooks (
          webhook_id, client_reference, amount_paid, status, customer_name, payment_datetime, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          webhookId,
          clientReference,
          amountPaid,
          status,
          customerName,
          paymentDateTime ? new Date(paymentDateTime) : null,
          event
        ]
      );
  
      console.log('webhook saved.');
      res.status(200).send('Webhook processed');
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).send('Server error');
    }
  }

export default webhoookUrl;

