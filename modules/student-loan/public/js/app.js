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
    const res = await API.getSalaryDeductionInfo();
    const data = res.data;
    const detailsHtml = data.details.map(d => '<li>' + d + '</li>').join('');
    const html = `
      <h3 style="color: var(--primary-red); margin-bottom: 8px;">${data.title}</h3>
      <p style="margin-bottom: 14px; color: #4b5563;">${data.description}</p>
      <div class="info-card-item">
        <h4>แนวทางการดำเนินงาน</h4>
        <ul style="padding-left: 18px; margin-top: 6px;">${detailsHtml}</ul>
      </div>
      <div class="info-card-item">
        <h4>สำหรับฝ่ายทรัพยากรบุคคล / นายจ้าง</h4>
        <p>นำส่งเงินหักผ่านระบบ e-Pay and Transfer หรือแอปพลิเคชันที่กองทุนฯ กำหนด ภายในวันที่ 15 ของทุกเดือน</p>
      </div>
    `;
    openModal('การหักเงินเดือน', html);
  }

  async function renderVolunteerModal() {
    const res = await API.getVolunteerActivities();
    const list = res.data;
    const listHtml = list.map(v => `
      <div class="info-card-item">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4>${v.title}</h4>
          <span class="badge-tag" style="margin: 0;">${v.hours} ชั่วโมง</span>
        </div>
        <p style="margin-top: 4px; font-size: 13px;">📍 สถานที่: ${v.location}</p>
        <p style="font-size: 13px;">📅 วันที่จัด: ${v.date}</p>
      </div>
    `).join('');

    const html = `
      <div class="badge-tag">สะสมครบ 36 ชั่วโมง/ปีการศึกษา</div>
      <h3 style="color: var(--primary-red); margin-bottom: 12px;">กิจกรรมจิตสาธารณะ กยศ. SKRU</h3>
      ${listHtml}
      <button class="btn-submit" onclick="alert('ระบบเปิดรับลงทะเบียนจิตอาสาผ่านระบบสารสนเทศนักศึกษา SKRU')">บันทึกรับรองชั่วโมงจิตอาสา</button>
    `;
    openModal('กิจกรรมจิตสาธารณะ กยศ.', html);
  }

  async function renderHallOfFameModal() {
    const res = await API.getHallOfFame();
    const list = res.data;
    const listHtml = list.map(item => `
      <div class="info-card-item" style="border-left-color: #f59e0b;">
        <h4 style="color: #b45309;">${item.name}</h4>
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">${item.faculty} | ${item.role}</div>
        <p style="font-style: italic; color: #374151;">"${item.quote}"</p>
        <div style="margin-top: 6px;"><span class="badge-tag" style="background: #fef3c7; color: #b45309;">${item.status}</span></div>
      </div>
    `).join('');

    const html = `
      <h3 style="color: var(--primary-red); margin-bottom: 12px;">Hall of Fame ศิษย์เก่าตัวอย่าง</h3>
      ${listHtml}
    `;
    openModal('Hall of Fame', html);
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
