const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false // Required for some cloud providers, adjust as necessary
  // }
});

pool.on('connect', () => {
  console.log('Auth Service connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client in Auth Service', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // Export pool for transactions if needed
};
