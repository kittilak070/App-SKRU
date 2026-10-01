const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'student.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DEFAULT_STUDENT = {
  nameTh: "นาย อดีต คิ้วโก่ง",
  nameEn: "ADEET KIWKHONG",
  studentType: "นักศึกษาภาคปกติ",
  studentId: "674295067",
  faculty: "คณะวิทยาศาสตร์และเทคโนโลยี",
  major: "เทคโนโลยีสารสนเทศ",
  degreeLevel: "ปริญญาตรี 4 ปี",
  yearLevel: "ปีที่ 3",
  birthDate: "12 มกราคม 2547",
  phone: "081-234-5678",
  email: "67295067@parichat.skru.ac.th",
  address: "123/45 หมู่ 6 ต.เขารูปช้าง\nอ.เมืองสงขลา จ.สงขลา\n90000",
  curriculum: "วิทยาศาสตรบัณฑิต (วท.บ.)",
  admissionYear: "2566",
  status: "ปกติ",
  gpa: "5.00",
  avatarUrl: null
};

// Middleware with 20MB limit for image uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read data safely
function getStudentData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STUDENT, null, 2), 'utf8');
      return DEFAULT_STUDENT;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading student data:', err);
    return DEFAULT_STUDENT;
  }
}

// API Routes
app.get('/api/student', (req, res) => {
  const data = getStudentData();
  res.json({ success: true, data });
});

// Update profile data
app.put('/api/student', (req, res) => {
  try {
    const current = getStudentData();
    const updated = { ...current, ...req.body };
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf8');
    res.json({ success: true, message: 'บันทึกข้อมูลเรียบร้อยแล้ว', data: updated });
  } catch (err) {
    console.error('Error updating student data:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
});

// Upload student photo (base64)
app.post('/api/student/photo', (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      // If null or empty, reset to default (SKRU logo)
      const current = getStudentData();
      current.avatarUrl = null;
      fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2), 'utf8');
      return res.json({ success: true, message: 'รีเซ็ตรูปภาพเป็นโลโก้ SKRU เรียบร้อยแล้ว', avatarUrl: null });
    }

    // Parse base64 data
    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    let ext = 'png';
    let base64Data = imageBase64;
    if (matches && matches.length === 3) {
      ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      base64Data = matches[2];
    }

    const fileName = `student_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const avatarUrl = `uploads/${fileName}`;
    const current = getStudentData();
    current.avatarUrl = avatarUrl;
    fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2), 'utf8');

    res.json({ success: true, message: 'อัปเดตรูปถ่ายนักศึกษาเรียบร้อยแล้ว', avatarUrl });
  } catch (err) {
    console.error('Error uploading photo:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
  }
});

app.post('/api/student/reset', (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STUDENT, null, 2), 'utf8');
    res.json({ success: true, message: 'รีเซ็ตข้อมูลเป็นค่าเริ่มต้นเรียบร้อยแล้ว', data: DEFAULT_STUDENT });
  } catch (err) {
    console.error('Error resetting student data:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`SKRU Student Profile Server is running!`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
