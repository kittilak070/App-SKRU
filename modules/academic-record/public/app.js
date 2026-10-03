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

async function initialize() {
  try {
    [state.student, state.terms, { message: state.advisorMessage }] = await Promise.all([
      getJson('/api/student'),
      getJson('/api/terms'),
      getJson('/api/advisor-message')
    ]);
    renderStudent(state.student);
    renderTerms(state.terms);
  } catch (error) {
    console.error(error);
    $('#student-name').textContent = 'ไม่สามารถโหลดข้อมูลได้';
    $('#historyList').innerHTML = '<div class="loading-row">เกิดข้อผิดพลาด กรุณารีเฟรชหน้าอีกครั้ง</div>';
  }
}

$('#messageButton').addEventListener('click', openAdvisorModal);
$('#modalClose').addEventListener('click', closeModal);
$('#modalBackdrop').addEventListener('click', (event) => {
  if (event.target === $('#modalBackdrop')) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#modalBackdrop').hidden) closeModal();
});
$('#downloadButton').addEventListener('click', () => { window.location.href = '/api/report'; });
$('#backButton').addEventListener('click', () => { window.history.back(); });
$('#showAllButton').addEventListener('click', () => {
  $('#historyList').classList.toggle('show-all');
  $('#showAllButton').firstChild.textContent = $('#historyList').classList.contains('show-all') ? 'ซ่อนบางรายการ ' : 'ดูทั้งหมด ';
});

initialize();
