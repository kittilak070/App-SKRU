const http = require('http');

const endpoints = [
  // 1. Pages
  '/index.html',
  '/check-in.html',
  '/student-profile.html',
  '/profile.html',
  '/tuition-fee.html',
  '/payment.html',
  '/student-card.html',
  '/card.html',
  '/academic-record.html',
  '/grades.html',
  '/campus-map.html',
  '/map.html',
  '/student-loan.html',
  '/booking.html',
  '/reservation.html',
  '/faculty-contact.html',
  '/contact.html',
  '/news.html',
  '/learning-resources.html',
  '/dorm-booking.html',
  '/event-booking.html',
  '/activities.html',
  '/privacy-settings.html',
  '/privacy.html',
  '/academic-calendar.html',
  '/login.html',
  '/settings.html',
  '/vote.html',
  '/rewards.html',
  '/redeem.html',
  '/library.html',

  // 2. APIs
  '/api/auth/csrf',
  '/api/student',
  '/api/terms',
  '/api/advisor-message',
  '/api/report',
  '/api/course',
  '/api/students',
  '/api/fees/674295027',
  '/api/campus',
  '/api/official',
  '/api/nearby',
  '/api/categories',
  '/api/places',
  '/api/loans/info',
  '/api/institution',
  '/api/repayments/info',
  '/api/teacher',
  '/api/news',
  '/api/resources',
  '/api/dorms',
  '/api/activities',
  '/api/student-stats',
  '/api/books',
  '/api/borrowed',
  '/api/consent',
  '/api/settings',
  '/api/ratings',
  '/api/rewards'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get('http://localhost:3000' + url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, len: data.length });
      });
    }).on('error', (err) => {
      resolve({ url, status: 0, ok: false, error: err.message });
    });
  });
}

async function run() {
  console.log('🧪 Starting SKRU SuperApp Comprehensive System Audit...\n');
  let passed = 0;
  let failed = 0;

  for (const url of endpoints) {
    const res = await checkUrl(url);
    if (res.ok) {
      console.log(`✅ [${res.status}] ${res.url} (${res.len} bytes)`);
      passed++;
    } else {
      console.log(`❌ [${res.status}] ${res.url} - FAILED!`);
      failed++;
    }
  }

  console.log(`\n==============================================`);
  console.log(`Test Summary: Passed: ${passed} / Total: ${endpoints.length}`);
  console.log(`System Status: ${failed === 0 ? '🟢 100% GOD-TIER OPERATIONAL' : '🔴 ISSUES FOUND'}`);
  console.log(`==============================================`);
}

run();
