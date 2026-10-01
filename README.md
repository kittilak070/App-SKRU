# เว็บแอปพลิเคชัน กยศ. มหาวิทยาลัยราชภัฏสงขลา (SKRU Student Loan Web App)

เว็บแอปพลิเคชันบริการข้อมูลและการลงทะเบียนกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) มหาวิทยาลัยราชภัฏสงขลา (SKRU) 
พัฒนาด้วย **Fullstack JavaScript** เพื่อให้ทีมงานพัฒนาและทำงานร่วมกันได้ง่ายผ่าน **Git & GitHub**

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: HTML5, Modern CSS3 (Mobile-First Responsive), Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express.js REST API
- **Data Storage**: JSON-based Database (`src/data/db.json`)
- **Version Control**: Git & GitHub

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
skru-student-loan/
├── public/                     # ส่วนหน้าบ้าน (Frontend)
│   ├── index.html              # หน้าหลักของแอปพลิเคชัน (ตาม Mockup)
│   ├── css/
│   │   └── style.css           # สไตล์ธีมสีแดง-ขาว อัตลักษณ์ กยศ. / SKRU
│   ├── js/
│   │   ├── api.js              # ตัวเชื่อมต่อ REST API
│   │   └── app.js              # Logic ควบคุม UI, Modal, และ Event Listeners
│   └── assets/                 # รูปภาพและไอคอน
├── src/                        # ส่วนหลังบ้าน (Backend Node.js)
│   ├── server.js               # เซิร์ฟเวอร์หลัก Express.js
│   ├── routes/
│   │   └── api.js              # API Endpoints ทั้งหมด
│   └── data/
│       └── db.json             # ข้อมูลจำลอง (ข่าว, ขั้นตอนกู้ยืม, รายชื่อลงทะเบียน)
├── .gitignore                  # กำหนดไฟล์ที่ไม่ขึ้น Git (เช่น node_modules)
├── package.json                # ข้อมูล Dependencies และคำสั่งรัน
└── README.md                   # คู่มือการติดตั้งและทำงานร่วมกัน
```

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Installation & Run)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันเซิร์ฟเวอร์สำหรับพัฒนา (Development Server)
```bash
npm run dev
# หรือ
npm start
```

### 3. เข้าใช้งานผ่านเบราว์เซอร์
- เว็บแอปพลิเคชัน: [http://localhost:3000](http://localhost:3000)
- ทดสอบ API: [http://localhost:3000/api/news](http://localhost:3000/api/news)

---

## 📡 รายการ API Endpoints (Backend REST API)

| Method | Endpoint | รายละเอียด |
|---|---|---|
| `GET` | `/api/news` | ดึงรายการข่าวประชาสัมพันธ์ |
| `GET` | `/api/loans/info` | ข้อมูลและหลักเกณฑ์การกู้ยืม กยศ. |
| `GET` | `/api/institution` | ข้อมูลหน่วยงานและฝ่ายแนะแนวทุน มรภ.สงขลา |
| `GET` | `/api/repayments/info` | ข้อมูลช่องทางการชำระหนี้ |
| `POST` | `/api/repayments/register` | ลงทะเบียนแสดงความจำนงชำระหนี้ |
| `GET` | `/api/repayments/status/:query` | ตรวจสอบสถานะการลงทะเบียน (เลขบัตร/รหัสนักศึกษา) |
| `GET` | `/api/salary-deduction` | ข้อมูลระบบหักเงินเดือนผ่านนายจ้าง |
| `GET` | `/api/volunteer` | รายการกิจกรรมจิตสาธารณะสะสมชั่วโมง กยศ. (36 ชม.) |
| `GET` | `/api/hall-of-fame` | ข้อมูล Hall of Fame ศิษย์เก่าตัวอย่าง |

---

## 🤝 แนวทางการทำงานร่วมกันบน Git & GitHub (Collaboration Guide)

เพื่อให้ทีมงานทำงานร่วมกันได้อย่างราบรื่นและไม่เกิด Conflict:

### 1. การ Clone โปรเจกต์ลงเครื่อง
```bash
git clone <URL-Repository-บน-GitHub>
cd skru-student-loan
npm install
```

### 2. การสร้าง Branch สำหรับฟีเจอร์ใหม่
ห้าม Commit โค้ดลงบน `main` โดยตรง ให้แยก Branch ตามลักษณะงาน:
```bash
# ตัวอย่าง: สร้าง branch สำหรับปรับแต่งหน้าฟอร์มชำระหนี้
git checkout -b feature/repayment-form-update

# ตัวอย่าง: สร้าง branch สำหรับเพิ่ม API จิตอาสา
git checkout -b feature/volunteer-api
```

### 3. การ Commit งาน
เขียนข้อความ Commit ให้สื่อความหมายชัดเจน:
```bash
git add .
git commit -m "feat: เพิ่มระบบค้นหาสถานะการลงทะเบียนชำระหนี้"
```

### 4. การ Push และสร้าง Pull Request (PR)
```bash
git push origin feature/repayment-form-update
```
จากนั้นไปที่ GitHub เพื่อสร้าง **Pull Request** ให้เพื่อนร่วมทีม Review ก่อน Merge เข้า `main`
