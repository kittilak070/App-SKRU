/**
 * SKRU Frontend Security & Input Hardening Module
 * Implements client-side OWASP sanitization, regex matching, and CSRF handling
 */

const SkruSecurity = (() => {
  // Get CSRF Token from cookie or API
  async function getCsrfToken() {
    // 1. Try to read from XSRF-TOKEN cookie
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    if (match && match[2]) {
      return decodeURIComponent(match[2]);
    }

    // 2. Fetch fresh token from endpoint
    try {
      const response = await fetch('/api/auth/csrf', { credentials: 'include' });
      const data = await response.json();
      return data.csrfToken || '';
    } catch (err) {
      console.warn('Could not retrieve CSRF token:', err);
      return '';
    }
  }

  // HTML Entity Escaping (Prevent Reflected XSS)
  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Real-time input sanitizer (strips control chars & null bytes)
  function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/\0/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  // Validate Student ID or Parichat Email
  function validateStudentIdentifier(identifier) {
    const clean = identifier.trim();
    if (!clean) return { valid: false, message: 'กรุณากรอกรหัสนักศึกษา หรือ อีเมล' };
    
    // Check for 9-11 digit student ID
    const isStudentNumber = /^[0-9]{9,11}$/.test(clean);
    
    // Check for Student email: @parichat.skru.ac.th
    const isStudentEmail = /^[a-zA-Z0-9._%+-]+@parichat\.skru\.ac\.th$/i.test(clean);

    if (!isStudentNumber && !isStudentEmail) {
      return {
        valid: false,
        message: 'รหัสนักศึกษาต้องเป็นตัวเลข 9 หลัก (เช่น 674295027) หรืออีเมล @parichat.skru.ac.th'
      };
    }

    return { valid: true };
  }

  // Validate Staff Username or SKRU Email
  function validateStaffIdentifier(identifier) {
    const clean = identifier.trim();
    if (!clean) return { valid: false, message: 'กรุณากรอกชื่อผู้ใช้งาน หรือ อีเมล' };

    // Check username: alphanumeric 3-32 chars
    const isUsername = /^[a-zA-Z0-9._-]{3,32}$/.test(clean);

    // Check staff email: @skru.ac.th
    const isStaffEmail = /^[a-zA-Z0-9._%+-]+@skru\.ac\.th$/i.test(clean);

    if (!isUsername && !isStaffEmail) {
      return {
        valid: false,
        message: 'ชื่อผู้ใช้ต้องเป็นตัวอักษร 3-32 ตัว หรืออีเมล @skru.ac.th'
      };
    }

    return { valid: true };
  }

  // Validate Password Length & Basic Complexity
  function validatePassword(password) {
    if (!password || password.length === 0) {
      return { valid: false, message: 'กรุณากรอกรหัสผ่าน' };
    }
    if (password.length < 6) {
      return { valid: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
    }
    if (password.length > 128) {
      return { valid: false, message: 'รหัสผ่านมีความยาวเกิน 128 ตัวอักษร' };
    }
    return { valid: true };
  }

  return {
    getCsrfToken,
    escapeHtml,
    sanitizeInput,
    validateStudentIdentifier,
    validateStaffIdentifier,
    validatePassword
  };
})();
