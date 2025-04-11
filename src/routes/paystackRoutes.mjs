
import { Router } from "express";
const bodyParser = require('body-parser');
const crypto = require('crypto');
import https from 'https'
import { createSubAccount, getAccountHolderName, getBanks, initializePayment, paystackWebhook, verifyPayment } from "../controllers/paystackController.mjs";
const paystackRoutes = Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

paystackRoutes.post('/initialize', initializePayment)
paystackRoutes.get('/verify/:reference', verifyPayment)
paystackRoutes.post('/createSubAccount', createSubAccount)
paystackRoutes.get('/getBanks', getBanks)
paystackRoutes.get('/getAccountHolderName', getAccountHolderName)
paystackRoutes.post('/webhook', paystackWebhook)

paystackRoutes.get('/', (req, res) => {

const params = JSON.stringify({
  "email": "customer@email.com",
  "amount": "20000"
})

const options = {
  hostname: 'api.paystack.co',
  port: 443,
  path: '/transaction/initialize',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json'
  }
}

const reqpaystack = https.request(options, res => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  });

  res.on('end', () => {
    console.log(JSON.parse(data))
  })
}).on('error', error => {
  console.error(error)
})

reqpaystack.write(params)
reqpaystack.end()
})

export default paystackRoutes;