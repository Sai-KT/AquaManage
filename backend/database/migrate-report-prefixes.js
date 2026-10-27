import { pool } from '../src/config/database.js';

export function getReportTypePrefix(type) {
  if (!type || typeof type !== 'string') return 'LK';
  const clean = type.trim().toLowerCase();
  if (clean.includes('burst')) return 'PB';       // Pipe Burst -> PB
  if (clean.includes('overflow')) return 'OF';    // Overflow -> OF
  if (clean.includes('tap') || clean.includes('wastage')) return 'TW'; // Tap Wastage -> TW
  if (clean.includes('sprinkler')) return 'SF';   // Sprinkler Fault -> SF
  if (clean.includes('drain') || clean.includes('blocked')) return 'BD'; // Blocked Drain -> BD
  if (clean.includes('other')) return 'OT';       // Other -> OT
  if (clean.includes('leak')) return 'LK';        // Pipe Leak -> LK
  
  const words = type.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return type.trim().slice(0, 2).toUpperCase() || 'LK';
}

async function runMigration() {
  console.log('--- Migrating Non-Leak Report IDs to Unique Dedicated Prefixes ---');
  const conn = await pool.getConnection();
  try {
    const [reports] = await conn.query('SELECT id, category, reporter_name, created_at FROM leak_reports ORDER BY created_at ASC, id ASC');
    
    const prefixCounters = {};
    const updates = [];

    // First scan existing reports that already have dedicated prefixes to know their highest numbers
    for (const r of reports) {
      const currentPrefix = r.id.split('-')[0];
      const match = r.id.match(/^[A-Z]+-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        prefixCounters[currentPrefix] = Math.max(prefixCounters[currentPrefix] || 0, num);
      }
    }

    // Now identify reports whose current ID does not start with their category's designated prefix
    const nonLeakCounters = {};
    for (const r of reports) {
      const targetPrefix = getReportTypePrefix(r.category);
      if (!r.id.startsWith(`${targetPrefix}-`)) {
        nonLeakCounters[targetPrefix] = (nonLeakCounters[targetPrefix] || 0) + 1;
        const newId = `${targetPrefix}-${String(nonLeakCounters[targetPrefix]).padStart(3, '0')}`;
        updates.push({
          oldId: r.id,
          newId,
          category: r.category,
          reporter: r.reporter_name,
        });
      }
    }

    console.log(`Found ${updates.length} non-leak reports to migrate to unique prefixes:`);
    console.table(updates);

    if (updates.length === 0) {
      console.log('All reports already match their dedicated type prefixes!');
      return;
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.beginTransaction();

    for (const u of updates) {
      // 1. Update leak_reports
      await conn.query(
        'UPDATE leak_reports SET id = ?, report_reference = ? WHERE id = ?',
        [u.newId, `REF-2026-${u.newId}`, u.oldId]
      );

      // 2. Update report_history
      await conn.query(
        'UPDATE report_history SET report_id = ? WHERE report_id = ?',
        [u.newId, u.oldId]
      );

      // 3. Update alerts
      await conn.query(
        'UPDATE alerts SET title = REPLACE(title, ?, ?), message = REPLACE(message, ?, ?)',
        [u.oldId, u.newId, u.oldId, u.newId]
      );
    }

    await conn.commit();
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Successfully migrated non-leak reports, histories, and alerts to unique type prefixes!');
  } catch (err) {
    await conn.rollback();
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

runMigration();
