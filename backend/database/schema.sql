-- ─────────────────────────────────────────────────────────────────────────────
-- AquaManage Local MySQL Database Schema
-- Database: aqua_manage_local
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS `aqua_manage_local`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `aqua_manage_local`;

-- ── 1. Users Table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE NULL,
  `student_id` VARCHAR(50) UNIQUE NULL,
  `employee_id` VARCHAR(50) UNIQUE NULL,
  `department` VARCHAR(100) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'student', 'maintenance') NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_student` (`student_id`),
  INDEX `idx_users_employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Leak Reports Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `leak_reports` (
  `id` VARCHAR(20) PRIMARY KEY,
  `report_reference` VARCHAR(50) UNIQUE NOT NULL,
  `student_id` INT NULL,
  `reporter_name` VARCHAR(100) NOT NULL,
  `assigned_to` INT NULL,
  `assigned_name` VARCHAR(100) NULL,
  `location` VARCHAR(255) NOT NULL,
  `zone_name` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `priority` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `status` ENUM('reported', 'assigned', 'in_progress', 'resolved', 'reopened') NOT NULL DEFAULT 'reported',
  `photo_url` VARCHAR(255) NULL,
  `video_url` VARCHAR(255) NULL,
  `reported_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_at` TIMESTAMP NULL DEFAULT NULL,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_leak_reports_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leak_reports_assigned` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_leak_reports_status` (`status`),
  INDEX `idx_leak_reports_priority` (`priority`),
  INDEX `idx_leak_reports_zone` (`zone_name`),
  INDEX `idx_leak_reports_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Report History Table (Audit Log) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `report_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_id` VARCHAR(20) NOT NULL,
  `actor_id` INT NULL,
  `actor_name` VARCHAR(100) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `previous_status` VARCHAR(50) NULL,
  `new_status` VARCHAR(50) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_report_history_report` FOREIGN KEY (`report_id`) REFERENCES `leak_reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_history_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_report_history_report` (`report_id`),
  INDEX `idx_report_history_created` (`created_at` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Tanks Table (Infrastructure Monitoring) ──────────────────────────────
CREATE TABLE IF NOT EXISTS `tanks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tank_name` VARCHAR(100) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `capacity_liters` INT NOT NULL,
  `current_level_liters` INT NOT NULL DEFAULT 0,
  `status` ENUM('good', 'warning', 'critical') NOT NULL DEFAULT 'good',
  `last_harvest_litres` INT NOT NULL DEFAULT 0,
  `last_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `data_source` VARCHAR(50) NOT NULL DEFAULT 'Demonstration Record'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. Water Usage Table (Consumption Analytics) ─────────────────────────────
CREATE TABLE IF NOT EXISTS `water_usage` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usage_date` DATE NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `quantity_liters` INT NOT NULL,
  `data_source` VARCHAR(50) NOT NULL DEFAULT 'Demonstration Record',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_water_usage_date` (`usage_date` DESC),
  INDEX `idx_water_usage_loc` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. Alerts Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('critical', 'warning', 'info') NOT NULL DEFAULT 'info',
  `icon` VARCHAR(50) NOT NULL DEFAULT 'AlertTriangle',
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `target_role` ENUM('admin', 'student', 'maintenance', 'all') NOT NULL DEFAULT 'all',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_alerts_read` (`is_read`),
  INDEX `idx_alerts_role` (`target_role`),
  INDEX `idx_alerts_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. Sessions Table (Express Session Storage) ──────────────────────────────
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  `expires` INT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
