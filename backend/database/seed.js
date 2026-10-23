import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BCRYPT_SALT_ROUNDS = 10;

// Standard demo passwords (securely hashed upon seeding)
const DEMO_PASSWORDS = {
  admin: 'Director@99',
  hod: 'HoD@Admin2024',
  maintenance: 'Maint@1234',
  student: 'Student@123',
};

async function seedDatabase() {
  console.log('── Seeding AquaManage Demonstration Data ──');
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
    console.log(`✓ Connected to MySQL database "${database}".`);

    // ── 1. Seed Users ────────────────────────────────────────────────────────
    console.log('→ Seeding local users with bcrypt hashes...');
    const hashedAdminPwd = await bcrypt.hash(DEMO_PASSWORDS.admin, BCRYPT_SALT_ROUNDS);
    const hashedHodPwd = await bcrypt.hash(DEMO_PASSWORDS.hod, BCRYPT_SALT_ROUNDS);
    const hashedMaintPwd = await bcrypt.hash(DEMO_PASSWORDS.maintenance, BCRYPT_SALT_ROUNDS);
    const hashedStudentPwd = await bcrypt.hash(DEMO_PASSWORDS.student, BCRYPT_SALT_ROUNDS);

    const usersToSeed = [
      // Admins
      { full_name: 'Prof. A. Kulkarni', email: 'director@iiit.ac.in', student_id: null, employee_id: 'DIR-01', password_hash: hashedAdminPwd, role: 'admin' },
      { full_name: 'Dr. R. Sharma', email: 'hod@iiit.ac.in', student_id: null, employee_id: 'HOD-01', password_hash: hashedHodPwd, role: 'admin' },
      // Maintenance Staff
      { full_name: 'Ram Kumar', email: 'ram.kumar@staff.iiit.ac.in', student_id: null, employee_id: 'EMP-01', password_hash: hashedMaintPwd, role: 'maintenance' },
      { full_name: 'Suresh Babu', email: 'suresh.babu@staff.iiit.ac.in', student_id: null, employee_id: 'EMP-02', password_hash: hashedMaintPwd, role: 'maintenance' },
      { full_name: 'Mohan Das', email: 'mohan.das@staff.iiit.ac.in', student_id: null, employee_id: 'EMP-03', password_hash: hashedMaintPwd, role: 'maintenance' },
      // Students
      { full_name: 'Arjun Mehta', email: 'arjun@student.iiit.ac.in', student_id: 'STU-2024-001', employee_id: null, password_hash: hashedStudentPwd, role: 'student' },
      { full_name: 'Priya Singh', email: 'priya@student.iiit.ac.in', student_id: 'STU-2024-002', employee_id: null, password_hash: hashedStudentPwd, role: 'student' },
      { full_name: 'Mrugmay', email: 'mrugmay@student.iiit.ac.in', student_id: 'IRN-101', employee_id: null, password_hash: hashedStudentPwd, role: 'student' },
    ];

    for (const u of usersToSeed) {
      await connection.query(
        `INSERT INTO users (full_name, email, student_id, employee_id, password_hash, role)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = VALUES(role)`,
        [u.full_name, u.email, u.student_id, u.employee_id, u.password_hash, u.role]
      );
    }
    console.log(`✓ ${usersToSeed.length} user accounts synchronized.`);

    // Fetch user IDs for foreign keys
    const [userRows] = await connection.query('SELECT id, full_name, email, student_id, employee_id FROM users');
    const userMap = {};
    for (const r of userRows) {
      if (r.email) userMap[r.email] = r;
      if (r.student_id) userMap[r.student_id] = r;
      if (r.employee_id) userMap[r.employee_id] = r;
    }

    // ── 2. Seed Tanks ────────────────────────────────────────────────────────
    console.log('→ Seeding campus water tanks...');
    const tanksToSeed = [
      { id: 1, tank_name: 'Tank A — Academic Block', location: 'Academic Block Rooftop', capacity_liters: 50000, current_level_liters: 38500, status: 'good', last_harvest_litres: 4200 },
      { id: 2, tank_name: 'Tank B — Mithila Hostel', location: 'Mithila Hostel Rooftop', capacity_liters: 30000, current_level_liters: 27800, status: 'good', last_harvest_litres: 3100 },
      { id: 3, tank_name: 'Tank C — PPCRC', location: 'PPCRC Rooftop', capacity_liters: 20000, current_level_liters: 5200, status: 'critical', last_harvest_litres: 1200 },
      { id: 4, tank_name: 'Tank D — Vikramshila Hostel', location: 'Vikramshila Hostel Rooftop', capacity_liters: 15000, current_level_liters: 11200, status: 'warning', last_harvest_litres: 2400 },
    ];

    for (const t of tanksToSeed) {
      await connection.query(
        `INSERT INTO tanks (id, tank_name, location, capacity_liters, current_level_liters, status, last_harvest_litres, data_source)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Demonstration Record')
         ON DUPLICATE KEY UPDATE
           tank_name = VALUES(tank_name),
           capacity_liters = VALUES(capacity_liters),
           current_level_liters = VALUES(current_level_liters),
           status = VALUES(status),
           last_harvest_litres = VALUES(last_harvest_litres)`,
        [t.id, t.tank_name, t.location, t.capacity_liters, t.current_level_liters, t.status, t.last_harvest_litres]
      );
    }
    console.log(`✓ ${tanksToSeed.length} tanks seeded.`);

    // ── 3. Seed Leak Reports (Optional Sample Fixtures) ─────────────────────
    const includeSampleReports = process.argv.includes('--with-sample-reports');

    if (includeSampleReports) {
      console.log('→ Seeding demonstration sample leak reports (--with-sample-reports passed)...');
      const student1 = userMap['STU-2024-001'];
      const student2 = userMap['STU-2024-002'];
      const emp1 = userMap['EMP-01']; // Ram Kumar
      const emp2 = userMap['EMP-02']; // Suresh Babu
      const emp3 = userMap['EMP-03']; // Mohan Das

    const reportsToSeed = [
      {
        id: 'LK-001',
        report_reference: 'REF-2026-001',
        student_id: student1?.id || null,
        reporter_name: 'Arjun Mehta',
        assigned_to: emp1?.id || null,
        assigned_name: 'Ram Kumar',
        location: 'Academic Block — Ground Floor Washroom',
        zone_name: 'Academic Block',
        description: 'Water dripping from overhead pipe near washroom entrance. Flooring is wet and slippery.',
        category: 'Pipe Leak',
        priority: 'high',
        status: 'in_progress',
        reported_at: '2026-10-20 09:30:00',
        assigned_at: '2026-10-20 10:15:00',
        resolved_at: null,
      },
      {
        id: 'LK-002',
        report_reference: 'REF-2026-002',
        student_id: student2?.id || null,
        reporter_name: 'Priya Singh',
        assigned_to: null,
        assigned_name: null,
        location: 'Mithila Hostel — Block B, Room 204',
        zone_name: 'Mithila Hostel',
        description: 'Tap not closing fully — continuous drip in the washroom.',
        category: 'Tap Wastage',
        priority: 'medium',
        status: 'reported',
        reported_at: '2026-10-21 11:20:00',
        assigned_at: null,
        resolved_at: null,
      },
      {
        id: 'LK-003',
        report_reference: 'REF-2026-003',
        student_id: student1?.id || null,
        reporter_name: 'Arjun Mehta',
        assigned_to: emp2?.id || null,
        assigned_name: 'Suresh Babu',
        location: 'PPCRC — 2nd Floor Lab Corridor',
        zone_name: 'PPCRC',
        description: 'Major pipe burst near sink area in the research lab. Large water pooling.',
        category: 'Pipe Burst',
        priority: 'critical',
        status: 'in_progress',
        reported_at: '2026-10-21 14:00:00',
        assigned_at: '2026-10-21 14:10:00',
        resolved_at: null,
      },
      {
        id: 'LK-004',
        report_reference: 'REF-2026-004',
        student_id: null,
        reporter_name: 'System Alert',
        assigned_to: emp1?.id || null,
        assigned_name: 'Ram Kumar',
        location: 'Tank C — PPCRC Rooftop',
        zone_name: 'PPCRC',
        description: 'Automatic overflow sensor triggered on PPCRC rooftop tank.',
        category: 'Overflow',
        priority: 'high',
        status: 'resolved',
        reported_at: '2026-10-18 08:00:00',
        assigned_at: '2026-10-18 08:30:00',
        resolved_at: '2026-10-18 11:45:00',
      },
      {
        id: 'LK-005',
        report_reference: 'REF-2026-005',
        student_id: student2?.id || null,
        reporter_name: 'Priya Singh',
        assigned_to: emp3?.id || null,
        assigned_name: 'Mohan Das',
        location: 'Canteen — Kitchen Sink Area',
        zone_name: 'Canteen',
        description: 'Dishwashing tap left running overnight causing significant wastage.',
        category: 'Tap Wastage',
        priority: 'low',
        status: 'resolved',
        reported_at: '2026-10-17 10:00:00',
        assigned_at: '2026-10-17 10:20:00',
        resolved_at: '2026-10-17 12:15:00',
      },
      {
        id: 'LK-006',
        report_reference: 'REF-2026-006',
        student_id: student1?.id || null,
        reporter_name: 'Arjun Mehta',
        assigned_to: null,
        assigned_name: null,
        location: 'Academic Block — 3rd Floor, near Water Cooler',
        zone_name: 'Academic Block',
        description: 'Slow drip from pipe joint behind the water cooler on 3rd floor.',
        category: 'Pipe Leak',
        priority: 'medium',
        status: 'reported',
        reported_at: '2026-10-22 16:30:00',
        assigned_at: null,
        resolved_at: null,
      },
      {
        id: 'LK-007',
        report_reference: 'REF-2026-007',
        student_id: null,
        reporter_name: 'Security Guard',
        assigned_to: emp2?.id || null,
        assigned_name: 'Suresh Babu',
        location: 'Vikramshila Hostel — Common Washroom, Floor 1',
        zone_name: 'Vikramshila Hostel',
        description: 'Multiple taps found running in common washroom. Water wastage ongoing.',
        category: 'Tap Wastage',
        priority: 'low',
        status: 'in_progress',
        reported_at: '2026-10-22 09:15:00',
        assigned_at: '2026-10-22 10:00:00',
        resolved_at: null,
      },
      {
        id: 'LK-008',
        report_reference: 'REF-2026-008',
        student_id: student2?.id || null,
        reporter_name: 'Priya Singh',
        assigned_to: emp3?.id || null,
        assigned_name: 'Mohan Das',
        location: 'PPCRC — Ground Floor Corridor',
        zone_name: 'PPCRC',
        description: 'Leak from overhead pipe in ground floor corridor near entrance.',
        category: 'Pipe Leak',
        priority: 'medium',
        status: 'resolved',
        reported_at: '2026-10-16 14:00:00',
        assigned_at: '2026-10-16 15:00:00',
        resolved_at: '2026-10-17 09:30:00',
      },
    ];

    for (const r of reportsToSeed) {
      await connection.query(
        `INSERT INTO leak_reports (
           id, report_reference, student_id, reporter_name, assigned_to, assigned_name,
           location, zone_name, description, category, priority, status, reported_at, assigned_at, resolved_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           reporter_name = VALUES(reporter_name),
           assigned_to = VALUES(assigned_to),
           assigned_name = VALUES(assigned_name),
           status = VALUES(status),
           priority = VALUES(priority)`,
        [
          r.id, r.report_reference, r.student_id, r.reporter_name, r.assigned_to, r.assigned_name,
          r.location, r.zone_name, r.description, r.category, r.priority, r.status,
          r.reported_at, r.assigned_at, r.resolved_at
        ]
      );
    }
    console.log(`✓ ${reportsToSeed.length} leak reports seeded.`);

    // ── 4. Seed Report History ───────────────────────────────────────────────
    console.log('→ Seeding complaint audit history logs...');
    const historyLogs = [
      { report_id: 'LK-001', actor_name: 'Arjun Mehta', action: 'reported', previous_status: null, new_status: 'reported', notes: 'Complaint submitted by student.' },
      { report_id: 'LK-001', actor_name: 'Prof. A. Kulkarni', action: 'assigned', previous_status: 'reported', new_status: 'assigned', notes: 'Assigned to Ram Kumar (EMP-01)' },
      { report_id: 'LK-001', actor_name: 'Ram Kumar', action: 'status_update', previous_status: 'assigned', new_status: 'in_progress', notes: 'Inspected leak source — pipe joint above false ceiling. Temporary patch applied.' },

      { report_id: 'LK-002', actor_name: 'Priya Singh', action: 'reported', previous_status: null, new_status: 'reported', notes: 'Complaint submitted by student.' },

      { report_id: 'LK-003', actor_name: 'Arjun Mehta', action: 'reported', previous_status: null, new_status: 'reported', notes: 'Critical burst reported.' },
      { report_id: 'LK-003', actor_name: 'Prof. A. Kulkarni', action: 'assigned', previous_status: 'reported', new_status: 'assigned', notes: 'Assigned urgently to Suresh Babu' },
      { report_id: 'LK-003', actor_name: 'Suresh Babu', action: 'status_update', previous_status: 'assigned', new_status: 'in_progress', notes: 'Main isolation valve shut off to section. Replacement flange ordered.' },

      { report_id: 'LK-004', actor_name: 'System Alert', action: 'reported', previous_status: null, new_status: 'reported', notes: 'Automated overflow alert.' },
      { report_id: 'LK-004', actor_name: 'Prof. A. Kulkarni', action: 'assigned', previous_status: 'reported', new_status: 'assigned', notes: 'Assigned to Ram Kumar' },
      { report_id: 'LK-004', actor_name: 'Ram Kumar', action: 'resolved', previous_status: 'in_progress', new_status: 'resolved', notes: 'Overflow float valve adjusted and calibrated. Drainage cleared.' },

      { report_id: 'LK-005', actor_name: 'Priya Singh', action: 'reported', previous_status: null, new_status: 'reported', notes: 'Complaint submitted.' },
      { report_id: 'LK-005', actor_name: 'Prof. A. Kulkarni', action: 'assigned', previous_status: 'reported', new_status: 'assigned', notes: 'Assigned to Mohan Das' },
      { report_id: 'LK-005', actor_name: 'Mohan Das', action: 'resolved', previous_status: 'in_progress', new_status: 'resolved', notes: 'Tap washer replaced and tested. Zero leakage.' },
    ];

    // Clear existing history to avoid duplicated duplicate logs on re-seed
    await connection.query('DELETE FROM report_history WHERE report_id IN ("LK-001","LK-002","LK-003","LK-004","LK-005")');
    for (const h of historyLogs) {
      await connection.query(
        `INSERT INTO report_history (report_id, actor_name, action, previous_status, new_status, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [h.report_id, h.actor_name, h.action, h.previous_status, h.new_status, h.notes]
      );
    }
      console.log(`✓ ${historyLogs.length} audit history events seeded.`);
    } else {
      console.log('→ Clean state: Sample complaints omitted by default. (Run with --with-sample-reports to populate test complaints).');
    }

    // ── 5. Seed Water Usage Records ──────────────────────────────────────────
    console.log('→ Seeding 14-day zone-wise water consumption history...');
    await connection.query('DELETE FROM water_usage WHERE data_source = "Demonstration Record"');
    const zones = [
      { name: 'Academic Block', base: 8500 },
      { name: 'PPCRC', base: 6200 },
      { name: 'Mithila Hostel', base: 18200 },
      { name: 'Vikramshila Hostel', base: 22800 },
      { name: 'Canteen', base: 3800 },
    ];

    const today = new Date();
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      for (const z of zones) {
        // Deterministic daily variance (+/- 10%) so charts look realistic
        const varianceFactor = 1 + (((dayOffset * 7 + z.base) % 17) - 8) / 100;
        const dailyLitres = Math.round(z.base * varianceFactor);

        await connection.query(
          `INSERT INTO water_usage (usage_date, location, quantity_liters, data_source)
           VALUES (?, ?, ?, 'Demonstration Record')`,
          [dateStr, z.name, dailyLitres]
        );
      }
    }
    console.log('✓ 14 days of water usage records populated for 5 zones.');

    // ── 6. Seed Alerts ───────────────────────────────────────────────────────
    console.log('→ Seeding initial system alerts...');
    await connection.query('DELETE FROM alerts WHERE id <= 6');
    const alertsToSeed = [
      { id: 1, type: 'critical', icon: 'AlertTriangle', title: 'Tank C Level Critical — PPCRC', message: 'PPCRC Tank at 26% capacity. Refill required immediately.', is_read: false, target_role: 'admin' },
      { id: 2, type: 'warning', icon: 'Droplets', title: 'Unusual Usage Spike — Mithila Hostel', message: 'Mithila Hostel zone usage is 34% above average for this time of day.', is_read: false, target_role: 'admin' },
      { id: 4, type: 'info', icon: 'CloudRain', title: 'Harvesting Target Exceeded', message: "Today's rainwater collection exceeded target by 24%. Great performance!", is_read: true, target_role: 'all' },
      { id: 6, type: 'warning', icon: 'AlertTriangle', title: 'High Consumption — PPCRC Labs', message: 'PPCRC zone consumption 22% above weekly average.', is_read: true, target_role: 'admin' },
    ];

    if (includeSampleReports) {
      alertsToSeed.push(
        { id: 3, type: 'warning', icon: 'AlertCircle', title: 'New Critical Report: LK-003', message: 'Pipe burst reported in PPCRC 2nd Floor. Assigned to Suresh Babu.', is_read: false, target_role: 'maintenance' },
        { id: 5, type: 'info', icon: 'CheckCircle', title: 'Issue LK-004 Resolved', message: 'PPCRC overflow issue resolved by Ram Kumar.', is_read: true, target_role: 'all' }
      );
    }

    for (const a of alertsToSeed) {
      await connection.query(
        `INSERT INTO alerts (id, type, icon, title, message, is_read, target_role)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), message = VALUES(message), is_read = VALUES(is_read)`,
        [a.id, a.type, a.icon, a.title, a.message, a.is_read, a.target_role]
      );
    }
    console.log('✓ Initial system alerts seeded.');

    console.log('── Database Seeding Completed Successfully! ──');
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('→ Access Denied! Please check DB_PASSWORD in backend/.env.');
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seedDatabase();
