const consentForm = document.getElementById('consent-form');
const submitBtn = document.getElementById('submit-btn');
const toastEl = document.getElementById('toast');

let toastTimeout;
function showToast(message, type = 'success') {
    if (!toastEl) return;
    clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.className = `toast show ${type}`;
    toastTimeout = setTimeout(() => {
        toastEl.className = 'toast';
    }, 3500);
}

consentForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const payload = {
        consent1: formData.get('consent1'),
        consent2: formData.get('consent2'),
        consent3: formData.get('consent3')
    };

    if (!payload.consent1 || !payload.consent2 || !payload.consent3) {
        showToast('กรุณาเลือกความยินยอมให้ครบทุกข้อ', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังบันทึก...';

        const response = await fetch('/api/consent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showToast('บันทึกข้อมูลความยินยอมสำเร็จ', 'success');
        } else {
            showToast(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'ยืนยัน';
    }
});

function handleBack() {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'closeApp' }, '*');
    } else if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/index.html';
    }
}
