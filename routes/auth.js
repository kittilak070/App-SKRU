const express = require('express');
const router = express.Router();
const userStore = require('../models/userStore');
const {
  loginRateLimiter,
  generateCsrfToken,
  csrfProtection,
  sanitizeInputMiddleware
} = require('../middleware/security');
const {
  validateLoginInput,
  validateForgotPasswordInput
} = require('../middleware/validator');

// Dummy bcrypt hash used for constant-time comparison when user is not found
// Prevents user enumeration via timing attack
const DUMMY_HASH = '$2a$12$e8k6mN5VjV4mPq8R3e4sU.e/g57OqP6.e6J0K1m/m99O2mP1.N1eW';

/**
 * GET /api/auth/csrf
 * Issue a new CSRF Token for the client
 */
router.get('/csrf', (req, res) => {
  const token = generateCsrfToken();
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Accessible by JavaScript to set request header
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600 * 1000 // 1 hour
  });
  
  return res.json({
    success: true,
    csrfToken: token
  });
});

/**
 * POST /api/auth/login
 * Authenticate user with role-based validation, rate limiting, and brute-force protection
 */
router.post(
  '/login',
  loginRateLimiter,
  csrfProtection,
  sanitizeInputMiddleware,
  validateLoginInput,
  async (req, res) => {
    try {
      const { role, identifier, password, rememberMe } = req.sanitizedLogin;

      // 1. Check if account is locked out
      const lockoutStatus = userStore.checkLockout(role, identifier);
      if (lockoutStatus.isLocked) {
        return res.status(423).json({
          success: false,
          error: 'ACCOUNT_LOCKED',
          message: `บัญชีนี้ถูกระงับชั่วคราวเนื่องจากใส่รหัสผ่านผิดเกินกำหนด กรุณารอ ${lockoutStatus.remainingSeconds} วินาที แล้วลองใหม่`,
          remainingSeconds: lockoutStatus.remainingSeconds
        });
      }

      // 2. Find user in repository
      const user = userStore.findUser(role, identifier);

      // If user not found, perform dummy bcrypt compare to equalize response time
      if (!user) {
        await userStore.verifyPassword(password, DUMMY_HASH);
        const attemptInfo = userStore.recordFailedAttempt(role, identifier);

        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'รหัสประจำตัว หรือ รหัสผ่านไม่ถูกต้อง',
          remainingAttempts: attemptInfo.isLocked ? 0 : attemptInfo.remainingAttempts,
          isLocked: attemptInfo.isLocked
        });
      }

      // 3. Verify password
      const isPasswordValid = await userStore.verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        const attemptInfo = userStore.recordFailedAttempt(role, identifier);
        
        if (attemptInfo.isLocked) {
          return res.status(423).json({
            success: false,
            error: 'ACCOUNT_LOCKED',
            message: attemptInfo.message,
            remainingSeconds: attemptInfo.remainingSeconds
          });
        }

        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: `รหัสผ่านไม่ถูกต้อง (เหลือโอกาสลองอีก ${attemptInfo.remainingAttempts} ครั้ง)`,
          remainingAttempts: attemptInfo.remainingAttempts
        });
      }

      // 4. Success - Reset failed attempts & update last login
      userStore.resetFailedAttempts(role, identifier);
      user.lastLogin = new Date().toISOString();

      // Create session cookie payload (safe, no passwordHash)
      const sessionData = {
        userId: user.id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        faculty: user.faculty,
        major: user.major,
        department: user.department,
        position: user.position,
        loginAt: user.lastLogin
      };

      // Set secure cookie
      const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000; // 7 days or 2 hours
      res.cookie('skru_session', JSON.stringify(sessionData), {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: maxAge
      });

      return res.json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ ยินดีต้อนรับสู่ระบบบริการดิจิทัล มรภ.สงขลา',
        user: {
          id: user.id,
          role: user.role,
          roleLabel: user.roleLabel,
          fullName: user.fullName,
          nameTitle: user.nameTitle,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          studentId: user.studentId,
          faculty: user.faculty,
          facultyEn: user.facultyEn,
          major: user.major,
          department: user.department,
          departmentEn: user.departmentEn,
          position: user.position,
          year: user.year,
          gpa: user.gpa,
          status: user.status,
          avatarColor: user.avatarColor,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      console.error('Login Error:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการประมวลผลระบบ กรุณาลองใหม่อีกครั้ง'
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current session user
 */
router.get('/me', (req, res) => {
  const sessionCookie = req.cookies?.skru_session;
  if (!sessionCookie) {
    return res.status(401).json({
      success: false,
      authenticated: false
    });
  }

  try {
    const sessionData = JSON.parse(sessionCookie);
    return res.json({
      success: true,
      authenticated: true,
      user: sessionData
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      authenticated: false
    });
  }
});

/**
 * POST /api/auth/logout
 * Destroy current session
 */
router.post('/logout', (req, res) => {
  res.clearCookie('skru_session', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });

  return res.json({
    success: true,
    message: 'ออกจากระบบสำเร็จ'
  });
});

/**
 * POST /api/auth/forgot-password
 * Request password reset link (Timing safe, generic response to prevent account enumeration)
 */
router.post(
  '/forgot-password',
  loginRateLimiter,
  csrfProtection,
  sanitizeInputMiddleware,
  validateForgotPasswordInput,
  async (req, res) => {
    // Return generic success message regardless of whether user exists
    return res.json({
      success: true,
      message: 'หากข้อมูลถูกต้อง ระบบได้จัดส่งคำแนะนำและลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลมหาวิทยาลัยของท่านแล้ว กรุณาตรวจสอบกล่องจดหมาย'
    });
  }
);

module.exports = router;
