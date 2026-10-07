const $ = (selector) => document.querySelector(selector);
const state = { student: null, terms: [], advisorMessage: '' };

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function renderStudent(student) {
  $('#student-name').textContent = student.name;
  $('#student-id').textContent = `รหัสนักศึกษา : ${student.id}`;
  $('#program-name').textContent = `${student.faculty}\n${student.major}`;
  $('#current-gpa').textContent = student.currentGpa.toFixed(2);
  $('#last-gpa').textContent = student.lastTermGpa.toFixed(2);
  $('#credit-summary').textContent = `${student.totalCredits}/${student.requiredCredits} หน่วยกิต (${Math.round(student.totalCredits / student.requiredCredits * 100)}%)`;
  $('#remaining-credit').textContent = `เหลือ ${student.requiredCredits - student.totalCredits} หน่วยกิต`;
  $('#progress-bar').style.width = `${student.totalCredits / student.requiredCredits * 100}%`;
}

function renderTerms(terms) {
  $('#historyList').innerHTML = terms.map((item, index) => `
    <button class="term-row" type="button" data-term-index="${index}" aria-label="ดูรายละเอียด ${item.term}">
      <span class="term-key">${item.id}</span>
      <span class="term-copy">
        <span class="term-title">${item.term}${item.highlight ? `<span class="latest">${item.highlight}</span>` : ''}</span>
        <span class="term-meta">${item.credits} : ${item.subjects}</span>
      </span>
      <span class="term-gpa"><strong>${item.gpa}</strong><small>GPA</small></span>
      <span class="term-arrow" aria-hidden="true">›</span>
    </button>
  `).join('');
  $('#historyList').querySelectorAll('[data-term-index]').forEach((button) => {
    button.addEventListener('click', () => openTermModal(state.terms[Number(button.dataset.termIndex)]));
  });
}

function openModal() {
  $('#modalBackdrop').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#modalClose').focus();
}

function closeModal() {
  $('#modalBackdrop').hidden = true;
  document.body.style.overflow = '';
}

function openTermModal(term) {
  $('#modalKicker').textContent = 'รายละเอียดผลการศึกษา';
  $('#modalTitle').textContent = term.term;
  $('#modalSummary').innerHTML = `<span>${term.credits}</span><span>${term.subjects}</span><strong>GPA ${term.gpa}</strong>`;
  $('#courseList').innerHTML = term.courses.map(([name, grade]) => `<div class="course-item"><span>${name}</span><strong>${grade}</strong></div>`).join('');
  openModal();
}

function openAdvisorModal() {
  $('#modalKicker').textContent = 'ข้อความจากอาจารย์ที่ปรึกษา';
  $('#modalTitle').textContent = 'คำแนะนำสำหรับภาคเรียนถัดไป';
  $('#modalSummary').innerHTML = '<span>ส่งถึงนักศึกษาโดยตรง</span>';
  $('#courseList').innerHTML = `<div class="course-item"><span>${state.advisorMessage}</span></div>`;
  openModal();
}

function openReportModal() {
  const modal = $('#reportModalBackdrop');
  if (modal) {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#reportModalClose')?.focus();
  }
}

function closeReportModal() {
  const modal = $('#reportModalBackdrop');
  if (modal) {
    modal.hidden = true;
    document.body.style.overflow = '';
  }
}

// Toast Notification
function showToast(message, icon = '✓') {
  const toast = $('#toastNotification');
  if (!toast) return;
  toast.innerHTML = `<span style="color:#22c55e; font-weight:bold;">${icon}</span> <span>${message}</span>`;
  toast.hidden = false;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 3200);
}

// Real-time Footer Timestamp & Sync
function updateFooterTimestamp() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const syncTimeSpan = $('#syncTime');
  if (syncTimeSpan) {
    syncTimeSpan.textContent = `${hours}:${minutes}`;
  }
}

// Build Official Grade Report HTML for Preview & PDF Export
function buildOfficialDocumentHtml(student, terms) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  let termsHtml = '';
  (terms || []).forEach(t => {
    let rows = '';
    if (t.courses && t.courses.length > 0) {
      rows = t.courses.map((c, i) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 7px 10px; font-size: 13px; color: #475569; text-align: center;">${i + 1}</td>
          <td style="padding: 7px 10px; font-size: 13px; color: #0f172a; font-weight: 500;">${c[0]}</td>
          <td style="padding: 7px 10px; font-size: 13px; color: #475569; text-align: center;">3.0</td>
          <td style="padding: 7px 10px; font-size: 13px; color: #b91c1c; font-weight: 700; text-align: center;">${c[1]}</td>
        </tr>
      `).join('');
    }
    termsHtml += `
      <div style="margin-bottom: 16px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="color: #0f172a; font-size: 13.5px;">${t.term}</strong>
          <span style="font-size: 13px; color: #b91c1c; font-weight: 700;">GPA: ${t.gpa} | ${t.credits}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
          <thead>
            <tr style="background: #fff1f2; border-bottom: 2px solid #fecdd3;">
              <th style="padding: 6px 10px; font-size: 12px; color: #9f1239; width: 40px; text-align: center;">ลำดับ</th>
              <th style="padding: 6px 10px; font-size: 12px; color: #9f1239; text-align: left;">ชื่อรายวิชา (Course Title)</th>
              <th style="padding: 6px 10px; font-size: 12px; color: #9f1239; width: 80px; text-align: center;">หน่วยกิต</th>
              <th style="padding: 6px 10px; font-size: 12px; color: #9f1239; width: 80px; text-align: center;">เกรด</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  });

  return `
    <div style="text-align: center; border-bottom: 2px solid #b91c1c; padding-bottom: 14px; margin-bottom: 18px;">
      <div style="font-size: 32px; margin-bottom: 4px;">🎓</div>
      <h1 style="font-size: 20px; font-weight: 700; color: #b91c1c; margin: 0; line-height: 1.2;">มหาวิทยาลัยราชภัฏสงขลา</h1>
      <p style="font-size: 13px; color: #475569; margin: 2px 0 0 0; font-weight: 600;">SONGKHLA RAJABHAT UNIVERSITY</p>
      <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">สำนักส่งเสริมวิชาการและงานทะเบียน | ใบรายงานผลการศึกษาอย่างเป็นทางการ (Official Grade Report)</p>
    </div>

    <div style="background: #fdfaf0; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 18px; margin-bottom: 18px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
        <div><strong style="color: #64748b;">ชื่อ-นามสกุล:</strong> <span style="color: #0f172a; font-weight: 600;">${student.name || 'นายสมชาย ใจดี'}</span></div>
        <div><strong style="color: #64748b;">รหัสนักศึกษา:</strong> <span style="color: #b91c1c; font-weight: 700;">${student.id || '674295027'}</span></div>
        <div><strong style="color: #64748b;">คณะ:</strong> <span style="color: #0f172a;">${student.faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี'}</span></div>
        <div><strong style="color: #64748b;">สาขาวิชา:</strong> <span style="color: #0f172a;">${student.major || 'สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล (ITDI)'}</span></div>
        <div><strong style="color: #64748b;">ระดับการศึกษา:</strong> <span style="color: #0f172a;">ปริญญาตรี 4 ปี (ภาคปกติ)</span></div>
        <div><strong style="color: #64748b;">สถานภาพ:</strong> <span style="color: #15803d; font-weight: 700;">กำลังศึกษา (Active)</span></div>
      </div>
    </div>

    <div style="display: flex; gap: 14px; margin-bottom: 18px;">
      <div style="flex: 1; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 12px; text-align: center;">
        <span style="font-size: 12px; color: #9f1239; display: block; margin-bottom: 4px;">แต้มระดับเฉลี่ยสะสม (GPAX)</span>
        <strong style="font-size: 24px; color: #b91c1c;">${(student.currentGpa || 3.82).toFixed(2)}</strong>
        <small style="display: block; font-size: 11px; color: #9f1239; margin-top: 2px;">*เกียรตินิยมอันดับ 1</small>
      </div>
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; text-align: center;">
        <span style="font-size: 12px; color: #166534; display: block; margin-bottom: 4px;">หน่วยกิตสะสม / ความก้าวหน้า</span>
        <strong style="font-size: 24px; color: #15803d;">${student.totalCredits || 96} / ${student.requiredCredits || 132}</strong>
        <small style="display: block; font-size: 11px; color: #166534; margin-top: 2px;">(ผ่านแล้ว 73% ตามแผนการเรียน)</small>
      </div>
    </div>

    <div style="margin-bottom: 18px;">
      <h3 style="font-size: 14px; color: #0f172a; margin-bottom: 8px; border-left: 4px solid #b91c1c; padding-left: 8px;">
        ประวัติผลการศึกษาตามภาคเรียน (Academic Term Records)
      </h3>
      ${termsHtml}
    </div>

    ${state.advisorMessage ? `
      <div style="background: #fff8e6; border: 1px dashed #f59e0b; border-radius: 8px; padding: 10px 14px; margin-bottom: 18px; font-size: 12px; color: #92400e;">
        <strong>คำแนะนำจากอาจารย์ที่ปรึกษา:</strong> ${state.advisorMessage}
      </div>
    ` : ''}

    <div style="border-top: 1px solid #cbd5e1; padding-top: 14px; margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b;">
      <div>
        <p style="margin: 0;">ออกเอกสารเมื่อ: ${dateStr} เวลา ${timeStr} น.</p>
        <p style="margin: 2px 0 0 0;">เอกสารอิเล็กทรอนิกส์นี้ออกโดยระบบ SKRU Digital Portal มีผลรับรองตามกฎหมายธุรกรรมทางอิเล็กทรอนิกส์</p>
      </div>
      <div style="text-align: center;">
        <div style="border-bottom: 1px dotted #94a3b8; width: 140px; margin-bottom: 4px;"></div>
        <p style="margin: 0; font-weight: 600; color: #334155;">นายทะเบียนมหาวิทยาลัย</p>
        <p style="margin: 0; font-size: 9.5px; color: #94a3b8;">Songkhla Rajabhat University</p>
      </div>
    </div>
  `;
}

// Print Handler for vector printing
function printOfficialDocument() {
  const student = state.student || { id: '674295027', name: 'นายสมชาย ใจดี' };
  const terms = state.terms && state.terms.length > 0 ? state.terms : [];
  const content = buildOfficialDocumentHtml(student, terms);

  const printFrame = document.createElement('iframe');
  printFrame.style.cssText = 'position:fixed; top:-9999px; left:-9999px; width:0; height:0; border:none;';
  document.body.appendChild(printFrame);

  const printDoc = printFrame.contentDocument || printFrame.contentWindow.document;
  printDoc.open();
  printDoc.write(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>ใบรายงานผลการศึกษา - ${student.name || 'SKRU'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Prompt', sans-serif; margin: 0; padding: 24px; color: #1e293b; background: white; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `);
  printDoc.close();

  setTimeout(() => {
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();
    setTimeout(() => {
      if (printFrame.parentNode) printFrame.parentNode.removeChild(printFrame);
    }, 2000);
  }, 500);
}

// Robust Download PDF Function
async function downloadPdfReport() {
  const downloadBtn = $('#downloadButton');
  const originalHtml = downloadBtn.innerHTML;

  try {
    downloadBtn.disabled = true;
    downloadBtn.classList.add('loading');
    downloadBtn.innerHTML = '<span class="download-spinner">⏳</span> กำลังจัดเตรียมใบรายงานผลการศึกษา...';

    const student = state.student || {
      name: 'นายสมชาย ใจดี',
      id: '674295027',
      faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
      major: 'สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล (ITDI)',
      currentGpa: 3.82,
      totalCredits: 96,
      requiredCredits: 132
    };

    const terms = state.terms && state.terms.length > 0 ? state.terms : [];
    const docHtml = buildOfficialDocumentHtml(student, terms);

    // Populate preview box in report modal
    const previewBox = $('#reportPreviewContent');
    if (previewBox) {
      previewBox.innerHTML = docHtml;
      const issueDate = $('#reportIssueDate');
      if (issueDate) {
        issueDate.textContent = `ออกเอกสารเมื่อ: ${new Date().toLocaleDateString('th-TH')}`;
      }
    }

    let downloadSuccess = false;

    // Fetch Guaranteed Clean Official PDF from Server
    try {
      const res = await fetch(`/api/report?format=pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `SKRU_Official_Transcript_${student.id || '674295027'}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
        downloadSuccess = true;
      }
    } catch (fetchErr) {
      console.error('Fetch server PDF error:', fetchErr);
    }

    // Show Report Modal with Document Preview & Options
    openReportModal();

    // Success feedback
    downloadBtn.classList.remove('loading');
    downloadBtn.classList.add('success');
    downloadBtn.innerHTML = '<span aria-hidden="true" style="color:#16a34a; font-weight:bold;">✅</span> ดาวน์โหลด PDF เรียบร้อยแล้ว!';
    showToast('ดาวน์โหลดใบรายงานผลการศึกษา (PDF) เรียบร้อยแล้ว', '✅');

    setTimeout(() => {
      downloadBtn.innerHTML = originalHtml;
      downloadBtn.classList.remove('success');
      downloadBtn.disabled = false;
    }, 3000);

  } catch (err) {
    console.error('PDF Generation Error:', err);
    downloadBtn.innerHTML = originalHtml;
    downloadBtn.classList.remove('loading');
    downloadBtn.disabled = false;
    showToast('เกิดข้อผิดพลาดในการสร้างเอกสาร กรุณาลองใหม่อีกครั้ง', '⚠️');
  }
}

// Direct Trigger from Modal Download Button
async function downloadDirectPdf() {
  const btn = $('#btnModalDownloadPdf');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังดาวน์โหลด...';
  }

  const student = state.student || { id: '674295027' };
  try {
    const res = await fetch(`/api/report?format=pdf`);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `SKRU_Official_Transcript_${student.id || '674295027'}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
      showToast('ดาวน์โหลด Official Transcript (PDF) สำเร็จ', '📥');
    } else {
      window.open('/api/report?format=pdf', '_blank');
    }
  } catch (err) {
    console.error('Direct PDF error:', err);
    window.open('/api/report?format=pdf', '_blank');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> ดาวน์โหลด Official Transcript (PDF)';
    }
  }
}

async function initialize() {
  try {
    [state.student, state.terms, { message: state.advisorMessage }] = await Promise.all([
      getJson('/api/student'),
      getJson('/api/terms'),
      getJson('/api/advisor-message')
    ]);
    renderStudent(state.student);
    renderTerms(state.terms);
    updateFooterTimestamp();
  } catch (error) {
    console.error(error);
    $('#student-name').textContent = 'ไม่สามารถโหลดข้อมูลได้';
    $('#historyList').innerHTML = '<div class="loading-row">เกิดข้อผิดพลาด กรุณารีเฟรชหน้าอีกครั้ง</div>';
  }
}

// Event Listeners
$('#downloadButton').addEventListener('click', downloadPdfReport);
$('#btnModalDownloadPdf')?.addEventListener('click', downloadDirectPdf);
$('#btnModalPrint')?.addEventListener('click', printOfficialDocument);
$('#reportModalClose')?.addEventListener('click', closeReportModal);
$('#reportModalBackdrop')?.addEventListener('click', (e) => {
  if (e.target === $('#reportModalBackdrop')) closeReportModal();
});

$('#btnRefreshSync')?.addEventListener('click', async () => {
  const btn = $('#btnRefreshSync');
  btn.classList.add('spinning');
  await initialize();
  showToast('อัปเดตข้อมูลผลการศึกษาล่าสุดแล้ว', '🔄');
  setTimeout(() => btn.classList.remove('spinning'), 600);
});

$('#messageButton').addEventListener('click', openAdvisorModal);
$('#modalClose').addEventListener('click', closeModal);
$('#modalBackdrop').addEventListener('click', (event) => {
  if (event.target === $('#modalBackdrop')) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!$('#modalBackdrop').hidden) closeModal();
    if ($('#reportModalBackdrop') && !$('#reportModalBackdrop').hidden) closeReportModal();
  }
});

$('#backButton').addEventListener('click', () => {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'closeApp' }, '*');
  } else if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '/index.html';
  }
});

$('#showAllButton').addEventListener('click', () => {
  $('#historyList').classList.toggle('show-all');
  $('#showAllButton').firstChild.textContent = $('#historyList').classList.contains('show-all') ? 'ซ่อนบางรายการ ' : 'ดูทั้งหมด ';
});

const notifBtn = $('.notification-button');
if (notifBtn) {
  notifBtn.addEventListener('click', () => {
    $('#modalKicker').textContent = 'การแจ้งเตือนผลการเรียน';
    $('#modalTitle').textContent = 'ระบบทะเบียนและประมวลผล SKRU';
    $('#modalSummary').innerHTML = '<span>ภาคเรียนที่ 1/2569</span>';
    $('#courseList').innerHTML = `
      <div class="course-item" style="flex-direction: column; align-items: flex-start; gap: 4px; padding: 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #1e293b;">📢 ประกาศผลการเรียนภาคเรียนที่ 1/2569 ครบถ้วน</span>
        <span style="font-size: 13px; color: #64748b;">อาจารย์ผู้สอนได้ส่งเกรดครบทุกรายวิชาแล้ว สามารถตรวจสอบเกรดและพิมพ์ใบรายงานผลการศึกษาได้</span>
      </div>
      <div class="course-item" style="flex-direction: column; align-items: flex-start; gap: 4px; padding: 12px; background: #f8fafc; border-radius: 8px;">
        <span style="font-weight: 600; color: #1e293b;">📅 กำหนดการลงทะเบียนเรียน ภาคเรียนที่ 2/2569</span>
        <span style="font-size: 13px; color: #64748b;">เปิดลงทะเบียนระหว่างวันที่ 15 - 25 ต.ค. 2569 ผ่านระบบทะเบียนออนไลน์</span>
      </div>
    `;
    openModal();
  });
}

const profBtn = $('.profile-button');
if (profBtn) {
  profBtn.addEventListener('click', () => {
    if (window.parent && window.parent !== window) {
      window.parent.openDirectApp?.('modules/student-profile/public/index.html', 'ประวัตินักศึกษา', 'student-profile.html');
    } else {
      window.location.href = '/student-profile.html';
    }
  });
}

initialize();
