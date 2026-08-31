-- ═══════════════════════════════════════════════════════════════════════════
-- AquaManage — Row Level Security (RLS) Policies Migration
-- Granular role-based security for Student, Maintenance, and Admin
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Enable Row Level Security on All Tables ──────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leak_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvesting_logs ENABLE ROW LEVEL SECURITY;

-- ── 2. Helper Functions for Role Resolution ──────────────────────────────────
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

CREATE OR REPLACE FUNCTION public.is_maintenance()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'maintenance'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'maintenance')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── 3. Policies: profiles ───────────────────────────────────────────────────
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ── 4. Policies: campus_zones ────────────────────────────────────────────────
CREATE POLICY "Campus zones viewable by all authenticated users"
  ON public.campus_zones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Campus zones manageable by admins only"
  ON public.campus_zones FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 5. Policies: tanks ───────────────────────────────────────────────────────
CREATE POLICY "Tanks viewable by all authenticated users"
  ON public.tanks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can update tank telemetry and levels"
  ON public.tanks FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Tanks insert and delete by admins only"
  ON public.tanks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Tanks delete by admins only"
  ON public.tanks FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── 6. Policies: leak_reports ────────────────────────────────────────────────
-- All authenticated users can view reports
CREATE POLICY "Leak reports viewable by all authenticated users"
  ON public.leak_reports FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users (Students/Staff) can submit reports
CREATE POLICY "Authenticated users can submit leak reports"
  ON public.leak_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Staff can update any report (assign technician, change status/priority)
CREATE POLICY "Staff can update any leak report"
  ON public.leak_reports FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Students can update their own reports if still pending
CREATE POLICY "Students can update own pending reports"
  ON public.leak_reports FOR UPDATE
  TO authenticated
  USING (reporter_id = auth.uid() AND status = 'pending')
  WITH CHECK (reporter_id = auth.uid() AND status = 'pending');

-- Only admins can delete reports
CREATE POLICY "Admins can delete leak reports"
  ON public.leak_reports FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── 7. Policies: work_logs ───────────────────────────────────────────────────
CREATE POLICY "Work logs viewable by all authenticated users"
  ON public.work_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert work logs"
  ON public.work_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "Admins can manage work logs"
  ON public.work_logs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 8. Policies: alerts ──────────────────────────────────────────────────────
CREATE POLICY "Alerts viewable by relevant roles or broadcasts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (
    target_role IS NULL OR 
    target_role = public.current_user_role() OR 
    public.is_admin()
  );

CREATE POLICY "Users can mark alerts as read"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage alerts"
  ON public.alerts FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 9. Policies: water_usage_logs ────────────────────────────────────────────
CREATE POLICY "Water usage logs viewable by all authenticated users"
  ON public.water_usage_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Water usage logs manageable by admins only"
  ON public.water_usage_logs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 10. Policies: harvesting_logs ───────────────────────────────────────────
CREATE POLICY "Harvesting logs viewable by all authenticated users"
  ON public.harvesting_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Harvesting logs manageable by admins only"
  ON public.harvesting_logs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
