// Global Application State
let currentRewardId = 'rw-01';
let currentUser = null;
let currentReward = null;

// Sound Effects via Web Audio API
function playSuccessSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.log('Audio playback prevented or unsupported');
  }
}

// Fetch User Profile
async function fetchUserProfile() {
  try {
    const res = await fetch('/api/user');
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      document.getElementById('userCoinsHeader').textContent = currentUser.coins.toLocaleString();
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
  }
}

// Fetch Reward Details
async function fetchRewardDetail(rewardId) {
  try {
    const res = await fetch(`/api/rewards/${rewardId}`);
    const data = await res.json();
    if (data.success) {
      currentReward = data.reward;
      renderRewardData(currentReward);
    }
  } catch (err) {
    console.error('Error fetching reward details:', err);
  }
}

// Render Reward Details on UI
function renderRewardData(reward) {
  document.getElementById('rewardTitle').textContent = reward.title;
  document.getElementById('rewardImage').src = reward.image;
  document.getElementById('rewardCoins').textContent = reward.coins.toLocaleString();
  document.getElementById('rewardStock').textContent = reward.stock.toLocaleString();
  document.getElementById('rewardValid').textContent = reward.validUntil;
  
  // Format Description
  document.getElementById('rewardDescription').textContent = reward.description;
  
  // Format Conditions
  const conditionsText = Array.isArray(reward.conditions) 
    ? reward.conditions.map(c => `- ${c}`).join('\n')
    : reward.conditions;
  document.getElementById('rewardCondition').textContent = conditionsText;

  // Update button state if out of stock
  const btnRedeem = document.getElementById('btnRedeemAction');
  if (reward.stock <= 0) {
    btnRedeem.disabled = true;
    btnRedeem.textContent = 'สินค้าหมดชั่วคราว';
  } else {
    btnRedeem.disabled = false;
    btnRedeem.textContent = 'แลกรับรางวัล';
  }
}

// Toggle Accordions (Description / Condition)
function toggleAccordion(id) {
  const elem = document.getElementById(id);
  elem.classList.toggle('collapsed');
}

// Perform Redemption
async function handleRedeem() {
  if (!currentReward) return;

  const btnRedeem = document.getElementById('btnRedeemAction');
  btnRedeem.disabled = true;
  btnRedeem.textContent = 'กำลังทำรายการ...';

  try {
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardId: currentReward.id })
    });

    const data = await res.json();

    if (data.success) {
      // Play chime sound effect
      playSuccessSound();

      // Update state
      currentUser = data.user;
      currentReward = data.reward;
      document.getElementById('userCoinsHeader').textContent = currentUser.coins.toLocaleString();
      renderRewardData(currentReward);

      // Open Modal with QR Code & Voucher Code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.transaction.qrData)}`;
      document.getElementById('modalQrImg').src = qrUrl;
      document.getElementById('modalCouponCode').textContent = data.transaction.couponCode;

      document.getElementById('redeemModal').classList.add('active');
    } else {
      alert(data.message || 'ไม่สามารถแลกรับรางวัลได้');
      renderRewardData(currentReward);
    }
  } catch (err) {
    console.error('Error redeeming reward:', err);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    renderRewardData(currentReward);
  }
}

// Fetch Redemption History for "Card" tab
async function fetchHistory() {
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    const container = document.getElementById('historyListContainer');
    
    if (data.success && data.history.length > 0) {
      container.innerHTML = data.history.map(item => `
        <div class="history-item">
          <img class="history-thumb" src="${item.rewardImage}" alt="${item.rewardTitle}">
          <div class="history-details">
            <div class="history-title">${item.rewardTitle}</div>
            <div class="history-code">รหัส: ${item.couponCode}</div>
            <div class="history-date">แลกเมื่อ: ${item.redeemedAt}</div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="text-align: center; color: #999; margin-top: 40px;">ยังไม่มีรายการแลกของรางวัล</p>';
    }
  } catch (err) {
    console.error('Error fetching history:', err);
  }
}

// Earn Free Coins (+200)
async function handleEarnCoins() {
  try {
    const res = await fetch('/api/earn-coins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 200 })
    });
    const data = await res.json();
    if (data.success) {
      currentUser.coins = data.coins;
      document.getElementById('userCoinsHeader').textContent = currentUser.coins.toLocaleString();
      playSuccessSound();
      alert('🎉 ได้รับ 200 Coins เรียบร้อย!');
    }
  } catch (err) {
    console.error('Error earning coins:', err);
  }
}

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchUserProfile();
  fetchRewardDetail(currentRewardId);

  // Redeem Action Button
  document.getElementById('btnRedeemAction').addEventListener('click', handleRedeem);

  // Close Modal Button
  document.getElementById('btnCloseModal').addEventListener('click', () => {
    document.getElementById('redeemModal').classList.remove('active');
  });

  // Earn Coins Button
  document.getElementById('btnEarnCoins').addEventListener('click', handleEarnCoins);

  // Switcher Buttons
  const switcherBtns = document.querySelectorAll('.switcher-btn');
  switcherBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      switcherBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentRewardId = e.target.getAttribute('data-id');
      fetchRewardDetail(currentRewardId);
    });
  });

  // Tab Navigation
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(nav => {
    nav.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = nav.getAttribute('data-tab');
      if (!targetTab) return;

      navItems.forEach(n => n.classList.remove('active'));
      nav.classList.add('active');

      document.querySelectorAll('.tab-view').forEach(tab => tab.classList.remove('active'));
      const activeTabElem = document.getElementById(targetTab);
      if (activeTabElem) {
        activeTabElem.classList.add('active');
      }

      if (targetTab === 'tabHistory') {
        fetchHistory();
      }
    });
  });

  // Pay center button shortcut
  document.getElementById('btnPayCenter').addEventListener('click', () => {
    alert('📷 สแกน QR Code เพื่อชำระเงิน หรือแลกรางวัลที่เคาน์เตอร์');
  });

  // Back button event
  document.getElementById('btnBack').addEventListener('click', () => {
    alert('ย้อนกลับไปยังหน้าหลัก');
  });
});
