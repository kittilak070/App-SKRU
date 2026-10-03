const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== Mock Data ==========

// ข้อมูลนักศึกษา
const students = [
  {
    id: '6530100001',
    name: 'นาย.กรรณพัต วังค้อม',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    major: 'วิทยาการคอมพิวเตอร์',
    year: 3
  },
  {
    id: '6530100002',
    name: 'นางสาว.สมฤดี ใจดี',
    faculty: 'คณะครุศาสตร์',
    major: 'ภาษาอังกฤษ',
    year: 2
  }
];

// ข้อมูลค่าธรรมเนียมการศึกษา
const fees = [
  {
    id: 'FEE001',
    studentId: '6530100001',
    semester: '1/2569',
    description: 'ค่าธรรมเนียมการศึกษา 1/2569',
    refCode1: '1234620311123485687',
    refCode2: '1234620311123485175',
    amount: 11000.00,
    status: 'pending',
    dueDate: '2026-11-30'
  },
  {
    id: 'FEE002',
    studentId: '6530100002',
    semester: '1/2569',
    description: 'ค่าธรรมเนียมการศึกษา 1/2569',
    refCode1: '1234620311123485688',
    refCode2: '1234620311123485176',
    amount: 12500.00,
    status: 'pending',
    dueDate: '2026-11-30'
  }
];

// ข้อมูลการชำระเงิน
const payments = [];

// ========== API Routes ==========

// หน้าแรก
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ดึงข้อมูลนักศึกษา
app.get('/api/students/:id', (req, res) => {
  const student = students.find(s => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษา' });
  }
  res.json({ success: true, data: student });
});

// ดึงข้อมูลค่าธรรมเนียม
app.get('/api/fees/:studentId', (req, res) => {
  const studentFees = fees.filter(f => f.studentId === req.params.studentId);
  if (studentFees.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลค่าธรรมเนียม' });
  }
  res.json({ success: true, data: studentFees });
});

// ดึงค่าธรรมเนียมตาม ID
app.get('/api/fee/:feeId', (req, res) => {
  const fee = fees.find(f => f.id === req.params.feeId);
  if (!fee) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลค่าธรรมเนียม' });
  }
  const student = students.find(s => s.id === fee.studentId);
  res.json({ success: true, data: { fee, student } });
});

// ชำระเงิน
app.post('/api/payment', (req, res) => {
  const { feeId, paymentMethod, studentId } = req.body;

  if (!feeId || !paymentMethod || !studentId) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const fee = fees.find(f => f.id === feeId);
  if (!fee) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลค่าธรรมเนียม' });
  }

  if (fee.status === 'paid') {
    return res.status(400).json({ success: false, message: 'ค่าธรรมเนียมนี้ได้ชำระแล้ว' });
  }

  const payment = {
    id: 'PAY' + Date.now(),
    feeId,
    studentId,
    paymentMethod,
    amount: fee.amount,
    paidAt: new Date().toISOString(),
    status: 'success',
    transactionRef: 'TXN' + Math.random().toString(36).substring(2, 10).toUpperCase()
  };

  payments.push(payment);
  fee.status = 'paid';

  res.json({
    success: true,
    message: 'ชำระเงินสำเร็จ',
    data: payment
  });
});

// ดึงประวัติการชำระเงิน
app.get('/api/payments/:studentId', (req, res) => {
  const studentPayments = payments.filter(p => p.studentId === req.params.studentId);
  res.json({ success: true, data: studentPayments });
});

// ดึงข้อมูลใบเสร็จ
app.get('/api/receipt/:paymentId', (req, res) => {
  const payment = payments.find(p => p.id === req.params.paymentId);
  if (!payment) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลใบเสร็จ' });
  }
  const fee = fees.find(f => f.id === payment.feeId);
  const student = students.find(s => s.id === payment.studentId);
  res.json({ success: true, data: { payment, fee, student } });
});

// ========== Start Server ==========
app.listen(PORT, () => {
  console.log(`🚀 SKRU Payment Server running at http://localhost:${PORT}`);
});
