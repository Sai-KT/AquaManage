import app from './app.js';
import { checkDatabaseConnection, pool } from './config/database.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, async () => {
  const dbName = process.env.DB_NAME || 'aqua_manage_local';
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  AquaManage Backend running on http://${HOST}:${PORT}`);
  console.log(`  Health Check: http://${HOST}:${PORT}/api/health`);
  console.log('═══════════════════════════════════════════════════════════');

  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.ok) {
    console.log(`  [Database] Connected to MySQL: "${dbName}"`);
  } else {
    console.warn('  [Database Warning] MySQL connection failed:', dbStatus.message);
    console.warn('  [Action Required] Set DB_PASSWORD or DB_SSL_CA_PATH in environment if needed.');
  }
});

// Graceful Shutdown
function shutdown() {
  console.log('\nShutting down AquaManage backend server...');
  server.close(async () => {
    try {
      await pool.end();
      console.log('MySQL connection pool closed.');
    } catch {
      // ignore
    }
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
