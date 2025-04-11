
import express from 'express';
import client from './src/db.mjs';
import router from './src/routes/index.mjs';
import { config } from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';

config()

const app = express();
app.use(cors())

// Middleware to parse JSON bodies
app.use(express.json());
app.use(router)
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

const PORT = process.env.PORT || 5050;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});