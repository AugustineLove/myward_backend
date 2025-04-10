// import pkg from 'pg';  // Default import of the 'pg' module
// const { Client } = pkg; 


// const client = new Client({
//   host: 'localhost',  // Localhost for development
//   user: 'postgres',  // Your PostgreSQL user
//   password: 'stephens03',  // Your password
//   database: 'school_fees_db',  // Your database name
//   port: 5432,  // Default PostgreSQL port
// });

// client.connect()
//   .then(() => console.log('Connected to PostgreSQL'))
//   .catch(err => console.error('Connection error', err.stack));

// export default client;

import dotenv from "dotenv";
import pkg from 'pg';  // Default import of the 'pg' module
const { Client } = pkg; 
dotenv.config();

// Use the DATABASE_URL environment variable to connect to your remote database
const client = new Client({
  connectionString: process.env.DATABASE_URL,  // Use the environment variable for the remote database URL
  ssl: {
    rejectUnauthorized: false  // Set SSL to true for secure connection (may be required for remote databases)
  }
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err.stack));

export default client;