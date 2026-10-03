# 🎓 SKRU Unified Student Portal (ระบบบริการดิจิทัล มรภ.สงขลา)

ระบบศูนย์รวมบริการดิจิทัล มหาวิทยาลัยราชภัฏสงขลา (Songkhla Rajabhat University) ที่รวมผลงานและโมดูลจาก **19 สาขา (Branches)** บน GitHub เข้าสู่โปรเจกต์เดียวกันอย่างสมบูรณ์แบบ พร้อมหน้าเว็บหลักและเมนูเชื่อมโยงทั้ง 20 ระบบย่อย

---

## 📌 สรุปรายการทั้ง 20 ระบบตามที่กำหนด

| ลำดับ | สาขา (Branch) | บริการ (Service) | ไฟล์หลัก (Primary File) | ไฟล์สำรอง (Alias) | หมวดหมู่ |
|:---:|:---:|:---|:---|:---|:---:|
| 1 | **035** | Check-in Class (เช็คชื่อเข้าเรียน) | `check-in.html` | - | วิชาการ |
| 2 | **051** | Student Profile (ประวัตินักศึกษา) | `student-profile.html` | `profile.html` | บัญชี |
| 3 | **045** | Tuition Fee (จ่ายค่าเทอม) | `tuition-fee.html` | `payment.html` | การเงิน |
| 4 | **028** | Student Card (บัตรนักศึกษา) | `student-card.html` | `card.html` | บัญชี |
| 5 | **042** | Academic Record (ผลการศึกษา/คำแนะนำ) | `academic-record.html` | `grades.html` | วิชาการ |
| 6 | **032** | Campus Map (แผนที่มหาวิทยาลัย) | `campus-map.html` | `map.html` | สถานที่ |
| 7 | **044** | Student Loan (ลงทะเบียน กยศ.) | `student-loan.html` | - | การเงิน |
| 8 | **043** | Booking (ยืม/จองอุปกรณ์และสถานที่) | `booking.html` | `reservation.html` | สถานที่ |
| 9 | **030** | Faculty Contact (ติดต่ออาจารย์/คณะ) | `faculty-contact.html` | `contact.html` | วิชาการ |
| 10 | **041** | University News (ข่าวสารมหาวิทยาลัย) | `news.html` | - | กิจกรรม |
| 11 | **029** | Learning Resources (แหล่งเรียนรู้) | `learning-resources.html` | - | วิชาการ |
| 12 | **039** | Dorm Booking (จองหอพักในมหาวิทยาลัย) | `dorm-booking.html` | - | สถานที่ |
| 13 | **046** | Event Booking (จองกิจกรรมนักศึกษา) | `event-booking.html` | `activities.html` | กิจกรรม |
| 14 | **040** | Privacy Settings (จัดการความเป็นส่วนตัว) | `privacy-settings.html` | `privacy.html` | บัญชี |
| 15 | **048** | Academic Calendar (ปฏิทินการศึกษา) | `academic-calendar.html` | - | วิชาการ |
| 16 | **027** | Login (เข้าสู่ระบบกลาง) | `login.html` | - | บัญชี |
| 17 | **049** | Settings (ตั้งค่าระบบ) | `settings.html` | - | บัญชี |
| 18 | **033** | Vote (โหวต / แบบสำรวจ) | `vote.html` | - | กิจกรรม |
| 19 | **050** | Rewards (แลกของรางวัล/แต้มกิจกรรม) | `rewards.html` | `redeem.html` | กิจกรรม |
| 20 | **047** | Library (ห้องสมุดดิจิทัล) | `library.html` | - | สถานที่ |

---

## 🚀 วิธีการเปิดใช้งาน

### 1. เปิดไฟล์ HTML ผ่าน Browser โดยตรง (Direct Open)
สามารถดับเบิลคลิกเปิดไฟล์ `index.html` หรือไฟล์ใดๆ ที่ต้องการ เช่น `check-in.html`, `tuition-fee.html` ผ่าน Google Chrome, Microsoft Edge ได้ทันที

### 2. รันผ่าน Web Server (Node.js)
```bash
# 1. ติดตั้ง Dependencies (Express, CORS)
npm install

# 2. เริ่มต้น Server
npm start
# หรือ
node server.js
```
เปิดบราวเซอร์ไปที่: **`http://localhost:3000`** เพื่อเข้าสู่ **SKRU Unified Portal Hub**

---

## 🌿 การสลับ Git Branch แต่ละสาขา
คลังข้อมูลนี้ได้ดึง Local Tracking Branch ไว้ครบถ้วนทุกสาขาแล้ว:
```bash
# ดูรายชื่อ Branch ทั้งหมด
git branch -a

# สลับไปยังสาขาที่ต้องการ (ตัวอย่างสาขา 035)
git checkout 035

# สลับกลับมาหน้าหลักที่รวมทุกบริการ
git checkout main
```

---

## 📁 โครงสร้างโฟลเดอร์ในโปรเจกต์
```
App-SKRU/
├── index.html                   # หน้าหลักรวม 20 บริการ (Unified Portal Hub)
├── check-in.html                # หน้า 1: เช็คชื่อเข้าเรียน (035)
├── student-profile.html         # หน้า 2: ข้อมูลประวัตินักศึกษา (051)
├── profile.html                 # หน้า 2 (Alias)
├── tuition-fee.html             # หน้า 3: จ่ายค่าเทอม (045)
├── payment.html                 # หน้า 3 (Alias)
├── student-card.html            # หน้า 4: บัตรนักศึกษา (028)
├── card.html                    # หน้า 4 (Alias)
├── academic-record.html         # หน้า 5: ผลการศึกษาและคำแนะนำ (042)
├── grades.html                  # หน้า 5 (Alias)
├── campus-map.html              # หน้า 6: แผนที่ (032)
├── map.html                     # หน้า 6 (Alias)
├── student-loan.html            # หน้า 7: ลงทะเบียน กยศ. (044)
├── booking.html                 # หน้า 8: ยืม/จองอุปกรณ์สถานที่ (043)
├── reservation.html             # หน้า 8 (Alias)
├── faculty-contact.html         # หน้า 9: ติดต่ออาจารย์/คณะ (030)
├── contact.html                 # หน้า 9 (Alias)
├── news.html                    # หน้า 10: ข่าวสารมหาวิทยาลัย (041)
├── learning-resources.html      # หน้า 11: แหล่งเรียนรู้ (029)
├── dorm-booking.html            # หน้า 12: จองหอพัก (039)
├── event-booking.html           # หน้า 13: จองกิจกรรม (046)
├── activities.html              # หน้า 13 (Alias)
├── privacy-settings.html        # หน้า 14: จัดการความเป็นส่วนตัว (040)
├── privacy.html                 # หน้า 14 (Alias)
├── academic-calendar.html       # หน้า 15: ปฏิทินการศึกษา (048)
├── login.html                   # หน้า 16: เข้าสู่ระบบ (027)
├── settings.html                # หน้า 17: ตั้งค่า (049)
├── vote.html                    # หน้า 18: โหวต (033)
├── rewards.html                 # หน้า 19: แลกของรางวัล (050)
├── redeem.html                  # หน้า 19 (Alias)
├── library.html                 # หน้า 20: ห้องสมุด (047)
├── modules/                     # โค้ดต้นฉบับแยกแต่ละโมดูล (027 - 051)
├── server.js                    # Express Server รวมทุก API & Route
└── package.json
```
