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

// --- Form Submission ---
submitBtn.addEventListener('click', async () => {
  if (selectedScore === 0) {
    showToast('⚠️ กรุณาเลือกดาวเพื่อให้คะแนนความพึงพอใจ');
    // Shake star container
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
      // Show Success Modal
      successModal.classList.add('active');
    } else {
      showToast(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  } catch (error) {
    console.warn('Backend server unavailable or network error. Saving to localStorage as fallback.', error);
    
    // Offline / LocalStorage fallback
    const offlineRatings = JSON.parse(localStorage.getItem('skru_ratings') || '[]');
    offlineRatings.unshift({
      id: 'local_' + Date.now(),
      score: selectedScore,
      comment: comment,
      createdAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleString('th-TH')
    });
    localStorage.setItem('skru_ratings', JSON.stringify(offlineRatings));

    successModal.classList.add('active');
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'ยืนยัน';
  }
});

// Reset Form
resetBtn.addEventListener('click', () => {
  selectedScore = 0;
  commentInput.value = '';
  updateDisplay();
  successModal.classList.remove('active');
});
