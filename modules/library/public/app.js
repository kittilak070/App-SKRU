// SKRU Library Web Application Frontend Logic (Full Feature Set)

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let activeCategory = 'ทั้งหมด';
  let currentUserData = null;

  // DOM Elements - Personal Hub
  const userNameText = document.getElementById('userNameText');
  const userIdText = document.getElementById('userIdText');
  const userFacultyText = document.getElementById('userFacultyText');
  const userStatusText = document.getElementById('userStatusText');
  const modalStudentId = document.getElementById('modalStudentId');
  const modalUserName = document.getElementById('modalUserName');
  const modalUserFaculty = document.getElementById('modalUserFaculty');

  const fineAlertBanner = document.getElementById('fineAlertBanner');
  const fineAmountText = document.getElementById('fineAmountText');
  const openPayFineBtn = document.getElementById('openPayFineBtn');
  const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');

  const notifBadgeCount = document.getElementById('notifBadgeCount');
  const notifListContainer = document.getElementById('notifListContainer');

  const borrowedListContainer = document.getElementById('borrowedListContainer');
  const loanCounterBadge = document.getElementById('loanCounterBadge');

  // Occupancy Elements
  const occPercentText = document.getElementById('occPercentText');
  const occStatusText = document.getElementById('occStatusText');
  const occAvailableSeats = document.getElementById('occAvailableSeats');
  const occProgressBar = document.getElementById('occProgressBar');
  const floorBreakdownList = document.getElementById('floorBreakdownList');

  // OPAC Elements
  const opacBooksContainer = document.getElementById('opacBooksContainer');
  const opacSearchInput = document.getElementById('opacSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterTabs = document.querySelectorAll('.filter-tab');

  // Digital & News Elements
  const ebooksList = document.getElementById('ebooksList');
  const irList = document.getElementById('irList');
  const externalDbList = document.getElementById('externalDbList');
  const newsContainer = document.getElementById('newsContainer');

  // Modals
  const qrModal = document.getElementById('qrModal');
  const notifModal = document.getElementById('notifModal');
  const payFineModal = document.getElementById('payFineModal');
  const shelfMapModal = document.getElementById('shelfMapModal');
  const roomModal = document.getElementById('roomModal');
  const requestModal = document.getElementById('requestModal');
  const chatModal = document.getElementById('chatModal');
  const profileModal = document.getElementById('profileModal');

  // --- INITIALIZE DATA ---
  fetchUserProfile();
  fetchBorrowedBooks();
  fetchOpacBooks();
  fetchOccupancyData();
  fetchDigitalResources();
  fetchNewsAndEvents();

  // --- 1. USER PROFILE & OFFLINE CACHING ---
  async function fetchUserProfile() {
    try {
      const res = await fetch('/api/user');
      const data = await res.json();
      if (data.success) {
        currentUserData = data.data;
        // Save to localStorage for Offline Access fallback
        localStorage.setItem('skru_user_profile', JSON.stringify(currentUserData));
        renderUserProfile(currentUserData);
      }
    } catch (err) {
      console.warn('Network offline or error fetching user profile. Using cached profile data.');
      const cached = localStorage.getItem('skru_user_profile');
      if (cached) {
        currentUserData = JSON.parse(cached);
        renderUserProfile(currentUserData);
      }
    }
  }

  function renderUserProfile(u) {
    userNameText.textContent = u.name;
    userIdText.textContent = u.studentId;
    userFacultyText.textContent = u.faculty;
    userStatusText.textContent = u.status;

    modalUserName.textContent = u.name;
    modalStudentId.textContent = u.studentId;
    modalUserFaculty.textContent = u.faculty;

    // Populate Edit Form
    document.getElementById('editName').value = u.name;
    document.getElementById('editStudentId').value = u.studentId;
    document.getElementById('editFaculty').value = u.faculty;

    // Render Fine Banner
    if (u.fineBalance > 0) {
      fineAlertBanner.style.display = 'flex';
      fineAmountText.textContent = `฿${u.fineBalance.toFixed(2)}`;
    } else {
      fineAlertBanner.style.display = 'none';
    }

    // Render Notifications
    if (u.notifications && u.notifications.length > 0) {
      const unreadCount = u.notifications.filter(n => !n.read).length;
      notifBadgeCount.textContent = unreadCount;
      notifBadgeCount.style.display = unreadCount > 0 ? 'flex' : 'none';
      renderNotifications(u.notifications);
    }
  }

  function renderNotifications(notifs) {
    notifListContainer.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.type}">
        <p class="notif-title">${escapeHtml(n.title)}</p>
        <p class="notif-msg">${escapeHtml(n.message)}</p>
        <p class="notif-time"><i class="fa-regular fa-clock"></i> ${n.date}</p>
      </div>
    `).join('');
  }

  // --- 2. BORROWED BOOKS LIST ---
  async function fetchBorrowedBooks() {
    try {
      const res = await fetch('/api/borrowed');
      const data = await res.json();
      if (data.success) {
        loanCounterBadge.textContent = `(${data.count}/${data.maxLimit})`;
        renderBorrowedList(data.data);
      }
    } catch (err) {
      console.error('Error fetching borrowed books:', err);
    }
  }

  function renderBorrowedList(books) {
    if (!books || books.length === 0) {
      borrowedListContainer.innerHTML = '<p class="empty-msg">ไม่มีรายการยืมในขณะนี้</p>';
      return;
    }

    borrowedListContainer.innerHTML = books.map(book => {
      const isOverdue = book.overdueDays > 0;
      const dueDateText = formatThaiDate(book.dueDate);
      const borrowedDateText = formatThaiDate(book.borrowedDate);

      let statusBadgeHtml = '';
      const daysLeft = Math.ceil((new Date(book.dueDate) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (book.renewed) {
        statusBadgeHtml = `<span class="renewed-badge">ยืมต่อแล้ว</span>`;
      } else if (isOverdue) {
        statusBadgeHtml = `<span class="renewed-badge" style="background:#fee2e2; color:#dc2626;">เกินกำหนด</span>`;
      } else if (daysLeft <= 3) {
        statusBadgeHtml = `<button class="renew-btn" onclick="handleRenewBook(${book.id})" title="วันที่ยืมใกล้หมดแล้ว สามารถกดยืนยันยืมต่อได้">ยืนยันยืมต่อ</button>`;
      } else {
        statusBadgeHtml = `<span class="renewed-badge" style="background:#f1f5f9; color:#94a3b8;">ยืมต่อได้เมื่อใกล้หมด</span>`;
      }

      let dateHtml = `🕒 ครบกำหนด: ${dueDateText}`;
      if (isOverdue && !book.renewed) {
        dateHtml += ` <span style="color:#d32f2f; font-weight:700;">(เกิน ${book.overdueDays} วัน)</span>`;
      }

      return `
        <div class="borrowed-card" id="borrowed-card-${book.id}">
          <div class="borrowed-left">
            <div class="book-icon-box" style="background:${book.coverBg};">
              <i class="fa-solid fa-book"></i>
            </div>
            <div class="borrowed-details">
              <h3 class="borrowed-title">${escapeHtml(book.title)}</h3>
              <p class="borrowed-date">ยืมเมื่อ: ${borrowedDateText}</p>
              <p class="due-date ${isOverdue && !book.renewed ? 'overdue' : 'normal'}">${dateHtml}</p>
            </div>
          </div>
          <div class="borrowed-right">
            ${statusBadgeHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // --- 3. REAL-TIME OCCUPANCY TRACKER ---
  async function fetchOccupancyData() {
    try {
      const res = await fetch('/api/occupancy');
      const data = await res.json();
      if (data.success) {
        const occ = data.data;
        occPercentText.textContent = `${occ.occupancyPercent}%`;
        occStatusText.textContent = occ.statusText;
        occAvailableSeats.textContent = occ.availableSeats;
        occProgressBar.style.width = `${occ.occupancyPercent}%`;

        floorBreakdownList.innerHTML = occ.floors.map(f => `
          <div class="floor-row">
            <span>${escapeHtml(f.floor)} (${f.occupied}/${f.capacity} ที่นั่ง)</span>
            <span class="floor-badge">${f.badge}</span>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error fetching occupancy data:', err);
    }
  }

  // --- 4. OPAC BOOKS SEARCH & SHELF LOCATOR ---
  async function fetchOpacBooks() {
    try {
      const query = opacSearchInput.value.trim();
      const url = `/api/books?search=${encodeURIComponent(query)}&category=${encodeURIComponent(activeCategory)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        renderOpacList(data.data);
      }
    } catch (err) {
      console.error('Error fetching OPAC books:', err);
      opacBooksContainer.innerHTML = '<p class="error-msg">ไม่สามารถโหลดรายการสืบค้นได้</p>';
    }
  }

  function renderOpacList(books) {
    if (!books || books.length === 0) {
      opacBooksContainer.innerHTML = '<p class="empty-msg">ไม่พบทรัพยากรตรงตามเงื่อนไข</p>';
      return;
    }

    opacBooksContainer.innerHTML = books.map(book => {
      let availPill = '';
      let btnHtml = '';

      if (book.status === 'available') {
        availPill = `<span class="availability-pill available">🟢 พร้อมยืม (${book.availableCount} เล่ม)</span>`;
        btnHtml = `<button class="reserve-btn" onclick="handleReserveBook(${book.id})">จองหนังสือ</button>`;
      } else if (book.status === 'borrowed') {
        const returnDate = formatThaiDate(book.dueDate);
        availPill = `<span class="availability-pill borrowed">🟠 ถูกยืมอยู่ (คืน ${returnDate})</span>`;
        btnHtml = `<button class="reserve-btn queue" onclick="handleReserveBook(${book.id})">ต่อคิวจอง</button>`;
      } else if (book.status === 'ebook') {
        availPill = `<span class="availability-pill ebook">📘 พร้อมอ่านออนไลน์</span>`;
        btnHtml = `<button class="reserve-btn" style="background:#1565c0;" onclick="showToast('กำลังเปิดไฟล์ PDF E-Book...', 'info')">อ่าน E-Book</button>`;
      }

      return `
        <div class="opac-book-card">
          <div class="book-card-main">
            <div class="book-cover-placeholder" style="background: ${book.coverBg};">
              <span>${escapeHtml(book.coverTag)}</span>
            </div>
            <div class="book-info">
              ${availPill}
              <h3 class="book-title">${escapeHtml(book.title)}</h3>
              <p class="book-author">ผู้แต่ง: ${escapeHtml(book.author)}</p>
              <p class="book-callno">เลขเรียก: ${escapeHtml(book.callNumber)} ${book.isbn ? '| ISBN: ' + book.isbn : ''}</p>
            </div>
          </div>
          <div class="book-action-row">
            <button class="shelf-map-btn" onclick="handleShowShelfMap(${book.id})">
              <i class="fa-solid fa-map-location-dot"></i> ดูชั้นวาง
            </button>
            ${btnHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // --- 5. DIGITAL RESOURCES & NEWS ---
  async function fetchDigitalResources() {
    try {
      const res = await fetch('/api/digital-resources');
      const data = await res.json();
      if (data.success) {
        const d = data.data;

        ebooksList.innerHTML = d.eBooks.map(eb => `
          <div class="link-item">
            <span>${eb.icon} ${escapeHtml(eb.title)}</span>
            <a href="${eb.link}" target="_blank" style="color:var(--accent-blue); text-decoration:none; font-weight:600;">เข้าใช้งาน <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        `).join('');

        irList.innerHTML = d.institutionalRepository.map(ir => `
          <div class="link-item">
            <div>
              <strong>${escapeHtml(ir.title)}</strong>
              <p style="font-size:10px; color:#616161;">${escapeHtml(ir.description)}</p>
            </div>
            <span class="availability-pill ebook">${ir.count}</span>
          </div>
        `).join('');

        externalDbList.innerHTML = d.externalDatabases.map(db => `
          <div class="link-item">
            <span>🌐 ${escapeHtml(db.name)}</span>
            <span class="availability-pill available">${db.badge}</span>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error fetching digital resources:', err);
    }
  }

  async function fetchNewsAndEvents() {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.success) {
        newsContainer.innerHTML = data.data.map(n => `
          <div class="news-card" style="background: ${n.bg};">
            <span class="news-cat">${escapeHtml(n.category)}</span>
            <h3 class="news-title">${escapeHtml(n.title)}</h3>
            <p class="news-date"><i class="fa-regular fa-calendar"></i> ${escapeHtml(n.date)}</p>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
    }
  }

  // --- GLOBAL HANDLERS ---
  window.handleRenewBook = async (bookId) => {
    try {
      const res = await fetch(`/api/borrowed/renew/${bookId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchBorrowedBooks();
      } else {
        showToast(data.message, 'info');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการต่ออายุ', 'error');
    }
  };

  window.handleReserveBook = async (bookId) => {
    try {
      const res = await fetch(`/api/books/reserve/${bookId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchOpacBooks();
      } else {
        showToast(data.message, 'info');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการจองหนังสือ', 'error');
    }
  };

  window.handleShowShelfMap = async (bookId) => {
    try {
      const res = await fetch(`/api/books/${bookId}`);
      const data = await res.json();
      if (data.success && data.data.shelfLocation) {
        const loc = data.data.shelfLocation;
        document.getElementById('mapBookTitle').textContent = `ตำแหน่ง: ${data.data.title}`;
        document.getElementById('mapBuilding').textContent = loc.building || 'อาคาร 24 สำนักวิทยบริการ';
        document.getElementById('mapFloor').textContent = loc.floor || 'ชั้น 3';
        document.getElementById('mapZone').textContent = loc.zone || 'หมวดทั่วไป';
        document.getElementById('mapShelfNo').textContent = `ตู้/ชั้นวาง ${loc.shelfNo || 'A-04'}`;
        document.getElementById('targetShelfPin').innerHTML = `<i class="fa-solid fa-location-dot pin-icon"></i> ${loc.shelfNo} (อยู่ตำแหน่งนี้)`;
        openModal(shelfMapModal);
      }
    } catch (err) {
      showToast('ไม่สามารถโหลดพิกัดชั้นวางได้', 'error');
    }
  };

  // PromptPay Fine Payment Confirmation
  confirmPaymentBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/user/pay-fine', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        closeModal(payFineModal);
        fetchUserProfile();
        fetchBorrowedBooks();
      }
    } catch (err) {
      showToast('ชำระเงินไม่สำเร็จ', 'error');
    }
  });

  // Action Buttons Quick Grid
  document.getElementById('btnActionCard').addEventListener('click', () => openModal(qrModal));
  document.getElementById('btnActionSearch').addEventListener('click', () => {
    document.getElementById('opacSection').scrollIntoView({ behavior: 'smooth' });
    opacSearchInput.focus();
  });
  document.getElementById('btnActionRoom').addEventListener('click', () => openModal(roomModal));
  document.getElementById('btnActionEbook').addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    const ebookTab = Array.from(filterTabs).find(t => t.getAttribute('data-category') === 'E-Book');
    if (ebookTab) ebookTab.classList.add('active');
    activeCategory = 'E-Book';
    fetchOpacBooks();
    document.getElementById('opacSection').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('btnActionMap').addEventListener('click', () => handleShowShelfMap(101));
  document.getElementById('btnActionRequest').addEventListener('click', () => openModal(requestModal));

  document.getElementById('openPayFineBtn').addEventListener('click', () => openModal(payFineModal));
  document.getElementById('openNotificationsBtn').addEventListener('click', () => {
    openModal(notifModal);
    fetch('/api/notifications/mark-read', { method: 'POST' });
    notifBadgeCount.style.display = 'none';
  });

  document.getElementById('expandQrBtn').addEventListener('click', () => openModal(qrModal));
  document.getElementById('openProfileModalBtn').addEventListener('click', () => openModal(profileModal));
  document.getElementById('fabChatBtn').addEventListener('click', () => openModal(chatModal));

  // Search Input listener
  opacSearchInput.addEventListener('input', (e) => {
    clearSearchBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
    fetchOpacBooks();
  });

  clearSearchBtn.addEventListener('click', () => {
    opacSearchInput.value = '';
    clearSearchBtn.style.display = 'none';
    fetchOpacBooks();
  });

  // Filter Tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.getAttribute('data-category');
      fetchOpacBooks();
    });
  });

  // Room Slot Chips
  document.querySelectorAll('.slot-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.slot-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Room Form Submit
  document.getElementById('roomBookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const roomId = document.getElementById('roomSelect').value;
    const date = document.getElementById('bookingDate').value;
    const memberCount = document.getElementById('memberCount').value;
    const activeSlot = document.querySelector('.slot-chip.active')?.getAttribute('data-slot') || '09:00 - 11:00';

    try {
      const res = await fetch('/api/rooms/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, timeSlot: activeSlot, date, memberCount })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        closeModal(roomModal);
      }
    } catch (err) {
      showToast('ไม่สามารถจองห้องได้', 'error');
    }
  });

  document.getElementById('simulateCheckinBtn').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/rooms/checkin', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      showToast(data.message, 'success');
      closeModal(roomModal);
    } catch (err) {
      showToast('สแกนเช็กอินไม่สำเร็จ', 'error');
    }
  });

  // Book Purchase Request Submit
  document.getElementById('bookRequestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookTitle = document.getElementById('reqTitle').value;
    const author = document.getElementById('reqAuthor').value;
    const isbn = document.getElementById('reqIsbn').value;
    const reason = document.getElementById('reqReason').value;

    try {
      const res = await fetch('/api/books/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookTitle, author, isbn, reason })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        closeModal(requestModal);
        document.getElementById('bookRequestForm').reset();
      }
    } catch (err) {
      showToast('ไม่สามารถส่งข้อเสนอซื้อได้', 'error');
    }
  });

  // Chat Form & Tags
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    sendChatMessage(msg);
    chatInput.value = '';
  });

  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => sendChatMessage(btn.getAttribute('data-msg')));
  });

  async function sendChatMessage(userMsg) {
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerHTML = `${escapeHtml(userMsg)} <span class="chat-time">${getShortTime()}</span>`;
    chatMessages.appendChild(userBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      if (data.success) {
        setTimeout(() => {
          const botBubble = document.createElement('div');
          botBubble.className = 'chat-bubble bot';
          botBubble.innerHTML = `${escapeHtml(data.reply)} <span class="chat-time">${data.timestamp}</span>`;
          chatMessages.appendChild(botBubble);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 400);
      }
    } catch (err) {
      console.error('Chat error:', err);
    }
  }

  // Profile Edit Form Submit
  document.getElementById('profileEditForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('editName').value;
    const studentId = document.getElementById('editStudentId').value;
    const faculty = document.getElementById('editFaculty').value;

    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, studentId, faculty })
      });
      const data = await res.json();
      if (data.success) {
        showToast('อัปเดตข้อมูลผู้ใช้งานเรียบร้อย', 'success');
        closeModal(profileModal);
        fetchUserProfile();
      }
    } catch (err) {
      showToast('ไม่สามารถอัปเดตข้อมูลได้', 'error');
    }
  });

  // Modal Control Functions
  function openModal(modal) { modal.classList.add('active'); }
  function closeModal(modal) { modal.classList.remove('active'); }

  document.getElementById('closeQrModal').addEventListener('click', () => closeModal(qrModal));
  document.getElementById('closeNotifModal').addEventListener('click', () => closeModal(notifModal));
  document.getElementById('closePayFineModal').addEventListener('click', () => closeModal(payFineModal));
  document.getElementById('closeShelfMapModal').addEventListener('click', () => closeModal(shelfMapModal));
  document.getElementById('closeRoomModal').addEventListener('click', () => closeModal(roomModal));
  document.getElementById('closeRequestModal').addEventListener('click', () => closeModal(requestModal));
  document.getElementById('closeChatModal').addEventListener('click', () => closeModal(chatModal));
  document.getElementById('closeProfileModal').addEventListener('click', () => closeModal(profileModal));

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  // Helper Utilities
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function formatThaiDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${parseInt(parts[2])} ${thaiMonths[parseInt(parts[1]) - 1]} ${parts[0]}`;
  }

  function getShortTime() {
    return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
