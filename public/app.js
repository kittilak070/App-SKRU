/**
 * SKRU Digital Student Card Mobile App Logic
 * Vanilla JavaScript communicating with Express REST API
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global App State
  let state = {
    students: [],
    activeStudent: null,
    isFlipped: false,
    theme: 'theme-skru'
  };

  // DOM Elements
  const statusClockEl = document.getElementById('status-clock');
  const liveSecurityClockEl = document.getElementById('live-security-clock');
  const cardInner = document.getElementById('digital-card-inner');
  const btnFlipCard = document.getElementById('btn-flip-card');
  const flipHintPill = document.getElementById('flip-hint-pill');
  const btnDownloadCard = document.getElementById('btn-download-card');

  // Student Drawer Elements
  const btnOpenStudentDrawer = document.getElementById('btn-open-student-drawer');
  const btnOpenStudentDrawerDock = document.getElementById('btn-open-student-drawer-dock');
  const studentDrawerBackdrop = document.getElementById('student-drawer-backdrop');
  const btnCloseStudentDrawer = document.getElementById('btn-close-student-drawer');
  const drawerStudentSearch = document.getElementById('drawer-student-search');
  const drawerStudentList = document.getElementById('drawer-student-list');

  // Theme Drawer Elements
  const btnOpenThemeDrawer = document.getElementById('btn-open-theme-drawer');
  const themeDrawerBackdrop = document.getElementById('theme-drawer-backdrop');
  const btnCloseThemeDrawer = document.getElementById('btn-close-theme-drawer');
  const themeOptions = document.querySelectorAll('.theme-card-option');

  // QR Modal Elements
  const btnScanQr = document.getElementById('btn-scan-qr');
  const qrZoomBackdrop = document.getElementById('qr-zoom-backdrop');
  const btnCloseQrModal = document.getElementById('btn-close-qr-modal');

  // 1. Live Realtime Clocks
  function startClocks() {
    const updateClocks = () => {
      const now = new Date();
      const timeShort = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const timeFull = now.toLocaleTimeString('th-TH', { hour12: false });
      
      if (statusClockEl) statusClockEl.textContent = timeShort;
      if (liveSecurityClockEl) liveSecurityClockEl.textContent = timeFull;
    };
    updateClocks();
    setInterval(updateClocks, 1000);
  }

  // 2. Fetch Students from REST API
  async function fetchStudents(searchQuery = '') {
    try {
      const res = await fetch(`/api/students?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        state.students = data.data;
        renderDrawerStudentList();
        
        // Set initial active student if none set
        if (!state.activeStudent && state.students.length > 0) {
          setActiveStudent(state.students[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }

  // 3. Render Student Drawer List
  function renderDrawerStudentList() {
    if (!drawerStudentList) return;
    drawerStudentList.innerHTML = '';

    if (state.students.length === 0) {
      drawerStudentList.innerHTML = `
        <div style="text-align:center; padding: 20px; color: var(--text-muted);">
          ไม่พบข้อมูลนักศึกษา
        </div>
      `;
      return;
    }

    state.students.forEach(student => {
      const item = document.createElement('div');
      item.className = `drawer-student-item ${state.activeStudent && state.activeStudent.id === student.id ? 'active' : ''}`;
      item.innerHTML = `
        <img class="drawer-item-avatar" src="${student.photoUrl || '/assets/student_nutella.jpg'}" alt="Avatar">
        <div class="drawer-item-info">
          <h4>${student.prefixTh}${student.firstNameTh} ${student.lastNameTh}</h4>
          <p>รหัส: ${student.studentId} | ${student.facultyTh || ''}</p>
        </div>
      `;

      item.addEventListener('click', () => {
        setActiveStudent(student);
        closeDrawer(studentDrawerBackdrop);
      });

      drawerStudentList.appendChild(item);
    });
  }

  // 4. Set Active Student & Update Card UI
  function setActiveStudent(student) {
    if (!student) return;
    state.activeStudent = student;

    // Update Front Side UI
    document.getElementById('card-photo').src = student.photoUrl || '/assets/student_nutella.jpg';
    document.getElementById('card-name-th').textContent = `${student.prefixTh} ${student.firstNameTh} ${student.lastNameTh}`;
    document.getElementById('card-name-en').textContent = `${student.prefixEn} ${student.firstNameEn} ${student.lastNameEn}`;
    document.getElementById('card-student-id').textContent = student.studentId;
    document.getElementById('card-uni-th').textContent = student.universityTh || 'มหาวิทยาลัยราชภัฏสงขลา';
    document.getElementById('card-uni-en').textContent = student.universityEn || 'SONGKHLA RAJABHAT UNIVERSITY';
    document.getElementById('card-header-uni-abbr').textContent = `${student.universityTh || 'ม.ราชภัฏสงขลา'} (${student.universityAbbr || 'SKRU'})`;
    document.getElementById('card-logo-overlay').textContent = student.universityAbbr || 'SKRU';

    // Update Back Side UI
    document.getElementById('card-back-faculty').textContent = student.facultyTh || '-';
    document.getElementById('card-back-major').textContent = student.majorTh || '-';
    document.getElementById('card-back-expiry').textContent = formatDateTh(student.expiryDate);
    
    const emergencyEl = document.getElementById('card-back-emergency');
    const emergencyLink = document.getElementById('card-back-emergency-link');
    if (emergencyEl) emergencyEl.textContent = student.emergencyContact || '081-876-5432';
    if (emergencyLink) emergencyLink.href = `tel:${(student.emergencyContact || '0818765432').replace(/[^0-9+]/g, '')}`;
    
    const statusEl = document.getElementById('card-back-status');
    if (statusEl) {
      if (student.status === 'active') {
        statusEl.textContent = 'กำลังศึกษา (Active)';
        statusEl.className = 'status-pill active';
      } else {
        statusEl.textContent = 'พ้นสภาพ (Inactive)';
        statusEl.className = 'status-pill inactive';
      }
    }

    // Generate Barcode for Card Back
    try {
      JsBarcode("#card-barcode", student.studentId, {
        format: "CODE128",
        lineColor: "#0f172a",
        width: 1.8,
        height: 40,
        displayValue: true,
        fontSize: 11,
        font: "Kanit"
      });
    } catch (e) {
      console.warn("JsBarcode error:", e);
    }

    // Generate QR Code for Card Back
    const qrContainer = document.getElementById('card-qrcode');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      const verifyUrl = `${window.location.protocol}//${window.location.host}/#verify-${student.studentId}`;
      new QRCode(qrContainer, {
        text: verifyUrl,
        width: 65,
        height: 65,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }

    // Security Hash generator
    const hash = 'SEC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const secHashEl = document.getElementById('card-sec-hash');
    if (secHashEl) secHashEl.textContent = `SEC-HASH: ${hash}`;

    // Update Drawer Active Item highlight
    renderDrawerStudentList();

    // Update Zoom Modal content if open
    updateModalContent(student);
  }

  // 5. Update Fullscreen QR Zoom Modal
  function updateModalContent(student) {
    if (!student) return;
    document.getElementById('modal-student-id').textContent = student.studentId;

    const modalQrContainer = document.getElementById('modal-qrcode-container');
    if (modalQrContainer) {
      modalQrContainer.innerHTML = '';
      const verifyUrl = `${window.location.protocol}//${window.location.host}/#verify-${student.studentId}`;
      new QRCode(modalQrContainer, {
        text: verifyUrl,
        width: 180,
        height: 180,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }

    try {
      JsBarcode("#modal-barcode-container", student.studentId, {
        format: "CODE128",
        lineColor: "#0f172a",
        width: 2.2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        font: "Kanit"
      });
    } catch (e) {
      console.warn("JsBarcode modal error:", e);
    }
  }

  // 6. Flip Card Functionality
  function toggleFlipCard() {
    state.isFlipped = !state.isFlipped;
    if (cardInner) {
      if (state.isFlipped) {
        cardInner.classList.add('is-flipped');
      } else {
        cardInner.classList.remove('is-flipped');
      }
    }
  }

  if (cardInner) cardInner.addEventListener('click', toggleFlipCard);
  if (btnFlipCard) btnFlipCard.addEventListener('click', toggleFlipCard);

  // 7. Drawer Helper Functions
  function openDrawer(drawerEl) {
    if (drawerEl) drawerEl.classList.add('active');
  }
  function closeDrawer(drawerEl) {
    if (drawerEl) drawerEl.classList.remove('active');
  }

  // Student Drawer Handlers
  if (btnOpenStudentDrawer) btnOpenStudentDrawer.addEventListener('click', () => openDrawer(studentDrawerBackdrop));
  if (btnOpenStudentDrawerDock) btnOpenStudentDrawerDock.addEventListener('click', () => openDrawer(studentDrawerBackdrop));
  if (btnCloseStudentDrawer) btnCloseStudentDrawer.addEventListener('click', () => closeDrawer(studentDrawerBackdrop));
  if (studentDrawerBackdrop) {
    studentDrawerBackdrop.addEventListener('click', (e) => {
      if (e.target === studentDrawerBackdrop) closeDrawer(studentDrawerBackdrop);
    });
  }

  // Student Search inside Drawer
  if (drawerStudentSearch) {
    drawerStudentSearch.addEventListener('input', (e) => {
      fetchStudents(e.target.value);
    });
  }

  // Theme Drawer Handlers
  if (btnOpenThemeDrawer) btnOpenThemeDrawer.addEventListener('click', () => openDrawer(themeDrawerBackdrop));
  if (btnCloseThemeDrawer) btnCloseThemeDrawer.addEventListener('click', () => closeDrawer(themeDrawerBackdrop));
  if (themeDrawerBackdrop) {
    themeDrawerBackdrop.addEventListener('click', (e) => {
      if (e.target === themeDrawerBackdrop) closeDrawer(themeDrawerBackdrop);
    });
  }

  themeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      const themeClass = btn.getAttribute('data-theme');
      document.body.className = themeClass;
      state.theme = themeClass;

      themeOptions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      closeDrawer(themeDrawerBackdrop);
    });
  });

  // QR Modal Handlers
  if (btnScanQr) btnScanQr.addEventListener('click', () => {
    updateModalContent(state.activeStudent);
    openDrawer(qrZoomBackdrop);
  });
  if (btnCloseQrModal) btnCloseQrModal.addEventListener('click', () => closeDrawer(qrZoomBackdrop));
  if (qrZoomBackdrop) {
    qrZoomBackdrop.addEventListener('click', (e) => {
      if (e.target === qrZoomBackdrop) closeDrawer(qrZoomBackdrop);
    });
  }

  // 8. Download Card PNG Image Functionality
  if (btnDownloadCard) {
    btnDownloadCard.addEventListener('click', async () => {
      const targetElement = state.isFlipped ? document.getElementById('card-back-element') : document.getElementById('card-front-element');
      
      try {
        btnDownloadCard.disabled = true;
        btnDownloadCard.querySelector('span').textContent = 'กำลังบันทึก...';

        const canvas = await html2canvas(targetElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null
        });

        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        const filename = `SKRU_StudentCard_${state.activeStudent ? state.activeStudent.studentId : 'ID'}_${state.isFlipped ? 'BACK' : 'FRONT'}.png`;
        
        link.download = filename;
        link.href = image;
        link.click();
      } catch (err) {
        console.error("Error downloading card:", err);
        alert("เกิดข้อผิดพลาดในการบันทึกภาพบัตร กรุณาลองใหม่อีกครั้ง");
      } finally {
        btnDownloadCard.disabled = false;
        btnDownloadCard.querySelector('span').textContent = 'บันทึกรูป';
      }
    });
  }

  // Helper: Date Formatting (TH)
  function formatDateTh(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const monthsTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const day = d.getDate();
      const month = monthsTh[d.getMonth()];
      const yearTh = d.getFullYear() + 543;
      return `${day} ${month} ${yearTh}`;
    } catch (e) {
      return dateStr;
    }
  }

  // Initialize
  startClocks();
  fetchStudents();
});
