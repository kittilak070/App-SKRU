/* ==========================================================
   SKRU APP - Calendar Screen Core JavaScript Logic & Interactivity
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Thai Month Names
    const THAI_MONTHS = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
        'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 
        'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

    // State Variables
    let currentDate = new Date(2026, 8, 27); // September 2026
    let selectedDate = new Date(2026, 8, 27);
    let selectedEventId = null;

    // Events Database with LocalStorage
    let eventsData = JSON.parse(localStorage.getItem('skru_events')) || [
        {
            id: 'evt-1',
            title: 'เรียนรายวิชา HCI sec 01',
            date: '2026-09-27',
            startTime: '08:30',
            endTime: '12:00',
            location: 'อาคาร Lab. คอม301',
            type: 'class',
            notes: 'การบรรยายเนื้อหา User Interface Design และ Usability Testing'
        },
        {
            id: 'evt-2',
            title: 'กิจกรรมชมรมทักษะการใช้ชีวิต',
            date: '2026-09-27',
            startTime: '16:30',
            endTime: '17:30',
            location: 'หอประชุม',
            type: 'club',
            notes: 'กิจกรรมเสริมสร้างทักษะทางสังคมและภาวะผู้นำ'
        },
        {
            id: 'evt-3',
            title: 'ส่งงานโปรเจกต์วิชา Web Programming',
            date: '2026-09-28',
            startTime: '13:00',
            endTime: '16:00',
            location: 'อาคาร 15 ชั้น 4',
            type: 'class',
            notes: 'นำเสนอผลงาน Web Application'
        },
        {
            id: 'evt-4',
            title: 'ลงทะเบียนเรียนล่าช้า ภาคเรียนที่ 1/2569',
            date: '2026-10-01',
            startTime: '08:30',
            endTime: '16:30',
            location: 'สำนักส่งเสริมวิชาการและงานทะเบียน',
            type: 'reg',
            notes: 'ยื่นคำร้องเพิ่ม-ถอนรายวิชา'
        },
        {
            id: 'evt-5',
            title: 'สอบกลางภาควิชา Software Engineering',
            date: '2026-10-12',
            startTime: '09:00',
            endTime: '12:00',
            location: 'อาคาร 15 ชั้น 4',
            type: 'exam',
            notes: 'เตรียมบัตรประจำตัวนักศึกษาเข้าห้องสอบ'
        },
        {
            id: 'evt-6',
            title: 'วันนวมินทรมหาราช (วันหยุดราชการ)',
            date: '2026-10-13',
            startTime: '00:00',
            endTime: '23:59',
            location: 'มรภ.สงขลา',
            type: 'holiday',
            notes: 'วันหยุดงดการเรียนการสอน'
        }
    ];

    // Active Category Filters
    let activeCategories = {
        class: true,
        exam: true,
        reg: true,
        holiday: true
    };

    // DOM Elements
    const datesGrid = document.getElementById('datesGrid');
    const monthYearLabel = document.getElementById('monthYearLabel');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const btnTodayReset = document.getElementById('btnTodayReset');
    const eventsListContainer = document.getElementById('eventsListContainer');
    const selectedDateHeader = document.getElementById('selectedDateHeader');
    const toastMessage = document.getElementById('toastMessage');

    // Modals
    const addEventModal = document.getElementById('addEventModal');
    const eventDetailModal = document.getElementById('eventDetailModal');
    const yearModal = document.getElementById('yearModal');
    const notificationModal = document.getElementById('notificationModal');

    // Action Triggers
    const btnAddEvent = document.getElementById('btnAddEvent');
    const btnNotificationAlert = document.getElementById('btnNotificationAlert');
    const btnOpenYearModal = document.getElementById('btnOpenYearModal');
    const btnCloseAddModal = document.getElementById('btnCloseAddModal');
    const btnCancelAdd = document.getElementById('btnCancelAdd');
    const btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
    const btnCloseDetailDone = document.getElementById('btnCloseDetailDone');
    const btnDeleteEvent = document.getElementById('btnDeleteEvent');
    const btnCloseYearModal = document.getElementById('btnCloseYearModal');
    const btnCloseYearDone = document.getElementById('btnCloseYearDone');
    const btnCloseNotiModal = document.getElementById('btnCloseNotiModal');
    const btnCloseNotiDone = document.getElementById('btnCloseNotiDone');
    const addEventForm = document.getElementById('addEventForm');
    const catFilters = document.querySelectorAll('.cat-filter');
    const navTabs = document.querySelectorAll('.nav-tab');

    // Toast Popup Helper
    function showToast(msg) {
        toastMessage.textContent = msg;
        toastMessage.classList.add('show');
        setTimeout(() => toastMessage.classList.remove('show'), 2200);
    }

    // Helper: Format YYYY-MM-DD
    function formatDateToKey(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatThaiFullDate(d) {
        const dayName = THAI_DAYS[d.getDay()];
        const dayNum = d.getDate();
        const monthName = THAI_MONTHS[d.getMonth()];
        const beYear = d.getFullYear() + 543;
        return `${dayNum} ${monthName} ${beYear}`;
    }

    function saveEventsToStorage() {
        localStorage.setItem('skru_events', JSON.stringify(eventsData));
    }

    // --- Calendar Grid Renderer ---
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const beYear = year + 543;

        monthYearLabel.textContent = `${THAI_MONTHS[month]} ${beYear}`;
        datesGrid.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        // Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
        let startingCol = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        // 1. Previous month trailing days
        for (let i = startingCol - 1; i >= 0; i--) {
            const dayNum = prevMonthDays - i;
            const dateCell = createDateCell(dayNum, true, new Date(year, month - 1, dayNum));
            datesGrid.appendChild(dateCell);
        }

        // 2. Current month days
        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const thisDate = new Date(year, month, dayNum);
            const isSelected = formatDateToKey(thisDate) === formatDateToKey(selectedDate);
            const dateCell = createDateCell(dayNum, false, thisDate, isSelected);
            datesGrid.appendChild(dateCell);
        }

        // 3. Next month leading days (Total 35 cells)
        const totalCells = startingCol + daysInMonth;
        const remainingCells = totalCells > 35 ? 42 - totalCells : 35 - totalCells;

        for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
            const dateCell = createDateCell(dayNum, true, new Date(year, month + 1, dayNum));
            datesGrid.appendChild(dateCell);
        }

        renderDailyActivities();
    }

    function createDateCell(dayNum, isOtherMonth, cellDate, isSelected = false) {
        const cell = document.createElement('div');
        cell.className = `date-cell clickable ${isOtherMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`;

        const dateNumSpan = document.createElement('span');
        dateNumSpan.className = 'date-num';
        dateNumSpan.textContent = dayNum;
        cell.appendChild(dateNumSpan);

        const dateKey = formatDateToKey(cellDate);
        const dayEvents = eventsData.filter(e => e.date === dateKey);

        if (dayEvents.length > 0) {
            const dotsRow = document.createElement('div');
            dotsRow.className = 'dots-row';
            const typesSet = new Set(dayEvents.map(e => e.type));

            typesSet.forEach(t => {
                const checkType = t === 'club' ? 'class' : t;
                if (activeCategories[checkType] !== false) {
                    const dot = document.createElement('span');
                    dot.className = `event-dot ${checkType}`;
                    dotsRow.appendChild(dot);
                }
            });

            cell.appendChild(dotsRow);
        }

        // Click handler for EVERY date cell
        cell.addEventListener('click', () => {
            selectedDate = cellDate;
            if (isOtherMonth) {
                currentDate = new Date(cellDate.getFullYear(), cellDate.getMonth(), 1);
            }
            renderCalendar();
            showToast(`เลือกวันที่ ${formatThaiFullDate(cellDate)}`);
        });

        return cell;
    }

    // --- Activities List Renderer ---
    function renderDailyActivities() {
        const selectedKey = formatDateToKey(selectedDate);
        selectedDateHeader.textContent = formatThaiFullDate(selectedDate);

        const matchedEvents = eventsData.filter(evt => {
            if (evt.date !== selectedKey) return false;
            if (evt.type === 'club') return activeCategories.class;
            return activeCategories[evt.type];
        });

        eventsListContainer.innerHTML = '';

        if (matchedEvents.length === 0) {
            eventsListContainer.innerHTML = `
                <div class="empty-events-box">
                    <p><i class="fa-regular fa-calendar-xmark"></i> ไม่มีกิจกรรมในวันที่เลือก</p>
                </div>
            `;
            return;
        }

        matchedEvents.forEach(evt => {
            const card = document.createElement('div');
            card.className = 'event-card clickable';

            let iconHtml = '<i class="fa-solid fa-book"></i>';
            let iconClass = evt.type;

            if (evt.type === 'class') iconHtml = '<i class="fa-solid fa-book-bookmark"></i>';
            else if (evt.type === 'club') iconHtml = '<i class="fa-solid fa-user-group"></i>';
            else if (evt.type === 'exam') iconHtml = '<i class="fa-solid fa-file-pen"></i>';
            else if (evt.type === 'reg') iconHtml = '<i class="fa-solid fa-clipboard-check"></i>';
            else if (evt.type === 'holiday') iconHtml = '<i class="fa-solid fa-mug-hot"></i>';

            card.innerHTML = `
                <div class="event-card-left">
                    <div class="event-icon-box ${iconClass}">
                        ${iconHtml}
                    </div>
                    <div class="event-info">
                        <span class="event-time">${evt.startTime} - ${evt.endTime} น.</span>
                        <h4>${evt.title}</h4>
                        <span class="event-location"><i class="fa-solid fa-location-dot"></i> ${evt.location}</span>
                    </div>
                </div>
                <div class="event-chevron">
                    <i class="fa-solid fa-chevron-right"></i>
                </div>
            `;

            card.addEventListener('click', () => openEventDetailModal(evt));
            eventsListContainer.appendChild(card);
        });
    }

    function openEventDetailModal(evt) {
        selectedEventId = evt.id;
        document.getElementById('detailTitle').textContent = evt.title;
        document.getElementById('detailTime').textContent = `${evt.startTime} - ${evt.endTime} น.`;
        document.getElementById('detailDateStr').textContent = `วัน${formatThaiFullDate(new Date(evt.date))}`;
        document.getElementById('detailLocation').textContent = evt.location;
        document.getElementById('detailNotes').textContent = evt.notes || 'ไม่มีรายละเอียดเพิ่มเติม';

        let typeName = 'วันเรียน';
        let badgeBg = 'var(--cat-class)';
        if (evt.type === 'exam') { typeName = 'วันสอบ'; badgeBg = 'var(--cat-exam)'; }
        else if (evt.type === 'reg') { typeName = 'วันลงทะเบียน'; badgeBg = 'var(--cat-reg)'; }
        else if (evt.type === 'holiday') { typeName = 'วันหยุด'; badgeBg = 'var(--cat-holiday)'; }
        else if (evt.type === 'club') { typeName = 'กิจกรรมชมรม'; badgeBg = 'var(--cat-club)'; }

        const typeBadge = document.getElementById('detailTypeBadge');
        typeBadge.textContent = typeName;
        typeBadge.style.backgroundColor = badgeBg;

        eventDetailModal.classList.add('active');
    }

    // --- Interactive Event Listeners ---

    // Month Navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        showToast('เปลี่ยนเดือนก่อนหน้า');
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        showToast('เปลี่ยนเดือนถัดไป');
    });

    // Reset Today
    btnTodayReset.addEventListener('click', () => {
        currentDate = new Date(2026, 8, 27);
        selectedDate = new Date(2026, 8, 27);
        renderCalendar();
        showToast('กลับสู่วันปัจจุบัน (27 ก.ย. 2569)');
    });

    monthYearLabel.addEventListener('click', () => {
        btnTodayReset.click();
    });

    // Category Filter Checks
    catFilters.forEach(chk => {
        chk.addEventListener('change', (e) => {
            activeCategories[e.target.value] = e.target.checked;
            renderCalendar();
            showToast('อัปเดตตัวกรองการแสดงผลเรียบร้อย');
        });
    });

    // Bottom Navigation Bar Tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const navTarget = tab.getAttribute('data-nav');
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (navTarget === 'calendar') {
                showToast('อยู่ที่หน้าปฏิทิน');
            } else if (navTarget === 'notifications') {
                notificationModal.classList.add('active');
            } else if (navTarget === 'home' || navTarget === 'profile') {
                showToast(`เมนู${tab.querySelector('span').textContent}เปิดใช้งานแล้ว`);
            }
        });
    });

    // Header & Title Actions
    btnNotificationAlert.addEventListener('click', () => notificationModal.classList.add('active'));
    btnOpenYearModal.addEventListener('click', () => yearModal.classList.add('active'));

    // Modal Close Actions
    btnCloseYearModal.addEventListener('click', () => yearModal.classList.remove('active'));
    btnCloseYearDone.addEventListener('click', () => yearModal.classList.remove('active'));
    btnCloseNotiModal.addEventListener('click', () => notificationModal.classList.remove('active'));
    btnCloseNotiDone.addEventListener('click', () => notificationModal.classList.remove('active'));

    // Add Event Modal Actions
    btnAddEvent.addEventListener('click', () => {
        document.getElementById('eventDate').value = formatDateToKey(selectedDate);
        addEventModal.classList.add('active');
    });

    btnCloseAddModal.addEventListener('click', () => addEventModal.classList.remove('active'));
    btnCancelAdd.addEventListener('click', () => addEventModal.classList.remove('active'));
    btnCloseDetailModal.addEventListener('click', () => eventDetailModal.classList.remove('active'));
    btnCloseDetailDone.addEventListener('click', () => eventDetailModal.classList.remove('active'));

    // Delete Event
    btnDeleteEvent.addEventListener('click', () => {
        if (selectedEventId) {
            eventsData = eventsData.filter(e => e.id !== selectedEventId);
            saveEventsToStorage();
            eventDetailModal.classList.remove('active');
            renderCalendar();
            showToast('ลบกิจกรรมเรียบร้อยแล้ว');
        }
    });

    // Form Submit New Event
    addEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEvt = {
            id: 'evt-' + Date.now(),
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            type: document.getElementById('eventType').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            location: document.getElementById('eventLocation').value,
            notes: document.getElementById('eventNotes').value
        };

        eventsData.push(newEvt);
        saveEventsToStorage();
        addEventForm.reset();
        addEventModal.classList.remove('active');

        selectedDate = new Date(newEvt.date);
        currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        renderCalendar();
        showToast('บันทึกกิจกรรมใหม่เรียบร้อยแล้ว');
    });

    // Initial Render
    renderCalendar();
});
