import { Pool, PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// PostgreSQL connection configuration
const poolConfig: PoolConfig = {
  host: (typeof process !== 'undefined' ? process.env.POSTGRES_HOST : 'localhost') || 'localhost',
  port: parseInt((typeof process !== 'undefined' ? process.env.POSTGRES_PORT : '5433') || '5433'),
  database: (typeof process !== 'undefined' ? process.env.POSTGRES_DB : 'scanbill_tally') || 'scanbill_tally',
  user: (typeof process !== 'undefined' ? process.env.POSTGRES_USER : 'postgres') || 'postgres',
  password: (typeof process !== 'undefined' ? process.env.POSTGRES_PASSWORD : '') || '',
  ssl: (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create a PostgreSQL pool (only on server side)
export const pool = !isBrowser ? new Pool(poolConfig) : null;

// Create Drizzle ORM instance (only on server side)
export const db = !isBrowser && pool ? drizzle(pool) : null;

// Database connection utility functions
export const connectDB = async () => {
  if (isBrowser) {
    console.warn('PostgreSQL connection attempted in browser environment');
    return false;
  }
  
  if (!pool) {
    console.error('PostgreSQL pool not available');
    return false;
  }

  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    return false;
  }
};

export const closeDB = async () => {
  if (isBrowser || !pool) return;
  
  await pool.end();
  console.log('PostgreSQL connection closed');
};

// Health check function
export const healthCheck = async () => {
  if (isBrowser || !pool) {
    return { status: 'unavailable', error: 'Not available in browser' };
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return { status: 'healthy', timestamp: result.rows[0].now };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

// Export for use in other files
export default db; 