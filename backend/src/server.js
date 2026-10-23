import app from './app.js';
import { checkDatabaseConnection, pool } from './config/database.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

const server = app.listen(PORT, async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  AquaManage Local Backend running on http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log('═══════════════════════════════════════════════════════════');

  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.ok) {
    console.log('  [Database] Connected to MySQL: "aqua_manage_local"');
  } else {
    console.warn('  [Database Warning] MySQL connection failed:', dbStatus.message);
    console.warn('  [Action Required] Set DB_PASSWORD in backend/.env if needed.');
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
