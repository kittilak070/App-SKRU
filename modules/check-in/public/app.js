// State
let appState = {
  course: null,
  students: [],
  currentStudentId: "6401001",
  stats: null,
  isTeacherMode: false,
  activeChatStudentId: null
};

// DOM Elements
const elements = {
  // Navigation & Headers
  courseCodeHeader: document.getElementById('courseCodeHeader'),
  btnBack: document.getElementById('btnBack'),
  btnHistory: document.getElementById('btnHistory'),
  
  // Class Details
  courseName: document.getElementById('courseName'),
  courseCode: document.getElementById('courseCode'),
  courseCredit: document.getElementById('courseCredit'),
  courseSection: document.getElementById('courseSection'),
  teacherName: document.getElementById('teacherName'),
  myCheckInStatus: document.getElementById('myCheckInStatus'),
  courseDateTime: document.getElementById('courseDateTime'),
  courseRoom: document.getElementById('courseRoom'),
  sessionPill: document.getElementById('sessionPill'),
  sessionStatusText: document.getElementById('sessionStatusText'),
  
  // Check-in Button & Progress
  btnCheckIn: document.getElementById('btnCheckIn'),
  btnCheckInText: document.getElementById('btnCheckInText'),
  checkInSpinner: document.getElementById('checkInSpinner'),
  checkInCheckmark: document.getElementById('checkInCheckmark'),
  checkedCountText: document.getElementById('checkedCountText'),
  totalCountText: document.getElementById('totalCountText'),
  attendancePercent: document.getElementById('attendancePercent'),
  attendanceProgressBar: document.getElementById('attendanceProgressBar'),
  
  // Classmate List
  btnSeeAll: document.getElementById('btnSeeAll'),
  classmateListContainer: document.getElementById('classmateListContainer'),
  
  // Bottom Bar Profile
  currentUserAvatar: document.getElementById('currentUserAvatar'),
  currentUserName: document.getElementById('currentUserName'),
  currentUserRoleDesc: document.getElementById('currentUserRoleDesc'),
  btnQrCode: document.getElementById('btnQrCode'),
  
  // Controls Bar
  userSelect: document.getElementById('userSelect'),
  toggleTeacherModeBtn: document.getElementById('toggleTeacherModeBtn'),
  roleBtnText: document.getElementById('roleBtnText'),
  currentRoleBadge: document.getElementById('currentRoleBadge'),
  
  // Teacher Drawer
  teacherDrawer: document.getElementById('teacherDrawer'),
  btnCloseTeacherDrawer: document.getElementById('btnCloseTeacherDrawer'),
  teacherSessionStatus: document.getElementById('teacherSessionStatus'),
  btnToggleSession: document.getElementById('btnToggleSession'),
  pinInput: document.getElementById('pinInput'),
  requirePinCheck: document.getElementById('requirePinCheck'),
  btnSavePin: document.getElementById('btnSavePin'),
  btnResetSession: document.getElementById('btnResetSession'),
  addStudentForm: document.getElementById('addStudentForm'),
  
  // Modals
  chatModal: document.getElementById('chatModal'),
  btnCloseChat: document.getElementById('btnCloseChat'),
  chatPeerAvatar: document.getElementById('chatPeerAvatar'),
  chatPeerName: document.getElementById('chatPeerName'),
  chatMessagesList: document.getElementById('chatMessagesList'),
  chatForm: document.getElementById('chatForm'),
  chatInputText: document.getElementById('chatInputText'),
  
  seeAllModal: document.getElementById('seeAllModal'),
  btnCloseSeeAll: document.getElementById('btnCloseSeeAll'),
  searchStudentInput: document.getElementById('searchStudentInput'),
  allStudentsContainer: document.getElementById('allStudentsContainer'),
  countAll: document.getElementById('countAll'),
  countChecked: document.getElementById('countChecked'),
  countAbsent: document.getElementById('countAbsent'),
  
  historyModal: document.getElementById('historyModal'),
  btnCloseHistory: document.getElementById('btnCloseHistory'),
  historyListContainer: document.getElementById('historyListContainer'),
  
  qrModal: document.getElementById('qrModal'),
  btnCloseQr: document.getElementById('btnCloseQr'),
  qrPinText: document.getElementById('qrPinText'),
  
  pinPromptModal: document.getElementById('pinPromptModal'),
  btnClosePinPrompt: document.getElementById('btnClosePinPrompt'),
  studentCheckInPin: document.getElementById('studentCheckInPin'),
  btnCancelPin: document.getElementById('btnCancelPin'),
  btnSubmitPinCheckIn: document.getElementById('btnSubmitPinCheckIn'),
  
  toastContainer: document.getElementById('toastContainer')
};

// Subtle Web Audio Chime synthesizer for high tactile feedback
function playChime(isSuccess = true) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (isSuccess) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    }
  } catch (e) {
    // AudioContext blocked or not supported, ignore silently
  }
}

// Toast Helper
function showToast(message, type = 'normal') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// -------------------------------------------------------------
// Data Fetching & Sync
// -------------------------------------------------------------
async function fetchAllData() {
  try {
    const [courseRes, studentsRes] = await Promise.all([
      fetch('/api/course').then(r => r.json()),
      fetch('/api/students').then(r => r.json())
    ]);

    if (courseRes.success && studentsRes.success) {
      appState.course = courseRes.course;
      appState.stats = courseRes.stats;
      appState.students = studentsRes.students;
      appState.currentStudentId = courseRes.currentStudentId;
      
      renderApp();
    }
  } catch (err) {
    console.error("Failed to load data:", err);
  }
}

// -------------------------------------------------------------
// UI Rendering
// -------------------------------------------------------------
function renderApp() {
  const { course, students, currentStudentId, stats } = appState;
  if (!course || !students) return;

  const currentStudent = students.find(s => s.id === currentStudentId) || students[0];
  const isMeCheckedIn = currentStudent ? currentStudent.isCheckedIn : false;

  // 1. Navigation & Header
  elements.courseCodeHeader.textContent = `${course.code}- sec ${course.section}`;
  
  // 2. Class Detail Section
  elements.courseName.textContent = course.name;
  elements.courseCode.textContent = course.code;
  elements.courseCredit.textContent = course.credit;
  elements.courseSection.textContent = course.section;
  elements.teacherName.textContent = course.teacher;
  elements.courseDateTime.textContent = course.dateTime;
  elements.courseRoom.textContent = course.room;
  
  // Session Open/Closed Badge
  if (course.isCheckInOpen) {
    elements.sessionPill.className = "live-status-pill";
    elements.sessionStatusText.textContent = "เปิดเช็คชื่อ";
  } else {
    elements.sessionPill.className = "live-status-pill closed";
    elements.sessionStatusText.textContent = "ปิดเช็คชื่อแล้ว";
  }

  // Check-in status display for current student (Orange 'No' or Green 'Yes')
  if (isMeCheckedIn) {
    elements.myCheckInStatus.textContent = `Yes (${currentStudent.checkInTime})`;
    elements.myCheckInStatus.className = "checkin-status-indicator checked";
  } else {
    elements.myCheckInStatus.textContent = "No";
    elements.myCheckInStatus.className = "checkin-status-indicator";
  }

  // 3. CHECK-IN CLASS Action Button State
  if (isMeCheckedIn) {
    elements.btnCheckIn.className = "btn-checkin checked-done";
    elements.btnCheckInText.innerHTML = `✓ CHECKED IN ✓ <span class="btn-subtext">(กดเพื่อยกเลิก / ทดสอบไม่เช็ค)</span>`;
    elements.btnCheckIn.disabled = false;
    elements.btnCheckIn.title = "กดเพื่อยกเลิกเช็คชื่อ (สลับสถานะเป็นไม่เช็ค)";
    elements.checkInSpinner.classList.add('hidden');
    elements.checkInCheckmark.classList.remove('hidden');
  } else if (course.isCheckInOpen) {
    elements.btnCheckIn.className = "btn-checkin active-ready";
    elements.btnCheckInText.innerHTML = `CHECK-IN CLASS <span class="btn-subtext">(กดเพื่อเช็คชื่อเข้าเรียน)</span>`;
    elements.btnCheckIn.disabled = false;
    elements.btnCheckIn.title = "กดเพื่อเช็คชื่อเข้าเรียน";
    elements.checkInSpinner.classList.add('hidden');
    elements.checkInCheckmark.classList.add('hidden');
  } else {
    elements.btnCheckIn.className = "btn-checkin";
    elements.btnCheckInText.textContent = "CHECK-IN CLOSED";
    elements.btnCheckIn.disabled = true;
    elements.checkInSpinner.classList.add('hidden');
    elements.checkInCheckmark.classList.add('hidden');
  }

  // Attendance Progress
  const checkedCount = students.filter(s => s.isCheckedIn).length;
  const totalCount = students.length;
  const percent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  
  elements.checkedCountText.textContent = checkedCount;
  elements.totalCountText.textContent = totalCount;
  elements.attendancePercent.textContent = `${percent}%`;
  elements.attendanceProgressBar.style.width = `${percent}%`;

  // 4. Classmate List (First 6 students matching screenshot)
  renderClassmateList(students.slice(0, 6), currentStudentId);

  // 5. Bottom profile indicator
  if (currentStudent) {
    elements.currentUserAvatar.textContent = currentStudent.avatar || "👩‍🎓";
    elements.currentUserName.textContent = currentStudent.name;
  }

  // 6. Populate Switcher dropdown
  renderUserSelector(students, currentStudentId);

  // 7. Sync Teacher Panel
  elements.teacherSessionStatus.textContent = course.isCheckInOpen ? "เปิดรับเช็คชื่อ (Open)" : "ปิดระบบ (Closed)";
  elements.pinInput.value = course.pinCode || "";
  elements.requirePinCheck.checked = !!course.requirePin;
  elements.qrPinText.textContent = course.pinCode || "1234";
}

// Render the classmate rows
function renderClassmateList(list, currentStudentId) {
  elements.classmateListContainer.innerHTML = '';

  list.forEach(student => {
    const isCurrent = student.id === currentStudentId;
    const row = document.createElement('div');
    row.className = 'classmate-row';
    
    row.innerHTML = `
      <div class="classmate-info">
        <div class="classmate-name-group">
          <span class="classmate-name">${student.name}</span>
          ${isCurrent ? '<span class="current-user-tag">ฉัน (You)</span>' : ''}
        </div>
        <span class="classmate-faculty">${student.faculty}</span>
      </div>

      <div class="classmate-actions">
        ${student.isCheckedIn 
          ? `<button type="button" class="status-badge-mini checked btn-toggle-badge" data-id="${student.id}" title="คลิกเพื่อสลับเป็นไม่เช็คชื่อ">✓ เช็คแล้ว</button>`
          : `<button type="button" class="status-badge-mini absent btn-toggle-badge" data-id="${student.id}" title="คลิกเพื่อสลับเป็นเช็คชื่อ">ขาดเรียน</button>`
        }
        
        <button class="btn-chat-bubble" data-id="${student.id}" title="คุยกับ ${student.name}" aria-label="Chat with classmate">
          <!-- Speech Bubble SVG matching screenshot -->
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </button>
      </div>
    `;

    // Add badge click to toggle student check-in
    const badgeBtn = row.querySelector('.btn-toggle-badge');
    if (badgeBtn) {
      badgeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleStudentCheck(student.id);
      });
    }

    // Add chat trigger
    const chatBtn = row.querySelector('.btn-chat-bubble');
    chatBtn.addEventListener('click', () => openChatModal(student));

    elements.classmateListContainer.appendChild(row);
  });
}

// User switch selector
function renderUserSelector(students, currentStudentId) {
  elements.userSelect.innerHTML = '';
  students.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.isCheckedIn ? 'เช็คชื่อแล้ว' : 'ยังไม่เช็ค'})`;
    if (s.id === currentStudentId) opt.selected = true;
    elements.userSelect.appendChild(opt);
  });
}

// -------------------------------------------------------------
// Actions & Events
// -------------------------------------------------------------

// Student Check-In Handler
async function performCheckIn(pin = null) {
  const { course, currentStudentId } = appState;
  
  if (course.requirePin && !pin) {
    elements.pinPromptModal.classList.remove('hidden');
    elements.studentCheckInPin.value = '';
    elements.studentCheckInPin.focus();
    return;
  }

  // Show loading
  elements.btnCheckIn.disabled = true;
  elements.btnCheckInText.textContent = "กำลังบันทึก...";
  elements.checkInSpinner.classList.remove('hidden');

  try {
    const res = await fetch('/api/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: currentStudentId,
        pin: pin,
        action: 'checkin',
        status: true
      })
    });

    const data = await res.json();

    if (data.success) {
      playChime(true);
      showToast(data.message, 'success');
      elements.pinPromptModal.classList.add('hidden');
      await fetchAllData();
    } else {
      playChime(false);
      showToast(data.message, 'error');
      renderApp();
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 'error');
    renderApp();
  }
}

// Student Uncheck Handler
async function performUncheck(studentId = null) {
  const targetId = studentId || appState.currentStudentId;
  
  elements.btnCheckIn.disabled = true;
  elements.btnCheckInText.textContent = "กำลังยกเลิก...";
  elements.checkInSpinner.classList.remove('hidden');

  try {
    const res = await fetch('/api/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: targetId,
        action: 'uncheck',
        status: false
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message || "ยกเลิกการเช็คชื่อแล้ว (สถานะ: ไม่เช็ค)", 'info');
      await fetchAllData();
    } else {
      showToast(data.message || "เกิดข้อผิดพลาด", 'error');
      renderApp();
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 'error');
    renderApp();
  }
}

// Student Force Check-in / Uncheck Handler for Test Buttons
async function performCheckInForce(studentId, shouldCheck) {
  try {
    const res = await fetch('/api/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: studentId,
        action: shouldCheck ? 'checkin' : 'uncheck',
        status: shouldCheck
      })
    });
    const data = await res.json();
    if (data.success) {
      if (shouldCheck) playChime(true);
      showToast(data.message || (shouldCheck ? "เช็คชื่อสำเร็จ!" : "ยกเลิกการเช็คชื่อแล้ว (ไม่เช็ค)"), shouldCheck ? 'success' : 'info');
      await fetchAllData();
    } else {
      showToast(data.message || "เกิดข้อผิดพลาด", 'error');
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 'error');
  }
}

// Toggle single student checkin status
async function toggleStudentCheck(studentId) {
  try {
    const res = await fetch(`/api/students/${studentId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      if (data.isCheckedIn) playChime(true);
      showToast(data.message || "อัปเดตสถานะสำเร็จ", data.isCheckedIn ? 'success' : 'info');
      await fetchAllData();
    } else {
      showToast(data.message || "เกิดข้อผิดพลาด", 'error');
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", 'error');
  }
}

// Reset all attendance
async function resetAllAttendance() {
  try {
    const res = await fetch('/api/course/reset-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showToast("รีเซ็ตทุกคนเป็น 'ไม่เช็ค / ขาดเรียน' สำเร็จ", 'info');
      await fetchAllData();
    } else {
      showToast(data.message || "เกิดข้อผิดพลาด", 'error');
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", 'error');
  }
}

elements.btnCheckIn.addEventListener('click', async () => {
  const { currentStudentId, students } = appState;
  const currentStudent = students.find(s => s.id === currentStudentId);
  const isMeCheckedIn = currentStudent ? currentStudent.isCheckedIn : false;

  if (isMeCheckedIn) {
    await performUncheck(currentStudentId);
  } else {
    await performCheckIn();
  }
});

// PIN Form Submit in Modal
elements.btnSubmitPinCheckIn.addEventListener('click', () => {
  const pin = elements.studentCheckInPin.value.trim();
  if (!pin) {
    showToast("กรุณากรอกรหัส PIN", 'error');
    return;
  }
  performCheckIn(pin);
});

elements.studentCheckInPin.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    elements.btnSubmitPinCheckIn.click();
  }
});

elements.btnCancelPin.addEventListener('click', () => {
  elements.pinPromptModal.classList.add('hidden');
});
elements.btnClosePinPrompt.addEventListener('click', () => {
  elements.pinPromptModal.classList.add('hidden');
});

// Switch Student User
elements.userSelect.addEventListener('change', async (e) => {
  const newStudentId = e.target.value;
  try {
    const res = await fetch('/api/user/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: newStudentId })
    });
    const data = await res.json();
    if (data.success) {
      appState.currentStudentId = newStudentId;
      showToast("สลับผู้ใช้งานเรียบร้อยแล้ว", 'normal');
      await fetchAllData();
    }
  } catch (err) {
    console.error(err);
  }
});

// Toggle Teacher Mode Drawer
elements.toggleTeacherModeBtn.addEventListener('click', () => {
  elements.teacherDrawer.classList.toggle('hidden');
  const isHidden = elements.teacherDrawer.classList.contains('hidden');
  elements.roleBtnText.textContent = isHidden ? "โหมดอาจารย์ (Teacher)" : "ปิดแผงอาจารย์";
});
elements.btnCloseTeacherDrawer.addEventListener('click', () => {
  elements.teacherDrawer.classList.add('hidden');
  elements.roleBtnText.textContent = "โหมดอาจารย์ (Teacher)";
});

// Teacher: Toggle Session Status (Open / Close)
elements.btnToggleSession.addEventListener('click', async () => {
  const newStatus = !appState.course.isCheckInOpen;
  try {
    const res = await fetch('/api/course/toggle-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCheckInOpen: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      await fetchAllData();
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการปรับสถานะ", 'error');
  }
});

// Teacher: Save PIN & Require PIN
elements.btnSavePin.addEventListener('click', async () => {
  const pin = elements.pinInput.value.trim();
  const requirePin = elements.requirePinCheck.checked;

  try {
    const res = await fetch('/api/course/toggle-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinCode: pin, requirePin: requirePin })
    });
    const data = await res.json();
    if (data.success) {
      showToast("บันทึกการตั้งค่า PIN สำเร็จ", 'success');
      await fetchAllData();
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาด", 'error');
  }
});

// Teacher: Reset Session for new week
elements.btnResetSession.addEventListener('click', async () => {
  if (!confirm("คุณต้องการเริ่มรอบเช็คชื่อใหม่ และบันทึกรอบก่อนหน้าลงประวัติใช่หรือไม่?")) return;
  
  try {
    const res = await fetch('/api/course/reset-session', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      await fetchAllData();
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาด", 'error');
  }
});

// Teacher: Add new student
elements.addStudentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('newStudentId').value.trim();
  const name = document.getElementById('newStudentName').value.trim();
  const faculty = document.getElementById('newStudentFaculty').value.trim();

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, faculty })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`เพิ่มนักศึกษา ${data.student.name} เรียบร้อยแล้ว`, 'success');
      elements.addStudentForm.reset();
      await fetchAllData();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาด", 'error');
  }
});

// -------------------------------------------------------------
// Chat Modal Functionality
// -------------------------------------------------------------
async function openChatModal(peerStudent) {
  appState.activeChatStudentId = peerStudent.id;
  elements.chatPeerName.textContent = peerStudent.name;
  elements.chatPeerAvatar.textContent = peerStudent.avatar || "👩‍🎓";
  elements.chatModal.classList.remove('hidden');
  elements.chatInputText.focus();

  await loadChatMessages(peerStudent.id);
}

async function loadChatMessages(studentId) {
  try {
    const res = await fetch(`/api/chat/${studentId}`);
    const data = await res.json();
    if (data.success) {
      elements.chatMessagesList.innerHTML = '';
      if (data.messages.length === 0) {
        elements.chatMessagesList.innerHTML = `
          <div style="text-align:center; color:#94a3b8; padding-top: 40px; font-size: 0.85rem;">
            เริ่มบทสนทนากับเพื่อนร่วมชั้นได้ที่นี่ 👋
          </div>
        `;
      } else {
        data.messages.forEach(msg => {
          const isMe = msg.sender === 'me';
          const bubble = document.createElement('div');
          bubble.className = `chat-bubble ${isMe ? 'me' : 'peer'}`;
          bubble.innerHTML = `
            <div>${escapeHtml(msg.text)}</div>
            <span class="chat-time">${msg.time}</span>
          `;
          elements.chatMessagesList.appendChild(bubble);
        });
        elements.chatMessagesList.scrollTop = elements.chatMessagesList.scrollHeight;
      }
    }
  } catch (err) {
    console.error("Chat load error", err);
  }
}

elements.chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = elements.chatInputText.value.trim();
  const targetId = appState.activeChatStudentId;
  if (!text || !targetId) return;

  try {
    elements.chatInputText.value = '';
    const res = await fetch(`/api/chat/${targetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.success) {
      await loadChatMessages(targetId);
    }
  } catch (err) {
    showToast("ส่งข้อความไม่สำเร็จ", 'error');
  }
});

elements.btnCloseChat.addEventListener('click', () => {
  elements.chatModal.classList.add('hidden');
});

// -------------------------------------------------------------
// See All Classmates Modal
// -------------------------------------------------------------
elements.btnSeeAll.addEventListener('click', () => {
  elements.seeAllModal.classList.remove('hidden');
  renderSeeAllList('all', elements.searchStudentInput.value);
});

elements.btnCloseSeeAll.addEventListener('click', () => {
  elements.seeAllModal.classList.add('hidden');
});

let currentSeeAllFilter = 'all';

function renderSeeAllList(filter = 'all', searchQuery = '') {
  currentSeeAllFilter = filter;
  const q = searchQuery.toLowerCase().trim();
  
  const checked = appState.students.filter(s => s.isCheckedIn);
  const absent = appState.students.filter(s => !s.isCheckedIn);

  elements.countAll.textContent = appState.students.length;
  elements.countChecked.textContent = checked.length;
  elements.countAbsent.textContent = absent.length;

  let filtered = appState.students;
  if (filter === 'checked') filtered = checked;
  if (filter === 'absent') filtered = absent;

  if (q) {
    filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.id.includes(q) || s.faculty.toLowerCase().includes(q));
  }

  elements.allStudentsContainer.innerHTML = '';

  if (filtered.length === 0) {
    elements.allStudentsContainer.innerHTML = `
      <div style="text-align:center; padding: 30px; color:#94a3b8; font-size:0.9rem;">
        ไม่พบรายชื่อที่ค้นหา
      </div>
    `;
    return;
  }

  filtered.forEach(student => {
    const isCurrent = student.id === appState.currentStudentId;
    const row = document.createElement('div');
    row.className = 'classmate-row';
    row.innerHTML = `
      <div class="classmate-info">
        <div class="classmate-name-group">
          <span class="classmate-name">${student.name}</span>
          ${isCurrent ? '<span class="current-user-tag">คุณ</span>' : ''}
        </div>
        <span class="classmate-faculty">${student.faculty} • รหัส: ${student.id}</span>
      </div>

      <div class="classmate-actions">
        ${student.isCheckedIn 
          ? `<button type="button" class="status-badge-mini checked btn-toggle-badge" data-id="${student.id}" title="คลิกเพื่อสลับเป็นไม่เช็คชื่อ">${student.checkInTime || '✓ เช็คแล้ว'}</button>`
          : `<button type="button" class="status-badge-mini absent btn-toggle-badge" data-id="${student.id}" title="คลิกเพื่อสลับเป็นเช็คชื่อ">ยังไม่เช็ค</button>`
        }
        <button class="btn-chat-bubble" data-id="${student.id}" title="เปิดแชท">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </button>
      </div>
    `;

    // Add badge click to toggle student check-in
    const badgeBtn = row.querySelector('.btn-toggle-badge');
    if (badgeBtn) {
      badgeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleStudentCheck(student.id);
      });
    }

    row.querySelector('.btn-chat-bubble').addEventListener('click', () => {
      elements.seeAllModal.classList.add('hidden');
      openChatModal(student);
    });

    elements.allStudentsContainer.appendChild(row);
  });
}

// Filter pills in See All Modal
document.querySelectorAll('.filter-pills .pill-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-pills .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSeeAllList(btn.dataset.filter, elements.searchStudentInput.value);
  });
});

elements.searchStudentInput.addEventListener('input', (e) => {
  renderSeeAllList(currentSeeAllFilter, e.target.value);
});

// -------------------------------------------------------------
// History Modal
// -------------------------------------------------------------
elements.btnHistory.addEventListener('click', async () => {
  elements.historyModal.classList.remove('hidden');
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    if (data.success) {
      elements.historyListContainer.innerHTML = '';
      if (data.history.length === 0) {
        elements.historyListContainer.innerHTML = '<p style="padding:20px;text-align:center;color:#94a3b8">ยังไม่มีประวัติการเช็คชื่อ</p>';
      } else {
        data.history.forEach(item => {
          const div = document.createElement('div');
          div.className = 'history-item';
          div.innerHTML = `
            <div class="history-item-left">
              <span class="history-week">สัปดาห์ที่ ${item.week} - ${item.topic}</span>
              <span class="history-date">📅 วันที่ ${item.date}</span>
            </div>
            <div class="history-stats-pill">
              <div class="history-rate">${item.rate}</div>
              <div class="history-count">${item.checkedInCount}/${item.totalCount} คน</div>
            </div>
          `;
          elements.historyListContainer.appendChild(div);
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
});

elements.btnCloseHistory.addEventListener('click', () => {
  elements.historyModal.classList.add('hidden');
});

// QR Code Modal
elements.btnQrCode.addEventListener('click', () => {
  elements.qrModal.classList.remove('hidden');
});
elements.btnCloseQr.addEventListener('click', () => {
  elements.qrModal.classList.add('hidden');
});

// Back Button action
elements.btnBack.addEventListener('click', () => {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'closeApp' }, '*');
  } else if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '/index.html';
  }
});

// Utility
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Background auto-refresh every 5 seconds for smooth synchronization
setInterval(() => {
  if (!elements.chatModal.classList.contains('hidden') && appState.activeChatStudentId) {
    loadChatMessages(appState.activeChatStudentId);
  }
  fetchAllData();
}, 5000);

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  fetchAllData();

  // Test Check-in / Uncheck Quick Buttons
  document.getElementById('btnTestCheckIn')?.addEventListener('click', async () => {
    await performCheckInForce(appState.currentStudentId, true);
  });

  document.getElementById('btnTestUncheck')?.addEventListener('click', async () => {
    await performCheckInForce(appState.currentStudentId, false);
  });

  document.getElementById('btnTestReset')?.addEventListener('click', async () => {
    await resetAllAttendance();
  });
});
