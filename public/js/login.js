/**
 * SKRU Login Page Controller
 * Handles authentication, validation, CSRF, and lockout mechanics
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
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

  // Quick Demo Chips
  const chipStudent = document.getElementById('chipStudent');
  const chipStaff = document.getElementById('chipStaff');

  // Modals
  const forgotModal = document.getElementById('forgotModal');
  const btnCloseForgot = document.getElementById('btnCloseForgot');
  const linkForgot = document.getElementById('linkForgot');
  const forgotForm = document.getElementById('forgotForm');
  const btnSecurityInspector = document.getElementById('btnSecurityInspector');
  const securityModal = document.getElementById('securityModal');
  const btnCloseSecurity = document.getElementById('btnCloseSecurity');

  // State
  let currentRole = 'student';
  let isPasswordVisible = false;
  let isRememberMe = true;
  let lockoutTimer = null;

  // Initialize CSRF
  await SkruSecurity.getCsrfToken();

  // 1. Role Switching
  tabStudent.addEventListener('click', () => switchRole('student'));
  tabStaff.addEventListener('click', () => switchRole('staff'));

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

  // 2. Toggle Password
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

  // 3. Remember Me Checkbox
  checkboxRemember.addEventListener('click', () => {
    isRememberMe = !isRememberMe;
    checkboxRemember.classList.toggle('checked', isRememberMe);
  });

  // 4. Input Focus & Real-time Sanitization
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

  // 5. Alert Banners
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

  // 6. Handle Form Submission
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
        showAlert('success', 'เข้าสู่ระบบสำเร็จ กำลังนำท่านเข้าสู่ระบบบริการดิจิทัล...');
        setTimeout(() => {
          window.location.href = '/dashboard';
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

  // 7. Quick Demo Chips
  chipStudent.addEventListener('click', () => {
    switchRole('student');
    inputIdentifier.value = '674295027';
    inputPassword.value = 'Skru@2026!';
    clearFieldErrors();
    hideAlert();
    showAlert('success', 'กรอกข้อมูลทดสอบนักศึกษา (Student Demo) เรียบร้อยแล้ว');
  });

  chipStaff.addEventListener('click', () => {
    switchRole('staff');
    inputIdentifier.value = 'somchai.k';
    inputPassword.value = 'Staff@2026!';
    clearFieldErrors();
    hideAlert();
    showAlert('success', 'กรอกข้อมูลทดสอบอาจารย์ (Staff Demo) เรียบร้อยแล้ว');
  });

  // 8. Modals
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

  btnSecurityInspector.addEventListener('click', () => {
    securityModal.style.display = 'flex';
  });

  btnCloseSecurity.addEventListener('click', () => {
    securityModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === forgotModal) forgotModal.style.display = 'none';
    if (e.target === securityModal) securityModal.style.display = 'none';
  });
});
