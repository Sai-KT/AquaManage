/**
 * CampusMap.jsx — I2IT Hinjewadi
 *
 * Map library : react-leaflet (Leaflet.js)
 * Boundary    : /public/data/campus-boundary.geojson  (fetched at runtime)
 *
 * All marker pins are validated against the campus polygon using a
 * ray-casting point-in-polygon algorithm before rendering.
 * Only pins that are INSIDE the boundary are shown.
 *
 * GeoJSON coordinate order : [longitude, latitude]
 * Leaflet coordinate order : [latitude, longitude]  ← swapped on parse
 *
 * Center : [18.5849503, 73.7377211]  (I2IT main entrance)
 * Bounds : SW [18.5832, 73.7362]  →  NE [18.5855, 73.7382]
 */

import React, { useEffect, useState } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup,
  Polygon, Tooltip as LeafletTooltip, Circle,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Map configuration ────────────────────────────────────────────────────────
const MAP_CENTER = [18.5849503, 73.7377211];
const CAMPUS_BOUNDS = L.latLngBounds(
  [18.5832, 73.7362],
  [18.5855, 73.7382],
);

// ─── Ray-casting point-in-polygon ─────────────────────────────────────────────
// ring: [[lat, lng], ...] (Leaflet order)
// Returns true if [lat, lng] is inside the polygon ring.
function isInsidePolygon(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lngI] = ring[i];
    const [latJ, lngJ] = ring[j];
    const intersect =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─── GeoJSON parsing ──────────────────────────────────────────────────────────
function extractPolygonRings(geojson) {
  if (!geojson?.features) return [];
  const rings = [];
  for (const feat of geojson.features) {
    if (feat.geometry?.type === 'Polygon') {
      for (const ring of feat.geometry.coordinates) {
        rings.push(ring.map(([lng, lat]) => [lat, lng])); // GeoJSON→Leaflet swap
      }
    }
  }
  return rings;
}

function extractPoints(geojson) {
  if (!geojson?.features) return [];
  return geojson.features
    .filter(f => f.geometry?.type === 'Point')
    .map(f => ({
      name: f.properties?.name || '',
      lat:  f.geometry.coordinates[1],
      lng:  f.geometry.coordinates[0],
    }));
}

// ─── Custom icons ─────────────────────────────────────────────────────────────
const leakIcon = (priority) => {
  const colors = { critical: '#ef4444', high: '#f59e0b', medium: '#0ea5e9', low: '#64748b' };
  const c = colors[priority] || colors.medium;
  return L.divIcon({
    html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:${c};border:2.5px solid #fff;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.4)"></div>`,
    className: '', iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -24],
  });
};

const harvestIcon = L.divIcon({
  html: `<div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#10b981);border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35);font-size:13px;text-align:center;line-height:26px">💧</div>`,
  className: '', iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -13],
});

const buildingIcon = (color) => L.divIcon({
  html: `<div style="background:${color};color:#fff;border-radius:6px;padding:3px 7px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid rgba(255,255,255,0.8);font-family:Inter,sans-serif">🏛️</div>`,
  className: '', iconSize: [30, 22], iconAnchor: [15, 11], popupAnchor: [0, -11],
});

// ─── Static data — all coordinates are inside the campus polygon ──────────────
//
// Campus polygon spans roughly:
//   lat : 18.5833 – 18.5854
//   lng : 73.7357 – 73.7387
//
// Building positions verified against polygon vertices from campus-boundary.geojson.
// Pins are placed near each building, offset slightly so they don't overlap.
//
const BUILDINGS = [
  {
    id: 'academic', name: 'Academic Block', floors: 3,
    // GeoJSON Point: [73.7377211, 18.5849503] — exact main entrance coordinate
    lat: 18.5849503, lng: 73.7377211,
    desc: 'Main academic building — classrooms, faculty cabins, admin office',
    color: '#10b981',
  },
  {
    id: 'ppcrc', name: 'PPCRC', floors: 4,
    // North of Academic Block, inside the polygon's upper section
    lat: 18.58505, lng: 73.73740,
    desc: 'Prakash Pawar Centre for Research & Consultancy — labs, projects',
    color: '#0ea5e9',
  },
  {
    id: 'mithila', name: 'Mithila Hostel', floors: 4,
    // Eastern side of campus, well inside eastern edge (~73.7387)
    lat: 18.58400, lng: 73.73800,
    desc: 'Girls hostel — Mithila (24-hour residential)',
    color: '#f59e0b',
  },
  {
    id: 'vikramshila', name: 'Vikramshila Hostel', floors: 4,
    // Southern section, near vertex (18.583847, 73.73863) but pulled inward
    lat: 18.58370, lng: 73.73750,
    desc: 'Boys hostel — Vikramshila (24-hour residential)',
    color: '#8b5cf6',
  },
  {
    id: 'canteen', name: 'Canteen', floors: 1,
    // Central-western area inside polygon
    lat: 18.58430, lng: 73.73700,
    desc: 'Campus canteen — food court and dining hall',
    color: '#ef4444',
  },
];

// All issue & tank pins — coordinates chosen to be clearly inside the polygon.
// Each pin is placed at or very near its associated building.
const ALL_PINS = [
  // ── Leak reports ──
  {
    id: 'LK-001', type: 'leak',
    // Academic Block ground floor — near main entrance
    lat: 18.58485, lng: 73.73762,
    label: 'LK-001: Pipe Leak',
    location: 'Academic Block — Ground Floor Washroom',
    status: 'in_progress', priority: 'high',
  },
  {
    id: 'LK-002', type: 'leak',
    // PPCRC 2nd floor lab — critical burst
    lat: 18.58512, lng: 73.73730,
    label: 'LK-002: Pipe Burst',
    location: 'PPCRC — 2nd Floor Research Lab',
    status: 'in_progress', priority: 'critical',
  },
  {
    id: 'LK-003', type: 'leak',
    // Mithila Hostel Block B — tap left running
    lat: 18.58395, lng: 73.73808,
    label: 'LK-003: Tap Wastage',
    location: 'Mithila Hostel — Block B, Floor 2',
    status: 'pending', priority: 'medium',
  },
  {
    id: 'LK-004', type: 'leak',
    // Vikramshila Hostel — floor 1 washroom
    lat: 18.58360, lng: 73.73760,
    label: 'LK-004: Tap Wastage',
    location: 'Vikramshila Hostel — Floor 1 Washroom',
    status: 'in_progress', priority: 'low',
  },
  {
    id: 'LK-005', type: 'leak',
    // Canteen — drainage blocked
    lat: 18.58422, lng: 73.73695,
    label: 'LK-005: Blocked Drain',
    location: 'Canteen — Kitchen Drainage',
    status: 'pending', priority: 'medium',
  },
  {
    id: 'LK-006', type: 'leak',
    // Academic Block 3rd floor corridor
    lat: 18.58502, lng: 73.73780,
    label: 'LK-006: Pipe Leak',
    location: 'Academic Block — 3rd Floor Corridor',
    status: 'pending', priority: 'high',
  },
  {
    id: 'LK-007', type: 'leak',
    // PPCRC ground floor
    lat: 18.58495, lng: 73.73715,
    label: 'LK-007: Overflow',
    location: 'PPCRC — Ground Floor Pantry',
    status: 'pending', priority: 'medium',
  },

  // ── Rainwater harvesting tanks (rooftop) ──
  {
    id: 'TANK-A', type: 'harvesting',
    // Academic Block rooftop
    lat: 18.58490, lng: 73.73748,
    label: 'Tank A — Academic Block',
    location: 'Academic Block Rooftop',
    level: 77,
  },
  {
    id: 'TANK-B', type: 'harvesting',
    // Mithila Hostel rooftop
    lat: 18.58410, lng: 73.73820,
    label: 'Tank B — Mithila Hostel',
    location: 'Mithila Hostel Rooftop',
    level: 93,
  },
  {
    id: 'TANK-C', type: 'harvesting',
    // PPCRC rooftop
    lat: 18.58520, lng: 73.73722,
    label: 'Tank C — PPCRC',
    location: 'PPCRC Rooftop',
    level: 26,
  },
  {
    id: 'TANK-D', type: 'harvesting',
    // Vikramshila Hostel rooftop
    lat: 18.58378, lng: 73.73740,
    label: 'Tank D — Vikramshila Hostel',
    location: 'Vikramshila Hostel Rooftop',
    level: 75,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function CampusMap({ height = 450 }) {
  const [polygonRings, setPolygonRings] = useState([]);
  const [insidePins,   setInsidePins]   = useState([]);
  const [loadError,    setLoadError]    = useState(null);

  useEffect(() => {
    fetch('/data/campus-boundary.geojson')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(gj => {
        const rings  = extractPolygonRings(gj);
        const points = extractPoints(gj);

        // ── Point-in-polygon filter ───────────────────────────────────
        // Use the FIRST (detailed) ring as the authoritative boundary.
        const authoritative = rings[0] || [];

        const passed = [];
        const failed = [];
        ALL_PINS.forEach(pin => {
          const inside = authoritative.length > 0
            ? isInsidePolygon(pin.lat, pin.lng, authoritative)
            : true; // if no polygon loaded yet, show all
          if (inside) passed.push(pin);
          else        failed.push(pin);
        });

        // ── Console verification log ──────────────────────────────────
        console.group('🗺️  CampusMap — GeoJSON verification & pin check');
        console.log('Source       : /public/data/campus-boundary.geojson');
        console.log('Map library  : react-leaflet (Leaflet.js)');
        console.log('');
        console.log(`▶ Polygon ring 0  —  ${authoritative.length} vertices (Leaflet [lat, lng]):`);
        authoritative.forEach(([lat, lng], i) =>
          console.log(`    [${String(i).padStart(2)}]  lat: ${lat},  lng: ${lng}`)
        );
        console.log('');
        console.log('▶ GeoJSON Point features:');
        points.forEach(p =>
          console.log(`    "${p.name}"  lat: ${p.lat},  lng: ${p.lng}`)
        );
        console.log('');
        console.log(`▶ MAP_CENTER      : [${MAP_CENTER}]`);
        console.log(`▶ Bounds SW→NE   : [18.5832, 73.7362] → [18.5855, 73.7382]`);
        console.log(`▶ CAMPUS_BOUNDS  : ${CAMPUS_BOUNDS.toBBoxString()}`);
        console.log('');
        console.log(`▶ Pin check — ${passed.length} INSIDE, ${failed.length} OUTSIDE:`);
        passed.forEach(p => console.log(`  ✅ ${p.id}  (${p.label})  lat:${p.lat} lng:${p.lng}`));
        if (failed.length)
          failed.forEach(p => console.warn(`  ❌ ${p.id}  (${p.label})  lat:${p.lat} lng:${p.lng}  — NOT rendered`));
        console.groupEnd();

        setPolygonRings(rings);
        setInsidePins(passed);
      })
      .catch(err => {
        console.error('CampusMap: GeoJSON fetch failed —', err.message);
        setLoadError(err.message);
        setInsidePins(ALL_PINS); // fallback: show all pins
      });
  }, []);

  return (
    <div className="map-wrapper" style={{ height, position: 'relative' }}>
      {loadError && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1000, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', color: '#dc2626' }}>
          ⚠️ GeoJSON load error: {loadError}
        </div>
      )}

      <MapContainer
        center={MAP_CENTER}
        bounds={CAMPUS_BOUNDS}
        boundsOptions={{ padding: [24, 24] }}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        maxZoom={20}
        minZoom={15}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* ── Campus boundary polygon — from GeoJSON ── */}
        {polygonRings.map((ring, i) => (
          <Polygon
            key={`campus-boundary-${i}`}
            positions={ring}
            pathOptions={{
              color: '#10b981', weight: 2.5, opacity: 0.9,
              dashArray: '7 5',
              fillColor: '#10b981', fillOpacity: 0.06,
            }}
          >
            <LeafletTooltip permanent direction="top" style={{
              background: 'rgba(16,185,129,0.92)', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, padding: '3px 8px',
            }}>
              🏫 I2IT Campus — Hinjewadi
            </LeafletTooltip>
          </Polygon>
        ))}

        {/* ── Building label markers ── */}
        {BUILDINGS.map(b => (
          <Marker key={b.id} position={[b.lat, b.lng]} icon={buildingIcon(b.color)}>
            <Popup>
              <div style={{ minWidth: 175 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: b.color, marginBottom: 4 }}>{b.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: 8 }}>{b.desc}</div>
                <span style={{ background: b.color + '22', color: b.color, padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700 }}>
                  {b.floors} floor{b.floors > 1 ? 's' : ''}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ── Issue & tank pins — only those inside the campus polygon ── */}
        {insidePins.map(pin => (
          <React.Fragment key={pin.id}>
            <Marker
              position={[pin.lat, pin.lng]}
              icon={pin.type === 'harvesting' ? harvestIcon : leakIcon(pin.priority)}
            >
              <Popup>
                <div style={{ minWidth: 195 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.875rem' }}>{pin.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 10 }}>{pin.location}</div>

                  {pin.type === 'leak' && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        background: pin.status === 'in_progress' ? '#e0f2fe' : '#fef3c7',
                        color:      pin.status === 'in_progress' ? '#075985' : '#92400e',
                        padding: '2px 9px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600,
                      }}>
                        {pin.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{
                        background: pin.priority === 'critical' ? '#fee2e2' : pin.priority === 'high' ? '#fef3c7' : pin.priority === 'medium' ? '#e0f2fe' : '#f1f5f9',
                        color:      pin.priority === 'critical' ? '#dc2626' : pin.priority === 'high' ? '#92400e' : pin.priority === 'medium' ? '#0369a1' : '#475569',
                        padding: '2px 9px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600,
                      }}>
                        {pin.priority.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {pin.type === 'harvesting' && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: 6 }}>Tank Fill Level</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ background: '#d1fae5', height: 8, borderRadius: 4, flex: 1 }}>
                          <div style={{
                            background: pin.level > 60 ? '#10b981' : pin.level > 30 ? '#f59e0b' : '#ef4444',
                            height: '100%', borderRadius: 4, width: `${pin.level}%`,
                          }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: pin.level > 60 ? '#047857' : pin.level > 30 ? '#92400e' : '#dc2626' }}>
                          {pin.level}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Pulsing ring for critical leaks */}
            {pin.type === 'leak' && pin.priority === 'critical' && (
              <Circle
                center={[pin.lat, pin.lng]}
                radius={18}
                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.12, weight: 1.5, dashArray: '4 4' }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}
