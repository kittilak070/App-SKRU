// Student Profile Frontend Application

let currentStudent = null;

// DOM Elements
const photoContainer = document.getElementById('photoContainer');
const studentPhotoBox = document.getElementById('studentPhotoBox');
const photoFileInput = document.getElementById('photoFileInput');
const btnChoosePhoto = document.getElementById('btnChoosePhoto');
const btnResetPhoto = document.getElementById('btnResetPhoto');

const card1NameTh = document.getElementById('card1NameTh');
const card1NameEn = document.getElementById('card1NameEn');
const card1Status = document.getElementById('card1Status');
const card1StudentId = document.getElementById('card1StudentId');
const card1Faculty = document.getElementById('card1Faculty');
const card1Major = document.getElementById('card1Major');
const card1DegreeLevel = document.getElementById('card1DegreeLevel');
const card1YearLevel = document.getElementById('card1YearLevel');

const card2NameTh = document.getElementById('card2NameTh');
const card2BirthDate = document.getElementById('card2BirthDate');
const card2Phone = document.getElementById('card2Phone');
const card2Email = document.getElementById('card2Email');
const card2Address = document.getElementById('card2Address');
const card2Major = document.getElementById('card2Major');
const card2Curriculum = document.getElementById('card2Curriculum');
const card2AdmissionYear = document.getElementById('card2AdmissionYear');
const card2Status = document.getElementById('card2Status');
const card2Gpa = document.getElementById('card2Gpa');

// Buttons & Modals
const btnCopyId = document.getElementById('btnCopyId');
const btnOpenEdit = document.getElementById('btnOpenEdit');
const btnCloseEdit = document.getElementById('btnCloseEdit');
const btnCancelEdit = document.getElementById('btnCancelEdit');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const btnNotification = document.getElementById('btnNotification');
const notificationsPanel = document.getElementById('notificationsPanel');
const btnCloseNotif = document.getElementById('btnCloseNotif');
const btnBack = document.getElementById('btnBack');
const toastMsg = document.getElementById('toastMsg');
const toastText = document.getElementById('toastText');

// Form Inputs
const inputNameTh = document.getElementById('inputNameTh');
const inputNameEn = document.getElementById('inputNameEn');
const inputBirthDate = document.getElementById('inputBirthDate');
const inputPhone = document.getElementById('inputPhone');
const inputEmail = document.getElementById('inputEmail');
const inputAddress = document.getElementById('inputAddress');
const inputGpa = document.getElementById('inputGpa');

// Show Toast Message
function showToast(message) {
  toastText.textContent = message;
  toastMsg.classList.add('show');
  setTimeout(() => {
    toastMsg.classList.remove('show');
  }, 2500);
}

// Fetch Student Data from Node.js Backend
async function loadStudentData() {
  try {
    const res = await fetch('/api/student');
    const result = await res.json();
    if (result.success && result.data) {
      currentStudent = result.data;
      renderStudentData(currentStudent);
    }
  } catch (error) {
    console.error('Failed to load student data:', error);
    showToast('โหลดข้อมูลล้มเหลว กรุณาตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์');
  }
}

// Render Photo Container + Top Avatar Circle
function renderPhoto(avatarUrl) {
  const topAvatar = document.getElementById('btnTopAvatar');
  if (avatarUrl && avatarUrl.trim() !== '') {
    photoContainer.innerHTML = `<img src="${avatarUrl}" alt="รูปถ่ายนักศึกษา" class="student-photo-img">`;
    // Update top-right avatar circle with the same photo
    topAvatar.innerHTML = `<img src="${avatarUrl}" alt="โปรไฟล์" class="top-avatar-img">`;
  } else {
    photoContainer.innerHTML = `<div class="badge-skru-art">SKRU</div>`;
    // Reset top-right avatar to default silhouette
    topAvatar.innerHTML = `<svg viewBox="0 0 24 24" class="user-silhouette-svg">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#555555"/>
    </svg>`;
  }
}

// Render data to DOM
function renderStudentData(student) {
  // Photo
  renderPhoto(student.avatarUrl);

  // Card 1
  card1NameTh.textContent = student.nameTh || 'นาย อดีต คิ้วโก่ง';
  card1NameEn.textContent = student.nameEn || 'ADEET KIWKHONG';
  card1Status.textContent = student.studentType || 'นักศึกษาภาคปกติ';
  card1StudentId.textContent = student.studentId || '674295067';
  card1Faculty.textContent = student.faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี';
  card1Major.textContent = student.major || 'เทคโนโลยีสารสนเทศ';
  card1DegreeLevel.textContent = student.degreeLevel || 'ปริญญาตรี 4 ปี';
  card1YearLevel.textContent = student.yearLevel || 'ปีที่ 3';

  // Card 2
  card2NameTh.textContent = student.nameTh || 'นาย อดีต คิ้วโก่ง';
  card2BirthDate.textContent = student.birthDate || '12 มกราคม 2547';
  card2Phone.textContent = student.phone || '081-234-5678';
  card2Email.textContent = student.email || '67295067@parichat.skru.ac.th';
  
  if (student.address) {
    card2Address.innerHTML = student.address.replace(/\n/g, '<br>');
  } else {
    card2Address.innerHTML = '123/45 หมู่ 6 ต.เขารูปช้าง<br>อ.เมืองสงขลา จ.สงขลา<br>90000';
  }

  card2Major.textContent = student.major || 'เทคโนโลยีสารสนเทศ';
  card2Curriculum.textContent = student.curriculum || 'วิทยาศาสตรบัณฑิต (วท.บ.)';
  card2AdmissionYear.textContent = student.admissionYear || '2566';
  card2Status.textContent = student.status || 'ปกติ';
  card2Gpa.textContent = student.gpa || '5.00';
}

// Handle Photo File Selection & Upload
async function handlePhotoFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
    return;
  }

  showToast('กำลังอัปโหลดรูปภาพ...');

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    try {
      const res = await fetch('/api/student/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });
      const result = await res.json();
      if (result.success) {
        if (currentStudent) {
          currentStudent.avatarUrl = result.avatarUrl;
        }
        renderPhoto(result.avatarUrl);
        showToast('เปลี่ยนรูปภาพเรียบร้อยแล้ว!');
      } else {
        showToast(result.message || 'อัปโหลดรูปภาพไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      showToast('เกิดข้อผิดพลาดในการอัปโหลด');
    }
  };
  reader.readAsDataURL(file);
}

// Reset Photo to SKRU Logo
async function resetPhotoToLogo() {
  showToast('กำลังรีเซ็ตรูปภาพ...');
  try {
    const res = await fetch('/api/student/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: null })
    });
    const result = await res.json();
    if (result.success) {
      if (currentStudent) {
        currentStudent.avatarUrl = null;
      }
      renderPhoto(null);
      showToast('รีเซ็ตเป็นโลโก้ SKRU เรียบร้อยแล้ว!');
    } else {
      showToast(result.message || 'รีเซ็ตไม่สำเร็จ');
    }
  } catch (err) {
    console.error('Error resetting photo:', err);
    showToast('เกิดข้อผิดพลาดในการรีเซ็ต');
  }
}

// Open Edit Modal with current values
function openEditModal() {
  if (!currentStudent) return;
  inputNameTh.value = currentStudent.nameTh || '';
  inputNameEn.value = currentStudent.nameEn || '';
  inputBirthDate.value = currentStudent.birthDate || '';
  inputPhone.value = currentStudent.phone || '';
  inputEmail.value = currentStudent.email || '';
  inputAddress.value = (currentStudent.address || '').replace(/<br\s*\/?>/gi, '\n');
  inputGpa.value = currentStudent.gpa || '';
  editModal.classList.add('active');
}

function closeEditModal() {
  editModal.classList.remove('active');
}

// Handle Edit Form Submission
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const updatedData = {
    ...currentStudent,
    nameTh: inputNameTh.value.trim(),
    nameEn: inputNameEn.value.trim(),
    birthDate: inputBirthDate.value.trim(),
    phone: inputPhone.value.trim(),
    email: inputEmail.value.trim(),
    address: inputAddress.value.trim(),
    gpa: inputGpa.value.trim()
  };

  try {
    const res = await fetch('/api/student', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });
    const result = await res.json();
    if (result.success) {
      currentStudent = result.data;
      renderStudentData(currentStudent);
      closeEditModal();
      showToast('บันทึกข้อมูลเรียบร้อยแล้ว');
    } else {
      showToast(result.message || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  } catch (err) {
    console.error('Error saving data:', err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }
});

// Copy Student ID
btnCopyId.addEventListener('click', () => {
  const id = card1StudentId.textContent.trim();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(id).then(() => {
      showToast(`คัดลอกรหัส ${id} แล้ว!`);
    }).catch(() => {
      fallbackCopy(id);
    });
  } else {
    fallbackCopy(id);
  }
});

function fallbackCopy(text) {
  const tempInput = document.createElement('input');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
  showToast(`คัดลอกรหัส ${text} แล้ว!`);
}

// Event Listeners for Photo Upload
studentPhotoBox.addEventListener('click', () => {
  photoFileInput.click();
});

photoFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handlePhotoFile(e.target.files[0]);
    e.target.value = ''; // Reset input to allow re-selecting same file if needed
  }
});

btnChoosePhoto.addEventListener('click', () => {
  photoFileInput.click();
});

btnResetPhoto.addEventListener('click', resetPhotoToLogo);

// Event Listeners for UI
btnOpenEdit.addEventListener('click', openEditModal);
btnCloseEdit.addEventListener('click', closeEditModal);
btnCancelEdit.addEventListener('click', closeEditModal);

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) {
    closeEditModal();
  }
});

btnNotification.addEventListener('click', (e) => {
  e.stopPropagation();
  notificationsPanel.classList.toggle('active');
});

btnCloseNotif.addEventListener('click', () => {
  notificationsPanel.classList.remove('active');
});

document.addEventListener('click', (e) => {
  if (!notificationsPanel.contains(e.target) && e.target !== btnNotification) {
    notificationsPanel.classList.remove('active');
  }
});

btnBack.addEventListener('click', () => {
  showToast('ย้อนกลับ');
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadStudentData);
