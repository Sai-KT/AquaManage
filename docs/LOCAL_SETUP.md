# AquaManage — Local Environment Setup & Run Guide

**Project:** College DTI (Design Thinking and Innovation) — Smart Campus Water Management  
**Stack:** React 19 (Vite) + Node.js Express API + MySQL Community Server  
**Target Architecture:** 100% Offline Local Operation  

---

## 1. System Prerequisites

1. **Node.js:** v18.0.0+ or v20.0.0+ (verify with `node -v`)
2. **npm:** v9.0.0+ (verify with `npm -v`)
3. **MySQL Server:** MySQL 8.0+ Community Server (running on `localhost:3306`)
4. **MySQL Workbench** (recommended for database inspection during presentation)

---

## 2. Step-by-Step Installation

### Step 1: Clone & Switch to Feature Branch
```bash
git checkout feature/local-fullstack-dti
```

### Step 2: Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

---

## 3. Database Configuration

### Step 3: Configure `backend/.env`
Open `backend/.env` (or copy from `backend/.env.example`) and supply your local MySQL root password:

```env
PORT=4000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD_HERE
DB_NAME=aqua_manage_local

SESSION_SECRET=aquamanage_local_dev_secret_2026
FRONTEND_ORIGIN=http://localhost:5173
```

> **Note:** If your local MySQL root user has no password, leave `DB_PASSWORD=` empty.

---

## 4. Database Initialization & Seeding

Run these scripts from the repository root:

### Step 4A: Create Database Schema
```bash
npm run db:schema
```
*Expected Output:*
```
✓ Connected to MySQL server at 127.0.0.1:3306 as user "root".
✓ Database "aqua_manage_local" and all 7 tables created / verified successfully.
```

### Step 4B: Seed Demonstration Data
```bash
npm run db:seed
```
*Expected Output:*
```
✓ Connected to MySQL database "aqua_manage_local".
→ Seeding local users with bcrypt hashes...
✓ 8 user accounts synchronized.
→ Seeding campus water tanks...
✓ 4 tanks seeded.
→ Seeding initial demonstration leak reports...
✓ 8 leak reports seeded.
→ Seeding complaint audit history logs...
✓ 13 audit history events seeded.
→ Seeding 14-day zone-wise water consumption history...
✓ 14 days of water usage records populated for 5 zones.
✓ Initial system alerts seeded.
── Database Seeding Completed Successfully! ──
```

### Step 4C: Verify Database Records
```bash
npm run db:verify
```
Displays live ASCII tables showing all seeded users, complaint counts, and tank records.

---

## 5. Running the Application

### Option A: Unified Startup (Recommended)
From the project root:
```bash
npm run dev:all
```
This concurrently starts:
- **Express Backend:** [http://localhost:4000](http://localhost:4000)
- **Vite React Frontend:** [http://localhost:5173](http://localhost:5173)

### Option B: Separate Terminals
**Terminal 1 (Backend Server):**
```bash
npm run dev:backend
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev
```

---

## 6. Accessing the Application

Open your browser to:
[http://localhost:5173](http://localhost:5173)

### Demonstration Login Accounts

| Role | Username / ID | Password | Portal URL |
| :--- | :--- | :--- | :--- |
| **Administrator** | `director@iiit.ac.in` | `Director@99` | [http://localhost:5173/login/admin](http://localhost:5173/login/admin) |
| **Administrator (HoD)** | `hod@iiit.ac.in` | `HoD@Admin2024` | [http://localhost:5173/login/admin](http://localhost:5173/login/admin) |
| **Maintenance Staff** | `EMP-01` | `Maint@1234` | [http://localhost:5173/login/maintenance](http://localhost:5173/login/maintenance) |
| **Maintenance Staff** | `EMP-02` | `Maint@1234` | [http://localhost:5173/login/maintenance](http://localhost:5173/login/maintenance) |
| **Student** | Any Name (e.g. `Arjun Mehta`) | IRN `STU-2024-001` | [http://localhost:5173/login/student](http://localhost:5173/login/student) |

---

## 7. Running Backend Integration Tests

Verify all routes, authentication, and database transactions:
```bash
npm run test:backend
```

---

## 8. Troubleshooting & Common Issues

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **ER_ACCESS_DENIED_ERROR** | Incorrect MySQL root password | Update `DB_PASSWORD` in `backend/.env` with your actual MySQL password. |
| **ECONNREFUSED 127.0.0.1:3306** | MySQL server is stopped | On macOS: `brew services start mysql`<br>On Ubuntu: `sudo systemctl start mysql`<br>On Windows: Start MySQL in Services panel or XAMPP. |
| **Port 4000 already in use** | Another process is using port 4000 | Kill process: `lsof -ti :4000 \| xargs kill -9` or change `PORT=4001` in `backend/.env`. |
| **Port 5173 already in use** | Previous Vite instance running | Vite will automatically switch to port `5174`. |
| **Images not loading** | Local upload directory missing | Ensure `backend/uploads/` exists with write permissions. |
