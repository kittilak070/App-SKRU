# Consent Form Web Application (ระบบจัดการข้อมูลส่วนบุคคล)

เว็บแอปพลิเคชันสำหรับจัดการความยินยอมข้อมูลส่วนบุคคล (PDPA Consent Form) ตามมาตรฐานการยินยอมในการพัฒนาบริการและการนำเสนอสิทธิประโยชน์ พัฒนาด้วย **JavaScript ทั้งระบบ (Full-stack JavaScript)** เพื่อให้ทีมสามารถเรียนรู้ พัฒนา และทำงานร่วมกันได้อย่างราบรื่น

---

## 🛠 Tech Stack

- **Frontend (หน้าบ้าน)**: 
  - HTML5 (Semantic Elements, Mobile-friendly)
  - CSS3 (Responsive Design, Flexbox, Custom Radio Buttons, Pure CSS)
  - Vanilla JavaScript (Fetch API, DOM Events, Asynchronous Requests)
- **Backend (หลังบ้าน)**: 
  - Node.js (Runtime Environment)
  - Express.js (REST API Server)
- **Data Storage**: 
  - JSON File Storage (`consent-data.json`) พร้อมสำหรับการเชื่อมต่อฐานข้อมูลในอนาคต (เช่น MongoDB / MySQL / PostgreSQL)
- **Version Control & Collaboration**: 
  - Git & GitHub (Branching Strategy, Pull Requests, Code Review)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
consent-form-app/
├── public/                     # ไฟล์หน้าบ้าน (Frontend)
│   ├── index.html             # หน้าเว็บแบบฟอร์มการยินยอม (UI ตามดีไซน์)
│   ├── admin.html             # หน้าสรุปผลรายการยินยอม (Dashboard ดูข้อมูล)
│   ├── style.css              # สไตล์ CSS และการจัดวางรูปแบบตาม Mockup
│   └── script.js              # JavaScript ควบคุมฟอร์มและยิง API ไปยังหลังบ้าน
├── consent-data.json          # ไฟล์เก็บข้อมูลการยินยอม (สร้างอัตโนมัติ)
├── server.js                  # ไฟล์เซิร์ฟเวอร์ Express.js (Backend REST API)
├── package.json               # ข้อมูลโปรเจกต์และ Dependencies
├── .gitignore                 # กำหนดไฟล์ที่ไม่ต้องนำขึ้น Git
└── README.md                  # คู่มือโปรเจกต์และการทำงานร่วมกัน
```

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Getting Started)

### 1. ติดตั้ง Dependencies
เปิด Terminal ในโฟลเดอร์โปรเจกต์ แล้วพิมพ์:
```bash
npm install
```

### 2. รันเซิร์ฟเวอร์ (Development Mode)
```bash
npm run dev
```
หรือรันปกติ:
```bash
npm start
```

### 3. เปิดใช้งานผ่านเบราว์เซอร์
- **หน้าแบบฟอร์มความยินยอม (หน้าหลัก)**: [http://localhost:3000](http://localhost:3000)
- **หน้ารายการข้อมูลความยินยอม (Admin View)**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🔌 ข้อมูล REST API

| Method | Endpoint | คำอธิบาย | ข้อมูลที่ส่ง (Payload) |
|---|---|---|---|
| `GET` | `/api/consent` | ดึงรายการความยินยอมทั้งหมด | - |
| `POST` | `/api/consent` | บันทึกความยินยอมใหม่ | `{ "consent1": "agree", "consent2": "agree", "consent3": "agree" }` |

---

## 🤝 คู่มือการทำงานร่วมกันด้วย Git & GitHub (Git Workflow Guidelines)

เพื่อให้ทีมงานทำงานร่วมกันได้อย่างเป็นระเบียบ โค้ดไม่ทับกัน และติดตามประวัติการแก้ไขได้ง่าย แนะนำขั้นตอนการทำงานดังนี้:

### 1. การเริ่มต้นโคลนโปรเจกต์ (Clone)
```bash
git clone <URL_ของ_GITHUB_REPOSITORY>
cd consent-form-app
npm install
```

### 2. อัปเดตโค้ดล่าสุดจากสาขาหลักก่อนเริ่มงานเสมอ
```bash
git checkout main
git pull origin main
```

### 3. แตก Branch ใหม่สำหรับฟีเจอร์หรืองานของตนเอง
ห้าม Commit โค้ดตรงไปยัง `main` โดยตรง ให้สร้าง Branch ใหม่เสมอ:
```bash
# รูปแบบ: feature/ชื่อฟีเจอร์ หรือ fix/ชื่อบั๊ก
git checkout -b feature/consent-validation
```

### 4. การบันทึกการเปลี่ยนแปลง (Commit)
จัดกลุ่มการแก้ไขและตั้งชื่อ Commit Message ให้สื่อความหมายตามมาตรฐาน Conventional Commits:
- `feat:` เพิ่มฟังก์ชันหรือความสามารถใหม่
- `fix:` แก้ไขข้อผิดพลาด (Bug)
- `style:` ปรับแต่งหน้าตา CSS/UI โดยไม่กระทบ Logic
- `refactor:` ปรับปรุงโครงสร้างโค้ดให้สะอาดขึ้น
- `docs:` แก้ไขหรือเพิ่มคู่มือ / เอกสาร

ตัวอย่าง:
```bash
git add .
git commit -m "feat: add toast notifications and server input validation"
```

### 5. การ Push Branch ขึ้น GitHub
```bash
git push -u origin feature/consent-validation
```

### 6. การเปิด Pull Request (PR) และ Review
1. เข้าไปที่ Repository บน GitHub
2. กดปุ่ม **"Compare & pull request"**
3. เขียนอธิบายสั้นๆ ว่าฟีเจอร์นี้ทำอะไรบ้าง และแนบภาพหรือผลการทดสอบ
4. ให้เพื่อนร่วมทีมช่วยตรวจดูโค้ด (Code Review) และกด **Approve**
5. กดยืนยันการ **Merge Pull Request** เข้าสู่สาขา `main`

### 7. การลบ Branch ที่เสร็จแล้วและดึงโค้ดล่าสุดกลับมา
```bash
git checkout main
git pull origin main
git branch -d feature/consent-validation
```
