import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const schema = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- User Registry
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'operator', -- operator, admin, controller
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Drone Registry
  CREATE TABLE IF NOT EXISTS drones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    manufacturer VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'REGISTERED', -- REGISTERED, ACTIVE, MAINTENANCE, DECOMMISSIONED
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE
  );

  -- Flight Logs
  CREATE TABLE IF NOT EXISTS flight_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drone_id UUID REFERENCES drones(id) ON DELETE CASCADE,
    operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    start_lat DOUBLE PRECISION,
    start_lng DOUBLE PRECISION,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'PLANNED', -- PLANNED, IN_FLIGHT, COMPLETED, ABORTED
    metadata JSONB
  );
`;

async function init() {
  try {
    const client = await pool.connect();
    console.log('--- Initializing NeuroSky Database ---');
    await client.query(schema);
    console.log('✅ PostgreSQL Schema initialized successfully.');
    client.release();
  } catch (err) {
    console.error('❌ Failed to initialize PostgreSQL Schema:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
