# SKRU Map — ระบบแผนที่มหาวิทยาลัยราชภัฏสงขลา

หน้าบ้าน: HTML / CSS / JavaScript · หลังบ้าน: Node.js (ใช้แค่โมดูลในตัว ไม่ต้อง `npm install`)

## วิธีรัน
```bash
node server.js        # หรือ npm start
```
เปิด http://localhost:3000 (เปลี่ยนพอร์ตได้ด้วย `PORT=4000 node server.js`)

## โครงสร้าง
```
server.js        หลังบ้าน: API + เสิร์ฟไฟล์หน้าบ้าน
data/            ข้อมูลสถานที่ (JSON)
public/          หน้าบ้าน
  index.html, style.css
  js/boot.js     ดึงข้อมูลจาก API แล้วเริ่มแผนที่
  js/app.js      โค้ดแผนที่ (Leaflet + MapLibre)
  vendor/        ไลบรารีแผนที่
```

## API (ระบบอื่นในทีมเรียกใช้ได้ — เปิด CORS ไว้แล้ว)
| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/health` | ตรวจว่าเซิร์ฟเวอร์ทำงาน |
| GET | `/api/categories` | หมวดหมู่สถานที่ + จำนวน |
| GET | `/api/places?cat=อาคาร&group=official` | รายการสถานที่ (กรองได้) |
| GET | `/api/places/:id` | รายละเอียดสถานที่ เช่น `/api/places/skru-7` |
| GET | `/api/search?q=หอพัก` | ค้นหาสถานที่ |
| GET | `/api/campus` `/api/official` `/api/nearby` | ข้อมูลดิบที่หน้าแผนที่ใช้ |

ตัวอย่างการเรียกจากระบบอื่น:
```js
const res = await fetch('http://localhost:3000/api/search?q=หอสมุด');
const places = await res.json(); // [{ id, name, cat, center:[lat,lng], ... }]
```

## ที่มาข้อมูล
© OpenStreetMap contributors · OpenFreeMap / OpenMapTiles · ภาพถ่าย © Esri · แผนผังและภาพ 360°: มหาวิทยาลัยราชภัฏสงขลา
