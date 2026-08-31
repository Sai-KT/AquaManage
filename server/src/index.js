import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import tankRoutes from './routes/tanks.js';
import harvestingRoutes from './routes/harvesting.js';
import usageRoutes from './routes/usage.js';
import alertRoutes from './routes/alerts.js';
import mapRoutes from './routes/map.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize SQLite database and tables
initDatabase();

// ── Middlewares ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded media files
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AquaManage Backend REST API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: 'SQLite (node:sqlite native)',
  });
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tanks', tankRoutes);
app.use('/api/harvesting', harvestingRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/map', mapRoutes);

// ── 404 & Global Error Handling ─────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `API route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('[ServerError]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  💧 AquaManage REST API Server
  ───────────────────────────────────────
  🌐 Local URL    : http://localhost:${PORT}
  📡 API Health   : http://localhost:${PORT}/api/health
  🗄️ Database     : SQLite File-Backed
  ───────────────────────────────────────
  `);
});

export default app;
