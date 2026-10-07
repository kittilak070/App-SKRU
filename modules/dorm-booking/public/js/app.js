// App State
let state = {
  dorms: [],
  selectedDorm: null,
  selectedDormDetails: null,
  selectedFloor: 1,
  selectedRoom: null,
  selectedBed: null,
  paymentSlipData: null, // Base64 data URL of uploaded slip
  currentStep: 1,
  currentView: 'home', // 'home', 'search', 'info', 'admin'
  isAdminLoggedIn: false,
  bookings: []
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  bindEvents();
  loadDorms();
  prefillStudentInfo();
}

function bindEvents() {
  // Drawer menu
  const menuBtn = document.getElementById('menuBtn');
  const drawer = document.getElementById('navDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');

  function openDrawer() {
    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
  }

  if (menuBtn) menuBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  // Tab switching
  const tabHome = document.getElementById('tabHome');
  const tabSearch = document.getElementById('tabSearch');
  const tabInfo = document.getElementById('tabInfo');
  const tabAdmin = document.getElementById('tabAdmin');

  if (tabHome) tabHome.addEventListener('click', () => switchView('home'));
  if (tabSearch) tabSearch.addEventListener('click', () => switchView('search'));
  if (tabInfo) tabInfo.addEventListener('click', () => switchView('info'));
  if (tabAdmin) tabAdmin.addEventListener('click', () => switchView('admin'));

  // Modal actions
  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  // Payment slip file input change handler
  const slipInput = document.getElementById('paymentSlipFile');
  if (slipInput) {
    slipInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert('ขนาดไฟล์ใหญ่เกินไป กรุณาใช้ไฟล์ภาพขนาดไม่เกิน 10MB');
          slipInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          state.paymentSlipData = evt.target.result;
          const previewImg = document.getElementById('slipPreviewImage');
          const previewContainer = document.getElementById('slipPreviewContainer');
          if (previewImg && previewContainer) {
            previewImg.src = evt.target.result;
            previewContainer.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Wizard Navigation
  const btnNextToStep2 = document.getElementById('btnNextToStep2');
  const btnBackToStep1 = document.getElementById('btnBackToStep1');
  const btnNextToStep3 = document.getElementById('btnNextToStep3');
  const btnBackToStep2 = document.getElementById('btnBackToStep2');
  const bookingForm = document.getElementById('bookingForm');

  if (btnNextToStep2) {
    btnNextToStep2.addEventListener('click', () => {
      if (!state.selectedBed) {
        alert('กรุณาเลือกเตียงที่ต้องการจองก่อนดำเนินการต่อ');
        return;
      }
      setStep(2);
    });
  }

  if (btnBackToStep1) {
    btnBackToStep1.addEventListener('click', () => setStep(1));
  }

  if (btnNextToStep3) {
    btnNextToStep3.addEventListener('click', () => {
      const studentId = document.getElementById('studentId').value.trim();
      const fullName = document.getElementById('fullName').value.trim();
      const phone = document.getElementById('phone').value.trim();

      const sLen = studentId.length;
      if (!studentId || (sLen !== 9 && sLen !== 13) || !/^\d+$/.test(studentId)) {
        alert('กรุณากรอกรหัสนักศึกษาให้ถูกต้อง (ต้องเป็นตัวเลข 9 หลัก หรือ 13 หลัก)');
        return;
      }
      if (!fullName) {
        alert('กรุณากรอกชื่อ-นามสกุล');
        return;
      }
      if (!phone || phone.length < 9) {
        alert('กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อได้');
        return;
      }

      updateSummaryStep3();
      setStep(3);
    });
  }

  if (btnBackToStep2) {
    btnBackToStep2.addEventListener('click', () => setStep(2));
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', handleBookingSubmit);
  }

  // Search booking form
  const searchBookingForm = document.getElementById('searchBookingForm');
  if (searchBookingForm) {
    searchBookingForm.addEventListener('submit', handleSearchSubmit);
  }

  // Admin login form
  const adminLoginForm = document.getElementById('adminLoginForm');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', handleAdminLogin);
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const passwordInput = document.getElementById('adminPassword');
  const errorBox = document.getElementById('adminLoginError');
  const password = passwordInput ? passwordInput.value.trim() : '';

  // Allowed admin passwords: '1234', 'admin1234', 'skru2026'
  if (password === '1234' || password === 'admin1234' || password === 'skru2026') {
    state.isAdminLoggedIn = true;
    if (errorBox) errorBox.style.display = 'none';
    if (passwordInput) passwordInput.value = '';
    
    document.getElementById('adminLoginBox').style.display = 'none';
    document.getElementById('adminContentBox').style.display = 'block';
    loadAdminBookings();
  } else {
    if (errorBox) {
      errorBox.textContent = '❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง (รหัสผ่านสาธิตคือ 1234)';
      errorBox.style.display = 'block';
    }
  }
}

function adminLogout() {
  state.isAdminLoggedIn = false;
  document.getElementById('adminLoginBox').style.display = 'block';
  document.getElementById('adminContentBox').style.display = 'none';
  const errorBox = document.getElementById('adminLoginError');
  if (errorBox) errorBox.style.display = 'none';
}

function switchView(viewName) {
  state.currentView = viewName;

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');

  if (viewName === 'home') {
    document.getElementById('tabHome')?.classList.add('active');
    document.getElementById('viewHome').style.display = 'block';
    loadDorms();
  } else if (viewName === 'search') {
    document.getElementById('tabSearch')?.classList.add('active');
    document.getElementById('viewSearch').style.display = 'block';
  } else if (viewName === 'info') {
    document.getElementById('tabInfo')?.classList.add('active');
    document.getElementById('viewInfo').style.display = 'block';
  } else if (viewName === 'admin') {
    document.getElementById('tabAdmin')?.classList.add('active');
    document.getElementById('viewAdmin').style.display = 'block';

    if (state.isAdminLoggedIn) {
      document.getElementById('adminLoginBox').style.display = 'none';
      document.getElementById('adminContentBox').style.display = 'block';
      loadAdminBookings();
    } else {
      document.getElementById('adminLoginBox').style.display = 'block';
      document.getElementById('adminContentBox').style.display = 'none';
    }
  }

  // Close drawer if open
  document.getElementById('navDrawer')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('open');
}

// Fetch dorms from Node.js backend
async function loadDorms() {
  try {
    const res = await fetch('/api/dorms');
    const data = await res.json();
    if (data.success) {
      const dorms = data.dorms || data.data || [];
      state.dorms = dorms;
      renderDorms(dorms);
    }
  } catch (err) {
    console.error('Error fetching dorms:', err);
  }
}

// Prefill student information from active session or /api/student
async function prefillStudentInfo() {
  try {
    let student = null;
    const res = await fetch('/api/student');
    if (res.ok) {
      student = await res.json();
    }
    if (!student) {
      const stored = localStorage.getItem('skru_user');
      if (stored) student = JSON.parse(stored);
    }
    if (student) {
      const searchInput = document.getElementById('searchStudentId');
      if (searchInput && !searchInput.value) {
        searchInput.value = student.studentId || '674295027';
      }
      const sId = document.getElementById('studentId');
      if (sId) sId.value = student.studentId || '674295027';
      const fName = document.getElementById('fullName');
      if (fName) fName.value = student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : (student.fullName || 'สมชาย ใจดี');
      const fac = document.getElementById('faculty');
      if (fac) fac.value = student.faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี';
      const maj = document.getElementById('major');
      if (maj) maj.value = student.major || 'สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล (ITDI)';
      const ph = document.getElementById('phone');
      if (ph) ph.value = student.phone || '081-234-5678';
      const em = document.getElementById('email');
      if (em) em.value = student.email || `${student.studentId || '674295027'}@parichat.skru.ac.th`;
    }
  } catch (e) {
    console.log('Prefill error:', e);
  }
}

// Render Dorm cards (Exact Figma replica)
function renderDorms(dorms) {
  const container = document.getElementById('dormListContainer');
  if (!container) return;

  container.innerHTML = dorms.map(dorm => {
    const amenitiesHtml = dorm.amenities.map(item => `
      <li class="amenity-item">
        <span class="amenity-check">✓</span>
        <span>${escapeHtml(item)}</span>
      </li>
    `).join('');

    return `
      <div class="dorm-card" id="card-${dorm.id}">
        <div class="dorm-card-header">
          <div class="dorm-header-left">
            <div class="dorm-title">${escapeHtml(dorm.name)}</div>
            <div class="dorm-capacity-status">${dorm.capacityPerRoomText} • ว่าง ${dorm.availableBeds}/${dorm.totalBeds} เตียง</div>
          </div>
          <div class="dorm-header-right">
            <div class="dorm-badge-floors">${dorm.floors} ชั้น | ${dorm.totalRooms} ห้องพัก</div>
            <div class="dorm-badge-beds">${dorm.bedsPerRoom} เตียง / ห้อง</div>
          </div>
        </div>
        <div class="dorm-card-body">
          <div class="amenities-column">
            <div class="amenities-section-title">สิ่งอำนวยความสะดวก & ข้อกำหนด</div>
            <ul class="amenities-list">
              ${amenitiesHtml}
            </ul>
          </div>
          <div class="pricing-column">
            <div class="pricing-info">
              <div class="pricing-label">ค่าบำรุงหอพัก</div>
              <div class="pricing-amount">${dorm.price.toLocaleString()} บาท</div>
              <div class="pricing-period">${dorm.pricePeriod}</div>
              <div class="pricing-note">${dorm.electricityNote}</div>
            </div>
            <button class="btn-book-dorm" onclick="openBookingModal('${dorm.id}')">
              จองหอพัก
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Open Booking Modal for selected dorm
async function openBookingModal(dormId) {
  state.selectedDorm = state.dorms.find(d => d.id === dormId);
  state.selectedRoom = null;
  state.selectedBed = null;
  state.selectedFloor = 1;
  state.paymentSlipData = null;
  
  // Reset slip preview
  const slipInput = document.getElementById('paymentSlipFile');
  const previewContainer = document.getElementById('slipPreviewContainer');
  if (slipInput) slipInput.value = '';
  if (previewContainer) previewContainer.style.display = 'none';

  setStep(1);

  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) {
    modalTitle.textContent = `จอง ${state.selectedDorm.name}`;
  }

  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.add('active');

  // Fetch full details of dorm rooms from backend
  try {
    const res = await fetch(`/api/dorms/${dormId}`);
    const data = await res.json();
    if (data.success) {
      state.selectedDormDetails = data.dorm || data.data;
      renderFloorSelector();
      renderRoomGrid();
      prefillStudentInfo();
    }
  } catch (err) {
    console.error('Error fetching dorm details:', err);
  }
}

function closeModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.remove('active');
}

function setStep(stepNum) {
  state.currentStep = stepNum;
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`stepItem${i}`);
    const stepBody = document.getElementById(`wizardStep${i}`);
    if (stepEl) {
      stepEl.classList.remove('active', 'completed');
      if (i < stepNum) stepEl.classList.add('completed');
      if (i === stepNum) stepEl.classList.add('active');
    }
    if (stepBody) {
      stepBody.style.display = (i === stepNum) ? 'block' : 'none';
    }
  }
}

// Render floor tabs (Floor 1, 2, 3, 4)
function renderFloorSelector() {
  const container = document.getElementById('floorTabsContainer');
  if (!container || !state.selectedDormDetails) return;

  const floors = state.selectedDormDetails.floors;
  let html = '';
  for (let f = 1; f <= floors; f++) {
    html += `
      <button class="floor-tab-btn ${f === state.selectedFloor ? 'active' : ''}" onclick="selectFloor(${f})">
        ชั้น ${f}
      </button>
    `;
  }
  container.innerHTML = html;
}

function selectFloor(floorNum) {
  state.selectedFloor = floorNum;
  renderFloorSelector();
  renderRoomGrid();
}

// Render rooms for selected floor
function renderRoomGrid() {
  const container = document.getElementById('roomGridContainer');
  if (!container || !state.selectedDormDetails) return;

  const roomsOnFloor = state.selectedDormDetails.rooms.filter(r => r.floor === state.selectedFloor);

  if (roomsOnFloor.length === 0) {
    container.innerHTML = '<p class="text-muted">ไม่มีห้องพักในชั้นนี้</p>';
    return;
  }

  container.innerHTML = roomsOnFloor.map(room => {
    const bedsHtml = room.beds.map(bed => {
      const isSelected = state.selectedBed && state.selectedBed.id === bed.id;
      const isOccupied = bed.isOccupied;

      let statusText = 'ว่าง';
      if (isOccupied) statusText = 'เต็ม';

      return `
        <button type="button" class="bed-btn ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : ''}"
          ${isOccupied ? 'disabled' : ''}
          onclick="selectBed('${room.roomNumber}', '${bed.id}', '${bed.label}')">
          <span>${bed.label}</span>
          <span class="bed-status-tag">${statusText}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="room-card">
        <div class="room-card-header">
          <span>ห้อง ${room.roomNumber}</span>
          <span style="font-weight:400; font-size:11px; color:#64748B;">ชั้น ${room.floor}</span>
        </div>
        <div class="bed-list">
          ${bedsHtml}
        </div>
      </div>
    `;
  }).join('');
}

function selectBed(roomNum, bedId, bedLabel) {
  state.selectedRoom = roomNum;
  state.selectedBed = { id: bedId, label: bedLabel };
  renderRoomGrid();

  const selectedDisplay = document.getElementById('selectedBedDisplay');
  if (selectedDisplay) {
    selectedDisplay.style.display = 'block';
    selectedDisplay.innerHTML = `
      <div class="alert alert-success">
        ✓ เลือกห้อง <strong>${roomNum}</strong> (${bedLabel}) เรียบร้อยแล้ว
      </div>
    `;
  }
}

function updateSummaryStep3() {
  const summaryBox = document.getElementById('step3Summary');
  if (!summaryBox) return;

  const prefix = document.getElementById('prefix').value;
  const fullName = document.getElementById('fullName').value.trim();
  const studentId = document.getElementById('studentId').value.trim();
  const faculty = document.getElementById('faculty').value.trim() || '-';
  const major = document.getElementById('major').value.trim() || '-';
  const phone = document.getElementById('phone').value.trim();

  let slipPreviewHtml = '';
  if (state.paymentSlipData) {
    slipPreviewHtml = `
      <div style="margin-top:8px; border-top:1px dashed #CBD5E1; padding-top:6px;">
        <span style="display:block; margin-bottom:4px; font-weight:600; color:#059669;">📎 สลิปโอนเงินแนบเรียบร้อยแล้ว:</span>
        <img src="${state.paymentSlipData}" style="max-height:140px; border-radius:6px; border:1px solid #E2E8F0;">
      </div>
    `;
  } else {
    slipPreviewHtml = `
      <div style="margin-top:6px; font-size:12px; color:#64748B;">
        ⚠️ ยังไม่ได้แนบสลิปโอนเงิน (สามารถแนบได้ภายหลังที่เมนูค้นหาการจอง)
      </div>
    `;
  }

  summaryBox.innerHTML = `
    <div class="selection-summary">
      <div class="summary-title">สรุปข้อมูลการจองหอพัก</div>
      <div class="summary-row"><span>หอพัก:</span> <strong>${state.selectedDorm.name}</strong></div>
      <div class="summary-row"><span>ห้องพัก:</span> <strong>ห้อง ${state.selectedRoom} (${state.selectedBed.label})</strong></div>
      <div class="summary-row"><span>ผู้จอง:</span> <strong>${prefix} ${fullName}</strong></div>
      <div class="summary-row"><span>รหัสนักศึกษา:</span> <strong>${studentId}</strong></div>
      <div class="summary-row"><span>คณะ/สาขา:</span> <strong>${faculty} / ${major}</strong></div>
      <div class="summary-row"><span>เบอร์โทรศัพท์:</span> <strong>${phone}</strong></div>
      <div class="summary-row" style="margin-top:8px; border-top:1px dashed #CBD5E1; padding-top:6px;">
        <span>ค่าบำรุงหอพัก:</span> <strong style="color:var(--skru-red); font-size:16px;">${state.selectedDorm.price.toLocaleString()} บาท</strong>
      </div>
      ${slipPreviewHtml}
    </div>
  `;
}

// Submit Booking to Backend API
async function handleBookingSubmit(e) {
  e.preventDefault();

  const payload = {
    dormId: state.selectedDorm.id,
    roomNumber: state.selectedRoom,
    bedId: state.selectedBed.id,
    studentId: document.getElementById('studentId').value.trim(),
    prefix: document.getElementById('prefix').value,
    fullName: document.getElementById('fullName').value.trim(),
    gender: state.selectedDorm.type,
    faculty: document.getElementById('faculty').value.trim(),
    major: document.getElementById('major').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    paymentSlip: state.paymentSlipData || null
  };

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      renderBookingReceipt(result.booking);
      setStep(4);
      loadDorms(); // refresh bed count on home page
    } else {
      alert('เกิดข้อผิดพลาด: ' + result.message);
    }
  } catch (err) {
    console.error('Submit booking error:', err);
    alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
  }
}

// Render Slip/Receipt after booking (Official SKRU Format)
function renderBookingReceipt(booking) {
  const container = document.getElementById('step4SlipContainer');
  if (!container) return;

  const dateStr = new Date(booking.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let slipImgSection = '';
  if (booking.paymentSlip) {
    slipImgSection = `
      <div style="margin-top:12px; text-align:center; border-top:1px dashed #CBD5E1; padding-top:10px;">
        <div style="font-size:12px; font-weight:700; color:#059669; margin-bottom:4px;">✅ สลิปการโอนเงินชำระค่าบำรุงหอพัก:</div>
        <img src="${booking.paymentSlip}" style="max-width:180px; max-height:220px; border-radius:8px; border:1px solid #CBD5E1; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      </div>
    `;
  } else {
    slipImgSection = `
      <div style="margin-top:10px; font-size:12px; color:#B91C1C; background:#FEE2E2; padding:8px; border-radius:6px; text-align:center;">
        ⚠️ ยังไม่ได้แนบสลิปโอนเงิน (กรุณาแนบสลิปที่เมนูค้นหาการจอง)
      </div>
    `;
  }

  container.innerHTML = `
    <div class="slip-card">
      <div class="slip-header">
        <img src="assets/skru-logo.png" alt="ตรามหาวิทยาลัยราชภัฏสงขลา" style="height:55px; width:auto; margin-bottom:6px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.12));">
        <div style="color:var(--skru-red); font-weight:700; font-size:15px;">ใบยืนยันการจองหอพัก มหาวิทยาลัยราชภัฏสงขลา</div>
        <div class="slip-code">${booking.bookingCode}</div>
        <div style="font-size:11px; color:#64748B;">วันที่จอง: ${dateStr}</div>
      </div>
      <div class="slip-details">
        <div class="slip-detail-row"><span>ชื่อ-นามสกุล:</span> <strong>${booking.prefix}${booking.fullName}</strong></div>
        <div class="slip-detail-row"><span>รหัสนักศึกษา:</span> <strong>${booking.studentId}</strong></div>
        <div class="slip-detail-row"><span>หอพักที่จอง:</span> <strong>${booking.dormName}</strong></div>
        <div class="slip-detail-row"><span>ห้องพัก / เตียง:</span> <strong>ห้อง ${booking.roomNumber} (${booking.bedLabel})</strong></div>
        <div class="slip-detail-row"><span>คณะ / สาขา:</span> <strong>${booking.faculty} / ${booking.major}</strong></div>
        <div class="slip-detail-row"><span>เบอร์โทร:</span> <strong>${booking.phone}</strong></div>
        <div class="slip-detail-row" style="margin-top:8px; border-top:1px solid #CBD5E1; padding-top:6px;">
          <span>ค่าบำรุงหอพัก:</span> <strong style="color:var(--skru-red); font-size:16px;">${booking.price.toLocaleString()} บาท</strong>
        </div>
        <div style="font-size:11px; color:#64748B; text-align:right;">(${booking.pricePeriod})</div>
      </div>

      ${slipImgSection}

      <div class="qr-code-placeholder">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(booking.bookingCode)}" alt="Booking QR Code">
      </div>
      <div style="text-align:center; font-size:11px; color:#64748B; margin-top:4px;">
        สแกนเพื่อตรวจสอบสถานะการจอง
      </div>
    </div>
    <div style="margin-top:16px; display:flex; gap:10px;">
      <button class="btn-primary" style="flex:1;" onclick="window.print()">
        🖨️ พิมพ์ใบจอง
      </button>
      <button class="btn-secondary" style="flex:1;" onclick="closeModal()">
        ปิดหน้าต่าง
      </button>
    </div>
  `;
}

// Search Booking Logic
async function handleSearchSubmit(e) {
  e.preventDefault();
  const studentId = document.getElementById('searchStudentId').value.trim();
  const searchResult = document.getElementById('searchResultContainer');

  if (!studentId) {
    alert('กรุณากรอกรหัสนักศึกษา หรือ รหัสการจอง');
    return;
  }

  try {
    const res = await fetch(`/api/bookings/search?studentId=${encodeURIComponent(studentId)}`);
    const data = await res.json();

    if (data.success) {
      const b = data.booking || (data.bookings && data.bookings[0]) || data.data;
      
      let slipDisplay = '';
      if (b.paymentSlip) {
        slipDisplay = `
          <div style="margin-top:12px; background:#F0FDF4; border:1px solid #BBF7D0; padding:10px; border-radius:8px;">
            <div style="font-size:13px; font-weight:700; color:#166534; margin-bottom:6px;">✅ แนบสลิปการโอนเงินเรียบร้อยแล้ว</div>
            <img src="${b.paymentSlip}" style="max-width:200px; max-height:240px; border-radius:6px; border:1px solid #CBD5E1;">
          </div>
        `;
      } else {
        slipDisplay = `
          <div style="margin-top:12px; background:#FFFBEB; border:1px solid #FDE68A; padding:12px; border-radius:8px;">
            <div style="font-size:13px; font-weight:700; color:#92400E; margin-bottom:6px;">⚠️ ยังไม่ได้แนบสลิปโอนเงิน</div>
            <div style="font-size:12px; color:#475569; margin-bottom:8px;">ธนาคารกรุงไทย 901-0-12345-6 (งานหอพัก SKRU)</div>
            <input type="file" id="attachSlipInput_${b.id}" class="form-control" accept="image/*" style="font-size:12px; padding:4px;">
            <button class="btn-primary" style="margin-top:8px; width:100%; font-size:13px; padding:6px 12px;" onclick="uploadSlipForBooking('${b.id}')">
              📤 อัปโหลดสลิปโอนเงิน
            </button>
          </div>
        `;
      }

      searchResult.innerHTML = `
        <div class="alert alert-success">
          พบข้อมูลการจองสำหรับรหัสนักศึกษา <strong>${b.studentId}</strong>
        </div>
        <div class="slip-card">
          <div class="slip-header">
            <img src="assets/skru-logo.png" alt="SKRU Seal" style="height:45px; width:auto; margin-bottom:4px;">
            <div style="color:var(--skru-red); font-weight:700;">สถานะการจอง: <span style="color:#10B981;">ยืนยันแล้ว</span></div>
            <div class="slip-code">${b.bookingCode}</div>
          </div>
          <div class="slip-details">
            <div class="slip-detail-row"><span>ชื่อ-นามสกุล:</span> <strong>${b.prefix}${b.fullName}</strong></div>
            <div class="slip-detail-row"><span>หอพัก:</span> <strong>${b.dormName}</strong></div>
            <div class="slip-detail-row"><span>ห้องพัก:</span> <strong>ห้อง ${b.roomNumber} (${b.bedLabel})</strong></div>
            <div class="slip-detail-row"><span>ยอดชำระ:</span> <strong>${b.price.toLocaleString()} บาท</strong></div>
          </div>

          ${slipDisplay}

          <div style="margin-top:16px; display:flex; gap:10px;">
            <button class="btn-primary" style="flex:1;" onclick="renderSearchReceiptModal('${b.id}')">
              🖨️ ดูใบจองหอพัก
            </button>
            <button class="btn-danger" style="flex:1;" onclick="cancelBooking('${b.id}')">
              ❌ ยกเลิกการจอง
            </button>
          </div>
        </div>
      `;
    } else {
      searchResult.innerHTML = `
        <div class="alert alert-danger">
          ❌ ไม่พบข้อมูลการจองสำหรับรหัสนักศึกษา/รหัสการจอง "${escapeHtml(studentId)}"
        </div>
      `;
    }
  } catch (err) {
    console.error('Search booking error:', err);
  }
}

async function uploadSlipForBooking(bookingId) {
  const fileInput = document.getElementById(`attachSlipInput_${bookingId}`);
  if (!fileInput || !fileInput.files[0]) {
    alert('กรุณาเลือกไฟล์ภาพสลิปโอนเงินก่อนทำการอัปโหลด');
    return;
  }

  const file = fileInput.files[0];
  if (file.size > 10 * 1024 * 1024) {
    alert('ขนาดไฟล์ภาพใหญ่เกินไป กรุณาเลือกไฟล์ขนาดไม่เกิน 10MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const slipBase64 = e.target.result;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payment-slip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentSlip: slipBase64 })
      });
      const data = await res.json();
      if (data.success) {
        alert('อัปโหลดสลิปโอนเงินสำเร็จ!');
        handleSearchSubmit(new Event('submit'));
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.message);
      }
    } catch (err) {
      console.error('Upload slip error:', err);
      alert('ไม่สามารถอัปโหลดสลิปได้');
    }
  };
  reader.readAsDataURL(file);
}

function renderSearchReceiptModal(bookingId) {
  fetch(`/api/bookings/search?bookingCode=`) // trigger refresh if needed
}

async function cancelBooking(bookingId) {
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองหอพักนี้?')) return;

  try {
    const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert('ยกเลิกการจองเรียบร้อยแล้ว');
      const searchContainer = document.getElementById('searchResultContainer');
      if (searchContainer) searchContainer.innerHTML = '';
      loadDorms();
      loadAdminBookings(); // Instantly refresh Admin dashboard list
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error('Cancel booking error:', err);
  }
}

// Admin Panel Logic (Staff Dashboard)
async function loadAdminBookings() {
  const container = document.getElementById('adminTableContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/admin/bookings');
    const data = await res.json();

    if (data.success) {
      const bookings = data.bookings || data.data || [];
      if (bookings.length === 0) {
        container.innerHTML = '<p style="padding:16px;" class="text-muted">ยังไม่มีรายการจองหอพักในระบบ</p>';
        return;
      }

      container.innerHTML = `
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>รหัสการจอง</th>
                <th>รหัสนักศึกษา</th>
                <th>ชื่อ-นามสกุล</th>
                <th>หอพัก</th>
                <th>ห้อง/เตียง</th>
                <th>เบอร์โทร</th>
                <th>สลิปการโอน</th>
                <th>สถานะ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${bookings.map(b => `
                <tr>
                  <td><strong>${b.bookingCode}</strong></td>
                  <td>${b.studentId}</td>
                  <td>${b.prefix}${b.fullName}</td>
                  <td>${b.dormName}</td>
                  <td>ห้อง ${b.roomNumber} (${b.bedLabel})</td>
                  <td>${b.phone}</td>
                  <td>
                    ${b.paymentSlip ? `
                      <button class="btn-secondary" style="padding:2px 8px; font-size:11px; background:#DCFCE7; color:#166534;" onclick="viewSlipModal('${b.paymentSlip}')">
                        🖼️ ดูสลิป
                      </button>
                    ` : '<span style="color:#94A3B8; font-size:11px;">ยังไม่แนบ</span>'}
                  </td>
                  <td><span style="color:${b.status === 'confirmed' ? '#10B981' : '#EF4444'}; font-weight:700;">${b.status}</span></td>
                  <td>
                    ${b.status === 'confirmed' ? `
                      <button class="btn-danger" style="padding:2px 8px; font-size:11px;" onclick="cancelBooking('${b.id}')">
                        ยกเลิก
                      </button>
                    ` : '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  } catch (err) {
    console.error('Admin load bookings error:', err);
  }
}

function viewSlipModal(slipDataUrl) {
  const w = window.open("");
  w.document.write(`
    <html>
      <head><title>สลิปการโอนเงิน - งานหอพัก SKRU</title></head>
      <body style="margin:0; display:flex; align-items:center; justify-content:center; background:#111; height:100vh;">
        <img src="${slipDataUrl}" style="max-width:90%; max-height:90%; border-radius:8px; box-shadow:0 0 20px rgba(0,0,0,0.5);">
      </body>
    </html>
  `);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

// Global Back Navigation Action
function handleDormBack() {
  // 1. If booking wizard modal is open, close modal
  const bookingModal = document.getElementById('bookingModal');
  if (bookingModal && (bookingModal.classList.contains('open') || bookingModal.style.display === 'flex' || bookingModal.style.display === 'block')) {
    closeModal();
    return;
  }

  // 2. If navigation drawer is open, close drawer
  const navDrawer = document.getElementById('navDrawer');
  if (navDrawer && navDrawer.classList.contains('open')) {
    navDrawer.classList.remove('open');
    const overlay = document.getElementById('drawerOverlay');
    if (overlay) overlay.classList.remove('open');
    return;
  }

  // 3. If currently in another view (search, info, admin), return to home dorm list
  if (state.currentView !== 'home') {
    switchView('home');
    return;
  }

  // 4. If on home view:
  // If embedded in iframe (such as inside SuperApp index.html)
  if (window.parent && window.parent !== window) {
    try {
      if (typeof window.parent.closeInApp === 'function') {
        window.parent.closeInApp();
        return;
      }
    } catch (e) {}
    window.parent.postMessage({ type: 'closeInApp' }, '*');
    window.parent.postMessage({ type: 'closeApp' }, '*');
    return;
  }

  // If running standalone
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '/index.html';
  }
}
