// SKRU Rewards Logic
let userPoints = 1450;

const rewardsData = [
  {
    id: 'R01',
    title: 'โควตาพิมพ์เอกสาร 100 แผ่น',
    category: 'supplies',
    points: 150,
    desc: 'ใช้พิมพ์เอกสารหรือรายงานที่ศูนย์คอมพิวเตอร์และห้องสมุด SKRU',
    icon: 'fa-solid fa-print',
    badge: 'ยอดนิยม'
  },
  {
    id: 'R02',
    title: 'คูปองอาหารโรงอาหารกลาง 50 บาท',
    category: 'food',
    points: 200,
    desc: 'ใช้แทนเงินสดได้ทุกร้านค้าในโรงอาหารกลาง SKRU',
    icon: 'fa-solid fa-utensils',
    badge: 'สุดคุ้ม'
  },
  {
    id: 'R03',
    title: 'ส่วนลดเครื่องดื่ม SKRU Cafe 30 บาท',
    category: 'food',
    points: 120,
    desc: 'ใช้เป็นส่วนลดเมนูเครื่องดื่มทุกเมนูที่ร้านกาแฟมหาวิทยาลัย',
    icon: 'fa-solid fa-mug-hot',
    badge: ''
  },
  {
    id: 'R04',
    title: 'เสื้อยืดที่ระลึกครบรอบ SKRU',
    category: 'souvenir',
    points: 800,
    desc: 'เสื้อยืด Cotton 100% สกรีนลายพิเศษรุ่นจำกัด (ระบุไซส์ตอนรับ)',
    icon: 'fa-solid fa-shirt',
    badge: 'Limited'
  },
  {
    id: 'R05',
    title: 'เข็มกลัดตราสัญลักษณ์ มรภ.สงขลา',
    category: 'souvenir',
    points: 350,
    desc: 'เข็มกลัดชุบทองลงยา ตราสัญลักษณ์มหาวิทยาลัยราชภัฏสงขลา',
    icon: 'fa-solid fa-award',
    badge: ''
  },
  {
    id: 'R06',
    title: 'สิทธิ์จองห้องติวกลุ่มย่อยพิเศษ 3 ชม.',
    category: 'privilege',
    points: 250,
    desc: 'จองห้อง Study Room ชั้น 3 หอสมุดล่วงหน้าได้แบบ Exclusive',
    icon: 'fa-solid fa-chalkboard-user',
    badge: 'แนะนำ'
  },
  {
    id: 'R07',
    title: 'แฟลชไดรฟ์ SKRU 64GB USB 3.2',
    category: 'supplies',
    points: 600,
    desc: 'อุปกรณ์จัดเก็บข้อมูลความเร็วสูง เลเซอร์โลโก้ SKRU สวยงาม',
    icon: 'fa-solid fa-hard-drive',
    badge: ''
  },
  {
    id: 'R08',
    title: 'บัตรจอดรถยนต์โซนพิเศษ 1 สัปดาห์',
    category: 'privilege',
    points: 500,
    desc: 'สิทธิ์จอดรถยนต์ในช่องจอดใกล้อาคารเรียนรวมสำหรับนักศึกษา',
    icon: 'fa-solid fa-square-parking',
    badge: ''
  }
];

let myVouchers = [
  {
    id: 'VOUCHER-9821',
    rewardTitle: 'ส่วนลดเครื่องดื่ม SKRU Cafe 30 บาท',
    code: 'CAFE-SKRU-9821',
    expiry: '15 พ.ย. 2569',
    status: 'พร้อมใช้งาน'
  },
  {
    id: 'VOUCHER-7612',
    rewardTitle: 'โควตาพิมพ์เอกสาร 100 แผ่น',
    code: 'PRINT-100-7612',
    expiry: '30 ธ.ค. 2569',
    status: 'พร้อมใช้งาน'
  }
];

let historyLog = [
  {
    date: '01/10/2026 14:20',
    title: 'ส่วนลดเครื่องดื่ม SKRU Cafe 30 บาท',
    cat: 'อาหารและเครื่องดื่ม',
    points: -120,
    status: 'สำเร็จ'
  },
  {
    date: '28/09/2026 10:15',
    title: 'โควตาพิมพ์เอกสาร 100 แผ่น',
    cat: 'การเรียน',
    points: -150,
    status: 'สำเร็จ'
  },
  {
    date: '20/09/2026 09:00',
    title: 'เข้าร่วมกิจกรรมปฐมนิเทศชมรม',
    cat: 'สะสมแต้ม',
    points: 200,
    status: 'ได้รับคะแนน'
  }
];

let selectedReward = null;

document.addEventListener('DOMContentLoaded', () => {
  const currentPointsEl = document.getElementById('currentPoints');
  const rewardsGrid = document.getElementById('rewardsGrid');
  const vouchersList = document.getElementById('vouchersList');
  const historyTableBody = document.getElementById('historyTableBody');
  const myVouchersCount = document.getElementById('myVouchersCount');
  const redeemedCount = document.getElementById('redeemedCount');

  const tabButtons = document.querySelectorAll('.tab-btn');
  const filterChips = document.querySelectorAll('.filter-chip');

  const redeemModal = document.getElementById('redeemModal');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelRedeemBtn = document.getElementById('cancelRedeemBtn');
  const confirmRedeemBtn = document.getElementById('confirmRedeemBtn');

  function renderPoints() {
    currentPointsEl.textContent = userPoints.toLocaleString();
    myVouchersCount.textContent = `${myVouchers.length} ใบ`;
    redeemedCount.textContent = `${historyLog.filter(h => h.points < 0).length} รายการ`;
  }

  function renderCatalog(filter = 'all') {
    rewardsGrid.innerHTML = '';
    const filtered = filter === 'all' ? rewardsData : rewardsData.filter(r => r.category === filter);

    filtered.forEach(item => {
      const canAfford = userPoints >= item.points;
      const card = document.createElement('div');
      card.className = 'reward-card';
      card.innerHTML = `
        <div class="reward-image-box">
          <i class="${item.icon}"></i>
          ${item.badge ? `<span class="reward-badge">${item.badge}</span>` : ''}
        </div>
        <div class="reward-info">
          <h4>${item.title}</h4>
          <p>${item.desc}</p>
          <div class="reward-bottom">
            <span class="reward-cost">${item.points.toLocaleString()} <small>pts</small></span>
            <button class="btn-redeem" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
              ${canAfford ? 'แลกรางวัล' : 'คะแนนไม่พอ'}
            </button>
          </div>
        </div>
      `;
      rewardsGrid.appendChild(card);
    });

    // Attach click events
    rewardsGrid.querySelectorAll('.btn-redeem').forEach(btn => {
      btn.addEventListener('click', () => {
        const rId = btn.dataset.id;
        openRedeemModal(rId);
      });
    });
  }

  function renderVouchers() {
    vouchersList.innerHTML = '';
    if (myVouchers.length === 0) {
      vouchersList.innerHTML = '<p style="color:#64748b;">คุณยังไม่มีคูปองของรางวัล กดแลกได้ที่แท็บแคตตาล็อก</p>';
      return;
    }

    myVouchers.forEach(v => {
      const card = document.createElement('div');
      card.className = 'voucher-card';
      card.innerHTML = `
        <div class="voucher-info">
          <h4>${v.rewardTitle}</h4>
          <p><i class="fa-regular fa-clock"></i> หมดอายุ: ${v.expiry}</p>
          <span class="voucher-code">${v.code}</span>
        </div>
        <button class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="alert('แสดงรหัสนี้แก่เจ้าหน้าที่: ${v.code}')">
          <i class="fa-solid fa-qrcode"></i> ใช้งาน
        </button>
      `;
      vouchersList.appendChild(card);
    });
  }

  function renderHistory() {
    historyTableBody.innerHTML = '';
    historyLog.forEach(h => {
      const tr = document.createElement('tr');
      const isDeduct = h.points < 0;
      tr.innerHTML = `
        <td>${h.date}</td>
        <td><strong>${h.title}</strong></td>
        <td>${h.cat}</td>
        <td style="color: ${isDeduct ? '#ef4444' : '#10b981'}; font-weight: 600;">
          ${isDeduct ? h.points : '+' + h.points} pts
        </td>
        <td><span class="badge-success">${h.status}</span></td>
      `;
      historyTableBody.appendChild(tr);
    });
  }

  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderCatalog(chip.dataset.cat);
    });
  });

  // Tab switching
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      tabButtons.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = tab.dataset.tab;
      if (target === 'catalog') {
        document.getElementById('catalogTab').classList.add('active');
      } else if (target === 'my-rewards') {
        document.getElementById('myRewardsTab').classList.add('active');
        renderVouchers();
      } else if (target === 'history') {
        document.getElementById('historyTab').classList.add('active');
        renderHistory();
      }
    });
  });

  function openRedeemModal(rewardId) {
    selectedReward = rewardsData.find(r => r.id === rewardId);
    if (!selectedReward) return;

    modalBody.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <i class="${selectedReward.icon}" style="font-size: 3rem; color: #6366f1; margin-bottom: 8px;"></i>
        <h4>${selectedReward.title}</h4>
        <p style="color: #64748b; font-size: 0.85rem; margin-top: 4px;">${selectedReward.desc}</p>
      </div>
      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 0.85rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
          <span>คะแนนปัจจุบัน:</span>
          <strong>${userPoints.toLocaleString()} pts</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 4px; color: #ef4444;">
          <span>คะแนนที่ใช้:</span>
          <strong>-${selectedReward.points.toLocaleString()} pts</strong>
        </div>
        <hr style="border:0; border-top:1px dashed #cbd5e1; margin: 6px 0;">
        <div style="display:flex; justify-content:space-between; font-weight:700;">
          <span>คะแนนคงเหลือ:</span>
          <strong style="color: #6366f1;">${(userPoints - selectedReward.points).toLocaleString()} pts</strong>
        </div>
      </div>
    `;

    redeemModal.style.display = 'flex';
  }

  function closeModal() {
    redeemModal.style.display = 'none';
    selectedReward = null;
  }

  closeModalBtn.addEventListener('click', closeModal);
  cancelRedeemBtn.addEventListener('click', closeModal);

  confirmRedeemBtn.addEventListener('click', () => {
    if (!selectedReward || userPoints < selectedReward.points) return;

    userPoints -= selectedReward.points;
    const newVoucher = {
      id: 'VOUCHER-' + Math.floor(1000 + Math.random() * 9000),
      rewardTitle: selectedReward.title,
      code: 'SKRU-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      expiry: '31 ธ.ค. 2569',
      status: 'พร้อมใช้งาน'
    };
    myVouchers.unshift(newVoucher);

    historyLog.unshift({
      date: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      title: selectedReward.title,
      cat: selectedReward.category,
      points: -selectedReward.points,
      status: 'สำเร็จ'
    });

    closeModal();
    renderPoints();
    renderCatalog();
    alert(`🎉 แลกรางวัล "${newVoucher.rewardTitle}" สำเร็จ!\nรหัสคูปองของคุณคือ: ${newVoucher.code}`);
  });

  // Initial render
  renderPoints();
  renderCatalog();
  renderVouchers();
  renderHistory();
});
