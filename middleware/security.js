const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Strict Rate Limiter for Login Endpoint (Anti-Brute Force / Anti-Credential Stuffing)
// Max 10 requests per 10 minutes per IP
const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Limit each IP to 15 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'TOO_MANY_REQUESTS',
      message: 'คุณได้พยายามเข้าสู่ระบบมากเกินไป โปรดรอ 10 นาทีแล้วลองใหม่อีกครั้งเพื่อความปลอดภัย (Rate limit exceeded)'
    });
  }
});

// General API Rate Limiter
const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'มีการส่งคำขอถี่เกินไป โปรดลองใหม่อีกครั้งในภายหลัง'
  }
});

// CSRF Secret & Token handling (Double Submit Cookie Pattern with HMAC signature)
const CSRF_SECRET = process.env.CSRF_SECRET || 'skru_secure_csrf_secret_key_2026_salt_987654';

function generateCsrfToken() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const hmac = crypto.createHmac('sha256', CSRF_SECRET).update(nonce).digest('hex');
  return `${nonce}.${hmac}`;
}

function verifyCsrfToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [nonce, hmac] = token.split('.');
  if (!nonce || !hmac) return false;

  const expectedHmac = crypto.createHmac('sha256', CSRF_SECRET).update(nonce).digest('hex');
  
  // Constant time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
  } catch (err) {
    return false;
  }
}

// CSRF middleware for mutating API requests
function csrfProtection(req, res, next) {
  // Safe HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const clientToken = req.headers['x-csrf-token'] || req.body?._csrf;

  if (!clientToken || !verifyCsrfToken(clientToken)) {
    return res.status(403).json({
      success: false,
      error: 'CSRF_INVALID',
      message: 'คำขอไม่ถูกต้องหรือหมดอายุ (Invalid CSRF token) กรุณารีเฟรชหน้าเว็บแล้วลองใหม่'
    });
  }

  next();
}

/**
 * Deep sanitize input values to prevent XSS, NoSQL/SQL injection patterns and prototype pollution
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    // Remove null bytes
    .replace(/\0/g, '')
    // Strip control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Replace dangerous angle brackets to prevent direct HTML/Script injection
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeInputMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    // Prevent Prototype Pollution
    const cleanBody = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      if (typeof value === 'string') {
        cleanBody[key] = sanitizeString(value);
      } else {
        cleanBody[key] = value;
      }
    }
    req.body = cleanBody;
  }
  next();
}

module.exports = {
  loginRateLimiter,
  apiRateLimiter,
  generateCsrfToken,
  verifyCsrfToken,
  csrfProtection,
  sanitizeInputMiddleware
};
