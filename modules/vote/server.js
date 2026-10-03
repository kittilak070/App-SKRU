const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'ratings.json');

// Ensure data folder and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
}

// Helper: read ratings data safely
function readRatings() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading ratings file:', err);
    return [];
  }
}

// Helper: write ratings data safely
function saveRatings(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing ratings file:', err);
    return false;
  }
}

// Helper: MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // CORS headers for flexibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // --- API ENDPOINTS ---
  
  // 1. Submit a rating: POST /api/ratings
  if (pathname === '/api/ratings' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const score = Number(payload.score);
        const comment = (payload.comment || '').trim();

        if (!score || score < 1 || score > 5) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ 
            success: false, 
            message: 'กรุณาระบุคะแนนความพึงพอใจระหว่าง 1 ถึง 5 ดาว' 
          }));
        }

        const newEntry = {
          id: 'rate_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          score: score,
          comment: comment,
          createdAt: new Date().toISOString(),
          formattedDate: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
        };

        const currentRatings = readRatings();
        currentRatings.unshift(newEntry);
        saveRatings(currentRatings);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          success: true, 
          message: 'บันทึกคะแนนความพึงพอใจเรียบร้อยแล้ว ขอขอบคุณสำหรับความคิดเห็น',
          data: newEntry 
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Invalid JSON request payload' }));
      }
    });
    return;
  }

  // 2. Get ratings & statistics: GET /api/ratings
  if (pathname === '/api/ratings' && method === 'GET') {
    const ratings = readRatings();
    const totalCount = ratings.length;
    const totalScore = ratings.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
    const averageScore = totalCount > 0 ? (totalScore / totalCount).toFixed(2) : '0.00';
    
    // Distribution breakdown (1-5 stars)
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      if (distribution[r.score] !== undefined) {
        distribution[r.score]++;
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      stats: {
        total: totalCount,
        average: Number(averageScore),
        distribution: distribution
      },
      ratings: ratings
    }));
  }

  // 3. Clear ratings: DELETE /api/ratings
  if (pathname === '/api/ratings' && method === 'DELETE') {
    saveRatings([]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'ลบข้อมูลการประเมินทั้งหมดแล้ว' }));
  }

  // --- STATIC FILE SERVING ---
  let safePath = pathname === '/' ? '/index.html' : pathname;
  // Normalize and resolve path to prevent directory traversal
  const filePath = path.join(PUBLIC_DIR, path.normalize(safePath).replace(/^(\.\.[\/\\])+/, ''));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>404 - ไม่พบหน้าที่ต้องการ</h2>
          <p><a href="/">กลับสู่หน้าหลักระบบให้คะแนนความพึงพอใจ</a></p>
        </div>
      `);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Server Error');
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SKRU Satisfaction Rating Server is running!`);
  console.log(`👉 Form URL:  http://localhost:${PORT}`);
  console.log(`👉 Admin URL: http://localhost:${PORT}/admin.html`);
  console.log(`👉 API URL:   http://localhost:${PORT}/api/ratings`);
  console.log(`====================================================`);
});
