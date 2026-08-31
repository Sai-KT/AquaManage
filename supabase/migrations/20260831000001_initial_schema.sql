-- ═══════════════════════════════════════════════════════════════════════════
-- AquaManage — Initial PostgreSQL Schema Migration
-- Compatible with Supabase PostgreSQL 15+
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. Custom Enum Types ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'maintenance', 'student');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tank_status AS ENUM ('good', 'warning', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'in_progress', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('critical', 'warning', 'info');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. Helper Trigger: Updated At Timestamp ─────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 4. Table: profiles (Extended user details linked to auth.users) ──────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  identifier_no TEXT, -- IRN for students, Employee ID (e.g. EMP-01) for maintenance
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_identifier ON public.profiles(identifier_no);

CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ── 5. Table: campus_zones (Campus Buildings & Geographic Boundaries) ─────────
CREATE TABLE IF NOT EXISTS public.campus_zones (
  id TEXT PRIMARY KEY, -- 'academic', 'ppcrc', 'mithila', 'vikramshila', 'canteen', 'garden'
  name TEXT NOT NULL,
  floors INT NOT NULL DEFAULT 1 CHECK (floors >= 1),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  description TEXT,
  accent_color TEXT DEFAULT '#10b981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Table: tanks (Campus Water Tanks & Capacities) ────────────────────────
CREATE TABLE IF NOT EXISTS public.tanks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  zone_id TEXT REFERENCES public.campus_zones(id) ON DELETE SET NULL,
  capacity_litres INT NOT NULL CHECK (capacity_litres > 0),
  current_litres INT NOT NULL DEFAULT 0 CHECK (current_litres >= 0),
  status tank_status NOT NULL DEFAULT 'good',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function & Trigger to auto-compute tank status based on fill level
CREATE OR REPLACE FUNCTION compute_tank_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.capacity_litres > 0 THEN
    IF (NEW.current_litres::FLOAT / NEW.capacity_litres) < 0.30 THEN
      NEW.status := 'critical'::tank_status;
    ELSIF (NEW.current_litres::FLOAT / NEW.capacity_litres) < 0.60 THEN
      NEW.status := 'warning'::tank_status;
    ELSE
      NEW.status := 'good'::tank_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tanks_status
BEFORE INSERT OR UPDATE OF current_litres, capacity_litres ON public.tanks
FOR EACH ROW EXECUTE FUNCTION compute_tank_status();

CREATE TRIGGER trigger_tanks_updated_at
BEFORE UPDATE ON public.tanks
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ── 7. Table: leak_reports (Issue Tickets) ───────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS leak_ticket_seq START 1;

CREATE TABLE IF NOT EXISTS public.leak_reports (
  id TEXT PRIMARY KEY, -- LK-001, LK-002, etc.
  type TEXT NOT NULL,
  zone_id TEXT REFERENCES public.campus_zones(id) ON DELETE SET NULL,
  location_detail TEXT NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_name TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  priority report_priority NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  photo_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate ticket ID (LK-001) if not provided
CREATE OR REPLACE FUNCTION set_leak_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := 'LK-' || LPAD(nextval('leak_ticket_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_leak_ticket_id
BEFORE INSERT ON public.leak_reports
FOR EACH ROW EXECUTE FUNCTION set_leak_ticket_id();

CREATE TRIGGER trigger_leak_reports_updated_at
BEFORE UPDATE ON public.leak_reports
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE INDEX IF NOT EXISTS idx_leak_reports_status ON public.leak_reports(status);
CREATE INDEX IF NOT EXISTS idx_leak_reports_priority ON public.leak_reports(priority);
CREATE INDEX IF NOT EXISTS idx_leak_reports_zone ON public.leak_reports(zone_id);
CREATE INDEX IF NOT EXISTS idx_leak_reports_reporter ON public.leak_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_leak_reports_assigned ON public.leak_reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leak_reports_created ON public.leak_reports(created_at DESC);

-- ── 8. Table: work_logs (Maintenance Progress Timeline) ──────────────────────
CREATE TABLE IF NOT EXISTS public.work_logs (
  id SERIAL PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES public.leak_reports(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  technician_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_logs_report_id ON public.work_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_created ON public.work_logs(created_at ASC);

-- ── 9. Table: alerts (Real-Time System Notifications) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id SERIAL PRIMARY KEY,
  type alert_type NOT NULL DEFAULT 'info',
  icon TEXT NOT NULL DEFAULT 'AlertTriangle',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  target_role user_role, -- NULL = broadcast to all, otherwise filtered
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_read ON public.alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON public.alerts(created_at DESC);

-- ── 10. Table: water_usage_logs (Zone Consumption Analytics) ──────────────────
CREATE TABLE IF NOT EXISTS public.water_usage_logs (
  id SERIAL PRIMARY KEY,
  zone_id TEXT NOT NULL REFERENCES public.campus_zones(id) ON DELETE CASCADE,
  litres_consumed INT NOT NULL CHECK (litres_consumed >= 0),
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour_of_day INT CHECK (hour_of_day BETWEEN 0 AND 23),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_zone_date_hour UNIQUE (zone_id, record_date, hour_of_day)
);

CREATE INDEX IF NOT EXISTS idx_usage_zone_date ON public.water_usage_logs(zone_id, record_date DESC);

-- ── 11. Table: harvesting_logs (Rainwater Harvesting Metrics) ─────────────────
CREATE TABLE IF NOT EXISTS public.harvesting_logs (
  id SERIAL PRIMARY KEY,
  litres_collected INT NOT NULL CHECK (litres_collected >= 0),
  target_litres INT NOT NULL DEFAULT 10000 CHECK (target_litres > 0),
  record_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  efficiency_percentage INT DEFAULT 87 CHECK (efficiency_percentage BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_harvest_date ON public.harvesting_logs(record_date DESC);

-- ── 12. Trigger: Automatically Sync New Auth Users to Profiles Table ─────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, identifier_no)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
    NEW.raw_user_meta_data->>'identifier_no'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    identifier_no = COALESCE(EXCLUDED.identifier_no, profiles.identifier_no),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
