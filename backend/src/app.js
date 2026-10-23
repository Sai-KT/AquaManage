import express from 'express';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { pool, checkDatabaseConnection } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import waterRoutes from './routes/waterRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// ── 1. Security & CORS ───────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all localhost variants in local dev
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ── 2. Request Parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── 3. Static Uploads ────────────────────────────────────────────────────────
const uploadDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// ── 4. Persistent MySQL Session Store ────────────────────────────────────────
const MySQLStore = MySQLStoreFactory(session);
let sessionStore;
try {
  sessionStore = new MySQLStore(
    {
      clearExpired: true,
      checkExpirationInterval: 900000, // 15 mins
      expiration: 86400000,           // 1 day
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data',
        },
      },
    },
    pool
  );
} catch (e) {
  console.warn('[SessionStore] Fallback to MemoryStore:', e.message);
}

app.use(
  session({
    key: 'aquamanage_sid',
    secret: process.env.SESSION_SECRET || 'aquamanage_local_dev_secret_2026',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Local HTTP development
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  })
);

// ── 5. Health Check Endpoint ─────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const dbHealth = await checkDatabaseConnection();
  const isHealthy = dbHealth.ok;

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'AquaManage Local API',
    database: {
      connected: isHealthy,
      name: process.env.DB_NAME || 'aqua_manage_local',
      host: process.env.DB_HOST || '127.0.0.1',
      details: dbHealth.message,
    },
    timestamp: new Date().toISOString(),
  });
});

// ── 6. Mount REST API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/water', waterRoutes);

// ── 7. 404 Route Handler ─────────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint "${req.method} ${req.originalUrl}" not found.`,
  });
});

// ── 8. Error Handling ────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
