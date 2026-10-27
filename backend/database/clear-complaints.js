import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function clearComplaints() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  AquaManage Local — Transactional Complaint Data Reset   ');
  console.log('═══════════════════════════════════════════════════════════\n');

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'aquamanage_app';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'aqua_manage_local';

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
    });
    console.log(`✓ Connected to MySQL database "${database}" as "${user}".\n`);

    // 1. Record counts before cleanup
    const [bReports] = await connection.query('SELECT COUNT(*) as c FROM leak_reports');
    const [bHistory] = await connection.query('SELECT COUNT(*) as c FROM report_history');
    const [bAlerts] = await connection.query(`
      SELECT COUNT(*) as c FROM alerts 
      WHERE title LIKE '%Report%' 
         OR title LIKE '%Ticket%' 
         OR title LIKE '%Issue %' 
         OR message REGEXP '[A-Z]{2}-[0-9]{3}'
    `);
    const [bUsers] = await connection.query('SELECT COUNT(*) as c FROM users');
    const [bTanks] = await connection.query('SELECT COUNT(*) as c FROM tanks');
    const [bUsage] = await connection.query('SELECT COUNT(*) as c FROM water_usage');

    console.log('── RECORD COUNTS BEFORE RESET ──');
    console.log('  • leak_reports         :', bReports[0].c);
    console.log('  • report_history       :', bHistory[0].c);
    console.log('  • report-related alerts:', bAlerts[0].c);
    console.log('  • users (PRESERVED)    :', bUsers[0].c);
    console.log('  • tanks (PRESERVED)    :', bTanks[0].c);
    console.log('  • water_usage (PRESERVED):', bUsage[0].c);
    console.log('');

    // 2. Transactional deletion
    await connection.beginTransaction();

    // A. Delete report-related alerts
    const [delAlerts] = await connection.query(`
      DELETE FROM alerts 
      WHERE title LIKE '%Report%' 
         OR title LIKE '%Ticket%' 
         OR title LIKE '%Issue %' 
         OR message REGEXP '[A-Z]{2}-[0-9]{3}'
    `);
    console.log(`  ✓ Removed ${delAlerts.affectedRows} complaint-related alerts.`);

    // B. Delete report history (child of leak_reports)
    const [delHistory] = await connection.query('DELETE FROM report_history');
    console.log(`  ✓ Removed ${delHistory.affectedRows} report history logs.`);

    // C. Delete leak reports
    const [delReports] = await connection.query('DELETE FROM leak_reports');
    console.log(`  ✓ Removed ${delReports.affectedRows} complaints from leak_reports.`);

    await connection.commit();
    console.log('\n✓ Transaction successfully committed.\n');

    // 3. Record counts after cleanup
    const [aReports] = await connection.query('SELECT COUNT(*) as c FROM leak_reports');
    const [aHistory] = await connection.query('SELECT COUNT(*) as c FROM report_history');
    const [aAlerts] = await connection.query('SELECT COUNT(*) as c FROM alerts');
    const [aUsers] = await connection.query('SELECT COUNT(*) as c FROM users');
    const [aTanks] = await connection.query('SELECT COUNT(*) as c FROM tanks');
    const [aUsage] = await connection.query('SELECT COUNT(*) as c FROM water_usage');

    console.log('── RECORD COUNTS AFTER RESET ──');
    console.log('  • leak_reports         :', aReports[0].c, '(EXPECTED: 0)');
    console.log('  • report_history       :', aHistory[0].c, '(EXPECTED: 0)');
    console.log('  • remaining alerts     :', aAlerts[0].c, '(General system alerts only)');
    console.log('  • users                :', aUsers[0].c, '(ALL PRESERVED)');
    console.log('  • tanks                :', aTanks[0].c, '(ALL PRESERVED)');
    console.log('  • water_usage          :', aUsage[0].c, '(ALL PRESERVED)');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    if (connection) {
      await connection.rollback();
      console.error('✗ Transaction rolled back due to error:', error.message);
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

clearComplaints();
