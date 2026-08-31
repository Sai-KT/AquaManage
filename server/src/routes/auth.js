import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// POST /api/auth/login (Admin / Maintenance)
router.post('/login', (req, res) => {
  const { role, username, password } = req.body;
  if (!role || !username || !password) {
    return res.status(400).json({ success: false, error: 'Username, password and role are required.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  try {
    const user = db.prepare(`
      SELECT id, username, name, role FROM users
      WHERE LOWER(username) = ? AND password = ? AND role = ?
    `).get(cleanUser, cleanPass, role);

    if (user) {
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Please check your username and password.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error during authentication.' });
  }
});

// POST /api/auth/student-login
router.post('/student-login', (req, res) => {
  const { name, irnNo } = req.body;
  const cleanName = (name || '').trim();
  const cleanIrn = (irnNo || '').trim();

  const studentUser = {
    id: `stud-${Date.now()}`,
    name: cleanName || 'Student',
    irnNo: cleanIrn,
    role: 'student',
    username: cleanName || 'Student',
  };

  // Upsert into users table if name is provided
  try {
    const existing = db.prepare('SELECT id, name FROM users WHERE role = ? AND (irn_no = ? OR username = ?)').get('student', cleanIrn, cleanName);
    if (!existing && cleanName) {
      db.prepare(`
        INSERT INTO users (id, username, password, name, role, irn_no)
        VALUES (?, ?, '', ?, 'student', ?)
      `).run(studentUser.id, studentUser.username, studentUser.name, cleanIrn);
    }
  } catch (e) {
    // Non-fatal, return session
  }

  return res.json({
    success: true,
    user: studentUser,
  });
});

// GET /api/auth/users
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role FROM users').all();
  res.json({ success: true, users });
});

export default router;
