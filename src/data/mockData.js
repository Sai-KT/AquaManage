// ─── Mock Data for Campus Water Management System — IIIT Hinjewadi ──────────

export const campusStats = {
  activeLeaks: 0,
  waterSavedToday: 12400, // litres
  alertsToday: 0,
  pendingIssues: 0,
  resolvedIssues: 0,
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

// ─── Water Usage — 5 IIIT Campus Zones ────────────────────────────────────
export const waterUsageByZone = {
  labels: ['Academic Block', 'PPCRC', 'Mithila Hostel', 'Vikramshila Hostel', 'Canteen'],
  daily:   [8500,  6200,  18200, 22800, 3800],
  weekly:  [59500, 43400, 127400, 159600, 26600],
  monthly: [255000, 186200, 546000, 684000, 114000],
};

// ─── Clean Initial State: Zero Complaints ─────────────────────────────────
export const leakReports = [];

export const alerts = [
  { id: 1, type: 'critical', icon: 'AlertTriangle', title: 'Tank C Level Critical — PPCRC', message: 'PPCRC Tank at 26% capacity. Refill required immediately.', time: '10 min ago', read: false },
  { id: 2, type: 'warning', icon: 'Droplets', title: 'Unusual Usage Spike — Mithila Hostel', message: 'Mithila Hostel zone usage is 34% above average for this time of day.', time: '42 min ago', read: false },
  { id: 4, type: 'info', icon: 'CloudRain', title: 'Harvesting Target Exceeded', message: "Today's rainwater collection exceeded target by 24%. Great performance!", time: '3 hrs ago', read: true },
  { id: 6, type: 'warning', icon: 'Thermometer', title: 'High Consumption — PPCRC Labs', message: 'PPCRC zone consumption 22% above weekly average.', time: '1 day ago', read: true },
];

export const maintenanceTasks = [];

export const myReports = [];

export const analyticsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  usage:          [620000, 580000, 710000, 850000, 790000, 730000, 840000],
  harvested:      [220000, 185000, 310000, 420000, 380000, 295000, 340000],
  leaksReported:  [0, 0, 0, 0, 0, 0, 0],
  leaksResolved:  [0, 0, 0, 0, 0, 0, 0],
};

// ─── IIIT Hinjewadi Map Pins (Harvesting Tanks & Infrastructure) ───────────
export const mapPins = [
  // Harvesting tanks
  { id: 4,  type: 'harvesting', lat: 18.5912, lng: 73.7383, label: 'Tank A — Academic Block',      location: 'Academic Block Rooftop',       level: 77 },
  { id: 5,  type: 'harvesting', lat: 18.5900, lng: 73.7402, label: 'Tank B — Mithila Hostel',      location: 'Mithila Hostel Rooftop',       level: 93 },
  { id: 6,  type: 'harvesting', lat: 18.5918, lng: 73.7399, label: 'Tank C — PPCRC',               location: 'PPCRC Rooftop',                level: 26 },
  { id: 9,  type: 'harvesting', lat: 18.5895, lng: 73.7390, label: 'Tank D — Vikramshila Hostel',  location: 'Vikramshila Hostel Rooftop',   level: 75 },
];

// ─── IIIT Campus Building Data (for map overlay labels) ─────────────────────
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
