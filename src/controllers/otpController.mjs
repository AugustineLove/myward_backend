// send-sms.mjs
import axios from 'axios';
import dotenv from "dotenv";

dotenv.config();

// Helper function for making API requests
const sendRequest = async (url, data, res) => {
    try {
        const headers = { 'api-key': process.env.ARKESKEL_API_KEY };
        const response = await axios.post(url, data, { headers });
        console.log("API Response:", response.data);
        return res ? res.status(200).json(response.data) : response.data;
    } catch (error) {
        console.error("SMS API Error:", error.response ? error.response.data : error.message);
        if (res) res.status(500).json({ error: "Failed to process request" });
    }
};

// Send OTP SMS
export const sendTemplateSMS = async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
    }

    const data = {
        expiry: 5,
        length: 6,
        medium: 'sms',
        message: 'Your OTP verification code from My Ward Company Limited is %otp_code%',
        number: phoneNumber,
        sender_id: 'My Ward',
        type: 'numeric',
    };

    const headers = {
        'api-key': 'Q2FiT3lFbGxURHNob1pGbldwTEE',
    };

    try {
        const response = await axios.post('https://sms.arkesel.com/api/otp/generate', data, { headers });
        console.log(response.data); // Log response data to verify API response
        res.status(200).json(response.data); // Send response back to frontend
    } catch (error) {
        console.error('SMS Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
    const { phoneNumber, code } = req.body;
    const data = {
      api_key: 'Q2FiT3lFbGxURHNob1pGbldwTEE',
      code: code,
      number: phoneNumber
    };
    console.log(data)
  const headers = {
    'api-key': 'Q2FiT3lFbGxURHNob1pGbldwTEE',
  }
  axios.post('https://sms.arkesel.com/api/otp/verify',data,{headers})
  .then(response => {
    console.log(`Response data: ${response}`)
    res.status(200).json(response.data)
  })
  .catch(error => console.log(error));
  };

// Send Scheduled SMS
export const sendScheduledSMS = async () => {
    const data = {
        sender: "Arkesel",
        message: "Hello <%name%>, safe journey to <%hometown%> this Xmas",
        recipients: [
            { number: "0593528296", name: "John Doe", hometown: "Techiman" },
            { number: "0542384752", name: "Adam", hometown: "Cape Coast" }
        ],
        scheduled_date: "2025-04-01 12:00 PM"
    };

    return await sendRequest('https://sms.arkesel.com/api/v2/sms/template/send', data);
};

// Send SMS with Webhook
export const sendTemplateSMSWithWebhook = async () => {
    const data = {
        sender: "Arkesel",
        message: "Hello <%name%>, safe journey to <%hometown%> this Xmas",
        recipients: [
            { number: "233553995047", name: "John Doe", hometown: "Techiman" },
            { number: "233544919953", name: "Adam", hometown: "Cape Coast" }
        ],
        callback_url: "https://yourdomain.com/webhook"
    };

    return await sendRequest('https://sms.arkesel.com/api/v2/sms/template/send', data);
};

// Uncomment to test functions
// await sendScheduledSMS();
// await sendTemplateSMSWithWebhook();
