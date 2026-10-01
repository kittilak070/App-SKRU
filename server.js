const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'store.json');

// Initialize data if not existing
function getInitialData() {
  const generateRooms = (dormId, floors, roomsPerFloor, bedsPerRoom, occupiedCount) => {
    const rooms = [];
    let occLeft = occupiedCount;
    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        const roomNum = `${f}${r.toString().padStart(2, '0')}`;
        const beds = [];
        for (let b = 1; b <= bedsPerRoom; b++) {
          const bedLabel = String.fromCharCode(64 + b); // A, B, C...
          let isOccupied = false;
          if (occLeft > 0 && Math.random() > 0.4) {
            isOccupied = true;
            occLeft--;
          }
          beds.push({
            id: `${dormId}-${roomNum}-${bedLabel}`,
            label: `เตียง ${bedLabel}`,
            isOccupied: isOccupied
          });
        }
        rooms.push({
          roomNumber: roomNum,
          floor: f,
          beds: beds
        });
      }
    }
    // Fix up occupied count exact match
    if (occLeft > 0) {
      for (const room of rooms) {
        for (const bed of room.beds) {
          if (!bed.isOccupied && occLeft > 0) {
            bed.isOccupied = true;
            occLeft--;
          }
        }
      }
    }
    return rooms;
  };

  return {
    dorms: [
      {
        id: 'parichat',
        name: 'หอพักหญิง ปาริฉัตร',
        type: 'female',
        typeLabel: 'หอพักหญิง',
        floors: 4,
        totalRooms: 52,
        bedsPerRoom: 2,
        capacityPerRoomText: '2 คน/ห้อง',
        totalBeds: 104,
        occupiedBeds: 4,
        price: 5700,
        pricePeriod: 'ภาคการศึกษา 4 เดือน',
        electricityNote: 'รวมค่าบริการไฟฟ้าแล้ว',
        amenities: [
          'พัดลมเพดาน / ตั้งพื้น',
          'ห้องน้ำรวม',
          '2 เตียงเดี่ยวต่อห้อง',
          'ฟรีค่าไฟฟ้า',
          'ระบบคีย์การ์ด / กล้อง CCTV'
        ],
        rooms: generateRooms('parichat', 4, 13, 2, 4)
      },
      {
        id: 'sabadnga',
        name: 'หอพักชาย สบัดงา',
        type: 'male',
        typeLabel: 'หอพักชาย',
        floors: 4,
        totalRooms: 34,
        bedsPerRoom: 2,
        capacityPerRoomText: '2 คน/ห้อง',
        totalBeds: 68,
        occupiedBeds: 1,
        price: 5700,
        pricePeriod: 'ภาคการศึกษา 4 เดือน',
        electricityNote: 'ค่าบริการไฟฟ้า 5 บาท / หน่วย',
        amenities: [
          'ห้องน้ำรวม',
          '2 เตียงเดี่ยวต่อห้อง',
          'นักศึกษาต้องนำพัดลมมาเอง',
          'ค่าไฟ 5 บาท / หน่วย',
          'ระบบความปลอดภัย 24 ชม.'
        ],
        rooms: generateRooms('sabadnga', 4, 8.5, 2, 1) // 34 rooms total
      },
      {
        id: 'pattananree',
        name: 'หอพักหญิง พัฒนันรี',
        type: 'female',
        typeLabel: 'หอพักหญิง',
        floors: 4,
        totalRooms: 60,
        bedsPerRoom: 3,
        capacityPerRoomText: '3 คน/ห้อง',
        totalBeds: 180,
        occupiedBeds: 0,
        price: 6200,
        pricePeriod: 'ภาคการศึกษา 4 เดือน',
        electricityNote: 'ค่าบริการไฟฟ้า 5 บาท / หน่วย',
        amenities: [
          'มีพัดลมในห้องพัก',
          'ห้องน้ำภายในห้องพัก (ห้องน้ำในตัว)',
          '3 เตียงเดี่ยวต่อห้อง',
          'ค่าไฟ 5 บาท / หน่วย',
          'ระบบคีย์การ์ดเข้า-ออก'
        ],
        rooms: generateRooms('pattananree', 4, 15, 3, 0)
      }
    ],
    bookings: []
  };
}

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const data = getInitialData();
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
      return data;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading data file:', err);
    return getInitialData();
  }
}

function saveData(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving data file:', err);
  }
}

// API Routes

// GET /api/dorms - Get all dorms summary
app.get('/api/dorms', (req, res) => {
  const data = readData();
  const dormSummary = data.dorms.map(d => {
    // calculate actual available beds
    let availableCount = 0;
    d.rooms.forEach(r => {
      r.beds.forEach(b => {
        if (!b.isOccupied) availableCount++;
      });
    });

    return {
      id: d.id,
      name: d.name,
      type: d.type,
      typeLabel: d.typeLabel,
      floors: d.floors,
      totalRooms: d.totalRooms,
      bedsPerRoom: d.bedsPerRoom,
      capacityPerRoomText: d.capacityPerRoomText,
      totalBeds: d.totalBeds,
      availableBeds: availableCount,
      occupiedBeds: d.totalBeds - availableCount,
      price: d.price,
      pricePeriod: d.pricePeriod,
      electricityNote: d.electricityNote,
      amenities: d.amenities
    };
  });

  res.json({ success: true, dorms: dormSummary });
});

// GET /api/dorms/:id - Get specific dorm with rooms/beds layout
app.get('/api/dorms/:id', (req, res) => {
  const data = readData();
  const dorm = data.dorms.find(d => d.id === req.params.id);
  if (!dorm) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลหอพักนี้' });
  }
  
  let availableCount = 0;
  dorm.rooms.forEach(r => {
    r.beds.forEach(b => {
      if (!b.isOccupied) availableCount++;
    });
  });

  res.json({
    success: true,
    dorm: {
      ...dorm,
      availableBeds: availableCount,
      occupiedBeds: dorm.totalBeds - availableCount
    }
  });
});

// POST /api/bookings - Create new booking
app.post('/api/bookings', (req, res) => {
  const { dormId, roomNumber, bedId, studentId, prefix, fullName, gender, faculty, major, phone, email, paymentSlip } = req.body;

  if (!dormId || !roomNumber || !bedId || !studentId || !fullName || !phone) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const sClean = studentId.trim();
  if ((sClean.length !== 9 && sClean.length !== 13) || !/^\d+$/.test(sClean)) {
    return res.status(400).json({ success: false, message: 'รหัสนักศึกษาต้องเป็นตัวเลข 9 หลัก หรือ 13 หลักเท่านั้น' });
  }

  const data = readData();
  const dorm = data.dorms.find(d => d.id === dormId);
  if (!dorm) {
    return res.status(404).json({ success: false, message: 'ไม่พบหอพักที่ระบุ' });
  }

  // Check if student already booked
  const existingBooking = data.bookings.find(b => b.studentId === studentId && b.status === 'confirmed');
  if (existingBooking) {
    return res.status(400).json({
      success: false,
      message: `รหัสนักศึกษา ${studentId} ได้ทำการจองหอพักไว้แล้ว (${existingBooking.dormName} ห้อง ${existingBooking.roomNumber})`
    });
  }

  // Find room & bed
  const room = dorm.rooms.find(r => r.roomNumber === roomNumber);
  if (!room) {
    return res.status(400).json({ success: false, message: 'ไม่พบห้องพักที่ระบุ' });
  }

  const bed = room.beds.find(b => b.id === bedId);
  if (!bed) {
    return res.status(400).json({ success: false, message: 'ไม่พบเตียงพักที่ระบุ' });
  }

  if (bed.isOccupied) {
    return res.status(400).json({ success: false, message: 'เตียงนี้ถูกจองไปแล้ว กรุณาเลือกเตียงอื่น' });
  }

  // Mark bed as occupied
  bed.isOccupied = true;
  bed.occupiedBy = studentId;

  // Create booking record
  const bookingCode = 'BK' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);
  const newBooking = {
    id: 'BK-' + Date.now(),
    bookingCode: bookingCode,
    dormId: dorm.id,
    dormName: dorm.name,
    roomNumber: roomNumber,
    bedId: bedId,
    bedLabel: bed.label,
    studentId: studentId,
    prefix: prefix || '',
    fullName: fullName,
    gender: gender || dorm.type,
    faculty: faculty || '-',
    major: major || '-',
    phone: phone,
    email: email || '-',
    price: dorm.price,
    pricePeriod: dorm.pricePeriod,
    paymentSlip: paymentSlip || null,
    paymentStatus: paymentSlip ? 'submitted' : 'pending',
    createdAt: new Date().toISOString(),
    status: 'confirmed'
  };

  data.bookings.push(newBooking);
  saveData(data);

  res.json({
    success: true,
    message: 'การจองหอพักสำเร็จแล้ว!',
    booking: newBooking
  });
});

// POST /api/bookings/:id/payment-slip - Update payment slip for a booking
app.post('/api/bookings/:id/payment-slip', (req, res) => {
  const { paymentSlip } = req.body;
  if (!paymentSlip) {
    return res.status(400).json({ success: false, message: 'กรุณาแนบรูปภาพสลิปโอนเงิน' });
  }

  const data = readData();
  const booking = data.bookings.find(b => b.id === req.params.id && b.status === 'confirmed');

  if (!booking) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการจองนี้' });
  }

  booking.paymentSlip = paymentSlip;
  booking.paymentStatus = 'submitted';
  booking.paymentUploadedAt = new Date().toISOString();

  saveData(data);

  res.json({
    success: true,
    message: 'แนบสลิปการโอนเงินเรียบร้อยแล้ว!',
    booking
  });
});

// GET /api/bookings/search - Search booking by studentId or bookingCode
app.get('/api/bookings/search', (req, res) => {
  const { studentId, bookingCode } = req.query;
  const data = readData();

  let booking = null;
  if (studentId) {
    booking = data.bookings.find(b => b.studentId === studentId.trim() && b.status === 'confirmed');
  } else if (bookingCode) {
    booking = data.bookings.find(b => b.bookingCode === bookingCode.trim() && b.status === 'confirmed');
  }

  if (!booking) {
    return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
  }

  res.json({ success: true, booking });
});

// DELETE /api/bookings/:id - Cancel booking
app.delete('/api/bookings/:id', (req, res) => {
  const data = readData();
  const bookingIndex = data.bookings.findIndex(b => b.id === req.params.id && b.status === 'confirmed');

  if (bookingIndex === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการจองนี้ หรือถูกยกเลิกแล้ว' });
  }

  const booking = data.bookings[bookingIndex];
  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();

  // Free bed
  const dorm = data.dorms.find(d => d.id === booking.dormId);
  if (dorm) {
    const room = dorm.rooms.find(r => r.roomNumber === booking.roomNumber);
    if (room) {
      const bed = room.beds.find(b => b.id === booking.bedId);
      if (bed) {
        bed.isOccupied = false;
        delete bed.occupiedBy;
      }
    }
  }

  // Remove booking record completely from array
  data.bookings.splice(bookingIndex, 1);

  saveData(data);

  res.json({ success: true, message: 'ยกเลิกการจองเรียบร้อยแล้ว' });
});

// GET /api/admin/bookings - List all active confirmed bookings for admin
app.get('/api/admin/bookings', (req, res) => {
  const data = readData();
  const activeBookings = data.bookings.filter(b => b.status === 'confirmed');
  res.json({ success: true, bookings: activeBookings });
});

app.listen(PORT, () => {
  console.log(`SKRU Dormitory Server is running on http://localhost:${PORT}`);
});
