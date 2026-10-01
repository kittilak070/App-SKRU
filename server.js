const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Default Initial Data
const defaultData = {
  course: {
    code: "4663235",
    section: "01",
    name: "Human-Computer Interaction",
    credit: 3,
    teacher: "Mr.Panukorn Puripanyanon",
    dateTime: "TUE  08:00-12:00",
    room: "Lab.คอม301",
    isCheckInOpen: true, // Default open for easy testing
    pinCode: "8899",
    requirePin: false,
    sessionDate: "2026-09-30",
    totalCapacity: 35
  },
  currentStudentId: "6401001", // Ms.Rusnee yuda (active simulated student)
  students: [
    {
      id: "6401001",
      name: "Ms.Rusnee yuda",
      faculty: "Faculty of Science",
      major: "Computer Science",
      email: "rusnee.y@university.ac.th",
      avatar: "👩‍🎓",
      isCheckedIn: false,
      checkInTime: null
    },
    {
      id: "6401002",
      name: "Ms.Ponthip phetmak",
      faculty: "Faculty of Science",
      major: "Computer Science",
      email: "ponthip.p@university.ac.th",
      avatar: "👩‍💻",
      isCheckedIn: true,
      checkInTime: "08:12:45"
    },
    {
      id: "6401003",
      name: "Ms.Pechjamas Sarasee",
      faculty: "Faculty of Science",
      major: "Information Technology",
      email: "pechjamas.s@university.ac.th",
      avatar: "👩‍🔬",
      isCheckedIn: true,
      checkInTime: "08:15:20"
    },
    {
      id: "6401004",
      name: "Ms.Alisa Kongphol",
      faculty: "Faculty of Science",
      major: "Computer Science",
      email: "alisa.k@university.ac.th",
      avatar: "👩‍🎓",
      isCheckedIn: false,
      checkInTime: null
    },
    {
      id: "6401005",
      name: "Mr.MuhammadSubhee Baraheng",
      faculty: "Faculty of Science",
      major: "Software Engineering",
      email: "muhammad.b@university.ac.th",
      avatar: "👨‍💻",
      isCheckedIn: true,
      checkInTime: "08:05:10"
    },
    {
      id: "6401006",
      name: "Ms.Thawinee Aiadkhay",
      faculty: "Faculty of Science",
      major: "Computer Science",
      email: "thawinee.a@university.ac.th",
      avatar: "👩‍🎓",
      isCheckedIn: false,
      checkInTime: null
    },
    {
      id: "6401007",
      name: "Mr.Kittisak Saelim",
      faculty: "Faculty of Science",
      major: "Information Technology",
      email: "kittisak.s@university.ac.th",
      avatar: "👨‍🔬",
      isCheckedIn: true,
      checkInTime: "08:22:04"
    },
    {
      id: "6401008",
      name: "Ms.Nattakan Chaiwong",
      faculty: "Faculty of Science",
      major: "Computer Science",
      email: "nattakan.c@university.ac.th",
      avatar: "👩‍💼",
      isCheckedIn: false,
      checkInTime: null
    }
  ],
  messages: {
    "6401002": [
      { id: "m1", sender: "Ms.Ponthip phetmak", text: "สวัสดี รุสนี วันนี้อาจารย์เริ่มสอนหัวข้อ Wireframe แล้วนะ", time: "08:14" },
      { id: "m2", sender: "me", text: "ขอบคุณมากจ้า กำลังเดินขึ้นตึก 301!", time: "08:16" }
    ],
    "6401005": [
      { id: "m3", sender: "Mr.MuhammadSubhee Baraheng", text: "สไลด์การบ้านบทที่ 3 อัพเดทในระบบแล้วนะ", time: "08:08" }
    ]
  },
  history: [
    {
      date: "2026-09-23",
      week: 4,
      topic: "User Research & Personas",
      checkedInCount: 8,
      totalCount: 8,
      rate: "100%"
    },
    {
      date: "2026-09-16",
      week: 3,
      topic: "Information Architecture",
      checkedInCount: 7,
      totalCount: 8,
      rate: "87.5%"
    },
    {
      date: "2026-09-09",
      week: 2,
      topic: "HCI Design Principles & Heuristics",
      checkedInCount: 8,
      totalCount: 8,
      rate: "100%"
    },
    {
      date: "2026-09-02",
      week: 1,
      topic: "Introduction to HCI",
      checkedInCount: 8,
      totalCount: 8,
      rate: "100%"
    }
  ]
};

// Helper to load/save data
function getData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading data file:", err);
  }
  // Initialize default file if not exists
  saveData(defaultData);
  return JSON.parse(JSON.stringify(defaultData));
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error saving data file:", err);
  }
}

// ----------------- API ROUTES -----------------

// 1. Get Course Info & current session status
app.get('/api/course', (req, res) => {
  const data = getData();
  const checkedInCount = data.students.filter(s => s.isCheckedIn).length;
  const totalCount = data.students.length;
  
  res.json({
    success: true,
    course: data.course,
    currentStudentId: data.currentStudentId,
    stats: {
      checkedInCount,
      totalCount,
      percentage: totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0
    }
  });
});

// 2. Toggle Check-in Session (Teacher Action)
app.post('/api/course/toggle-session', (req, res) => {
  const data = getData();
  const { isCheckInOpen, pinCode, requirePin } = req.body;
  
  if (typeof isCheckInOpen === 'boolean') {
    data.course.isCheckInOpen = isCheckInOpen;
  }
  if (pinCode !== undefined) {
    data.course.pinCode = pinCode;
  }
  if (typeof requirePin === 'boolean') {
    data.course.requirePin = requirePin;
  }
  
  saveData(data);
  res.json({
    success: true,
    message: data.course.isCheckInOpen ? "เปิดระบบเช็คชื่อเรียบร้อย" : "ปิดระบบเช็คชื่อแล้ว",
    course: data.course
  });
});

// 3. Reset all check-in status (Start New Session)
app.post('/api/course/reset-session', (req, res) => {
  const data = getData();
  const today = new Date().toISOString().split('T')[0];
  
  // Archive current if there were checkins
  const checkedIn = data.students.filter(s => s.isCheckedIn).length;
  if (checkedIn > 0) {
    data.history.unshift({
      date: data.course.sessionDate || today,
      week: data.history.length + 1,
      topic: "HCI Laboratory Session",
      checkedInCount: checkedIn,
      totalCount: data.students.length,
      rate: `${Math.round((checkedIn / data.students.length) * 100)}%`
    });
  }
  
  data.course.sessionDate = today;
  data.students.forEach(s => {
    s.isCheckedIn = false;
    s.checkInTime = null;
  });
  
  saveData(data);
  res.json({ success: true, message: "เริ่มรอบเช็คชื่อใหม่เรียบร้อยแล้ว", students: data.students });
});

// 4. Get all students
app.get('/api/students', (req, res) => {
  const data = getData();
  res.json({
    success: true,
    students: data.students,
    currentStudentId: data.currentStudentId
  });
});

// 5. Check-in Student
app.post('/api/check-in', (req, res) => {
  const data = getData();
  const { studentId, pin, studentName } = req.body;
  
  if (!data.course.isCheckInOpen) {
    return res.status(400).json({
      success: false,
      message: "ระบบเช็คชื่อปิดอยู่ในขณะนี้ กรุณาติดต่ออาจารย์ผู้สอน"
    });
  }
  
  if (data.course.requirePin && data.course.pinCode) {
    if (pin !== data.course.pinCode) {
      return res.status(400).json({
        success: false,
        message: "รหัส PIN เช็คชื่อไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
      });
    }
  }
  
  const targetId = studentId || data.currentStudentId;
  const student = data.students.find(s => s.id === targetId || s.name === studentName);
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: "ไม่พบข้อมูลนักศึกษาในระบบ"
    });
  }
  
  if (student.isCheckedIn) {
    return res.status(200).json({
      success: true,
      alreadyCheckedIn: true,
      message: `${student.name} ได้เช็คชื่อเรียบร้อยแล้วเมื่อเวลา ${student.checkInTime}`,
      student
    });
  }
  
  const now = new Date();
  const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  student.isCheckedIn = true;
  student.checkInTime = timeString;
  
  saveData(data);
  
  res.json({
    success: true,
    message: `เช็คชื่อสำเร็จ! ยินดีต้อนรับ ${student.name}`,
    student,
    checkInTime: timeString
  });
});

// 6. Manual toggle checkin by teacher
app.post('/api/students/:id/toggle', (req, res) => {
  const data = getData();
  const student = data.students.find(s => s.id === req.params.id);
  
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
  
  saveData(data);
  res.json({ success: true, student });
});

// 7. Set current active user (for switching role/student in demo)
app.post('/api/user/switch', (req, res) => {
  const data = getData();
  const { studentId } = req.body;
  if (data.students.some(s => s.id === studentId)) {
    data.currentStudentId = studentId;
    saveData(data);
    return res.json({ success: true, currentStudentId: studentId });
  }
  res.status(400).json({ success: false, message: "Student ID not found" });
});

// 8. Add student
app.post('/api/students', (req, res) => {
  const data = getData();
  const { name, faculty, major, email, id } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: "กรุณาระบุชื่อ-นามสกุล" });
  }
  
  const newStudent = {
    id: id || `640${String(data.students.length + 1001).padStart(4, '0')}`,
    name,
    faculty: faculty || "Faculty of Science",
    major: major || "Computer Science",
    email: email || `${name.toLowerCase().replace(/[^a-z]/g, '')}@university.ac.th`,
    avatar: "🎓",
    isCheckedIn: false,
    checkInTime: null
  };
  
  data.students.push(newStudent);
  saveData(data);
  res.json({ success: true, student: newStudent });
});

// 9. Get Messages with a classmate
app.get('/api/chat/:studentId', (req, res) => {
  const data = getData();
  const { studentId } = req.params;
  const messages = data.messages[studentId] || [];
  const targetStudent = data.students.find(s => s.id === studentId);
  
  res.json({
    success: true,
    student: targetStudent,
    messages
  });
});

// 10. Send Message to classmate
app.post('/api/chat/:studentId', (req, res) => {
  const data = getData();
  const { studentId } = req.params;
  const { text } = req.body;
  
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: "ข้อความว่างเปล่า" });
  }
  
  if (!data.messages[studentId]) {
    data.messages[studentId] = [];
  }
  
  const now = new Date();
  const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  
  const newMsg = {
    id: 'm_' + Date.now(),
    sender: 'me',
    text: text.trim(),
    time
  };
  
  data.messages[studentId].push(newMsg);
  
  // Auto bot reply simulation after a brief delay if desired
  saveData(data);
  res.json({ success: true, message: newMsg });
});

// 11. History endpoint
app.get('/api/history', (req, res) => {
  const data = getData();
  res.json({
    success: true,
    history: data.history
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Class Check-in Server is running at http://localhost:${PORT}`);
});
