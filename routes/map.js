// ระบบแผนที่มหาวิทยาลัย (SKRU Campus Map) — API สำหรับหน้า /map
// เรียกใช้ได้ที่ /api/map/...   (mount ใน server.js: app.use('/api/map', mapRoutes))
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', 'data', 'map');

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
}

const db = {
  campus: loadJson('campus.json'),     // ขอบเขต + อาคาร/ถนนภายในมหาวิทยาลัย
  official: loadJson('official.json'), // รายชื่อสถานที่จากผังทางการ SKRU
  nearby: loadJson('nearby.json'),     // สถานที่รอบมหาวิทยาลัย (OpenStreetMap)
};
const rawFeatures = [...db.official.features, ...db.campus.features, ...db.nearby.features];

function toPlace(f, group) {
  return {
    id: f.id,
    name: f.name,
    cat: f.cat || null,
    center: f.center || null,
    planNumber: f.planNumber || null,
    group,
    source: f.source || null,
  };
}

function allPlaces() {
  return [
    ...db.official.features.filter(f => f.named).map(f => toPlace(f, 'official')),
    ...db.campus.features.filter(f => f.named).map(f => toPlace(f, 'campus')),
    ...db.nearby.features.filter(f => f.named).map(f => toPlace(f, 'nearby')),
  ];
}

// รับเฉพาะข้อความสั้น ๆ ป้องกันค่าแปลกปลอม
function cleanQuery(value, max = 60) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\0-\x1F\x7F<>]/g, '').trim().slice(0, max);
}

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'skru-map' });
});

// ข้อมูลดิบที่หน้าแผนที่ใช้
router.get('/campus', (req, res) => res.json(db.campus));
router.get('/official', (req, res) => res.json(db.official));
router.get('/nearby', (req, res) => res.json(db.nearby));

// หมวดหมู่ + จำนวนสถานที่
router.get('/categories', (req, res) => {
  const count = {};
  for (const p of allPlaces()) if (p.cat) count[p.cat] = (count[p.cat] || 0) + 1;
  res.json(Object.entries(count).map(([name, total]) => ({ name, total })));
});

// รายการสถานที่  ?cat=อาคาร  ?group=official|campus|nearby
router.get('/places', (req, res) => {
  const cat = cleanQuery(req.query.cat);
  const group = cleanQuery(req.query.group);
  let list = allPlaces();
  if (cat) list = list.filter(p => p.cat === cat);
  if (group) list = list.filter(p => p.group === group);
  res.json(list);
});

// รายละเอียดสถานที่  /api/map/places/skru-7
router.get('/places/:id', (req, res) => {
  const id = cleanQuery(req.params.id, 80);
  const place = rawFeatures.find(f => String(f.id) === id);
  if (!place) return res.status(404).json({ success: false, message: 'ไม่พบสถานที่' });
  res.json(place);
});

// ค้นหา  ?q=หอพัก
router.get('/search', (req, res) => {
  const term = cleanQuery(req.query.q).toLowerCase();
  if (!term) return res.json([]);
  const ids = new Set(
    rawFeatures
      .filter(f => f.named && `${f.search || ''} ${f.name || ''} ${f.planNumber || ''}`.toLowerCase().includes(term))
      .map(f => f.id)
  );
  res.json(allPlaces().filter(p => ids.has(p.id)).slice(0, 30));
});

module.exports = router;
