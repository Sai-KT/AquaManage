-- ═══════════════════════════════════════════════════════════════════════════
-- AquaManage — Complete Supabase PostgreSQL Schema & Seed Runner
-- Copy and run this script in the Supabase SQL Editor
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

-- ── 3. Helper Functions & Triggers ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 4. Table: profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  identifier_no TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade existing profiles table if it already existed in Supabase
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identifier_no TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_identifier ON public.profiles(identifier_no);

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ── 5. Table: campus_zones ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campus_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  floors INT NOT NULL DEFAULT 1 CHECK (floors >= 1),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  description TEXT,
  accent_color TEXT DEFAULT '#10b981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Table: tanks ──────────────────────────────────────────────────────────
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

DROP TRIGGER IF EXISTS trigger_tanks_status ON public.tanks;
CREATE TRIGGER trigger_tanks_status
BEFORE INSERT OR UPDATE OF current_litres, capacity_litres ON public.tanks
FOR EACH ROW EXECUTE FUNCTION compute_tank_status();

DROP TRIGGER IF EXISTS trigger_tanks_updated_at ON public.tanks;
CREATE TRIGGER trigger_tanks_updated_at
BEFORE UPDATE ON public.tanks
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ── 7. Table: leak_reports ───────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS leak_ticket_seq START 1;

CREATE TABLE IF NOT EXISTS public.leak_reports (
  id TEXT PRIMARY KEY,
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

CREATE OR REPLACE FUNCTION set_leak_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := 'LK-' || LPAD(nextval('leak_ticket_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leak_ticket_id ON public.leak_reports;
CREATE TRIGGER trigger_leak_ticket_id
BEFORE INSERT ON public.leak_reports
FOR EACH ROW EXECUTE FUNCTION set_leak_ticket_id();

DROP TRIGGER IF EXISTS trigger_leak_reports_updated_at ON public.leak_reports;
CREATE TRIGGER trigger_leak_reports_updated_at
BEFORE UPDATE ON public.leak_reports
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE INDEX IF NOT EXISTS idx_leak_reports_status ON public.leak_reports(status);
CREATE INDEX IF NOT EXISTS idx_leak_reports_priority ON public.leak_reports(priority);
CREATE INDEX IF NOT EXISTS idx_leak_reports_zone ON public.leak_reports(zone_id);
CREATE INDEX IF NOT EXISTS idx_leak_reports_reporter ON public.leak_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_leak_reports_assigned ON public.leak_reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leak_reports_created ON public.leak_reports(created_at DESC);

-- ── 8. Table: work_logs ──────────────────────────────────────────────────────
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

-- ── 9. Table: alerts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id SERIAL PRIMARY KEY,
  type alert_type NOT NULL DEFAULT 'info',
  icon TEXT NOT NULL DEFAULT 'AlertTriangle',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  target_role user_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_read ON public.alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON public.alerts(created_at DESC);

-- ── 10. Table: water_usage_logs ──────────────────────────────────────────────
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

-- ── 11. Table: harvesting_logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.harvesting_logs (
  id SERIAL PRIMARY KEY,
  litres_collected INT NOT NULL CHECK (litres_collected >= 0),
  target_litres INT NOT NULL DEFAULT 10000 CHECK (target_litres > 0),
  record_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  efficiency_percentage INT DEFAULT 87 CHECK (efficiency_percentage BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_harvest_date ON public.harvesting_logs(record_date DESC);

-- ── 12. Auth Sync Trigger ────────────────────────────────────────────────────
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

-- ── 13. Enable Row Level Security ───────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leak_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvesting_logs ENABLE ROW LEVEL SECURITY;

-- ── 14. Security Role Helpers ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'maintenance')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── 15. RLS Policies ────────────────────────────────────────────────────────
-- Profiles
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- Campus Zones
DROP POLICY IF EXISTS "Campus zones viewable by all authenticated users" ON public.campus_zones;
CREATE POLICY "Campus zones viewable by all authenticated users"
  ON public.campus_zones FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Campus zones manageable by admins only" ON public.campus_zones;
CREATE POLICY "Campus zones manageable by admins only"
  ON public.campus_zones FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Tanks
DROP POLICY IF EXISTS "Tanks viewable by all authenticated users" ON public.tanks;
CREATE POLICY "Tanks viewable by all authenticated users"
  ON public.tanks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can update tank telemetry and levels" ON public.tanks;
CREATE POLICY "Staff can update tank telemetry and levels"
  ON public.tanks FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Tanks insert and delete by admins only" ON public.tanks;
CREATE POLICY "Tanks insert and delete by admins only"
  ON public.tanks FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Tanks delete by admins only" ON public.tanks;
CREATE POLICY "Tanks delete by admins only"
  ON public.tanks FOR DELETE TO authenticated USING (public.is_admin());

-- Leak Reports
DROP POLICY IF EXISTS "Leak reports viewable by all authenticated users" ON public.leak_reports;
CREATE POLICY "Leak reports viewable by all authenticated users"
  ON public.leak_reports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can submit leak reports" ON public.leak_reports;
CREATE POLICY "Authenticated users can submit leak reports"
  ON public.leak_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id IS NULL OR reporter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Staff can update any leak report" ON public.leak_reports;
CREATE POLICY "Staff can update any leak report"
  ON public.leak_reports FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Students can update own pending reports" ON public.leak_reports;
CREATE POLICY "Students can update own pending reports"
  ON public.leak_reports FOR UPDATE TO authenticated
  USING (reporter_id = auth.uid() AND status = 'pending')
  WITH CHECK (reporter_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Admins can delete leak reports" ON public.leak_reports;
CREATE POLICY "Admins can delete leak reports"
  ON public.leak_reports FOR DELETE TO authenticated USING (public.is_admin());

-- Work Logs
DROP POLICY IF EXISTS "Work logs viewable by all authenticated users" ON public.work_logs;
CREATE POLICY "Work logs viewable by all authenticated users"
  ON public.work_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can insert work logs" ON public.work_logs;
CREATE POLICY "Staff can insert work logs"
  ON public.work_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND (technician_id IS NULL OR technician_id = auth.uid() OR public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage work logs" ON public.work_logs;
CREATE POLICY "Admins can manage work logs"
  ON public.work_logs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Alerts
DROP POLICY IF EXISTS "Alerts viewable by relevant roles or broadcasts" ON public.alerts;
CREATE POLICY "Alerts viewable by relevant roles or broadcasts"
  ON public.alerts FOR SELECT TO authenticated
  USING (target_role IS NULL OR target_role = public.current_user_role() OR public.is_admin());

DROP POLICY IF EXISTS "Users can mark alerts as read" ON public.alerts;
CREATE POLICY "Users can mark alerts as read"
  ON public.alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage alerts" ON public.alerts;
CREATE POLICY "Admins can manage alerts"
  ON public.alerts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Analytics Logs
DROP POLICY IF EXISTS "Water usage logs viewable by all authenticated users" ON public.water_usage_logs;
CREATE POLICY "Water usage logs viewable by all authenticated users"
  ON public.water_usage_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Water usage logs manageable by admins only" ON public.water_usage_logs;
CREATE POLICY "Water usage logs manageable by admins only"
  ON public.water_usage_logs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Harvesting logs viewable by all authenticated users" ON public.harvesting_logs;
CREATE POLICY "Harvesting logs viewable by all authenticated users"
  ON public.harvesting_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Harvesting logs manageable by admins only" ON public.harvesting_logs;
CREATE POLICY "Harvesting logs manageable by admins only"
  ON public.harvesting_logs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 16. Storage Bucket Configuration ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'leak-evidence',
  'leak-evidence',
  true,
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Read Access for Leak Evidence" ON storage.objects;
CREATE POLICY "Public Read Access for Leak Evidence"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'leak-evidence');

DROP POLICY IF EXISTS "Authenticated Users Can Upload Leak Evidence" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload Leak Evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'leak-evidence');

DROP POLICY IF EXISTS "Uploader or Admin Can Update Evidence" ON storage.objects;
CREATE POLICY "Uploader or Admin Can Update Evidence"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'leak-evidence' AND (auth.uid() = owner OR public.is_admin()))
  WITH CHECK (bucket_id = 'leak-evidence' AND (auth.uid() = owner OR public.is_admin()));

DROP POLICY IF EXISTS "Uploader or Admin Can Delete Evidence" ON storage.objects;
CREATE POLICY "Uploader or Admin Can Delete Evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'leak-evidence' AND (auth.uid() = owner OR public.is_admin()));

-- ── 17. Seed Initial Campus Data ─────────────────────────────────────────────
INSERT INTO public.campus_zones (id, name, floors, latitude, longitude, description, accent_color)
VALUES
  ('academic', 'Academic Block', 3, 18.5909, 73.7385, 'Main academic building — classrooms, faculty cabins, admin office', '#10b981'),
  ('ppcrc', 'PPCRC', 4, 18.5917, 73.7397, 'Prakash Pawar Centre for Research and Consultancy — labs and research', '#0ea5e9'),
  ('mithila', 'Mithila Hostel', 4, 18.5901, 73.7402, 'Girls hostel — Mithila', '#f59e0b'),
  ('vikramshila', 'Vikramshila Hostel', 4, 18.5895, 73.7392, 'Boys hostel — Vikramshila', '#8b5cf6'),
  ('canteen', 'Canteen', 1, 18.5905, 73.7388, 'Campus canteen and food court', '#ef4444'),
  ('garden', 'Campus Garden', 1, 18.5904, 73.7395, 'Botanical and landscape area', '#22c55e')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tanks (id, name, zone_id, capacity_litres, current_litres)
VALUES
  (1, 'Tank A — Academic Block', 'academic', 50000, 38500),
  (2, 'Tank B — Mithila Hostel', 'mithila', 30000, 27800),
  (3, 'Tank C — PPCRC', 'ppcrc', 20000, 5200),
  (4, 'Tank D — Vikramshila Hostel', 'vikramshila', 15000, 11200)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.tanks', 'id'), COALESCE(MAX(id), 1)) FROM public.tanks;

INSERT INTO public.leak_reports (id, type, zone_id, location_detail, reporter_name, status, priority, description, assigned_name)
VALUES
  ('LK-001', 'Pipe Leak', 'academic', 'Academic Block — Ground Floor Washroom', 'Arjun Mehta', 'in_progress', 'high', 'Water dripping from overhead pipe near washroom entrance. Flooring is wet and slippery.', 'Ram Kumar'),
  ('LK-002', 'Tap Wastage', 'mithila', 'Mithila Hostel — Block B, Room 204', 'Priya Singh', 'pending', 'medium', 'Tap not closing fully — continuous drip in the washroom.', NULL),
  ('LK-003', 'Pipe Burst', 'ppcrc', 'PPCRC — 2nd Floor Lab Corridor', 'Dr. S. Rao', 'in_progress', 'critical', 'Major pipe burst near sink area in the research lab. Large water pooling.', 'Suresh Babu'),
  ('LK-004', 'Overflow', 'ppcrc', 'Tank C — PPCRC Rooftop', 'System Alert', 'resolved', 'high', 'Automatic overflow sensor triggered on PPCRC rooftop tank.', 'Ram Kumar'),
  ('LK-005', 'Tap Wastage', 'canteen', 'Canteen — Kitchen Sink Area', 'Rajesh V.', 'resolved', 'low', 'Dishwashing tap left running overnight causing significant wastage.', 'Mohan Das'),
  ('LK-006', 'Pipe Leak', 'academic', 'Academic Block — 3rd Floor, near Water Cooler', 'Kavitha R.', 'pending', 'medium', 'Slow drip from pipe joint behind the water cooler on 3rd floor.', NULL),
  ('LK-007', 'Tap Wastage', 'vikramshila', 'Vikramshila Hostel — Common Washroom, Floor 1', 'Security Guard', 'in_progress', 'low', 'Multiple taps found running in common washroom. Waste ongoing.', 'Suresh Babu'),
  ('LK-008', 'Pipe Leak', 'ppcrc', 'PPCRC — Ground Floor Corridor', 'Nisha Patel', 'resolved', 'medium', 'Leak from overhead pipe in the ground floor corridor near entrance.', 'Mohan Das')
ON CONFLICT (id) DO NOTHING;

SELECT setval('leak_ticket_seq', 8, true);

INSERT INTO public.work_logs (id, report_id, technician_name, note)
VALUES
  (1, 'LK-001', 'Ram Kumar', 'Inspected leak source — pipe joint above false ceiling.'),
  (2, 'LK-001', 'Ram Kumar', 'Temporary patch applied. Permanent fix scheduled.'),
  (3, 'LK-003', 'Suresh Babu', 'Shut off water supply to PPCRC 2nd floor section.')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.work_logs', 'id'), COALESCE(MAX(id), 1)) FROM public.work_logs;

INSERT INTO public.alerts (id, type, icon, title, message, is_read)
VALUES
  (1, 'critical', 'AlertTriangle', 'Tank C Level Critical — PPCRC', 'PPCRC Tank at 26% capacity. Refill required immediately.', false),
  (2, 'warning', 'Droplets', 'Unusual Usage Spike — Mithila Hostel', 'Mithila Hostel zone usage is 34% above average for this time of day.', false),
  (3, 'warning', 'AlertCircle', 'New Critical Report: LK-003', 'Pipe burst reported in PPCRC 2nd Floor. Assigned to Suresh Babu.', false),
  (4, 'info', 'CloudRain', 'Harvesting Target Exceeded', 'Today''s rainwater collection exceeded target by 24%. Great performance!', true),
  (5, 'info', 'CheckCircle', 'Issue LK-004 Resolved', 'PPCRC overflow issue resolved by Ram Kumar.', true),
  (6, 'warning', 'Thermometer', 'High Consumption — PPCRC Labs', 'PPCRC zone consumption 22% above weekly average.', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.alerts', 'id'), COALESCE(MAX(id), 1)) FROM public.alerts;

INSERT INTO public.harvesting_logs (litres_collected, target_litres, record_date, efficiency_percentage)
VALUES
  (8200,  10000, CURRENT_DATE - INTERVAL '6 days', 82),
  (9400,  10000, CURRENT_DATE - INTERVAL '5 days', 94),
  (7800,  10000, CURRENT_DATE - INTERVAL '4 days', 78),
  (11200, 10000, CURRENT_DATE - INTERVAL '3 days', 100),
  (12400, 10000, CURRENT_DATE - INTERVAL '2 days', 100),
  (10800, 10000, CURRENT_DATE - INTERVAL '1 day',  100),
  (9600,  10000, CURRENT_DATE,                     96)
ON CONFLICT (record_date) DO NOTHING;
