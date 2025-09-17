import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

 const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // allow self-signed certs
  }
});

pool.connect()
  .then(() => console.log('PostgreSQL pool connected'))
  .catch(err => console.error('PostgreSQL pool connection error:', err));
export default pool;