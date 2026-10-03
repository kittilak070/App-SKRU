/**
 * SKRU Teacher Appointment System - Admin Logic (Teacher Dashboard)
 * Supports both Live REST API Server and Smart LocalStorage Fallback
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const API_BASE = window.location.protocol === 'file:' ? null : '/api';
  const STORAGE_KEY_APTS = 'skru_appointments_data';
  const STORAGE_KEY_TEACHER = 'skru_teacher_data';

  // State
  let appointments = [];
  let currentFilter = 'ALL';
  let teacherProfile = null;
  let activeActionApt = null;
  let activeActionType = null;

  // DOM Elements
  const tableBody = document.getElementById('appointmentTableBody');
  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statApproved = document.getElementById('statApproved');
  const statRejected = document.getElementById('statRejected');
  const adminTeacherName = document.getElementById('adminTeacherName');
  const currentHoursText = document.getElementById('currentHoursText');
  const toggleStatusBtn = document.getElementById('toggleStatusBtn');
  const toggleStatusLabel = document.getElementById('toggleStatusLabel');
  const editHoursBtn = document.getElementById('editHoursBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const filterTabs = document.querySelectorAll('.filter-tab');

  // Action Modal
  const actionModal = document.getElementById('actionModal');
  const actionModalTitle = document.getElementById('actionModalTitle');
  const actionModalSubtitle = document.getElementById('actionModalSubtitle');
  const teacherNoteInput = document.getElementById('teacherNoteInput');
  const cancelActionBtn = document.getElementById('cancelActionBtn');
  const confirmActionBtn = document.getElementById('confirmActionBtn');

  // LocalStorage Helpers
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

  function saveLocalTeacher(t) {
    localStorage.setItem(STORAGE_KEY_TEACHER, JSON.stringify(t));
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
      },
      {
        id: "APT-20261002-002",
        studentName: "นางสาวกานดา วิชิตสกุล",
        studentId: "6512349999",
        contact: "089-876-5432",
        date: "2026-10-08",
        time: "14:00",
        topic: "ขอปรึกษาการยื่นคำร้องแก้เกรดรายวิชา Web Development",
        teacherName: "MR.Panukorn",
        status: "PENDING",
        teacherNote: "",
        createdAt: new Date().toISOString()
      }
    ];
  }

  function saveLocalAppointments(list) {
    localStorage.setItem(STORAGE_KEY_APTS, JSON.stringify(list));
  }

  // 1. Fetch Teacher Info
  async function fetchTeacher() {
    teacherProfile = getLocalTeacher();
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/teacher`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) teacherProfile = json.data;
        }
      } catch (e) {}
    }
    renderTeacherInfo();
  }

  function renderTeacherInfo() {
    if (!teacherProfile) return;
    adminTeacherName.textContent = teacherProfile.name;
    currentHoursText.textContent = teacherProfile.consultationHours || 'จันทร์, พุธ 13:00 - 16:00 น.';
    
    if (teacherProfile.isAvailable) {
      toggleStatusLabel.textContent = 'เปลี่ยนเป็น: ติดภารกิจ';
      toggleStatusBtn.style.background = 'linear-gradient(180deg, #f5b945 0%, #eb9f27 100%)';
    } else {
      toggleStatusLabel.textContent = 'เปลี่ยนเป็น: พร้อมรับนัด';
      toggleStatusBtn.style.background = 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)';
      toggleStatusBtn.style.color = '#ffffff';
    }
  }

  // 2. Toggle Teacher Status
  toggleStatusBtn.addEventListener('click', async () => {
    if (!teacherProfile) return;
    const newAvailable = !teacherProfile.isAvailable;
    const newStatusText = newAvailable ? 'พร้อมให้เข้าพบ' : 'ติดภารกิจ/งดรับนัด';

    teacherProfile.isAvailable = newAvailable;
    teacherProfile.status = newStatusText;
    saveLocalTeacher(teacherProfile);

    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/teacher`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isAvailable: newAvailable,
            status: newStatusText
          })
        });
      } catch (e) {}
    }

    renderTeacherInfo();
    showToast(`อัปเดตสถานะเป็น "${newStatusText}" เรียบร้อย`, 'success');
  });

  // 3. Edit Office Hours
  editHoursBtn.addEventListener('click', async () => {
    const current = teacherProfile ? teacherProfile.consultationHours : 'จันทร์, พุธ 13:00 - 16:00 น.';
    const newHours = prompt('กรุณาระบุช่วงเวลาให้คำปรึกษาใหม่:', current);
    if (newHours && newHours.trim() !== '') {
      teacherProfile.consultationHours = newHours.trim();
      saveLocalTeacher(teacherProfile);

      if (API_BASE) {
        try {
          await fetch(`${API_BASE}/teacher`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consultationHours: newHours.trim() })
          });
        } catch (e) {}
      }

      renderTeacherInfo();
      showToast('บันทึกช่วงเวลาให้คำปรึกษาเรียบร้อย', 'success');
    }
  });

  // 4. Fetch Appointments List
  async function fetchAppointments() {
    appointments = getLocalAppointments();
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/appointments`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) appointments = json.data;
        }
      } catch (e) {}
    }
    updateStats();
    renderTable();
  }

  // 5. Update Stats
  function updateStats() {
    statTotal.textContent = appointments.length;
    statPending.textContent = appointments.filter(a => a.status === 'PENDING').length;
    statApproved.textContent = appointments.filter(a => a.status === 'APPROVED').length;
    statRejected.textContent = appointments.filter(a => a.status === 'REJECTED' || a.status === 'CANCELLED').length;
  }

  // 6. Render Table
  function renderTable() {
    let filtered = [...appointments];

    if (currentFilter !== 'ALL') {
      filtered = filtered.filter(a => a.status === currentFilter);
    }

    const query = adminSearchInput.value.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(a => 
        (a.studentName && a.studentName.toLowerCase().includes(query)) ||
        (a.studentId && a.studentId.includes(query)) ||
        (a.id && a.id.toLowerCase().includes(query)) ||
        (a.topic && a.topic.toLowerCase().includes(query))
      );
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:40px; color:#94a3b8;">
            <i data-lucide="inbox" style="width: 32px; height: 32px; margin-bottom: 8px; opacity:0.5;"></i>
            <div>ไม่พบรายการคำขอนัดหมาย</div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tableBody.innerHTML = filtered.map(apt => `
      <tr>
        <td>
          <div style="font-weight:700; color:#1e293b;">${apt.id}</div>
          <div style="font-size:11px; color:#94a3b8;">${new Date(apt.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</div>
        </td>
        <td>
          <div style="font-weight:600; color:#0f172a;">${escapeHtml(apt.studentName)}</div>
          <div style="font-size:11.5px; color:#64748b;">รหัส: ${escapeHtml(apt.studentId)}</div>
        </td>
        <td>
          <div style="font-weight:600; color:#0284c7;">${formatThaiDate(apt.date)}</div>
          <div style="font-size:12px; color:#64748b;">เวลา ${apt.time} น.</div>
        </td>
        <td style="max-width: 250px;">
          <div style="font-weight:500; color:#334155; line-height: 1.4;">${escapeHtml(apt.topic)}</div>
          ${apt.teacherNote ? `
            <div style="font-size:11px; color:#b45309; background:#fef3c7; padding:2px 6px; border-radius:4px; display:inline-block; margin-top:4px;">
              💬 โน้ต: ${escapeHtml(apt.teacherNote)}
            </div>
          ` : ''}
        </td>
        <td>
          ${getStatusBadge(apt.status)}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          ${apt.status === 'PENDING' ? `
            <button class="action-btn-sm btn-approve" onclick="window.openActionModal('${apt.id}', 'APPROVED')">
              <i data-lucide="check" style="width:14px; height:14px;"></i> อนุมัติ
            </button>
            <button class="action-btn-sm btn-reject" onclick="window.openActionModal('${apt.id}', 'REJECTED')">
              <i data-lucide="x" style="width:14px; height:14px;"></i> ปฏิเสธ
            </button>
          ` : `
            <button class="action-btn-sm btn-secondary" onclick="window.openActionModal('${apt.id}', '${apt.status}')" style="background:#f1f5f9; color:#475569;">
              <i data-lucide="edit-3" style="width:13px; height:13px;"></i> แก้ไขสถานะ
            </button>
          `}
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // 7. Modal Open & Submit logic
  window.openActionModal = function(id, targetStatus) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;

    activeActionApt = apt;
    activeActionType = targetStatus;

    actionModalTitle.textContent = targetStatus === 'APPROVED' ? '✅ ยืนยัน / อนุมัติคำขอนัดหมาย' : (targetStatus === 'REJECTED' ? '❌ ปฏิเสธคำขอนัดหมาย' : '✏️ ปรับปรุงคำขอนัดหมาย');
    actionModalSubtitle.textContent = `คำขอของ ${apt.studentName} (${apt.id}) วันที่ ${apt.date} เวลา ${apt.time} น.`;
    teacherNoteInput.value = apt.teacherNote || (targetStatus === 'APPROVED' ? 'ยืนยันนัดหมายเรียบร้อยครับ กรุณามาตรงเวลา' : (targetStatus === 'REJECTED' ? 'ขออภัยครับ ติดภารกิจด่วน กรุณานัดหมายใหม่อีกครั้ง' : ''));

    actionModal.classList.add('active');
  };

  cancelActionBtn.addEventListener('click', () => {
    actionModal.classList.remove('active');
  });

  confirmActionBtn.addEventListener('click', async () => {
    if (!activeActionApt) return;

    const note = teacherNoteInput.value.trim();
    
    // Update locally
    const idx = appointments.findIndex(a => a.id === activeActionApt.id);
    if (idx !== -1) {
      appointments[idx].status = activeActionType;
      appointments[idx].teacherNote = note;
      saveLocalAppointments(appointments);
    }

    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/appointments/${activeActionApt.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: activeActionType,
            teacherNote: note
          })
        });
      } catch (e) {}
    }

    showToast('อัปเดตสถานะสำเร็จ', 'success');
    actionModal.classList.remove('active');
    updateStats();
    renderTable();
  });

  // Filter tabs click
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderTable();
    });
  });

  // Search input
  adminSearchInput.addEventListener('input', renderTable);
  refreshBtn.addEventListener('click', () => {
    fetchAppointments();
    fetchTeacher();
    showToast('รีเฟรชข้อมูลแล้ว', 'info');
  });

  // Helpers
  function getStatusBadge(status) {
    switch (status) {
      case 'APPROVED':
        return '<span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:12px; font-size:11.5px; font-weight:700;">🟢 อนุมัติแล้ว</span>';
      case 'REJECTED':
        return '<span style="background:#fee2e2; color:#b91c1c; padding:4px 10px; border-radius:12px; font-size:11.5px; font-weight:700;">🔴 ปฏิเสธ</span>';
      case 'CANCELLED':
        return '<span style="background:#f1f5f9; color:#64748b; padding:4px 10px; border-radius:12px; font-size:11.5px; font-weight:700;">⚪ ยกเลิกแล้ว</span>';
      case 'PENDING':
      default:
        return '<span style="background:#fef3c7; color:#b45309; padding:4px 10px; border-radius:12px; font-size:11.5px; font-weight:700;">🟡 รอดำเนินการ</span>';
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
    }, 3000);
  }

  // Initial load
  fetchTeacher();
  fetchAppointments();
});
