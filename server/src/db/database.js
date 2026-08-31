import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'aquamanage.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// ── Initialize Database Schema ──────────────────────────────────────────────
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'maintenance', 'student')),
      irn_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tanks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      building TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      current INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('good', 'warning', 'critical')),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leak_reports (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      zone TEXT NOT NULL,
      reporter TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'resolved')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      description TEXT NOT NULL,
      assigned_to TEXT,
      photo_url TEXT,
      video_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS work_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES leak_reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('critical', 'warning', 'info')),
      icon TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      time_ago TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS zone_usage (
      zone TEXT PRIMARY KEY,
      daily INTEGER NOT NULL,
      weekly INTEGER NOT NULL,
      monthly INTEGER NOT NULL
    );
  `);

  // Seed default data if database is new
  seedInitialData();
  console.log(`✓ SQLite database initialized at ${dbPath}`);
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('Seeding initial campus data...');

    // 1. Seed Users
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run('usr-admin-1', 'director@iiit.ac.in', 'Director@99', 'Prof. A. Kulkarni', 'admin');
    insertUser.run('usr-admin-2', 'hod@iiit.ac.in', 'HoD@Admin2024', 'Dr. R. Sharma', 'admin');
    insertUser.run('usr-maint-1', 'EMP-01', 'Maint@1234', 'Ram Kumar', 'maintenance');
    insertUser.run('usr-maint-2', 'EMP-02', 'Maint@1234', 'Suresh Babu', 'maintenance');
    insertUser.run('usr-maint-3', 'EMP-03', 'Maint@1234', 'Mohan Das', 'maintenance');

    // 2. Seed Tanks
    const insertTank = db.prepare(`
      INSERT INTO tanks (id, name, building, capacity, current, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertTank.run(1, 'Tank A — Academic Block', 'Academic Block', 50000, 38500, 'good');
    insertTank.run(2, 'Tank B — Mithila Hostel', 'Mithila Hostel', 30000, 27800, 'good');
    insertTank.run(3, 'Tank C — PPCRC', 'PPCRC', 20000, 5200, 'critical');
    insertTank.run(4, 'Tank D — Vikramshila Hostel', 'Vikramshila Hostel', 15000, 11200, 'warning');

    // 3. Seed Leak Reports
    const insertReport = db.prepare(`
      INSERT INTO leak_reports (id, type, location, zone, reporter, date, status, priority, description, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertReport.run('LK-001', 'Pipe Leak', 'Academic Block — Ground Floor Washroom', 'Academic Block', 'Arjun Mehta', '2026-07-27', 'in_progress', 'high', 'Water dripping from overhead pipe near washroom entrance. Flooring is wet and slippery.', 'Ram Kumar');
    insertReport.run('LK-002', 'Tap Wastage', 'Mithila Hostel — Block B, Room 204', 'Mithila Hostel', 'Priya Singh', '2026-07-26', 'pending', 'medium', 'Tap not closing fully — continuous drip in the washroom.', null);
    insertReport.run('LK-003', 'Pipe Burst', 'PPCRC — 2nd Floor Lab Corridor', 'PPCRC', 'Dr. S. Rao', '2026-07-26', 'in_progress', 'critical', 'Major pipe burst near sink area in the research lab. Large water pooling.', 'Suresh Babu');
    insertReport.run('LK-004', 'Overflow', 'Tank C — PPCRC Rooftop', 'PPCRC', 'System Alert', '2026-07-25', 'resolved', 'high', 'Automatic overflow sensor triggered on PPCRC rooftop tank.', 'Ram Kumar');
    insertReport.run('LK-005', 'Tap Wastage', 'Canteen — Kitchen Sink Area', 'Canteen', 'Rajesh V.', '2026-07-25', 'resolved', 'low', 'Dishwashing tap left running overnight causing significant wastage.', 'Mohan Das');
    insertReport.run('LK-006', 'Pipe Leak', 'Academic Block — 3rd Floor, near Water Cooler', 'Academic Block', 'Kavitha R.', '2026-07-24', 'pending', 'medium', 'Slow drip from pipe joint behind the water cooler on 3rd floor.', null);
    insertReport.run('LK-007', 'Tap Wastage', 'Vikramshila Hostel — Common Washroom, Floor 1', 'Vikramshila Hostel', 'Security Guard', '2026-07-24', 'in_progress', 'low', 'Multiple taps found running in common washroom. Waste ongoing.', 'Suresh Babu');
    insertReport.run('LK-008', 'Pipe Leak', 'PPCRC — Ground Floor Corridor', 'PPCRC', 'Nisha Patel', '2026-07-23', 'resolved', 'medium', 'Leak from overhead pipe in the ground floor corridor near entrance.', 'Mohan Das');

    // 4. Seed Work Logs
    const insertLog = db.prepare(`INSERT INTO work_logs (report_id, note) VALUES (?, ?)`);
    insertLog.run('LK-001', 'Inspected leak source — pipe joint above false ceiling.');
    insertLog.run('LK-001', 'Temporary patch applied. Permanent seal scheduled.');
    insertLog.run('LK-003', 'Shut off main water valve to PPCRC 2nd floor lab section.');

    // 5. Seed Alerts
    const insertAlert = db.prepare(`
      INSERT INTO alerts (id, type, icon, title, message, time_ago, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAlert.run(1, 'critical', 'AlertTriangle', 'Tank C Level Critical — PPCRC', 'PPCRC Tank at 26% capacity. Refill required immediately.', '10 min ago', 0);
    insertAlert.run(2, 'warning', 'Droplets', 'Unusual Usage Spike — Mithila Hostel', 'Mithila Hostel zone usage is 34% above average for this time of day.', '42 min ago', 0);
    insertAlert.run(3, 'warning', 'AlertCircle', 'New Critical Report: LK-003', 'Pipe burst reported in PPCRC 2nd Floor. Assigned to Suresh Babu.', '1 hr ago', 0);
    insertAlert.run(4, 'info', 'CloudRain', 'Harvesting Target Exceeded', 'Today\'s rainwater collection exceeded target by 24%. Great performance!', '3 hrs ago', 1);
    insertAlert.run(5, 'info', 'CheckCircle', 'Issue LK-004 Resolved', 'PPCRC overflow issue resolved by Ram Kumar.', '5 hrs ago', 1);
    insertAlert.run(6, 'warning', 'Thermometer', 'High Consumption — PPCRC Labs', 'PPCRC zone consumption 22% above weekly average.', '1 day ago', 1);

    // 6. Seed Zone Usage
    const insertUsage = db.prepare(`INSERT INTO zone_usage (zone, daily, weekly, monthly) VALUES (?, ?, ?, ?)`);
    insertUsage.run('Academic Block', 8500, 59500, 255000);
    insertUsage.run('PPCRC', 6200, 43400, 186200);
    insertUsage.run('Mithila Hostel', 18200, 127400, 546000);
    insertUsage.run('Vikramshila Hostel', 22800, 159600, 684000);
    insertUsage.run('Canteen', 3800, 26600, 114000);
  }
}

export default db;
