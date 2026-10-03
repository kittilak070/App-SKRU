// app.js - Main Application Controller
document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    currentStudent: {
      id: "66010123",
      name: "นายณัฐพล สมบูรณ์",
      faculty: "คณะวิศวกรรมศาสตร์และเทคโนโลยี",
      major: "สาขาวิชาวิศวกรรมคอมพิวเตอร์"
    },
    activities: [],
    myBookings: [],
    stats: null,
    currentCategory: 'ทั้งหมด',
    searchQuery: '',
    activeTab: 'pane-activities',
    modalStack: []
  };

  // DOM Elements
  const serverStatusText = document.getElementById('server-status-text');
  const toggleFrameBtn = document.getElementById('toggle-frame-btn');
  const mobileContainer = document.getElementById('mobile-container');
  const headerBackBtn = document.getElementById('header-back-btn');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  const registeredBadgeCount = document.getElementById('registered-badge-count');

  // Menu Action Buttons (from Figma)
  const btnSearchActivities = document.getElementById('btn-search-activities');
  const btnAddActivityCode = document.getElementById('btn-add-activity-code');
  const btnMyRegistered = document.getElementById('btn-my-registered');
  const btnCheckHours = document.getElementById('btn-check-hours');
  const btnConductScore = document.getElementById('btn-conduct-score');
  const btnKysActivities = document.getElementById('btn-kys-activities');

  // Catalog Elements
  const activitySearchInput = document.getElementById('activity-search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const filterChips = document.querySelectorAll('.filter-chip');
  const activitiesCardList = document.getElementById('activities-card-list');

  // Code Modal Elements
  const activityCodeInput = document.getElementById('activity-code-input');
  const btnSubmitCode = document.getElementById('btn-submit-code');
  const codeChips = document.querySelectorAll('.code-chip');

  // Bookings List & Ticket Elements
  const registeredCardsContainer = document.getElementById('registered-cards-container');
  const ticketCategory = document.getElementById('ticket-category');
  const ticketTitle = document.getElementById('ticket-title');
  const ticketSeat = document.getElementById('ticket-seat');
  const ticketStudentId = document.getElementById('ticket-studentid');
  const ticketDate = document.getElementById('ticket-date');
  const ticketTime = document.getElementById('ticket-time');
  const ticketCodeStr = document.getElementById('ticket-code-str');

  // Nav items
  const navTabs = document.querySelectorAll('.nav-tab-item');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // ==========================================
  // 1. INITIALIZATION & DATA FETCHING
  // ==========================================
  async function init() {
    setupEventListeners();
    await checkConnection();
    await refreshData();
  }

  async function checkConnection() {
    try {
      const isOnline = await API.checkHealth();
      if (isOnline) {
        serverStatusText.textContent = 'ออนไลน์ (เชื่อมต่อหลังบ้านแล้ว)';
        serverStatusText.style.color = '#10B981';
      } else {
        serverStatusText.textContent = 'โหมดออฟไลน์ / ระบบพร้อมใช้งาน';
      }
    } catch {
      serverStatusText.textContent = 'ระบบพร้อมทำงาน';
    }
  }

  async function refreshData() {
    try {
      // 1. Fetch Activities
      const actRes = await API.getActivities();
      if (actRes && actRes.data) {
        state.activities = actRes.data;
      }

      // 2. Fetch My Bookings
      const bookRes = await API.getMyBookings(state.currentStudent.id);
      if (bookRes && bookRes.data) {
        state.myBookings = bookRes.data;
        updateBadge(state.myBookings.length);
      }

      // 3. Fetch Stats
      const statRes = await API.getStudentStats();
      if (statRes && statRes.data) {
        state.stats = statRes.data;
        updateStatsUI(state.stats);
      }

      // 4. Render Home Tab Content
      renderHomeUpcoming();
      renderNotifications();
    } catch (err) {
      console.warn('Initial data loading warning:', err);
    }
  }

  function updateBadge(count) {
    if (registeredBadgeCount) {
      registeredBadgeCount.textContent = count;
      registeredBadgeCount.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  function updateStatsUI(stats) {
    const homeHours = document.getElementById('home-hours-val');
    const homeConduct = document.getElementById('home-conduct-val');
    const hoursTotalDisplay = document.getElementById('hours-total-display');
    const hoursMainBar = document.getElementById('hours-main-bar');

    if (homeHours) homeHours.textContent = stats.hoursCompleted || 38;
    if (homeConduct) homeConduct.textContent = stats.conductScore || 100;
    if (hoursTotalDisplay) hoursTotalDisplay.textContent = stats.hoursCompleted || 38;
    if (hoursMainBar) {
      const pct = Math.min(100, Math.round(((stats.hoursCompleted || 38) / (stats.hoursTarget || 50)) * 100));
      hoursMainBar.style.width = `${pct}%`;
    }
  }

  // ==========================================
  // 2. EVENT LISTENERS
  // ==========================================
  function setupEventListeners() {
    // Desktop / Mobile Viewport Toggle
    toggleFrameBtn?.addEventListener('click', () => {
      mobileContainer.classList.toggle('full-mode');
      const isFull = mobileContainer.classList.contains('full-mode');
      toggleFrameBtn.innerHTML = isFull
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> มุมมองเต็มจอ`
        : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> มุมมองมือถือ`;
    });

    // Navigation Tabs
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetPaneId = tab.getAttribute('data-tab');
        switchTab(targetPaneId);
      });
    });

    // Back Button in Header
    headerBackBtn?.addEventListener('click', () => {
      if (state.modalStack.length > 0) {
        closeTopModal();
      } else if (state.activeTab !== 'pane-activities') {
        switchTab('pane-activities');
      } else {
        showToast('คุณอยู่ที่หน้าหลักของกิจกรรมแล้ว', 'info');
      }
    });

    // Menu Card Clicks (Matching Figma)
    btnSearchActivities?.addEventListener('click', () => {
      openModal('modal-search-activities');
      loadAndRenderActivities();
    });

    btnAddActivityCode?.addEventListener('click', () => {
      openModal('modal-add-code');
      setTimeout(() => activityCodeInput?.focus(), 300);
    });

    btnMyRegistered?.addEventListener('click', () => {
      openModal('modal-registered-list');
      renderMyBookings();
    });

    btnCheckHours?.addEventListener('click', () => {
      openModal('modal-hours-summary');
    });

    btnConductScore?.addEventListener('click', () => {
      openModal('modal-conduct-view');
    });

    btnKysActivities?.addEventListener('click', () => {
      openModal('modal-kys-view');
      renderKysActivities();
    });

    // Close Modal Buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = btn.getAttribute('data-close');
        closeModal(modalId);
      });
    });

    // Close on overlay backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(overlay.id);
        }
      });
    });

    // ESC key closes top modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.modalStack.length > 0) {
        closeTopModal();
      }
    });

    // Search Input in Catalog
    activitySearchInput?.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      searchClearBtn.style.display = state.searchQuery ? 'flex' : 'none';
      filterAndRenderActivities();
    });

    searchClearBtn?.addEventListener('click', () => {
      activitySearchInput.value = '';
      state.searchQuery = '';
      searchClearBtn.style.display = 'none';
      filterAndRenderActivities();
      activitySearchInput.focus();
    });

    // Filter Chips
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.currentCategory = chip.getAttribute('data-category');
        filterAndRenderActivities();
      });
    });

    // Quick Code Chips
    codeChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const code = chip.getAttribute('data-code');
        if (activityCodeInput) {
          activityCodeInput.value = code;
          activityCodeInput.focus();
        }
      });
    });

    // Submit Activity Code
    btnSubmitCode?.addEventListener('click', handleRegisterByCode);
    activityCodeInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleRegisterByCode();
    });

    // Quick Home link to registered
    document.getElementById('link-to-registered')?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('modal-registered-list');
      renderMyBookings();
    });

    // Mark notifications read
    document.getElementById('mark-read-btn')?.addEventListener('click', () => {
      document.querySelectorAll('.notif-card').forEach(c => c.classList.remove('unread'));
      document.querySelector('.nav-dot-badge')?.remove();
      showToast('ทำเครื่องหมายอ่านทั้งหมดแล้ว', 'info');
    });
  }

  // ==========================================
  // 3. TAB NAVIGATION CONTROLLER
  // ==========================================
  function switchTab(paneId) {
    state.activeTab = paneId;

    // Update active tab buttons
    navTabs.forEach(tab => {
      const target = tab.getAttribute('data-tab');
      if (target === paneId) {
        tab.classList.add('active');
        const iconWrapper = tab.querySelector('.nav-icon-wrapper');
        iconWrapper?.classList.add('active-pill');
        tab.querySelector('.nav-tab-label')?.classList.add('active-text');
      } else {
        tab.classList.remove('active');
        const iconWrapper = tab.querySelector('.nav-icon-wrapper');
        iconWrapper?.classList.remove('active-pill');
        tab.querySelector('.nav-tab-label')?.classList.remove('active-text');
      }
    });

    // Update Panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    const targetPane = document.getElementById(paneId);
    if (targetPane) {
      targetPane.classList.add('active');
    }

    // Update Header Titles based on active tab
    if (paneId === 'pane-activities') {
      pageTitle.textContent = 'กิจกรรม';
      pageSubtitle.textContent = 'ระบบกิจกรรมนักศึกษา';
    } else if (paneId === 'pane-home') {
      pageTitle.textContent = 'หน้าหลัก';
      pageSubtitle.textContent = 'ภาพรวมกิจกรรมนักศึกษา';
    } else if (paneId === 'pane-notifications') {
      pageTitle.textContent = 'การแจ้งเตือน';
      pageSubtitle.textContent = 'ข้อความและข่าวสารล่าสุด';
    } else if (paneId === 'pane-profile') {
      pageTitle.textContent = 'โปรไฟล์';
      pageSubtitle.textContent = 'ข้อมูลนักศึกษาและสถานะ';
    }
  }

  // ==========================================
  // 4. MODAL MANAGER
  // ==========================================
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    state.modalStack.push(modalId);
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    state.modalStack = state.modalStack.filter(id => id !== modalId);
  }

  function closeTopModal() {
    if (state.modalStack.length > 0) {
      const topModalId = state.modalStack.pop();
      const modal = document.getElementById(topModalId);
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
    }
  }

  // ==========================================
  // 5. ACTIVITIES CATALOG & BOOKING LOGIC
  // ==========================================
  async function loadAndRenderActivities() {
    try {
      const res = await API.getActivities();
      if (res && res.data) {
        state.activities = res.data;
        filterAndRenderActivities();
      }
    } catch (err) {
      activitiesCardList.innerHTML = `<div class="error-msg">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}</div>`;
    }
  }

  function filterAndRenderActivities() {
    if (!activitiesCardList) return;

    let filtered = [...state.activities];

    // Filter by category
    if (state.currentCategory && state.currentCategory !== 'ทั้งหมด') {
      if (state.currentCategory === 'กยศ.') {
        filtered = filtered.filter(a => a.isKYS);
      } else {
        filtered = filtered.filter(a => a.category === state.currentCategory);
      }
    }

    // Filter by query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      activitiesCardList.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: #94A3B8;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p style="font-size: 14px; font-weight: 600; color: #64748B;">ไม่พบกิจกรรมที่ตรงกับการค้นหา</p>
          <p style="font-size: 12px; margin-top: 4px;">ลองเปลี่ยนคำค้นหา หรือหมวดหมู่กิจกรรม</p>
        </div>
      `;
      return;
    }

    const html = filtered.map(act => {
      const isBooked = state.myBookings.some(b => b.activityId === act.id);
      const isFull = act.bookedSeats >= act.maxSeats;
      const pct = Math.min(100, Math.round((act.bookedSeats / act.maxSeats) * 100));

      let barClass = '';
      if (pct >= 100) barClass = 'full';
      else if (pct >= 80) barClass = 'almost-full';

      let badgeClass = '';
      if (act.isKYS) badgeClass = 'kys';
      else if (act.category === 'กิจกรรมบังคับ') badgeClass = 'mandatory';

      let buttonState = `
        <button class="act-btn-book" data-id="${act.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          ลงทะเบียนเข้าร่วม
        </button>
      `;

      if (isBooked) {
        buttonState = `
          <button class="act-btn-book booked" disabled>
            ✓ ลงทะเบียนเรียบร้อยแล้ว
          </button>
        `;
      } else if (isFull) {
        buttonState = `
          <button class="act-btn-book full" disabled>
            ที่นั่งเต็มแล้ว (${act.bookedSeats}/${act.maxSeats})
          </button>
        `;
      }

      return `
        <div class="activity-item-card" data-act-id="${act.id}">
          <div class="act-card-header">
            <span class="act-badge ${badgeClass}">${act.category} [${act.code}]</span>
            <span class="act-hours-pill">+${act.hours} ชม.</span>
          </div>

          <h4 class="act-card-title">${act.title}</h4>
          <p class="act-card-desc">${act.description || ''}</p>

          <div class="act-meta-grid">
            <div class="act-meta-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>วันที่: <strong>${act.date}</strong></span>
            </div>
            <div class="act-meta-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>เวลา: ${act.time}</span>
            </div>
            <div class="act-meta-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>สถานที่: ${act.location}</span>
            </div>
          </div>

          <div class="act-seat-progress-box">
            <div class="act-seat-labels">
              <span>ที่นั่งว่างเหลือ ${act.maxSeats - act.bookedSeats} ที่</span>
              <span>${act.bookedSeats} / ${act.maxSeats} ที่นั่ง (${pct}%)</span>
            </div>
            <div class="seat-bar-wrap">
              <div class="seat-bar ${barClass}" style="width: ${pct}%"></div>
            </div>
          </div>

          ${buttonState}
        </div>
      `;
    }).join('');

    activitiesCardList.innerHTML = html;

    // Attach click handlers to book buttons
    activitiesCardList.querySelectorAll('.act-btn-book:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const actId = btn.getAttribute('data-id');
        await handleBookActivity(actId);
      });
    });
  }

  // Handle Booking
  async function handleBookActivity(activityId) {
    try {
      const payload = {
        activityId: activityId,
        studentId: state.currentStudent.id,
        studentName: state.currentStudent.name
      };

      const res = await API.bookActivity(payload);
      if (res.success) {
        showToast(`🎉 ${res.message}`, 'success');
        await refreshData();
        filterAndRenderActivities();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Handle Register with Code
  async function handleRegisterByCode() {
    const code = activityCodeInput?.value?.trim();
    if (!code) {
      showToast('กรุณากรอกรหัสกิจกรรม', 'error');
      activityCodeInput?.focus();
      return;
    }

    try {
      btnSubmitCode.disabled = true;
      btnSubmitCode.textContent = 'กำลังตรวจสอบรหัส...';

      const res = await API.registerByCode({
        code: code,
        studentId: state.currentStudent.id,
        studentName: state.currentStudent.name
      });

      if (res.success) {
        showToast(`🎉 ${res.message}`, 'success');
        activityCodeInput.value = '';
        closeModal('modal-add-code');
        await refreshData();

        // Prompt to view ticket
        setTimeout(() => {
          showTicketModal(res.data);
        }, 300);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnSubmitCode.disabled = false;
      btnSubmitCode.innerHTML = `
        <span>ยืนยันการลงทะเบียนด้วยรหัส</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      `;
    }
  }

  // ==========================================
  // 6. MY BOOKINGS LIST & E-TICKET
  // ==========================================
  function renderMyBookings() {
    if (!registeredCardsContainer) return;

    if (state.myBookings.length === 0) {
      registeredCardsContainer.innerHTML = `
        <div style="text-align: center; padding: 50px 10px; color: #94A3B8;">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 10px;">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="9"></line>
            <line x1="9" y1="13" x2="15" y2="13"></line>
          </svg>
          <h4 style="font-size: 16px; color: #475569;">ยังไม่มีกิจกรรมที่ลงทะเบียน</h4>
          <p style="font-size: 12.5px; margin-top: 6px;">คุณยังไม่ได้ลงทะเบียนเข้าร่วมกิจกรรมใดๆ ในขณะนี้</p>
          <button class="btn-primary-action" style="margin-top: 18px;" id="btn-empty-go-search">
            ค้นหากิจกรรมที่น่าสนใจ
          </button>
        </div>
      `;

      document.getElementById('btn-empty-go-search')?.addEventListener('click', () => {
        closeModal('modal-registered-list');
        openModal('modal-search-activities');
        loadAndRenderActivities();
      });
      return;
    }

    const html = state.myBookings.map(b => {
      return `
        <div class="booking-item-card" data-booking-id="${b.id}">
          <div class="booking-header">
            <span class="booking-badge-success">✓ ${b.status || 'ลงทะเบียนสำเร็จ'}</span>
            <span class="booking-code-pill">${b.activityCode || 'EVENT'}</span>
          </div>

          <h4 class="booking-title">${b.activityTitle}</h4>

          <div class="booking-info-row">
            <div>📅 วันที่: <strong>${b.date}</strong> (${b.time})</div>
            <div>📍 สถานที่: ${b.location}</div>
            <div>🎟️ ที่นั่ง: <strong style="color: var(--primary-red); font-size: 14px;">${b.seatNumber || 'A-01'}</strong> • สะสม: +${b.hours} ชม. ${b.isKYS ? '(กยศ.)' : ''}</div>
          </div>

          <div class="booking-actions">
            <button class="btn-view-ticket" data-booking-id="${b.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/></svg>
              แสดง E-Ticket (QR)
            </button>
            <button class="btn-cancel-booking" data-booking-id="${b.id}" data-title="${b.activityTitle}">
              ยกเลิก
            </button>
          </div>
        </div>
      `;
    }).join('');

    registeredCardsContainer.innerHTML = html;

    // Attach view ticket buttons
    registeredCardsContainer.querySelectorAll('.btn-view-ticket').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-booking-id');
        const booking = state.myBookings.find(b => b.id === id);
        if (booking) {
          showTicketModal(booking);
        }
      });
    });

    // Attach cancel booking buttons
    registeredCardsContainer.querySelectorAll('.btn-cancel-booking').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-booking-id');
        const title = btn.getAttribute('data-title');
        if (confirm(`คุณต้องการยกเลิกการลงทะเบียนกิจกรรม "${title}" หรือไม่?`)) {
          await handleCancelBooking(id);
        }
      });
    });
  }

  async function handleCancelBooking(bookingId) {
    try {
      const res = await API.cancelBooking(bookingId);
      if (res.success) {
        showToast(res.message, 'info');
        await refreshData();
        renderMyBookings();
        filterAndRenderActivities();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function showTicketModal(booking) {
    if (!booking) return;

    if (ticketCategory) ticketCategory.textContent = booking.isKYS ? 'กิจกรรม กยศ.' : 'กิจกรรมนักศึกษา';
    if (ticketTitle) ticketTitle.textContent = booking.activityTitle;
    if (ticketSeat) ticketSeat.textContent = booking.seatNumber || 'A-01';
    if (ticketStudentId) ticketStudentId.textContent = booking.studentId || state.currentStudent.id;
    if (ticketDate) ticketDate.textContent = booking.date;
    if (ticketTime) ticketTime.textContent = booking.time;
    if (ticketCodeStr) ticketCodeStr.textContent = booking.id || 'TICKET-2026';

    openModal('modal-ticket-view');
  }

  // ==========================================
  // 7. KYS VOLUNTEER ACTIVITIES
  // ==========================================
  function renderKysActivities() {
    const list = document.getElementById('kys-activity-list');
    if (!list) return;

    const kysItems = state.activities.filter(a => a.isKYS);
    if (kysItems.length === 0) {
      list.innerHTML = `<p style="font-size: 12px; color: #94A3B8;">ไม่มีกิจกรรม กยศ. ในขณะนี้</p>`;
      return;
    }

    list.innerHTML = kysItems.map(act => {
      const isBooked = state.myBookings.some(b => b.activityId === act.id);
      return `
        <div class="activity-item-card" style="margin-bottom: 12px;">
          <div class="act-card-header">
            <span class="act-badge kys">กยศ. [${act.code}]</span>
            <span class="act-hours-pill">+${act.hours} ชม.</span>
          </div>
          <h4 class="act-card-title">${act.title}</h4>
          <p class="act-card-desc">${act.description}</p>
          <div style="font-size: 11.5px; color: #64748B; margin-bottom: 10px;">
            📅 ${act.date} • 📍 ${act.location}
          </div>
          ${isBooked 
            ? `<button class="act-btn-book booked" disabled>✓ ลงทะเบียนแล้ว</button>`
            : `<button class="act-btn-book" onclick="window.bookFromKYS('${act.id}')">ลงทะเบียนเข้าร่วมกิจกรรม กยศ.</button>`
          }
        </div>
      `;
    }).join('');
  }

  window.bookFromKYS = async (actId) => {
    await handleBookActivity(actId);
    renderKysActivities();
  };

  // ==========================================
  // 8. HOME & NOTIFICATIONS RENDERING
  // ==========================================
  function renderHomeUpcoming() {
    const container = document.getElementById('home-upcoming-container');
    if (!container) return;

    if (state.myBookings.length === 0) {
      container.innerHTML = `
        <div style="background: #FFFFFF; border-radius: 12px; padding: 18px; text-align: center; color: #94A3B8; font-size: 13px;">
          ไม่มีกิจกรรมที่กำลังจะถึง
          <div style="margin-top: 8px;">
            <button class="btn-primary-action" style="padding: 6px 14px; font-size: 12px;" id="btn-home-quick-browse">
              เลือกจองกิจกรรม
            </button>
          </div>
        </div>
      `;
      document.getElementById('btn-home-quick-browse')?.addEventListener('click', () => {
        openModal('modal-search-activities');
        loadAndRenderActivities();
      });
      return;
    }

    const first = state.myBookings[0];
    container.innerHTML = `
      <div class="activity-item-card" style="border-left: 4px solid var(--primary-red);">
        <div class="act-card-header">
          <span class="act-badge mandatory">รายการถัดไป</span>
          <span class="booking-code-pill">${first.seatNumber}</span>
        </div>
        <h4 class="act-card-title">${first.activityTitle}</h4>
        <div class="act-meta-grid" style="margin-bottom: 8px;">
          <div class="act-meta-row">📅 วันที่: ${first.date} (${first.time})</div>
          <div class="act-meta-row">📍 ${first.location}</div>
        </div>
        <button class="btn-view-ticket" style="width: 100%;" id="btn-home-view-first-ticket">
          แสดงบัตร E-Ticket
        </button>
      </div>
    `;

    document.getElementById('btn-home-view-first-ticket')?.addEventListener('click', () => {
      showTicketModal(first);
    });
  }

  async function renderNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;

    try {
      const res = await API.getNotifications();
      if (res && res.data) {
        list.innerHTML = res.data.map(n => `
          <div class="notif-card ${n.unread ? 'unread' : ''}">
            <div class="notif-icon ${n.type}">
              ${n.type === 'event' ? '📅' : n.type === 'reminder' ? '⏰' : '✓'}
            </div>
            <div class="notif-details">
              <div class="notif-title">${n.title}</div>
              <div class="notif-time">${n.date}</div>
            </div>
          </div>
        `).join('');
      }
    } catch {
      // Keep static fallback
    }
  }

  // ==========================================
  // 9. TOAST NOTIFICATION UTILITY
  // ==========================================
  function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size: 16px;">${icon}</span>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // Run app
  init();
});
