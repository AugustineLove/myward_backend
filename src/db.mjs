import pkg from 'pg';  // Default import of the 'pg' module
const { Client } = pkg; 


const client = new Client({
  host: 'localhost',  // Localhost for development
  user: 'postgres',  // Your PostgreSQL user
  password: 'stephens03',  // Your password
  database: 'school_fees_db',  // Your database name
  port: 5432,  // Default PostgreSQL port
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err.stack));

export default client;
