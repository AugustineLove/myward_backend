import axios from "axios";
import dotenv from "dotenv";
import https from 'https'
import client from "../db.mjs";

dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

// Initialize a payment
export const initializePayment = async (req, res) => {
  try {
      const { email, amount, subaccount, metadata } = req.body;

      const response = await axios.post(
          "https://api.paystack.co/transaction/initialize",
          {
              email,
              amount: amount * 100, // in kobo/pesewas
              currency: "GHS",
              callback_url: "https://myward.tech/paymentCallback",

              // ➕ Include subaccount if provided
              ...(subaccount && { subaccount }),

              // ➕ Add optional metadata (e.g., student info)
              ...(metadata && { metadata }),
          },
          {
              headers: {
                  Authorization: `Bearer ${PAYSTACK_SECRET}`,
                  "Content-Type": "application/json",
              },
          }
      );

      res.json(response.data);
  } catch (error) {
      console.error("Paystack Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Payment initialization failed" });
  }
};

export const initializePaymentMobile = async (req, res) => {
    try {
        const { email, amount } = req.body;
        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount: amount * 100, // Convert to kobo
                currency: "GHS",
                callback_url: "https://myward.tech/paymentCallback",
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    "Content-Type": "application/json",
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error("Paystack Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Payment initialization failed" });
    }
};

// Verify payment

export const verifyPayment = async (req, res) => {
  const reference = req.params.reference;
  console.log("Verifying reference:", reference);

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: `/transaction/verify/${reference}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
    }
  };

  const request = https.request(options, response => {
    let data = '';

    response.on('data', chunk => {
      data += chunk;
    });

    response.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log("Verification result:", result);
        res.json(result); // ✅ Send response back to client
      } catch (err) {
        console.error("Error parsing Paystack response:", err);
        res.status(500).json({ error: 'Invalid response from Paystack' });
      }
    });
  });

  request.on('error', error => {
    console.error("Error contacting Paystack:", error);
    res.status(500).json({ error: 'Unable to verify payment', details: error.message });
  });

  request.end(); // ✅ Don’t forget to end the request
};



export const createSubAccount = async (req, res) => {
  const { business_name, settlement_bank, account_number, percentage_charge, primary_contact_email } = req.body;

  const params = JSON.stringify({
    business_name,
    settlement_bank,
    account_number,
    primary_contact_email,
    percentage_charge: 0 
  });

  console.log(settlement_bank)
  console.log(account_number)
  console.log(business_name)
  console.log(`Params: ${params}`)

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/subaccount',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`, // Replace with your real Paystack secret key
      'Content-Type': 'application/json',
    },
  };

  const paystackReq = https.request(options, paystackRes => {
    let data = '';

    paystackRes.on('data', chunk => {
      data += chunk;
    });

    paystackRes.on('end', () => {
      const result = JSON.parse(data);
      if (result.status) {
        return res.status(200).json({ success: true, data: result.data });
      } else {
        return res.status(400).json({ success: false, message: result.message });
      }
    });
  });

  paystackReq.on('error', error => {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  });

  paystackReq.write(params);
  paystackReq.end();
};


export const getBanks = (req, res) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/bank?country=ghana',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`, // Use your secret key here
      },
    };
  
    https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
      
        response.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
           
            res.json(jsonData);
          } catch (err) {
            console.error('Error parsing JSON:', err);
            res.status(500).send('Error parsing response from Paystack');
          }
        });
      })
      .on('error', (error) => {
        console.error('Error with the request:', error);
        res.status(500).send('Error connecting to Paystack API');
      })
      .end();
    }      


    export const getAccountHolderName = (req, res) => {
      const { accountNumber, bankCode } = req.query;
      console.log(accountNumber, bankCode);
      if (!accountNumber || !bankCode) {
        return res.status(400).json({ error: 'Account number and bank code are required' });
      }
    
      const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}` // Replace with your Paystack secret key
        }
      };
    
      https.request(options, (response) => {
        let data = '';
    
        response.on('data', (chunk) => {
          data += chunk;
        });
    
        response.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
    
            if (parsedData.status) {
              // If the request was successful, send the account holder name
              return res.json({ accountHolderName: parsedData.data.account_name });
            } else {
              return res.status(400).json({ error: 'Account holder not found' });
            }
          } catch (error) {
            return res.status(500).json({ error: 'Error parsing response from Paystack API' });
          }
        });
      }).on('error', (error) => {
        console.error(error);
        return res.status(500).json({ error: 'Error communicating with Paystack API' });
      }).end();
    };


// Webhook endpoint
export const paystackWebhook = async (req, res) => {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(req.rawBody)
    .digest('hex');

  const signature = req.headers['x-paystack-signature'];

  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  console.log('✅ Paystack Event Received:', event.event);

  if (event.event === 'charge.success') {
    const data = event.data;
    const {
      amount,
      currency,
      customer,
      reference,
      paid_at,
      subaccount,
      status,
      metadata,
    } = data;

    try {
      await client.query(
        `
        INSERT INTO payments (
          amount, currency, email, reference, status,
          subaccount_code, paid_at,
          student_id, student_name, parent_name, fee_type, raw_metadata, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
        [
          amount / 100,
          currency,
          customer?.email || null,
          reference,
          status,
          subaccount || null,
          paid_at,
          metadata?.studentId || null,
          metadata?.studentName || null,
          metadata?.parentName || null,
          metadata?.feeType || null,
          metadata || null,
          data,
        ]
      );

      console.log(`💾 Payment saved for student: ${metadata?.studentName}`);
    } catch (err) {
      console.error('❌ Error saving payment:', err.message);
    }
  } else if (event.event === 'transfer.success') {
    console.log('💸 Transfer success:', event.data);
  } else if (event.event === 'transfer.failed') {
    console.error('🚫 Transfer failed:', event.data);
  } else {
    console.log('⚠️ Unhandled event:', event.event);
  }

  res.sendStatus(200);
};