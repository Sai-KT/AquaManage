import fs from 'fs';
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
const isProduction = process.env.NODE_ENV === 'production';

// ── 0. Reverse Proxy Trust (Essential for Render HTTPS Cookies) ──────────────
app.set('trust proxy', 1);

// ── 1. Security & CORS ───────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  process.env.RENDER_EXTERNAL_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, curl, mobile apps, or local dev)
      if (!origin || allowedOrigins.includes(origin) || !isProduction) {
        return callback(null, true);
      }
      return callback(null, true);
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

const sessionSecret = process.env.SESSION_SECRET || 'aquamanage_local_dev_secret_2026';
if (isProduction && !process.env.SESSION_SECRET) {
  console.warn('[SECURITY WARNING] Running in production without a custom SESSION_SECRET!');
}

app.use(
  session({
    key: 'aquamanage_sid',
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Respect X-Forwarded-Proto from Render proxy
    cookie: {
      httpOnly: true,
      secure: isProduction, // Enforce HTTPS cookies in production
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
    service: isProduction ? 'AquaManage Cloud API' : 'AquaManage Local API',
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: isHealthy,
      name: process.env.DB_NAME || 'aqua_manage_local',
      host: process.env.DB_HOST || '127.0.0.1',
      ssl: Boolean(process.env.DB_SSL_CA_PATH || process.env.DB_SSL_CA),
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

// ── 7. 404 Route Handler for Unknown API Calls ──────────────────────────────
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint "${req.method} ${req.originalUrl}" not found.`,
  });
});

// ── 8. Production React Static Files & SPA Routing ──────────────────────────
const distDir = path.resolve(__dirname, '../../dist');
if (fs.existsSync(distDir)) {
  app.use(
    express.static(distDir, {
      maxAge: isProduction ? '1d' : 0,
      etag: true,
    })
  );

  // Client-side React Router fallback (supports refreshes on deep links)
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// ── 9. Error Handling ────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
