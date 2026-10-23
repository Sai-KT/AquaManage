import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyDatabase() {
  console.log('── Running AquaManage MySQL Verification Queries ──');
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'aquamanage_app';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'aqua_manage_local';

  let connection;
  try {
    connection = await mysql.createConnection({ host, port, user, password, database });
    console.log(`✓ Connected to ${database}\n`);

    // 1. Users
    console.log('▶ USERS & ROLES:');
    const [users] = await connection.query('SELECT id, full_name, role, email, student_id, employee_id FROM users ORDER BY role, id');
    console.table(users);

    // 2. Complaint counts
    console.log('\n▶ COMPLAINT COUNTS BY STATUS:');
    const [counts] = await connection.query('SELECT status, COUNT(*) AS total FROM leak_reports GROUP BY status');
    console.table(counts);

    // 3. Complaints
    console.log('\n▶ COMPLAINTS LIST:');
    const [reports] = await connection.query('SELECT id, category, priority, status, reporter_name, assigned_name, zone_name FROM leak_reports ORDER BY created_at DESC');
    console.table(reports);

    // 4. Tanks
    console.log('\n▶ WATER TANKS:');
    const [tanks] = await connection.query('SELECT id, tank_name, capacity_liters, current_level_liters, status FROM tanks');
    console.table(tanks);

  } catch (error) {
    console.error('✗ Verification failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

verifyDatabase();
