import PgBoss from 'pg-boss';
import dotenv from 'dotenv';

dotenv.config();

const boss = new PgBoss({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // This line is the fix
  }
});

boss.on('error', error => console.error(`pg-boss error: ${error.message}`));

export default boss;
