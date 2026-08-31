-- ═══════════════════════════════════════════════════════════════════════════
-- AquaManage — Initial Campus Seed Data
-- Seeds default campus zones, tanks, reports, alerts, and analytics
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Seed Campus Zones & Buildings ─────────────────────────────────────────
INSERT INTO public.campus_zones (id, name, floors, latitude, longitude, description, accent_color)
VALUES
  ('academic', 'Academic Block', 3, 18.5909, 73.7385, 'Main academic building — classrooms, faculty cabins, admin office', '#10b981'),
  ('ppcrc', 'PPCRC', 4, 18.5917, 73.7397, 'Prakash Pawar Centre for Research and Consultancy — labs and research', '#0ea5e9'),
  ('mithila', 'Mithila Hostel', 4, 18.5901, 73.7402, 'Girls hostel — Mithila', '#f59e0b'),
  ('vikramshila', 'Vikramshila Hostel', 4, 18.5895, 73.7392, 'Boys hostel — Vikramshila', '#8b5cf6'),
  ('canteen', 'Canteen', 1, 18.5905, 73.7388, 'Campus canteen and food court', '#ef4444'),
  ('garden', 'Campus Garden', 1, 18.5904, 73.7395, 'Botanical and landscape area', '#22c55e')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  floors = EXCLUDED.floors,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description,
  accent_color = EXCLUDED.accent_color;

-- ── 2. Seed Tanks ────────────────────────────────────────────────────────────
INSERT INTO public.tanks (id, name, zone_id, capacity_litres, current_litres)
VALUES
  (1, 'Tank A — Academic Block', 'academic', 50000, 38500),
  (2, 'Tank B — Mithila Hostel', 'mithila', 30000, 27800),
  (3, 'Tank C — PPCRC', 'ppcrc', 20000, 5200),
  (4, 'Tank D — Vikramshila Hostel', 'vikramshila', 15000, 11200)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  zone_id = EXCLUDED.zone_id,
  capacity_litres = EXCLUDED.capacity_litres,
  current_litres = EXCLUDED.current_litres;

-- Reset sequence to avoid conflict on new inserts
SELECT setval(pg_get_serial_sequence('public.tanks', 'id'), COALESCE(MAX(id), 1)) FROM public.tanks;

-- ── 3. Seed Leak Reports ─────────────────────────────────────────────────────
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
ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  zone_id = EXCLUDED.zone_id,
  location_detail = EXCLUDED.location_detail,
  reporter_name = EXCLUDED.reporter_name,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  description = EXCLUDED.description,
  assigned_name = EXCLUDED.assigned_name;

-- Set sequence so future auto-generated tickets start at LK-009
SELECT setval('leak_ticket_seq', 8, true);

-- ── 4. Seed Work Logs ────────────────────────────────────────────────────────
INSERT INTO public.work_logs (id, report_id, technician_name, note)
VALUES
  (1, 'LK-001', 'Ram Kumar', 'Inspected leak source — pipe joint above false ceiling.'),
  (2, 'LK-001', 'Ram Kumar', 'Temporary patch applied. Permanent fix scheduled.'),
  (3, 'LK-003', 'Suresh Babu', 'Shut off water supply to PPCRC 2nd floor section.')
ON CONFLICT (id) DO UPDATE SET
  note = EXCLUDED.note;

SELECT setval(pg_get_serial_sequence('public.work_logs', 'id'), COALESCE(MAX(id), 1)) FROM public.work_logs;

-- ── 5. Seed Alerts ───────────────────────────────────────────────────────────
INSERT INTO public.alerts (id, type, icon, title, message, is_read)
VALUES
  (1, 'critical', 'AlertTriangle', 'Tank C Level Critical — PPCRC', 'PPCRC Tank at 26% capacity. Refill required immediately.', false),
  (2, 'warning', 'Droplets', 'Unusual Usage Spike — Mithila Hostel', 'Mithila Hostel zone usage is 34% above average for this time of day.', false),
  (3, 'warning', 'AlertCircle', 'New Critical Report: LK-003', 'Pipe burst reported in PPCRC 2nd Floor. Assigned to Suresh Babu.', false),
  (4, 'info', 'CloudRain', 'Harvesting Target Exceeded', 'Today''s rainwater collection exceeded target by 24%. Great performance!', true),
  (5, 'info', 'CheckCircle', 'Issue LK-004 Resolved', 'PPCRC overflow issue resolved by Ram Kumar.', true),
  (6, 'warning', 'Thermometer', 'High Consumption — PPCRC Labs', 'PPCRC zone consumption 22% above weekly average.', true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  message = EXCLUDED.message;

SELECT setval(pg_get_serial_sequence('public.alerts', 'id'), COALESCE(MAX(id), 1)) FROM public.alerts;

-- ── 6. Seed Harvesting History Logs ──────────────────────────────────────────
INSERT INTO public.harvesting_logs (litres_collected, target_litres, record_date, efficiency_percentage)
VALUES
  (8200,  10000, CURRENT_DATE - INTERVAL '6 days', 82),
  (9400,  10000, CURRENT_DATE - INTERVAL '5 days', 94),
  (7800,  10000, CURRENT_DATE - INTERVAL '4 days', 78),
  (11200, 10000, CURRENT_DATE - INTERVAL '3 days', 100),
  (12400, 10000, CURRENT_DATE - INTERVAL '2 days', 100),
  (10800, 10000, CURRENT_DATE - INTERVAL '1 day',  100),
  (9600,  10000, CURRENT_DATE,                     96)
ON CONFLICT (record_date) DO UPDATE SET
  litres_collected = EXCLUDED.litres_collected,
  efficiency_percentage = EXCLUDED.efficiency_percentage;
