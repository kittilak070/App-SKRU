// api.js - API client for communicating with Node.js backend
const API_BASE = window.location.origin;

const API = {
  // Check backend health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/api/student-stats`);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Get activities with optional search and category
  async getActivities(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.category) query.append('category', params.category);

    const res = await fetch(`${API_BASE}/api/activities?${query.toString()}`);
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลกิจกรรมได้');
    return await res.json();
  },

  // Book an activity
  async bookActivity(payload) {
    const res = await fetch(`${API_BASE}/api/activities/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'การจองไม่สำเร็จ');
    return data;
  },

  // Register with Activity Code
  async registerByCode(payload) {
    const res = await fetch(`${API_BASE}/api/activities/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'รหัสกิจกรรมไม่ถูกต้อง');
    return data;
  },

  // Get current student bookings
  async getMyBookings(studentId) {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
    const res = await fetch(`${API_BASE}/api/my-bookings${query}`);
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลการลงทะเบียนได้');
    return await res.json();
  },

  // Cancel booking
  async cancelBooking(bookingId) {
    const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'ยกเลิกการจองไม่สำเร็จ');
    return data;
  },

  // Get student stats
  async getStudentStats() {
    const res = await fetch(`${API_BASE}/api/student-stats`);
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลสถิติได้');
    return await res.json();
  },

  // Get notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/api/notifications`);
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลการแจ้งเตือนได้');
    return await res.json();
  }
};

window.API = API;
