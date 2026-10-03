/**
 * SKRU Teacher Appointment System - Frontend Logic (Student Portal)
 * Supports both Live REST API Server and Smart LocalStorage Fallback
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const API_BASE = window.location.protocol === 'file:' ? null : '/api';

  // Storage key for offline/direct file fallback
  const STORAGE_KEY_APTS = 'skru_appointments_data';
  const STORAGE_KEY_TEACHER = 'skru_teacher_data';

  // DOM Elements
  const form = document.getElementById('appointmentForm');
  const resetBtn = document.getElementById('resetBtn');
  const closeBtn = document.getElementById('closeBtn');
  const teacherNameEl = document.getElementById('teacherName');
  const teacherFacultyEl = document.getElementById('teacherFaculty');
  const teacherStatusBadge = document.getElementById('teacherStatusBadge');
  const teacherStatusText = document.getElementById('teacherStatusText');
  const teacherHoursEl = document.getElementById('teacherHours');
  const appointmentDateInput = document.getElementById('appointmentDate');
  const submitBtn = document.getElementById('submitBtn');

  // Modal elements
  const successModal = document.getElementById('successModal');
  const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
  const ticketCodeEl = document.getElementById('ticketCode');
  const slipStudentEl = document.getElementById('slipStudent');
  const slipDateTimeEl = document.getElementById('slipDateTime');
  const slipTopicEl = document.getElementById('slipTopic');

  // Status check elements
  const statusModal = document.getElementById('statusModal');
  const openStatusModalBtn = document.getElementById('openStatusModalBtn');
  const closeStatusModalBtn = document.getElementById('closeStatusModalBtn');
  const searchStudentIdInput = document.getElementById('searchStudentId');
  const searchBtn = document.getElementById('searchBtn');
  const statusResults = document.getElementById('statusResults');

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  if (appointmentDateInput) {
    appointmentDateInput.min = today;
  }

  // Default Teacher Data
  function getLocalTeacher() {
    const saved = localStorage.getItem(STORAGE_KEY_TEACHER);
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return {
      id: "T001",
      name: "MR.Panukorn",
      faculty: "คณะวิทยาศาสตร์และเทคโนโลยี",
      status: "พร้อมให้เข้าพบ",
      isAvailable: true,
      consultationHours: "จันทร์, พุธ 13:00 - 16:00 น."
    };
  }

  function getLocalAppointments() {
    const saved = localStorage.getItem(STORAGE_KEY_APTS);
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [
      {
        id: "APT-20261001-001",
        studentName: "นายศุภกร ใจดี",
        studentId: "6512345678",
        contact: "081-234-5678",
        date: "2026-10-06",
        time: "13:30",
        topic: "ปรึกษาหัวข้อโครงงานวิจัยระบบ IoT ทางการเกษตร",
        teacherName: "MR.Panukorn",
        status: "APPROVED",
        teacherNote: "ยินดีให้คำปรึกษา กรุณานำเอกสารเค้าโครงเบื้องต้นมาด้วยครับ",
        createdAt: new Date().toISOString()
      }
    ];
  }

  function saveLocalAppointments(list) {
    localStorage.setItem(STORAGE_KEY_APTS, JSON.stringify(list));
  }

  // 1. Fetch & Display Teacher Information
  async function loadTeacherProfile() {
    let t = getLocalTeacher();
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/teacher`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) t = json.data;
        }
      } catch (err) {
        console.log('Running in LocalStorage mode');
      }
    }

    teacherNameEl.textContent = t.name || 'MR.Panukorn';
    teacherFacultyEl.textContent = t.faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี';
    teacherHoursEl.textContent = `ช่วงให้คำปรึกษา: ${t.consultationHours || 'จันทร์, พุธ 13:00 - 16:00 น.'}`;
    
    if (t.isAvailable) {
      teacherStatusBadge.className = 'status-pill';
      teacherStatusText.textContent = t.status || 'พร้อมให้เข้าพบ';
    } else {
      teacherStatusBadge.className = 'status-pill busy';
      teacherStatusText.textContent = t.status || 'ติดภารกิจ/งดรับนัด';
    }
  }

  loadTeacherProfile();

  // 2. Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentName = document.getElementById('studentName').value.trim();
    const studentId = document.getElementById('studentId').value.trim();
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const topic = document.getElementById('topic').value.trim();

    if (!studentName || !studentId || !date || !time || !topic) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    submitBtn.innerHTML = 'กำลังส่งข้อมูล...';

    const payload = {
      studentName,
      studentId,
      contact: studentId,
      date,
      time,
      topic
    };

    let newApt = null;

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const result = await res.json();
          newApt = result.data;
        }
      } catch (err) {
        console.log('API not reachable, falling back to localStorage');
      }
    }

    // Fallback if offline or file://
    if (!newApt) {
      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSeq = Math.floor(100 + Math.random() * 900);
      newApt = {
        id: `APT-${dateCode}-${randomSeq}`,
        studentName,
        studentId,
        contact: studentId,
        date,
        time,
        topic,
        teacherId: 'T001',
        teacherName: 'MR.Panukorn',
        status: 'PENDING',
        teacherNote: '',
        createdAt: new Date().toISOString()
      };

      const localList = getLocalAppointments();
      localList.unshift(newApt);
      saveLocalAppointments(localList);
    }

    // Show success modal
    ticketCodeEl.textContent = newApt.id;
    slipStudentEl.textContent = `${newApt.studentName} (${newApt.studentId})`;
    slipDateTimeEl.textContent = `${formatThaiDate(newApt.date)} เวลา ${newApt.time} น.`;
    slipTopicEl.textContent = newApt.topic;
    
    successModal.classList.add('active');
    form.reset();
    showToast('ส่งคำขอนัดหมายเรียบร้อยแล้ว!', 'success');

    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.innerHTML = '<i data-lucide="send" style="width: 18px; height: 18px;"></i><span>ส่งคำขอนัดหมาย</span>';
    if (window.lucide) window.lucide.createIcons();
  });

  // Reset form
  resetBtn.addEventListener('click', () => {
    form.reset();
    showToast('ล้างข้อมูลในฟอร์มเรียบร้อย', 'info');
  });

  // Close button
  closeBtn.addEventListener('click', () => {
    if (confirm('ต้องการปิดหน้าต่างแบบฟอร์มหรือไม่?')) {
      window.history.back();
    }
  });

  // Modal handlers
  closeSuccessModalBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
  });

  // Status check modal
  if (openStatusModalBtn) {
    openStatusModalBtn.addEventListener('click', () => {
      statusModal.classList.add('active');
      searchStudentIdInput.focus();
    });
  }

  if (closeStatusModalBtn) {
    closeStatusModalBtn.addEventListener('click', () => {
      statusModal.classList.remove('active');
    });
  }

  // Search appointments
  async function searchAppointments() {
    const query = searchStudentIdInput.value.trim().toLowerCase();
    if (!query) {
      showToast('กรุณากรอกรหัสนักศึกษาหรือรหัสคำขอ', 'error');
      return;
    }

    statusResults.innerHTML = '<div style="text-align:center; padding:15px; color:#64748b;">กำลังค้นหา...</div>';

    let list = [];
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/appointments?studentId=${encodeURIComponent(query)}`);
        if (res.ok) {
          const result = await res.json();
          list = result.data || [];
        }
      } catch (e) {}
    }

    if (list.length === 0) {
      const localList = getLocalAppointments();
      list = localList.filter(a => 
        (a.studentId && a.studentId.toLowerCase().includes(query)) ||
        (a.id && a.id.toLowerCase().includes(query)) ||
        (a.studentName && a.studentName.toLowerCase().includes(query))
      );
    }

    if (list.length > 0) {
      statusResults.innerHTML = list.map(apt => `
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #ffffff;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 6px;">
            <span style="font-weight:700; color:#1e293b; font-size:13px;">${apt.id}</span>
            ${getStatusBadge(apt.status)}
          </div>
          <div style="font-size:12px; color:#475569; margin-bottom: 4px;">
            📅 <strong>วัน-เวลา:</strong> ${formatThaiDate(apt.date)} (${apt.time} น.)
          </div>
          <div style="font-size:12px; color:#475569; margin-bottom: 4px;">
            📝 <strong>เรื่อง:</strong> ${escapeHtml(apt.topic)}
          </div>
          ${apt.teacherNote ? `
            <div style="margin-top:6px; padding:8px; background:#fefce8; border-left:3px solid #eab308; border-radius:4px; font-size:11.5px; color:#854d0e;">
              💬 <strong>หมายเหตุจากอาจารย์:</strong> ${escapeHtml(apt.teacherNote)}
            </div>
          ` : ''}
        </div>
      `).join('');
    } else {
      statusResults.innerHTML = `
        <div style="text-align:center; color:#e11d48; font-size:13px; padding:20px;">
          ไม่พบประวัติคำขอนัดหมายสำหรับ "${escapeHtml(query)}"
        </div>
      `;
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', searchAppointments);
  }
  if (searchStudentIdInput) {
    searchStudentIdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchAppointments();
    });
  }

  // Helpers
  function getStatusBadge(status) {
    switch (status) {
      case 'APPROVED':
        return '<span style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:600;">🟢 ยืนยันนัดหมายแล้ว</span>';
      case 'REJECTED':
        return '<span style="background:#fee2e2; color:#b91c1c; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:600;">🔴 ไม่สะดวก / ปฏิเสธ</span>';
      case 'CANCELLED':
        return '<span style="background:#f1f5f9; color:#64748b; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:600;">⚪ ยกเลิกแล้ว</span>';
      case 'PENDING':
      default:
        return '<span style="background:#fef3c7; color:#b45309; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:600;">🟡 รอดำเนินการ</span>';
    }
  }

  function formatThaiDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const year = parseInt(parts[0], 10) + 543;
        const month = thaiMonths[parseInt(parts[1], 10) - 1];
        const day = parseInt(parts[2], 10);
        return `${day} ${month} ${year}`;
      }
    } catch(e) {}
    return dateStr;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
