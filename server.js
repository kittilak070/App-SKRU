// SKRU Campus Map — หลังบ้าน (Node.js ล้วน ไม่ต้อง npm install)
// รัน:  node server.js   แล้วเปิด http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');

// ---------- โหลดข้อมูลสถานที่ ----------
function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
}
const db = {
  campus: loadJson('campus.json'),     // ขอบเขต + อาคาร/ถนนภายในมหาวิทยาลัย
  official: loadJson('official.json'), // รายชื่อสถานที่จากผังทางการ SKRU
  nearby: loadJson('nearby.json'),     // สถานที่รอบมหาวิทยาลัย (OpenStreetMap)
};

// รวมสถานที่ทั้งหมดที่ค้นหาได้ เป็นรูปแบบเดียวกัน
function allPlaces() {
  const pick = (f, group) => ({
    id: f.id,
    name: f.name,
    cat: f.cat || null,
    center: f.center || null,
    planNumber: f.planNumber || null,
    group,
    source: f.source || null,
  });
  return [
    ...db.official.features.filter(f => f.named).map(f => pick(f, 'official')),
    ...db.campus.features.filter(f => f.named).map(f => pick(f, 'campus')),
    ...db.nearby.features.filter(f => f.named).map(f => pick(f, 'nearby')),
  ];
}

function searchText(f) {
  return `${f.search || ''} ${f.name || ''} ${f.planNumber || ''}`.toLowerCase();
}

// ---------- API ----------
const routes = {
  // ตรวจว่าเซิร์ฟเวอร์ทำงาน
  'GET /api/health': () => ({ ok: true, service: 'skru-map', time: new Date().toISOString() }),

  // ข้อมูลดิบสำหรับหน้าแผนที่
  'GET /api/campus': () => db.campus,
  'GET /api/official': () => db.official,
  'GET /api/nearby': () => db.nearby,

  // รายชื่อหมวดหมู่ + จำนวน
  'GET /api/categories': () => {
    const count = {};
    for (const p of allPlaces()) if (p.cat) count[p.cat] = (count[p.cat] || 0) + 1;
    return Object.entries(count).map(([name, total]) => ({ name, total }));
  },

  // รายการสถานที่  ?cat=อาคาร  ?group=official|campus|nearby
  'GET /api/places': (q) => {
    let list = allPlaces();
    if (q.get('cat')) list = list.filter(p => p.cat === q.get('cat'));
    if (q.get('group')) list = list.filter(p => p.group === q.get('group'));
    return list;
  },

  // ค้นหา  ?q=หอสมุด
  'GET /api/search': (q) => {
    const term = (q.get('q') || '').trim().toLowerCase();
    if (!term) return [];
    const raw = [...db.official.features, ...db.campus.features, ...db.nearby.features];
    const ids = new Set(raw.filter(f => f.named && searchText(f).includes(term)).map(f => f.id));
    return allPlaces().filter(p => ids.has(p.id)).slice(0, 30);
  },
};

// /api/places/:id
function findPlace(id) {
  return [...db.official.features, ...db.campus.features, ...db.nearby.features].find(f => String(f.id) === id);
}

// ---------- ไฟล์หน้าบ้าน ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*', // ให้ระบบของเพื่อนในทีมเรียก API นี้ได้
  });
  res.end(JSON.stringify(body));
}

function serveStatic(res, urlPath) {
  const rel = decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath);
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('ไม่พบไฟล์'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' });
    return res.end();
  }
  if (url.pathname.startsWith('/api/')) {
    try {
      const handler = routes[`${req.method} ${url.pathname}`];
      if (handler) return sendJson(res, 200, handler(url.searchParams));
      const m = url.pathname.match(/^\/api\/places\/([^/]+)$/);
      if (req.method === 'GET' && m) {
        const place = findPlace(decodeURIComponent(m[1]));
        return place ? sendJson(res, 200, place) : sendJson(res, 404, { error: 'ไม่พบสถานที่' });
      }
      return sendJson(res, 404, { error: 'ไม่พบ API นี้' });
    } catch (e) {
      console.error(e);
      return sendJson(res, 500, { error: 'เซิร์ฟเวอร์ผิดพลาด' });
    }
  }
  serveStatic(res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`SKRU Map พร้อมใช้งานที่ http://localhost:${PORT}`);
});
