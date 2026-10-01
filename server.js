const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const mapRoutes = require('./routes/map');
const { apiRateLimiter } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. HTTP Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        // แผนที่ (/map): โหลดแผนที่พื้นหลังจาก OpenFreeMap
        connectSrc: ["'self'", "https://tiles.openfreemap.org"],
        // แผนที่ (/map): MapLibre ใช้ Web Worker แบบ blob
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'", "blob:"],
        // แผนที่ (/map): ภาพ 360° ของมหาวิทยาลัย
        frameSrc: ["'self'", "https://kuula.co"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// 2. CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// 3. Body parsers with payload limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// 4. Cookie parser
app.use(cookieParser());

// 5. Global API Rate Limiter
app.use('/api/', apiRateLimiter);

// 6. Serve static files from 'public' directory
//    (หน้าแผนที่อยู่ที่ public/map → เปิดได้ที่ /map/)
app.use(express.static(path.join(__dirname, 'public')));

// 7. Mount Auth Routes
app.use('/api/auth', authRoutes);

// 7.1 Mount Campus Map API (ระบบแผนที่มหาวิทยาลัย)
app.use('/api/map', mapRoutes);

// 8. Specific Page Routes (2 Separate Pages + Dashboard)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/welcome', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 9. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง'
  });
});

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 SKRU Digital 2-Page System running at http://localhost:${PORT}`);
  console.log(`📄 Page 1 (Welcome): http://localhost:${PORT}/`);
  console.log(`📄 Page 2 (Login):   http://localhost:${PORT}/login`);
  console.log(`📊 Dashboard:        http://localhost:${PORT}/dashboard`);
  console.log(`🗺️  Campus Map:       http://localhost:${PORT}/map/`);
  console.log(`🔒 Security Protections: OWASP Hardening Active`);
  console.log('====================================================');
});
