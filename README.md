# SKRU — แหล่งเรียนรู้

หน้าแหล่งเรียนรู้สำหรับมหาวิทยาลัยราชภัฏสงขลา ตามภาพต้นแบบโทนสีแดง รองรับมือถือและคอมพิวเตอร์

## เทคโนโลยี

- หน้าบ้าน: HTML, CSS และ JavaScript โดยไม่ใช้ framework
- หลังบ้าน: Node.js HTTP server และ REST API โดยไม่ใช้ dependency เพิ่มเติม
- ข้อมูลแหล่งเรียนรู้: `data/resources.json`
- รายการโปรดและประวัติการเปิด: localStorage แยกตามเบราว์เซอร์ ไม่ใช่ระบบบัญชีผู้ใช้หรือฐานข้อมูลกลาง

## เริ่มใช้งาน

ติดตั้ง Node.js 22 ขึ้นไป แล้วรัน:

```sh
npm start
```

เปิด http://127.0.0.1:3000 ไม่ต้องเปิดไฟล์ HTML โดยตรง เพราะหน้าเว็บโหลดข้อมูลจาก Node.js API

```sh
npm run dev
npm test
```

กำหนดพอร์ตด้วยตัวแปร `PORT` (ค่าเริ่มต้น 3000) และ host ด้วย `HOST` (ค่าเริ่มต้น 127.0.0.1) หากนำขึ้น server ให้กำหนด `HOST=0.0.0.0` ตามสภาพแวดล้อมที่ใช้

## โครงสร้าง

```text
public/index.html     หน้าเว็บ
public/styles.css    รูปแบบและ responsive layout
public/app.js        ค้นหา หมวดหมู่ รายการโปรด และประวัติ
server.js            Node.js server และ API
data/resources.json  รายการแหล่งเรียนรู้
test/server.test.js  การทดสอบ HTTP/API
```

## API

- `GET /api/health` สถานะ server
- `GET /api/resources` รายการทั้งหมด รองรับ `q` และ `category`
- `GET /api/resources?category=finance&q=ตลาด` ตัวอย่างการค้นหา
- `GET /api/resources/:id` รายละเอียดหนึ่งรายการ
- หมวดหมู่: `all`, `academic`, `finance`, `elearning`

ลิงก์แหล่งเรียนรู้เปิดในแท็บใหม่ ฟอนต์ Google Fonts ต้องใช้อินเทอร์เน็ต และมีฟอนต์สำรองเมื่อโหลดไม่ได้

## Branch

งานนี้ใช้ branch `029` แบบ orphan: เริ่มจาก root commit ใหม่ ไม่มี parent commit จาก `main` หรือ branch อื่น ไม่ merge ไม่ rebase และไม่สร้าง pull request เข้าสู่ branch อื่น

หาก branch `029` มีอยู่แล้วบน remote ให้ตรวจสอบก่อน ห้าม force-push ทับประวัติเดิม
