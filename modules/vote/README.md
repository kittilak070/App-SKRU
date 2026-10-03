# ระบบประเมินความพึงพอใจ มหาวิทยาลัยราชภัฏสงขลา (SKRU)

ระบบให้คะแนนความพึงพอใจ พัฒนาด้วย **JavaScript Full-Stack**:
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ไม่มี Library ภายนอก ทำงานเร็วและเบา)
- **Backend**: Node.js (ใช้ Built-in Module ไม่ต้องติดตั้ง npm packages เพิ่มเติมก็รันได้ทันที)
- **Database**: เก็บข้อมูลลงไฟล์ JSON อัตโนมัติ (`data/ratings.json`) พร้อมระบบ LocalStorage Fallback

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
skru-satisfaction-rating/
├── package.json          # ข้อมูลโปรเจกต์และ scripts
├── server.js             # เซิร์ฟเวอร์ Node.js Backend & REST API
├── data/
│   └── ratings.json      # ไฟล์บันทึกข้อมูลคะแนนและความคิดเห็น
└── public/
    ├── index.html        # หน้าจอให้คะแนนตามแบบรูปภาพ
    ├── style.css         # ไฟล์ตกแต่ง CSS สไตล์โมเดิร์น
    ├── app.js            # โค้ด JavaScript จัดการคะแนนและการส่งข้อมูล
    ├── admin.html        # หน้า Dashboard สรุปผลคะแนนและสถิติ
    └── skru-logo.svg     # โลโก้มหาวิทยาลัยราชภัฏสงขลา (Vector SVG)
```

---

## 🚀 วิธีการรันระบบ (How to Run)

### 1. รันด้วย Node.js
เปิด Terminal หรือ Command Prompt ที่โฟลเดอร์นี้ แล้วพิมพ์คำสั่ง:
```bash
node server.js
```

### 2. เข้าใช้งานผ่านเบราว์เซอร์
- **หน้าแบบประเมินความพึงพอใจ (ตามรูปภาพ)**: [http://localhost:3000](http://localhost:3000)
- **หน้าสรุปผลและสถิติ (Admin Dashboard)**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🌟 ฟีเจอร์เด่น
1. **ดีไซน์ตรงตามแบบ 100%**: แถบหัวข้อสีแดง โลโก้ SKRU ดาวให้คะแนน 5 ระดับ ช่องกรอกข้อเสนอแนะเพิ่มเติม และปุ่มกดยืนยันสีเขียว
2. **Interactive Star Rating**: สามารถ Hover ดูระดับคะแนน และคลิกเพื่อเลือก 1 - 5 ดาว
3. **ระบบ REST API**:
   - `POST /api/ratings` บันทึกคะแนนและข้อความ
   - `GET /api/ratings` ดึงรายการคะแนนพร้อมคำนวณคะแนนเฉลี่ยและสัดส่วนคะแนน
4. **หน้าสรุปผล (Admin)**: แสดงกราฟสัดส่วนดาว คะแนนเฉลี่ย ตารางรายการความคิดเห็น และปุ่มดาวน์โหลดรายงานเป็นไฟล์ Excel / CSV
