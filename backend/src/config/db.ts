import './load-env.js';
import pg from 'pg';
import { logger } from '../utils/logger.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  logger.warn('DATABASE_URL is not set. Database operations will fail unless configured.');
}

export const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl?.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  logger.error('Unexpected idle PostgreSQL client error', { error: err.message });
});

export const db = {
  async query<T extends pg.QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<pg.QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed SQL query', { duration: `${duration}ms`, rows: res.rowCount });
      return res;
    } catch (error: any) {
      logger.error('Database query error', { error: error.message, code: error.code });
      throw error;
    }
  },

  async getClient(): Promise<pg.PoolClient> {
    return pool.connect();
  },

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; timestamp: string }> {
    const start = Date.now();
    const res = await pool.query('SELECT NOW() as now;');
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      latencyMs,
      timestamp: res.rows[0].now,
    };
  },
};
