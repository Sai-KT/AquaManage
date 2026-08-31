import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

const BUILDINGS = [
  { id: 'academic', name: 'Academic Block', floors: 3, lat: 18.5909, lng: 73.7385, desc: 'Main academic building — classrooms, faculty cabins, admin office', color: '#10b981' },
  { id: 'ppcrc', name: 'PPCRC', floors: 4, lat: 18.5917, lng: 73.7397, desc: 'Prakash Pawar Centre for Research and Consultancy — labs and research', color: '#0ea5e9' },
  { id: 'mithila', name: 'Mithila Hostel', floors: 4, lat: 18.5901, lng: 73.7402, desc: 'Girls hostel — Mithila', color: '#f59e0b' },
  { id: 'vikramshila', name: 'Vikramshila Hostel', floors: 4, lat: 18.5895, lng: 73.7392, desc: 'Boys hostel — Vikramshila', color: '#8b5cf6' },
  { id: 'canteen', name: 'Canteen', floors: 1, lat: 18.5905, lng: 73.7388, desc: 'Campus canteen and food court', color: '#ef4444' },
];

// Map location coordinates for mock data pins
const PIN_COORDINATES = {
  'Academic Block': { lat: 18.5907, lng: 73.7386 },
  'Mithila Hostel': { lat: 18.5902, lng: 73.7400 },
  'PPCRC': { lat: 18.5916, lng: 73.7396 },
  'Vikramshila Hostel': { lat: 18.5897, lng: 73.7393 },
  'Canteen': { lat: 18.5905, lng: 73.7388 },
};

// GET /api/map/pins — Return active leak pins and tank pins
router.get('/pins', (req, res) => {
  try {
    const reports = db.prepare('SELECT id, type, location, zone, status, priority FROM leak_reports').all();
    const tanks = db.prepare('SELECT id, name, building, capacity, current FROM tanks').all();

    const leakPins = reports.map((r, i) => {
      const coords = PIN_COORDINATES[r.zone] || { lat: 18.5908, lng: 73.7393 };
      return {
        id: `leak-${r.id}`,
        type: 'leak',
        lat: coords.lat + (i % 2 === 0 ? 0.0003 : -0.0003),
        lng: coords.lng + (i % 3 === 0 ? 0.0002 : -0.0002),
        label: `${r.id}: ${r.type}`,
        location: r.location,
        status: r.status,
        priority: r.priority,
      };
    });

    const tankPins = tanks.map(t => {
      const coords = PIN_COORDINATES[t.building] || { lat: 18.5908, lng: 73.7393 };
      return {
        id: `tank-${t.id}`,
        type: 'harvesting',
        lat: coords.lat + 0.0005,
        lng: coords.lng - 0.0002,
        label: t.name,
        location: `${t.building} Rooftop`,
        level: Math.round((t.current / t.capacity) * 100),
      };
    });

    res.json({
      success: true,
      pins: [...leakPins, ...tankPins],
      buildings: BUILDINGS,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/map/buildings
router.get('/buildings', (req, res) => {
  res.json({ success: true, buildings: BUILDINGS });
});

export default router;
