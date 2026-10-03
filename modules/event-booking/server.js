const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data file paths
const ACTIVITIES_FILE = path.join(__dirname, 'data', 'activities.json');
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');

// Helpers for data reading and writing
function readJSON(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) {
      return fallback;
    }
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return fallback;
  }
}

function writeJSON(file, data) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
    return false;
  }
}

// Student profile and default stats
const DEFAULT_STUDENT = {
  id: "66010123",
  name: "นายณัฐพล สมบูรณ์",
  faculty: "คณะวิศวกรรมศาสตร์และเทคโนโลยี",
  major: "สาขาวิชาวิศวกรรมคอมพิวเตอร์",
  year: "ชั้นปีที่ 2",
  gpa: "3.68",
  conductScore: 100,
  maxConductScore: 100,
  conductStatus: "ความประพฤติดีเยี่ยม",
  hoursCompleted: 38,
  hoursTarget: 50,
  kysCompleted: 24,
  kysTarget: 36,
  breakdown: [
    { title: "กิจกรรมบังคับมหาวิทยาลัย", current: 18, total: 20, icon: "school" },
    { title: "กิจกรรมเสริมสร้างสมรรถนะ", current: 12, total: 15, icon: "stars" },
    { title: "กิจกรรมบำเพ็ญประโยชน์/จิตอาสา", current: 8, total: 15, icon: "volunteer" }
  ]
};

// 1. Get all activities with optional query & category filter
app.get('/api/activities', (req, res) => {
  const { q, category } = req.query;
  let activities = readJSON(ACTIVITIES_FILE, []);

  if (category && category !== 'ทั้งหมด') {
    activities = activities.filter(a => a.category === category || (category === 'กยศ.' && a.isKYS));
  }

  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    activities = activities.filter(a => 
      a.title.toLowerCase().includes(term) ||
      a.code.toLowerCase().includes(term) ||
      a.location.toLowerCase().includes(term) ||
      a.category.toLowerCase().includes(term)
    );
  }

  res.json({
    success: true,
    total: activities.length,
    data: activities
  });
});

// 2. Get single activity detail
app.get('/api/activities/:id', (req, res) => {
  const activities = readJSON(ACTIVITIES_FILE, []);
  const activity = activities.find(a => a.id === req.params.id || a.code.toLowerCase() === req.params.id.toLowerCase());

  if (!activity) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรมที่ระบุ' });
  }

  res.json({ success: true, data: activity });
});

// 3. Book an activity
app.post('/api/activities/book', (req, res) => {
  const { activityId, studentId = DEFAULT_STUDENT.id, studentName = DEFAULT_STUDENT.name } = req.body;
  if (!activityId) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุกิจกรรมที่ต้องการจอง' });
  }

  const activities = readJSON(ACTIVITIES_FILE, []);
  const bookings = readJSON(BOOKINGS_FILE, []);

  const activityIndex = activities.findIndex(a => a.id === activityId);
  if (activityIndex === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรมนี้ในระบบ' });
  }

  const activity = activities[activityIndex];

  // Check already booked
  const alreadyBooked = bookings.some(b => b.activityId === activity.id && b.studentId === studentId);
  if (alreadyBooked) {
    return res.status(400).json({ success: false, message: 'ท่านได้ลงทะเบียนกิจกรรมนี้เรียบร้อยแล้ว' });
  }

  // Check seat capacity
  if (activity.bookedSeats >= activity.maxSeats) {
    return res.status(400).json({ success: false, message: 'ที่นั่งสำหรับกิจกรรมนี้เต็มแล้ว' });
  }

  // Increment booked count
  activity.bookedSeats += 1;
  activities[activityIndex] = activity;
  writeJSON(ACTIVITIES_FILE, activities);

  // Generate seat number & booking id
  const seatPrefix = String.fromCharCode(65 + Math.floor(activity.bookedSeats / 30));
  const seatNum = (activity.bookedSeats % 30 || 30).toString().padStart(3, '0');
  const seatNumber = `${seatPrefix}-${seatNum}`;

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
    studentId: studentId,
    studentName: studentName,
    faculty: DEFAULT_STUDENT.faculty,
    major: DEFAULT_STUDENT.major,
    registeredAt: new Date().toISOString(),
    status: 'ลงทะเบียนสำเร็จ',
    seatNumber: seatNumber
  };

  bookings.unshift(newBooking);
  writeJSON(BOOKINGS_FILE, bookings);

  res.status(201).json({
    success: true,
    message: `ลงทะเบียนกิจกรรม "${activity.title}" สำเร็จ!`,
    data: newBooking
  });
});

// 4. Register by Activity Code
app.post('/api/activities/code', (req, res) => {
  const { code, studentId = DEFAULT_STUDENT.id, studentName = DEFAULT_STUDENT.name } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุรหัสกิจกรรม' });
  }

  const activities = readJSON(ACTIVITIES_FILE, []);
  const normalizedCode = code.trim().toUpperCase();
  const activity = activities.find(a => a.code.toUpperCase() === normalizedCode);

  if (!activity) {
    return res.status(404).json({ 
      success: false, 
      message: `ไม่พบรหัสกิจกรรม "${code}" กรุณาตรวจสอบรหัสอีกครั้ง (เช่น ORI-101, VOL-201, TECH-301)` 
    });
  }

  const bookings = readJSON(BOOKINGS_FILE, []);
  const alreadyBooked = bookings.some(b => b.activityId === activity.id && b.studentId === studentId);
  if (alreadyBooked) {
    return res.status(400).json({ success: false, message: `คุณได้ลงทะเบียนกิจกรรม [${activity.code}] ${activity.title} ไว้แล้ว` });
  }

  if (activity.bookedSeats >= activity.maxSeats) {
    return res.status(400).json({ success: false, message: 'ที่นั่งสำหรับกิจกรรมนี้เต็มแล้ว' });
  }

  // Update activity seats
  activity.bookedSeats += 1;
  writeJSON(ACTIVITIES_FILE, activities);

  const seatPrefix = String.fromCharCode(65 + Math.floor(activity.bookedSeats / 30));
  const seatNum = (activity.bookedSeats % 30 || 30).toString().padStart(3, '0');
  const seatNumber = `${seatPrefix}-${seatNum}`;

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
    studentId: studentId,
    studentName: studentName,
    faculty: DEFAULT_STUDENT.faculty,
    major: DEFAULT_STUDENT.major,
    registeredAt: new Date().toISOString(),
    status: 'ลงทะเบียนสำเร็จ (ผ่านรหัส)',
    seatNumber: seatNumber
  };

  bookings.unshift(newBooking);
  writeJSON(BOOKINGS_FILE, bookings);

  res.status(201).json({
    success: true,
    message: `เพิ่มกิจกรรมด้วยรหัส "${activity.code}" สำเร็จ!`,
    data: newBooking
  });
});

// 5. Get Student's Bookings
app.get('/api/my-bookings', (req, res) => {
  const studentId = req.query.studentId || DEFAULT_STUDENT.id;
  const bookings = readJSON(BOOKINGS_FILE, []);
  const userBookings = bookings.filter(b => b.studentId === studentId);

  res.json({
    success: true,
    total: userBookings.length,
    data: userBookings
  });
});

// 6. Cancel Booking
app.delete('/api/bookings/:id', (req, res) => {
  const bookingId = req.params.id;
  const bookings = readJSON(BOOKINGS_FILE, []);
  const activities = readJSON(ACTIVITIES_FILE, []);

  const bookingIndex = bookings.findIndex(b => b.id === bookingId);
  if (bookingIndex === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการลงทะเบียนที่ต้องการยกเลิก' });
  }

  const removedBooking = bookings[bookingIndex];
  bookings.splice(bookingIndex, 1);
  writeJSON(BOOKINGS_FILE, bookings);

  // Return seat to activity
  const activity = activities.find(a => a.id === removedBooking.activityId);
  if (activity && activity.bookedSeats > 0) {
    activity.bookedSeats -= 1;
    writeJSON(ACTIVITIES_FILE, activities);
  }

  res.json({
    success: true,
    message: `ยกเลิกการลงทะเบียนกิจกรรม "${removedBooking.activityTitle}" สำเร็จแล้ว`,
    data: removedBooking
  });
});

// 7. Get Student Stats & Overview
app.get('/api/student-stats', (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE, []);
  const userBookings = bookings.filter(b => b.studentId === DEFAULT_STUDENT.id);

  // Calculate dynamic stats based on bookings
  const pendingHours = userBookings.reduce((sum, b) => sum + (b.hours || 0), 0);
  const pendingKysHours = userBookings.filter(b => b.isKYS).reduce((sum, b) => sum + (b.hours || 0), 0);

  res.json({
    success: true,
    data: {
      ...DEFAULT_STUDENT,
      registeredCount: userBookings.length,
      pendingHours: pendingHours,
      totalProjectedHours: DEFAULT_STUDENT.hoursCompleted + pendingHours,
      totalProjectedKys: DEFAULT_STUDENT.kysCompleted + pendingKysHours
    }
  });
});

// 8. Notifications API
app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "notif-1",
        title: "เปิดรับสมัครกิจกรรมจิตอาสาปลูกป่าชายเลน (กยศ.)",
        date: "วันนี้, 09:30 น.",
        unread: true,
        type: "event"
      },
      {
        id: "notif-2",
        title: "แจ้งเตือน: อบรมเทคโนโลยี AI จัดขึ้นวันที่ 24 ต.ค. นี้",
        date: "เมื่อวานนี้",
        unread: false,
        type: "reminder"
      },
      {
        id: "notif-3",
        title: "ระบบได้บันทึกชั่วโมงกิจกรรมบังคับ 6 ชั่วโมงแล้ว",
        date: "3 วันที่แล้ว",
        unread: false,
        type: "success"
      }
    ]
  });
});

// Fallback to index.html for SPA (compatible with Express 4 & 5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server listener with automatic port fallback
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`===============================================`);
    console.log(`🚀 Activity Booking System Server is Running!`);
    console.log(`📍 URL: http://localhost:${port}`);
    console.log(`📁 Static files: ${path.join(__dirname, 'public')}`);
    console.log(`===============================================`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
