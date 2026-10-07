const bcrypt = require('bcryptjs');

// Precomputed bcrypt hashes for demo passwords (salt rounds = 12)
// Student demo password: 'Skru@2026!'
// Staff demo password: 'Staff@2026!'
const STUDENT_PASSWORD_HASH = bcrypt.hashSync('Skru@2026!', 12);
const STAFF_PASSWORD_HASH = bcrypt.hashSync('Staff@2026!', 12);

// In-memory user database
const users = [
  {
    id: 'std_674295027',
    studentId: '674295027',
    email: '674295027@parichat.skru.ac.th',
    username: '674295027',
    nameTitle: 'นาย',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    fullName: 'นายสมชาย ใจดี',
    role: 'student',
    roleLabel: 'นักศึกษา (Student)',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    facultyEn: 'Faculty of Science and Technology',
    major: 'สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล (ITDI)',
    year: 'ปี 3',
    gpa: '3.78',
    status: 'กำลังศึกษา (Active)',
    avatarColor: '#c8102e',
    passwordHash: STUDENT_PASSWORD_HASH,
    lastLogin: null
  },
  {
    id: 'staff_somchai',
    studentId: null,
    email: 'somchai.k@skru.ac.th',
    username: 'somchai.k',
    nameTitle: 'ผศ.ดร.',
    firstName: 'สมชาย',
    lastName: 'การุณย์',
    fullName: 'ผศ.ดร.สมชาย การุณย์',
    role: 'staff',
    roleLabel: 'อาจารย์ / บุคลากร (Staff)',
    department: 'สาขาวิชาเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล',
    departmentEn: 'Department of Information Technology and Digital Innovation',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    position: 'อาจารย์ประจำหลักสูตร / หัวหน้าฝ่ายพัฒนาระบบดิจิทัล',
    status: 'ปฏิบัติงาน (Active)',
    avatarColor: '#e65c00',
    passwordHash: STAFF_PASSWORD_HASH,
    lastLogin: null
  }
];

// Account lockout & brute-force tracking
// Map key: `${role}:${identifier.toLowerCase()}`
const accountSecurityState = new Map();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Find user by role and identifier (Student ID, username, or email)
 */
function findUser(role, identifier) {
  if (!identifier || typeof identifier !== 'string') return null;
  const cleanId = identifier.trim().toLowerCase();

  return users.find((user) => {
    if (user.role !== role) return false;

    if (role === 'student') {
      return (
        user.studentId.toLowerCase() === cleanId ||
        user.email.toLowerCase() === cleanId
      );
    } else {
      return (
        user.username.toLowerCase() === cleanId ||
        user.email.toLowerCase() === cleanId
      );
    }
  });
}

/**
 * Check if account or identifier is currently locked out
 */
function checkLockout(role, identifier) {
  const key = `${role}:${identifier.trim().toLowerCase()}`;
  const record = accountSecurityState.get(key);

  if (!record) return { isLocked: false, remainingSeconds: 0 };

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }

  // Lockout expired, reset if time passed
  if (record.lockedUntil && record.lockedUntil <= now) {
    accountSecurityState.delete(key);
  }

  return { isLocked: false, remainingSeconds: 0 };
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(role, identifier) {
  const key = `${role}:${identifier.trim().toLowerCase()}`;
  const now = Date.now();
  const record = accountSecurityState.get(key) || { attempts: 0, lastAttempt: now, lockedUntil: null };

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    accountSecurityState.set(key, record);
    return {
      isLocked: true,
      attempts: record.attempts,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      message: `บัญชีถูกระงับชั่วคราวเนื่องจากใส่รหัสผ่านผิดเกิน ${MAX_FAILED_ATTEMPTS} ครั้ง กรุณารอ 15 นาที`
    };
  }

  accountSecurityState.set(key, record);
  return {
    isLocked: false,
    attempts: record.attempts,
    remainingAttempts: MAX_FAILED_ATTEMPTS - record.attempts
  };
}

/**
 * Reset failed attempts upon successful login
 */
function resetFailedAttempts(role, identifier) {
  const key = `${role}:${identifier.trim().toLowerCase()}`;
  accountSecurityState.delete(key);
}

/**
 * Verify user password using constant-time bcrypt compare
 */
async function verifyPassword(plainPassword, passwordHash) {
  return await bcrypt.compare(plainPassword, passwordHash);
}

module.exports = {
  findUser,
  checkLockout,
  recordFailedAttempt,
  resetFailedAttempts,
  verifyPassword,
  users
};
