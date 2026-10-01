const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'settings.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read settings
function readSettings() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return null;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading settings file:', err);
    return null;
  }
}

// Helper to write settings
function writeSettings(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing settings file:', err);
    return false;
  }
}

// API Routes

// GET /api/settings - Retrieve all user settings
app.get('/api/settings', (req, res) => {
  const settings = readSettings();
  if (!settings) {
    return res.status(500).json({ success: false, message: 'Failed to read settings data' });
  }
  res.json({ success: true, data: settings });
});

// PUT /api/settings/notifications - Update notification settings
app.put('/api/settings/notifications', (req, res) => {
  const settings = readSettings();
  if (!settings) return res.status(500).json({ success: false, message: 'Server error' });

  settings.notifications = { ...settings.notifications, ...req.body };
  writeSettings(settings);

  res.json({
    success: true,
    message: 'อัปเดตการตั้งค่าการแจ้งเตือนสำเร็จ (Notification settings updated)',
    data: settings.notifications
  });
});

// PUT /api/settings/subscriptions - Update news subscriptions
app.put('/api/settings/subscriptions', (req, res) => {
  const settings = readSettings();
  if (!settings) return res.status(500).json({ success: false, message: 'Server error' });

  settings.subscriptions = { ...settings.subscriptions, ...req.body };
  writeSettings(settings);

  res.json({
    success: true,
    message: 'อัปเดตการรับข่าวสารสำเร็จ (Subscriptions updated)',
    data: settings.subscriptions
  });
});

// PUT /api/settings/security - Update security settings
app.put('/api/settings/security', (req, res) => {
  const settings = readSettings();
  if (!settings) return res.status(500).json({ success: false, message: 'Server error' });

  settings.security = { ...settings.security, ...req.body };
  writeSettings(settings);

  res.json({
    success: true,
    message: 'อัปเดตการตั้งค่าความปลอดภัยสำเร็จ (Security settings updated)',
    data: settings.security
  });
});

// PUT /api/settings/privacy - Update privacy settings
app.put('/api/settings/privacy', (req, res) => {
  const settings = readSettings();
  if (!settings) return res.status(500).json({ success: false, message: 'Server error' });

  settings.privacy = { ...settings.privacy, ...req.body };
  writeSettings(settings);

  res.json({
    success: true,
    message: 'อัปเดตการตั้งค่าข้อมูลส่วนบุคคลสำเร็จ (Privacy consent updated)',
    data: settings.privacy
  });
});

// PUT /api/settings/general - Update general (language, etc.)
app.put('/api/settings/general', (req, res) => {
  const settings = readSettings();
  if (!settings) return res.status(500).json({ success: false, message: 'Server error' });

  settings.general = { ...settings.general, ...req.body };
  writeSettings(settings);

  res.json({
    success: true,
    message: 'อัปเดตข้อมูลทั่วไปสำเร็จ (General settings updated)',
    data: settings.general
  });
});

// POST /api/settings/reset - Reset settings to default
app.post('/api/settings/reset', (req, res) => {
  const defaultSettings = {
    notifications: {
      all_notifications: true,
      interesting_news: true,
      app_notifications: true,
      followed_activities: true,
      university_news: true,
      faculty_news: true,
      subscribe_news: true,
      course_notifications: true
    },
    subscriptions: {
      sports: true,
      health: true,
      activities: false,
      entertainment: true,
      study: true,
      promotions: false,
      scholarships: true,
      food: false,
      faculty_dept: true,
      travel: false
    },
    security: {
      biometrics: false,
      show_contact_info: false,
      location_history: false,
      pin_set: true
    },
    privacy: {
      product_improvement: true,
      product_marketing: true,
      partner_marketing: false
    },
    general: {
      language: "th",
      version: "26.8.0(2)"
    }
  };
  writeSettings(defaultSettings);
  res.json({
    success: true,
    message: 'รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นแล้ว',
    data: defaultSettings
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
