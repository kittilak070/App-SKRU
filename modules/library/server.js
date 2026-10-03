const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Date Helpers ──────────────────────────────────────────────
function getToday() {
  return new Date().toISOString().split('T')[0];
}
function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function calcDaysLeft(dueDateStr) {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

// ── User Profile State ────────────────────────────────────────
let userData = {
  name: "กัญญาพัชร วงศ์สว่าง",
  studentId: "651234567",
  faculty: "คณะวิทยาการจัดการ",
  status: "ปกติ",
  maxLoans: 5,
  fineBalance: 25.00,
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
};

// ── Full OPAC Books Database ──────────────────────────────────
let booksData = [
  {
    id: 'B001',
    title: 'วิทยาการข้อมูลและการเรียนรู้ของเครื่อง (Data Science & Machine Learning)',
    author: 'ผศ.ดร. สมชาย ใจดี (2567)',
    callNumber: 'QA76.9.D343 S67 2567',
    isbn: '978-616-12-3456-7',
    location: 'ชั้น 3 อาคารบรรณราชนครินทร์ (หมวด QA)',
    shelfNo: 'A-04',
    floor: 'ชั้น 3',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'available',
    category: 'book',
    availableCount: 3,
    totalCount: 5,
    coverTag: 'Data Science',
    description: 'เนื้อหาครอบคลุมหลักการ Data Science, Data Preprocessing, Machine Learning Algorithms, Python สำหรับการวิเคราะห์ข้อมูลเชิงลึก'
  },
  {
    id: 'B002',
    title: 'การพัฒนาการท่องเที่ยวเชิงวัฒนธรรมสงขลา',
    author: 'ดร. นภาพร สุวรรณ (2567)',
    callNumber: 'SKRU IR Repository - SKRU-IR-2567-08',
    isbn: 'SKRU-IR-2567-08',
    location: 'ชั้น 4 โซนคลังปริญญานิพนธ์และงานวิจัย',
    shelfNo: 'SKRU-IR-02',
    floor: 'ชั้น 4',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'borrowed',
    returnDate: addDays(2),
    category: 'research',
    availableCount: 0,
    totalCount: 2,
    coverTag: 'SKRU Research',
    description: 'งานวิจัยเพื่อการพัฒนาเส้นทางท่องเที่ยววัฒนธรรมเมืองเก่าสงขลา และนวัตกรรมการท่องเที่ยวชุมชนท้องถิ่น'
  },
  {
    id: 'B003',
    title: 'การพัฒนาเว็บแอปพลิเคชันด้วย React & Node.js',
    author: 'อ.อนันต์ สุขสวัสดิ์ (2568)',
    callNumber: 'QA76.76 .อ54 2568',
    isbn: '978-616-99-8877-1',
    location: 'คลังทรัพยากรดิจิทัล SKRU e-Book System',
    shelfNo: 'ONLINE',
    floor: 'ออนไลน์',
    building: 'คลัง e-Book',
    status: 'available',
    category: 'ebook',
    availableCount: 99,
    totalCount: 99,
    coverTag: 'React JS',
    description: 'คู่มือการสร้าง Full-Stack Web Application ด้วย React, Node.js, Express และ RESTful APIs สมัยใหม่'
  },
  {
    id: 'B004',
    title: 'หลักการตลาดดิจิทัลยุค 5.0 (Digital Marketing 5.0)',
    author: 'ดร. ศิริพร กิจเจริญ (2567)',
    callNumber: 'HF5415 .ศ68 2567',
    isbn: '978-616-55-9876-5',
    location: 'ชั้น 2 (หมวด HF การตลาด)',
    shelfNo: 'B-12',
    floor: 'ชั้น 2',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'borrowed',
    returnDate: addDays(3),
    category: 'book',
    availableCount: 2,
    totalCount: 4,
    coverTag: 'Marketing',
    description: 'กลยุทธ์การตลาดดิจิทัล การประยุกต์ใช้ AI ในการทำการตลาด การสร้างแบรนด์บนสื่อโซเชียลมีเดีย'
  },
  {
    id: 'B005',
    title: 'การโปรแกรมด้วย JavaScript และ Node.js สำหรับเว็บแอปพลิเคชัน',
    author: 'อ. วิชัย ทรงเดช (2568)',
    callNumber: 'QA76.73.J39 ว58 2568',
    isbn: '978-616-44-3322-1',
    location: 'คลังทรัพยากรดิจิทัล SKRU e-Book System',
    shelfNo: 'ONLINE',
    floor: 'ออนไลน์',
    building: 'คลัง e-Book',
    status: 'available',
    category: 'ebook',
    availableCount: 99,
    totalCount: 99,
    coverTag: 'Node.js',
    description: 'หนังสือเรียนอิเล็กทรอนิกส์เจาะลึกไวยากรณ์ ES6+, Async/Await, Express Framework และการเชื่อมต่อฐานข้อมูล'
  },
  {
    id: 'B006',
    title: 'โครงสร้างข้อมูลและอัลกอริทึมสมัยใหม่ (Data Structures & Algorithms)',
    author: 'ดร. สมศักดิ์ กิจเจริญ (2566)',
    callNumber: 'QA76.9.D35 ส42 2566',
    isbn: '978-616-11-2233-4',
    location: 'ชั้น 3 (หมวด QA คอมพิวเตอร์และเทคโนโลยี)',
    shelfNo: 'A-09',
    floor: 'ชั้น 3',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'available',
    category: 'book',
    availableCount: 4,
    totalCount: 5,
    coverTag: 'Data Struct',
    description: 'หลักการโครงสร้างข้อมูล Array, Linked List, Stack, Queue, Tree, Graph และการวิเคราะห์ Algorithm Complexity (Big O Notation)'
  },
  {
    id: 'B007',
    title: 'วารสารวิทยบริการ มหาวิทยาลัยราชภัฏสงขลา ปีที่ 15 ฉบับที่ 2',
    author: 'กองบรรณาธิการ สำนักวิทยบริการฯ มรภ.สงขลา (2568)',
    callNumber: 'JO-SKRU-2568-2',
    isbn: 'ISSN-1905-789X',
    location: 'ชั้น 1 มุมวารสารและสิ่งพิมพ์ต่อเนื่อง',
    shelfNo: 'J-01',
    floor: 'ชั้น 1',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'available',
    category: 'research',
    availableCount: 5,
    totalCount: 5,
    coverTag: 'วารสาร SKRU',
    description: 'รวมบทความวิจัยและบทความวิชาการสาขามนุษยศาสตร์ สังคมศาสตร์ วิทยาศาสตร์และเทคโนโลยี ประจำปี 2568'
  },
  {
    id: 'B008',
    title: 'ระบบสารสนเทศเพื่อการจัดการห้องสมุดสถาบันอุดมศึกษา',
    author: 'ปริญญานิพนธ์ สำนักวิทยบริการฯ มรภ.สงขลา (2566)',
    callNumber: 'TH-SKRU-2566-04',
    isbn: 'TH-SKRU-2566-04',
    location: 'ชั้น 4 หอจดหมายเหตุและคลังปริญญานิพนธ์',
    shelfNo: 'TH-04',
    floor: 'ชั้น 4',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'available',
    category: 'research',
    availableCount: 2,
    totalCount: 2,
    coverTag: 'ปริญญานิพนธ์',
    description: 'งานวิจัยออกแบบและพัฒนาระบบเทคโนโลยีสารสนเทศเพื่อการบริหารจัดการห้องสมุดสถาบันอุดมศึกษา'
  },
  {
    id: 'B009',
    title: 'การบัญชีบริหารและการวิเคราะห์งบการเงินสมัยใหม่',
    author: 'รศ.ดร. สุภาพร มณีรัตน์ (2568)',
    callNumber: 'HF5686 .ส74 2568',
    isbn: '978-616-23-4567-8',
    location: 'ชั้น 2 (หมวด HF การบัญชีและการเงิน)',
    shelfNo: 'B-05',
    floor: 'ชั้น 2',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'available',
    category: 'book',
    availableCount: 4,
    totalCount: 6,
    coverTag: 'Accounting',
    description: 'ครอบคลุมหลักการบัญชีบริหาร การวิเคราะห์อัตราส่วนทางการเงิน งบการเงิน และการตัดสินใจเชิงกลยุทธ์ทางธุรกิจ'
  },
  {
    id: 'B010',
    title: 'จิตวิทยาการเรียนรู้และพัฒนาการมนุษย์',
    author: 'ผศ. นันทิยา พิมพ์สวรรค์ (2567)',
    callNumber: 'BF318 .น64 2567',
    isbn: '978-616-77-5544-2',
    location: 'ชั้น 2 (หมวด BF จิตวิทยา)',
    shelfNo: 'B-18',
    floor: 'ชั้น 2',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'borrowed',
    returnDate: addDays(9),
    category: 'book',
    availableCount: 1,
    totalCount: 4,
    coverTag: 'Psychology',
    description: 'ทฤษฎีการเรียนรู้แบบต่างๆ พัฒนาการทางจิตวิทยา แรงจูงใจ และการประยุกต์ใช้ในการเรียนการสอนระดับอุดมศึกษา'
  },
  {
    id: 'B011',
    title: 'ภาษาไทยเพื่อการสื่อสารในยุคดิจิทัล',
    author: 'อ. ดร. รัชนี สมบูรณ์ศิลป์ (2568)',
    callNumber: 'PL4158 .ร63 2568',
    isbn: '978-616-88-1122-9',
    location: 'คลังทรัพยากรดิจิทัล SKRU e-Book System',
    shelfNo: 'ONLINE',
    floor: 'ออนไลน์',
    building: 'คลัง e-Book',
    status: 'available',
    category: 'ebook',
    availableCount: 99,
    totalCount: 99,
    coverTag: 'Thai Lang',
    description: 'ภาษาไทยในบริบทสื่อดิจิทัล การเขียนเชิงสร้างสรรค์ การสื่อสารผ่านโซเชียลมีเดีย และการใช้ภาษาไทยอย่างถูกต้องในยุคใหม่'
  },
  {
    id: 'B012',
    title: 'ชีววิทยาทางทะเลอ่าวไทยและความหลากหลายทางชีวภาพ',
    author: 'ดร. ประวิทย์ ทะเลสงขลา และคณะ (2567)',
    callNumber: 'QH91.8 .ป46 2567',
    isbn: 'SKRU-IR-2567-22',
    location: 'ชั้น 4 โซนงานวิจัยและคลังปริญญานิพนธ์',
    shelfNo: 'TH-11',
    floor: 'ชั้น 4',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'available',
    category: 'research',
    availableCount: 3,
    totalCount: 3,
    coverTag: 'Marine Bio',
    description: 'งานวิจัยความหลากหลายทางชีวภาพของระบบนิเวศทางทะเลอ่าวไทยตอนล่าง ปะการัง หญ้าทะเล และสัตว์ทะเลหายาก บริเวณจังหวัดสงขลา'
  },
  {
    id: 'B013',
    title: 'จริยธรรม AI และปัญญาประดิษฐ์เพื่อสังคมที่ยั่งยืน',
    author: 'รศ.ดร. กิตติพงษ์ นวัตกรรม (2568)',
    callNumber: 'Q335 .ก68 2568',
    isbn: '978-616-90-3344-7',
    location: 'คลังทรัพยากรดิจิทัล SKRU e-Book System',
    shelfNo: 'ONLINE',
    floor: 'ออนไลน์',
    building: 'คลัง e-Book',
    status: 'available',
    category: 'ebook',
    availableCount: 99,
    totalCount: 99,
    coverTag: 'AI Ethics',
    description: 'ประเด็นจริยธรรมในการพัฒนาและใช้งาน AI, Bias ใน Algorithm, ความเป็นส่วนตัวข้อมูล และกรอบนโยบาย AI Governance ระดับสากล'
  },
  {
    id: 'B014',
    title: 'การออกแบบระบบคลาวด์และสถาปัตยกรรม Microservices',
    author: 'ดร. ธนกฤต เมฆาสกุล (2568)',
    callNumber: 'QA76.585 .ธ35 2568',
    isbn: '978-616-43-1288-9',
    location: 'ชั้น 3 (หมวด QA คอมพิวเตอร์)',
    shelfNo: 'A-05',
    floor: 'ชั้น 3',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'available',
    category: 'book',
    availableCount: 2,
    totalCount: 3,
    coverTag: 'Cloud & MS',
    description: 'หลักการออกแบบ Cloud Architecture, Docker, Kubernetes, CI/CD Pipeline และการสร้าง Microservices ที่รองรับ High Scalability'
  },
  {
    id: 'B015',
    title: 'การเงินส่วนบุคคลและการลงทุนในสินทรัพย์ดิจิทัล (Personal Finance & Digital Assets)',
    author: 'ผศ.ดร. อัมพร พงษ์ไพศาล (2567)',
    callNumber: 'HG179 .อ45 2567',
    isbn: '978-616-78-9012-3',
    location: 'ชั้น 2 (หมวด HG การเงินการธนาคาร)',
    shelfNo: 'B-08',
    floor: 'ชั้น 2',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'available',
    category: 'book',
    availableCount: 3,
    totalCount: 4,
    coverTag: 'Finance',
    description: 'คู่มือบริหารจัดการเงิน การวางแผนภาษี การออม และการลงทุนในกองทุนรวม หุ้น และสินทรัพย์ดิจิทัลสำหรับนักศึกษาและบุคคลทั่วไป'
  },
  {
    id: 'B016',
    title: 'Cybersecurity Essentials: ความมั่นคงปลอดภัยไซเบอร์ภาคปฏิบัติ',
    author: 'อ. กิตติพงษ์ เทคโนโลยี (2568)',
    callNumber: 'QA76.9.A25 ก58 2568',
    isbn: '978-616-89-4455-2',
    location: 'คลังทรัพยากรดิจิทัล SKRU e-Book System',
    shelfNo: 'ONLINE',
    floor: 'ออนไลน์',
    building: 'คลัง e-Book',
    status: 'available',
    category: 'ebook',
    availableCount: 99,
    totalCount: 99,
    coverTag: 'Security',
    description: 'พื้นฐานระบบความปลอดภัยทางไซเบอร์ เทคนิคป้องกัน Network Attack, การเข้ารหัสข้อมูล, และมาตรฐานความปลอดภัยสารสนเทศ ISO/IEC 27001'
  },
  {
    id: 'B017',
    title: 'นวัตกรรมเศรษฐกิจสร้างสรรค์ชุมชนลุ่มน้ำทะเลสาบสงขลา',
    author: 'ผศ. วรรณภา สุวรรณรัตน์ และคณะวิจัย (2567)',
    callNumber: 'SKRU-IR-2567-35',
    isbn: 'SKRU-IR-2567-35',
    location: 'ชั้น 4 โซนคลังปริญญานิพนธ์และงานวิจัยท้องถิ่น',
    shelfNo: 'SKRU-IR-05',
    floor: 'ชั้น 4',
    building: 'อาคารบรรณราชนครินทร์',
    status: 'available',
    category: 'research',
    availableCount: 2,
    totalCount: 2,
    coverTag: 'สงขลาวิจัย',
    description: 'งานวิจัยเชิงปฏิบัติการในการต่อยอดภูมิปัญญาท้องถิ่นสู่ผลิตภัณฑ์สร้างสรรค์ และการยกระดับเศรษฐกิจชุมชนรอบทะเลสาบสงขลา'
  },
  {
    id: 'B018',
    title: 'ปัญญาประดิษฐ์เชิงสร้างสรรค์และการประยุกต์ใช้ในธุรกิจ (Generative AI in Business)',
    author: 'ดร. ภาคภูมิ ศิริโรจน์ (2568)',
    callNumber: 'HF5548.2 .ภ34 2568',
    isbn: '978-616-95-1234-5',
    location: 'คลังทรัพยากรดิจิทัล SKRU e-Book System',
    shelfNo: 'ONLINE',
    floor: 'ออนไลน์',
    building: 'คลัง e-Book',
    status: 'available',
    category: 'ebook',
    availableCount: 99,
    totalCount: 99,
    coverTag: 'Gen AI',
    description: 'การนำเทคโนโลยี Generative AI เช่น LLM, Prompt Engineering และ Diffusion Models มาเพิ่มประสิทธิภาพการทำงานและสร้างโมเดลธุรกิจใหม่'
  }
];

// ── Current Borrowed Items (daysLeft calculated dynamically) ──
let borrowingsData = [
  {
    id: 'B004',
    title: 'หลักการตลาดดิจิทัลยุค 5.0',
    borrowedDate: addDays(-21),
    dueDate: addDays(3),
    renewed: false,
    coverColor: 'bg-red-100 text-skruRed'
  },
  {
    id: 'B014',
    title: 'การออกแบบระบบคลาวด์และสถาปัตยกรรม Microservices',
    borrowedDate: addDays(-3),
    dueDate: addDays(11),
    renewed: false,
    coverColor: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'B003',
    title: 'พัฒนาเว็บด้วย React & Node.js',
    borrowedDate: addDays(-16),
    dueDate: addDays(14),
    renewed: true,
    coverColor: 'bg-slate-200 text-slate-600'
  }
];

// ── Book Purchase Requests Storage ────────────────────────────
let bookRequestsData = [];

// ── Occupancy Data ────────────────────────────────────────────
let occupancyData = {
  status: 'online',
  libraryOpen: true,
  hours: '08:00 - 20:00',
  occupancy: { current: 240, max: 350, percentage: 68 }
};

// ─────────────────────────────────────────────────────────────
//  API V1 ENDPOINTS
// ─────────────────────────────────────────────────────────────

// 1. Books OPAC Catalog
app.get('/api/v1/books', (req, res) => {
  const { category, search } = req.query;
  let results = booksData;

  if (category && category !== 'all') {
    results = results.filter(b => b.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.callNumber.toLowerCase().includes(q) ||
      (b.isbn && b.isbn.toLowerCase().includes(q))
    );
  }

  res.json({ status: 200, data: { success: true, total: results.length, data: results } });
});

app.get('/api/v1/books/:id', (req, res) => {
  const book = booksData.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ status: 404, data: { error: 'ไม่พบหนังสือ' } });
  res.json({ status: 200, data: book });
});

// Hold / Queue Reservation
app.post('/api/v1/books/hold/:id', (req, res) => {
  const book = booksData.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ status: 404, data: { success: false, message: 'ไม่พบหนังสือ' } });
  res.json({
    status: 200,
    data: { success: true, message: `ลงชื่อต่อคิวจองหนังสือ "${book.title}" เรียบร้อยแล้ว ระบบจะแจ้งเตือนเมื่อหนังสือพร้อมยืมค่ะ` }
  });
});

// Book Purchase Request (previously missing!)
app.post('/api/v1/books/request', (req, res) => {
  const { title, author, reason } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ status: 400, data: { success: false, message: 'กรุณาระบุชื่อหนังสือที่ต้องการเสนอซื้อ' } });
  }
  const request = {
    id: 'REQ-' + Date.now(),
    title: title.trim(),
    author: (author || '').trim() || '-',
    reason: (reason || '').trim() || '-',
    requestedBy: userData.studentId,
    requestedAt: getToday(),
    status: 'pending'
  };
  bookRequestsData.push(request);
  res.json({
    status: 200,
    data: {
      success: true,
      message: `ส่งคำขอซื้อหนังสือ "${title.trim()}" เรียบร้อยแล้ว! ทีมบรรณารักษ์จะพิจารณาภายใน 7-14 วันทำการค่ะ`,
      requestId: request.id
    }
  });
});

// 2. Borrowings API (daysLeft calculated dynamically on every request)
app.get('/api/v1/borrowings', (req, res) => {
  const enriched = borrowingsData.map(item => ({
    ...item,
    daysLeft: calcDaysLeft(item.dueDate)
  }));
  res.json({
    status: 200,
    data: { success: true, count: borrowingsData.length, maxLoans: userData.maxLoans, data: enriched }
  });
});

app.post('/api/v1/borrowings/borrow/:id', (req, res) => {
  const bookId = req.params.id;
  const book = booksData.find(b => b.id === bookId);

  if (!book) return res.status(404).json({ status: 404, data: { success: false, message: 'ไม่พบหนังสือ' } });
  if (borrowingsData.length >= userData.maxLoans) {
    return res.status(400).json({ status: 400, data: { success: false, message: `ยืมหนังสือครบโควตา ${userData.maxLoans} เล่มแล้ว ไม่สามารถยืมเพิ่มได้` } });
  }
  if (borrowingsData.some(b => b.id === bookId)) {
    return res.status(400).json({ status: 400, data: { success: false, message: 'คุณกำลังยืมหนังสือเล่มนี้อยู่แล้ว' } });
  }
  if (book.availableCount <= 0 && book.category !== 'ebook') {
    return res.status(400).json({ status: 400, data: { success: false, message: 'หนังสือเล่มนี้ไม่มีสำรองให้ยืมขณะนี้' } });
  }

  const dueDate = addDays(14);
  book.status = 'borrowed';
  book.returnDate = dueDate;
  if (book.availableCount > 0 && book.category !== 'ebook') book.availableCount -= 1;

  const newItem = {
    id: book.id,
    title: book.title,
    borrowedDate: getToday(),
    dueDate: dueDate,
    renewed: false,
    coverColor: 'bg-red-100 text-skruRed'
  };
  borrowingsData.push(newItem);

  res.json({
    status: 200,
    data: {
      success: true,
      message: `✅ ยืมหนังสือ "${book.title}" เรียบร้อยแล้ว! กำหนดคืนวันที่ ${dueDate}`,
      count: borrowingsData.length,
      maxLoans: userData.maxLoans,
      data: borrowingsData
    }
  });
});

app.post('/api/v1/borrowings/renew', (req, res) => {
  const { bookId } = req.body;
  const item = borrowingsData.find(b => b.id === bookId);

  if (!item) return res.status(404).json({ status: 404, data: { success: false, message: 'ไม่พบรายการยืมนี้' } });
  if (item.renewed) return res.status(400).json({ status: 400, data: { success: false, message: 'หนังสือเล่มนี้ยืมต่อไปแล้ว 1 ครั้ง ไม่สามารถยืมต่อได้อีก' } });

  const daysLeft = calcDaysLeft(item.dueDate);
  if (daysLeft > 3) {
    return res.status(400).json({
      status: 400,
      data: {
        success: false,
        message: `สามารถยืมต่อได้เมื่อใกล้ถึงกำหนดคืนเท่านั้น (เหลือ 3 วันหรือน้อยกว่า, ปัจจุบันเหลืออีก ${daysLeft} วัน)`
      }
    });
  }
  if (daysLeft < 0) {
    return res.status(400).json({
      status: 400,
      data: {
        success: false,
        message: 'หนังสือเกินกำหนดส่งคืนแล้ว ไม่สามารถยืมต่อได้ กรุณานำส่งคืนที่เคาน์เตอร์ห้องสมุดและชำระค่าปรับ'
      }
    });
  }

  const newDue = addDays(14);
  item.renewed = true;
  item.dueDate = newDue;

  res.json({
    status: 200,
    data: {
      success: true,
      message: `ต่ออายุการยืม "${item.title}" เรียบร้อยแล้ว (กำหนดคืนใหม่: ${newDue})`,
      bookId,
      newDueDate: newDue
    }
  });
});

app.post('/api/borrowed/renew/:id', (req, res) => {
  const bookId = req.params.id;
  const item = borrowingsData.find(b => b.id === bookId);

  if (!item) return res.status(404).json({ success: false, message: 'ไม่พบรายการยืมนี้' });
  if (item.renewed) return res.status(400).json({ success: false, message: 'หนังสือเล่มนี้ยืมต่อไปแล้ว 1 ครั้ง ไม่สามารถยืมต่อได้อีก' });

  const daysLeft = calcDaysLeft(item.dueDate);
  if (daysLeft > 3) {
    return res.status(400).json({
      success: false,
      message: `สามารถยืมต่อได้เมื่อใกล้ถึงกำหนดคืนเท่านั้น (เหลือ 3 วันหรือน้อยกว่า, ปัจจุบันเหลืออีก ${daysLeft} วัน)`
    });
  }
  if (daysLeft < 0) {
    return res.status(400).json({
      success: false,
      message: 'หนังสือเกินกำหนดส่งคืนแล้ว ไม่สามารถยืมต่อได้ กรุณานำส่งคืนที่เคาน์เตอร์ห้องสมุดและชำระค่าปรับ'
    });
  }

  const newDue = addDays(14);
  item.renewed = true;
  item.dueDate = newDue;

  res.json({
    success: true,
    message: `ต่ออายุการยืม "${item.title}" เรียบร้อยแล้ว (กำหนดคืนใหม่: ${newDue})`,
    bookId,
    newDueDate: newDue
  });
});

app.post('/api/v1/borrowings/return/:id', (req, res) => {
  const bookId = req.params.id;
  const itemIndex = borrowingsData.findIndex(b => b.id === bookId);

  if (itemIndex === -1) return res.status(404).json({ status: 404, data: { success: false, message: 'ไม่พบรายการยืม' } });

  const returnedItem = borrowingsData[itemIndex];
  borrowingsData.splice(itemIndex, 1);

  const book = booksData.find(b => b.id === bookId);
  if (book) {
    book.status = 'available';
    book.returnDate = null;
    if (book.category !== 'ebook') book.availableCount += 1;
  }

  res.json({
    status: 200,
    data: {
      success: true,
      message: `คืนหนังสือ "${returnedItem.title}" เรียบร้อยแล้ว ขอบคุณที่ใช้บริการค่ะ 😊`,
      count: borrowingsData.length,
      maxLoans: userData.maxLoans,
      data: borrowingsData
    }
  });
});

// 3. User APIs
app.get('/api/v1/user', (req, res) => res.json({ status: 200, data: userData }));

app.put('/api/v1/user', (req, res) => {
  const { name, studentId, faculty, avatar } = req.body;
  if (name) userData.name = name;
  if (studentId) userData.studentId = studentId;
  if (faculty) userData.faculty = faculty;
  if (avatar) userData.avatar = avatar;
  res.json({ status: 200, data: { success: true, message: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว', data: userData } });
});

app.post('/api/v1/user/pay-fine', (req, res) => {
  const paid = userData.fineBalance;
  userData.fineBalance = 0.00;
  res.json({ status: 200, data: { success: true, message: `ชำระค่าปรับสำเร็จ ฿${paid.toFixed(2)} บาท`, fineBalance: 0.00 } });
});

// 4. Room Booking API
app.post('/api/v1/rooms/book', (req, res) => {
  const { roomId, date, slot } = req.body;
  const ref = 'RES-' + Math.floor(1000 + Math.random() * 9000);
  res.json({ status: 200, data: { success: true, message: 'จองห้องศึกษาค้นคว้าสำเร็จ', bookingRef: ref, roomId, date, slot } });
});

// 5. Checkin Simulation API (previously missing!)
app.post('/api/v1/rooms/checkin', (req, res) => {
  const { roomId } = req.body;
  res.json({ status: 200, data: { success: true, message: `สแกน QR เช็กอินเข้าห้อง${roomId ? ' ' + roomId : ''} สำเร็จ! ขอให้เรียนสนุกนะคะ 🎉` } });
});

// 6. Smart Chat Bot (keyword matching)
app.post('/api/v1/chat', (req, res) => {
  const msg = (req.body.message || '').toLowerCase().trim();
  let reply = '';

  if (msg.includes('สวัสดี') || msg.includes('hello') || msg.includes('หวัดดี') || msg.match(/^ดี/)) {
    reply = 'สวัสดีค่ะ! ยินดีให้บริการ สำนักวิทยบริการ มรภ.สงขลา 😊 มีอะไรให้ช่วยเหลือไหมคะ?';
  } else if (msg.includes('เวลา') || msg.includes('เปิด') || msg.includes('ปิด') || msg.includes('กี่โมง')) {
    reply = '🕐 เวลาเปิด-ปิดบริการ:\n• จันทร์–ศุกร์: 08:00–20:00 น.\n• เสาร์–อาทิตย์: 09:00–17:00 น.\n• หยุดวันนักขัตฤกษ์และวันหยุดมหาวิทยาลัย';
  } else if (msg.includes('ยืม') && (msg.includes('กี่') || msg.includes('ได้') || msg.includes('โควตา') || msg.includes('จำนวน'))) {
    reply = '📚 โควตาการยืมหนังสือ:\n• นักศึกษา: 5 เล่ม / 14 วัน\n• อาจารย์/บุคลากร: 10 เล่ม / 30 วัน\n• ยืมต่อได้ 1 ครั้ง ผ่านแอปได้เลยค่ะ';
  } else if (msg.includes('คืน') || msg.includes('กติกา') || msg.includes('กฎ') || msg.includes('ระเบียบ')) {
    reply = '📋 กติกายืม-คืน:\n• กำหนดคืนภายใน 14 วัน\n• ยืมต่อได้ 1 ครั้ง/รายการ\n• ปรับเกินกำหนด: 2 บาท/เล่ม/วัน\n• คืนได้ที่เคาน์เตอร์ชั้น 1 หรือตู้รับคืน 24 ชม.';
  } else if (msg.includes('ปรับ') || msg.includes('ค่าปรับ') || msg.includes('ชำระ') || msg.includes('จ่าย') || msg.includes('โอน')) {
    reply = '💳 การชำระค่าปรับ:\n• PromptPay QR ผ่านแอปนี้ได้เลย (กดแบนเนอร์ค่าปรับ)\n• เคาน์เตอร์บริการ ชั้น 1 (08:00–19:30 น.)\n• อัตราปรับ: 2 บาท/เล่ม/วัน';
  } else if (msg.includes('จอง') || msg.includes('ห้อง') || msg.includes('ติว') || msg.includes('กลุ่ม')) {
    reply = '🚪 การจองห้องศึกษาค้นคว้า:\n• มีให้บริการ 3 ห้อง (A1, A2, B1)\n• จองล่วงหน้าสูงสุด 7 วัน\n• ครั้งละ 2 ชั่วโมง\n• จองผ่านแอปได้เลยค่ะ!';
  } else if (msg.includes('wifi') || msg.includes('ไวไฟ') || msg.includes('อินเทอร์เน็ต') || msg.includes('เน็ต')) {
    reply = '📶 WiFi ในห้องสมุด:\n• SSID: SKRU-WiFi\n• Login ด้วยรหัสนักศึกษา/รหัสประจำตัว\n• มีปัญหาแจ้งเจ้าหน้าที่เคาน์เตอร์ชั้น 1';
  } else if (msg.includes('e-book') || msg.includes('ebook') || msg.includes('ดิจิทัล') || msg.includes('ออนไลน์')) {
    reply = '📱 E-Book & ทรัพยากรดิจิทัล:\n• 2eBook Thailand: หนังสือเรียน 2,500+ เล่ม\n• SKRU IR: งานวิจัยและปริญญานิพนธ์\n• เข้าใช้ได้ 24 ชม. จากทุกที่';
  } else if (msg.includes('วิจัย') || msg.includes('ปริญญา') || msg.includes('thesis') || msg.includes('บทความ')) {
    reply = '🎓 คลังงานวิจัย SKRU IR:\n• เว็บ: ir.skru.ac.th\n• ปริญญานิพนธ์ทุกสาขา ปี 2545–ปัจจุบัน\n• บทความวิชาการในวารสารชาติและนานาชาติ';
  } else if (msg.includes('สแกน') || msg.includes('qr') || msg.includes('บัตร')) {
    reply = '🔖 บัตรสมาชิกดิจิทัล:\n• ใช้ QR Code ในแอปแทนบัตรได้เลย\n• สแกนที่จุดทางเข้าชั้น 1\n• ใช้ยืมหนังสือที่เคาน์เตอร์ได้ด้วยค่ะ';
  } else if (msg.includes('จอดรถ') || msg.includes('ที่จอด')) {
    reply = '🚗 ที่จอดรถ:\n• ลานจอดด้านหน้าอาคารบรรณราชนครินทร์\n• จักรยานยนต์: ด้านข้างอาคาร\n• ฟรีสำหรับนักศึกษาและบุคลากร';
  } else {
    reply = 'ขอบคุณที่ติดต่อสำนักวิทยบริการค่ะ 🙏\nสำหรับคำถามเพิ่มเติม:\n📞 074-336-000 ต่อ 7300\n📧 library@skru.ac.th\n🕐 จ–ศ: 08:00–20:00 น.';
  }

  res.json({
    status: 200,
    data: {
      success: true,
      reply,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
  });
});

// ── Backward Compatibility Routes ────────────────────────────
app.get('/api/user', (req, res) => res.json({ success: true, data: userData }));
app.get('/api/borrowed', (req, res) => res.json({ success: true, count: borrowingsData.length, data: borrowingsData }));
app.get('/api/books', (req, res) => res.json({ success: true, total: booksData.length, data: booksData }));

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ SKRU Library API running  →  http://localhost:${PORT}`);
  console.log(`📚 Books in catalog : ${booksData.length} เล่ม`);
  console.log(`🗓  Today            : ${getToday()}`);
});
