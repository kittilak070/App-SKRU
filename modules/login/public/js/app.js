/**
 * SKRU Application Controller
 * Pure Clean Mobile Screen UI Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Screen Panes & Elements
  const paneIntro = document.getElementById('paneIntro');
  const paneLogin = document.getElementById('paneLogin');
  const btnGetStarted = document.getElementById('btnGetStarted');
  const headerLoginTag = document.getElementById('headerLoginTag');
  const screenFrame = document.getElementById('screenFrame');
  const dashboardView = document.getElementById('dashboardView');
  const btnLogout = document.getElementById('btnLogout');

  // Form Elements
  const tabStudent = document.getElementById('tabStudent');
  const tabStaff = document.getElementById('tabStaff');
  const labelIdentifier = document.getElementById('labelIdentifier');
  const inputIdentifier = document.getElementById('inputIdentifier');
  const inputPassword = document.getElementById('inputPassword');
  const wrapperIdentifier = document.getElementById('wrapperIdentifier');
  const wrapperPassword = document.getElementById('wrapperPassword');
  const errorIdentifier = document.getElementById('errorIdentifier');
  const errorPassword = document.getElementById('errorPassword');
  const btnTogglePassword = document.getElementById('btnTogglePassword');
  const eyeIcon = document.getElementById('eyeIcon');
  const checkboxRemember = document.getElementById('checkboxRemember');
  const loginForm = document.getElementById('loginForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const alertBanner = document.getElementById('alertBanner');

  // Modals
  const forgotModal = document.getElementById('forgotModal');
  const btnCloseForgot = document.getElementById('btnCloseForgot');
  const linkForgot = document.getElementById('linkForgot');
  const forgotForm = document.getElementById('forgotForm');

  // State
  let currentRole = 'student';
  let isPasswordVisible = false;
  let isRememberMe = true;
  let lockoutTimer = null;

  // Initialize CSRF Token
  await SkruSecurity.getCsrfToken();

  // Check if active session exists
  checkExistingSession();

  // ========================================================================
  // 1. SCREEN TRANSITIONS (หน้าเริ่มต้นใช้งาน <-> หน้าเข้าสู่ระบบ)
  // ========================================================================
  function showLoginScreen() {
    hideAlert();
    clearFieldErrors();
    paneIntro.classList.remove('active');
    paneLogin.classList.add('active');
    setTimeout(() => inputIdentifier.focus(), 200);
  }

  function showIntroScreen() {
    hideAlert();
    clearFieldErrors();
    paneLogin.classList.remove('active');
    paneIntro.classList.add('active');
  }

  // "เริ่มต้นใช้งาน" Button on Intro Screen -> Transitions to Login Screen
  btnGetStarted.addEventListener('click', showLoginScreen);

  // Clicking "LOGIN" in header -> Toggles back if in login screen or vice-versa
  headerLoginTag.addEventListener('click', () => {
    if (paneLogin.classList.contains('active')) {
      showIntroScreen();
    } else {
      showLoginScreen();
    }
  });

  // ========================================================================
  // 2. ROLE SWITCHER IN LOGIN SCREEN (นักศึกษา VS อาจารย์/บุคลากร)
  // ========================================================================
  function switchRole(role) {
    currentRole = role;
    clearFieldErrors();
    hideAlert();

    if (role === 'student') {
      tabStudent.classList.add('active-student');
      tabStaff.classList.remove('active-staff');
      labelIdentifier.textContent = 'รหัสนักศึกษา หรือ อีเมล (@parichat.skru.ac.th)';
      inputIdentifier.placeholder = '674295027';
      inputIdentifier.setAttribute('autocomplete', 'username');
    } else {
      tabStaff.classList.add('active-staff');
      tabStudent.classList.remove('active-student');
      labelIdentifier.textContent = 'ชื่อผู้ใช้ หรือ อีเมล (@skru.ac.th)';
      inputIdentifier.placeholder = 'somchai.k หรือ user@skru.ac.th';
      inputIdentifier.setAttribute('autocomplete', 'username');
    }

    inputIdentifier.focus();
  }

  tabStudent.addEventListener('click', () => switchRole('student'));
  tabStaff.addEventListener('click', () => switchRole('staff'));

  // ========================================================================
  // 3. PASSWORD VISIBILITY TOGGLE
  // ========================================================================
  btnTogglePassword.addEventListener('click', () => {
    isPasswordVisible = !isPasswordVisible;
    inputPassword.type = isPasswordVisible ? 'text' : 'password';

    if (isPasswordVisible) {
      eyeIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    } else {
      eyeIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    }
  });

  // ========================================================================
  // 4. CHECKBOX REMEMBER ME
  // ========================================================================
  checkboxRemember.addEventListener('click', () => {
    isRememberMe = !isRememberMe;
    checkboxRemember.classList.toggle('checked', isRememberMe);
  });

  // ========================================================================
  // 5. INPUT FOCUS & REAL-TIME SANITIZATION
  // ========================================================================
  [inputIdentifier, inputPassword].forEach((input) => {
    input.addEventListener('focus', () => {
      input.closest('.input-wrapper').classList.add('focused');
    });

    input.addEventListener('blur', () => {
      input.closest('.input-wrapper').classList.remove('focused');
      validateField(input);
    });

    input.addEventListener('input', () => {
      input.value = SkruSecurity.sanitizeInput(input.value);
      clearFieldError(input);
    });
  });

  function validateField(input) {
    if (input === inputIdentifier) {
      const val = input.value.trim();
      if (!val) return;
      const res = currentRole === 'student' 
        ? SkruSecurity.validateStudentIdentifier(val)
        : SkruSecurity.validateStaffIdentifier(val);
      
      if (!res.valid) {
        showFieldError(inputIdentifier, wrapperIdentifier, errorIdentifier, res.message);
      } else {
        clearFieldError(inputIdentifier);
      }
    } else if (input === inputPassword) {
      const val = input.value;
      if (!val) return;
      const res = SkruSecurity.validatePassword(val);
      if (!res.valid) {
        showFieldError(inputPassword, wrapperPassword, errorPassword, res.message);
      } else {
        clearFieldError(inputPassword);
      }
    }
  }

  function showFieldError(input, wrapper, errorEl, message) {
    wrapper.classList.add('error');
    errorEl.innerHTML = `⚠️ <span>${SkruSecurity.escapeHtml(message)}</span>`;
    errorEl.classList.add('show');
  }

  function clearFieldError(input) {
    const wrapper = input.closest('.input-wrapper');
    wrapper.classList.remove('error');
    const errorEl = wrapper.nextElementSibling;
    if (errorEl && errorEl.classList.contains('field-error-text')) {
      errorEl.classList.remove('show');
      errorEl.textContent = '';
    }
  }

  function clearFieldErrors() {
    [wrapperIdentifier, wrapperPassword].forEach(w => w.classList.remove('error'));
    [errorIdentifier, errorPassword].forEach(e => {
      e.classList.remove('show');
      e.textContent = '';
    });
  }

  // ========================================================================
  // 6. ALERT BANNERS & NOTIFICATIONS
  // ========================================================================
  function showAlert(type, message) {
    alertBanner.className = `alert-banner ${type}`;
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : '⚠️';
    alertBanner.innerHTML = `${icon} <span>${SkruSecurity.escapeHtml(message)}</span>`;
    alertBanner.style.display = 'flex';
  }

  function hideAlert() {
    alertBanner.style.display = 'none';
    alertBanner.textContent = '';
  }

  // ========================================================================
  // 7. HANDLE LOGIN FORM SUBMISSION
  // ========================================================================
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    clearFieldErrors();

    const identifierVal = inputIdentifier.value.trim();
    const passwordVal = inputPassword.value;

    let hasError = false;

    const idCheck = currentRole === 'student'
      ? SkruSecurity.validateStudentIdentifier(identifierVal)
      : SkruSecurity.validateStaffIdentifier(identifierVal);

    if (!idCheck.valid) {
      showFieldError(inputIdentifier, wrapperIdentifier, errorIdentifier, idCheck.message);
      hasError = true;
    }

    const passCheck = SkruSecurity.validatePassword(passwordVal);
    if (!passCheck.valid) {
      showFieldError(inputPassword, wrapperPassword, errorPassword, passCheck.message);
      hasError = true;
    }

    if (hasError) {
      wrapperIdentifier.parentElement.classList.add('animate-shake');
      setTimeout(() => wrapperIdentifier.parentElement.classList.remove('animate-shake'), 400);
      return;
    }

    setButtonLoading(true);

    try {
      const csrfToken = await SkruSecurity.getCsrfToken();

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          role: currentRole,
          identifier: identifierVal,
          password: passwordVal,
          rememberMe: isRememberMe
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert('success', 'เข้าสู่ระบบสำเร็จ กำลังเชื่อมต่อระบบบริการดิจิทัล...');
        setTimeout(() => {
          renderDashboard(data.user);
        }, 700);
      } else {
        if (response.status === 423) {
          startLockoutCountdown(data.remainingSeconds || 900);
        } else if (response.status === 429) {
          showAlert('error', data.message || 'ส่งคำขอมากเกินไป กรุณารอสักครู่');
        } else if (data.fields) {
          if (data.fields.identifier) {
            showFieldError(inputIdentifier, wrapperIdentifier, errorIdentifier, data.fields.identifier);
          }
          if (data.fields.password) {
            showFieldError(inputPassword, wrapperPassword, errorPassword, data.fields.password);
          }
          showAlert('error', data.message || 'กรุณาตรวจสอบข้อมูลที่กรอก');
        } else {
          showAlert('error', data.message || 'รหัสประจำตัว หรือ รหัสผ่านไม่ถูกต้อง');
          wrapperPassword.classList.add('error');
        }

        loginForm.classList.add('animate-shake');
        setTimeout(() => loginForm.classList.remove('animate-shake'), 400);
      }
    } catch (err) {
      console.error('Network Error:', err);
      showAlert('error', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    } finally {
      setButtonLoading(false);
    }
  });

  function setButtonLoading(loading) {
    if (loading) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span class="loading-spinner"></span> กำลังเข้าสู่ระบบ...`;
    } else {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `เข้าสู่ระบบ`;
    }
  }

  function startLockoutCountdown(seconds) {
    let remaining = seconds;
    btnSubmit.disabled = true;

    if (lockoutTimer) clearInterval(lockoutTimer);
    showAlert('error', `บัญชีถูกระงับชั่วคราว กรุณารอ ${remaining} วินาที`);

    lockoutTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(lockoutTimer);
        btnSubmit.disabled = false;
        showAlert('warning', 'ท่านสามารถลองเข้าสู่ระบบใหม่อีกครั้งได้แล้ว');
      } else {
        showAlert('error', `บัญชีถูกระงับชั่วคราว กรุณารอ ${remaining} วินาที`);
      }
    }, 1000);
  }

  // ========================================================================
  // 8. FORGOT PASSWORD MODAL
  // ========================================================================
  linkForgot.addEventListener('click', (e) => {
    e.preventDefault();
    forgotModal.style.display = 'flex';
  });

  btnCloseForgot.addEventListener('click', () => {
    forgotModal.style.display = 'none';
  });

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const forgotInput = document.getElementById('forgotIdentifier');
    const val = forgotInput.value.trim();
    if (!val) return;

    const btnForgotSubmit = document.getElementById('btnForgotSubmit');
    btnForgotSubmit.disabled = true;
    btnForgotSubmit.innerHTML = `<span class="loading-spinner"></span> กำลังส่งคำขอ...`;

    try {
      const csrfToken = await SkruSecurity.getCsrfToken();
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          role: currentRole,
          identifier: val
        })
      });
      const data = await res.json();
      alert(data.message);
      forgotModal.style.display = 'none';
      forgotInput.value = '';
    } catch (err) {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      btnForgotSubmit.disabled = false;
      btnForgotSubmit.innerHTML = `ส่งลิงก์รีเซ็ตรหัสผ่าน`;
    }
  });

  window.addEventListener('click', (e) => {
    if (e.target === forgotModal) forgotModal.style.display = 'none';
  });

  // ========================================================================
  // 9. POST-LOGIN DASHBOARD VIEW
  // ========================================================================
  async function checkExistingSession() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        renderDashboard(data.user);
      }
    } catch (err) {
      // Not logged in
    }
  }

  function renderDashboard(user) {
    screenFrame.style.display = 'none';
    dashboardView.style.display = 'block';

    const name = document.getElementById('dashName');
    const roleBadge = document.getElementById('dashRole');
    const email = document.getElementById('dashEmail');
    const details = document.getElementById('dashDetails');

    name.textContent = user.fullName || user.username;
    roleBadge.textContent = user.role === 'student' ? 'นักศึกษา' : 'อาจารย์ / บุคลากร';
    email.textContent = user.email;

    if (user.role === 'student') {
      details.innerHTML = `
        <div style="background: #f8fafc; padding: 18px; border-radius: 14px; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b;">รหัสประจำตัวนักศึกษา</div>
          <div style="font-size: 17px; font-weight: 700; color: #0f172a;">${user.studentId}</div>
          <div style="font-size: 13.5px; color: #334155; margin-top: 4px;">${user.faculty} - ${user.major}</div>
          <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 14px; font-size: 12.5px; color: #0284c7; font-weight: 600;">
            <span>ชั้นปี: ${user.year || 'ปี 3'}</span>
            <span>เกรดเฉลี่ยสะสม (GPA): ${user.gpa || '3.78'}</span>
            <span style="color: #16a34a;">สถานะ: ${user.status || 'กำลังศึกษา'}</span>
          </div>
        </div>
      `;
    } else {
      details.innerHTML = `
        <div style="background: #f8fafc; padding: 18px; border-radius: 14px; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b;">ตำแหน่ง / ภาควิชา</div>
          <div style="font-size: 17px; font-weight: 700; color: #0f172a;">${user.position || 'อาจารย์ประจำสาขา'}</div>
          <div style="font-size: 13.5px; color: #334155; margin-top: 4px;">${user.department} - ${user.faculty}</div>
          <div style="margin-top: 10px; font-size: 12.5px; color: #16a34a; font-weight: 600;">
            สถานะ: ${user.status || 'ปฏิบัติงาน'}
          </div>
        </div>
      `;
    }
  }

  btnLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      dashboardView.style.display = 'none';
      screenFrame.style.display = 'flex';
      showLoginScreen();
      inputPassword.value = '';
      showAlert('success', 'ออกจากระบบเรียบร้อยแล้ว');
    } catch (err) {
      location.reload();
    }
  });
});
