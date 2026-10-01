const API = {
  async getNews() {
    const res = await fetch('/api/news');
    return res.json();
  },
  async getLoanInfo() {
    const res = await fetch('/api/loans/info');
    return res.json();
  },
  async getInstitutionInfo() {
    const res = await fetch('/api/institution');
    return res.json();
  },
  async getRepaymentInfo() {
    const res = await fetch('/api/repayments/info');
    return res.json();
  },
  async registerRepayment(payload) {
    const res = await fetch('/api/repayments/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async checkRepaymentStatus(query) {
    const res = await fetch('/api/repayments/status/' + encodeURIComponent(query));
    return res.json();
  },
  async getSalaryDeductionInfo() {
    const res = await fetch('/api/salary-deduction');
    return res.json();
  },
  async getVolunteerActivities() {
    const res = await fetch('/api/volunteer');
    return res.json();
  },
  async getHallOfFame() {
    const res = await fetch('/api/hall-of-fame');
    return res.json();
  }
};
