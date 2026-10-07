/**
 * 🎓 SKRU UNIFIED SUPERAPP PORTAL SERVER (ระบบเทพระดับมหาวิทยาลัย)
 * มหาวิทยาลัยราชภัฏสงขลา (Songkhla Rajabhat University)
 * 
 * Integrated Backend supporting all 20 University Digital Services:
 * 01. 035 Check-in class          -> check-in.html
 * 02. 051 Student profile         -> student-profile.html (alias: profile.html)
 * 03. 045 Tuition Fee             -> tuition-fee.html (alias: payment.html)
 * 04. 028 Student Card            -> student-card.html (alias: card.html)
 * 05. 042 Academic Record / GPA   -> academic-record.html (alias: grades.html)
 * 06. 032 Campus Map              -> campus-map.html (alias: map.html)
 * 07. 044 Student Loan (กยศ.)     -> student-loan.html
 * 08. 043 Booking & Equipment     -> booking.html (alias: reservation.html)
 * 09. 030 Faculty Appointments    -> faculty-contact.html (alias: contact.html)
 * 10. 041 University News         -> news.html
 * 11. 029 Learning Resources      -> learning-resources.html
 * 12. 039 Dormitory Booking       -> dorm-booking.html
 * 13. 046 Event & Activity Reg    -> event-booking.html (alias: activities.html)
 * 14. 040 Privacy & PDPA          -> privacy-settings.html (alias: privacy.html)
 * 15. 048 Academic Calendar       -> academic-calendar.html
 * 16. 027 Authentication (Login)  -> login.html
 * 17. 049 System Settings         -> settings.html
 * 18. 033 Vote & Satisfaction     -> vote.html
 * 19. 050 Student Rewards         -> rewards.html (alias: redeem.html)
 * 20. 047 Central Library OPAC    -> library.html
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Utility: Safe JSON File Read/Write
function readJsonSafe(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      if (defaultValue !== undefined) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
      }
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

function writeJsonSafe(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

// =========================================================================
// 0. STATIC ASSETS & DIRECT MODULE ROUTING
// =========================================================================
app.use(express.static(path.join(__dirname)));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// Serve module-specific uploads and public assets directly if requested
app.use('/uploads', express.static(path.join(__dirname, 'modules/student-profile/public/uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'modules/student-card/public/uploads')));
app.use('/assets', express.static(path.join(__dirname, 'modules/student-card/public/assets')));
app.use('/assets', express.static(path.join(__dirname, 'modules/student-profile/public/assets')));
app.use('/assets', express.static(path.join(__dirname, 'modules/rewards/public/assets')));

// =========================================================================
// 1. AUTHENTICATION & SECURITY (Branch 027)
// =========================================================================
const authUsers = [
  {
    id: 'std_674295027',
    studentId: '674295027',
    email: '674295027@parichat.skru.ac.th',
    username: '674295027',
    nameTitle: 'นาย',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    fullName: 'นายสมชาย ใจดี',
    role: 'student',
    roleLabel: 'นักศึกษา (Student)',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    facultyEn: 'Faculty of Science and Technology',
    major: 'สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล (ITDI)',
    year: 'ปี 3',
    gpa: '3.78',
    status: 'กำลังศึกษา (Active)',
    avatarColor: '#c8102e',
    password: 'Skru@2026!'
  },
  {
    id: 'staff_somchai',
    studentId: null,
    email: 'somchai.k@skru.ac.th',
    username: 'somchai.k',
    nameTitle: 'ผศ.ดร.',
    firstName: 'สมชาย',
    lastName: 'การุณย์',
    fullName: 'ผศ.ดร.สมชาย การุณย์',
    role: 'staff',
    roleLabel: 'อาจารย์ / บุคลากร (Staff)',
    department: 'สาขาวิชาเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล',
    departmentEn: 'Department of Information Technology and Digital Innovation',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    position: 'อาจารย์ประจำหลักสูตร / หัวหน้าฝ่ายพัฒนาระบบดิจิทัล',
    status: 'ปฏิบัติงาน (Active)',
    avatarColor: '#e65c00',
    password: 'Staff@2026!'
  }
];

let activeSessions = new Map();

app.get('/api/auth/csrf', (req, res) => {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie('XSRF-TOKEN', token, { httpOnly: false, sameSite: 'lax', maxAge: 3600000 });
  res.json({ success: true, csrfToken: token });
});

app.post('/api/auth/login', (req, res) => {
  const id = req.body.identifier || req.body.username || req.body.email || req.body.studentId;
  const { role, password } = req.body;
  const user = authUsers.find(u => 
    (u.studentId === id || u.username === id || u.email === id) &&
    (u.password === password || password === '1234' || password === 'demo')
  );

  // If credentials match or demo login
  if (user) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, user);
    res.cookie('auth_session', sessionToken, { httpOnly: true, maxAge: 86400000 });
    return res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ ยินดีต้อนรับสู่ SKRU SuperApp',
      user: {
        id: user.id,
        studentId: user.studentId,
        fullName: user.fullName,
        role: user.role,
        roleLabel: user.roleLabel,
        faculty: user.faculty,
        major: user.major,
        year: user.year,
        gpa: user.gpa,
        status: user.status
      }
    });
  }

  // Check if known account had wrong password
  const knownUser = authUsers.find(u => u.studentId === id || u.username === id || u.email === id);
  if (knownUser) {
    return res.status(401).json({
      success: false,
      message: 'รหัสประจำตัว หรือ รหัสผ่านไม่ถูกต้อง (ทดสอบ: 674295027 / Skru@2026!)'
    });
  }

  // Graceful fallback for new demo accounts
  if (id && password && password.length >= 4) {
    const mockUser = {
      id: 'demo_' + id,
      studentId: id,
      fullName: `นักศึกษา รหัส ${id}`,
      role: role || 'student',
      roleLabel: 'นักศึกษา (Student)',
      faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
      major: 'เทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล',
      year: 'ปี 3',
      gpa: '3.65',
      status: 'กำลังศึกษา (Active)'
    };
    return res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ (โหมดสาธิต)',
      user: mockUser
    });
  }

  res.status(401).json({
    success: false,
    message: 'รหัสประจำตัว หรือ รหัสผ่านไม่ถูกต้อง (ทดสอบ: 674295027 / Skru@2026!)'
  });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.auth_session;
  const user = activeSessions.get(token) || authUsers[0];
  res.json({ success: true, user });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies.auth_session;
  if (token) activeSessions.delete(token);
  res.clearCookie('auth_session');
  res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
});

app.post('/api/auth/forgot-password', (req, res) => {
  res.json({
    success: true,
    message: 'ระบบได้ส่งรหัส OTP สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของท่านแล้ว'
  });
});

// =========================================================================
// 2. STUDENT PROFILE & ACADEMIC RECORD (Branch 051 & 042)
// =========================================================================
const PROFILE_FILE = path.join(__dirname, 'modules/student-profile/data/student.json');
const DEFAULT_STUDENT_PROFILE = {
  nameTh: "นายสมชาย ใจดี",
  nameEn: "MR. SOMCHAI JAIDEE",
  studentType: "นักศึกษาภาคปกติ",
  studentId: "674295027",
  faculty: "คณะวิทยาศาสตร์และเทคโนโลยี",
  major: "สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล (ITDI)",
  degreeLevel: "ปริญญาตรี 4 ปี",
  yearLevel: "ปีที่ 3",
  birthDate: "12 มกราคม 2547",
  phone: "081-234-5678",
  email: "674295027@parichat.skru.ac.th",
  address: "123/45 หมู่ 6 ต.เขารูปช้าง อ.เมืองสงขลา จ.สงขลา 90000",
  curriculum: "วิทยาศาสตรบัณฑิต (วท.บ.)",
  admissionYear: "2566",
  status: "ปกติ",
  gpa: "3.82",
  avatarUrl: "assets/avatar.png"
};

app.get('/api/student', (req, res) => {
  const data = readJsonSafe(PROFILE_FILE, DEFAULT_STUDENT_PROFILE);
  // Dual-format payload to satisfy BOTH student-profile.html and academic-record.html!
  res.json({
    success: true,
    data: data,
    name: data.nameTh,
    id: data.studentId,
    faculty: data.faculty,
    major: data.major,
    status: data.status,
    totalCredits: 96,
    requiredCredits: 132,
    currentGpa: parseFloat(data.gpa) || 3.78,
    lastTermGpa: 3.82
  });
});

app.put('/api/student', (req, res) => {
  const current = readJsonSafe(PROFILE_FILE, DEFAULT_STUDENT_PROFILE);
  const updated = { ...current, ...req.body };
  writeJsonSafe(PROFILE_FILE, updated);
  res.json({ success: true, message: 'บันทึกข้อมูลเรียบร้อยแล้ว', data: updated });
});

app.post('/api/student/photo', (req, res) => {
  const { imageBase64 } = req.body;
  const current = readJsonSafe(PROFILE_FILE, DEFAULT_STUDENT_PROFILE);
  if (!imageBase64) {
    current.avatarUrl = null;
    writeJsonSafe(PROFILE_FILE, current);
    return res.json({ success: true, message: 'รีเซ็ตรูปภาพเรียบร้อยแล้ว', avatarUrl: null });
  }

  try {
    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    const ext = matches && matches[1] === 'jpeg' ? 'jpg' : (matches ? matches[1] : 'png');
    const base64Data = matches ? matches[2] : imageBase64;
    const fileName = `student_${Date.now()}.${ext}`;
    const uploadDir = path.join(__dirname, 'modules/student-profile/public/uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, fileName), Buffer.from(base64Data, 'base64'));

    current.avatarUrl = `uploads/${fileName}`;
    writeJsonSafe(PROFILE_FILE, current);
    res.json({ success: true, message: 'อัปเดตรูปถ่ายนักศึกษาสำเร็จ', avatarUrl: current.avatarUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
  }
});

app.post('/api/student/reset', (req, res) => {
  writeJsonSafe(PROFILE_FILE, DEFAULT_STUDENT_PROFILE);
  res.json({ success: true, message: 'รีเซ็ตข้อมูลเป็นค่าเริ่มต้นเรียบร้อยแล้ว', data: DEFAULT_STUDENT_PROFILE });
});

// Academic Record: Terms & Advisor Message
const academicTerms = [
  {
    id: '1/66',
    term: 'ภาคเรียนที่ 1/2566',
    credits: '18 หน่วยกิต',
    subjects: '5 รายวิชา',
    gpa: '3.82',
    highlight: 'ล่าสุด',
    courses: [
      ['การเขียนโปรแกรมบนเว็บขั้นสูง', 'A'],
      ['การออกแบบประสบการณ์ผู้ใช้ (UX/UI)', 'A'],
      ['ระบบฐานข้อมูลและการจัดการ', 'B+'],
      ['คณิตศาสตร์สำหรับคอมพิวเตอร์', 'A'],
      ['ภาษาอังกฤษเพื่อการสื่อสารทางวิชาชีพ', 'B+']
    ]
  },
  {
    id: '2/65',
    term: 'ภาคเรียนที่ 2/2565',
    credits: '19 หน่วยกิต',
    subjects: '5 รายวิชา',
    gpa: '3.65',
    courses: [
      ['โครงสร้างข้อมูลและอัลกอริทึม', 'B+'],
      ['การวิเคราะห์และออกแบบระบบ', 'A'],
      ['การจัดการโครงการซอฟต์แวร์', 'B+'],
      ['การสื่อสารในองค์กร', 'A'],
      ['สถิติสำหรับงานวิจัยและวิทยาการข้อมูล', 'B']
    ]
  },
  {
    id: '1/65',
    term: 'ภาคเรียนที่ 1/2565',
    credits: '21 หน่วยกิต',
    subjects: '4 รายวิชา',
    gpa: '3.58',
    courses: [
      ['วิทยาการคอมพิวเตอร์เบื้องต้น', 'A'],
      ['ระบบปฏิบัติการและสถาปัตยกรรม', 'B+'],
      ['การคิดเชิงคำนวณและตรรกศาสตร์', 'A'],
      ['ภาษาอังกฤษในชีวิตประจำวัน', 'B+']
    ]
  }
];

app.get('/api/terms', (req, res) => res.json(academicTerms));
app.get('/api/advisor-message', (req, res) => res.json({ 
  message: 'ขอแสดงความยินดีกับผลการเรียนที่ดีขึ้นอย่างต่อเนื่องในภาคเรียนล่าสุด ขอให้ตั้งใจรักษามาตรฐานความเป็นเลิศนี้ต่อไปครับ' 
}));

// Course & Term Translations for Standard Type-1 PDF Rendering
const courseTranslationMap = {
  'การเขียนโปรแกรมบนเว็บขั้นสูง': 'ITDI3101 Advanced Web Programming',
  'การออกแบบประสบการณ์ผู้ใช้ (UX/UI)': 'ITDI3102 User Experience & UI Design (UX/UI)',
  'ระบบฐานข้อมูลและการจัดการ': 'ITDI2103 Database Systems and Management',
  'คณิตศาสตร์สำหรับคอมพิวเตอร์': 'MATH1105 Mathematics for Computing',
  'ภาษาอังกฤษเพื่อการสื่อสารทางวิชาชีพ': 'GEN1201 English for Professional Comm.',
  'โครงสร้างข้อมูลและอัลกอริทึม': 'ITDI2101 Data Structures and Algorithms',
  'การวิเคราะห์และออกแบบระบบ': 'ITDI2102 Systems Analysis and Design',
  'การจัดการโครงการซอฟต์แวร์': 'ITDI3201 Software Project Management',
  'การสื่อสารในองค์กร': 'GEN2102 Organizational Communication',
  'สถิติสำหรับงานวิจัยและวิทยาการข้อมูล': 'STAT1101 Statistics for Data Science',
  'วิทยาการคอมพิวเตอร์เบื้องต้น': 'ITDI1101 Introduction to Computer Science',
  'ระบบปฏิบัติการและสถาปัตยกรรม': 'ITDI1102 Operating Systems & Computer Architecture',
  'การคิดเชิงคำนวณและตรรกศาสตร์': 'ITDI1103 Computational Thinking and Logic',
  'ภาษาอังกฤษในชีวิตประจำวัน': 'GEN1101 Everyday English Communication'
};

const termTranslationMap = {
  '1/66': 'Semester 1/2023 (Term 1/2566)',
  '2/65': 'Semester 2/2022 (Term 2/2565)',
  '1/65': 'Semester 1/2022 (Term 1/2565)',
  'ภาคเรียนที่ 1/2566': 'Semester 1/2023 (Term 1/2566)',
  'ภาคเรียนที่ 2/2565': 'Semester 2/2022 (Term 2/2565)',
  'ภาคเรียนที่ 1/2565': 'Semester 1/2022 (Term 1/2565)'
};

// Pure Node.js Standard PDF-1.4 Generator for Official Academic Report
function generateOfficialPdfBuffer(student, terms) {
  const objects = [];
  function addObject(content) {
    objects.push(content);
    return objects.length;
  }
  function clean(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  const streamLines = [];
  function rect(x, y, w, h, r, g, b, fill = true, stroke = false) {
    streamLines.push(`${r} ${g} ${b} ${fill ? 'rg' : 'RG'} ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${fill && stroke ? 'B' : (fill ? 'f' : 'S')}`);
  }
  function line(x1, y1, x2, y2, r = 0.8, g = 0.8, b = 0.8, w = 1) {
    streamLines.push(`${w} w ${r} ${g} ${b} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }
  function text(str, x, y, font = 'F1', size = 11, r = 0.1, g = 0.1, b = 0.1) {
    streamLines.push(`BT /${font} ${size} Tf ${r} ${g} ${b} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${clean(str)}) Tj ET`);
  }

  const W = 595.28;
  const H = 841.89;

  // Header banner
  rect(0, H - 75, W, 75, 0.725, 0.11, 0.11);
  text('SONGKHLA RAJABHAT UNIVERSITY (SKRU)', 40, H - 35, 'F2', 16, 1, 1, 1);
  text('OFFICIAL ACADEMIC TRANSCRIPT & GRADE REPORT', 40, H - 55, 'F1', 11, 1, 0.9, 0.9);

  // Student Info Box
  rect(35, H - 195, W - 70, 105, 0.98, 0.98, 0.99, true, false);
  rect(35, H - 195, W - 70, 105, 0.85, 0.87, 0.90, false, true);

  text('STUDENT INFORMATION', 50, H - 110, 'F2', 11.5, 0.725, 0.11, 0.11);
  text(`Name: ${student.nameEn || 'MR. SOMCHAI JAIDEE'}`, 50, H - 130, 'F1', 10);
  text(`Student ID: ${student.studentId || student.id || '674295027'}`, 330, H - 130, 'F2', 10.5, 0.725, 0.11, 0.11);

  text(`Faculty: ${student.facultyEn || 'Faculty of Science and Technology'}`, 50, H - 150, 'F1', 9.5);
  text(`Major: ${student.majorEn || 'Digital Innovation and Technology (ITDI)'}`, 330, H - 150, 'F1', 9.5);

  text(`Degree: Bachelor of Science (B.Sc.) - 4 Years`, 50, H - 170, 'F1', 9.5);
  text(`Status: Active (Studying)`, 330, H - 170, 'F2', 9.5, 0.08, 0.52, 0.24);

  text(`Cumulative GPAX: 3.82  (First Class Honors)`, 50, H - 188, 'F2', 10, 0.725, 0.11, 0.11);
  text(`Credits Completed: 96 / 132 Credits (73%)`, 330, H - 188, 'F2', 10, 0.08, 0.52, 0.24);

  // Table of Terms
  let curY = H - 220;
  text('ACADEMIC TERM RECORDS', 40, curY, 'F2', 12, 0.1, 0.15, 0.2);
  curY -= 14;

  (terms || []).forEach((t) => {
    if (curY < 120) return;
    const termTitle = termTranslationMap[t.id] || termTranslationMap[t.term] || `Semester ${t.id || t.term}`;
    const creditsNum = (t.credits || '').match(/\d+/)?.[0] || '18';

    // 1. Term Header Bar (Height 20)
    rect(35, curY - 20, W - 70, 20, 0.94, 0.96, 0.98);
    text(termTitle, 45, curY - 14, 'F2', 9.5, 0.1, 0.15, 0.2);
    text(`Term GPA: ${t.gpa} | Credits: ${creditsNum}.0 Credits`, 365, curY - 14, 'F2', 9.5, 0.725, 0.11, 0.11);
    curY -= 20;

    // 2. Table Column Header Bar (Height 18)
    rect(35, curY - 18, W - 70, 18, 0.98, 0.92, 0.93);
    text('No.', 45, curY - 12.5, 'F2', 8.5, 0.6, 0.1, 0.1);
    text('Course Code & Title', 80, curY - 12.5, 'F2', 8.5, 0.6, 0.1, 0.1);
    text('Credits', 430, curY - 12.5, 'F2', 8.5, 0.6, 0.1, 0.1);
    text('Grade', 495, curY - 12.5, 'F2', 8.5, 0.6, 0.1, 0.1);
    curY -= 18;

    // 3. Course Rows
    (t.courses || []).forEach((c, idx) => {
      if (curY < 85) return;
      line(35, curY, W - 35, curY, 0.92, 0.92, 0.92);
      const courseTitle = courseTranslationMap[c[0]] || String(c[0]);

      text(`${idx + 1}`, 45, curY - 11.5, 'F1', 8.5, 0.4, 0.4, 0.4);
      text(courseTitle, 80, curY - 11.5, 'F1', 8.5, 0.1, 0.1, 0.1);
      text('3.0', 438, curY - 11.5, 'F1', 8.5, 0.3, 0.3, 0.3);
      text(`${c[1]}`, 502, curY - 11.5, 'F2', 9.5, 0.725, 0.11, 0.11);
      curY -= 16;
    });
    curY -= 10;
  });

  line(35, 75, W - 35, 75, 0.75, 0.75, 0.75, 1);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  text(`Official Electronic Transcript issued via SKRU Portal on ${dateStr} ${timeStr} GMT+7.`, 40, 58, 'F1', 8, 0.45, 0.45, 0.45);
  text('Certified pursuant to Electronic Transactions Act B.E. 2544 (2001).', 40, 46, 'F1', 7.5, 0.55, 0.55, 0.55);
  text('Registrar / Songkhla Rajabhat University', 370, 46, 'F2', 8.5, 0.2, 0.2, 0.2);

  const streamContent = streamLines.join('\n');
  const streamLen = Buffer.byteLength(streamContent, 'utf8');

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj';
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 6 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> >>\nendobj`;
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj';
  const obj6 = `6 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj`;

  const allObjs = [obj1, obj2, obj3, obj4, obj5, obj6];

  let header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = '';
  const offsets = [];

  let currentOffset = Buffer.byteLength(header, 'utf8');
  for (let i = 0; i < allObjs.length; i++) {
    offsets.push(currentOffset);
    const chunk = allObjs[i] + '\n';
    body += chunk;
    currentOffset += Buffer.byteLength(chunk, 'utf8');
  }

  const startxref = currentOffset;
  let xref = `xref\n0 ${allObjs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = `trailer\n<< /Size ${allObjs.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;

  return Buffer.from(header + body + xref + trailer, 'latin1');
}

app.get('/api/report/pdf', (req, res) => {
  const student = readJsonSafe(PROFILE_FILE, DEFAULT_STUDENT_PROFILE);
  const pdfBuffer = generateOfficialPdfBuffer(student, academicTerms);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="SKRU_Grade_Report_${student.studentId || '674295027'}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  return res.end(pdfBuffer);
});

app.get('/api/report', (req, res) => {
  const student = readJsonSafe(PROFILE_FILE, DEFAULT_STUDENT_PROFILE);
  const { format } = req.query;

  if (format === 'pdf' || req.query.download === 'pdf' || req.query.download === '1') {
    const pdfBuffer = generateOfficialPdfBuffer(student, academicTerms);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SKRU_Grade_Report_${student.studentId || '674295027'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  }

  if (format === 'json') {
    return res.json({
      success: true,
      student,
      terms: academicTerms,
      gpax: 3.82,
      creditsPassed: 96,
      requiredCredits: 132
    });
  }

  if (format === 'text') {
    const body = [
      '====================================================',
      '🎓 มหาวิทยาลัยราชภัฏสงขลา (Songkhla Rajabhat University)',
      'รายงานผลการศึกษาอย่างเป็นทางการ (Official Grade Report)',
      '====================================================',
      `ชื่อ-นามสกุล: ${student.nameTh}`,
      `รหัสนักศึกษา: ${student.studentId}`,
      `คณะ: ${student.faculty}`,
      `สาขาวิชา: ${student.major}`,
      `GPAX สะสม: 3.82`,
      `หน่วยกิตสะสม: 96 / 132 หน่วยกิต`,
      '----------------------------------------------------',
      ...academicTerms.map(t => `${t.term} | GPA: ${t.gpa} | ${t.credits}\n  ` + t.courses.map(c => `• ${c[0]} -> เกรด ${c[1]}`).join('\n  ')),
      '===================================================='
    ].join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="skru-academic-report.txt"');
    return res.send(body);
  }

  // Official HTML Print-Ready & PDF Document View
  const termsHtml = academicTerms.map(t => `
    <div style="margin-bottom: 18px;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <strong style="color: #0f172a; font-size: 14px;">${t.term}</strong>
        <span style="font-size: 13px; color: #b91c1c; font-weight: 700;">GPA: ${t.gpa} | ${t.credits}</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <thead>
          <tr style="background: #fff1f2; border-bottom: 2px solid #fecdd3;">
            <th style="padding: 6px 10px; font-size: 12px; color: #9f1239; width: 40px; text-align: center;">ลำดับ</th>
            <th style="padding: 6px 10px; font-size: 12px; color: #9f1239; text-align: left;">ชื่อรายวิชา (Course Title)</th>
            <th style="padding: 6px 10px; font-size: 12px; color: #9f1239; width: 80px; text-align: center;">หน่วยกิต</th>
            <th style="padding: 6px 10px; font-size: 12px; color: #9f1239; width: 80px; text-align: center;">ผลการเรียน</th>
          </tr>
        </thead>
        <tbody>
          ${t.courses.map((c, i) => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 7px 10px; font-size: 13px; color: #475569; text-align: center;">${i + 1}</td>
              <td style="padding: 7px 10px; font-size: 13px; color: #0f172a; font-weight: 500;">${c[0]}</td>
              <td style="padding: 7px 10px; font-size: 13px; color: #475569; text-align: center;">3.0</td>
              <td style="padding: 7px 10px; font-size: 13px; color: #b91c1c; font-weight: 700; text-align: center;">${c[1]}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ใบรายงานผลการศึกษา (Academic Transcript) - ${student.nameTh}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Prompt', 'Sarabun', sans-serif;
      background: #f1f5f9;
      margin: 0;
      padding: 24px;
      color: #1e293b;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .sheet {
      background: #ffffff;
      width: 100%;
      max-width: 800px;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      box-sizing: border-box;
    }
    .action-bar {
      width: 100%;
      max-width: 800px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-print {
      background: #b91c1c;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-print:hover { background: #991b1b; }
    .btn-back {
      background: #e2e8f0;
      color: #334155;
      text-decoration: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
    }
    @media print {
      body { background: white; padding: 0; }
      .action-bar { display: none !important; }
      .sheet { box-shadow: none; border-radius: 0; padding: 20px; width: 100%; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <a href="javascript:history.back()" class="btn-back">← กลับสู่แอป</a>
    <div style="display:flex; gap:10px; align-items:center;">
      <a href="/api/report?format=pdf" class="btn-print" style="background:#0284c7; text-decoration:none;">📥 ดาวน์โหลดไฟล์ PDF (.pdf)</a>
      <button onclick="window.print()" class="btn-print">🖨️ พิมพ์ / บันทึกเป็น PDF</button>
    </div>
  </div>
  <div class="sheet">
    <div style="text-align: center; border-bottom: 2px solid #b91c1c; padding-bottom: 14px; margin-bottom: 18px;">
      <div style="font-size: 32px; margin-bottom: 4px;">🎓</div>
      <h1 style="font-size: 22px; font-weight: 700; color: #b91c1c; margin: 0; line-height: 1.2;">มหาวิทยาลัยราชภัฏสงขลา</h1>
      <p style="font-size: 14px; color: #475569; margin: 2px 0 0 0; font-weight: 600;">SONGKHLA RAJABHAT UNIVERSITY</p>
      <p style="font-size: 13px; color: #64748b; margin: 2px 0 0 0;">สำนักส่งเสริมวิชาการและงานทะเบียน | ใบรายงานผลการศึกษาอย่างเป็นทางการ (Official Academic Transcript)</p>
    </div>

    <div style="background: #fdfaf0; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13.5px;">
        <div><strong style="color: #64748b;">ชื่อ-นามสกุล:</strong> <span style="color: #0f172a; font-weight: 600;">${student.nameTh}</span></div>
        <div><strong style="color: #64748b;">รหัสนักศึกษา:</strong> <span style="color: #b91c1c; font-weight: 700;">${student.studentId}</span></div>
        <div><strong style="color: #64748b;">คณะ:</strong> <span style="color: #0f172a;">${student.faculty}</span></div>
        <div><strong style="color: #64748b;">สาขาวิชา:</strong> <span style="color: #0f172a;">${student.major}</span></div>
        <div><strong style="color: #64748b;">ระดับการศึกษา:</strong> <span style="color: #0f172a;">ปริญญาตรี 4 ปี (ภาคปกติ)</span></div>
        <div><strong style="color: #64748b;">สถานภาพ:</strong> <span style="color: #15803d; font-weight: 700;">กำลังศึกษา (Active)</span></div>
      </div>
    </div>

    <div style="display: flex; gap: 14px; margin-bottom: 20px;">
      <div style="flex: 1; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 12px; text-align: center;">
        <span style="font-size: 12px; color: #9f1239; display: block; margin-bottom: 4px;">แต้มระดับเฉลี่ยสะสม (GPAX)</span>
        <strong style="font-size: 24px; color: #b91c1c;">3.82</strong>
        <small style="display: block; font-size: 11px; color: #9f1239; margin-top: 2px;">*เกียรตินิยมอันดับ 1</small>
      </div>
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; text-align: center;">
        <span style="font-size: 12px; color: #166534; display: block; margin-bottom: 4px;">หน่วยกิตสะสม / ความก้าวหน้า</span>
        <strong style="font-size: 24px; color: #15803d;">96 / 132</strong>
        <small style="display: block; font-size: 11px; color: #166534; margin-top: 2px;">(ผ่านแล้ว 73% ตามแผนการเรียน)</small>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 15px; color: #0f172a; margin-bottom: 10px; border-left: 4px solid #b91c1c; padding-left: 8px;">
        ประวัติผลการศึกษาตามภาคเรียน (Academic Term Records)
      </h3>
      ${termsHtml}
    </div>

    <div style="border-top: 1px solid #cbd5e1; padding-top: 16px; margin-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11.5px; color: #64748b;">
      <div>
        <p style="margin: 0;">เอกสารอิเล็กทรอนิกส์นี้ออกโดยระบบ SKRU Digital SuperApp Portal</p>
        <p style="margin: 2px 0 0 0;">มีผลรับรองตามพระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544</p>
      </div>
      <div style="text-align: center;">
        <div style="border-bottom: 1px dotted #94a3b8; width: 140px; margin-bottom: 4px;"></div>
        <p style="margin: 0; font-weight: 600; color: #334155;">นายทะเบียนมหาวิทยาลัย</p>
        <p style="margin: 0; font-size: 10px; color: #94a3b8;">Songkhla Rajabhat University</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// =========================================================================
// 3. CHECK-IN CLASS (Branch 035)
// =========================================================================
const CHECKIN_FILE = path.join(__dirname, 'modules/check-in/data.json');
let checkinData = readJsonSafe(CHECKIN_FILE, null);
if (!checkinData) {
  checkinData = {
    course: {
      code: "4663235",
      section: "01",
      name: "Human-Computer Interaction",
      credit: 3,
      teacher: "Mr.Panukorn Puripanyanon",
      dateTime: "TUE 08:00-12:00",
      room: "Lab.คอม301",
      isCheckInOpen: true,
      pinCode: "8899",
      requirePin: false,
      sessionDate: "2026-10-03",
      totalCapacity: 35
    },
    currentStudentId: "6401001",
    students: [
      { id: "6401001", name: "Ms.Rusnee yuda", faculty: "Faculty of Science", major: "Computer Science", email: "rusnee.y@university.ac.th", avatar: "👩‍🎓", isCheckedIn: false, checkInTime: null },
      { id: "6401002", name: "Ms.Ponthip phetmak", faculty: "Faculty of Science", major: "Computer Science", email: "ponthip.p@university.ac.th", avatar: "👩‍💻", isCheckedIn: true, checkInTime: "08:12:45" },
      { id: "6401003", name: "Ms.Pechjamas Sarasee", faculty: "Faculty of Science", major: "Information Technology", email: "pechjamas.s@university.ac.th", avatar: "👩‍🔬", isCheckedIn: true, checkInTime: "08:15:20" },
      { id: "6401004", name: "Ms.Alisa Kongphol", faculty: "Faculty of Science", major: "Computer Science", email: "alisa.k@university.ac.th", avatar: "👩‍🎓", isCheckedIn: false, checkInTime: null },
      { id: "6401005", name: "Mr.MuhammadSubhee Baraheng", faculty: "Faculty of Science", major: "Software Engineering", email: "muhammad.b@university.ac.th", avatar: "👨‍💻", isCheckedIn: true, checkInTime: "08:05:10" },
      { id: "6401006", name: "Ms.Thawinee Aiadkhay", faculty: "Faculty of Science", major: "Computer Science", email: "thawinee.a@university.ac.th", avatar: "👩‍🎓", isCheckedIn: false, checkInTime: null },
      { id: "6401007", name: "Mr.Kittisak Saelim", faculty: "Faculty of Science", major: "Information Technology", email: "kittisak.s@university.ac.th", avatar: "👨‍🔬", isCheckedIn: true, checkInTime: "08:22:04" }
    ],
    history: []
  };
  writeJsonSafe(CHECKIN_FILE, checkinData);
}

app.get('/api/course', (req, res) => {
  const d = readJsonSafe(CHECKIN_FILE, checkinData);
  const checkedInCount = d.students.filter(s => s.isCheckedIn).length;
  res.json({
    success: true,
    course: d.course,
    currentStudentId: d.currentStudentId,
    stats: {
      checkedInCount,
      totalCount: d.students.length,
      percentage: Math.round((checkedInCount / d.students.length) * 100)
    }
  });
});

app.post('/api/course/toggle-session', (req, res) => {
  const d = readJsonSafe(CHECKIN_FILE, checkinData);
  if (typeof req.body.isCheckInOpen === 'boolean') d.course.isCheckInOpen = req.body.isCheckInOpen;
  if (req.body.pinCode !== undefined) d.course.pinCode = req.body.pinCode;
  if (typeof req.body.requirePin === 'boolean') d.course.requirePin = req.body.requirePin;
  writeJsonSafe(CHECKIN_FILE, d);
  res.json({ success: true, message: d.course.isCheckInOpen ? "เปิดระบบเช็คชื่อแล้ว" : "ปิดระบบเช็คชื่อแล้ว", course: d.course });
});

app.post('/api/course/reset-session', (req, res) => {
  const d = readJsonSafe(CHECKIN_FILE, checkinData);
  d.students.forEach(s => { s.isCheckedIn = false; s.checkInTime = null; });
  writeJsonSafe(CHECKIN_FILE, d);
  res.json({ success: true, message: "เริ่มรอบเช็คชื่อใหม่เรียบร้อยแล้ว", students: d.students });
});

app.post('/api/check-in', (req, res) => {
  const d = readJsonSafe(CHECKIN_FILE, checkinData);
  const { studentId = d.currentStudentId, pin, action, status } = req.body;
  
  const student = d.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษาในระบบ' });
  }

  // Handle explicit uncheck or toggle
  const isUncheck = action === 'uncheck' || status === false || (action === 'toggle' && student.isCheckedIn);

  if (isUncheck) {
    student.isCheckedIn = false;
    student.checkInTime = null;
    writeJsonSafe(CHECKIN_FILE, d);
    return res.json({
      success: true,
      message: `ยกเลิกการเช็คชื่อ ${student.name} เรียบร้อยแล้ว (สถานะ: ไม่เช็ค)`,
      student,
      isCheckedIn: false
    });
  }

  // Handle Check In
  if (d.course.requirePin && pin && pin !== d.course.pinCode) {
    return res.status(400).json({ success: false, message: 'รหัส PIN เข้าเรียนไม่ถูกต้อง' });
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  student.isCheckedIn = true;
  student.checkInTime = timeString;
  writeJsonSafe(CHECKIN_FILE, d);
  return res.json({
    success: true,
    message: `เช็คชื่อเข้าชั้นเรียน ${student.name} สำเร็จ! (${timeString})`,
    student,
    isCheckedIn: true
  });
});

app.post(['/api/uncheck', '/api/check-out'], (req, res) => {
  const d = readJsonSafe(CHECKIN_FILE, checkinData);
  const { studentId = d.currentStudentId } = req.body;
  const student = d.students.find(s => s.id === studentId);
  if (student) {
    student.isCheckedIn = false;
    student.checkInTime = null;
    writeJsonSafe(CHECKIN_FILE, d);
    return res.json({
      success: true,
      message: `ยกเลิกการเช็คชื่อ ${student.name} เรียบร้อยแล้ว (สถานะ: ไม่เช็ค)`,
      student,
      isCheckedIn: false
    });
  }
  res.json({ success: true, message: 'ยกเลิกการเช็คชื่อสำเร็จ' });
});

app.get('/api/history', (req, res) => {
  const referer = req.headers.referer || '';
  const type = (req.query.type || '').toLowerCase();
  const isRewards = type === 'rewards' || type === 'redeem' || referer.includes('reward') || referer.includes('redeem');
  
  if (isRewards) {
    const rewardsFile = path.join(__dirname, 'modules/rewards/data/history.json');
    const defaultHist = [
      {
        id: "TXN-17281001",
        rewardId: "rw-01",
        rewardTitle: "กระเป๋าตรามหาวิทยาลัย (1 ชิ้น)",
        rewardImage: "/assets/backpack.jpg",
        coinsSpent: 350,
        couponCode: "SKRU-350-849201",
        qrData: "REDEEM:SKRU-350-849201:674295027",
        redeemedAt: "4 ต.ค. 2569 14:20 น.",
        status: "ACTIVE"
      }
    ];
    const list = readJsonSafe(rewardsFile, typeof rewardsHistory050 !== 'undefined' && rewardsHistory050.length ? rewardsHistory050 : defaultHist);
    return res.json({ success: true, history: list });
  }
  const d = readJsonSafe(CHECKIN_FILE, checkinData);
  res.json({ success: true, history: d.history || [] });
});

app.post('/api/user/switch', (req, res) => {
  const d = readJsonSafe(CHECKIN_FILE, checkinData);
  if (req.body.studentId) {
    d.currentStudentId = req.body.studentId;
    writeJsonSafe(CHECKIN_FILE, d);
  }
  res.json({ success: true, currentStudentId: d.currentStudentId });
});

app.post('/api/students/:id/toggle', (req, res) => {
  const d = readJsonSafe(CHECKIN_FILE, checkinData);
  const student = d.students.find(s => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: "ไม่พบนักศึกษา" });
  }
  student.isCheckedIn = !student.isCheckedIn;
  if (student.isCheckedIn) {
    const now = new Date();
    student.checkInTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } else {
    student.checkInTime = null;
  }
  writeJsonSafe(CHECKIN_FILE, d);
  res.json({
    success: true,
    message: student.isCheckedIn ? `เช็คชื่อ ${student.name} สำเร็จ` : `ยกเลิกเช็คชื่อ ${student.name} แล้ว (ไม่เช็ค)`,
    student,
    isCheckedIn: student.isCheckedIn
  });
});

app.get('/api/chat/:studentId', (req, res) => {
  res.json({ success: true, messages: [] });
});

app.post('/api/chat/:studentId', (req, res) => {
  res.json({ success: true, message: 'ส่งข้อความถึงอาจารย์เรียบร้อยแล้ว' });
});

// Universal Students API: Compatible with both 035 Check-in AND 028 Student Card
const CARD_STUDENTS_FILE = path.join(__dirname, 'modules/student-card/data/students.json');
app.get('/api/students', (req, res) => {
  const checkin = readJsonSafe(CHECKIN_FILE, checkinData);
  const cardStudents = readJsonSafe(CARD_STUDENTS_FILE, []);
  
  const query = (req.query.q || '').trim().toLowerCase();
  let list = cardStudents.length > 0 ? cardStudents : checkin.students;

  if (query) {
    list = list.filter(s => 
      (s.id && s.id.includes(query)) ||
      (s.studentId && s.studentId.includes(query)) ||
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.firstNameTh && s.firstNameTh.toLowerCase().includes(query)) ||
      (s.lastNameTh && s.lastNameTh.toLowerCase().includes(query))
    );
  }

  res.json({
    success: true,
    count: list.length,
    data: list,
    students: checkin.students,
    currentStudentId: checkin.currentStudentId
  });
});

app.get('/api/students/:id', (req, res) => {
  const cardStudents = readJsonSafe(CARD_STUDENTS_FILE, []);
  const student = cardStudents.find(s => s.id === req.params.id || s.studentId === req.params.id);
  if (student) return res.json({ success: true, data: student });
  
  res.json({
    success: true,
    data: {
      id: req.params.id,
      studentId: req.params.id,
      name: `นักศึกษา รหัส ${req.params.id}`,
      firstNameTh: 'นักศึกษา',
      lastNameTh: `รหัส ${req.params.id}`,
      faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
      facultyTh: 'คณะวิทยาศาสตร์และเทคโนโลยี',
      major: 'เทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล',
      majorTh: 'เทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล',
      status: 'ปกติ'
    }
  });
});

app.get('/api/verify/:studentId', (req, res) => {
  res.json({
    success: true,
    isValid: true,
    message: 'สถานะนักศึกษาปกติ (Verified Student Status)',
    verifiedAt: new Date().toISOString()
  });
});

// =========================================================================
// 4. TUITION FEE & PAYMENTS (Branch 045)
// =========================================================================
const defaultFees = [
  {
    id: 'FEE001',
    studentId: '674295027',
    semester: '1/2569',
    description: 'ค่าธรรมเนียมการศึกษา ภาคเรียนที่ 1/2569',
    refCode1: '1234620311123485687',
    refCode2: '1234620311123485175',
    amount: 11000.00,
    status: 'pending',
    dueDate: '30 พ.ย. 2569'
  }
];

let paymentHistory = [];

app.get('/api/fees/:studentId', (req, res) => {
  res.json({ success: true, data: defaultFees });
});

app.get('/api/fee/:feeId', (req, res) => {
  const fee = defaultFees.find(f => f.id === req.params.feeId) || defaultFees[0];
  res.json({ success: true, data: fee });
});

app.post('/api/payment', (req, res) => {
  const { feeId, studentId = '674295027', paymentMethod = 'PromptPay QR' } = req.body;
  const payment = {
    id: 'PAY' + Date.now(),
    feeId,
    studentId,
    paymentMethod,
    amount: 11000.00,
    paidAt: new Date().toISOString(),
    transactionRef: 'SKRU-TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase()
  };
  paymentHistory.push(payment);
  res.json({ success: true, message: 'ชำระค่าธรรมเนียมการศึกษาสำเร็จ', data: payment });
});

app.get('/api/payments/:studentId', (req, res) => {
  res.json({ success: true, data: paymentHistory });
});

app.get('/api/receipt/:paymentId', (req, res) => {
  const payment = paymentHistory.find(p => p.id === req.params.paymentId) || {
    id: req.params.paymentId,
    amount: 11000.00,
    paidAt: new Date().toISOString(),
    transactionRef: 'SKRU-TXN-DEMO88'
  };
  res.json({ success: true, data: payment });
});

// =========================================================================
// 5. CAMPUS MAP & PLACES (Branch 032)
// =========================================================================
const MAP_DIR = path.join(__dirname, 'modules/campus-map/data');
const mapCampus = readJsonSafe(path.join(MAP_DIR, 'campus.json'), { features: [] });
const mapOfficial = readJsonSafe(path.join(MAP_DIR, 'official.json'), { features: [] });
const mapNearby = readJsonSafe(path.join(MAP_DIR, 'nearby.json'), { features: [] });

function getAllMapPlaces() {
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
    ...mapOfficial.features.filter(f => f.named).map(f => pick(f, 'official')),
    ...mapCampus.features.filter(f => f.named).map(f => pick(f, 'campus')),
    ...mapNearby.features.filter(f => f.named).map(f => pick(f, 'nearby')),
  ];
}

app.get(['/api/campus', '/modules/campus-map/public/api/campus'], (req, res) => res.json(mapCampus));
app.get(['/api/official', '/modules/campus-map/public/api/official'], (req, res) => res.json(mapOfficial));
app.get(['/api/nearby', '/modules/campus-map/public/api/nearby'], (req, res) => res.json(mapNearby));

app.get(['/api/categories', '/modules/campus-map/public/api/categories'], (req, res) => {
  // If requesting news categories:
  const newsCatPath = path.join(__dirname, 'modules/news/data/categories.json');
  if (req.headers.referer && req.headers.referer.includes('news')) {
    return res.json(readJsonSafe(newsCatPath, [
      { id: 'all', name: 'ทั้งหมด' },
      { id: 'academic', name: 'วิชาการ' },
      { id: 'activity', name: 'กิจกรรม' },
      { id: 'scholarship', name: 'ทุนการศึกษา' }
    ]));
  }
  // Otherwise Map categories:
  const count = {};
  for (const p of getAllMapPlaces()) if (p.cat) count[p.cat] = (count[p.cat] || 0) + 1;
  res.json(Object.entries(count).map(([name, total]) => ({ name, total })));
});

app.get('/api/places', (req, res) => {
  let list = getAllMapPlaces();
  if (req.query.cat) list = list.filter(p => p.cat === req.query.cat);
  if (req.query.group) list = list.filter(p => p.group === req.query.group);
  res.json(list);
});

app.get('/api/search', (req, res) => {
  const term = (req.query.q || '').trim().toLowerCase();
  if (!term) return res.json([]);
  const raw = [...mapOfficial.features, ...mapCampus.features, ...mapNearby.features];
  const ids = new Set(raw.filter(f => f.named && `${f.search || ''} ${f.name || ''} ${f.planNumber || ''}`.toLowerCase().includes(term)).map(f => f.id));
  res.json(getAllMapPlaces().filter(p => ids.has(p.id)).slice(0, 30));
});

// =========================================================================
// 6. STUDENT LOAN (กยศ.) (Branch 044)
// =========================================================================
const LOAN_DB_FILE = path.join(__dirname, 'modules/student-loan/src/data/db.json');
const loanDb = readJsonSafe(LOAN_DB_FILE, {
  announcements: [],
  loanInfo: {},
  institutionInfo: {},
  repaymentChannels: [],
  registeredRepayments: []
});

app.get('/api/loans/info', (req, res) => res.json({ success: true, data: loanDb.loanInfo }));
app.get('/api/institution', (req, res) => res.json({ success: true, data: loanDb.institutionInfo }));
app.get('/api/repayments/info', (req, res) => res.json({ success: true, data: { channels: loanDb.repaymentChannels } }));
app.post('/api/repayments/register', (req, res) => {
  const { studentId, idCard, fullName, faculty, phone, repaymentType } = req.body;
  const newReg = {
    id: 'REG-' + Date.now().toString().slice(-6),
    studentId: studentId || '674295027',
    idCard: idCard || '-',
    fullName: fullName || 'นายสมชาย ใจดี',
    faculty: faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี',
    phone: phone || '0812345678',
    repaymentType: repaymentType || 'ผ่อนชำระรายเดือน',
    status: 'ลงทะเบียนสำเร็จ',
    createdAt: new Date().toISOString()
  };
  loanDb.registeredRepayments = loanDb.registeredRepayments || [];
  loanDb.registeredRepayments.unshift(newReg);
  writeJsonSafe(LOAN_DB_FILE, loanDb);
  res.status(201).json({ success: true, message: 'ลงทะเบียนความประสงค์ชำระหนี้ กยศ. เรียบร้อยแล้ว', data: newReg });
});

app.get('/api/repayments/status/:query', (req, res) => {
  const q = req.params.query.trim();
  const match = (loanDb.registeredRepayments || []).find(i => i.idCard === q || i.studentId === q || i.id === q);
  res.json({ success: true, data: match || null });
});

app.get('/api/salary-deduction', (req, res) => {
  const currentDb = readJsonSafe(LOAN_DB_FILE, loanDb);
  res.json({ success: true, data: currentDb.salaryDeductionInfo || loanDb.salaryDeductionInfo || {} });
});

app.get('/api/volunteer', (req, res) => {
  const currentDb = readJsonSafe(LOAN_DB_FILE, loanDb);
  res.json({ success: true, data: currentDb.volunteerActivities || loanDb.volunteerActivities || [] });
});

app.post('/api/volunteer/submit', (req, res) => {
  const { title, hours, location, date, studentId } = req.body;
  const currentDb = readJsonSafe(LOAN_DB_FILE, loanDb);
  currentDb.userVolunteerHours = currentDb.userVolunteerHours || [];
  const record = {
    id: Date.now(),
    title: title || 'กิจกรรมจิตอาสาพัฒนาชุมชน',
    hours: Number(hours) || 6,
    location: location || 'มหาวิทยาลัยราชภัฏสงขลา',
    date: date || new Date().toISOString().split('T')[0],
    studentId: studentId || '674295027',
    status: 'อนุมัติแล้ว'
  };
  currentDb.userVolunteerHours.push(record);
  writeJsonSafe(LOAN_DB_FILE, currentDb);
  res.status(201).json({ success: true, message: 'บันทึกรับรองชั่วโมงจิตอาสาสำเร็จแล้ว', data: record });
});

app.get('/api/hall-of-fame', (req, res) => {
  const currentDb = readJsonSafe(LOAN_DB_FILE, loanDb);
  res.json({ success: true, data: currentDb.hallOfFameList || loanDb.hallOfFameList || [] });
});

// =========================================================================
// 7. FACULTY CONTACT & APPOINTMENTS (Branch 030)
// =========================================================================
const FACULTY_DIR = path.join(__dirname, 'modules/faculty-contact/data');
const TEACHER_FILE = path.join(FACULTY_DIR, 'teacher.json');
const APPOINTMENTS_FILE = path.join(FACULTY_DIR, 'appointments.json');

app.get('/api/teacher', (req, res) => {
  const teacher = readJsonSafe(TEACHER_FILE, {
    id: "T001",
    name: "ผศ.ดร. อาจารย์ผู้สอน",
    faculty: "คณะวิทยาศาสตร์และเทคโนโลยี",
    status: "พร้อมให้เข้าพบ",
    isAvailable: true,
    consultationHours: "จันทร์, พุธ 13:00 - 16:00 น."
  });
  res.json({ success: true, data: teacher });
});

app.get('/api/teachers', (req, res) => {
  const teacher = readJsonSafe(TEACHER_FILE, []);
  res.json(Array.isArray(teacher) ? teacher : [teacher]);
});

app.get('/api/appointments', (req, res) => {
  const appointments = readJsonSafe(APPOINTMENTS_FILE, []);
  res.json({ success: true, count: appointments.length, data: appointments });
});

app.post('/api/appointments', (req, res) => {
  const appointments = readJsonSafe(APPOINTMENTS_FILE, []);
  const newApp = {
    id: 'APP-' + Date.now(),
    studentName: req.body.studentName || 'นักศึกษา SKRU',
    studentId: req.body.studentId || '674295027',
    contact: req.body.contact || '081-xxx-xxxx',
    date: req.body.date,
    time: req.body.time,
    topic: req.body.topic,
    status: 'รอการตอบรับ (Pending)',
    createdAt: new Date().toISOString()
  };
  appointments.unshift(newApp);
  writeJsonSafe(APPOINTMENTS_FILE, appointments);
  res.status(201).json({ success: true, message: 'ส่งคำขอนัดหมายอาจารย์สำเร็จ', data: newApp });
});

// =========================================================================
// 8. UNIVERSITY NEWS & ANNOUNCEMENTS (Branch 041)
// =========================================================================
const NEWS_FILE = path.join(__dirname, 'modules/news/data/news.json');
const COMMENTS_FILE = path.join(__dirname, 'modules/news/data/comments.json');

const NEWS_CATEGORIES_FILE = path.join(__dirname, 'modules/news/data/categories.json');

app.get('/api/news/categories', (req, res) => {
  const cats = readJsonSafe(NEWS_CATEGORIES_FILE, [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'university', name: 'ข่าวมหาวิทยาลัย' },
    { id: 'student-activities', name: 'กิจกรรมนักศึกษา' },
    { id: 'academic-scholarships', name: 'วิชาการ & ทุน' },
    { id: 'recruitment', name: 'รับสมัครงาน' }
  ]);
  res.json({ success: true, data: cats });
});

app.get('/api/news', (req, res) => {
  let news = readJsonSafe(NEWS_FILE, []);
  if (req.query.category && req.query.category !== 'all') {
    news = news.filter(n => n.category === req.query.category);
  }
  if (req.query.search) {
    const q = req.query.search.toLowerCase().trim();
    news = news.filter(n => 
      (n.title && n.title.toLowerCase().includes(q)) || 
      (n.summary && n.summary.toLowerCase().includes(q)) ||
      (n.categoryName && n.categoryName.toLowerCase().includes(q))
    );
  }
  // Return direct array for backwards-compatibility while keeping success property attachable
  res.json(news);
});

app.get('/api/news/:id', (req, res) => {
  const news = readJsonSafe(NEWS_FILE, []);
  const item = news.find(n => String(n.id) === String(req.params.id)) || news[0];
  if (!item) return res.status(404).json({ success: false, message: 'ไม่พบข่าวสาร' });
  res.json({ success: true, data: item, ...item });
});

app.post('/api/news/:id/like', (req, res) => {
  const news = readJsonSafe(NEWS_FILE, []);
  const item = news.find(n => String(n.id) === String(req.params.id));
  if (item) {
    const action = req.body && req.body.action === 'unlike' ? 'unlike' : 'like';
    item.likes = action === 'unlike' ? Math.max(0, (item.likes || 1) - 1) : (item.likes || 0) + 1;
    writeJsonSafe(NEWS_FILE, news);
    return res.json({ success: true, likes: item.likes, message: 'บันทึกการถูกใจเรียบร้อยแล้ว' });
  }
  res.json({ success: true, likes: 343, message: 'ถูกใจข่าวสารเรียบร้อยแล้ว' });
});

app.get('/api/news/:id/comments', (req, res) => {
  const comments = readJsonSafe(COMMENTS_FILE, []);
  const filtered = comments.filter(c => String(c.newsId) === String(req.params.id));
  const list = filtered.length > 0 ? filtered : comments.slice(0, 5);
  res.json({ success: true, data: list, comments: list });
});

app.post('/api/news/:id/comments', (req, res) => {
  const comments = readJsonSafe(COMMENTS_FILE, []);
  const newComment = {
    id: `comment-${Date.now()}`,
    newsId: req.params.id,
    author: req.body.author || 'นายสมชาย ใจดี (ITDI)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    text: req.body.text || req.body.content || '',
    timeAgo: 'เมื่อสักครู่',
    likes: 0,
    createdAt: new Date().toISOString()
  };
  comments.unshift(newComment);
  writeJsonSafe(COMMENTS_FILE, comments);
  res.status(201).json({ success: true, data: newComment, comment: newComment });
});

// =========================================================================
// 9. LEARNING RESOURCES (Branch 029)
// =========================================================================
const RESOURCES_FILE = path.join(__dirname, 'modules/learning-resources/data/resources.json');
app.get('/api/resources', (req, res) => {
  const resources = readJsonSafe(RESOURCES_FILE, [
    { id: "dharmniti", name: "ธรรมนิติ", cat: "academic", desc: "สื่อการเรียนรู้ด้านกฎหมาย บัญชี ภาษี และธุรกิจ", url: "https://www.dharmniti.co.th/" },
    { id: "set", name: "ตลาดหลักทรัพย์แห่งประเทศไทย", cat: "finance", desc: "ความรู้ด้านการลงทุน การเงิน และตลาดทุน", url: "https://www.set.or.th/th/home" },
    { id: "thaimooc", name: "Thai MOOC", cat: "elearning", desc: "เรียนรู้หลากหลายสาขาวิชาผ่านบทเรียนออนไลน์", url: "https://thaimooc.org/" },
    { id: "scholar", name: "Google Scholar", cat: "academic", desc: "ค้นหาบทความทางวิชาการและงานวิจัย", url: "https://scholar.google.com/" },
    { id: "coursera", name: "Coursera", cat: "elearning", desc: "หลักสูตรออนไลน์เพื่อพัฒนาความรู้และทักษะอาชีพ", url: "https://www.coursera.org/" },
    { id: "edx", name: "edX", cat: "elearning", desc: "เปิดโลกการเรียนรู้กับหลักสูตรออนไลน์นานาชาติ", url: "https://www.edx.org/" }
  ]);
  res.json({ resources });
});

// =========================================================================
// 10. DORMITORY BOOKING (Branch 039)
// =========================================================================
const DORM_FILE = path.join(__dirname, 'modules/dorm-booking/data/store.json');

app.get(['/api/dorms', '/modules/dorm-booking/public/api/dorms'], (req, res) => {
  const data = readJsonSafe(DORM_FILE, { dorms: [], bookings: [] });
  const dormSummary = (data.dorms || []).map(d => {
    let availableCount = 0;
    (d.rooms || []).forEach(r => {
      (r.beds || []).forEach(b => {
        if (!b.isOccupied) availableCount++;
      });
    });
    return {
      id: d.id,
      name: d.name,
      type: d.type,
      typeLabel: d.typeLabel,
      floors: d.floors,
      totalRooms: d.totalRooms,
      bedsPerRoom: d.bedsPerRoom,
      capacityPerRoomText: d.capacityPerRoomText,
      totalBeds: d.totalBeds,
      availableBeds: availableCount,
      occupiedBeds: d.totalBeds - availableCount,
      price: d.price,
      pricePeriod: d.pricePeriod,
      electricityNote: d.electricityNote,
      amenities: d.amenities
    };
  });
  res.json({ success: true, dorms: dormSummary, data: dormSummary });
});

app.get(['/api/dorms/:id', '/modules/dorm-booking/public/api/dorms/:id'], (req, res) => {
  const data = readJsonSafe(DORM_FILE, { dorms: [], bookings: [] });
  const dorm = (data.dorms || []).find(d => d.id === req.params.id);
  if (!dorm) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลหอพักนี้' });
  
  let availableCount = 0;
  (dorm.rooms || []).forEach(r => {
    (r.beds || []).forEach(b => {
      if (!b.isOccupied) availableCount++;
    });
  });

  const dormWithCounts = {
    ...dorm,
    availableBeds: availableCount,
    occupiedBeds: dorm.totalBeds - availableCount
  };

  res.json({ success: true, dorm: dormWithCounts, data: dormWithCounts });
});

app.get(['/api/bookings/search', '/modules/dorm-booking/public/api/bookings/search'], (req, res) => {
  const studentId = (req.query.studentId || req.query.q || '').trim().toLowerCase();
  const bookingCode = (req.query.bookingCode || '').trim().toLowerCase();
  const data = readJsonSafe(DORM_FILE, { dorms: [], bookings: [] });

  const bookings = (data.bookings || []).filter(b => {
    if (b.status === 'cancelled') return false;
    if (studentId) {
      return (b.studentId && b.studentId.toLowerCase().includes(studentId)) ||
             (b.id && b.id.toLowerCase().includes(studentId)) ||
             (b.fullName && b.fullName.toLowerCase().includes(studentId)) ||
             (b.studentName && b.studentName.toLowerCase().includes(studentId));
    }
    if (bookingCode) {
      return (b.bookingCode && b.bookingCode.toLowerCase().includes(bookingCode)) ||
             (b.id && b.id.toLowerCase().includes(bookingCode));
    }
    return true;
  });

  const singleBooking = bookings[0] || null;
  if (!singleBooking && (studentId || bookingCode)) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
  }

  res.json({
    success: true,
    booking: singleBooking,
    bookings: bookings,
    data: bookings
  });
});

app.post(['/api/bookings', '/modules/dorm-booking/public/api/bookings'], (req, res) => {
  const { dormId, roomNumber, bedId, studentId, prefix, fullName, gender, faculty, major, phone, email, paymentSlip } = req.body;
  if (!dormId || !roomNumber || !bedId || !studentId) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const data = readJsonSafe(DORM_FILE, { dorms: [], bookings: [] });
  const dorm = (data.dorms || []).find(d => d.id === dormId);
  if (!dorm) {
    return res.status(404).json({ success: false, message: 'ไม่พบหอพักที่ระบุ' });
  }

  // Check if student already booked
  const existing = (data.bookings || []).find(b => b.studentId === studentId && b.status === 'confirmed');
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `รหัสนักศึกษา ${studentId} ได้ทำการจองหอพักไว้แล้ว (${existing.dormName} ห้อง ${existing.roomNumber})`
    });
  }

  // Find room and bed
  const room = (dorm.rooms || []).find(r => r.roomNumber === roomNumber);
  if (!room) return res.status(400).json({ success: false, message: 'ไม่พบห้องพักที่ระบุ' });
  const bed = (room.beds || []).find(b => b.id === bedId);
  if (!bed) return res.status(400).json({ success: false, message: 'ไม่พบเตียงพักที่ระบุ' });
  if (bed.isOccupied) return res.status(400).json({ success: false, message: 'เตียงนี้ถูกจองไปแล้ว กรุณาเลือกเตียงอื่น' });

  // Mark occupied
  bed.isOccupied = true;
  bed.occupiedBy = studentId;

  const bookingCode = 'BK' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);
  const newBooking = {
    id: 'BK-' + Date.now(),
    bookingCode: bookingCode,
    dormId: dorm.id,
    dormName: dorm.name,
    roomNumber: roomNumber,
    bedId: bedId,
    bedLabel: bed.label,
    studentId: studentId,
    prefix: prefix || '',
    fullName: fullName || 'นายสมชาย ใจดี',
    studentName: (prefix || '') + (fullName || 'นายสมชาย ใจดี'),
    gender: gender || dorm.type,
    faculty: faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี',
    major: major || 'สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล (ITDI)',
    phone: phone || '081-234-5678',
    email: email || `${studentId}@parichat.skru.ac.th`,
    price: dorm.price,
    pricePeriod: dorm.pricePeriod,
    paymentSlip: paymentSlip || null,
    paymentStatus: paymentSlip ? 'submitted' : 'pending',
    createdAt: new Date().toISOString(),
    status: 'confirmed'
  };

  data.bookings = data.bookings || [];
  data.bookings.unshift(newBooking);
  writeJsonSafe(DORM_FILE, data);

  res.status(201).json({
    success: true,
    message: 'การจองหอพักสำเร็จแล้ว!',
    booking: newBooking,
    data: newBooking
  });
});

app.post(['/api/bookings/:id/payment-slip', '/modules/dorm-booking/public/api/bookings/:id/payment-slip'], (req, res) => {
  const { paymentSlip } = req.body;
  if (!paymentSlip) {
    return res.status(400).json({ success: false, message: 'กรุณาแนบรูปภาพสลิปโอนเงิน' });
  }
  const data = readJsonSafe(DORM_FILE, { dorms: [], bookings: [] });
  const booking = (data.bookings || []).find(b => (b.id === req.params.id || b.bookingCode === req.params.id) && b.status === 'confirmed');
  if (!booking) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการจองนี้' });
  }

  booking.paymentSlip = paymentSlip;
  booking.paymentStatus = 'submitted';
  booking.paymentUploadedAt = new Date().toISOString();
  writeJsonSafe(DORM_FILE, data);

  res.json({
    success: true,
    message: 'แนบสลิปการโอนเงินเรียบร้อยแล้ว!',
    booking,
    data: booking
  });
});

app.delete(['/api/bookings/:id', '/modules/dorm-booking/public/api/bookings/:id'], (req, res) => {
  const data = readJsonSafe(DORM_FILE, { dorms: [], bookings: [] });
  const bookingIndex = (data.bookings || []).findIndex(b => (b.id === req.params.id || b.bookingCode === req.params.id));
  if (bookingIndex === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการจองนี้ หรือถูกยกเลิกแล้ว' });
  }

  const booking = data.bookings[bookingIndex];
  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();

  // Free bed in dorm
  const dorm = (data.dorms || []).find(d => d.id === booking.dormId);
  if (dorm) {
    const room = (dorm.rooms || []).find(r => r.roomNumber === booking.roomNumber);
    if (room) {
      const bed = (room.beds || []).find(b => b.id === booking.bedId);
      if (bed) {
        bed.isOccupied = false;
        delete bed.occupiedBy;
      }
    }
  }

  data.bookings.splice(bookingIndex, 1);
  writeJsonSafe(DORM_FILE, data);

  res.json({ success: true, message: 'ยกเลิกการจองเรียบร้อยแล้ว' });
});

app.get(['/api/admin/bookings', '/modules/dorm-booking/public/api/admin/bookings'], (req, res) => {
  const data = readJsonSafe(DORM_FILE, { dorms: [], bookings: [] });
  const activeBookings = (data.bookings || []).filter(b => b.status === 'confirmed');
  res.json({ success: true, bookings: activeBookings, data: activeBookings });
});

// =========================================================================
// 11. EVENT & ACTIVITY BOOKING (Branch 046)
// =========================================================================
const EVENT_DIR = path.join(__dirname, 'modules/event-booking/data');
const ACTIVITIES_FILE = path.join(EVENT_DIR, 'activities.json');
const EVENT_BOOKINGS_FILE = path.join(EVENT_DIR, 'bookings.json');

app.get('/api/activities', (req, res) => {
  let activities = readJsonSafe(ACTIVITIES_FILE, []);
  if (req.query.category && req.query.category !== 'ทั้งหมด') {
    activities = activities.filter(a => a.category === req.query.category || (req.query.category === 'กยศ.' && a.isKYS));
  }
  res.json({ success: true, total: activities.length, data: activities });
});

app.get('/api/activities/:id', (req, res) => {
  const activities = readJsonSafe(ACTIVITIES_FILE, []);
  const activity = activities.find(a => a.id === req.params.id || a.code === req.params.id);
  if (!activity) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  res.json({ success: true, data: activity });
});

app.post('/api/activities/book', (req, res) => {
  const { activityId, studentId = '674295027', studentName = 'นายสมชาย ใจดี' } = req.body;
  const activities = readJsonSafe(ACTIVITIES_FILE, []);
  const bookings = readJsonSafe(EVENT_BOOKINGS_FILE, []);

  const activity = activities.find(a => a.id === activityId);
  if (!activity) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });

  const newBooking = {
    id: `book-${Date.now()}`,
    activityId: activity.id,
    activityCode: activity.code,
    activityTitle: activity.title,
    date: activity.date,
    time: activity.time,
    location: activity.location,
    hours: activity.hours,
    isKYS: activity.isKYS,
    studentId,
    studentName,
    registeredAt: new Date().toISOString(),
    status: 'ลงทะเบียนสำเร็จ',
    seatNumber: 'A-01'
  };

  bookings.unshift(newBooking);
  writeJsonSafe(EVENT_BOOKINGS_FILE, bookings);
  res.status(201).json({ success: true, message: `ลงทะเบียนกิจกรรม "${activity.title}" สำเร็จ!`, data: newBooking });
});

app.post('/api/activities/code', (req, res) => {
  const { code } = req.body;
  const activities = readJsonSafe(ACTIVITIES_FILE, []);
  const activity = activities.find(a => a.code.toUpperCase() === (code || '').trim().toUpperCase());
  if (!activity) return res.status(404).json({ success: false, message: 'ไม่พบรหัสกิจกรรมที่ระบุ' });

  res.json({ success: true, message: `ยืนยันกิจกรรม "${activity.title}" สำเร็จ!`, data: activity });
});

app.get('/api/my-bookings', (req, res) => {
  const bookings = readJsonSafe(EVENT_BOOKINGS_FILE, []);
  res.json({ success: true, total: bookings.length, data: bookings });
});

app.get('/api/student-stats', (req, res) => {
  res.json({
    success: true,
    data: {
      id: "674295027",
      name: "นายสมชาย ใจดี",
      faculty: "คณะวิทยาศาสตร์และเทคโนโลยี",
      major: "สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล (ITDI)",
      conductScore: 100,
      hoursCompleted: 38,
      hoursTarget: 50,
      kysCompleted: 24,
      kysTarget: 36,
      breakdown: [
        { title: "กิจกรรมบังคับมหาวิทยาลัย", current: 18, total: 20, icon: "school" },
        { title: "กิจกรรมเสริมสร้างสมรรถนะ", current: 12, total: 15, icon: "stars" },
        { title: "กิจกรรมบำเพ็ญประโยชน์/จิตอาสา", current: 8, total: 15, icon: "volunteer" }
      ]
    }
  });
});

const STUDENT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'academic',
    categoryName: 'วิชาการ & เกรด',
    icon: 'fa-graduation-cap',
    iconColor: '#2563EB',
    iconBg: '#DBEAFE',
    title: 'ประกาศผลการศึกษา ภาคเรียนที่ 1/2569',
    message: 'ผลการเรียนของคุณประกาศครบทุกวิชาแล้ว เกรดเฉลี่ยสะสม (GPAX): 3.82 (เกียรตินิยมอันดับ 1) พร้อมดาวน์โหลดรายงานผล (PDF) ได้แล้ว',
    time: '10 นาทีที่แล้ว',
    date: 'วันนี้ 18:40 น.',
    unread: true,
    actionUrl: '/academic-record.html',
    actionText: 'ดูผลการเรียน'
  },
  {
    id: 'notif-2',
    category: 'academic',
    categoryName: 'วิชาการ & เกรด',
    icon: 'fa-book-bookmark',
    iconColor: '#7C3AED',
    iconBg: '#EDE9FE',
    title: 'เปิดระบบลงทะเบียนเรียนล่วงหน้า ภาคเรียนที่ 2/2569',
    message: 'นักศึกษาชั้นปีที่ 3 สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล (ITDI) สามารถเริ่มลงทะเบียนเรียนได้ตั้งแต่วันที่ 15 - 17 ต.ค. 2569',
    time: '2 ชั่วโมงที่แล้ว',
    date: 'วันนี้ 16:50 น.',
    unread: true,
    actionUrl: '/academic-calendar.html',
    actionText: 'ดูตารางวิชา'
  },
  {
    id: 'notif-3',
    category: 'activity',
    categoryName: 'กิจกรรมนักศึกษา',
    icon: 'fa-award',
    iconColor: '#EA580C',
    iconBg: '#FFEDD5',
    title: 'อนุมัติชั่วโมงกิจกรรมนักศึกษา (+4 ชั่วโมง)',
    message: 'กิจกรรม "เวิร์กชอป AI & Modern Web Development" ได้รับการรับรองแล้ว ชั่วโมงสะสมรวมของคุณคือ 38/50 ชม.',
    time: 'วันนี้ 09:30 น.',
    date: 'วันนี้ 09:30 น.',
    unread: true,
    actionUrl: '/event-booking.html',
    actionText: 'ตรวจสอบชั่วโมง'
  },
  {
    id: 'notif-4',
    category: 'payment',
    categoryName: 'การเงิน & ค่าเทอม',
    icon: 'fa-receipt',
    iconColor: '#16A34A',
    iconBg: '#DCFCE7',
    title: 'ยืนยันการชำระค่าธรรมเนียมการศึกษาสำเร็จ',
    message: 'ชำระเงินค่าเทอมภาคเรียนที่ 1/2569 จำนวน 11,500.00 บาท ผ่าน PromptPay QR เรียบร้อยแล้ว ใบเสร็จรับเงินเลขที่ RCP-2569-0891 ออกแล้ว',
    time: 'เมื่อวานนี้',
    date: '4 ต.ค. 2569',
    unread: false,
    actionUrl: '/tuition-fee.html',
    actionText: 'ดูใบเสร็จ'
  },
  {
    id: 'notif-5',
    category: 'library',
    categoryName: 'ห้องสมุดกลาง',
    icon: 'fa-book-open-reader',
    iconColor: '#0891B2',
    iconBg: '#CFFAFE',
    title: 'แจ้งเตือนกำหนดส่งคืนหนังสือห้องสมุด',
    message: 'หนังสือ "วิทยาการข้อมูลและการเรียนรู้ของเครื่อง" ครบกำหนดส่งคืนวันที่ 12 ต.ค. 2569 กรุณาส่งคืนหรือต่ออายุยืมออนไลน์',
    time: '3 วันที่แล้ว',
    date: '2 ต.ค. 2569',
    unread: false,
    actionUrl: '/library.html',
    actionText: 'จัดการยืม-คืน'
  },
  {
    id: 'notif-6',
    category: 'general',
    categoryName: 'สวัสดิการ & ทั่วไป',
    icon: 'fa-heart-pulse',
    iconColor: '#E11D48',
    iconBg: '#FFE4E6',
    title: 'กำหนดการตรวจสุขภาพประจำปี 2569',
    message: 'ขอเชิญนักศึกษาชั้นปีที่ 3 เข้ารับการตรวจสุขภาพประจำปี ณ อาคารกองพัฒนานักศึกษา วันที่ 25 ต.ค. 2569 (08:30 - 15:30 น.)',
    time: '5 วันที่แล้ว',
    date: '30 ก.ย. 2569',
    unread: false,
    actionUrl: '/news.html',
    actionText: 'อ่านประกาศ'
  }
];

let liveNotifications = [...STUDENT_NOTIFICATIONS];

app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    total: liveNotifications.length,
    unreadCount: liveNotifications.filter(n => n.unread).length,
    data: liveNotifications
  });
});

app.post('/api/notifications/mark-read', (req, res) => {
  const { id } = req.body || {};
  if (id) {
    const item = liveNotifications.find(n => n.id === id);
    if (item) item.unread = false;
  } else {
    liveNotifications.forEach(n => n.unread = false);
  }
  res.json({ success: true, message: 'ทำเครื่องหมายว่าอ่านแล้ว' });
});

// =========================================================================
// 12. CENTRAL LIBRARY & OPAC (Branch 047)
// =========================================================================
const libraryBooks = [
  {
    id: 'B001',
    title: 'วิทยาการข้อมูลและการเรียนรู้ของเครื่อง (Data Science & Machine Learning)',
    author: 'ผศ.ดร. สมชาย ใจดี (2567)',
    callNumber: 'QA76.9.D343 S67 2567',
    isbn: '978-616-12-3456-7',
    location: 'ชั้น 3 อาคารบรรณราชนครินทร์ (หมวด QA)',
    status: 'available',
    availableCount: 3,
    totalCount: 5,
    coverTag: 'Data Science'
  },
  {
    id: 'B002',
    title: 'การพัฒนาเว็บแอปพลิเคชันด้วย React & Node.js ขั้นสูง',
    author: 'อ.อนันต์ สุขสวัสดิ์ (2568)',
    callNumber: 'QA76.76 .อ54 2568',
    isbn: '978-616-99-8877-1',
    location: 'คลังทรัพยากรดิจิทัล SKRU e-Book System',
    status: 'available',
    availableCount: 99,
    totalCount: 99,
    coverTag: 'React JS'
  },
  {
    id: 'B003',
    title: 'การพัฒนาการท่องเที่ยวเชิงวัฒนธรรมสงขลา',
    author: 'ดร. นภาพร สุวรรณ (2567)',
    callNumber: 'SKRU IR Repository - SKRU-IR-2567-08',
    location: 'ชั้น 4 โซนคลังปริญญานิพนธ์และงานวิจัย',
    status: 'borrowed',
    availableCount: 0,
    totalCount: 2,
    coverTag: 'SKRU Research'
  }
];

let libraryBorrowings = [
  {
    id: 'BORROW-001',
    bookId: 'B001',
    title: 'วิทยาการข้อมูลและการเรียนรู้ของเครื่อง (Data Science & Machine Learning)',
    borrowDate: '2026-09-25',
    dueDate: '2026-10-15',
    status: 'normal',
    renewalCount: 0
  }
];

app.get(['/api/v1/books', '/api/books'], (req, res) => {
  res.json({ success: true, status: 200, total: libraryBooks.length, data: libraryBooks });
});

app.get(['/api/v1/borrowings', '/api/borrowed'], (req, res) => {
  res.json({ success: true, count: libraryBorrowings.length, data: libraryBorrowings });
});

app.post(['/api/v1/borrowings/renew', '/api/borrowed/renew/:id'], (req, res) => {
  res.json({ success: true, message: 'ยืมต่อหนังสือสำเร็จ (ขยายเวลาเพิ่มอีก 14 วัน)' });
});

app.get('/api/digital-resources', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/occupancy', (req, res) => {
  res.json({ success: true, currentOccupancy: 42, maxCapacity: 250, percent: 17 });
});

app.post('/api/rooms/book', (req, res) => {
  res.json({ success: true, message: 'จองห้องศึกษาค้นคว้ากลุ่มสำเร็จ' });
});

app.post('/api/rooms/checkin', (req, res) => {
  res.json({ success: true, message: 'เช็คอินเข้าใช้งานห้องเรียบร้อยแล้ว' });
});

app.get(['/api/v1/user', '/api/user'], (req, res) => {
  res.json({
    success: true,
    data: {
      name: "นายสมชาย ใจดี",
      studentId: "674295027",
      faculty: "คณะวิทยาศาสตร์และเทคโนโลยี (สาขา ITDI)",
      status: "ปกติ",
      maxLoans: 5,
      fineBalance: 0.00
    }
  });
});

app.post(['/api/v1/user/pay-fine', '/api/user/pay-fine'], (req, res) => {
  res.json({ success: true, message: 'ชำระค่าปรับสำเร็จ ยอดค้างชำระเป็น 0 บาท' });
});

// =========================================================================
// 13. PRIVACY & PDPA CONSENT (Branch 040)
// =========================================================================
const CONSENT_FILE = path.join(__dirname, 'modules/privacy-settings/consent-data.json');
app.get('/api/consent', (req, res) => {
  const data = readJsonSafe(CONSENT_FILE, []);
  res.json({ total: data.length, data });
});

app.post('/api/consent', (req, res) => {
  const data = readJsonSafe(CONSENT_FILE, []);
  const entry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...req.body
  };
  data.push(entry);
  writeJsonSafe(CONSENT_FILE, data);
  res.json({ message: 'บันทึกข้อมูลความยินยอม PDPA เรียบร้อยแล้ว', entry });
});

// =========================================================================
// 14. SETTINGS & PREFERENCES (Branch 049)
// =========================================================================
const SETTINGS_FILE = path.join(__dirname, 'modules/settings/data/settings.json');
const defaultSettings = {
  notifications: { all_notifications: true, university_news: true, course_notifications: true },
  subscriptions: { sports: true, health: true, scholarships: true, study: true },
  security: { biometrics: false, show_contact_info: false, pin_set: true },
  privacy: { product_improvement: true, product_marketing: true },
  general: { language: "th", version: "26.8.0(2)" }
};

app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: readJsonSafe(SETTINGS_FILE, defaultSettings) });
});

app.put(['/api/settings/:category', '/api/settings'], (req, res) => {
  const settings = readJsonSafe(SETTINGS_FILE, defaultSettings);
  const cat = req.params.category;
  if (cat && settings[cat]) {
    settings[cat] = { ...settings[cat], ...req.body };
  } else {
    Object.assign(settings, req.body);
  }
  writeJsonSafe(SETTINGS_FILE, settings);
  res.json({ success: true, message: 'อัปเดตการตั้งค่าสำเร็จ', data: settings });
});

app.post('/api/settings/reset', (req, res) => {
  writeJsonSafe(SETTINGS_FILE, defaultSettings);
  res.json({ success: true, message: 'รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นแล้ว', data: defaultSettings });
});

// =========================================================================
// 15. VOTE & SATISFACTION EVALUATION (Branch 033)
// =========================================================================
const RATINGS_FILE = path.join(__dirname, 'modules/vote/data/ratings.json');
app.get('/api/ratings', (req, res) => {
  const ratings = readJsonSafe(RATINGS_FILE, []);
  const totalCount = ratings.length;
  const totalScore = ratings.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
  const averageScore = totalCount > 0 ? Number((totalScore / totalCount).toFixed(2)) : 0;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => {
    const s = Math.round(Number(r.score) || 0);
    if (distribution[s] !== undefined) distribution[s]++;
  });

  res.json({
    success: true,
    stats: {
      total: totalCount,
      average: averageScore,
      distribution: distribution
    },
    ratings: ratings
  });
});

app.post('/api/ratings', (req, res) => {
  const ratings = readJsonSafe(RATINGS_FILE, []);
  const newRating = {
    id: 'rate_' + Date.now(),
    score: Number(req.body.score) || 5,
    comment: (req.body.comment || '').trim(),
    createdAt: new Date().toISOString(),
    formattedDate: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
  };
  ratings.unshift(newRating);
  writeJsonSafe(RATINGS_FILE, ratings);
  res.json({ success: true, message: 'บันทึกคะแนนประเมินเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็นครับ', data: newRating });
});

app.delete('/api/ratings', (req, res) => {
  writeJsonSafe(RATINGS_FILE, []);
  res.json({ success: true, message: 'ลบข้อมูลการประเมินทั้งหมดเรียบร้อยแล้ว' });
});

// =========================================================================
// 16. STUDENT REWARDS & REDEMPTION (Branch 050)
// =========================================================================
const rewardsCatalog = [
  {
    id: "rw-01",
    title: "กระเป๋าตรามหาวิทยาลัย (1 ชิ้น)",
    coins: 350,
    stock: 1839,
    validUntil: "31 Dec 2027",
    image: "/assets/backpack.jpg",
    description: "กระเป๋าสุดเท่ คุณภาพสูง เนื้อผ้าหนา ทนทาน พร้อมโลโก้มหาวิทยาลัยปักประณีต",
    conditions: ["จำกัด 1 ใบ ต่อท่าน", "แลกรับที่จุดบริการนักศึกษา ชั้น1 โรงอาหาร", "สินค้ามีจำนวนจำกัด"]
  },
  {
    id: "rw-02",
    title: "เสื้อแจ็คเก็ตมหาวิทยาลัย (1 ตัว)",
    coins: 550,
    stock: 240,
    validUntil: "31 Dec 2027",
    image: "/assets/jacket.jpg",
    description: "เสื้อแจ็คเก็ตบอมเบอร์ปักตรามหาวิทยาลัย เนื้อผ้าพรีเมียม ใส่สบาย",
    conditions: ["จำกัด 1 ตัว ต่อท่าน", "เลือกไซส์ได้ที่จุดรับสินค้า", "แลกรับที่จุดบริการนักศึกษา ชั้น1 โรงอาหาร"]
  },
  { id: 'REW01', title: 'คูปองส่วนลดเครื่องดื่ม 20 บาท ณ SKRU Cafe', coins: 50, category: 'food', stock: 100 },
  { id: 'REW02', title: 'สิทธิ์จองห้องศึกษาค้นคว้าเดี่ยวล่วงหน้า 7 วัน', coins: 120, category: 'study', stock: 50 }
];

let rewardsUser050 = {
  id: "USR-674295050",
  name: "นายสมชาย ใจดี",
  studentId: "674295027",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=student",
  coins: 1200
};

const REWARDS_HISTORY_FILE = path.join(__dirname, 'modules/rewards/data/history.json');
let rewardsHistory050 = readJsonSafe(REWARDS_HISTORY_FILE, [
  {
    id: "TXN-17281001",
    rewardId: "rw-01",
    rewardTitle: "กระเป๋าตรามหาวิทยาลัย (1 ชิ้น)",
    rewardImage: "/assets/backpack.jpg",
    coinsSpent: 350,
    couponCode: "SKRU-350-849201",
    qrData: "REDEEM:SKRU-350-849201:674295027",
    redeemedAt: "4 ต.ค. 2569 14:20 น.",
    status: "ACTIVE"
  }
]);

app.get('/api/user', (req, res) => {
  res.json({ success: true, user: rewardsUser050 });
});

app.get('/api/rewards', (req, res) => {
  const currentHistory = readJsonSafe(REWARDS_HISTORY_FILE, rewardsHistory050);
  res.json({
    success: true,
    user: rewardsUser050,
    coins: rewardsUser050.coins,
    catalog: rewardsCatalog,
    rewards: rewardsCatalog,
    vouchers: currentHistory
  });
});

app.get(['/api/rewards/history', '/api/redeem/history'], (req, res) => {
  const list = readJsonSafe(REWARDS_HISTORY_FILE, rewardsHistory050);
  res.json({ success: true, history: list });
});

app.get('/api/rewards/:id', (req, res) => {
  const item = rewardsCatalog.find(r => r.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "ไม่พบข้อมูลรางวัลนี้" });
  res.json({ success: true, reward: item });
});

app.post(['/api/redeem', '/api/rewards/redeem'], (req, res) => {
  const { rewardId } = req.body;
  const reward = rewardsCatalog.find(r => r.id === rewardId);
  if (!reward) return res.status(404).json({ success: false, message: "ไม่พบรายการรางวัลที่เลือก" });
  if (reward.stock <= 0) return res.status(400).json({ success: false, message: "ขออภัย สินค้าชิ้นนี้หมดแล้ว" });
  if (rewardsUser050.coins < reward.coins) {
    return res.status(400).json({ success: false, message: `จำนวน Coins ไม่เพียงพอ (ต้องการ ${reward.coins} Coins แต่คุณมี ${rewardsUser050.coins} Coins)` });
  }

  rewardsUser050.coins -= reward.coins;
  reward.stock -= 1;
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const couponCode = `SKRU-${reward.coins}-${randomSuffix}`;
  const defaultImg = reward.id === 'rw-02' ? '/assets/jacket.jpg' : '/assets/backpack.jpg';
  const transaction = {
    id: `TXN-${Date.now()}`,
    rewardId: reward.id,
    rewardTitle: reward.title,
    rewardImage: reward.image || defaultImg,
    coinsSpent: reward.coins,
    couponCode: couponCode,
    qrData: `REDEEM:${couponCode}:${rewardsUser050.studentId}`,
    redeemedAt: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
    status: 'ACTIVE'
  };

  rewardsHistory050 = readJsonSafe(REWARDS_HISTORY_FILE, rewardsHistory050);
  rewardsHistory050.unshift(transaction);
  writeJsonSafe(REWARDS_HISTORY_FILE, rewardsHistory050);

  res.json({
    success: true,
    message: "แลกรับรางวัลสำเร็จ!",
    coins: rewardsUser050.coins,
    user: rewardsUser050,
    reward,
    transaction,
    voucher: transaction
  });
});


app.post('/api/earn-coins', (req, res) => {
  const amount = Number(req.body.amount) || 200;
  rewardsUser050.coins += amount;
  res.json({ success: true, message: `ได้รับ ${amount} Coins เรียบร้อย!`, coins: rewardsUser050.coins });
});

// =========================================================================
// 17. FALLBACK DIRECT ROUTING FOR ALL 20 SERVICE HTMLs
// =========================================================================
app.get('/:page.html', (req, res, next) => {
  const filePath = path.join(__dirname, `${req.params.page}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// Fallback index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log('==================================================================');
  console.log('🏛️  SKRU UNIFIED DIGITAL SUPERAPP IS LIVE (ระบบเทพระดับมหาวิทยาลัย)');
  console.log(`🌐 Server Port: http://localhost:${PORT}`);
  console.log('📱 Portal Dashboard: http://localhost:' + PORT + '/index.html');
  console.log('------------------------------------------------------------------');
  console.log('🚀 All 20 University Digital Services Active & Connected:');
  console.log('   01. Check-in Class:       /check-in.html');
  console.log('   02. Student Profile:      /student-profile.html  (alias: /profile.html)');
  console.log('   03. Tuition Fee:          /tuition-fee.html      (alias: /payment.html)');
  console.log('   04. Student Card:         /student-card.html      (alias: /card.html)');
  console.log('   05. Academic Records:     /academic-record.html  (alias: /grades.html)');
  console.log('   06. Campus Map:           /campus-map.html       (alias: /map.html)');
  console.log('   07. Student Loan (กยศ.):  /student-loan.html');
  console.log('   08. Booking & Equipment:  /booking.html           (alias: /reservation.html)');
  console.log('   09. Faculty Contact:      /faculty-contact.html  (alias: /contact.html)');
  console.log('   10. University News:      /news.html');
  console.log('   11. Learning Resources:   /learning-resources.html');
  console.log('   12. Dormitory Booking:    /dorm-booking.html');
  console.log('   13. Event & Activities:   /event-booking.html    (alias: /activities.html)');
  console.log('   14. Privacy & PDPA:       /privacy-settings.html (alias: /privacy.html)');
  console.log('   15. Academic Calendar:    /academic-calendar.html');
  console.log('   16. Authentication Login: /login.html');
  console.log('   17. System Settings:      /settings.html');
  console.log('   18. Vote & Evaluation:    /vote.html');
  console.log('   19. Student Rewards:      /rewards.html          (alias: /redeem.html)');
  console.log('   20. Central Library OPAC: /library.html');
  console.log('==================================================================');
});
