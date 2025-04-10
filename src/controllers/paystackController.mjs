import axios from "axios";
import dotenv from "dotenv";
import https from 'https'

dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

// Initialize a payment
export const initializePayment = async (req, res) => {
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