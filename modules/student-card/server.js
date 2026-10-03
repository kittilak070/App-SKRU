const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'students.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure directories exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration for profile photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `student_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น!'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper functions to read/write JSON data
function readStudents() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data:', err);
    return [];
  }
}

function writeStudents(students) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing data:', err);
    return false;
  }
}

// API Routes

// 1. Get all students
app.get('/api/students', (req, res) => {
  let students = readStudents();
  const search = (req.query.q || '').trim().toLowerCase();
  
  if (search) {
    students = students.filter(s => 
      s.studentId.toLowerCase().includes(search) ||
      s.firstNameTh.toLowerCase().includes(search) ||
      s.lastNameTh.toLowerCase().includes(search) ||
      s.firstNameEn.toLowerCase().includes(search) ||
      s.lastNameEn.toLowerCase().includes(search) ||
      s.facultyTh.toLowerCase().includes(search)
    );
  }

  res.json({
    success: true,
    count: students.length,
    data: students
  });
});

// 2. Get single student by ID
app.get('/api/students/:id', (req, res) => {
  const students = readStudents();
  const student = students.find(s => s.id === req.params.id || s.studentId === req.params.id);
  
  if (!student) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษา' });
  }
  
  res.json({ success: true, data: student });
});

// 3. Create new student
app.post('/api/students', upload.single('photo'), (req, res) => {
  const students = readStudents();
  const body = req.body;
  
  const studentId = body.studentId ? body.studentId.trim() : `STU${Date.now()}`;
  
  // Check duplicate ID
  if (students.some(s => s.studentId === studentId)) {
    return res.status(400).json({ success: false, message: 'รหัสนักศึกษานี้มีอยู่ในระบบแล้ว' });
  }

  let photoUrl = '/assets/student_nutella.jpg';
  if (req.file) {
    photoUrl = `/uploads/${req.file.filename}`;
  } else if (body.photoUrl) {
    photoUrl = body.photoUrl;
  }

  const newStudent = {
    id: studentId,
    prefixTh: body.prefixTh || 'นาย',
    firstNameTh: body.firstNameTh || '',
    lastNameTh: body.lastNameTh || '',
    prefixEn: body.prefixEn || 'Mr.',
    firstNameEn: body.firstNameEn || '',
    lastNameEn: body.lastNameEn || '',
    studentId: studentId,
    universityTh: body.universityTh || 'มหาวิทยาลัยราชภัฏสงขลา',
    universityEn: body.universityEn || 'SONGKHLA RAJABHAT UNIVERSITY',
    universityAbbr: body.universityAbbr || 'SKRU',
    facultyTh: body.facultyTh || 'คณะวิทยาศาสตร์และเทคโนโลยี',
    facultyEn: body.facultyEn || 'Faculty of Science and Technology',
    majorTh: body.majorTh || 'สาขาวิชาวิทยาการคอมพิวเตอร์',
    majorEn: body.majorEn || 'Department of Computer Science',
    degree: body.degree || 'ปริญญาตรี (Bachelor)',
    status: body.status || 'active',
    issueDate: body.issueDate || new Date().toISOString().split('T')[0],
    expiryDate: body.expiryDate || '2028-05-31',
    photoUrl: photoUrl,
    nationalId: body.nationalId || '1-XXXX-XXXXX-XX-X',
    bloodGroup: body.bloodGroup || 'O',
    emergencyContact: body.emergencyContact || '-'
  };

  students.unshift(newStudent);
  writeStudents(students);

  res.status(201).json({
    success: true,
    message: 'สร้างบัตรนักศึกษาเรียบร้อยแล้ว',
    data: newStudent
  });
});

// 4. Update student
app.put('/api/students/:id', upload.single('photo'), (req, res) => {
  const students = readStudents();
  const index = students.findIndex(s => s.id === req.params.id || s.studentId === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษา' });
  }

  const existing = students[index];
  const body = req.body;

  let photoUrl = existing.photoUrl;
  if (req.file) {
    photoUrl = `/uploads/${req.file.filename}`;
  } else if (body.photoUrl) {
    photoUrl = body.photoUrl;
  }

  const updatedStudent = {
    ...existing,
    prefixTh: body.prefixTh !== undefined ? body.prefixTh : existing.prefixTh,
    firstNameTh: body.firstNameTh !== undefined ? body.firstNameTh : existing.firstNameTh,
    lastNameTh: body.lastNameTh !== undefined ? body.lastNameTh : existing.lastNameTh,
    prefixEn: body.prefixEn !== undefined ? body.prefixEn : existing.prefixEn,
    firstNameEn: body.firstNameEn !== undefined ? body.firstNameEn : existing.firstNameEn,
    lastNameEn: body.lastNameEn !== undefined ? body.lastNameEn : existing.lastNameEn,
    universityTh: body.universityTh !== undefined ? body.universityTh : existing.universityTh,
    universityEn: body.universityEn !== undefined ? body.universityEn : existing.universityEn,
    universityAbbr: body.universityAbbr !== undefined ? body.universityAbbr : existing.universityAbbr,
    facultyTh: body.facultyTh !== undefined ? body.facultyTh : existing.facultyTh,
    facultyEn: body.facultyEn !== undefined ? body.facultyEn : existing.facultyEn,
    majorTh: body.majorTh !== undefined ? body.majorTh : existing.majorTh,
    majorEn: body.majorEn !== undefined ? body.majorEn : existing.majorEn,
    degree: body.degree !== undefined ? body.degree : existing.degree,
    status: body.status !== undefined ? body.status : existing.status,
    issueDate: body.issueDate !== undefined ? body.issueDate : existing.issueDate,
    expiryDate: body.expiryDate !== undefined ? body.expiryDate : existing.expiryDate,
    photoUrl: photoUrl,
    nationalId: body.nationalId !== undefined ? body.nationalId : existing.nationalId,
    bloodGroup: body.bloodGroup !== undefined ? body.bloodGroup : existing.bloodGroup,
    emergencyContact: body.emergencyContact !== undefined ? body.emergencyContact : existing.emergencyContact
  };

  students[index] = updatedStudent;
  writeStudents(students);

  res.json({
    success: true,
    message: 'อัปเดตข้อมูลนักศึกษาเรียบร้อยแล้ว',
    data: updatedStudent
  });
});

// 5. Delete student
app.delete('/api/students/:id', (req, res) => {
  let students = readStudents();
  const initialLen = students.length;
  students = students.filter(s => s.id !== req.params.id && s.studentId !== req.params.id);

  if (students.length === initialLen) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษา' });
  }

  writeStudents(students);
  res.json({ success: true, message: 'ลบข้อมูลนักศึกษาเรียบร้อยแล้ว' });
});

// 6. Verification Endpoint
app.get('/api/verify/:studentId', (req, res) => {
  const students = readStudents();
  const student = students.find(s => s.studentId === req.params.studentId || s.id === req.params.studentId);
  
  if (!student) {
    return res.json({
      success: false,
      isValid: false,
      message: 'ไม่พบบัตรนักศึกษานี้ในระบบ (Card Not Found)'
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const isExpired = student.expiryDate && student.expiryDate < today;
  const isActive = student.status === 'active';

  res.json({
    success: true,
    isValid: isActive && !isExpired,
    isExpired: isExpired,
    status: student.status,
    verifiedAt: new Date().toISOString(),
    student: {
      studentId: student.studentId,
      nameTh: `${student.prefixTh} ${student.firstNameTh} ${student.lastNameTh}`,
      nameEn: `${student.prefixEn} ${student.firstNameEn} ${student.lastNameEn}`,
      universityTh: student.universityTh,
      facultyTh: student.facultyTh,
      majorTh: student.majorTh,
      photoUrl: student.photoUrl,
      expiryDate: student.expiryDate
    }
  });
});

// Serve frontend SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server with automatic port fallback on EADDRINUSE
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`====================================================`);
    console.log(`🚀 SKRU Digital Student Card Server running at:`);
    console.log(`👉 http://localhost:${port}`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);

