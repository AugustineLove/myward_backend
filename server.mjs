
import express from 'express';
import client from './src/db.mjs';
import router from './src/routes/index.mjs';
import { config } from 'dotenv';
import cors from 'cors';

config()

const app = express();
app.use(cors())

// Middleware to parse JSON bodies
app.use(express.json());
app.use(router)

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});