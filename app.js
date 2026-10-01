/**
 * 043 ระบบจองสถานที่และอุปกรณ์ (Smart Venue & Equipment Booking System)
 * Comprehensive Application Logic & State Management
 */

// --- INITIAL DATA & MOCK DATABASE (มหาวิทยาลัยราชภัฏสงขลา - SKRU) ---
const initialVenues = [
  {
    id: "VN-CAMPUS01",
    type: "venue",
    category: "meeting",
    name: "ลานกิจกรรมและอาคารเฉลิมพระเกียรติ มรภ.สงขลา",
    building: "มหาวิทยาลัยราชภัฏสงขลา (SKRU Main Campus)",
    capacity: "500 คน",
    amenities: "ลานกิจกรรมกลางแจ้ง, เวทีอเนกประสงค์, ไฟส่องสว่าง, จุดเชื่อมต่อไฟฟ้า",
    status: "available",
    statusText: "พร้อมใช้งาน",
    image: "assets/skru_campus_main.jpg",
    description: "อาคารและลานกิจกรรมหลักมหาวิทยาลัยราชภัฏสงขลา สำหรับจัดนิทรรศการ งานพิธีการ และกิจกรรมนักศึกษา"
  },
  {
    id: "VN-59305",
    type: "venue",
    category: "lab",
    name: "ห้องปฏิบัติการคอมพิวเตอร์ 59-305 (มรภ.สงขลา)",
    building: "อาคาร 59 (ศูนย์ภาษาและคอมพิวเตอร์) ชั้น 3",
    capacity: "35 ที่นั่ง",
    amenities: "คอมพิวเตอร์ 30 เครื่อง, จอโปรเจคเตอร์คู่, ระบบแอร์, Wifi 6E",
    status: "available", // available, busy, maintenance
    statusText: "พร้อมใช้งาน",
    image: "assets/skru_computer_lab.jpg",
    description: "ห้องปฏิบัติการคอมพิวเตอร์สำหรับการเรียนการสอน คณะวิทยาศาสตร์ฯ และบริการนักศึกษามหาวิทยาลัยราชภัฏสงขลา"
  },
  {
    id: "VN-402",
    type: "venue",
    category: "meeting",
    name: "ห้องประชุม Smart Meeting 402 (ห้องประชุมราชพฤกษ์)",
    building: "อาคาร 60 (อาคารเฉลิมพระเกียรติ มรภ.สงขลา) ชั้น 4",
    capacity: "20 ที่นั่ง",
    amenities: "จอ Smart TV 85\", Video Conference 4K, ไมโครโฟนรอบทิศทาง",
    status: "available",
    statusText: "พร้อมใช้งาน",
    image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80",
    description: "ห้องประชุมสำหรับการประชุมคณาจารย์และสัมมนาออนไลน์ระดับมหาวิทยาลัยราชภัฏสงขลา"
  },
  {
    id: "VN-59402",
    type: "venue",
    category: "lab",
    name: "ห้องปฏิบัติการระบบเครือข่าย Cisco 59-402",
    building: "อาคาร 59 (ศูนย์ภาษาและคอมพิวเตอร์) ชั้น 4",
    capacity: "30 ที่นั่ง",
    amenities: "Cisco Routers/Switches Rack, สาย Lan Cat6, เครื่องมือวิเคราะห์",
    status: "available",
    statusText: "พร้อมใช้งาน",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    description: "ห้องแล็บเครือข่ายและระบบสารสนเทศ สาขาวิชาวิทยาการคอมพิวเตอร์ มรภ.สงขลา"
  },
  {
    id: "VN-SPT01",
    type: "venue",
    category: "sports",
    name: "สนามฟุตซอลและศูนย์กีฬาในร่ม มรภ.สงขลา",
    building: "ศูนย์ส่งเสริมสุขภาพและกีฬา มรภ.สงขลา",
    capacity: "80 คน",
    amenities: "ไฟสปอร์ตไลท์ LED, ลูกฟุตซอล, เสื้อเอี๊ยมแบ่งทีม, ห้องเปลี่ยนชุด",
    status: "busy",
    statusText: "มีการใช้งาน",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80",
    description: "สนามแข่งขันมาตรฐานรองรับกิจกรรมกีฬาและการออกกำลังกายของนักศึกษามหาวิทยาลัยราชภัฏสงขลา"
  },
  {
    id: "VN-AUD01",
    type: "venue",
    category: "meeting",
    name: "หอประชุมใหญ่ 1 มหาวิทยาลัยราชภัฏสงขลา",
    building: "อาคารหอประชุม 1 มรภ.สงขลา",
    capacity: "450 ที่นั่ง",
    amenities: "เวทีขนาดใหญ่, เครื่องเสียงระดับคอนเสิร์ต, จอ LED Full HD 300\"",
    status: "available",
    statusText: "พร้อมใช้งาน",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
    description: "หอประชุมใหญ่สำหรับพิธีไหว้ครู การปฐมนิเทศ และงานสัมมนาวิชาการระดับชาติ"
  }
];

const initialEquipment = [
  {
    id: "EQ12345",
    type: "equipment",
    category: "gear",
    name: "กล้อง Canon EOS R5 + เลนส์ 24-70mm f/2.8",
    building: "ศูนย์สื่อการสอน อาคาร 59 ชั้น 2 (มรภ.สงขลา)",
    capacity: "จำนวนคงเหลือ: 2 ชุด",
    amenities: "บอดี้กล้อง, แบตเตอรี่ 2 ก้อน, เมมโมรี่ CFexpress 128GB, กระเป๋า",
    status: "available",
    statusText: "พร้อมยืม",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
    description: "กล้อง Mirrorless ความละเอียด 45MP ถ่ายวิดีโอ 8K สำหรับงานถ่ายทำและกิจกรรมมหาวิทยาลัย"
  },
  {
    id: "EQ12346",
    type: "equipment",
    category: "gear",
    name: "Sony FX3 Cinema Line Camera",
    building: "ห้องตัดต่อโสตฯ อาคาร 59 (มรภ.สงขลา)",
    capacity: "จำนวนคงเหลือ: 1 ชุด",
    amenities: "Top Handle XLR, ไมค์ติดหัวกล้อง, แบตเตอรี่ 3 ก้อน, การ์ด V90",
    status: "available",
    statusText: "พร้อมยืม",
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80",
    description: "กล้องถ่ายภาพยนตร์ขนาดกะทัดรัด สำหรับงานสื่อสารองค์กรและสารคดีมหาวิทยาลัย"
  },
  {
    id: "EQ22019",
    type: "equipment",
    category: "gear",
    name: "โปรเจคเตอร์พกพา Epson Laser 4K",
    building: "สำนักวิทยบริการฯ อาคาร 59 ชั้น 1",
    capacity: "จำนวนคงเหลือ: 4 เครื่อง",
    amenities: "ความสว่าง 4000 Lumens, สาย HDMI 10m, รีโมทคอนโทรล, จอพับได้",
    status: "available",
    statusText: "พร้อมยืม",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    description: "โปรเจคเตอร์ความละเอียดสูงสำหรับการนำเสนองานนอกสถานที่"
  },
  {
    id: "EQ33021",
    type: "equipment",
    category: "gear",
    name: "ชุดไมโครโฟนไร้สาย DJI Mic 2 (2TX + 1RX)",
    building: "สตูดิโอดิจิทัล อาคาร 59 ชั้น 3",
    capacity: "จำนวนคงเหลือ: 3 ชุด",
    amenities: "กล่องชาร์จพกพา, ตัวแปลงโทรศัพท์ Type-C/Lightning, ฟองน้ำกันลม",
    status: "available",
    statusText: "พร้อมยืม",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
    description: "ไมโครโฟนไร้สายคุณภาพสูง ตัดเสียงรบกวนอัจฉริยะ สำหรับสัมภาษณ์และกิจกรรมนักศึกษา"
  },
  {
    id: "EQ44012",
    type: "equipment",
    category: "gear",
    name: "แว่น VR Meta Quest 3 (512GB)",
    building: "ห้องปฏิบัติการคอมพิวเตอร์ อาคาร 59",
    capacity: "จำนวนคงเหลือ: 5 ชุด",
    amenities: "Touch Plus Controllers 2 ข้าง, สายชาร์จเร็ว 45W, กล่องเคสกันกระแทก",
    status: "busy",
    statusText: "ถูกยืมแล้ว",
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=600&q=80",
    description: "อุปกรณ์แว่น Mixed Reality สำหรับโครงงานเทคโนโลยีและสื่อการสอน 3 มิติ"
  }
];

const initialBookings = [
  {
    bookingId: "BK-2026-0043",
    itemId: "EQ12345",
    itemName: "กล้อง Canon EOS R5",
    itemCode: "EQ12345",
    itemType: "equipment",
    userName: "นายเอกลักษณ์ บุญประเสริฐ",
    userId: "66043001",
    department: "คณะวิทยาศาสตร์และเทคโนโลยี",
    date: "25 ต.ค. 2569",
    timeSlot: "09:00 - 16:00 น.",
    purpose: "ถ่ายทำโครงงานและสื่อกิจกรรม มหาวิทยาลัยราชภัฏสงขลา",
    status: "approved", // approved, pending, completed, cancelled
    statusText: "อนุมัติแล้ว",
    receivedDate: "25 ต.ค. 2569",
    createdAt: "2026-10-01T08:30:00"
  },
  {
    bookingId: "BK-2026-0044",
    itemId: "VN-59305",
    itemName: "ห้องปฏิบัติการคอมพิวเตอร์ 59-305",
    itemCode: "VN-59305",
    itemType: "venue",
    userName: "อ.ดร.วิชัย ศรีสวัสดิ์",
    userId: "T-40291",
    department: "คณะวิทยาศาสตร์และเทคโนโลยี",
    date: "26 ต.ค. 2569",
    timeSlot: "13:00 - 16:00 น.",
    purpose: "สอบปฏิบัติการวิชา Database Systems อาคาร 59 มรภ.สงขลา",
    status: "approved",
    statusText: "อนุมัติแล้ว",
    receivedDate: "26 ต.ค. 2569",
    createdAt: "2026-10-01T09:15:00"
  },
  {
    bookingId: "BK-2026-0045",
    itemId: "VN-402",
    itemName: "ห้องประชุม Smart Meeting 402",
    itemCode: "VN-402",
    itemType: "venue",
    userName: "นางสาวแพรวรินทร์ สมบูรณ์",
    userId: "66043089",
    department: "คณะครุศาสตร์",
    date: "28 ต.ค. 2569",
    timeSlot: "08:30 - 11:30 น.",
    purpose: "ประชุมเตรียมงานสัปดาห์วิชาการ มรภ.สงขลา",
    status: "pending",
    statusText: "รออนุมัติ",
    receivedDate: "28 ต.ค. 2569",
    createdAt: "2026-10-01T10:00:00"
  }
];

// --- APP STATE ---
let currentMode = "venues"; // 'venues' | 'equipment'
let currentCategory = "all"; // 'all' | 'meeting' | 'lab' | 'sports' | 'gear'
let searchQuery = "";
let viewMode = "card";

let venuesData = [];
let equipmentData = [];
let bookingsData = [];

// Initialize LocalStorage Data
function initData() {
  const storedVenues = localStorage.getItem("app_venues_skru_v3");
  const storedEquipment = localStorage.getItem("app_equipment_skru_v3");
  const storedBookings = localStorage.getItem("app_bookings_skru_v3");

  venuesData = storedVenues ? JSON.parse(storedVenues) : initialVenues;
  equipmentData = storedEquipment ? JSON.parse(storedEquipment) : initialEquipment;
  bookingsData = storedBookings ? JSON.parse(storedBookings) : initialBookings;

  saveData();
}

function saveData() {
  localStorage.setItem("app_venues_skru_v3", JSON.stringify(venuesData));
  localStorage.setItem("app_equipment_skru_v3", JSON.stringify(equipmentData));
  localStorage.setItem("app_bookings_skru_v3", JSON.stringify(bookingsData));
}

// --- DOM ELEMENTS ---
const itemsContainer = document.getElementById("items-container");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const categoryPills = document.getElementById("category-pills");
const btnModeVenues = document.getElementById("mode-venues");
const btnModeEquipment = document.getElementById("mode-equipment");
const recentHistoryCard = document.getElementById("recent-history-card");
const currentClock = document.getElementById("current-clock");

// --- INITIALIZE ON DOM LOAD ---
document.addEventListener("DOMContentLoaded", () => {
  initData();
  setupEventListeners();
  updateClock();
  setInterval(updateClock, 1000);
  renderAll();
  
  // Set default booking date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  const bookDateInput = document.getElementById("book-date");
  if (bookDateInput) {
    bookDateInput.value = dateStr;
    bookDateInput.min = new Date().toISOString().split('T')[0];
  }

  // Refresh Lucide icons
  lucide.createIcons();
});

// Update Digital Clock
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  if (currentClock) {
    currentClock.textContent = `${hours}:${minutes}`;
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Search input
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    if (searchQuery.length > 0) {
      clearSearchBtn.classList.remove("hidden");
    } else {
      clearSearchBtn.classList.add("hidden");
    }
    renderItems();
  });

  // Category Pills delegation
  categoryPills.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn) return;

    document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    renderItems();
  });
}

function clearSearch() {
  searchInput.value = "";
  searchQuery = "";
  clearSearchBtn.classList.add("hidden");
  renderItems();
}

function resetFilters() {
  searchInput.value = "";
  searchQuery = "";
  clearSearchBtn.classList.add("hidden");
  currentCategory = "all";
  document.querySelectorAll(".pill").forEach((p, idx) => {
    if (idx === 0) p.classList.add("active");
    else p.classList.remove("active");
  });
  renderItems();
}

// Switch Mode (จองสถานที่ vs ยืมอุปกรณ์)
function switchMode(mode) {
  currentMode = mode;
  if (mode === "venues") {
    btnModeVenues.classList.add("active");
    btnModeEquipment.classList.remove("active");
    searchInput.placeholder = "ค้นหาห้องประชุม, อาคาร, แล็บ...";
  } else {
    btnModeEquipment.classList.add("active");
    btnModeVenues.classList.remove("active");
    searchInput.placeholder = "ค้นหากล้อง, โปรเจคเตอร์, ไมค์...";
  }
  renderItems();
  showToast(`สลับโหมด: ${mode === 'venues' ? 'จองสถานที่' : 'ยืมอุปกรณ์'} เรียบร้อยแล้ว`);
}

// Render Main Items Grid
function renderItems() {
  const dataset = currentMode === "venues" ? venuesData : equipmentData;
  
  // Filter by category & search query
  const filtered = dataset.filter(item => {
    const matchCategory = (currentCategory === "all") || (item.category === currentCategory);
    const matchSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery) ||
      item.amenities.toLowerCase().includes(searchQuery) ||
      item.building.toLowerCase().includes(searchQuery) ||
      item.id.toLowerCase().includes(searchQuery);

    return matchCategory && matchSearch;
  });

  const countText = document.getElementById("items-count-text");
  if (countText) {
    countText.textContent = `พบ ${filtered.length} รายการ (${currentMode === 'venues' ? 'สถานที่' : 'อุปกรณ์'})`;
  }

  if (filtered.length === 0) {
    itemsContainer.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  itemsContainer.innerHTML = filtered.map(item => {
    const isBusy = item.status === "busy";
    const isMaintenance = item.status === "maintenance";
    
    let badgeClass = "available";
    let badgeText = currentMode === "venues" ? "ว่าง / พร้อมจอง" : "พร้อมให้ยืม";
    
    if (isBusy) {
      badgeClass = "busy";
      badgeText = currentMode === "venues" ? "มีการใช้งานอยู่" : "ถูกยืมแล้ว";
    } else if (isMaintenance) {
      badgeClass = "maintenance";
      badgeText = "ปิดปรับปรุง";
    }

    const actionText = currentMode === "venues" ? "จองทันที" : "ยืมอุปกรณ์";
    const iconName = currentMode === "venues" ? "calendar" : "package-check";

    return `
      <div class="item-card" data-id="${item.id}">
        <div class="card-image-wrapper">
          <img src="${item.image}" alt="${item.name}" class="card-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'">
          <span class="status-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="card-content">
          <h3 class="item-title">${item.name}</h3>
          <p class="item-amenities"><strong>สิ่งอำนวยความสะดวก:</strong> ${item.amenities}</p>
          <div class="item-extra-info">
            <span><i data-lucide="map-pin" style="width:13px;height:13px;display:inline-block;vertical-align:middle;"></i> ${item.building}</span>
            <span><i data-lucide="users" style="width:13px;height:13px;display:inline-block;vertical-align:middle;"></i> ${item.capacity}</span>
          </div>
        </div>
        <button class="btn-book-action" onclick="openBookingModal('${item.id}', '${item.type}')">
          <i data-lucide="${iconName}"></i>
          <span>${actionText}</span>
        </button>
      </div>
    `;
  }).join("");

  lucide.createIcons();
}

// Render Recent Booking History Card (Reflecting reference image)
function renderRecentHistory() {
  if (!recentHistoryCard) return;

  if (bookingsData.length === 0) {
    recentHistoryCard.innerHTML = `
      <p style="color: #64748b; font-size: 0.85rem;">ยังไม่มีประวัติการจอง</p>
    `;
    return;
  }

  // Get most recent booking
  const recent = bookingsData[0];
  const isApproved = recent.status === "approved";
  const isPending = recent.status === "pending";

  let statusBadgeHtml = `<span class="history-badge approved">อนุมัติแล้ว</span>`;
  if (isPending) {
    statusBadgeHtml = `<span class="history-badge pending">รอตรวจสอบ</span>`;
  }

  recentHistoryCard.innerHTML = `
    <div class="history-card-item">
      <div class="history-item-name">${recent.itemName}</div>
      <div>รหัส (ID): ${recent.itemCode}</div>
      <div>สถานะ: ${statusBadgeHtml}</div>
      <div>วันที่รับอุปกรณ์/ใช้งาน: ${recent.date}</div>
      <div class="history-card-actions">
        <button class="btn-view-pass" onclick="viewBookingTicket('${recent.bookingId}')">
          <i data-lucide="qr-code"></i> แสดงบัตรคิว / QR Pass
        </button>
      </div>
    </div>
  `;

  lucide.createIcons();
}

// Render All Components
function renderAll() {
  renderItems();
  renderRecentHistory();
  updateUserStats();
  renderAdminRequests();
}

// --- BOOKING MODAL LOGIC ---
let activeBookingItem = null;

function openBookingModal(itemId, itemType) {
  const dataset = itemType === "venue" || (!itemType && currentMode === "venues") ? venuesData : equipmentData;
  const item = dataset.find(i => i.id === itemId) || venuesData.concat(equipmentData).find(i => i.id === itemId);

  if (!item) {
    showToast("ไม่พบข้อมูลรายการที่เลือก", "error");
    return;
  }

  activeBookingItem = item;

  document.getElementById("modal-item-title").textContent = item.type === "venue" ? "แบบฟอร์มการจองสถานที่" : "แบบฟอร์มการยืมอุปกรณ์";
  document.getElementById("book-item-id").value = item.id;
  
  // Render preview card inside modal
  const previewBox = document.getElementById("modal-preview-info");
  previewBox.innerHTML = `
    <img src="${item.image}" alt="${item.name}" class="preview-thumb">
    <div class="preview-details">
      <div class="preview-title">${item.name}</div>
      <div class="preview-sub"><i data-lucide="map-pin" style="width:12px;height:12px;display:inline;"></i> ${item.building} | ${item.capacity}</div>
    </div>
  `;

  document.getElementById("booking-modal").classList.remove("hidden");
  lucide.createIcons();
}

function closeBookingModal() {
  document.getElementById("booking-modal").classList.add("hidden");
  activeBookingItem = null;
}

function handleBookingSubmit(e) {
  e.preventDefault();

  if (!activeBookingItem) return;

  const userName = document.getElementById("book-user-name").value.trim();
  const userId = document.getElementById("book-user-id").value.trim();
  const department = document.getElementById("book-department").value;
  const rawDate = document.getElementById("book-date").value;
  const timeSlot = document.getElementById("book-time-slot").value;
  const purpose = document.getElementById("book-purpose").value.trim();

  // Format Thai Date string e.g. "25 ต.ค. 2569"
  const dateObj = new Date(rawDate);
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const thaiYear = dateObj.getFullYear() + 543;
  const formattedDate = `${dateObj.getDate()} ${thaiMonths[dateObj.getMonth()]} ${thaiYear}`;

  const newBookingId = `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newBooking = {
    bookingId: newBookingId,
    itemId: activeBookingItem.id,
    itemName: activeBookingItem.name,
    itemCode: activeBookingItem.id,
    itemType: activeBookingItem.type,
    userName: userName,
    userId: userId,
    department: department,
    date: formattedDate,
    timeSlot: timeSlot,
    purpose: purpose,
    status: "approved", // Auto-approved for great instant user experience
    statusText: "อนุมัติแล้ว",
    receivedDate: formattedDate,
    createdAt: new Date().toISOString()
  };

  // Add to top of bookings
  bookingsData.unshift(newBooking);
  saveData();

  closeBookingModal();
  renderAll();

  // Open ticket modal
  viewBookingTicket(newBooking.bookingId);
  showToast("จองสำเร็จเรียบร้อยแล้ว!", "success");
}

// --- TICKET / QR MODAL LOGIC ---
function viewBookingTicket(bookingId) {
  const booking = bookingsData.find(b => b.bookingId === bookingId);
  if (!booking) return;

  const ticketBody = document.getElementById("ticket-content-body");
  
  // Generate visual SVG QR code mockup
  const qrSvg = generateQRCodeSVG(booking.bookingId);

  ticketBody.innerHTML = `
    <div style="text-align:center; margin-bottom: 12px;">
      <div style="font-size: 1.1rem; font-weight:700; color:#0f172a;">${booking.itemName}</div>
      <div style="font-size: 0.85rem; color:#64748b;">รหัสอ้างอิง: <strong>${booking.bookingId}</strong> (รหัสสิ่งของ: ${booking.itemCode})</div>
    </div>
    
    <div class="ticket-qr-container">
      ${qrSvg}
    </div>

    <div style="display:flex; flex-direction:column; gap:6px; margin-top:10px;">
      <div><strong>ผู้จอง:</strong> ${booking.userName} (${booking.userId})</div>
      <div><strong>สังกัด:</strong> ${booking.department}</div>
      <div><strong>วันที่ใช้งาน:</strong> <span style="color:var(--primary-red); font-weight:600;">${booking.date}</span></div>
      <div><strong>ช่วงเวลา:</strong> ${booking.timeSlot}</div>
      <div><strong>วัตถุประสงค์:</strong> ${booking.purpose}</div>
      <div><strong>สถานะ:</strong> <span class="history-badge approved">อนุมัติเรียบร้อย</span></div>
    </div>
  `;

  document.getElementById("ticket-modal").classList.remove("hidden");
  lucide.createIcons();
}

function closeTicketModal() {
  document.getElementById("ticket-modal").classList.add("hidden");
}

// SVG QR Code generator
function generateQRCodeSVG(text) {
  return `
    <svg class="ticket-qr-img" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="white"/>
      <!-- QR Corners -->
      <rect x="10" y="10" width="25" height="25" fill="#1e293b"/>
      <rect x="14" y="14" width="17" height="17" fill="white"/>
      <rect x="18" y="18" width="9" height="9" fill="#e60000"/>

      <rect x="65" y="10" width="25" height="25" fill="#1e293b"/>
      <rect x="69" y="14" width="17" height="17" fill="white"/>
      <rect x="73" y="18" width="9" height="9" fill="#e60000"/>

      <rect x="10" y="65" width="25" height="25" fill="#1e293b"/>
      <rect x="14" y="69" width="17" height="17" fill="white"/>
      <rect x="18" y="73" width="9" height="9" fill="#e60000"/>

      <!-- QR Pattern Blocks -->
      <rect x="42" y="12" width="6" height="6" fill="#1e293b"/>
      <rect x="52" y="12" width="6" height="12" fill="#1e293b"/>
      <rect x="42" y="24" width="16" height="6" fill="#1e293b"/>
      <rect x="12" y="42" width="12" height="6" fill="#1e293b"/>
      <rect x="30" y="42" width="18" height="6" fill="#1e293b"/>
      <rect x="54" y="36" width="6" height="18" fill="#1e293b"/>
      <rect x="66" y="42" width="24" height="6" fill="#1e293b"/>
      <rect x="42" y="54" width="18" height="6" fill="#1e293b"/>
      <rect x="42" y="66" width="6" height="24" fill="#1e293b"/>
      <rect x="54" y="66" width="18" height="6" fill="#1e293b"/>
      <rect x="66" y="78" width="24" height="6" fill="#1e293b"/>
      <rect x="78" y="54" width="12" height="18" fill="#1e293b"/>
    </svg>
  `;
}

// --- HISTORY MODAL LOGIC ---
let historyFilter = "all";

function openAllHistoryModal() {
  filterHistory("all");
  document.getElementById("history-modal").classList.remove("hidden");
  lucide.createIcons();
}

function closeHistoryModal() {
  document.getElementById("history-modal").classList.add("hidden");
}

function filterHistory(filter) {
  historyFilter = filter;
  document.querySelectorAll(".history-tab").forEach(tab => {
    if (tab.dataset.filter === filter) tab.classList.add("active");
    else tab.classList.remove("active");
  });

  const container = document.getElementById("all-history-container");
  
  const filtered = bookingsData.filter(b => {
    if (filter === "all") return true;
    return b.status === filter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="text-align:center; padding:20px; color:#64748b;">ไม่พบรายการประวัติ</p>`;
    return;
  }

  container.innerHTML = filtered.map(b => `
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-weight:600; font-size:0.95rem;">${b.itemName}</div>
        <div style="font-size:0.8rem; color:#64748b;">รหัส: ${b.itemCode} | วันที่: ${b.date} (${b.timeSlot})</div>
        <div style="margin-top:4px;">
          <span class="history-badge ${b.status}">${b.status === 'approved' ? 'อนุมัติแล้ว' : b.status === 'pending' ? 'รออนุมัติ' : 'เสร็จสิ้น'}</span>
        </div>
      </div>
      <button class="btn-view-pass" onclick="viewBookingTicket('${b.bookingId}')">
        <i data-lucide="eye"></i> บัตรจอง
      </button>
    </div>
  `).join("");

  lucide.createIcons();
}

// --- PROFILE & SETTINGS MODAL ---
function openProfileModal() {
  updateUserStats();
  document.getElementById("profile-modal").classList.remove("hidden");
  lucide.createIcons();
}

function closeProfileModal() {
  document.getElementById("profile-modal").classList.add("hidden");
}

function updateUserStats() {
  const activeCount = bookingsData.filter(b => b.status === 'approved' || b.status === 'pending').length;
  const statActive = document.getElementById("stat-active-count");
  const statHistory = document.getElementById("stat-history-count");
  if (statActive) statActive.textContent = activeCount;
  if (statHistory) statHistory.textContent = bookingsData.length;
}

function toggleFrameView(checkbox) {
  const viewport = document.querySelector(".app-viewport");
  if (checkbox.checked) {
    viewport.classList.remove("full-width-mode");
  } else {
    viewport.classList.add("full-width-mode");
  }
}

// --- ADMIN PORTAL LOGIC ---
function openAdminModal() {
  renderAdminRequests();
  document.getElementById("admin-modal").classList.remove("hidden");
  lucide.createIcons();
}

function closeAdminModal() {
  document.getElementById("admin-modal").classList.add("hidden");
}

function renderAdminRequests() {
  const pendingBookings = bookingsData.filter(b => b.status === "pending");
  const pendingCountEl = document.getElementById("admin-pending-count");
  if (pendingCountEl) {
    pendingCountEl.textContent = `${pendingBookings.length} คำขอ`;
  }

  const listContainer = document.getElementById("admin-requests-list");
  if (!listContainer) return;

  if (pendingBookings.length === 0) {
    listContainer.innerHTML = `<p style="text-align:center; padding:20px; color:#64748b;">ไม่มีคำขอที่รอการอนุมัติในขณะนี้</p>`;
    return;
  }

  listContainer.innerHTML = pendingBookings.map(b => `
    <div class="admin-req-card">
      <div class="admin-req-info">
        <div style="font-weight:600;">${b.itemName} (${b.bookingId})</div>
        <div>ผู้ขอ: ${b.userName} (${b.department})</div>
        <div>วันที่: ${b.date} | ${b.timeSlot}</div>
        <div style="color:#64748b; font-size:0.8rem;">เหตุผล: ${b.purpose}</div>
      </div>
      <div class="admin-req-actions">
        <button class="btn-approve" onclick="approveBooking('${b.bookingId}')">อนุมัติ</button>
        <button class="btn-reject" onclick="rejectBooking('${b.bookingId}')">ปฏิเสธ</button>
      </div>
    </div>
  `).join("");
}

function approveBooking(bookingId) {
  const booking = bookingsData.find(b => b.bookingId === bookingId);
  if (booking) {
    booking.status = "approved";
    booking.statusText = "อนุมัติแล้ว";
    saveData();
    renderAll();
    renderAdminRequests();
    showToast(`อนุมัติคำขอ ${booking.bookingId} เรียบร้อยแล้ว`, "success");
  }
}

function rejectBooking(bookingId) {
  bookingsData = bookingsData.filter(b => b.bookingId !== bookingId);
  saveData();
  renderAll();
  renderAdminRequests();
  showToast(`ปฏิเสธคำขอเรียบร้อยแล้ว`);
}

// --- NAVIGATION & ACTIONS ---
function handleBack() {
  showToast("ย้อนกลับไปยังเมนูก่อนหน้า");
}

function navigateTo(target) {
  document.querySelectorAll(".bottom-nav .nav-item").forEach(item => {
    item.classList.remove("active");
  });

  if (target === "home") {
    document.querySelector(".bottom-nav .nav-item:nth-child(1)").classList.add("active");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (target === "explore") {
    document.querySelector(".bottom-nav .nav-item:nth-child(2)").classList.add("active");
    searchInput.focus();
  } else if (target === "history") {
    document.querySelector(".bottom-nav .nav-item:nth-child(4)").classList.add("active");
    openAllHistoryModal();
  } else if (target === "admin") {
    document.querySelector(".bottom-nav .nav-item:nth-child(5)").classList.add("active");
    openAdminModal();
  }
}

function openQuickBookModal() {
  // Open booking for first item
  const firstItem = currentMode === "venues" ? venuesData[0] : equipmentData[0];
  if (firstItem) {
    openBookingModal(firstItem.id, firstItem.type);
  }
}

function setViewMode(mode) {
  viewMode = mode;
  document.getElementById("btn-view-card").classList.toggle("active", mode === "card");
  document.getElementById("btn-view-list").classList.toggle("active", mode === "list");
}

// Toast Notification
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type === "success" ? "success" : ""}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" style="width:18px;height:18px;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
