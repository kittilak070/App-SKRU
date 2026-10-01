const path = require('path');
const fs = require('fs');
const http = require('isomorphic-git/http/node');
const git = require('isomorphic-git');

const dir = __dirname;

async function pushToGitHub() {
  const token = process.env.GITHUB_TOKEN || process.argv[2];
  
  if (!token) {
    console.log('----------------------------------------------------');
    console.log('📌 วิธีการ Push Branch 044 ขึ้น GitHub:');
    console.log('');
    console.log('ทางเลือกที่ 1 (ใช้ Git CLI / VS Code Terminal):');
    console.log('  git push -u origin 044');
    console.log('');
    console.log('ทางเลือกที่ 2 (ใช้ Node script กับ GitHub Token):');
    console.log('  node push.js <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>');
    console.log('----------------------------------------------------');
    return;
  }

  console.log('🚀 กำลัง Push branch 044 ไปยัง https://github.com/kittilak070/App-SKRU.git ...');

  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: '044',
      onAuth: () => ({ username: token })
    });
    console.log('✅ Push สำเร็จเรียบร้อย!', pushResult);
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการ Push:', err.message);
  }
}

pushToGitHub();
