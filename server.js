const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Database
const db = {
  user: {
    id: "USR-661234",
    name: "สมชาย สายเรียน",
    studentId: "6612345678",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=student",
    coins: 1200 // Default initial points
  },
  rewards: [
    {
      id: "rw-01",
      title: "กระเป๋าตรามหาวิทยาลัย (1 ชิ้น)",
      coins: 350,
      stock: 1839,
      validUntil: "31 Dec 2027",
      image: "/assets/backpack.jpg",
      description: "กระเป๋าสุดเท่ คุณภาพสูง เนื้อผ้าหนา ทนทาน\nพร้อมโลโก้มหาวิทยาลัยปักประณีต\nเหมาะสำหรับใส่อุปกรณ์การเรียน หนังสือ และของใช้ส่วนตัว",
      conditions: [
        "จำกัด 1 ใบ ต่อท่าน",
        "แลกรับที่จุดบริการนักศึกษา ชั้น1 โรงอาหาร",
        "ไม่สามารถแลกเปลี่ยนเป็นเงินสดได้",
        "สินค้ามีจำนวนจำกัด"
      ]
    },
    {
      id: "rw-02",
      title: "เสื้อแจ็คเก็ตมหาวิทยาลัย (1 ตัว)",
      coins: 550,
      stock: 240,
      validUntil: "31 Dec 2027",
      image: "/assets/jacket.jpg",
      description: "เสื้อแจ็คเก็ตบอมเบอร์ปักตรามหาวิทยาลัย เนื้อผ้าพรีเมียม ใส่สบาย ป้องกันความเย็นและกันลมได้ดี ดีไซน์ทันสมัย",
      conditions: [
        "จำกัด 1 ตัว ต่อท่าน",
        "เลือกไซส์ (S, M, L, XL, 2XL) ได้ที่จุดรับสินค้า",
        "แลกรับที่จุดบริการนักศึกษา ชั้น1 โรงอาหาร",
        "ไม่สามารถแลกเปลี่ยนเป็นเงินสดได้"
      ]
    }
  ],
  history: []
};

// --- API Routes ---

// Get current user profile and balance
app.get('/api/user', (req, res) => {
  res.json({
    success: true,
    user: db.user
  });
});

// Get all rewards
app.get('/api/rewards', (req, res) => {
  res.json({
    success: true,
    rewards: db.rewards
  });
});

// Get specific reward details
app.get('/api/rewards/:id', (req, res) => {
  const reward = db.rewards.find(r => r.id === req.params.id);
  if (!reward) {
    return res.status(404).json({ success: false, message: "ไม่พบข้อมูลรางวัลนี้" });
  }
  res.json({
    success: true,
    reward
  });
});

// Redeem reward endpoint
app.post('/api/redeem', (req, res) => {
  const { rewardId } = req.body;
  const reward = db.rewards.find(r => r.id === rewardId);

  if (!reward) {
    return res.status(404).json({
      success: false,
      message: "ไม่พบรายการรางวัลที่เลือก"
    });
  }

  // Check stock
  if (reward.stock <= 0) {
    return res.status(400).json({
      success: false,
      message: "ขออภัย สินค้าชิ้นนี้หมดแล้ว"
    });
  }

  // Check user coins balance
  if (db.user.coins < reward.coins) {
    return res.status(400).json({
      success: false,
      message: `จำนวน Coins ไม่เพียงพอ (ต้องการ ${reward.coins} Coins แต่คุณมี ${db.user.coins} Coins)`
    });
  }

  // Deduct coins & stock
  db.user.coins -= reward.coins;
  reward.stock -= 1;

  // Generate unique redemption code & transaction
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const couponCode = `SKRU-${reward.coins}-${randomSuffix}`;
  const transaction = {
    id: `TXN-${Date.now()}`,
    rewardId: reward.id,
    rewardTitle: reward.title,
    rewardImage: reward.image,
    coinsSpent: reward.coins,
    couponCode: couponCode,
    qrData: `REDEEM:${couponCode}:${db.user.studentId}`,
    redeemedAt: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
    status: 'ACTIVE' // ACTIVE, USED
  };

  db.history.unshift(transaction);

  return res.json({
    success: true,
    message: "แลกรับรางวัลสำเร็จ!",
    user: db.user,
    reward: reward,
    transaction: transaction
  });
});

// Get user redemption history
app.get('/api/history', (req, res) => {
  res.json({
    success: true,
    history: db.history
  });
});

// Earn free coins (for testing purpose)
app.post('/api/earn-coins', (req, res) => {
  const amount = req.body.amount || 200;
  db.user.coins += amount;
  res.json({
    success: true,
    message: `ได้รับ ${amount} Coins เรียบร้อย!`,
    coins: db.user.coins
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Reward System Server running on http://localhost:${PORT}`);
});
