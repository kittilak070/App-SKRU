// SKRU Tuition Fee Frontend Logic
const mockStudents = {
  '6530100001': {
    id: '6530100001',
    name: 'นาย.กรรณพัต วังค้อม',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    major: 'วิทยาการคอมพิวเตอร์',
    year: 3,
    fee: {
      id: 'FEE001',
      studentId: '6530100001',
      semester: '1/2569',
      description: 'ค่าธรรมเนียมการศึกษา ภาคเรียนที่ 1/2569',
      refCode1: '1234620311123485687',
      refCode2: '1234620311123485175',
      amount: 11000.00,
      status: 'pending',
      dueDate: '30 พ.ย. 2569'
    }
  },
  '6530100002': {
    id: '6530100002',
    name: 'นางสาว.สมฤดี ใจดี',
    faculty: 'คณะครุศาสตร์',
    major: 'ภาษาอังกฤษ',
    year: 2,
    fee: {
      id: 'FEE002',
      studentId: '6530100002',
      semester: '1/2569',
      description: 'ค่าธรรมเนียมการศึกษา ภาคเรียนที่ 1/2569',
      refCode1: '1234620311123485688',
      refCode2: '1234620311123485176',
      amount: 12500.00,
      status: 'pending',
      dueDate: '30 พ.ย. 2569'
    }
  }
};

let currentStudent = null;
let currentFee = null;

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const studentIdInput = document.getElementById('studentIdInput');
  const chipButtons = document.querySelectorAll('.btn-chip');
  const loginSection = document.getElementById('loginSection');
  const feeSection = document.getElementById('feeSection');
  const backToSearchBtn = document.getElementById('backToSearchBtn');
  const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
  const paymentSelectionArea = document.getElementById('paymentSelectionArea');
  const receiptCard = document.getElementById('receiptCard');
  const resetBtn = document.getElementById('resetBtn');
  const userBadge = document.getElementById('userBadge');
  const logoutBtn = document.getElementById('logoutBtn');

  // Quick Chips
  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      studentIdInput.value = btn.dataset.id;
      loadStudent(btn.dataset.id);
    });
  });

  // Form Submit
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = studentIdInput.value.trim();
    if (!id) return;
    loadStudent(id);
  });

  // Load student function
  async function loadStudent(id) {
    try {
      // Try backend first
      const res = await fetch(`/api/students/${id}`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        currentStudent = json.data;
        const feeRes = await fetch(`/api/fees/${id}`).catch(() => null);
        if (feeRes && feeRes.ok) {
          const feeJson = await feeRes.json();
          currentFee = Array.isArray(feeJson.data) ? feeJson.data[0] : feeJson.data;
        }
      }
    } catch (e) {
      console.log('Using local fallback mock data');
    }

    // Fallback to local mock data
    if (!currentStudent) {
      if (mockStudents[id]) {
        currentStudent = mockStudents[id];
        currentFee = mockStudents[id].fee;
      } else {
        // Generic fallback for any 10-digit ID
        currentStudent = {
          id: id,
          name: `นักศึกษา รหัส ${id}`,
          faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
          major: 'สาขาวิชาเทคโนโลยีสารสนเทศ',
          year: 3
        };
        currentFee = {
          id: 'FEE-' + id,
          studentId: id,
          semester: '1/2569',
          description: 'ค่าธรรมเนียมการศึกษา ภาคเรียนที่ 1/2569',
          refCode1: '1234' + id.substring(0, 6),
          refCode2: '9876' + id.substring(4),
          amount: 11000.00,
          status: 'pending',
          dueDate: '30 พ.ย. 2569'
        };
      }
    }

    renderStudentFee();
  }

  function renderStudentFee() {
    loginSection.style.display = 'none';
    feeSection.style.display = 'block';
    userBadge.style.display = 'flex';

    document.getElementById('badgeName').textContent = currentStudent.name;
    document.getElementById('badgeId').textContent = currentStudent.id;

    document.getElementById('studentName').textContent = currentStudent.name;
    document.getElementById('studentId').textContent = currentStudent.id;
    document.getElementById('studentFaculty').textContent = currentStudent.faculty;
    document.getElementById('studentMajor').textContent = currentStudent.major;
    document.getElementById('studentYear').textContent = currentStudent.year;

    document.getElementById('feeDescription').textContent = currentFee.description;
    document.getElementById('feeSemester').textContent = currentFee.semester;
    document.getElementById('feeRef1').textContent = currentFee.refCode1;
    document.getElementById('feeRef2').textContent = currentFee.refCode2;
    document.getElementById('feeDueDate').textContent = currentFee.dueDate;
    document.getElementById('feeAmount').textContent = '฿' + Number(currentFee.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 });

    paymentSelectionArea.style.display = 'block';
    receiptCard.style.display = 'none';

    // QR Image update
    const qrData = `PromptPay|00020101021229370016A000000677010111|${currentFee.amount}|Ref1:${currentFee.refCode1}`;
    document.getElementById('qrCodeImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;
  }

  // Payment Confirmation
  confirmPaymentBtn.addEventListener('click', async () => {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const methodNames = {
      'QR_PROMPTPAY': 'QR พร้อมเพย์ / Mobile Banking',
      'BANK_TRANSFER': 'โอนผ่านบัญชีธนาคาร',
      'CREDIT_CARD': 'บัตรเครดิต / บัตรเดบิต'
    };

    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังประมวลผล...';

    // Try backend payment
    let paymentData = null;
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeId: currentFee.id,
          studentId: currentStudent.id,
          paymentMethod: selectedMethod
        })
      });
      if (res.ok) {
        const json = await res.json();
        paymentData = json.data;
      }
    } catch (e) {
      console.log('Mocking payment submission');
    }

    if (!paymentData) {
      paymentData = {
        id: 'PAY' + Date.now(),
        transactionRef: 'TXN' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        paidAt: new Date().toLocaleString('th-TH'),
        amount: currentFee.amount,
        paymentMethod: selectedMethod
      };
    }

    setTimeout(() => {
      confirmPaymentBtn.disabled = false;
      confirmPaymentBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> ยืนยันการชำระเงินจำลอง';
      showReceipt(paymentData, methodNames[selectedMethod]);
    }, 600);
  });

  function showReceipt(payment, methodName) {
    paymentSelectionArea.style.display = 'none';
    receiptCard.style.display = 'block';

    document.getElementById('rcptNo').textContent = payment.id;
    document.getElementById('rcptDate').textContent = payment.paidAt || new Date().toLocaleString('th-TH');
    document.getElementById('rcptStudentId').textContent = currentStudent.id;
    document.getElementById('rcptStudentName').textContent = currentStudent.name;
    document.getElementById('rcptMethod').textContent = methodName;
    document.getElementById('rcptTxn').textContent = payment.transactionRef;

    document.getElementById('rcptItemName').textContent = currentFee.description;
    const formattedAmount = '฿' + Number(payment.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 });
    document.getElementById('rcptAmount').textContent = formattedAmount;
    document.getElementById('rcptTotal').textContent = formattedAmount;
  }

  // Logout / Back
  backToSearchBtn.addEventListener('click', resetView);
  resetBtn.addEventListener('click', resetView);
  logoutBtn.addEventListener('click', resetView);

  function resetView() {
    feeSection.style.display = 'none';
    loginSection.style.display = 'block';
    userBadge.style.display = 'none';
    studentIdInput.value = '';
    currentStudent = null;
    currentFee = null;
  }
});
