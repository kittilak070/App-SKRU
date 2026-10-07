document.addEventListener('DOMContentLoaded', () => {
  const drawer = document.getElementById('drawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const toastMsg = document.getElementById('toastMsg');

  function showToast(message, isError = false) {
    toastMsg.textContent = message;
    toastMsg.className = 'toast-msg' + (isError ? ' error' : '');
    toastMsg.classList.add('show');
    setTimeout(() => {
      toastMsg.classList.remove('show');
    }, 3500);
  }

  function openDrawer() {
    drawer.classList.add('active');
    drawerOverlay.classList.add('active');
  }

  function closeDrawer() {
    drawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
  }

  menuToggleBtn.addEventListener('click', openDrawer);
  drawerCloseBtn.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  function openModal(title, contentHtml) {
    modalTitle.textContent = title;
    modalBody.innerHTML = contentHtml;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const action = btn.getAttribute('data-action');
      closeDrawer();
      handleAction(action);
    });
  });

  async function handleAction(action) {
    switch (action) {
      case 'loan':
        await renderLoanModal();
        break;
      case 'institution':
        await renderInstitutionModal();
        break;
      case 'repayment':
        await renderRepaymentModal();
        break;
      case 'salary':
        await renderSalaryModal();
        break;
      case 'volunteer':
        await renderVolunteerModal();
        break;
      case 'hall-of-fame':
        await renderHallOfFameModal();
        break;
      case 'news':
        await renderNewsModal();
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  async function renderLoanModal() {
    const res = await API.getLoanInfo();
    const data = res.data;
    const criteriaHtml = data.criteria.map(c => '<li>' + c + '</li>').join('');
    const stepsHtml = data.steps.map(s => '<div>' + s + '</div>').join('');
    const html = `
      <div class="badge-tag">ข้อมูลปีการศึกษา ${data.academicYear}</div>
      <h3 style="color: var(--primary-red); margin-bottom: 12px;">${data.title}</h3>
      <div class="info-card-item">
        <h4>คุณสมบัติผู้กู้ยืม</h4>
        <ul style="padding-left: 18px; margin-top: 6px;">${criteriaHtml}</ul>
      </div>
      <div class="info-card-item">
        <h4>ขั้นตอนการยื่นกู้ยืม</h4>
        <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">${stepsHtml}</div>
      </div>
      <button class="btn-submit" onclick="window.open('https://dsl.studentloan.or.th', '_blank')">เข้าสู่ระบบ กยศ. Connect / DSL</button>
    `;
    openModal('การกู้ยืม กยศ.', html);
  }

  async function renderInstitutionModal() {
    const res = await API.getInstitutionInfo();
    const data = res.data;
    const html = `
      <h3 style="color: var(--primary-red); margin-bottom: 6px;">${data.name}</h3>
      <p style="font-weight: 600; color: #4b5563; margin-bottom: 14px;">${data.unit}</p>
      <div class="info-card-item">
        <h4>ที่ตั้งหน่วยงาน</h4>
        <p>${data.location}</p>
      </div>
      <div class="info-card-item">
        <h4>ช่องทางติดต่อ</h4>
        <p>📞 <strong>เบอร์โทรศัพท์:</strong> ${data.contacts.phone}</p>
        <p>✉️ <strong>อีเมล:</strong> ${data.contacts.email}</p>
        <p>📘 <strong>Facebook:</strong> ${data.contacts.facebook}</p>
        <p>⏰ <strong>เวลาทำการ:</strong> ${data.contacts.workingHours}</p>
      </div>
    `;
    openModal('ข้อมูลสถานศึกษา (SKRU)', html);
  }

  async function renderRepaymentModal() {
    const res = await API.getRepaymentInfo();
    const channels = res.data.channels;
    const channelsHtml = channels.map(c => `
      <div class="info-card-item">
        <h4>${c.name}</h4>
        <p>${c.desc}</p>
      </div>
    `).join('');

    const html = `
      <div style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid #fee2e2; padding-bottom: 8px;">
        <button id="tabRegister" class="btn-submit" style="margin: 0; padding: 8px 12px; font-size: 13px; flex: 1;">ลงทะเบียนชำระหนี้</button>
        <button id="tabChannels" class="btn-secondary" style="margin: 0; padding: 8px 12px; font-size: 13px; flex: 1;">ช่องทางชำระเงิน</button>
        <button id="tabStatus" class="btn-secondary" style="margin: 0; padding: 8px 12px; font-size: 13px; flex: 1;">ตรวจสอบสถานะ</button>
      </div>
      <div id="repaymentFormSection">
        <h4 style="color: var(--primary-red); margin-bottom: 10px;">แบบฟอร์มลงทะเบียนแสดงความจำนงชำระหนี้</h4>
        <form id="repaymentForm">
          <div class="form-group">
            <label class="form-label">เลขบัตรประจำตัวประชาชน *</label>
            <input type="text" id="regIdCard" class="form-input" placeholder="เลข 13 หลัก" maxlength="13" required />
          </div>
          <div class="form-group">
            <label class="form-label">ชื่อ - นามสกุล *</label>
            <input type="text" id="regFullName" class="form-input" placeholder="เช่น นายสมเกียรติ มั่นคง" required />
          </div>
          <div class="form-group">
            <label class="form-label">รหัสนักศึกษา</label>
            <input type="text" id="regStudentId" class="form-input" placeholder="เช่น 644101001" />
          </div>
          <div class="form-group">
            <label class="form-label">คณะ / สาขาวิชา</label>
            <input type="text" id="regFaculty" class="form-input" placeholder="เช่น คณะวิทยาการจัดการ" />
          </div>
          <div class="form-group">
            <label class="form-label">เบอร์โทรศัพท์ติดต่อ *</label>
            <input type="tel" id="regPhone" class="form-input" placeholder="08x-xxxxxxx" required />
          </div>
          <div class="form-group">
            <label class="form-label">รูปแบบการชำระที่ประสงค์</label>
            <select id="regType" class="form-select">
              <option value="ผ่อนชำระรายเดือน">ผ่อนชำระรายเดือน (แนะนำ)</option>
              <option value="ชำระเป็นรายปี">ชำระเป็นรายปี</option>
              <option value="ปิดบัญชีหนี้ทั้งหมด (รับส่วนลด)">ปิดบัญชีหนี้ทั้งหมด (รับส่วนลดตามเกณฑ์)</option>
              <option value="หักเงินเดือนผ่านหน่วยงาน">หักเงินเดือนผ่านหน่วยงาน/นายจ้าง</option>
            </select>
          </div>
          <button type="submit" class="btn-submit">ยืนยันการลงทะเบียนชำระหนี้</button>
        </form>
      </div>
      <div id="repaymentChannelsSection" style="display: none;">
        <h4 style="color: var(--primary-red); margin-bottom: 10px;">ช่องทางการชำระเงิน กยศ.</h4>
        ${channelsHtml}
      </div>
      <div id="repaymentStatusSection" style="display: none;">
        <h4 style="color: var(--primary-red); margin-bottom: 10px;">ตรวจสอบสถานะการลงทะเบียน</h4>
        <div class="form-group">
          <input type="text" id="searchQuery" class="form-input" placeholder="กรอกเลขบัตรประชาชน หรือ รหัสนักศึกษา" />
          <button type="button" id="btnSearchStatus" class="btn-submit" style="margin-top: 8px;">ค้นหาข้อมูล</button>
        </div>
        <div id="searchResult" style="margin-top: 14px;"></div>
      </div>
    `;

    openModal('การชำระหนี้ กยศ.', html);

    const tabRegister = document.getElementById('tabRegister');
    const tabChannels = document.getElementById('tabChannels');
    const tabStatus = document.getElementById('tabStatus');
    const formSec = document.getElementById('repaymentFormSection');
    const chanSec = document.getElementById('repaymentChannelsSection');
    const statSec = document.getElementById('repaymentStatusSection');

    tabRegister.onclick = () => {
      tabRegister.className = 'btn-submit';
      tabChannels.className = 'btn-secondary';
      tabStatus.className = 'btn-secondary';
      formSec.style.display = 'block';
      chanSec.style.display = 'none';
      statSec.style.display = 'none';
    };

    tabChannels.onclick = () => {
      tabRegister.className = 'btn-secondary';
      tabChannels.className = 'btn-submit';
      tabStatus.className = 'btn-secondary';
      formSec.style.display = 'none';
      chanSec.style.display = 'block';
      statSec.style.display = 'none';
    };

    tabStatus.onclick = () => {
      tabRegister.className = 'btn-secondary';
      tabChannels.className = 'btn-secondary';
      tabStatus.className = 'btn-submit';
      formSec.style.display = 'none';
      chanSec.style.display = 'none';
      statSec.style.display = 'block';
    };

    document.getElementById('repaymentForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        idCard: document.getElementById('regIdCard').value.trim(),
        fullName: document.getElementById('regFullName').value.trim(),
        studentId: document.getElementById('regStudentId').value.trim(),
        faculty: document.getElementById('regFaculty').value.trim(),
        phone: document.getElementById('regPhone').value.trim(),
        repaymentType: document.getElementById('regType').value
      };

      try {
        const result = await API.registerRepayment(payload);
        if (result.success) {
          showToast('บันทึกข้อมูลการลงทะเบียนชำระหนี้สำเร็จ!');
          closeModal();
        } else {
          showToast(result.message, true);
        }
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', true);
      }
    };

    document.getElementById('btnSearchStatus').onclick = async () => {
      const q = document.getElementById('searchQuery').value.trim();
      const resContainer = document.getElementById('searchResult');
      if (!q) {
        showToast('กรุณากรอกเลขบัตรประชาชน หรือ รหัสนักศึกษา', true);
        return;
      }
      try {
        const res = await API.checkRepaymentStatus(q);
        if (res.success && res.data) {
          const d = res.data;
          resContainer.innerHTML = `
            <div class="info-card-item">
              <span class="badge-tag">${d.status}</span>
              <h4>${d.fullName}</h4>
              <p>เลขประจำตัว: ${d.idCard}</p>
              <p>รหัสลงทะเบียน: <strong>${d.id}</strong></p>
              <p>รูปแบบ: ${d.repaymentType}</p>
              <p>วันที่ลงทะเบียน: ${new Date(d.createdAt).toLocaleDateString('th-TH')}</p>
            </div>
          `;
        }
      } catch (err) {
        resContainer.innerHTML = '<div style="color: var(--primary-red); padding: 8px;">❌ ไม่พบข้อมูลการลงทะเบียน</div>';
      }
    };
  }

  async function renderSalaryModal() {
    let data = {};
    try {
      const res = await API.getSalaryDeductionInfo();
      data = res.data || {};
    } catch (e) {
      data = {};
    }

    const details = (data && data.details) ? data.details : [
      'นายจ้างได้รับแจ้งข้อมูลรายชื่อและยอดเงินหักจากระบบ กยศ. โดยตรง',
      'ยอดเงินจะถูกหักจากเงินเดือนประจำเดือนและนำส่งเข้ากองทุนภายในวันที่ 15 ของเดือนถัดไป',
      'ผู้กู้ยืมสามารถตรวจสอบยอดหักและยอดหนี้คงเหลือได้ทางแอป กยศ. Connect ตลอด 24 ชม.'
    ];
    const detailsHtml = details.map(d => '<li style="margin-bottom: 6px;">' + d + '</li>').join('');

    const html = `
      <div style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid #fee2e2; padding-bottom: 8px;">
        <button id="tabSalaryInfo" class="btn-submit" style="margin: 0; padding: 8px 12px; font-size: 13px; flex: 1;">ข้อมูลการหักเงินเดือน</button>
        <button id="tabSalaryCalc" class="btn-secondary" style="margin: 0; padding: 8px 12px; font-size: 13px; flex: 1;">จำลองคำนวณยอดหัก</button>
      </div>

      <div id="salaryInfoSection">
        <h3 style="color: var(--primary-red); margin-bottom: 8px;">${data.title || 'การหักเงินเดือนเพื่อชำระหนี้ กยศ.'}</h3>
        <p style="margin-bottom: 14px; color: #4b5563; font-size: 13.5px;">${data.description || 'ระบบการหักเงินได้พึงประเมินของลูกจ้างที่เป็นผู้กู้ยืมเงิน กยศ. ผ่านหน่วยงานต้นสังกัด/นายจ้าง ตาม พ.ร.บ. กองทุนเงินให้กู้ยืมเพื่อการศึกษา พ.ศ. 2560'}</p>
        <div class="info-card-item">
          <h4>แนวทางการดำเนินงาน</h4>
          <ul style="padding-left: 18px; margin-top: 6px; font-size: 13px;">${detailsHtml}</ul>
        </div>
        <div class="info-card-item">
          <h4>สำหรับฝ่ายทรัพยากรบุคคล / นายจ้าง</h4>
          <p style="font-size: 13px;">นำส่งเงินหักผ่านระบบ e-Pay and Transfer หรือแอปพลิเคชันที่กองทุนฯ กำหนด ภายในวันที่ 15 ของทุกเดือน</p>
        </div>
        <button class="btn-submit" onclick="window.open('https://dsl.studentloan.or.th', '_blank')" style="margin-top: 8px;">
          เข้าสู่ระบบ กยศ. Connect / DSL
        </button>
      </div>

      <div id="salaryCalcSection" style="display: none;">
        <h4 style="color: var(--primary-red); margin-bottom: 8px;">เครื่องมือคำนวณยอดหักเงินเดือนโดยประมาณ</h4>
        <p style="font-size: 12.5px; color: #6b7280; margin-bottom: 12px;">คำนวณตามอัตราเงินได้พึงประเมินและสัดส่วนการชำระหนี้รายปี</p>
        <div class="form-group">
          <label class="form-label">เงินเดือนประจำ (บาท/เดือน)</label>
          <input type="number" id="calcSalaryInput" class="form-input" placeholder="เช่น 18000" value="18000" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">ยอดหนี้เงินกู้คงเหลือ (บาท)</label>
          <input type="number" id="calcDebtInput" class="form-input" placeholder="เช่น 150000" value="150000" min="0" />
        </div>
        <button type="button" id="btnRunCalcSalary" class="btn-submit" style="margin-bottom: 14px;">
          คำนวณยอดหักชำระ
        </button>

        <div id="salaryCalcResult" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px;">
          <h5 style="color: #166534; font-size: 14px; margin-bottom: 8px;">ผลการคำนวณโดยประมาณ</h5>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
            <span style="color: #4b5563;">ยอดหักชำระต่อเดือน:</span>
            <strong id="calcMonthlyDeduct" style="color: #15803d; font-size: 16px;">1,250 บาท</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
            <span style="color: #4b5563;">สัดส่วนต่องวดเงินเดือน:</span>
            <strong id="calcPercentDeduct" style="color: #374151;">6.9%</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: #4b5563;">กำหนดส่งเงินหัก:</span>
            <span style="color: #374151;">ทุกวันที่ 15 ของเดือนถัดไป</span>
          </div>
        </div>
      </div>
    `;

    openModal('การหักเงินเดือนเพื่อชำระหนี้ กยศ.', html);

    const tabInfo = document.getElementById('tabSalaryInfo');
    const tabCalc = document.getElementById('tabSalaryCalc');
    const secInfo = document.getElementById('salaryInfoSection');
    const secCalc = document.getElementById('salaryCalcSection');

    tabInfo.onclick = () => {
      tabInfo.className = 'btn-submit';
      tabCalc.className = 'btn-secondary';
      secInfo.style.display = 'block';
      secCalc.style.display = 'none';
    };

    tabCalc.onclick = () => {
      tabInfo.className = 'btn-secondary';
      tabCalc.className = 'btn-submit';
      secInfo.style.display = 'none';
      secCalc.style.display = 'block';
    };

    const doCalculate = () => {
      const salary = parseFloat(document.getElementById('calcSalaryInput').value) || 0;
      const debt = parseFloat(document.getElementById('calcDebtInput').value) || 0;
      let annual = debt > 0 ? (debt / 15) : (salary * 12 * 0.08);
      let monthly = Math.max(500, Math.min(salary * 0.15, Math.round(annual / 12)));
      if (salary < 15000) monthly = Math.min(monthly, 800);
      const pct = salary > 0 ? ((monthly / salary) * 100).toFixed(1) : 0;

      document.getElementById('calcMonthlyDeduct').textContent = Number(monthly).toLocaleString('th-TH') + ' บาท';
      document.getElementById('calcPercentDeduct').textContent = pct + '% ของเงินเดือน';
    };

    document.getElementById('btnRunCalcSalary').onclick = doCalculate;
    document.getElementById('calcSalaryInput').oninput = doCalculate;
    document.getElementById('calcDebtInput').oninput = doCalculate;
  }

  async function renderVolunteerModal() {
    let list = [];
    try {
      const res = await API.getVolunteerActivities();
      list = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      list = [];
    }

    let userHours = parseInt(localStorage.getItem('skru_loan_volunteer_hours') || '24', 10);
    const maxHours = 36;
    const pct = Math.min(100, Math.round((userHours / maxHours) * 100));

    const listHtml = list.map(v => `
      <div class="info-card-item" style="position: relative; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <h4 style="margin: 0; font-size: 14.5px;">${v.title}</h4>
          <span class="badge-tag" style="margin: 0; flex-shrink: 0; background: #e0f2fe; color: #0284c7;">+${v.hours} ชม.</span>
        </div>
        <p style="margin-top: 6px; font-size: 12.5px; color: #4b5563;">📍 สถานที่: ${v.location}</p>
        <p style="font-size: 12.5px; color: #4b5563;">📅 วันที่จัด: ${v.date}</p>
        <button type="button" class="btn-submit btn-apply-vol" data-id="${v.id}" data-title="${v.title}" data-hours="${v.hours}" style="padding: 7px 14px; font-size: 12.5px; margin-top: 8px; width: auto;">
          สมัครเข้าร่วมกิจกรรม (+${v.hours} ชม.)
        </button>
      </div>
    `).join('');

    const html = `
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%); border: 1px solid #fecdd3; border-radius: 10px; padding: 12px 16px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 13px; font-weight: 700; color: #991b1b;">ชั่วโมงจิตอาสาสะสมของฉัน</span>
          <span id="displayUserHours" style="font-size: 15px; font-weight: 800; color: var(--primary-red);">${userHours} / ${maxHours} ชม.</span>
        </div>
        <div style="background: #e5e7eb; border-radius: 10px; height: 10px; overflow: hidden;">
          <div id="volunteerProgressBar" style="background: linear-gradient(90deg, #ef4444, #10b981); width: ${pct}%; height: 100%; transition: width 0.4s ease;"></div>
        </div>
        <div id="volunteerProgressLabel" style="display: flex; justify-content: space-between; font-size: 11.5px; color: #6b7280; margin-top: 4px;">
          <span>เกณฑ์ขั้นต่ำ 36 ชม./ปีการศึกษา</span>
          <span id="volunteerMissingLabel">${userHours >= maxHours ? '✅ ครบเกณฑ์แล้ว' : 'ขาดอีก ' + (maxHours - userHours) + ' ชม.'}</span>
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid #fee2e2; padding-bottom: 8px;">
        <button id="tabVolList" class="btn-submit" style="margin: 0; padding: 8px 12px; font-size: 13px; flex: 1;">กิจกรรมที่เปิดรับ</button>
        <button id="tabVolSubmit" class="btn-secondary" style="margin: 0; padding: 8px 12px; font-size: 13px; flex: 1;">บันทึกชั่วโมง</button>
      </div>

      <div id="volListSection">
        <h4 style="color: var(--primary-red); margin-bottom: 10px;">กิจกรรมจิตสาธารณะ กยศ. SKRU</h4>
        ${listHtml}
      </div>

      <div id="volSubmitSection" style="display: none;">
        <h4 style="color: var(--primary-red); margin-bottom: 10px;">แบบฟอร์มบันทึกรับรองชั่วโมงจิตอาสา</h4>
        <form id="formSubmitVolunteer">
          <div class="form-group">
            <label class="form-label">ชื่อกิจกรรมจิตอาสา *</label>
            <input type="text" id="volActTitle" class="form-input" placeholder="เช่น ช่วยงานห้องสมุด, กวาดลานวัด" required />
          </div>
          <div class="form-group">
            <label class="form-label">จำนวนชั่วโมงที่ปฏิบัติงาน *</label>
            <select id="volActHours" class="form-select">
              <option value="3">3 ชั่วโมง</option>
              <option value="6" selected>6 ชั่วโมง</option>
              <option value="12">12 ชั่วโมง</option>
              <option value="18">18 ชั่วโมง</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">สถานที่จัดกิจกรรม / หน่วยงาน *</label>
            <input type="text" id="volActLocation" class="form-input" placeholder="เช่น มหาวิทยาลัยราชภัฏสงขลา" required />
          </div>
          <div class="form-group">
            <label class="form-label">วันที่ปฏิบัติงาน *</label>
            <input type="date" id="volActDate" class="form-input" value="${new Date().toISOString().split('T')[0]}" required />
          </div>
          <button type="submit" class="btn-submit" id="btnSubmitVolHours">
            บันทึกรับรองชั่วโมงจิตอาสา
          </button>
        </form>
      </div>
    `;

    openModal('กิจกรรมจิตสาธารณะ กยศ.', html);

    const tabList = document.getElementById('tabVolList');
    const tabSubmit = document.getElementById('tabVolSubmit');
    const secList = document.getElementById('volListSection');
    const secSubmit = document.getElementById('volSubmitSection');

    tabList.onclick = () => {
      tabList.className = 'btn-submit';
      tabSubmit.className = 'btn-secondary';
      secList.style.display = 'block';
      secSubmit.style.display = 'none';
    };

    tabSubmit.onclick = () => {
      tabList.className = 'btn-secondary';
      tabSubmit.className = 'btn-submit';
      secList.style.display = 'none';
      secSubmit.style.display = 'block';
    };

    // Apply volunteer activity handler
    document.querySelectorAll('.btn-apply-vol').forEach(btn => {
      btn.onclick = () => {
        const title = btn.getAttribute('data-title');
        const addH = parseInt(btn.getAttribute('data-hours') || '6', 10);
        let curr = parseInt(localStorage.getItem('skru_loan_volunteer_hours') || '24', 10);
        curr = Math.min(36, curr + addH);
        localStorage.setItem('skru_loan_volunteer_hours', curr.toString());

        btn.disabled = true;
        btn.textContent = '✅ สมัครแล้ว (รอเข้าร่วม)';
        btn.style.background = '#10b981';

        document.getElementById('displayUserHours').textContent = `${curr} / ${maxHours} ชม.`;
        const newPct = Math.min(100, Math.round((curr / maxHours) * 100));
        document.getElementById('volunteerProgressBar').style.width = newPct + '%';
        document.getElementById('volunteerMissingLabel').textContent = curr >= maxHours ? '✅ ครบเกณฑ์แล้ว' : 'ขาดอีก ' + (maxHours - curr) + ' ชม.';

        showToast(`สมัครกิจกรรม "${title}" สำเร็จ! (+${addH} ชม.)`);
      };
    });

    // Submit custom volunteer hours
    document.getElementById('formSubmitVolunteer').onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('volActTitle').value.trim();
      const hours = parseInt(document.getElementById('volActHours').value, 10);
      const location = document.getElementById('volActLocation').value.trim();
      const date = document.getElementById('volActDate').value;

      try {
        const res = await API.submitVolunteerHours({ title, hours, location, date });
        let curr = parseInt(localStorage.getItem('skru_loan_volunteer_hours') || '24', 10);
        curr = Math.min(36, curr + hours);
        localStorage.setItem('skru_loan_volunteer_hours', curr.toString());

        showToast(`บันทึกชั่วโมงจิตอาสาสำเร็จ! (+${hours} ชม.)`);
        closeModal();
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', true);
      }
    };
  }

  async function renderHallOfFameModal() {
    let list = [];
    try {
      const res = await API.getHallOfFame();
      list = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      list = [];
    }

    if (!list.length) {
      list = [
        {
          id: 1,
          name: "นายอนิรุจน์ สุวรรณรัตน์",
          faculty: "คณะครุศาสตร์ สาขาวิชาคณิตศาสตร์",
          status: "ศิษย์เก่าผู้ชำระหนี้ครบถ้วนตรงเวลา",
          quote: "กยศ. คือโอกาสที่ทำให้ผมได้เป็นครูในวันนี้ การชำระหนี้คืนคือการส่งต่อโอกาสให้รุ่นน้องต่อไป",
          role: "ครูชำนาญการพิเศษ โรงเรียนประจำจังหวัด"
        },
        {
          id: 2,
          name: "นางสาวศิริพร บุญช่วย",
          faculty: "คณะวิทยาการจัดการ สาขาการบัญชี",
          status: "ศิษย์เก่าผู้กู้ยืมดีเด่น",
          quote: "การวางแผนทางการเงินและการมีวินัยในการคืนเงินกู้ ทำให้เรามีประวัติทางการเงินที่ดีและภูมิใจในตัวเอง",
          role: "ผู้จัดการฝ่ายบัญชี บริษัทมหาชน"
        }
      ];
    }

    const listHtml = list.map((item, idx) => `
      <div class="info-card-item" style="border-left-color: #f59e0b; background: #fffbeb; padding: 14px; margin-bottom: 12px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h4 style="color: #b45309; font-size: 15px; margin: 0;">${item.name}</h4>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${item.faculty}</div>
            <div style="font-size: 12px; color: #374151; font-weight: 600; margin-top: 2px;">ตำแหน่ง: ${item.role}</div>
          </div>
          <span style="font-size: 26px;">🏆</span>
        </div>
        <div style="margin: 10px 0; padding: 10px; background: #ffffff; border-radius: 6px; border-left: 3px solid #f59e0b; font-style: italic; font-size: 13px; color: #4b5563;">
          "${item.quote}"
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span class="badge-tag" style="background: #fef3c7; color: #b45309; margin: 0;">
            ${item.status}
          </span>
          <button type="button" class="btn-submit btn-like-hall" data-idx="${idx}" style="width: auto; padding: 4px 12px; font-size: 12px; margin: 0; background: #fee2e2; color: #dc2626; border: 1px solid #fecdd3;">
            ❤️ ชื่นชม (<span class="like-cnt">${24 + idx * 9}</span>)
          </button>
        </div>
      </div>
    `).join('');

    const html = `
      <div style="text-align: center; margin-bottom: 14px;">
        <span style="font-size: 32px;">🎓</span>
        <h3 style="color: var(--primary-red); margin-top: 4px; font-size: 17px;">Hall of Fame ศิษย์เก่าตัวอย่าง กยศ. SKRU</h3>
        <p style="font-size: 12.5px; color: #6b7280;">ร่วมส่งต่อโอกาสและแรงบันดาลใจแห่งความกตัญญูและการมีวินัยทางการเงิน</p>
      </div>
      ${listHtml}
      <button type="button" class="btn-submit" id="btnShareStory" style="margin-top: 8px;">
        ส่งเรื่องราวความสำเร็จของคุณ
      </button>
    `;

    openModal('Hall of Fame ศิษย์เก่าตัวอย่าง', html);

    document.querySelectorAll('.btn-like-hall').forEach(btn => {
      btn.onclick = () => {
        const cntSpan = btn.querySelector('.like-cnt');
        let count = parseInt(cntSpan.textContent, 10) || 0;
        cntSpan.textContent = (count + 1).toString();
        btn.style.background = '#dc2626';
        btn.style.color = '#ffffff';
        showToast('ขอบคุณที่ร่วมส่งกำลังใจให้ศิษย์เก่าตัวอย่าง!');
      };
    });

    const btnShare = document.getElementById('btnShareStory');
    if (btnShare) {
      btnShare.onclick = () => {
        showToast('กรุณาติดต่อฝ่ายแนะแนวและทุนการศึกษา มรภ.สงขลา เพื่อเสนอชื่อศิษย์เก่า');
      };
    }
  }

  async function renderNewsModal() {
    const res = await API.getNews();
    const news = res.data;
    const newsHtml = news.map(n => {
      let sched = '';
      if (n.schedule) {
        const sRows = n.schedule.map(s => '<div style="margin-top: 3px;">• <strong>' + s.period + ':</strong> ' + s.desc + '</div>').join('');
        sched = '<div style="margin-top: 8px; background: #fff; padding: 8px; border-radius: 4px; font-size: 12px;"><strong>กำหนดการสำคัญ:</strong>' + sRows + '</div>';
      }
      return `
        <div class="info-card-item">
          <span class="badge-tag">${n.category}</span>
          <h4 style="margin-top: 4px;">${n.title}</h4>
          <p style="margin-top: 6px; font-size: 13px; color: #4b5563;">${n.content}</p>
          ${sched}
        </div>
      `;
    }).join('');

    const html = `
      <h3 style="color: var(--primary-red); margin-bottom: 14px;">ข่าวประชาสัมพันธ์ กยศ.</h3>
      ${newsHtml}
    `;
    openModal('ข่าวประชาสัมพันธ์', html);
  }
});
