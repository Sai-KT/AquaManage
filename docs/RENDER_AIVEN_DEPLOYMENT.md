# AquaManage — Render & Aiven Cloud Deployment Guide

This guide details the complete production deployment procedure for **AquaManage**, hosting the unified React 19 + Node.js/Express application on **Render Free Web Service** connected to an **Aiven Free MySQL 8.4** cloud database over verified TLS.

---

## 1. Production Architecture Overview

AquaManage deploys as a **single unified web service** on Render:
- **Express Backend:** Serves the compiled production React static assets from `/dist`, provides the client-side SPA routing fallback, handles authenticated sessions, and exposes all `/api` endpoints on a single public HTTPS domain.
- **Aiven MySQL 8.4:** High-availability managed cloud database running MySQL 8.4.11 in `aqua_manage_cloud`, authenticated via TLS using the verified Aiven CA certificate.
- **Client Security:** HTTP-only, secure HTTPS session cookies with `trust proxy` enabled for Render reverse proxies.

```
┌─────────────────────────────────────────────────────────────┐
│                 Single Public HTTPS Domain                  │
│               https://aquamanage.onrender.com               │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────▼───────────────┐
               │    Render Free Web Service    │
               │   Node.js 20+ Express Server  │
               ├───────────────────────────────┤
               │ • Static React SPA (/dist)    │
               │ • React Router Deep Links     │
               │ • REST API Endpoints (/api/*) │
               │ • express-mysql-session Store │
               └───────────────┬───────────────┘
                               │
               ┌───────────────▼───────────────┐
               │       TLS 1.3 Handshake       │
               │  Strict CA Verification (SSL) │
               └───────────────┬───────────────┘
                               │
               ┌───────────────▼───────────────┐
               │       Aiven MySQL 8.4         │
               │     (aqua_manage_cloud)       │
               │  7 Tables • 0 Demo Complaints │
               └───────────────────────────────┘
```

---

## 2. Render Web Service Configuration

In your Render Dashboard, click **New +** > **Web Service**, connect your GitHub repository (`Sai-KT/AquaManage`), and specify:

| Setting | Value | Explanation |
| :--- | :--- | :--- |
| **Name** | `aquamanage` (or preferred name) | Determines your `*.onrender.com` URL |
| **Region** | Choose region closest to your Aiven MySQL (e.g. Frankfurt / Oregon) | Minimizes database query latency |
| **Branch** | `main` (or active production branch) | Branch to deploy |
| **Root Directory** | *(Leave blank)* | Uses root of repository |
| **Runtime** | `Node` | Native Node.js environment |
| **Build Command** | `npm run build:render` | Installs root & backend deps, compiles React Vite bundle |
| **Start Command** | `npm start` | Runs `node backend/src/server.js` bound to `0.0.0.0` |
| **Instance Type** | `Free` | $0/month |

---

## 3. Required Environment Variables on Render

In the **Environment** tab of your Render Web Service, add the following variables:

| Variable Name | Required | Example / Recommended Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations, secure cookies, and SPA serving |
| `PORT` | **Yes** | `10000` | Port automatically assigned by Render (Express binds to `0.0.0.0`) |
| `SESSION_SECRET` | **Yes** | *(Generate a 64-char random hex string)* | Signs session cookies securely |
| `DB_HOST` | **Yes** | `mysql-xxxx-xxxx.aivencloud.com` | Aiven MySQL Service URI hostname |
| `DB_PORT` | **Yes** | `12345` (Aiven assigned port) | Aiven MySQL external port |
| `DB_USER` | **Yes** | `avnadmin` | Initial database administrative user |
| `DB_PASSWORD` | **Yes** | *(Your private Aiven password)* | Dedicated Aiven account password |
| `DB_NAME` | **Yes** | `aqua_manage_cloud` | Target database name |
| `DB_SSL_CA_PATH` | **Yes** | `/etc/secrets/ca.pem` | Path to Aiven TLS CA cert (via Render Secret File) |
| `DB_CONNECTION_LIMIT`| No | `5` | Keeps connection pool within free-tier limits |
| `ALLOW_EPHEMERAL_UPLOADS`| No | `false` (default) | Set to `true` only if ephemeral media uploads are permitted |

---

## 4. Aiven TLS Certificate Configuration

Aiven MySQL requires strict TLS encryption. Render provides a **Secret Files** feature that mounts certificate files securely at runtime.

### Step-by-Step Certificate Setup on Render:
1. In your Render Web Service dashboard, navigate to **Environment** > **Secret Files**.
2. Click **Add Secret File**.
3. Set **Filename**: `ca.pem`.
4. Open the `ca.pem` certificate you downloaded from your Aiven Console on your local machine, copy its entire contents (beginning with `-----BEGIN CERTIFICATE-----` and ending with `-----END CERTIFICATE-----`), and paste it into the file contents box.
5. Save the file. Render mounts this secret at `/etc/secrets/ca.pem`.
6. Add the environment variable:
   ```env
   DB_SSL_CA_PATH=/etc/secrets/ca.pem
   ```
7. AquaManage's backend will read this certificate and enforce `rejectUnauthorized: true`.

> [!NOTE]
> Alternatively, if secret files cannot be used, you can provide the certificate string directly via the `DB_SSL_CA` environment variable.

---

## 5. Cloud Database Schema & Demonstration Account Initialization

Before your application serves live traffic, initialize the cloud database tables and accounts using the preconfigured initialization script.

### Option A: Initialize Locally via Dedicated Command (Recommended)
You can safely initialize `aqua_manage_cloud` from your local terminal using the downloaded Aiven credentials:

```bash
# Set your Aiven cloud credentials in your terminal session (never commit these!)
export DB_HOST="mysql-xxxx-xxxx.aivencloud.com"
export DB_PORT="12345"
export DB_USER="avnadmin"
export DB_PASSWORD="YourAivenPassword"
export DB_NAME="aqua_manage_cloud"
export DB_SSL_CA_PATH="/path/to/your/downloaded/ca.pem"

# Optional: set custom private demo passwords (otherwise strong passwords are generated automatically)
export CLOUD_ADMIN_PASSWORD="YourPrivateAdminPassword"
export CLOUD_MAINT_PASSWORD="YourPrivateMaintPassword"
export CLOUD_STUDENT_PASSWORD="YourPrivateStudentPassword"

# Execute the dedicated initialization workflow:
npm run db:init:cloud
```

### Option B: Initialize via Render One-Off Shell
1. In your Render Web Service, open the **Shell** tab.
2. Run:
   ```bash
   npm run db:init:cloud
   ```

### What this initialization script accomplishes:
- **Zero Pre-existing Complaints:** Ensures `leak_reports` and `report_history` start with **0** entries for a pristine faculty demonstration.
- **MySQL 8.4.11 Schema:** Creates all 7 application tables (`users`, `leak_reports`, `report_history`, `tanks`, `water_usage`, `alerts`, `sessions`) using MySQL 8.4 clean integer syntax and `utf8mb4_unicode_ci`.
- **Private Credentials:** Automatically seeds the faculty demonstration accounts (`director@iiit.ac.in`, `EMP-01`, `STU-2024-001`) with private passwords and bcrypt hashes.
- **Baseline Telemetry:** Populates 4 monitored campus tanks and 70 days of baseline water consumption telemetry.

---

## 6. Demonstration Credentials Reference

After running `npm run db:init:cloud`, the terminal outputs the exact provisioned passwords. Use these credentials during the faculty demonstration:

| Portal | Username / ID | Purpose |
| :--- | :--- | :--- |
| **Admin Portal** | `director@iiit.ac.in` | Full facilities overview, ticket assignment, and telemetry |
| **Maintenance Portal** | `EMP-01` | Field technician task queue, status updates, work log notes |
| **Student Portal** | `STU-2024-001` (Arjun Mehta) | Water issue reporting and tracking student submissions |

---

## 7. Free-Tier Limitations & Mitigations

### 1. Render Inactivity Spin-Down (Cold Starts)
- **Behavior:** Render free web services automatically spin down after **15 minutes** of inactivity.
- **Impact:** The very first request after spin-down may take **30 to 50 seconds** to wake up the service.
- **Demo Recommendation:** Visit the public URL 5 minutes prior to the faculty demonstration to ensure the service is warm and responsive.

### 2. Ephemeral Filesystem (Media Evidence)
- **Behavior:** The free Render container filesystem is temporary. Files written to local disk are wiped on redeployment or spin-down.
- **AquaManage Protection:** To prevent silent loss of complaint evidence, media uploads are explicitly disabled in cloud mode unless external object storage (e.g., Cloudinary or AWS S3) is plugged in. Text complaints, categorization, zone location, and assignment work completely without attachments.

### 3. Aiven MySQL 8.4 Connection Caps
- **Behavior:** Free-tier Aiven plans enforce maximum connection limits.
- **Mitigation:** AquaManage configures `connectionLimit: 5` and enables `waitForConnections: true` so the connection pool stays safely within database limits.

---

## 8. Verification & Troubleshooting

### Health Check Endpoint
Once deployed, verify backend and database status by accessing:
```
https://<your-render-app>.onrender.com/api/health
```
Expected healthy response:
```json
{
  "success": true,
  "status": "healthy",
  "service": "AquaManage Cloud API",
  "environment": "production",
  "database": {
    "connected": true,
    "name": "aqua_manage_cloud",
    "host": "mysql-xxxx-xxxx.aivencloud.com",
    "ssl": true,
    "details": "Database connection verified successfully."
  },
  "timestamp": "2026-10-24T04:30:00.000Z"
}
```

### Common Errors & Solutions

| Error | Cause | Resolution |
| :--- | :--- | :--- |
| **`UNABLE_TO_VERIFY_LEAF_SIGNATURE`** | Missing or incorrect Aiven CA certificate | Verify that `DB_SSL_CA_PATH` points to the valid Aiven `ca.pem` file mounted under `/etc/secrets/ca.pem`. |
| **`ER_ACCESS_DENIED_ERROR`** | Invalid MySQL credentials or host | Recheck `DB_USER` (`avnadmin`), `DB_PASSWORD`, and `DB_HOST` in Render Environment settings. |
| **`Cannot find module ...` during build** | Backend dependencies not installed | Use the unified build command `npm run build:render` which installs both root and backend dependencies. |
| **White screen on deep-link refresh (e.g. `/admin/dashboard`)** | SPA fallback missing | Verified in `app.js`: Express handles `app.get('*')` and sends `dist/index.html` for all client-side routes. |
| **Session resets on reload** | Cookies not marked secure or proxy untrusted | Verified in `app.js`: `app.set('trust proxy', 1)` and `secure: isProduction` are configured. |
