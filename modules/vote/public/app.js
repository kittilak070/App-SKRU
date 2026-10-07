// Rating Labels
const SCORE_DESCRIPTIONS = {
  1: '⭐ ควรปรับปรุง (1 / 5)',
  2: '⭐⭐ พอใช้ (2 / 5)',
  3: '⭐⭐⭐ ปานกลาง (3 / 5)',
  4: '⭐⭐⭐⭐ ดี (4 / 5)',
  5: '⭐⭐⭐⭐⭐ ดีมาก พึงพอใจที่สุด (5 / 5)'
};

let selectedScore = 0;

// DOM Elements
const skruLogo = document.getElementById('skruLogo');
const logoBubble = document.getElementById('logoBubble');
const logoWrapper = document.getElementById('logoWrapper');
const sparkleContainer = document.getElementById('sparkleContainer');
const starButtons = document.querySelectorAll('.star-btn');
const scoreLabel = document.getElementById('scoreLabel');
const commentInput = document.getElementById('commentInput');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const successModal = document.getElementById('successModal');
const resetBtn = document.getElementById('resetBtn');
const toast = document.getElementById('toast');

// --- Interactive Logo Magic ---
const LOGO_MESSAGES = [
  '✨ มหาวิทยาลัยราชภัฏสงขลา',
  '❤️ ขอบคุณที่ร่วมประเมินครับ!',
  '🌟 SKRU เพื่อการพัฒนาท้องถิ่น',
  '🎉 เยี่ยมยอดมากเลยครับ!',
  '💫 มีความสุขทุกวันนะครับ!',
  '⭐ ขอคะแนน 5 ดาวให้เราหน่อยน้า~'
];

const ANIMATION_CLASSES = ['logo-spin', 'logo-bounce', 'logo-wobble', 'logo-pulse'];
let animIndex = 0;
let bubbleTimeout = null;

// Sound synth using Web Audio API (Zero external assets required)
let audioCtx = null;
function playPopSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Play a sweet high crystal tone
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const freq = notes[Math.floor(Math.random() * notes.length)];
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.22);
  } catch (e) {
    // Audio optional fallback
  }
}

// Sparkle emitter
function createSparkles(x, y) {
  const emojis = ['✨', '⭐', '❤️', '🌟', '🎉', '💖'];
  for (let i = 0; i < 6; i++) {
    const dot = document.createElement('span');
    dot.className = 'sparkle-dot';
    dot.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    
    const angle = (i / 6) * 2 * Math.PI + (Math.random() * 0.4);
    const dist = 50 + Math.random() * 40;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const rot = (Math.random() * 360 - 180) + 'deg';
    
    dot.style.setProperty('--tx', `${tx}px`);
    dot.style.setProperty('--ty', `${ty}px`);
    dot.style.setProperty('--rot', rot);
    dot.style.left = '50%';
    dot.style.top = '50%';
    
    sparkleContainer.appendChild(dot);
    setTimeout(() => dot.remove(), 800);
  }
}

// Click Logo Event
if (skruLogo) {
  skruLogo.addEventListener('click', (e) => {
    playPopSound();
    createSparkles();

    // Trigger random / cycling animation
    ANIMATION_CLASSES.forEach(cls => skruLogo.classList.remove(cls));
    const currentAnim = ANIMATION_CLASSES[animIndex % ANIMATION_CLASSES.length];
    animIndex++;
    
    void skruLogo.offsetWidth; // Force reflow
    skruLogo.classList.add(currentAnim);

    // Show Speech Bubble message
    const msg = LOGO_MESSAGES[Math.floor(Math.random() * LOGO_MESSAGES.length)];
    logoBubble.textContent = msg;
    logoBubble.classList.add('show');
    
    if (bubbleTimeout) clearTimeout(bubbleTimeout);
    bubbleTimeout = setTimeout(() => {
      logoBubble.classList.remove('show');
    }, 2200);
  });

  // 3D Tilt effect on hover
  logoWrapper.addEventListener('mousemove', (e) => {
    const rect = logoWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const rotateX = (-y / (rect.height / 2)) * 15;
    const rotateY = (x / (rect.width / 2)) * 15;
    
    skruLogo.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.08)`;
  });

  logoWrapper.addEventListener('mouseleave', () => {
    skruLogo.style.transform = '';
  });
}

// --- Star Rating Interactions ---
starButtons.forEach(btn => {
  const score = parseInt(btn.getAttribute('data-score'), 10);

  // Hover In
  btn.addEventListener('mouseenter', () => {
    highlightStars(score, 'hover-active');
    scoreLabel.textContent = SCORE_DESCRIPTIONS[score];
  });

  // Hover Out
  btn.addEventListener('mouseleave', () => {
    removeHighlight('hover-active');
    updateDisplay();
  });

  // Click / Select
  btn.addEventListener('click', () => {
    selectedScore = score;
    updateDisplay();
  });
});

function highlightStars(count, className) {
  starButtons.forEach(btn => {
    const btnScore = parseInt(btn.getAttribute('data-score'), 10);
    if (btnScore <= count) {
      btn.classList.add(className);
    } else {
      btn.classList.remove(className);
    }
  });
}

function removeHighlight(className) {
  starButtons.forEach(btn => btn.classList.remove(className));
}

function updateDisplay() {
  highlightStars(selectedScore, 'active');
  if (selectedScore > 0) {
    scoreLabel.textContent = SCORE_DESCRIPTIONS[selectedScore];
  } else {
    scoreLabel.textContent = '';
  }
}

// Toast helper
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// =========================================================================
// Live Recorded Feed & Stats
// =========================================================================
const liveAvgScore = document.getElementById('liveAvgScore');
const liveAvgStars = document.getElementById('liveAvgStars');
const liveTotalCount = document.getElementById('liveTotalCount');
const feedItemsList = document.getElementById('feedItemsList');
const btnViewRecords = document.getElementById('btnViewRecords');
const receiptScoreText = document.getElementById('receiptScoreText');
const receiptCommentText = document.getElementById('receiptCommentText');
const receiptTimeText = document.getElementById('receiptTimeText');
const liveFeedSection = document.getElementById('liveFeedSection');

let globalFeedRatings = [];

const SCORE_BADGES = {
  5: { text: 'ดีมาก', class: 'score-badge-5', stars: '★★★★★' },
  4: { text: 'ดี', class: 'score-badge-4', stars: '★★★★☆' },
  3: { text: 'ปานกลาง', class: 'score-badge-3', stars: '★★★☆☆' },
  2: { text: 'พอใช้', class: 'score-badge-2', stars: '★★☆☆☆' },
  1: { text: 'ควรปรับปรุง', class: 'score-badge-1', stars: '★☆☆☆☆' }
};

function formatThaiDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' น.';
  } catch(e) {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

function calculateStats(list) {
  const total = list.length;
  const totalScore = list.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
  const avg = total > 0 ? (totalScore / total).toFixed(1) : '0.0';
  return { total, average: Number(avg) };
}

function renderLiveFeed(stats, list) {
  if (liveTotalCount) liveTotalCount.textContent = stats.total.toLocaleString() + ' รายการ';
  if (liveAvgScore) liveAvgScore.textContent = stats.average.toFixed(1);
  
  if (liveAvgStars) {
    const full = Math.round(stats.average);
    let s = '';
    for (let i = 1; i <= 5; i++) s += (i <= full) ? '★' : '☆';
    liveAvgStars.textContent = s;
  }

  if (!feedItemsList) return;

  if (!list || list.length === 0) {
    feedItemsList.innerHTML = `<div class="feed-empty">ยังไม่มีประวัติการประเมิน เป็นคนแรกที่ให้คะแนนเลย!</div>`;
    return;
  }

  feedItemsList.innerHTML = list.map(item => {
    const score = Number(item.score) || 5;
    const badge = SCORE_BADGES[score] || SCORE_BADGES[5];
    const timeFormatted = formatThaiDate(item.createdAt || item.formattedDate);
    const commentHtml = item.comment 
      ? `<div class="feed-comment">"${escapeHtml(item.comment)}"</div>`
      : `<div class="feed-comment" style="color:#94a3b8; font-style:italic;">(ไม่มีข้อเสนอแนะเพิ่มเติม)</div>`;

    return `
      <div class="feed-item" id="feedItem_${item.id || ''}">
        <div class="feed-item-top">
          <span class="feed-stars">${badge.stars}</span>
          <span class="feed-score-badge ${badge.class}">${badge.text}</span>
        </div>
        ${commentHtml}
        <div class="feed-item-bottom">
          <span class="feed-time">🕒 ${timeFormatted}</span>
          <span class="feed-verified-badge">✓ บันทึกสำเร็จ</span>
        </div>
      </div>
    `;
  }).join('');
}

async function loadLiveFeed() {
  try {
    const response = await fetch('/api/ratings');
    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.ratings || []);
      const stats = data.stats || calculateStats(list);
      globalFeedRatings = list;
      renderLiveFeed(stats, list);
      return;
    }
  } catch (err) {
    console.warn('API error, reading fallback', err);
  }

  // Fallback
  const local = JSON.parse(localStorage.getItem('skru_ratings') || '[]');
  globalFeedRatings = local;
  renderLiveFeed(calculateStats(local), local);
}

// --- Form Submission ---
submitBtn.addEventListener('click', async () => {
  if (selectedScore === 0) {
    showToast('⚠️ กรุณาเลือกดาวเพื่อให้คะแนนความพึงพอใจ');
    const starContainer = document.getElementById('starContainer');
    starContainer.style.animation = 'none';
    starContainer.offsetHeight; // trigger reflow
    starContainer.style.transform = 'scale(1.05)';
    setTimeout(() => {
      starContainer.style.transform = 'scale(1)';
    }, 200);
    return;
  }

  const comment = commentInput.value.trim();

  // Set Loading State
  submitBtn.disabled = true;
  btnText.innerHTML = '<span class="spinner"></span> กำลังส่ง...';

  try {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        score: selectedScore,
        comment: comment
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      const newEntry = result.data || {
        id: 'rate_' + Date.now(),
        score: selectedScore,
        comment: comment,
        createdAt: new Date().toISOString(),
        formattedDate: new Date().toLocaleString('th-TH')
      };

      // Populate Receipt Card in Modal
      const badge = SCORE_BADGES[selectedScore] || SCORE_BADGES[5];
      if (receiptScoreText) receiptScoreText.textContent = `${badge.stars} ${selectedScore}.0 (${badge.text})`;
      if (receiptCommentText) receiptCommentText.textContent = comment ? `"${comment}"` : '(ไม่มีข้อเสนอแนะเพิ่มเติม)';
      if (receiptTimeText) receiptTimeText.textContent = formatThaiDate(newEntry.createdAt);

      // Instantly append to live list
      globalFeedRatings.unshift(newEntry);
      const stats = calculateStats(globalFeedRatings);
      renderLiveFeed(stats, globalFeedRatings);

      const topItem = document.getElementById(`feedItem_${newEntry.id}`);
      if (topItem) topItem.classList.add('just-added');

      // Show Success Modal
      successModal.classList.add('active');
    } else {
      showToast(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  } catch (error) {
    console.warn('Backend server unavailable or network error. Saving to localStorage as fallback.', error);
    
    // Offline / LocalStorage fallback
    const offlineItem = {
      id: 'local_' + Date.now(),
      score: selectedScore,
      comment: comment,
      createdAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleString('th-TH')
    };
    const offlineRatings = JSON.parse(localStorage.getItem('skru_ratings') || '[]');
    offlineRatings.unshift(offlineItem);
    localStorage.setItem('skru_ratings', JSON.stringify(offlineRatings));

    // Populate Receipt Card in Modal
    const badge = SCORE_BADGES[selectedScore] || SCORE_BADGES[5];
    if (receiptScoreText) receiptScoreText.textContent = `${badge.stars} ${selectedScore}.0 (${badge.text})`;
    if (receiptCommentText) receiptCommentText.textContent = comment ? `"${comment}"` : '(ไม่มีข้อเสนอแนะเพิ่มเติม)';
    if (receiptTimeText) receiptTimeText.textContent = formatThaiDate(offlineItem.createdAt);

    globalFeedRatings.unshift(offlineItem);
    renderLiveFeed(calculateStats(globalFeedRatings), globalFeedRatings);

    successModal.classList.add('active');
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'ยืนยัน';
  }
});

// View Recorded List Button in Modal
if (btnViewRecords) {
  btnViewRecords.addEventListener('click', () => {
    successModal.classList.remove('active');
    selectedScore = 0;
    commentInput.value = '';
    updateDisplay();
    setTimeout(() => {
      if (liveFeedSection) {
        liveFeedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  });
}

// Reset Form
resetBtn.addEventListener('click', () => {
  selectedScore = 0;
  commentInput.value = '';
  updateDisplay();
  successModal.classList.remove('active');
});

// Initial Live Feed Load
loadLiveFeed();
