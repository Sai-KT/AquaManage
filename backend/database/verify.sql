-- ─────────────────────────────────────────────────────────────────────────────
-- AquaManage — MySQL Database Verification Script
-- Use these queries in MySQL Workbench during faculty demonstration
-- ─────────────────────────────────────────────────────────────────────────────

USE aqua_manage_local;

-- 1. All Users & Roles (Without Password Hashes)
SELECT id, full_name, role, email, student_id, employee_id, is_active, created_at
FROM users
ORDER BY role, id;

-- 2. Total Complaint Counts by Status (Real Database Aggregation)
SELECT status, COUNT(*) AS count
FROM leak_reports
GROUP BY status;

-- 3. All Complaints with Ownership & Technician Assignment
SELECT
  r.id AS ticket_id,
  r.category AS issue_type,
  r.zone_name,
  r.location,
  r.priority,
  r.status,
  r.reporter_name,
  COALESCE(u_stu.student_id, 'DEMO') AS student_id,
  COALESCE(r.assigned_name, 'Unassigned') AS technician,
  r.reported_at,
  r.resolved_at
FROM leak_reports r
LEFT JOIN users u_stu ON r.student_id = u_stu.id
ORDER BY r.created_at DESC;

-- 4. Full Audit History for a Complaint (Lifecycle Demonstration)
SELECT
  h.id AS log_id,
  h.report_id,
  h.action,
  h.actor_name,
  h.previous_status,
  h.new_status,
  h.notes,
  h.created_at
FROM report_history h
ORDER BY h.report_id, h.created_at ASC;

-- 5. Campus Water Tank Telemetry Records (Demonstration Storage)
SELECT id, tank_name, location, capacity_liters, current_level_liters,
       ROUND((current_level_liters / capacity_liters) * 100, 1) AS fill_percentage,
       status, last_harvest_litres, data_source, last_updated
FROM tanks
ORDER BY id;

-- 6. Historical Water Consumption by Zone (Past 7 Days)
SELECT usage_date, location, quantity_liters, data_source
FROM water_usage
ORDER BY usage_date DESC, location ASC;

-- 7. Active Alerts & Notifications
SELECT id, type, title, message, is_read, target_role, created_at
FROM alerts
ORDER BY created_at DESC;
