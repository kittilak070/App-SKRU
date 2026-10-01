// Global State Object
let state = {
  notifications: {},
  subscriptions: {},
  security: {},
  privacy: {},
  general: {}
};

// Consent descriptions mapping
const consentData = {
  product_improvement: {
    title: 'ความยินยอมเพื่อพัฒนาผลิตภัณฑ์',
    desc: 'ยินยอมให้เรารวบรวมและวิเคราะห์ข้อมูลการใช้งานของคุณเพื่อพัฒนา นำเสนอ ฟีเจอร์ที่ดียิ่งขึ้น ประสิทธิภาพที่สูงขึ้น และบริการที่ตรงความต้องการของคุณมากที่สุด'
  },
  product_marketing: {
    title: 'ความยินยอมเสนอผลิตภัณฑ์และบริการ',
    desc: 'ยินยอมให้เรานำเสนอข่าวสาร โปรโมชั่น สิทธิพิเศษ สิทธิประโยชน์ และข้อเสนอผลิตภัณฑ์/บริการที่เหมาะสมแก่ท่านโดยตรง'
  },
  partner_marketing: {
    title: 'ความยินยอมให้กลุ่มธุรกิจทางการเงิน',
    desc: 'ยินยอมให้เปิดเผยข้อมูลแก่บริษัทพันธมิตรในกลุ่มธุรกิจทางการเงินเพื่อนำเสนอผลิตภัณฑ์ทางการเงิน สินเชื่อ สิทธิพิเศษ การลงทุน และประกันภัย'
  }
};

let currentConsentKey = null;
let currentSubKey = null;
let pinCode = '';

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 30000);

  // Fetch initial settings from Node.js backend API
  loadSettingsFromBackend();

  // Setup Toggle Switch Listeners
  setupToggleListeners();

  // Setup Subscription Detail Toggle Listener
  const subDetailToggle = document.getElementById('subDetailToggle');
  if (subDetailToggle) {
    subDetailToggle.addEventListener('change', async (e) => {
      if (!currentSubKey) return;
      const isChecked = e.target.checked;
      state.subscriptions[currentSubKey] = isChecked;

      // Update badge in the list
      updateSubBadge(currentSubKey, isChecked);

      // Send PUT request to Node.js backend
      try {
        const response = await fetch('/api/settings/subscriptions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [currentSubKey]: isChecked, ...state.subscriptions })
        });
        const resData = await response.json();

        if (resData.success) {
          showToast(`อัปเดตการรับข่าวสารสำเร็จ`);
        }
      } catch (err) {
        console.error('API Save Error:', err);
        showToast('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
      }
    });
  }

  // Desktop view tab listeners
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const screenTarget = btn.getAttribute('data-screen');
      navigateTo(screenTarget);
    });
  });

  // API Sync button listener
  const btnSync = document.getElementById('btnSync');
  if (btnSync) {
    btnSync.addEventListener('click', () => {
      btnSync.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...';
      loadSettingsFromBackend().then(() => {
        setTimeout(() => {
          btnSync.innerHTML = '<i class="fa-solid fa-rotate-right"></i> ดึงข้อมูล API';
          showToast('ดึงข้อมูลล่าสุดจาก API เรียบร้อยแล้ว');
        }, 300);
      });
    });
  }
});

// Update top status bar clock
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeElem = document.getElementById('currentTime');
  if (timeElem) {
    timeElem.textContent = `${hours}:${minutes}`;
  }
}

// Fetch Settings from Node.js Express backend API
async function loadSettingsFromBackend() {
  try {
    const response = await fetch('/api/settings');
    const result = await response.json();

    if (result.success) {
      state = result.data;
      renderUIFromState();
    } else {
      showToast('ไม่สามารถดึงข้อมูลการตั้งค่าได้');
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showToast('เชื่อมต่อ Backend ไม่สำเร็จ');
  }
}

// Render values into DOM toggles and badges
function renderUIFromState() {
  // 1. Notifications
  if (state.notifications) {
    Object.keys(state.notifications).forEach(key => {
      const checkbox = document.getElementById(`notif-${key}`);
      if (checkbox) {
        checkbox.checked = !!state.notifications[key];
      }
    });
  }

  // 2. Subscriptions (Update badges)
  if (state.subscriptions) {
    Object.keys(state.subscriptions).forEach(key => {
      updateSubBadge(key, !!state.subscriptions[key]);
    });
  }

  // 3. Security
  if (state.security) {
    Object.keys(state.security).forEach(key => {
      const checkbox = document.getElementById(`sec-${key}`);
      if (checkbox) {
        checkbox.checked = !!state.security[key];
      }
    });
  }

  // 4. General
  if (state.general) {
    const langBadge = document.getElementById('currentLangBadge');
    if (langBadge) {
      langBadge.textContent = state.general.language === 'en' ? 'English' : 'ไทย';
    }
    const appVersion = document.getElementById('appVersion');
    if (appVersion && state.general.version) {
      appVersion.textContent = `version ${state.general.version}`;
    }
  }
}

// Helper to update subscription badge state
function updateSubBadge(key, isChecked) {
  const badge = document.getElementById(`badge-${key}`);
  if (badge) {
    badge.textContent = isChecked ? 'เปิด' : 'ปิด';
    if (isChecked) {
      badge.classList.add('active');
    } else {
      badge.classList.remove('active');
    }
  }
}

// Open Subscription Detail Screen (Matching Image 2)
function openSubscriptionDetail(key, title) {
  currentSubKey = key;
  const isChecked = !!(state.subscriptions && state.subscriptions[key]);

  document.getElementById('subDetailHeaderTitle').textContent = title;
  document.getElementById('subDetailItemName').textContent = title;

  const toggle = document.getElementById('subDetailToggle');
  if (toggle) {
    toggle.checked = isChecked;
  }

  navigateTo('subscription-detail');
}

// Bind toggle events to auto-save to backend
function setupToggleListeners() {
  document.querySelectorAll('input[type="checkbox"][data-cat]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const category = e.target.getAttribute('data-cat');
      const key = e.target.getAttribute('data-key');
      const isChecked = e.target.checked;

      // Special case: Notification Master toggle
      if (category === 'notifications' && key === 'all_notifications') {
        document.querySelectorAll('input[data-cat="notifications"]').forEach(subInput => {
          if (subInput.getAttribute('data-key') !== 'all_notifications') {
            subInput.checked = isChecked;
            const subKey = subInput.getAttribute('data-key');
            state.notifications[subKey] = isChecked;
          }
        });
      }

      // Update state locally
      if (!state[category]) state[category] = {};
      state[category][key] = isChecked;

      // Send PUT request to Node.js backend
      try {
        const response = await fetch(`/api/settings/${category}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ [key]: isChecked, ...state[category] })
        });
        const resData = await response.json();

        if (resData.success) {
          showToast('บันทึกการตั้งค่าแล้ว');
        } else {
          showToast('เกิดข้อผิดพลาดในการบันทึก');
        }
      } catch (err) {
        console.error('API Save Error:', err);
        showToast('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
      }
    });
  });
}

// Navigation between screens
function navigateTo(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(scr => {
    scr.classList.remove('active');
  });

  // Show target screen
  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    target.classList.add('active');
    // Scroll viewport to top
    const viewport = document.querySelector('.screen-viewport');
    if (viewport) viewport.scrollTop = 0;
  }

  // Update desktop view controls tab highlight
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-screen') === screenId) {
      btn.classList.add('active');
    }
  });

  // Update bottom nav active state
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  const settingsNav = document.querySelector('.nav-item:last-child');
  if (settingsNav) settingsNav.classList.add('active');

  // Hide bottom navigation bar on terms & contact screens
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    if (screenId === 'terms' || screenId === 'contact') {
      bottomNav.style.display = 'none';
    } else {
      bottomNav.style.display = 'flex';
    }
  }
}

// Toast notification display
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

// Modal handling
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
  if (modalId === 'modal-pin') {
    resetPinKeypad();
  }
}

// Privacy Consent Screen Mappings (Matching Images 1, 2, 3)
const privacyConsentMap = {
  product_improvement: {
    bannerTitle: 'ความยินยอมให้เราพัฒนาและปรับปรุงผลิตภัณฑ์และการให้บริการที่ดียิ่งขึ้นแก่ท่าน',
    bodyText: '1. เพื่อให้ท่านได้รับสิ่งที่ตรงและถูกใจมากยิ่งขึ้น จากการทำข้อมูลสถิติวิเคราะห์ วิจัย พัฒนา และปรับปรุงผลิตภัณฑ์หรือบริการของเรา ท่านยินยอมให้เราเก็บรวบรวม ใช้ และเปิดเผยข้อมูล',
    noticeHtml: 'ท่านสามารถดูรายละเอียดการจัดการข้อมูลส่วนบุคคลของธนาคารในนโยบายความเป็นส่วนตัวที่ <a href="https://krungthai.com/th/content/privacy-policy" target="_blank" onclick="event.preventDefault()">https://krungthai.com/th/content/privacy-policy</a>'
  },
  product_marketing: {
    bannerTitle: 'ความยินยอมให้เรานำเสนอผลิตภัณฑ์และบริการ',
    bodyText: '1. เพื่อให้ท่านไม่พลาดสิทธิพิเศษสำหรับท่าน ด้านข้อเสนอผลิตภัณฑ์ ข่าวสาร และบริการ ท่านยินยอมให้เราเก็บรวบรวม ใช้ และเปิดเผยข้อมูล',
    noticeHtml: 'ท่านสามารถดูรายละเอียดการจัดการข้อมูลส่วนบุคคลของธนาคารในนโยบายความเป็นส่วนตัวที่ <a href="https://krungthai.com/th/content/privacy-policy" target="_blank" onclick="event.preventDefault()">https://krungthai.com/th/content/privacy-policy</a>'
  },
  partner_marketing: {
    bannerTitle: 'ความยินยอมให้กลุ่มธุรกิจทางการเงินนำเสนอผลิตภัณฑ์และบริการ',
    bodyText: '1. เพื่อให้ท่านไม่พลาดสิทธิพิเศษสำหรับท่าน ด้านข้อเสนอผลิตภัณฑ์ ข่าวสาร และบริการ จากกลุ่มธุรกิจทางการเงิน ท่านยินยอมให้เราเก็บรวบรวม ใช้ และเปิดเผยข้อมูล',
    noticeHtml: 'กลุ่มธุรกิจทางการเงิน สามารถอ้างอิงรายชื่อบริษัทดังกล่าวได้ที่ <a href="https://krungthai.com/th/about-ktb/group-shareholding" target="_blank" onclick="event.preventDefault()">https://krungthai.com/th/about-ktb/group-shareholding</a>หากมีการเพิ่มเติมผู้รับข้อมูลในภายหลัง เราจะแจ้งให้ท่านทราบบนเว็บไซต์ของเรา ทั้งนี้ รายชื่อดังกล่าวอาจมีการเพิ่มขึ้นหรือลดลงได้ในอนาคต โดยในกรณีเพิ่มขึ้นธนาคารจะแจ้งรายชื่อที่เพิ่มขึ้นให้ท่านทราบล่วงหน้าพร้อมแจ้งช่องทางในการยกเลิกหรือถอนความยินยอม เป็นหนังสือหรือผ่านทางแอปพลิเคชันมือถือ (เช่นNext เป๋าตัง) หรือไปรษณีย์ทางอิเล็กทรอนิกส์ (email) หรือข้อความทางโทรศัพท์ (SMS) หรือช่องทางอื่นตามที่ธนาคารเห็นสมควร ทั้งนี้หากท่านมีข้อสงสัยเกี่ยวกับรายชื่อผู้รับข้อมูล หรือต้องการยกเลิกการติดต่อจากผู้รับข้อมูล ท่านสามารถตรวจสอบได้ผ่านทางแอปพลิเคชันมือถือ (เช่น Nextเป๋าตัง) ติดต่อธนาคารผ่านทางศูนย์ลูกค้าสัมพันธ์ : Krungthai Contact Center : 02-111-1111'
  }
};

let currentPrivacyConsentKey = null;

// Open Privacy Consent Detail Screen
function openPrivacyConsentScreen(consentKey) {
  currentPrivacyConsentKey = consentKey;
  const config = privacyConsentMap[consentKey];
  if (!config) return;

  document.getElementById('privacyBannerTitle').textContent = config.bannerTitle;
  document.getElementById('privacyBodyText').textContent = config.bodyText;
  document.getElementById('privacyFooterNotice').innerHTML = config.noticeHtml;

  const isAgreed = !!(state.privacy && state.privacy[consentKey]);
  document.getElementById('radioAgree').checked = isAgreed;
  document.getElementById('radioDisagree').checked = !isAgreed;

  navigateTo('privacy-detail');
}

// Save Privacy Consent
async function savePrivacyConsent() {
  if (!currentPrivacyConsentKey) return;
  const isAgreed = document.getElementById('radioAgree').checked;

  state.privacy[currentPrivacyConsentKey] = isAgreed;

  try {
    const response = await fetch('/api/settings/privacy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [currentPrivacyConsentKey]: isAgreed, ...state.privacy })
    });
    const resData = await response.json();
    if (resData.success) {
      showToast('บันทึกการตั้งค่าแล้ว');
      navigateTo('privacy');
    }
  } catch (err) {
    console.error(err);
    showToast('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
  }
}

// Language Selection
async function selectLanguage(langCode) {
  state.general.language = langCode;

  // Update UI visuals in modal
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.classList.remove('selected');
    const checkIcon = opt.querySelector('.fa-check');
    if (checkIcon) checkIcon.style.display = 'none';
  });

  const selectedOpt = event.currentTarget;
  if (selectedOpt) {
    selectedOpt.classList.add('selected');
    const checkIcon = selectedOpt.querySelector('.fa-check');
    if (checkIcon) checkIcon.style.display = 'inline-block';
  }

  // Save to backend
  try {
    await fetch('/api/settings/general', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: langCode })
    });
  } catch (e) {
    console.error(e);
  }

  renderUIFromState();
  closeModal('modal-language');
  showToast(`เปลี่ยนภาษาเป็น ${langCode === 'en' ? 'English' : 'ภาษาไทย'} แล้ว`);
}

// Privacy Consent Modal detail view
function openConsentDetail(consentKey) {
  currentConsentKey = consentKey;
  const itemData = consentData[consentKey] || {
    title: 'ความยินยอม',
    desc: 'รายละเอียดการให้ความยินยอมข้อมูลส่วนบุคคล'
  };

  document.getElementById('consentTitle').textContent = itemData.title;
  document.getElementById('consentDesc').textContent = itemData.desc;

  const isChecked = !!state.privacy[consentKey];
  document.getElementById('consentToggleInput').checked = isChecked;

  openModal('modal-consent');
}

async function saveConsentModal() {
  if (!currentConsentKey) return;
  const isChecked = document.getElementById('consentToggleInput').checked;

  state.privacy[currentConsentKey] = isChecked;

  try {
    const response = await fetch('/api/settings/privacy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [currentConsentKey]: isChecked, ...state.privacy })
    });
    const data = await response.json();
    if (data.success) {
      showToast('อัปเดตความยินยอมเรียบร้อย');
    }
  } catch (e) {
    console.error(e);
    showToast('เกิดข้อผิดพลาดในการบันทึก');
  }

  closeModal('modal-consent');
}

// PIN Keypad Simulation
function pressKey(digit) {
  if (pinCode.length < 6) {
    pinCode += digit;
    updatePinDots();
  }

  if (pinCode.length === 6) {
    setTimeout(() => {
      showToast('ยืนยันรหัส PIN สำเร็จ');
      closeModal('modal-pin');
    }, 200);
  }
}

function clearKey() {
  if (pinCode.length > 0) {
    pinCode = pinCode.slice(0, -1);
    updatePinDots();
  }
}

function resetPinKeypad() {
  pinCode = '';
  updatePinDots();
}

function updatePinDots() {
  const dots = document.querySelectorAll('.pin-dots .dot');
  dots.forEach((dot, idx) => {
    if (idx < pinCode.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

// Reset PIN confirmation logic
async function confirmResetPin() {
  closeModal('modal-reset-pin');
  state.security.pin_set = false;
  try {
    await fetch('/api/settings/security', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin_set: false })
    });
  } catch (e) {
    console.error(e);
  }
  showToast('รีเซ็ต PIN สำเร็จแล้ว (กำลังออกจากระบบ...)');
}
