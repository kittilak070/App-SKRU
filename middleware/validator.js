const validator = require('validator');

/**
 * Validates login request body strictly against whitelist rules
 */
function validateLoginInput(req, res, next) {
  const { role, identifier, password, rememberMe } = req.body || {};
  const errors = {};

  // 1. Role Validation
  if (!role || !['student', 'staff'].includes(role)) {
    errors.role = 'กรุณาเลือกประเภทผู้ใช้งานให้ถูกต้อง (นักศึกษา หรือ อาจารย์/บุคลากร)';
  }

  // 2. Identifier Validation (Username / Student ID / Email)
  if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
    errors.identifier = role === 'student' 
      ? 'กรุณากรอกรหัสนักศึกษา หรือ อีเมล @parichat.skru.ac.th' 
      : 'กรุณากรอกชื่อผู้ใช้งาน หรือ อีเมล @skru.ac.th';
  } else {
    const rawId = identifier.trim();

    // Check maximum length to prevent buffer/payload exhaustion
    if (rawId.length > 64) {
      errors.identifier = 'ข้อมูลชื่อผู้ใช้มีความยาวเกินกำหนด (สูงสุด 64 ตัวอักษร)';
    } else if (role === 'student') {
      const isStudentNumber = /^[0-9]{9,11}$/.test(rawId);
      const isStudentEmail = validator.isEmail(rawId) && rawId.toLowerCase().endsWith('@parichat.skru.ac.th');

      if (!isStudentNumber && !isStudentEmail) {
        errors.identifier = 'รหัสนักศึกษาต้องเป็นตัวเลข 9 หลัก หรืออีเมลโดเมน @parichat.skru.ac.th เท่านั้น';
      }
    } else if (role === 'staff') {
      const isStaffUsername = /^[a-zA-Z0-9._-]{3,32}$/.test(rawId);
      const isStaffEmail = validator.isEmail(rawId) && rawId.toLowerCase().endsWith('@skru.ac.th');

      if (!isStaffUsername && !isStaffEmail) {
        errors.identifier = 'ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ 3-32 ตัว หรืออีเมลโดเมน @skru.ac.th';
      }
    }
  }

  // 3. Password Validation
  if (!password || typeof password !== 'string') {
    errors.password = 'กรุณากรอกรหัสผ่าน';
  } else {
    if (password.length < 6) {
      errors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    } else if (password.length > 128) {
      errors.password = 'รหัสผ่านมีความยาวเกินกำหนด (สูงสุด 128 ตัวอักษร)';
    }
  }

  // If validation errors exist, return 400 Bad Request with field-level details
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_FAILED',
      message: 'ข้อมูลที่กรอกไม่ถูกต้องตามรูปแบบที่กำหนด',
      fields: errors
    });
  }

  // Normalize inputs
  req.sanitizedLogin = {
    role,
    identifier: identifier.trim(),
    password: password,
    rememberMe: Boolean(rememberMe)
  };

  next();
}

/**
 * Validates forgot-password request
 */
function validateForgotPasswordInput(req, res, next) {
  const { role, identifier } = req.body || {};
  const errors = {};

  if (!role || !['student', 'staff'].includes(role)) {
    errors.role = 'กรุณาระบุประเภทผู้ใช้งาน';
  }

  if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
    errors.identifier = 'กรุณากรอกรหัสนักศึกษา หรือ อีเมลสำหรับรับลิงก์รีเซ็ตรหัสผ่าน';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_FAILED',
      fields: errors
    });
  }

  req.sanitizedForgot = {
    role,
    identifier: identifier.trim()
  };

  next();
}

module.exports = {
  validateLoginInput,
  validateForgotPasswordInput
};
