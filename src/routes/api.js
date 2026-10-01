const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/db.json');

function readDB() {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

// 1. Get Announcements / News
router.get('/news', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get Loan Information
router.get('/loans/info', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.loanInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get Institution Contact Info
router.get('/institution', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.institutionInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Get Repayment Info & Channels
router.get('/repayments/info', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: { channels: db.repaymentChannels } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Post Repayment Registration
router.post('/repayments/register', (req, res) => {
  try {
    const { studentId, idCard, fullName, faculty, phone, email, expectedGraduationYear, repaymentType } = req.body;

    if (!idCard || !fullName || !phone) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (เลขบัตรประชาชน, ชื่อ-สกุล, เบอร์โทร)' });
    }

    const db = readDB();
    const newRegistration = {
      id: 'REG-' + Date.now().toString().slice(-6),
      studentId: studentId || '-',
      idCard,
      fullName,
      faculty: faculty || '-',
      phone,
      email: email || '-',
      expectedGraduationYear: expectedGraduationYear || '2569',
      repaymentType: repaymentType || 'ผ่อนชำระรายเดือน',
      status: 'ลงทะเบียนสำเร็จ',
      createdAt: new Date().toISOString()
    };

    db.registeredRepayments.unshift(newRegistration);
    writeDB(db);

    res.status(201).json({
      success: true,
      message: 'ลงทะเบียนความประสงค์ชำระหนี้เรียบร้อยแล้ว',
      data: newRegistration
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Check Registration Status
router.get('/repayments/status/:query', (req, res) => {
  try {
    const query = req.params.query.trim();
    const db = readDB();
    const match = db.registeredRepayments.find(item => item.idCard === query || item.studentId === query || item.id === query);

    if (match) {
      res.json({ success: true, data: match });
    } else {
      res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการลงทะเบียนตามเงื่อนไขที่ระบุ' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Get Salary Deduction Info
router.get('/salary-deduction', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.salaryDeductionInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Get Volunteer Activities
router.get('/volunteer', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.volunteerActivities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. Get Hall of Fame
router.get('/hall-of-fame', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.hallOfFameList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
