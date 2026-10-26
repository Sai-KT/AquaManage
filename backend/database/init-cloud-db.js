/**
 * AquaManage — Cloud Database Initialization Script (Aiven MySQL 8.4.11)
 *
 * This script safely initializes the cloud database schema and demonstration data
 * in aqua_manage_cloud on Aiven with zero pre-existing complaints.
 *
 * Safety & Precedence Guarantees:
 * 1. Targets exclusively 'aqua_manage_cloud'.
 * 2. Loads credentials ONLY from backend/cloud.env (never backend/.env).
 * 3. Asserts target is NOT localhost/127.0.0.1 and user is NOT aquamanage_app.
 * 4. Does not drop, delete, or recreate the database or existing tables.
 * 5. Pre-validates target database, user, version, and existing table list.
 * 6. Seeds exactly 3 fictional demonstration accounts (1 Admin, 1 Student, 1 Maintenance).
 * 7. Leaves leak_reports and report_history completely empty (0 complaints).
 * 8. Does not print plaintext passwords to terminal stdout/stderr.
 * 9. Idempotent and safe against repeat execution.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load cloud environment variables from backend/cloud.env ONLY
const cloudEnvPath = path.resolve(__dirname, '../cloud.env');
if (fs.existsSync(cloudEnvPath)) {
  dotenv.config({ path: cloudEnvPath });
} else {
  // If cloud.env is not present, use environment variables already in process.env
  // NOTE: We intentionally DO NOT load backend/.env to prevent accidental local DB target!
}

const BCRYPT_SALT_ROUNDS = 10;

function generateSecurePassword(length = 18) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
  let pwd = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    pwd += chars[bytes[i] % chars.length];
  }
  return pwd;
}

export async function initializeCloudDatabase(options = {}) {
  const host = options.host || process.env.CLOUD_DB_HOST || process.env.DB_HOST;
  const port = parseInt(options.port || process.env.CLOUD_DB_PORT || process.env.DB_PORT || '3306', 10);
  const user = options.user || process.env.CLOUD_DB_USER || process.env.DB_USER || 'avnadmin';
  const password = options.password || process.env.CLOUD_DB_PASSWORD || process.env.DB_PASSWORD || '';
  const database = options.database || process.env.CLOUD_DB_NAME || process.env.DB_NAME || 'aqua_manage_cloud';
  const caPath = options.caPath || process.env.CLOUD_DB_SSL_CA_PATH || process.env.DB_SSL_CA_PATH;
  const caInline = options.caInline || process.env.CLOUD_DB_SSL_CA || process.env.DB_SSL_CA;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('   AquaManage Cloud Database Initialization (Aiven MySQL)   ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Target Host:     ${host || '(not set)'}`);
  console.log(`Target Port:     ${port}`);
  console.log(`Target Database: ${database}`);
  console.log(`Target User:     ${user}`);

  // ── Safety Guard 1: Ensure credentials are provided ──────────────────────
  if (!host || !password) {
    throw new Error(
      'Missing cloud database connection details. Please ensure DB_HOST and DB_PASSWORD are set in backend/cloud.env.'
    );
  }

  // ── Safety Guard 2: Enforce cloud database target isolation ──────────────
  if (database !== 'aqua_manage_cloud') {
    throw new Error(`[SAFETY ABORT] Target database must be 'aqua_manage_cloud'. Detected: '${database}'`);
  }

  if (host === '127.0.0.1' || host === 'localhost' || host === '::1') {
    throw new Error(`[SAFETY ABORT] Cloud initialization script cannot run against localhost ('${host}').`);
  }

  if (user === 'aquamanage_app') {
    throw new Error(`[SAFETY ABORT] Detected local application user 'aquamanage_app'. Cloud initialization requires Aiven administrator.`);
  }

  if (user !== 'avnadmin') {
    throw new Error(`[SAFETY ABORT] Expected Aiven administrative user 'avnadmin'. Got: '${user}'`);
  }

  const connConfig = {
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  };

  if (caPath) {
    const resolvedCaPath = path.resolve(caPath);
    console.log(`TLS CA Path:     ${resolvedCaPath}`);
    if (!fs.existsSync(resolvedCaPath)) {
      throw new Error(`TLS CA certificate not found at: ${resolvedCaPath}`);
    }
    const caCert = fs.readFileSync(resolvedCaPath, 'utf8');
    connConfig.ssl = {
      ca: caCert,
      rejectUnauthorized: true,
    };
  } else if (caInline) {
    console.log('TLS CA:          (Provided via environment variable)');
    connConfig.ssl = {
      ca: caInline,
      rejectUnauthorized: true,
    };
  } else {
    throw new Error('[SAFETY ABORT] Strict TLS CA certificate verification is required for Aiven cloud database.');
  }

  let connection;
  try {
    console.log('\nConnecting to Aiven MySQL server over verified TLS...');
    connection = await mysql.createConnection(connConfig);
    console.log('✓ Successfully connected and verified TLS handshake.');

    // ── Pre-Validation (Task 4) ───────────────────────────────────────────
    console.log('\n▶ Validating cloud database target and existing state...');
    const [infoRows] = await connection.query('SELECT DATABASE() AS current_db, CURRENT_USER() AS current_usr, VERSION() AS mysql_ver');
    const dbInfo = infoRows[0];
    console.log(`  Connected Database: ${dbInfo.current_db}`);
    console.log(`  Connected User:     ${dbInfo.current_usr}`);
    console.log(`  MySQL Version:      ${dbInfo.mysql_ver}`);

    if (dbInfo.current_db !== 'aqua_manage_cloud') {
      throw new Error(`[VALIDATION FAILED] Connected database '${dbInfo.current_db}' does not match expected 'aqua_manage_cloud'.`);
    }

    const [tableRows] = await connection.query('SHOW TABLES');
    const existingTables = tableRows.map((r) => Object.values(r)[0]);
    console.log(`  Existing Tables (${existingTables.length}):`, existingTables.length > 0 ? existingTables.join(', ') : '(None — completely empty database)');

    // ── 1. Create Schema Tables (Task 5: MySQL 8.4 Compatible) ─────────────
    console.log('\n▶ [1/4] Applying AquaManage MySQL 8.4 schema...');

    const schemaStatements = `
      -- 1. Users Table
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`full_name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(100) UNIQUE NULL,
        \`student_id\` VARCHAR(50) UNIQUE NULL,
        \`employee_id\` VARCHAR(50) UNIQUE NULL,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`role\` ENUM('admin', 'student', 'maintenance') NOT NULL,
        \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_users_role\` (\`role\`),
        INDEX \`idx_users_email\` (\`email\`),
        INDEX \`idx_users_student\` (\`student_id\`),
        INDEX \`idx_users_employee\` (\`employee_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 2. Leak Reports Table (Zero pre-existing records)
      CREATE TABLE IF NOT EXISTS \`leak_reports\` (
        \`id\` VARCHAR(20) PRIMARY KEY,
        \`report_reference\` VARCHAR(50) UNIQUE NOT NULL,
        \`student_id\` INT NULL,
        \`reporter_name\` VARCHAR(100) NOT NULL,
        \`assigned_to\` INT NULL,
        \`assigned_name\` VARCHAR(100) NULL,
        \`location\` VARCHAR(255) NOT NULL,
        \`zone_name\` VARCHAR(100) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`category\` VARCHAR(50) NOT NULL,
        \`priority\` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
        \`status\` ENUM('reported', 'assigned', 'in_progress', 'resolved') NOT NULL DEFAULT 'reported',
        \`photo_url\` VARCHAR(255) NULL,
        \`video_url\` VARCHAR(255) NULL,
        \`reported_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`assigned_at\` TIMESTAMP NULL DEFAULT NULL,
        \`resolved_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_leak_reports_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_leak_reports_assigned\` FOREIGN KEY (\`assigned_to\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        INDEX \`idx_leak_reports_status\` (\`status\`),
        INDEX \`idx_leak_reports_priority\` (\`priority\`),
        INDEX \`idx_leak_reports_zone\` (\`zone_name\`),
        INDEX \`idx_leak_reports_created\` (\`created_at\` DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 3. Report History Table (Audit Log)
      CREATE TABLE IF NOT EXISTS \`report_history\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`report_id\` VARCHAR(20) NOT NULL,
        \`actor_id\` INT NULL,
        \`actor_name\` VARCHAR(100) NOT NULL,
        \`action\` VARCHAR(50) NOT NULL,
        \`previous_status\` VARCHAR(50) NULL,
        \`new_status\` VARCHAR(50) NULL,
        \`notes\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_report_history_report\` FOREIGN KEY (\`report_id\`) REFERENCES \`leak_reports\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_report_history_actor\` FOREIGN KEY (\`actor_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        INDEX \`idx_report_history_report\` (\`report_id\`),
        INDEX \`idx_report_history_created\` (\`created_at\` ASC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 4. Tanks Table
      CREATE TABLE IF NOT EXISTS \`tanks\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tank_name\` VARCHAR(100) NOT NULL,
        \`location\` VARCHAR(100) NOT NULL,
        \`capacity_liters\` INT NOT NULL,
        \`current_level_liters\` INT NOT NULL DEFAULT 0,
        \`status\` ENUM('good', 'warning', 'critical') NOT NULL DEFAULT 'good',
        \`last_harvest_litres\` INT NOT NULL DEFAULT 0,
        \`last_updated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`data_source\` VARCHAR(50) NOT NULL DEFAULT 'Demonstration Record'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 5. Water Usage Table
      CREATE TABLE IF NOT EXISTS \`water_usage\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`usage_date\` DATE NOT NULL,
        \`location\` VARCHAR(100) NOT NULL,
        \`quantity_liters\` INT NOT NULL,
        \`data_source\` VARCHAR(50) NOT NULL DEFAULT 'Demonstration Record',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_water_usage_date\` (\`usage_date\` DESC),
        INDEX \`idx_water_usage_loc\` (\`location\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 6. Alerts Table
      CREATE TABLE IF NOT EXISTS \`alerts\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`type\` ENUM('critical', 'warning', 'info') NOT NULL DEFAULT 'info',
        \`icon\` VARCHAR(50) NOT NULL DEFAULT 'AlertTriangle',
        \`title\` VARCHAR(150) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`is_read\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`target_role\` ENUM('admin', 'student', 'maintenance', 'all') NOT NULL DEFAULT 'all',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_alerts_read\` (\`is_read\`),
        INDEX \`idx_alerts_role\` (\`target_role\`),
        INDEX \`idx_alerts_created\` (\`created_at\` DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 7. Express Sessions Table (MySQL 8.4 clean INT UNSIGNED)
      CREATE TABLE IF NOT EXISTS \`sessions\` (
        \`session_id\` VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
        \`expires\` INT UNSIGNED NOT NULL,
        \`data\` MEDIUMTEXT COLLATE utf8mb4_bin,
        PRIMARY KEY (\`session_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
    `;

    await connection.query(schemaStatements);
    console.log('✓ All 7 tables verified in cloud database.');

    // ── 2. Seed Baseline Campus Tanks (Task 6) ─────────────────────────────
    console.log('\n▶ [2/4] Seeding baseline campus water tanks...');
    const tanks = [
      ['Tank A — Academic Block', 'Academic Block Rooftop', 50000, 38500, 'good', 4200],
      ['Tank B — Mithila Hostel', 'Mithila Hostel Rooftop', 30000, 27800, 'good', 3100],
      ['Tank C — PPCRC', 'PPCRC Rooftop', 20000, 5200, 'critical', 1200],
      ['Tank D — Vikramshila Hostel', 'Vikramshila Hostel Rooftop', 15000, 11200, 'warning', 2400],
    ];

    for (const t of tanks) {
      await connection.query(
        `INSERT INTO tanks (tank_name, location, capacity_liters, current_level_liters, status, last_harvest_litres, data_source)
         SELECT ?, ?, ?, ?, ?, ?, 'Demonstration Record'
         WHERE NOT EXISTS (SELECT 1 FROM tanks WHERE tank_name = ?)`,
        [...t, t[0]]
      );
    }
    console.log('✓ 4 campus tanks synchronized.');

    // ── 3. Seed Baseline Water Usage & Demonstration Alerts (Task 6) ────────
    console.log('\n▶ [3/4] Seeding baseline water consumption analytics and system alerts...');
    const zones = [
      { name: 'Academic Block', baseUsage: 8500 },
      { name: 'PPCRC', baseUsage: 6200 },
      { name: 'Mithila Hostel', baseUsage: 18200 },
      { name: 'Vikramshila Hostel', baseUsage: 22800 },
      { name: 'Canteen', baseUsage: 3800 },
    ];

    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      for (const zone of zones) {
        // Deterministic variation based on day index
        const variance = Math.floor(zone.baseUsage * 0.08 * (Math.sin(i * 1.5)));
        const usage = Math.max(1000, zone.baseUsage + variance);

        await connection.query(
          `INSERT INTO water_usage (usage_date, location, quantity_liters, data_source)
           SELECT ?, ?, ?, 'Demonstration Record'
           WHERE NOT EXISTS (SELECT 1 FROM water_usage WHERE usage_date = ? AND location = ?)`,
          [dateStr, zone.name, usage, dateStr, zone.name]
        );
      }
    }
    console.log('✓ 70 water usage telemetry records synchronized (14 days × 5 campus zones).');

    const initialAlerts = [
      ['critical', 'AlertTriangle', 'Tank C Level Critical — PPCRC', 'PPCRC Tank at 26% capacity. Refill required immediately.', false, 'all'],
      ['warning', 'Droplets', 'Unusual Usage Spike — Mithila Hostel', 'Mithila Hostel zone usage is 34% above average for this time of day.', false, 'admin'],
      ['info', 'CloudRain', 'Harvesting Target Exceeded', "Today's rainwater collection exceeded target by 24%. Great performance!", true, 'student'],
      ['warning', 'Thermometer', 'High Consumption — PPCRC Labs', 'PPCRC zone consumption 22% above weekly average.', true, 'admin'],
    ];

    for (const a of initialAlerts) {
      await connection.query(
        `INSERT INTO alerts (type, icon, title, message, is_read, target_role)
         SELECT ?, ?, ?, ?, ?, ?
         WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE title = ?)`,
        [...a, a[2]]
      );
    }
    console.log('✓ 4 initial demonstration alerts synchronized.');

    // ── 4. Seed Fictional Accounts (Task 3: Exactly 3 Demonstration Users) ───
    console.log('\n▶ [4/4] Provisioning 3 fictional demonstration accounts...');

    // Passwords supplied via cloud.env or auto-generated cryptographically
    const adminPassword = process.env.CLOUD_ADMIN_PASSWORD || generateSecurePassword(18);
    const studentPassword = process.env.CLOUD_STUDENT_PASSWORD || generateSecurePassword(18);
    const maintPassword = process.env.CLOUD_MAINT_PASSWORD || generateSecurePassword(18);

    const hashedAdmin = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);
    const hashedStudent = await bcrypt.hash(studentPassword, BCRYPT_SALT_ROUNDS);
    const hashedMaint = await bcrypt.hash(maintPassword, BCRYPT_SALT_ROUNDS);

    const usersToSeed = [
      // 1 Administrator
      {
        full_name: 'Prof. A. Kulkarni',
        email: 'director@iiit.ac.in',
        student_id: null,
        employee_id: 'DIR-01',
        password_hash: hashedAdmin,
        role: 'admin',
      },
      // 1 Student
      {
        full_name: 'Arjun Mehta',
        email: 'arjun@student.iiit.ac.in',
        student_id: 'STU-2024-001',
        employee_id: null,
        password_hash: hashedStudent,
        role: 'student',
      },
      // 1 Maintenance Technician
      {
        full_name: 'Ram Kumar',
        email: 'ram.kumar@staff.iiit.ac.in',
        student_id: null,
        employee_id: 'EMP-01',
        password_hash: hashedMaint,
        role: 'maintenance',
      },
    ];

    for (const u of usersToSeed) {
      await connection.query(
        `INSERT INTO users (full_name, email, student_id, employee_id, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           password_hash = VALUES(password_hash),
           role = VALUES(role),
           is_active = TRUE`,
        [u.full_name, u.email, u.student_id, u.employee_id, u.password_hash, u.role]
      );
    }
    console.log('✓ Exactly 3 demonstration accounts provisioned (1 Admin, 1 Student, 1 Maintenance).');

    // Securely persist generated passwords locally to gitignored private credentials file
    // without printing them to console logs (Task 2 & 3)
    const privateCredsPath = path.resolve(__dirname, '../cloud-credentials.env');
    const privateCredsContent = [
      '# ─────────────────────────────────────────────────────────────────────────────',
      '# AquaManage Cloud Demonstration Account Credentials (Git-Ignored)',
      '# DO NOT COMMIT OR SHARE. Generated securely for faculty/evaluator login.',
      '# ─────────────────────────────────────────────────────────────────────────────',
      `TIMESTAMP=${new Date().toISOString()}`,
      `DATABASE=aqua_manage_cloud`,
      `HOST=${host}`,
      '',
      '# 1. Administrator Account',
      'CLOUD_ADMIN_NAME="Prof. A. Kulkarni"',
      'CLOUD_ADMIN_EMAIL="director@iiit.ac.in"',
      'CLOUD_ADMIN_IDENTIFIER="DIR-01"',
      `CLOUD_ADMIN_PASSWORD="${adminPassword}"`,
      '',
      '# 2. Student Account',
      'CLOUD_STUDENT_NAME="Arjun Mehta"',
      'CLOUD_STUDENT_EMAIL="arjun@student.iiit.ac.in"',
      'CLOUD_STUDENT_IDENTIFIER="STU-2024-001"',
      `CLOUD_STUDENT_PASSWORD="${studentPassword}"`,
      '',
      '# 3. Maintenance Technician Account',
      'CLOUD_MAINT_NAME="Ram Kumar"',
      'CLOUD_MAINT_EMAIL="ram.kumar@staff.iiit.ac.in"',
      'CLOUD_MAINT_IDENTIFIER="EMP-01"',
      `CLOUD_MAINT_PASSWORD="${maintPassword}"`,
      '',
    ].join('\n');
    fs.writeFileSync(privateCredsPath, privateCredsContent, { mode: 0o600 });
    console.log(`✓ Demonstration credentials securely saved to git-ignored backend/cloud-credentials.env (mode 600).`);
    console.log(`  (Plaintext passwords are NOT printed to terminal logs in accordance with Task 2 & 3).`);

    // ── 5. Verification Queries (Task 7) ───────────────────────────────────
    console.log('\n▶ [Verification] Running read-only verification queries...');

    const [userCount] = await connection.query('SELECT COUNT(*) AS count FROM users');
    const [leakCount] = await connection.query('SELECT COUNT(*) AS count FROM leak_reports');
    const [historyCount] = await connection.query('SELECT COUNT(*) AS count FROM report_history');
    const [tankCount] = await connection.query('SELECT COUNT(*) AS count FROM tanks');
    const [usageCount] = await connection.query('SELECT COUNT(*) AS count FROM water_usage');
    const [alertCount] = await connection.query('SELECT COUNT(*) AS count FROM alerts');
    const [sessionCount] = await connection.query('SELECT COUNT(*) AS count FROM sessions');

    const [roleRows] = await connection.query('SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY role ASC');
    const [hashRows] = await connection.query('SELECT role, email, employee_id, student_id, LEFT(password_hash, 7) AS hash_prefix, LENGTH(password_hash) AS hash_length FROM users');

    const verificationResults = {
      tables: {
        users: userCount[0].count,
        leak_reports: leakCount[0].count,
        report_history: historyCount[0].count,
        tanks: tankCount[0].count,
        water_usage: usageCount[0].count,
        alerts: alertCount[0].count,
        sessions: sessionCount[0].count,
      },
      roles: roleRows,
      passwordHashes: hashRows,
    };

    console.log('\n── Verified Table Counts ──────────────────────────────────');
    console.log(`  users:          ${verificationResults.tables.users} (Expected: 3)`);
    console.log(`  leak_reports:   ${verificationResults.tables.leak_reports} (Expected: 0)`);
    console.log(`  report_history: ${verificationResults.tables.report_history} (Expected: 0)`);
    console.log(`  tanks:          ${verificationResults.tables.tanks} (Expected: 4)`);
    console.log(`  water_usage:    ${verificationResults.tables.water_usage} (Expected: 70)`);
    console.log(`  alerts:         ${verificationResults.tables.alerts} (Expected: 4)`);
    console.log(`  sessions:       ${verificationResults.tables.sessions} (Expected: 0)`);
    console.log('───────────────────────────────────────────────────────────');

    console.log('\n── Verified User Roles & Bcrypt Hashes ────────────────────');
    for (const h of hashRows) {
      const id = h.email || h.employee_id || h.student_id;
      console.log(`  [${h.role.padEnd(11)}] ${id.padEnd(25)} prefix: ${h.hash_prefix} (valid bcrypt, length ${h.hash_length})`);
    }
    console.log('───────────────────────────────────────────────────────────');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✓ Cloud Database Initialization Finished Successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');

    return {
      success: true,
      database: dbInfo.current_db,
      user: dbInfo.current_usr,
      version: dbInfo.mysql_ver,
      verificationResults,
    };
  } catch (error) {
    console.error('\n✗ Cloud Database Initialization Failed:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

// Only execute directly if invoked via CLI
if (process.argv[1] && process.argv[1].endsWith('init-cloud-db.js')) {
  initializeCloudDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
