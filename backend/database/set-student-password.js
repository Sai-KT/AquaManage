/**
 * AquaManage — Configure / Reset Student Password Utility
 *
 * Usage:
 *   node backend/database/set-student-password.js <student_id> <new_password>
 *
 * Example:
 *   node backend/database/set-student-password.js STU-2024-002 Student@456
 */

import bcrypt from 'bcrypt';
import { query, pool } from '../src/config/database.js';

const BCRYPT_SALT_ROUNDS = 10;

async function setStudentPassword(studentId, newPassword) {
  if (!studentId || !newPassword) {
    console.error('Usage: node backend/database/set-student-password.js <student_id> <new_password>');
    process.exit(1);
  }

  const cleanStudentId = studentId.trim().toUpperCase();
  const cleanPassword = newPassword.trim();

  if (cleanPassword.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  try {
    const existing = await query(
      'SELECT id, full_name, student_id, role, is_active FROM users WHERE UPPER(student_id) = ? AND role = "student"',
      [cleanStudentId]
    );

    if (existing.length === 0) {
      console.error(`Student with ID "${cleanStudentId}" not found in database.`);
      process.exit(1);
    }

    const user = existing[0];
    const passwordHash = await bcrypt.hash(cleanPassword, BCRYPT_SALT_ROUNDS);

    await query(
      'UPDATE users SET password_hash = ?, is_active = TRUE WHERE id = ?',
      [passwordHash, user.id]
    );

    console.log(`✓ Password successfully updated for student:`);
    console.log(`  ID:         ${user.id}`);
    console.log(`  Name:       ${user.full_name}`);
    console.log(`  Student ID: ${user.student_id}`);
    console.log(`  Status:     Active`);
  } catch (err) {
    console.error('Failed to update student password:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const args = process.argv.slice(2);
if (args.length >= 2) {
  setStudentPassword(args[0], args[1]);
} else {
  // If run without arguments, ensure Priya Singh has distinct password Student@456
  setStudentPassword('STU-2024-002', 'Student@456');
}
