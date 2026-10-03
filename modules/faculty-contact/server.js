/**
 * SKRU Teacher Appointment System - Backend Server
 * Written in Node.js (with built-in HTTP server fallback + Express support)
 * No external dependencies required to run!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const TEACHER_FILE = path.join(DATA_DIR, 'teacher.json');

// Ensure data folder and default files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Request Handler
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Helper for JSON response
  const sendJSON = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  };

  // Helper to read request body
  const getBody = () => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  };

  // --- API ROUTES ---

  // 1. GET /api/teacher -> Get Teacher Profile & Availability
  if (pathname === '/api/teacher' && req.method === 'GET') {
    const teacher = readJSON(TEACHER_FILE, {
      id: "T001",
      name: "MR.Panukorn",
      faculty: "คณะวิทยาศาสตร์และเทคโนโลยี",
      status: "พร้อมให้เข้าพบ",
      isAvailable: true,
      consultationHours: "จันทร์, พุธ 13:00 - 16:00 น."
    });
    return sendJSON(200, { success: true, data: teacher });
  }

  // 2. PUT /api/teacher -> Update Teacher Profile or Status
  if (pathname === '/api/teacher' && req.method === 'PUT') {
    return getBody().then(body => {
      const current = readJSON(TEACHER_FILE, {});
      const updated = { ...current, ...body };
      writeJSON(TEACHER_FILE, updated);
      return sendJSON(200, { success: true, message: 'บันทึกข้อมูลอาจารย์สำเร็จ', data: updated });
    }).catch(err => sendJSON(400, { success: false, error: 'ข้อมูลไม่ถูกต้อง' }));
  }

  // 3. GET /api/appointments -> List all or filter by studentId / query
  if (pathname === '/api/appointments' && req.method === 'GET') {
    const appointments = readJSON(APPOINTMENTS_FILE, []);
    const { studentId, status, id } = parsedUrl.query;

    let filtered = [...appointments];
    if (id) {
      filtered = filtered.filter(a => a.id.toLowerCase() === id.toLowerCase());
    }
    if (studentId) {
      filtered = filtered.filter(a => a.studentId && a.studentId.includes(studentId));
    }
    if (status && status !== 'ALL') {
      filtered = filtered.filter(a => a.status === status);
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sendJSON(200, { success: true, count: filtered.length, data: filtered });
  }

  // 4. POST /api/appointments -> Create new appointment request
  if (pathname === '/api/appointments' && req.method === 'POST') {
    return getBody().then(body => {
      const { studentName, studentId, contact, date, time, topic } = body;

      if (!studentName || !studentId || !date || !time || !topic) {
        return sendJSON(400, {
          success: false,
          error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่องที่มีเครื่องหมายดอกจัน (*)'
        });
      }

      const appointments = readJSON(APPOINTMENTS_FILE, []);
      const teacher = readJSON(TEACHER_FILE, { name: "MR.Panukorn" });

      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSeq = Math.floor(100 + Math.random() * 900);
      const newId = `APT-${dateCode}-${randomSeq}`;

      const newAppointment = {
        id: newId,
        studentName: studentName.trim(),
        studentId: studentId.trim(),
        contact: contact ? contact.trim() : studentId.trim(),
        date: date,
        time: time,
        topic: topic.trim(),
        teacherId: teacher.id || "T001",
        teacherName: teacher.name || "MR.Panukorn",
        status: "PENDING", // PENDING | APPROVED | REJECTED | CANCELLED
        teacherNote: "",
        createdAt: new Date().toISOString()
      };

      appointments.unshift(newAppointment);
      writeJSON(APPOINTMENTS_FILE, appointments);

      return sendJSON(201, {
        success: true,
        message: 'ส่งคำขอนัดหมายเข้าพบเรียบร้อยแล้ว',
        data: newAppointment
      });
    }).catch(err => {
      return sendJSON(400, { success: false, error: 'ข้อมูลไม่ถูกต้อง: ' + err.message });
    });
  }

  // 5. PATCH /api/appointments/:id -> Update appointment status or note (Teacher action)
  if (pathname.startsWith('/api/appointments/') && (req.method === 'PATCH' || req.method === 'PUT')) {
    const aptId = pathname.replace('/api/appointments/', '');
    return getBody().then(body => {
      const appointments = readJSON(APPOINTMENTS_FILE, []);
      const index = appointments.findIndex(a => a.id.toLowerCase() === aptId.toLowerCase());

      if (index === -1) {
        return sendJSON(404, { success: false, error: 'ไม่พบข้อมูลคำขอนัดหมาย' });
      }

      const { status, teacherNote } = body;
      if (status) appointments[index].status = status;
      if (teacherNote !== undefined) appointments[index].teacherNote = teacherNote;
      appointments[index].updatedAt = new Date().toISOString();

      writeJSON(APPOINTMENTS_FILE, appointments);

      return sendJSON(200, {
        success: true,
        message: 'อัปเดตสถานะคำขอนัดหมายสำเร็จ',
        data: appointments[index]
      });
    }).catch(err => {
      return sendJSON(400, { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดต' });
    });
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // If path doesn't have an extension, try appending .html
  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath += '.html';
    }
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Return 404 page or index.html for SPA
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err404, defaultContent) => {
          if (err404) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(defaultContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🚀 SKRU Appointment System Server is running!`);
  console.log(`📱 Student Portal: http://localhost:${PORT}`);
  console.log(`👨‍🏫 Teacher/Admin Portal: http://localhost:${PORT}/admin.html`);
  console.log('==================================================');
});
