/**
 * SKRU Unified Portal Server
 * Serves all 20 student services and unified portal APIs
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve root static files (index.html, check-in.html, etc.)
app.use(express.static(path.join(__dirname)));

// Serve modules
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// ========== Shared / Mock API Endpoints for Modules ==========

// 1. Students / Auth mock
const mockStudents = [
  { id: '6530100001', name: 'นาย.กรรณพัต วังค้อม', faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี', major: 'วิทยาการคอมพิวเตอร์', year: 3, gpa: '3.65', status: 'ปกติ' },
  { id: '6530100002', name: 'นางสาว.สมฤดี ใจดี', faculty: 'คณะครุศาสตร์', major: 'ภาษาอังกฤษ', year: 2, gpa: '3.80', status: 'ปกติ' }
];

app.get('/api/students', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  if (query) {
    return res.json(mockStudents.filter(s => s.id.includes(query) || s.name.toLowerCase().includes(query)));
  }
  res.json(mockStudents);
});

app.get('/api/students/:id', (req, res) => {
  const s = mockStudents.find(st => st.id === req.params.id);
  if (s) return res.json({ success: true, data: s });
  res.json({
    success: true,
    data: { id: req.params.id, name: `นักศึกษา รหัส ${req.params.id}`, faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี', major: 'เทคโนโลยีสารสนเทศ', year: 3 }
  });
});

// 2. Check-in Class mock API (Branch 035)
let checkInCourse = {
  id: 'CS3102',
  name: 'การพัฒนาเว็บแอปพลิเคชันขั้นสูง (Advanced Web Application)',
  lecturer: 'ผศ.ดร. อาจารย์ผู้สอน',
  room: 'Lab 402 อาคาร 14',
  isOpen: true,
  code: '8942'
};

app.get('/api/course', (req, res) => res.json(checkInCourse));
app.post('/api/check-in', (req, res) => {
  res.json({ success: true, message: 'บันทึกการเช็คชื่อเข้าชั้นเรียนสำเร็จ', timestamp: new Date().toISOString() });
});

// 3. Tuition Fees API (Branch 045)
app.get('/api/fees/:studentId', (req, res) => {
  res.json({
    success: true,
    data: [{
      id: 'FEE001',
      studentId: req.params.studentId,
      semester: '1/2569',
      description: 'ค่าธรรมเนียมการศึกษา ภาคเรียนที่ 1/2569',
      refCode1: '1234620311123485687',
      refCode2: '1234620311123485175',
      amount: 11000.00,
      status: 'pending',
      dueDate: '30 พ.ย. 2569'
    }]
  });
});

app.post('/api/payment', (req, res) => {
  const { feeId, studentId, paymentMethod } = req.body;
  res.json({
    success: true,
    message: 'ชำระเงินสำเร็จ',
    data: {
      id: 'PAY' + Date.now(),
      feeId,
      studentId,
      paymentMethod,
      amount: 11000.00,
      paidAt: new Date().toISOString(),
      transactionRef: 'TXN' + Math.random().toString(36).substring(2, 10).toUpperCase()
    }
  });
});

// 4. University News API (Branch 041)
app.get('/api/news', (req, res) => {
  const newsPath = path.join(__dirname, 'modules/news/data/news.json');
  if (fs.existsSync(newsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(newsPath, 'utf8'));
      return res.json(data);
    } catch (e) {}
  }
  res.json([
    { id: 1, title: 'ประกาศกำหนดการลงทะเบียนเรียน ภาคเรียนที่ 1/2569', date: '2026-10-01', category: 'วิชาการ' },
    { id: 2, title: 'รับสมัครทุนการศึกษาเพื่อการศึกษามหาวิทยาลัยราชภัฏสงขลา', date: '2026-09-28', category: 'ทุนการศึกษา' }
  ]);
});

// 5. Faculty Appointments (Branch 030)
app.get('/api/teachers', (req, res) => {
  const teacherPath = path.join(__dirname, 'modules/faculty-contact/data/teacher.json');
  if (fs.existsSync(teacherPath)) {
    try {
      return res.json(JSON.parse(fs.readFileSync(teacherPath, 'utf8')));
    } catch (e) {}
  }
  res.json([]);
});

// Fallback for direct page routing
app.get('/:page.html', (req, res, next) => {
  const filePath = path.join(__dirname, `${req.params.page}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// Start Server
app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🎓 SKRU Unified Portal is running at: http://localhost:${PORT}`);
  console.log('📋 Available Services:');
  console.log('   - Portal Hub:         http://localhost:' + PORT + '/index.html');
  console.log('   - 035 Check-in:       http://localhost:' + PORT + '/check-in.html');
  console.log('   - 051 Profile:        http://localhost:' + PORT + '/student-profile.html');
  console.log('   - 045 Tuition Fee:    http://localhost:' + PORT + '/tuition-fee.html');
  console.log('   - 028 Student Card:   http://localhost:' + PORT + '/student-card.html');
  console.log('   - 042 Grades:         http://localhost:' + PORT + '/academic-record.html');
  console.log('   - 032 Campus Map:     http://localhost:' + PORT + '/campus-map.html');
  console.log('   - 044 Student Loan:   http://localhost:' + PORT + '/student-loan.html');
  console.log('   - 043 Booking:        http://localhost:' + PORT + '/booking.html');
  console.log('   - 030 Faculty:        http://localhost:' + PORT + '/faculty-contact.html');
  console.log('   - 041 News:           http://localhost:' + PORT + '/news.html');
  console.log('   - 029 Resources:      http://localhost:' + PORT + '/learning-resources.html');
  console.log('   - 039 Dorm:           http://localhost:' + PORT + '/dorm-booking.html');
  console.log('   - 046 Event Booking:  http://localhost:' + PORT + '/event-booking.html');
  console.log('   - 040 Privacy:        http://localhost:' + PORT + '/privacy-settings.html');
  console.log('   - 048 Calendar:       http://localhost:' + PORT + '/academic-calendar.html');
  console.log('   - 027 Login:          http://localhost:' + PORT + '/login.html');
  console.log('   - 049 Settings:       http://localhost:' + PORT + '/settings.html');
  console.log('   - 033 Vote:           http://localhost:' + PORT + '/vote.html');
  console.log('   - 050 Rewards:        http://localhost:' + PORT + '/rewards.html');
  console.log('   - 047 Library:        http://localhost:' + PORT + '/library.html');
  console.log('========================================================');
});
