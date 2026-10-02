# 🎓 ระบบข่าวสารและกิจกรรมมหาวิทยาลัย (University News System)

ระบบข่าวสารและกิจกรรมมหาวิทยาลัย (**SKRU Campus News**) พัฒนาด้วย JavaScript ทั้งส่วนหน้าบ้าน (Frontend) และหลังบ้าน (Backend) ตามดีไซน์ต้นแบบที่กำหนด

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### 🖥️ หน้าบ้าน (Frontend)
- **HTML5**: โครงสร้างหน้าเว็บแบบ Semantic พร้อมแท็กมาตรฐาน SEO
- **CSS3**: ดีไซน์ทันสมัย (Modern Responsive Web / Mobile-first UX), ใช้ Google Fonts (`Prompt` และ `Kanit`), ฟอนต์ไอคอน `Font Awesome 6`
- **JavaScript (Vanilla JS)**: จัดการ State, การเชื่อมต่อ REST API, ระบบไลก์, กรองหมวดหมู่, ระบบแสดงความคิดเห็นแบบเรียลไทม์ และ Modal รายละเอียดข่าว

### ⚙️ หลังบ้าน (Backend)
- **Node.js & Express.js**: สร้าง RESTful API ครบวงจร
- **JSON File Database**: จัดเก็บข้อมูลข่าวสาร หมวดหมู่ และความคิดเห็นในโฟลเดอร์ `data/` แบบถาวร (Persistent Storage)
- **Multer**: รองรับการอัปโหลดไฟล์รูปภาพข่าวสาร
- **CORS & Morgan**: จัดการ Cross-Origin Resource Sharing และเก็บบันทึก Request Log

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
University news/
├── data/
│   ├── categories.json       # ข้อมูลหมวดหมู่ข่าวสาร
│   ├── news.json             # ข้อมูลบทความข่าวสารและประกาศ
│   └── comments.json         # ข้อมูลความคิดเห็น
├── public/
│   ├── css/
│   │   └── style.css         # ไฟล์ CSS สไตล์ตกแต่งตามแบบ UI
│   ├── js/
│   │   └── app.js            # โค้ด JavaScript จัดการฝั่งผู้ใช้และเชื่อมต่อ API
│   ├── uploads/              # โฟลเดอร์เก็บไฟล์รูปภาพที่อัปโหลด
│   └── index.html            # หน้าเว็บหลัก
├── package.json              # กำหนด Dependencies และ Scripts
├── server.js                 # เซิร์ฟเวอร์ Node.js Express และ REST API
└── test.js                   # สคริปต์ทดสอบการทำงานของระบบ (Integration Tests)
```

---

## 🚀 ฟังก์ชันการทำงานหลัก (Core Features)

1. **แถบส่วนหัว (Header)**: แสดงปุ่มย้อนกลับ, หัวข้อ "ข่าวสารและกิจกรรม", ซับไตเติล "SKRU Campus News" และปุ่ม (+) สำหรับผู้ดูแลระบบเปิดฟอร์มสร้างข่าวใหม่
2. **ค้นหาข่าว (Live Search)**: ค้นหาข่าวสารตามคีย์เวิร์ดแบบ Real-time พร้อมปุ่มเคลียร์คำค้นหา
3. **ปุ่มตัวกรองหมวดหมู่ (Category Filter Pills)**:
   - ทั้งหมด
   - ข่าวมหาวิทยาลัย
   - กิจกรรมนักศึกษา
   - วิชาการ & ทุน
   - บริการวิชาการ
4. **การ์ดข่าวเด่น (Featured Hero Card)**:
   - รูปภาพขนาดใหญ่พร้อม Gradient Overlay
   - ปุ่มแชร์ไปยัง Facebook และปุ่มคัดลอกลิงก์
   - ปุ่มกดถูกใจ (Like) พร้อมตัวนับไลก์แบบไดนามิก
5. **รายการข่าวสาร & ประกาศล่าสุด (Latest News & Announcements)**: แสดง Thumbnail, ป้ายกำกับ (Badge), วันที่ และสถานที่จัด
6. **ระบบความคิดเห็น (Interactive Comments)**:
   - แสดงรายการความคิดเห็นพร้อม Avatar, เวลา และยอดถูกใจ
   - ฟอร์มพิมพ์ชื่อและส่งความคิดเห็นเข้าสู่ระบบได้ทันที
   - ปุ่มกดถูกใจคอมเมนต์และปุ่มตอบกลับ (Reply)
7. **หน้าต่างอ่านบทความฉบับเต็ม (Article Modal Reader)**: คลิกที่ข่าวเพื่อดูรายละเอียดฉบับเต็ม ยอดผู้เข้าชม และเนื้อหาครบถ้วน
8. **ฟอร์มจัดการข่าวสาร (Admin News Creator)**: ฟอร์มสร้างข่าวใหม่ เลือกหมวดหมู่ ใส่รูปภาพ และกำหนดให้เป็นข่าวเด่น (Hero Featured)
9. **แถบเมนูด้านล่าง (Bottom Navigation Bar)**: หน้าหลัก, ข่าวสาร, กิจกรรม, แจ้งเตือน, โปรไฟล์

---

## 🔌 รายการ API Endpoints

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| `GET` | `/api/categories` | ดึงรายชื่อหมวดหมู่ทั้งหมด |
| `GET` | `/api/news` | ดึงรายการข่าวสาร (รองรับ query: `category`, `search`, `featured`) |
| `GET` | `/api/news/:id` | ดึงรายละเอียดข่าวตาม ID และนับจำนวนผู้เข้าชม |
| `POST` | `/api/news` | สร้างข่าวสารใหม่ |
| `PUT` | `/api/news/:id` | แก้ไขข้อมูลข่าวสาร |
| `DELETE` | `/api/news/:id` | ลบข่าวสาร |
| `POST` | `/api/news/:id/like` | กดไลก์ / ยกเลิกไลก์ข่าว |
| `GET` | `/api/news/:id/comments` | ดึงความคิดเห็นของข่าวนั้นๆ |
| `POST` | `/api/news/:id/comments` | เพิ่มความคิดเห็นใหม่ |
| `POST` | `/api/comments/:commentId/like` | กดไลก์ความคิดเห็น |

---

## 💻 วิธีการเปิดใช้งานระบบ (How to Run)

1. ติดตั้ง Dependencies (หากยังไม่ได้ติดตั้ง):
   ```bash
   npm install
   ```

2. เริ่มต้นรันเซิร์ฟเวอร์:
   ```bash
   npm start
   ```

3. เปิดเบราว์เซอร์แล้วเข้าสู่ URL:
   ```
   http://localhost:3000
   ```

4. ทดสอบความถูกต้องของระบบ:
   ```bash
   node test.js
   ```
