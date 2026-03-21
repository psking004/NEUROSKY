import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

/**
 * PostgreSQL Service - Mission-Critical Persistence
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Pool capacity
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL: Pool Connection Interrupted [CRITICAL]', err.message);
});

export const dbRequest = async (query, params) => {
  const client = await pool.connect();
  try {
    const res = await client.query(query, params);
    return res.rows;
  } finally {
    client.release();
  }
};
