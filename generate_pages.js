const fs = require('fs');
const path = require('path');

const services = [
  {
    num: 1,
    branch: '035',
    title: 'Check-in Class',
    thaiTitle: 'เช็คชื่อเข้าชั้นเรียน',
    file: 'check-in.html',
    aliases: [],
    target: 'modules/check-in/public/index.html',
    category: 'academic',
    icon: 'fa-solid fa-clipboard-user',
    desc: 'ระบบเช็คชื่อเข้าเรียนออนไลน์ บันทึกเวลาเรียน และตรวจสอบสถานะการเข้าห้องเรียน'
  },
  {
    num: 2,
    branch: '051',
    title: 'Student Profile',
    thaiTitle: 'ข้อมูลประวัตินักศึกษา',
    file: 'student-profile.html',
    aliases: ['profile.html'],
    target: 'modules/student-profile/public/index.html',
    category: 'account',
    icon: 'fa-solid fa-id-card',
    desc: 'ดูและจัดการข้อมูลส่วนตัว ผลการลงทะเบียน และข้อมูลสถานะการเป็นนักศึกษา SKRU'
  },
  {
    num: 3,
    branch: '045',
    title: 'Tuition Fee Payment',
    thaiTitle: 'จ่ายค่าเทอมและค่าธรรมเนียม',
    file: 'tuition-fee.html',
    aliases: ['payment.html'],
    target: 'modules/tuition-fee/public/index.html',
    category: 'finance',
    icon: 'fa-solid fa-credit-card',
    desc: 'ตรวจสอบยอดค้างชำระ ชำระเงินผ่าน QR Code / Mobile Banking และพิมพ์ใบเสร็จรับเงิน'
  },
  {
    num: 4,
    branch: '028',
    title: 'Student Card',
    thaiTitle: 'บัตรประจำตัวนักศึกษาดิจิทัล',
    file: 'student-card.html',
    aliases: ['card.html'],
    target: 'modules/student-card/public/index.html',
    category: 'account',
    icon: 'fa-solid fa-address-card',
    desc: 'บัตรนักศึกษาแบบ Virtual Card พร้อม QR Code / Barcode สแกนเข้าใช้งานพื้นที่'
  },
  {
    num: 5,
    branch: '042',
    title: 'Academic Record & Advising',
    thaiTitle: 'ผลการศึกษาและคำแนะนำ',
    file: 'academic-record.html',
    aliases: ['grades.html'],
    target: 'modules/academic-record/public/index.html',
    category: 'academic',
    icon: 'fa-solid fa-graduation-cap',
    desc: 'ตรวจสอบเกรดเฉลี่ย (GPA/GPAX) แผนการเรียน และคำแนะนำทางวิชาการ'
  },
  {
    num: 6,
    branch: '032',
    title: 'Campus Map',
    thaiTitle: 'แผนที่มหาวิทยาลัย',
    file: 'campus-map.html',
    aliases: ['map.html'],
    target: 'modules/campus-map/public/index.html',
    category: 'facilities',
    icon: 'fa-solid fa-map-location-dot',
    desc: 'แผนที่นำทางอาคารเรียน สำนักงาน จุดบริการ และสิ่งอำนวยความสะดวกใน มรภ.สงขลา'
  },
  {
    num: 7,
    branch: '044',
    title: 'Student Loan (กยศ.)',
    thaiTitle: 'ระบบลงทะเบียนกู้ยืม กยศ.',
    file: 'student-loan.html',
    aliases: [],
    target: 'modules/student-loan/public/index.html',
    category: 'finance',
    icon: 'fa-solid fa-hand-holding-dollar',
    desc: 'ยื่นคำขอกู้ยืม ติดตามสถานะเอกสาร และตารางการส่งเอกสารกองทุน กยศ. / กรอ.'
  },
  {
    num: 8,
    branch: '043',
    title: 'Facility & Equipment Booking',
    thaiTitle: 'ยืมและจองอุปกรณ์/สถานที่',
    file: 'booking.html',
    aliases: ['reservation.html'],
    target: 'modules/booking/index.html',
    category: 'facilities',
    icon: 'fa-solid fa-calendar-check',
    desc: 'จองห้องประชุม ห้องแล็บคอมพิวเตอร์ สนามกีฬา และยืมคืนอุปกรณ์การศึกษา'
  },
  {
    num: 9,
    branch: '030',
    title: 'Faculty Contact',
    thaiTitle: 'ติดต่ออาจารย์ / คณะ',
    file: 'faculty-contact.html',
    aliases: ['contact.html'],
    target: 'modules/faculty-contact/public/index.html',
    category: 'academic',
    icon: 'fa-solid fa-chalkboard-user',
    desc: 'ทำนัดหมายปรึกษาอาจารย์ที่ปรึกษา ค้นหาช่องทางติดต่อและเวลาให้คำปรึกษา'
  },
  {
    num: 10,
    branch: '041',
    title: 'University News',
    thaiTitle: 'ข่าวสารในมหาวิทยาลัย',
    file: 'news.html',
    aliases: [],
    target: 'modules/news/public/index.html',
    category: 'activities',
    icon: 'fa-solid fa-newspaper',
    desc: 'อัปเดตข่าวประกาศสำคัญ ทุนการศึกษา กิจกรรมเด่น และข่าวประชาสัมพันธ์ SKRU'
  },
  {
    num: 11,
    branch: '029',
    title: 'Learning Resources',
    thaiTitle: 'แหล่งเรียนรู้และสื่อการสอน',
    file: 'learning-resources.html',
    aliases: [],
    target: 'modules/learning-resources/public/index.html',
    category: 'academic',
    icon: 'fa-solid fa-book-open-reader',
    desc: 'คลังเอกสารประกอบการสอน สื่อ e-Learning สรุปวิชาเรียน และวารสารวิชาการ'
  },
  {
    num: 12,
    branch: '039',
    title: 'Dormitory Booking',
    thaiTitle: 'จองหอพักในมหาวิทยาลัย',
    file: 'dorm-booking.html',
    aliases: [],
    target: 'modules/dorm-booking/public/index.html',
    category: 'facilities',
    icon: 'fa-solid fa-bed',
    desc: 'ระบบเลือกห้องพัก สมัครหอพักนักศึกษา ตรวจสอบค่าน้ำ-ไฟ และประกาศหอพัก'
  },
  {
    num: 13,
    branch: '046',
    title: 'Event & Activities Booking',
    thaiTitle: 'จองกิจกรรมนักศึกษา',
    file: 'event-booking.html',
    aliases: ['activities.html'],
    target: 'modules/event-booking/public/index.html',
    category: 'activities',
    icon: 'fa-solid fa-champagne-glasses',
    desc: 'ลงทะเบียนเข้าร่วมกิจกรรมเสริมหลักสูตร บันทึกชั่วโมงจิตอาสา และสะสมทรานสคริปต์กิจกรรม'
  },
  {
    num: 14,
    branch: '040',
    title: 'Privacy Settings',
    thaiTitle: 'จัดการความเป็นส่วนตัว',
    file: 'privacy-settings.html',
    aliases: ['privacy.html'],
    target: 'modules/privacy-settings/public/index.html',
    category: 'account',
    icon: 'fa-solid fa-shield-halved',
    desc: 'ตั้งค่าสิทธิ์การเข้าถึงข้อมูลส่วนบุคคล (PDPA) และความปลอดภัยของบัญชีผู้ใช้'
  },
  {
    num: 15,
    branch: '048',
    title: 'Academic Calendar',
    thaiTitle: 'ปฏิทินการศึกษา',
    file: 'academic-calendar.html',
    aliases: [],
    target: 'modules/academic-calendar/index.html',
    category: 'academic',
    icon: 'fa-solid fa-calendar-days',
    desc: 'กำหนดการเปิด-ปิดภาคเรียน กำหนดลงทะเบียน วันสอบกลางภาค/ปลายภาค และวันหยุด'
  },
  {
    num: 16,
    branch: '027',
    title: 'Login Portal',
    thaiTitle: 'เข้าสู่ระบบกลาง SKRU',
    file: 'login.html',
    aliases: [],
    target: 'modules/login/public/login.html',
    category: 'account',
    icon: 'fa-solid fa-right-to-bracket',
    desc: 'ระบบยืนยันตัวตนกลาง (Single Sign-On) เข้าสู่บริการดิจิทัลทั้งหมดของมหาวิทยาลัย'
  },
  {
    num: 17,
    branch: '049',
    title: 'System Settings',
    thaiTitle: 'ตั้งค่าระบบ',
    file: 'settings.html',
    aliases: [],
    target: 'modules/settings/public/index.html',
    category: 'account',
    icon: 'fa-solid fa-gear',
    desc: 'ปรับแต่งการแจ้งเตือน ธีมหน้าจอ ภาษา และการเชื่อมโยงบริการภายนอก'
  },
  {
    num: 18,
    branch: '033',
    title: 'Vote & Survey',
    thaiTitle: 'ระบบโหวต / สำรวจความคิดเห็น',
    file: 'vote.html',
    aliases: [],
    target: 'modules/vote/public/index.html',
    category: 'activities',
    icon: 'fa-solid fa-check-to-slot',
    desc: 'ลงคะแนนเลือกตั้งสโมสรนักศึกษา โหวตกิจกรรม และทำแบบสำรวจความพึงพอใจ'
  },
  {
    num: 19,
    branch: '050',
    title: 'Rewards & Privilege',
    thaiTitle: 'แลกของรางวัลและสิทธิพิเศษ',
    file: 'rewards.html',
    aliases: ['redeem.html'],
    target: 'modules/rewards/public/index.html',
    category: 'activities',
    icon: 'fa-solid fa-gift',
    desc: 'ใช้คะแนนสะสมจากการเข้าร่วมกิจกรรม แลกคูปอง ส่วนลด และของที่ระลึก SKRU'
  },
  {
    num: 20,
    branch: '047',
    title: 'Library System',
    thaiTitle: 'ห้องสมุดและยืม-คืนหนังสือ',
    file: 'library.html',
    aliases: [],
    target: 'modules/library/public/index.html',
    category: 'facilities',
    icon: 'fa-solid fa-lines-leaning',
    desc: 'ค้นหาหนังสือและสิ่งพิมพ์ ยืม-คืนหนังสือดิจิทัล และเข้าถึงฐานข้อมูลวิจัย'
  }
];

// Helper to create wrapper template
function createPageHtml(currentService) {
  const optionsHtml = services.map(s => {
    const isSelected = s.file === currentService.file ? 'selected' : '';
    return `<option value="${s.file}" ${isSelected}>[${s.branch}] ${s.thaiTitle} (${s.title})</option>`;
  }).join('\n            ');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentService.thaiTitle} (${currentService.title}) | SKRU Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Prompt', sans-serif;
      background: #0f172a;
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .portal-nav {
      height: 54px;
      background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      color: white;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .portal-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: white;
      cursor: pointer;
    }
    .portal-logo {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(59,130,246,0.4);
    }
    .portal-title {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .portal-title small {
      font-size: 0.75rem;
      font-weight: 400;
      opacity: 0.75;
      display: block;
      margin-top: -2px;
    }
    .current-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
    }
    .branch-tag {
      background: #3b82f6;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .portal-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .service-select {
      background: #1e293b;
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
      padding: 6px 12px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.85rem;
      outline: none;
      cursor: pointer;
      max-width: 320px;
    }
    .service-select:focus {
      border-color: #3b82f6;
    }
    .btn-nav {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: white;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-nav:hover {
      background: rgba(255,255,255,0.18);
    }
    .btn-nav-primary {
      background: #3b82f6;
      border-color: #2563eb;
    }
    .btn-nav-primary:hover {
      background: #2563eb;
    }
    .frame-container {
      flex: 1;
      width: 100%;
      height: calc(100vh - 54px);
      position: relative;
    }
    .app-frame {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
      display: block;
    }
  </style>
</head>
<body>
  <!-- Top Navigation Hub -->
  <header class="portal-nav">
    <a href="index.html" class="portal-brand" title="กลับหน้าหลักรวมบริการ">
      <div class="portal-logo"><i class="fa-solid fa-graduation-cap"></i></div>
      <div class="portal-title">
        SKRU PORTAL
        <small>มหาวิทยาลัยราชภัฏสงขลา</small>
      </div>
    </a>

    <div class="current-badge">
      <span class="branch-tag">Branch ${currentService.branch}</span>
      <i class="${currentService.icon}"></i>
      <strong>${currentService.thaiTitle}</strong>
    </div>

    <div class="portal-controls">
      <label for="pageSwitcher" style="font-size: 0.8rem; opacity: 0.7;">สลับหน้า:</label>
      <select id="pageSwitcher" class="service-select" onchange="location.href=this.value">
        ${optionsHtml}
      </select>
      <a href="${currentService.target}" target="_blank" class="btn-nav" title="เปิดหน้าเว็บตรงแบบไม่มีแถบเมนู">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> เปิดตรง
      </a>
      <a href="index.html" class="btn-nav btn-nav-primary" title="กลับหน้าแรก">
        <i class="fa-solid fa-house"></i> หน้าแรก
      </a>
    </div>
  </header>

  <!-- Module Frame -->
  <main class="frame-container">
    <iframe src="${currentService.target}" class="app-frame" id="contentFrame" title="${currentService.thaiTitle}"></iframe>
  </main>
</body>
</html>
`;
}

// Generate all requested HTML files + aliases in root
for (const service of services) {
  const htmlContent = createPageHtml(service);
  const primaryPath = path.join(__dirname, service.file);
  fs.writeFileSync(primaryPath, htmlContent, 'utf8');
  console.log(`Generated: ${service.file}`);

  for (const alias of service.aliases) {
    const aliasPath = path.join(__dirname, alias);
    fs.writeFileSync(aliasPath, htmlContent, 'utf8');
    console.log(`Generated alias: ${alias} -> ${service.file}`);
  }
}

console.log('All 20 requested root HTML files generated successfully!');
