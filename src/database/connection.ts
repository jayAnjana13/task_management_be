import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../config';

// Log database configuration (without sensitive data)
if (config.db.url) {
  const urlObj = new URL(config.db.url);
  console.log(`Database: Using DATABASE_URL with host ${urlObj.hostname}`);
} else {
  console.log(`Database: Using individual settings with host ${config.db.host}:${config.db.port}`);
}

// Create PostgreSQL connection pool
const pool = config.db.url 
  ? new Pool({ 
    connectionString: config.db.url,
    ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  })
  : new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

// Log connection events
pool.on('connect', () => {
  console.log('Database client connected');
});

pool.on('error', (err: Error) => {
  console.error('Unexpected database error:', err);
  // Don't exit immediately in production to allow for retry mechanisms
  if (config.nodeEnv === 'development') {
    process.exit(-1);
  }
});

// Query helper function
export async function query(
  text: string,
  params?: any[]
): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development') {
      console.log('Query executed:', { text: text.substring(0, 50), duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get a client from pool for transactions
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  // Track if client is released
  let released = false;

  // Override query to track last query
  const query = async (text: string, params?: any[]) => {
    return originalQuery(text, params);
  };

  // Override release to prevent double release
  const release = () => {
    if (released) {
      console.warn('Client already released');
      return;
    }
    released = true;
    return originalRelease();
  };

  return Object.assign(client, { query, release });
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// Close pool
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Database pool closed');
}

export { pool };
