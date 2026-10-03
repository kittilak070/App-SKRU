# SKRU Payment System 🎓💳

ระบบชำระเงินค่าธรรมเนียมการศึกษา มหาวิทยาลัยราชภัฏสงขลา

## 📌 คุณสมบัติ

- 🔐 เข้าสู่ระบบด้วยรหัสนักศึกษา
- 📋 ดูรายการค่าธรรมเนียมค้างชำระ
- 💳 เลือกช่องทางชำระเงิน (QR Code, โอนผ่านธนาคาร, พร้อมเพย์, บัตรเครดิต/เดบิต, กระเป๋าเงินอิเล็กทรอนิกส์)
- ✅ ยืนยันและชำระเงิน
- 🧾 พิมพ์ใบเสร็จรับเงิน

## 🛠️ เทคโนโลยี

- **Frontend**: HTML / CSS / JavaScript
- **Backend**: Node.js + Express.js

## 🚀 วิธีใช้งาน

```bash
# ติดตั้ง dependencies
npm install

# รันเซิร์ฟเวอร์
npm start
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

## 📝 ข้อมูลทดสอบ

| รหัสนักศึกษา | ชื่อ |
|---|---|
| 6530100001 | นาย.กรรณพัต วังค้อม |
| 6530100002 | นางสาว.สมฤดี ใจดี |

## 📁 โครงสร้างโปรเจค

```
045/
├── server.js           # Node.js backend server
├── package.json        # Project configuration
├── .gitignore
├── README.md
└── public/             # Frontend files
    ├── index.html      # Main HTML
    ├── css/
    │   └── style.css   # Styles
    └── js/
        └── app.js      # Frontend JavaScript
```
