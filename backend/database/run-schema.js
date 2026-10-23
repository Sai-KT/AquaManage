import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runSchema() {
  console.log('── Running AquaManage MySQL Schema Migration ──');
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'aquamanage_app';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'aqua_manage_local';

  let connection;
  try {
    // Connect directly to the AquaManage database
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      multipleStatements: true,
    });
    console.log(`✓ Connected to MySQL server at ${host}:${port}/${database} as user "${user}".`);

    // Read schema.sql
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');

    // Remove any CREATE DATABASE statements to prevent permission issues for dedicated app users
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS\s+`?[a-zA-Z0-9_]+`?[^;]*;/gi, '-- database exists');

    // Execute schema
    await connection.query(sql);
    console.log(`✓ Database "${database}" and all 7 tables created / verified successfully.`);
  } catch (error) {
    console.error('✗ Schema migration failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('→ Access Denied! Please check DB_USER and DB_PASSWORD in backend/.env.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('→ Connection Refused! Please ensure MySQL server is running on port 3306.');
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runSchema();
