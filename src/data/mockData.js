// ─── Mock Data for Campus Water Management System — I2IT Hinjewadi ──────────

export const campusStats = {
  activeLeaks: 7,
  waterSavedToday: 12400, // litres
  alertsToday: 3,
  pendingIssues: 12,
  resolvedIssues: 48,
  harvestingEfficiency: 87, // percent
  totalUsageToday: 59500, // litres — sum of all 5 zones
};

export const tankData = [
  { id: 1, name: 'Tank A — Academic Block', capacity: 50000, current: 38500, status: 'good' },
  { id: 2, name: 'Tank B — Mithila Hostel', capacity: 30000, current: 27800, status: 'good' },
  { id: 3, name: 'Tank C — PPCRC', capacity: 20000, current: 5200, status: 'critical' },
  { id: 4, name: 'Tank D — Vikramshila Hostel', capacity: 15000, current: 11200, status: 'warning' },
];

export const harvestingTrend = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  collected: [8200, 9400, 7800, 11200, 12400, 10800, 9600],
  target: [10000, 10000, 10000, 10000, 10000, 10000, 10000],
};

export const monthlyHarvesting = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  collected: [220000, 185000, 310000, 420000, 380000, 295000, 340000],
};

// ─── Water Usage — 5 I2IT Campus Zones ────────────────────────────────────
// Daily estimates based on occupancy:
//   Academic Block : ~1800 students × 4L avg + faculty + washrooms ≈ 8,500 L
//   PPCRC          : ~600 students, lab-heavy water use ≈ 6,200 L
//   Mithila Hostel : ~280 girls × 65 L/day (24hr) ≈ 18,200 L
//   Vikramshila    : ~380 boys  × 60 L/day (24hr) ≈ 22,800 L
//   Canteen        : cooking + cleaning ≈ 3,800 L
// Total ≈ 59,500 L/day
export const waterUsageByZone = {
  labels: ['Academic Block', 'PPCRC', 'Mithila Hostel', 'Vikramshila Hostel', 'Canteen'],
  daily:   [8500,  6200,  18200, 22800, 3800],
  weekly:  [59500, 43400, 127400, 159600, 26600],
  monthly: [255000, 186200, 546000, 684000, 114000],
};

// ─── I2IT Hinjewadi Campus — Actual Coordinates ──────────────────────────
// I2IT is at approx 18.5908°N, 73.7393°E (Hinjewadi Phase 1, Pune)

export const leakReports = [
  {
    id: 'LK-001', type: 'Pipe Leak',
    location: 'Academic Block — Ground Floor Washroom',
    zone: 'Academic Block', reporter: 'Arjun Mehta',
    date: '2026-07-27', status: 'in_progress', priority: 'high',
    description: 'Water dripping from overhead pipe near washroom entrance. Flooring is wet and slippery.',
    assignedTo: 'Ram Kumar', photo: null,
  },
  {
    id: 'LK-002', type: 'Tap Wastage',
    location: 'Mithila Hostel — Block B, Room 204',
    zone: 'Mithila Hostel', reporter: 'Priya Singh',
    date: '2026-07-26', status: 'pending', priority: 'medium',
    description: 'Tap not closing fully — continuous drip in the washroom.',
    assignedTo: null, photo: null,
  },
  {
    id: 'LK-003', type: 'Pipe Burst',
    location: 'PPCRC — 2nd Floor Lab Corridor',
    zone: 'PPCRC', reporter: 'Dr. S. Rao',
    date: '2026-07-26', status: 'in_progress', priority: 'critical',
    description: 'Major pipe burst near sink area in the research lab. Large water pooling.',
    assignedTo: 'Suresh Babu', photo: null,
  },
  {
    id: 'LK-004', type: 'Overflow',
    location: 'Tank C — PPCRC Rooftop',
    zone: 'PPCRC', reporter: 'System Alert',
    date: '2026-07-25', status: 'resolved', priority: 'high',
    description: 'Automatic overflow sensor triggered on PPCRC rooftop tank.',
    assignedTo: 'Ram Kumar', photo: null,
  },
  {
    id: 'LK-005', type: 'Tap Wastage',
    location: 'Canteen — Kitchen Sink Area',
    zone: 'Canteen', reporter: 'Rajesh V.',
    date: '2026-07-25', status: 'resolved', priority: 'low',
    description: 'Dishwashing tap left running overnight causing significant wastage.',
    assignedTo: 'Mohan Das', photo: null,
  },
  {
    id: 'LK-006', type: 'Pipe Leak',
    location: 'Academic Block — 3rd Floor, near Water Cooler',
    zone: 'Academic Block', reporter: 'Kavitha R.',
    date: '2026-07-24', status: 'pending', priority: 'medium',
    description: 'Slow drip from pipe joint behind the water cooler on 3rd floor.',
    assignedTo: null, photo: null,
  },
  {
    id: 'LK-007', type: 'Tap Wastage',
    location: 'Vikramshila Hostel — Common Washroom, Floor 1',
    zone: 'Vikramshila Hostel', reporter: 'Security Guard',
    date: '2026-07-24', status: 'in_progress', priority: 'low',
    description: 'Multiple taps found running in common washroom. Waste ongoing.',
    assignedTo: 'Suresh Babu', photo: null,
  },
  {
    id: 'LK-008', type: 'Pipe Leak',
    location: 'PPCRC — Ground Floor Corridor',
    zone: 'PPCRC', reporter: 'Nisha Patel',
    date: '2026-07-23', status: 'resolved', priority: 'medium',
    description: 'Leak from overhead pipe in the ground floor corridor near entrance.',
    assignedTo: 'Mohan Das', photo: null,
  },
];

export const alerts = [
  { id: 1, type: 'critical', icon: 'AlertTriangle', title: 'Tank C Level Critical — PPCRC', message: 'PPCRC Tank at 26% capacity. Refill required immediately.', time: '10 min ago', read: false },
  { id: 2, type: 'warning', icon: 'Droplets', title: 'Unusual Usage Spike — Mithila Hostel', message: 'Mithila Hostel zone usage is 34% above average for this time of day.', time: '42 min ago', read: false },
  { id: 3, type: 'warning', icon: 'AlertCircle', title: 'New Critical Report: LK-003', message: 'Pipe burst reported in PPCRC 2nd Floor. Assigned to Suresh Babu.', time: '1 hr ago', read: false },
  { id: 4, type: 'info', icon: 'CloudRain', title: 'Harvesting Target Exceeded', message: "Today's rainwater collection exceeded target by 24%. Great performance!", time: '3 hrs ago', read: true },
  { id: 5, type: 'info', icon: 'CheckCircle', title: 'Issue LK-004 Resolved', message: 'PPCRC overflow issue resolved by Ram Kumar.', time: '5 hrs ago', read: true },
  { id: 6, type: 'warning', icon: 'Thermometer', title: 'High Consumption — PPCRC Labs', message: 'PPCRC zone consumption 22% above weekly average.', time: '1 day ago', read: true },
];

export const maintenanceTasks = [
  {
    id: 'LK-001', type: 'Pipe Leak',
    location: 'Academic Block — Ground Floor Washroom',
    priority: 'high', status: 'in_progress', reporter: 'Arjun Mehta',
    date: '2026-07-27',
    description: 'Water dripping from overhead pipe near washroom entrance. Flooring is wet and slippery.',
    workLog: ['Inspected leak source — pipe joint above false ceiling.', 'Temporary patch applied. Permanent fix scheduled.'],
  },
  {
    id: 'LK-003', type: 'Pipe Burst',
    location: 'PPCRC — 2nd Floor Lab Corridor',
    priority: 'critical', status: 'in_progress', reporter: 'Dr. S. Rao',
    date: '2026-07-26',
    description: 'Major pipe burst near sink area in the research lab. Large water pooling.',
    workLog: ['Shut off water supply to PPCRC 2nd floor section.'],
  },
  {
    id: 'LK-007', type: 'Tap Wastage',
    location: 'Vikramshila Hostel — Common Washroom, Floor 1',
    priority: 'low', status: 'in_progress', reporter: 'Security Guard',
    date: '2026-07-24',
    description: 'Multiple taps found running in common washroom.',
    workLog: [],
  },
];

export const myReports = [
  {
    id: 'LK-009', type: 'Pipe Leak',
    location: 'Academic Block — 2nd Floor Washroom',
    date: '2026-07-27', status: 'pending',
    description: 'Pipe dripping near sink in 2nd floor washroom.',
  },
  {
    id: 'LK-005', type: 'Tap Wastage',
    location: 'Canteen — Wash Area',
    date: '2026-07-20', status: 'resolved',
    description: 'Tap was continuously running near dishwashing area.',
  },
];

export const analyticsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  usage:          [620000, 580000, 710000, 850000, 790000, 730000, 840000],
  harvested:      [220000, 185000, 310000, 420000, 380000, 295000, 340000],
  leaksReported:  [8, 5, 12, 9, 14, 11, 7],
  leaksResolved:  [6, 5, 10, 8, 12, 10, 5],
};

// ─── I2IT Hinjewadi Map Pins ─────────────────────────────────────────────────
// Campus center: 18.5908, 73.7393
export const mapPins = [
  // Leak reports on campus
  { id: 1,  type: 'leak',      lat: 18.5907, lng: 73.7386, label: 'LK-001: Pipe Leak',  location: 'Academic Block — Ground Floor',    status: 'in_progress', priority: 'high'     },
  { id: 2,  type: 'leak',      lat: 18.5902, lng: 73.7400, label: 'LK-002: Tap Wastage', location: 'Mithila Hostel — Block B',         status: 'pending',     priority: 'medium'   },
  { id: 3,  type: 'leak',      lat: 18.5916, lng: 73.7396, label: 'LK-003: Pipe Burst',  location: 'PPCRC — 2nd Floor Lab',           status: 'in_progress', priority: 'critical' },
  { id: 7,  type: 'leak',      lat: 18.5910, lng: 73.7388, label: 'LK-006: Pipe Leak',   location: 'Academic Block — 3rd Floor',      status: 'pending',     priority: 'medium'   },
  { id: 8,  type: 'leak',      lat: 18.5897, lng: 73.7393, label: 'LK-007: Tap Wastage', location: 'Vikramshila Hostel — Floor 1',    status: 'in_progress', priority: 'low'      },
  // Harvesting tanks
  { id: 4,  type: 'harvesting', lat: 18.5912, lng: 73.7383, label: 'Tank A — Academic Block',      location: 'Academic Block Rooftop',       level: 77 },
  { id: 5,  type: 'harvesting', lat: 18.5900, lng: 73.7402, label: 'Tank B — Mithila Hostel',      location: 'Mithila Hostel Rooftop',       level: 93 },
  { id: 6,  type: 'harvesting', lat: 18.5918, lng: 73.7399, label: 'Tank C — PPCRC',               location: 'PPCRC Rooftop',                level: 26 },
  { id: 9,  type: 'harvesting', lat: 18.5895, lng: 73.7390, label: 'Tank D — Vikramshila Hostel',  location: 'Vikramshila Hostel Rooftop',   level: 75 },
];

// ─── I2IT Campus Building Data (for map overlay labels) ─────────────────────
export const i2itBuildings = [
  {
    id: 'academic', name: 'Academic Block', floors: 3,
    lat: 18.5909, lng: 73.7385,
    desc: 'Main academic building — classrooms, faculty cabins, admin office',
    color: '#10b981',
  },
  {
    id: 'ppcrc', name: 'PPCRC', floors: 4,
    lat: 18.5917, lng: 73.7397,
    desc: 'Prakash Pawar Centre for Research and Consultancy — labs and research',
    color: '#0ea5e9',
  },
  {
    id: 'mithila', name: 'Mithila Hostel', floors: 4,
    lat: 18.5901, lng: 73.7402,
    desc: 'Girls hostel — Mithila',
    color: '#f59e0b',
  },
  {
    id: 'vikramshila', name: 'Vikramshila Hostel', floors: 4,
    lat: 18.5895, lng: 73.7392,
    desc: 'Boys hostel — Vikramshila',
    color: '#8b5cf6',
  },
  {
    id: 'canteen', name: 'Canteen', floors: 1,
    lat: 18.5905, lng: 73.7388,
    desc: 'Campus canteen and food court',
    color: '#ef4444',
  },
];

export const campusZones = [
  'Academic Block', 'PPCRC', 'Mithila Hostel', 'Vikramshila Hostel',
  'Canteen', 'Campus Garden',
];

export const issueTypes = ['Pipe Leak', 'Tap Wastage', 'Pipe Burst', 'Overflow', 'Sprinkler Fault', 'Blocked Drain', 'Other'];
