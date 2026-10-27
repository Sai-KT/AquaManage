import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'aquamanage_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aqua_manage_local',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true,
};

// ── TLS / SSL Configuration (Strict Aiven Certificate Verification) ────────
if (process.env.DB_SSL_CA_PATH) {
  try {
    const caCert = fs.readFileSync(path.resolve(process.env.DB_SSL_CA_PATH), 'utf8');
    dbConfig.ssl = {
      ca: caCert,
      rejectUnauthorized: true, // Strict certificate validation required for Aiven
    };
  } catch (err) {
    console.error(`[MySQL TLS Error] Could not read CA certificate from "${process.env.DB_SSL_CA_PATH}":`, err.message);
    throw err;
  }
} else if (process.env.DB_SSL_CA) {
  // Support inline CA certificate content via environment variable
  dbConfig.ssl = {
    ca: process.env.DB_SSL_CA,
    rejectUnauthorized: true,
  };
}

// Main pool
export const pool = mysql.createPool(dbConfig);

// Helper function to query with automatic release and parameterization
export async function query(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('[MySQL Query Error]:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sql: sql.slice(0, 100),
    });
    throw error;
  }
}

// Transaction helper
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Schema compatibility migration check
export async function ensureSchemaCompatibility() {
  try {
    const cols = await query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar_url'"
    );
    if (!cols || cols.length === 0) {
      await query('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) NULL AFTER department');
      console.log('[Database Schema] Added avatar_url column to users table.');
    }
  } catch (err) {
    // Non-fatal if table does not exist yet (e.g. before initial schema migration)
    console.warn('[Database Schema Warning] Could not verify avatar_url column:', err.message);
  }
}

// Health check / connection test
export async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    await ensureSchemaCompatibility();
    return { ok: true, message: 'Database connection verified successfully.' };
  } catch (error) {
    return {
      ok: false,
      message: error.message,
      code: error.code,
      suggestion: 'Please verify that MySQL is running on localhost:3306 and DB_PASSWORD is set in backend/.env.',
    };
  }
}

export default {
  pool,
  query,
  withTransaction,
  checkDatabaseConnection,
};
