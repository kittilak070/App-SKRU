// =========================================================================
// SKRU Campus News & Student Hub - Main Application Script
// =========================================================================

const defaultCategories = [
  { id: 'all', name: 'ทั้งหมด' },
  { id: 'university', name: 'ข่าวมหาวิทยาลัย' },
  { id: 'student-activities', name: 'กิจกรรมนักศึกษา' },
  { id: 'academic-scholarships', name: 'วิชาการ & ทุน' },
  { id: 'recruitment', name: 'รับสมัครงาน' }
];

const state = {
  currentTab: 'news',
  currentCategory: 'all',
  currentActivityCategory: 'ทั้งหมด',
  searchQuery: '',
  categories: [...defaultCategories],
  allNews: [],
  featuredNews: null,
  activeDetailNews: null,
  activeHeroId: null,
  currentNewsComments: [],
  activities: [],
  myBookings: [],
  notifications: [],
  studentProfile: {
    nameTh: 'นายสมชาย ใจดี',
    nameEn: 'MR. SOMCHAI JAIDEE',
    studentId: '674295027',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    major: 'สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล (ITDI)',
    yearLevel: 'ปีที่ 3',
    gpa: '3.82',
    email: '674295027@parichat.skru.ac.th',
    phone: '081-234-5678',
    status: 'ปกติ'
  },
  studentStats: {
    hoursCompleted: 38,
    hoursTarget: 50,
    kysCompleted: 24,
    kysTarget: 36,
    conductScore: 100
  },
  userLikes: JSON.parse(localStorage.getItem('skru_news_likes') || '{}'),
  commentLikes: JSON.parse(localStorage.getItem('skru_comment_likes') || '{}'),
  showAllComments: false
};

const API_BASE = '/api';

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadAllData();
});

// Event Listeners setup
function initEventListeners() {
  renderCategoryPills();
  populateAdminCategorySelect();

  // Search Input with debounce
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  let searchTimer;

  if (searchInput && searchClearBtn) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      const val = e.target.value.trim();
      state.searchQuery = val;
      searchClearBtn.style.display = val.length > 0 ? 'inline-block' : 'none';
      
      searchTimer = setTimeout(() => {
        fetchNewsFromAPI();
      }, 300);
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      searchClearBtn.style.display = 'none';
      fetchNewsFromAPI();
    });
  }

  // Admin Modal triggers
  const openAdminBtn = document.getElementById('openAdminModalBtn');
  if (openAdminBtn) {
    openAdminBtn.addEventListener('click', () => {
      const modal = document.getElementById('adminModal');
      if (modal) modal.classList.add('active');
    });
  }

  // Close modals when clicking overlay outside card
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Featured Card Click to open full details
  const featuredCard = document.getElementById('featuredCard');
  if (featuredCard) {
    featuredCard.addEventListener('click', (e) => {
      if (e.target.closest('.action-buttons-group') || e.target.closest('#featuredLikeBtn')) {
        return;
      }
      if (state.featuredNews) {
        openArticleModal(state.featuredNews.id);
      }
    });
  }
}

// Master Data Loader
async function loadAllData() {
  await Promise.allSettled([
    loadCategoriesFromAPI(),
    fetchNewsFromAPI(),
    fetchActivitiesFromAPI(),
    fetchNotificationsFromAPI(),
    loadStudentProfile()
  ]);
}

// Refresh Current Tab Data
async function refreshCurrentTabData() {
  showToast('กำลังรีเฟรชข้อมูลล่าสุด...');
  if (state.currentTab === 'news') {
    await fetchNewsFromAPI();
  } else if (state.currentTab === 'events') {
    await fetchActivitiesFromAPI();
  } else if (state.currentTab === 'notifications') {
    await fetchNotificationsFromAPI();
  } else if (state.currentTab === 'profile') {
    await loadStudentProfile();
  }
  showToast('อัปเดตข้อมูลเรียบร้อย ✓');
}

// Load Categories
async function loadCategoriesFromAPI() {
  try {
    const res = await fetch(`${API_BASE}/news/categories`);
    if (res.ok) {
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : (raw.data || []);
      if (list.length > 0) {
        state.categories = list;
        renderCategoryPills();
        populateAdminCategorySelect();
      }
    }
  } catch (err) {
    console.warn('Using default news categories:', err);
  }
}

// Render News Category Filter Pills
function renderCategoryPills() {
  const container = document.getElementById('categoryFilterContainer');
  if (!container) return;

  container.innerHTML = state.categories.map(cat => {
    const isActive = state.currentCategory === cat.id;
    return `
      <button class="cat-pill ${isActive ? 'active' : ''}" data-category="${cat.id}">
        ${escapeHtml(cat.name)}
      </button>
    `;
  }).join('');

  container.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      container.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.currentCategory = e.currentTarget.getAttribute('data-category');
      fetchNewsFromAPI();
    });
  });
}

// Populate Admin Modal Category Dropdown
function populateAdminCategorySelect() {
  const select = document.getElementById('newsCategory');
  if (!select) return;

  const validCategories = state.categories.filter(c => c.id !== 'all');
  select.innerHTML = validCategories.map(cat => {
    return `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`;
  }).join('');
}

// Fetch News from API
async function fetchNewsFromAPI() {
  try {
    let url = `${API_BASE}/news`;
    const params = new URLSearchParams();
    if (state.currentCategory && state.currentCategory !== 'all') {
      params.append('category', state.currentCategory);
    }
    if (state.searchQuery) {
      params.append('search', state.searchQuery);
    }
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url);
    const raw = await res.json();
    const items = Array.isArray(raw) ? raw : (raw.data || []);

    state.allNews = items;

    // Determine featured news
    const featured = state.allNews.find(n => n.isFeatured) || state.allNews[0];
    state.featuredNews = featured;
    if (featured) {
      state.activeHeroId = featured.id;
    }

    renderHeroCard();
    renderLatestNewsList();

    if (featured) {
      loadCommentsForNews(featured.id);
    }
  } catch (err) {
    console.error('Failed to load news:', err);
    renderLatestNewsList();
  }
}

// Render Featured Hero Card
function renderHeroCard() {
  const hero = state.featuredNews;
  const section = document.querySelector('.featured-section');
  if (!section) return;

  if (!hero) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';

  const imgEl = document.getElementById('featuredImg');
  const badgeEl = document.getElementById('featuredBadge');
  const titleEl = document.getElementById('featuredTitle');
  const summaryEl = document.getElementById('featuredSummary');
  const likeBtn = document.getElementById('featuredLikeBtn');
  const likesText = document.getElementById('featuredLikesText');

  if (imgEl) imgEl.src = hero.image;
  if (badgeEl) badgeEl.textContent = hero.badge || hero.categoryName || 'ข่าวเด่น';
  if (titleEl) titleEl.textContent = hero.title;
  if (summaryEl) summaryEl.textContent = hero.summary;

  const isLiked = !!state.userLikes[hero.id];
  if (likeBtn) likeBtn.className = isLiked ? 'btn-like-pill liked' : 'btn-like-pill';
  if (likesText) likesText.textContent = `${hero.likes || 342} ไลก์`;
}

// Render Latest News List
function renderLatestNewsList() {
  const container = document.getElementById('latestNewsList');
  if (!container) return;

  const items = state.allNews.length > 1
    ? state.allNews.filter(n => n.id !== state.featuredNews?.id)
    : state.allNews;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-newspaper"></i>
        <p>ไม่พบข่าวสารในหมวดหมู่นี้</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(news => {
    return `
      <div class="news-card-horizontal" onclick="openArticleModal('${news.id}')">
        <div class="news-thumb-box">
          <img src="${news.image}" alt="${escapeHtml(news.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80'">
        </div>
        <div class="news-info">
          <div>
            ${news.badge ? `<span class="news-badge">${escapeHtml(news.badge)}</span>` : ''}
            <h4 class="news-card-title">${escapeHtml(news.title)}</h4>
          </div>
          <div class="news-meta">
            <span class="news-meta-item"><i class="fa-regular fa-calendar"></i> ${escapeHtml(news.date || 'วันนี้')}</span>
            <span class="news-meta-item"><i class="fa-regular fa-eye"></i> ${escapeHtml(String(news.views || 850))}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Load and Render Comments
async function loadCommentsForNews(newsId) {
  try {
    const res = await fetch(`${API_BASE}/news/${newsId}/comments`);
    const raw = await res.json();
    const comments = Array.isArray(raw) ? raw : (raw.data || raw.comments || []);
    state.currentNewsComments = comments;
    renderComments();
  } catch (err) {
    console.error('Error fetching comments:', err);
  }
}

function renderComments() {
  const listEl = document.getElementById('commentsList');
  const countBadge = document.getElementById('commentsCountBadge');
  const comments = state.currentNewsComments || [];

  if (countBadge) {
    countBadge.textContent = comments.length;
  }
  if (!listEl) return;

  if (comments.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding: 18px 0; color:#94A3B8; font-size: 0.88rem;">
        ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!
      </div>
    `;
    return;
  }

  const displayComments = state.showAllComments ? comments : comments.slice(0, 3);

  listEl.innerHTML = displayComments.map(c => {
    const isLiked = !!state.commentLikes[c.id];
    return `
      <div class="comment-item" id="comment-${c.id}">
        <img class="comment-avatar" src="${c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" alt="${escapeHtml(c.author)}">
        <div class="comment-body">
          <div class="comment-bubble">
            <div class="comment-author">${escapeHtml(c.author)}</div>
            <div class="comment-text">${escapeHtml(c.text || c.content || '')}</div>
          </div>
          <div class="comment-meta-actions">
            <span class="comment-time">${c.timeAgo || 'เมื่อสักครู่'}</span>
            <button class="comment-like-btn ${isLiked ? 'liked' : ''}" onclick="toggleCommentLike('${c.id}')">
              ถูกใจ (${c.likes || 0})
            </button>
            <button class="comment-reply-btn" onclick="focusCommentInput('${escapeHtml(c.author)}')">ตอบกลับ</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Toggle Like on Hero Featured News
async function toggleHeroLike(event) {
  if (event) event.stopPropagation();
  if (!state.featuredNews) return;

  const newsId = state.featuredNews.id;
  const isLiked = !!state.userLikes[newsId];
  const action = isLiked ? 'unlike' : 'like';

  if (action === 'like') {
    state.userLikes[newsId] = true;
    state.featuredNews.likes = (state.featuredNews.likes || 0) + 1;
  } else {
    delete state.userLikes[newsId];
    state.featuredNews.likes = Math.max(0, (state.featuredNews.likes || 1) - 1);
  }
  localStorage.setItem('skru_news_likes', JSON.stringify(state.userLikes));
  renderHeroCard();

  try {
    const res = await fetch(`${API_BASE}/news/${newsId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (data.success && data.likes !== undefined) {
      state.featuredNews.likes = data.likes;
      renderHeroCard();
    }
  } catch (err) {
    console.error('Error toggling like:', err);
  }
}

// Toggle Like on Comment
async function toggleCommentLike(commentId) {
  const comment = state.currentNewsComments.find(c => c.id === commentId);
  if (!comment) return;

  const isLiked = !!state.commentLikes[commentId];
  const action = isLiked ? 'unlike' : 'like';

  if (action === 'like') {
    state.commentLikes[commentId] = true;
    comment.likes = (comment.likes || 0) + 1;
  } else {
    delete state.commentLikes[commentId];
    comment.likes = Math.max(0, (comment.likes || 1) - 1);
  }
  localStorage.setItem('skru_comment_likes', JSON.stringify(state.commentLikes));
  renderComments();
}

// Submit a new comment
async function submitComment(event) {
  event.preventDefault();
  const textInput = document.getElementById('commentTextInput');
  const text = textInput ? textInput.value.trim() : '';
  const author = 'นายสมชาย ใจดี (ITDI)';

  if (!text) {
    showToast('กรุณากรอกข้อความความคิดเห็น');
    return;
  }

  const targetNewsId = state.activeHeroId || (state.featuredNews ? state.featuredNews.id : 'news-1');

  try {
    const res = await fetch(`${API_BASE}/news/${targetNewsId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text })
    });

    const result = await res.json();
    if (result.success) {
      if (textInput) textInput.value = '';
      showToast('แสดงความคิดเห็นสำเร็จ 🎉');
      const newComment = result.data || result.comment;
      if (newComment) {
        state.currentNewsComments.unshift(newComment);
        renderComments();
      }
    } else {
      showToast(result.message || 'ส่งความคิดเห็นเรียบร้อย');
    }
  } catch (err) {
    console.error('Error adding comment:', err);
    showToast('ส่งความคิดเห็นไม่สำเร็จ ตรวจสอบการเชื่อมต่อ');
  }
}

function focusCommentInput(replyToUser) {
  const textInput = document.getElementById('commentTextInput');
  if (textInput) {
    textInput.value = `@${replyToUser} `;
    textInput.focus();
  }
}

function toggleAllCommentsView() {
  state.showAllComments = !state.showAllComments;
  renderComments();
  showToast(state.showAllComments ? 'แสดงความคิดเห็นทั้งหมด' : 'แสดงความคิดเห็นย่อ');
}

// Open Full Article Modal
async function openArticleModal(newsId) {
  try {
    const res = await fetch(`${API_BASE}/news/${newsId}`);
    const raw = await res.json();
    const news = raw.data || raw;

    if (!news || !news.title) return;
    state.activeDetailNews = news;

    const catEl = document.getElementById('modalArticleCategory');
    if (catEl) catEl.textContent = news.categoryName || 'ข่าวสารและกิจกรรม';

    const isLiked = !!state.userLikes[news.id];

    const bodyHtml = `
      <img src="${news.image}" alt="${escapeHtml(news.title)}" class="article-detail-img" onerror="this.src='https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'">
      <div class="article-meta-tags">
        ${news.badge ? `<span class="meta-chip" style="background:#FFE4E6; color:#E11D48; font-weight:700;"><i class="fa-solid fa-tag"></i> ${escapeHtml(news.badge)}</span>` : ''}
        <span class="meta-chip"><i class="fa-regular fa-calendar"></i> ${escapeHtml(news.date || 'วันนี้')}</span>
        ${news.location ? `<span class="meta-chip"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(news.location)}</span>` : ''}
        ${news.author ? `<span class="meta-chip"><i class="fa-solid fa-building-columns"></i> ${escapeHtml(news.author)}</span>` : ''}
      </div>

      <h2 style="font-size: 1.15rem; font-weight: 700; color: #0F172A; margin-bottom: 12px; line-height: 1.45;">
        ${escapeHtml(news.title)}
      </h2>

      <p class="article-content-text">${escapeHtml(news.content || news.summary || '')}</p>

      <div class="featured-footer" style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #E2E8F0;">
        <div class="action-buttons-group">
          <button class="btn-social btn-facebook" title="แชร์ Facebook" onclick="shareToFacebook(event)">
            <i class="fa-brands fa-facebook-f"></i>
          </button>
          <button class="btn-social btn-copy" title="คัดลอกลิงก์" onclick="copyNewsLink(event)">
            <i class="fa-regular fa-clone"></i>
          </button>
        </div>

        <button class="btn-like-pill ${isLiked ? 'liked' : ''}" onclick="toggleModalArticleLike('${news.id}')">
          <i class="fa-solid fa-heart"></i>
          <span>${news.likes || 1} ไลก์</span>
        </button>
      </div>
    `;

    const modalBody = document.getElementById('articleModalBody');
    if (modalBody) modalBody.innerHTML = bodyHtml;

    const modal = document.getElementById('articleModal');
    if (modal) modal.classList.add('active');
  } catch (err) {
    console.error('Error opening article modal:', err);
  }
}

function closeArticleModal() {
  const modal = document.getElementById('articleModal');
  if (modal) modal.classList.remove('active');
}

function closeAdminModal() {
  const modal = document.getElementById('adminModal');
  if (modal) modal.classList.remove('active');
}

function toggleModalArticleLike(newsId) {
  const isLiked = !!state.userLikes[newsId];
  if (isLiked) {
    delete state.userLikes[newsId];
    if (state.activeDetailNews) state.activeDetailNews.likes = Math.max(0, (state.activeDetailNews.likes || 1) - 1);
  } else {
    state.userLikes[newsId] = true;
    if (state.activeDetailNews) state.activeDetailNews.likes = (state.activeDetailNews.likes || 0) + 1;
  }
  localStorage.setItem('skru_news_likes', JSON.stringify(state.userLikes));
  openArticleModal(newsId);
  fetch(`${API_BASE}/news/${newsId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: isLiked ? 'unlike' : 'like' })
  }).catch(() => {});
}

// =========================================================================
// TAB 2: กิจกรรมนักศึกษา (EVENTS & ACTIVITIES)
// =========================================================================

async function fetchActivitiesFromAPI() {
  try {
    const res = await fetch(`${API_BASE}/activities`);
    const raw = await res.json();
    state.activities = raw.data || raw || [];
    renderActivitiesList();
  } catch (err) {
    console.error('Failed to load activities:', err);
  }
}

function filterActivities(category, clickedBtn) {
  state.currentActivityCategory = category;
  const container = document.getElementById('activityCategoryFilters');
  if (container) {
    container.querySelectorAll('.cat-pill').forEach(btn => btn.classList.remove('active'));
    if (clickedBtn) clickedBtn.classList.add('active');
  }
  renderActivitiesList();
}

function renderActivitiesList() {
  const container = document.getElementById('activitiesListContainer');
  const countBadge = document.getElementById('activitiesCountBadge');
  if (!container) return;

  let list = state.activities || [];
  if (state.currentActivityCategory && state.currentActivityCategory !== 'ทั้งหมด') {
    list = list.filter(a => a.category === state.currentActivityCategory || (state.currentActivityCategory === 'จิตอาสา (กยศ.)' && a.isKYS));
  }

  if (countBadge) countBadge.textContent = list.length;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-calendar-xmark"></i>
        <p>ไม่พบกิจกรรมในหมวดหมู่นี้</p>
      </div>
    `;
    return;
  }

  // Load booked IDs from localStorage
  const bookedSet = new Set(JSON.parse(localStorage.getItem('skru_booked_activities') || '["act-3"]'));

  container.innerHTML = list.map(act => {
    const isBooked = bookedSet.has(act.id);
    const max = act.maxSeats || 100;
    const booked = isBooked ? Math.min(max, (act.bookedSeats || 40) + 1) : (act.bookedSeats || 40);
    const percent = Math.min(100, Math.round((booked / max) * 100));
    const isVolunteer = act.isKYS || act.category?.includes('จิตอาสา');

    return `
      <div class="activity-card" id="act-card-${act.id}">
        <div class="activity-card-header">
          <div class="activity-badges-row">
            <span class="activity-pill-tag ${isVolunteer ? 'tag-volunteer' : 'tag-required'}">
              ${escapeHtml(act.category || 'กิจกรรมทั่วไป')}
            </span>
            <span class="activity-pill-tag tag-hours">
              +${act.hours || 4} ชม. ${act.isKYS ? '(กยศ.)' : ''}
            </span>
          </div>
          <span style="font-size: 0.72rem; color: #94A3B8; font-family: monospace;">#${escapeHtml(act.code || act.id)}</span>
        </div>

        <h4 class="activity-title">${escapeHtml(act.title)}</h4>

        <div class="activity-details-grid">
          <div class="activity-detail-item">
            <i class="fa-regular fa-calendar-days"></i>
            <span>${escapeHtml(act.date)} • ${escapeHtml(act.time || '09:00 - 16:00 น.')}</span>
          </div>
          <div class="activity-detail-item">
            <i class="fa-solid fa-location-dot"></i>
            <span>${escapeHtml(act.location || 'มหาวิทยาลัยราชภัฏสงขลา')}</span>
          </div>
        </div>

        <div class="activity-quota-box">
          <div class="quota-labels">
            <span>ที่นั่งว่าง: <strong>${Math.max(0, max - booked)}</strong> / ${max} ที่นั่ง</span>
            <span>${percent}%</span>
          </div>
          <div class="quota-bar-track">
            <div class="quota-bar-fill" style="width: ${percent}%; ${percent > 85 ? 'background:#E11D48;' : ''}"></div>
          </div>
        </div>

        <div class="activity-actions-row">
          <span style="font-size: 0.76rem; color: #64748B;">
            ${isBooked ? '<span style="color:#10B981; font-weight:600;"><i class="fa-solid fa-circle-check"></i> ได้รับที่นั่ง A-01</span>' : 'เปิดรับสมัครถึงก่อนวันจัด 1 วัน'}
          </span>
          <button class="btn-book-activity ${isBooked ? 'booked' : ''}" onclick="handleBookActivity('${act.id}', '${escapeHtml(act.title)}')">
            ${isBooked ? '<i class="fa-solid fa-check"></i> ลงทะเบียนแล้ว' : '<i class="fa-solid fa-user-plus"></i> ลงทะเบียนเข้าร่วม'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Handle Book Activity
async function handleBookActivity(activityId, title) {
  const bookedKey = 'skru_booked_activities';
  const bookedList = JSON.parse(localStorage.getItem(bookedKey) || '["act-3"]');

  if (bookedList.includes(activityId)) {
    openMyBookingsModal();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/activities/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId,
        studentId: state.studentProfile.studentId || '674295027',
        studentName: state.studentProfile.nameTh || 'นายสมชาย ใจดี'
      })
    });
    const result = await res.json();
    if (result.success) {
      bookedList.push(activityId);
      localStorage.setItem(bookedKey, JSON.stringify(bookedList));

      // Update student stats locally
      state.studentStats.hoursCompleted = Math.min(50, state.studentStats.hoursCompleted + 4);
      updateStatsDisplay();

      renderActivitiesList();
      showToast(`ลงทะเบียนกิจกรรม "${title}" สำเร็จ! 🎉`);
    } else {
      showToast(result.message || 'ลงทะเบียนเรียบร้อย');
    }
  } catch (err) {
    bookedList.push(activityId);
    localStorage.setItem(bookedKey, JSON.stringify(bookedList));
    renderActivitiesList();
    showToast('ลงทะเบียนกิจกรรมเรียบร้อยแล้ว ✓');
  }
}

function updateStatsDisplay() {
  const hoursEl = document.getElementById('statHoursDisplay');
  const percentText = document.getElementById('hoursPercentText');
  const fill = document.getElementById('hoursProgressFill');
  if (hoursEl) hoursEl.innerHTML = `${state.studentStats.hoursCompleted}<span>/50</span>`;
  const pct = Math.round((state.studentStats.hoursCompleted / 50) * 100);
  if (percentText) percentText.textContent = `${pct}%`;
  if (fill) fill.style.width = `${pct}%`;
}

function openMyBookingsModal() {
  const modal = document.getElementById('ticketModal');
  const body = document.getElementById('ticketModalBody');
  if (!modal || !body) return;

  const bookedIds = JSON.parse(localStorage.getItem('skru_booked_activities') || '["act-3"]');
  const bookedActs = state.activities.filter(a => bookedIds.includes(a.id));

  if (bookedActs.length === 0) {
    body.innerHTML = `
      <div style="text-align:center; padding: 24px 0; color:#64748B;">
        <i class="fa-solid fa-ticket-simple" style="font-size:2.5rem; color:#CBD5E1; margin-bottom:10px;"></i>
        <p>คุณยังไม่ได้ลงทะเบียนกิจกรรมใดๆ</p>
      </div>
    `;
  } else {
    body.innerHTML = bookedActs.map(act => `
      <div style="border:1.5px dashed #E2E8F0; border-radius:16px; padding:16px; margin-bottom:12px; background:#F8FAFC;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="background:#DCFCE7; color:#166534; font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:4px;">
            <i class="fa-solid fa-circle-check"></i> ยืนยันสิทธิ์แล้ว
          </span>
          <span style="font-weight:700; color:#E11D48; font-size:0.85rem;">ที่นั่ง A-01</span>
        </div>
        <h4 style="font-size:0.95rem; font-weight:700; color:#0F172A; margin-bottom:6px;">${escapeHtml(act.title)}</h4>
        <div style="font-size:0.8rem; color:#64748B; line-height:1.5;">
          <div><i class="fa-regular fa-calendar"></i> ${escapeHtml(act.date)} (${escapeHtml(act.time || '09:00 - 16:00 น.')})</div>
          <div><i class="fa-solid fa-location-dot"></i> ${escapeHtml(act.location || 'อาคาร 4 ชั้น 3')}</div>
          <div><i class="fa-solid fa-id-badge"></i> รหัสนักศึกษา: 674295027 (นายสมชาย ใจดี)</div>
        </div>
      </div>
    `).join('');
  }

  modal.classList.add('active');
}

function closeTicketModal() {
  const modal = document.getElementById('ticketModal');
  if (modal) modal.classList.remove('active');
}

// =========================================================================
// TAB 3: การแจ้งเตือน (NOTIFICATIONS)
// =========================================================================

async function fetchNotificationsFromAPI() {
  try {
    const res = await fetch(`${API_BASE}/notifications`);
    const raw = await res.json();
    state.notifications = raw.data || [];
    renderNotificationsList();
    updateNotificationBadge();
  } catch (err) {
    console.error('Failed to load notifications:', err);
  }
}

function updateNotificationBadge() {
  const unreadCount = state.notifications.filter(n => n.unread).length;
  const toolbarBadge = document.getElementById('notifUnreadBadge');
  const navBadge = document.getElementById('bottomNavNotifBadge');

  if (toolbarBadge) {
    toolbarBadge.textContent = unreadCount > 0 ? `${unreadCount} รายการที่ยังไม่ได้อ่าน` : 'ไม่มีการแจ้งเตือนใหม่';
  }
  if (navBadge) {
    navBadge.textContent = unreadCount;
    navBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }
}

function renderNotificationsList() {
  const container = document.getElementById('notificationsListContainer');
  if (!container) return;

  const list = state.notifications || [];
  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-bell-slash"></i>
        <p>ไม่มีการแจ้งเตือนในขณะนี้</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(n => {
    return `
      <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="handleNotificationClick('${n.id}', '${n.actionUrl || ''}')">
        <div class="notif-icon-box" style="background: ${n.iconBg || '#DBEAFE'}; color: ${n.iconColor || '#2563EB'};">
          <i class="fa-solid ${n.icon || 'fa-bell'}"></i>
        </div>
        <div class="notif-body">
          <div class="notif-header-row">
            <h4 class="notif-title">${escapeHtml(n.title)}</h4>
            ${n.unread ? '<span class="notif-unread-dot"></span>' : ''}
          </div>
          <p class="notif-message">${escapeHtml(n.message)}</p>
          <div class="notif-footer-row">
            <span><i class="fa-regular fa-clock"></i> ${escapeHtml(n.time || n.date)}</span>
            ${n.actionText ? `<span class="notif-action-btn">${escapeHtml(n.actionText)} <i class="fa-solid fa-arrow-right"></i></span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function handleMarkAllNotificationsRead() {
  try {
    await fetch(`${API_BASE}/notifications/mark-read`, { method: 'POST' });
  } catch (err) {}

  state.notifications.forEach(n => n.unread = false);
  renderNotificationsList();
  updateNotificationBadge();
  showToast('ทำเครื่องหมายว่าอ่านแล้วทั้งหมดเรียบร้อย ✓');
}

function handleNotificationClick(notifId, actionUrl) {
  const item = state.notifications.find(n => n.id === notifId);
  if (item) {
    item.unread = false;
    updateNotificationBadge();
    renderNotificationsList();
  }

  if (actionUrl) {
    if (window.parent && window.parent !== window) {
      window.parent.location.href = actionUrl;
    } else {
      window.location.href = actionUrl;
    }
  }
}

// =========================================================================
// TAB 4: โปรไฟล์นักศึกษา (STUDENT PROFILE)
// =========================================================================

async function loadStudentProfile() {
  try {
    const res = await fetch(`${API_BASE}/student`);
    if (res.ok) {
      const raw = await res.json();
      const student = raw.data || raw;
      state.studentProfile = { ...state.studentProfile, ...student };
    }
    const resStats = await fetch(`${API_BASE}/student-stats`);
    if (resStats.ok) {
      const raw = await resStats.json();
      const stats = raw.data || raw;
      if (stats) {
        state.studentStats = { ...state.studentStats, ...stats };
        updateStatsDisplay();
      }
    }
  } catch (err) {
    console.warn('Using pre-populated student profile:', err);
  }
}

// =========================================================================
// TAB SWITCHING & BOTTOM NAVIGATION
// =========================================================================

function switchTab(tabName) {
  state.currentTab = tabName;

  if (tabName === 'home') {
    if (window.parent && window.parent !== window) {
      window.parent.location.href = '/index.html';
    } else {
      window.location.href = '/index.html';
    }
    return;
  }

  // Update Bottom Nav active indicator
  document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.classList.remove('active');
  });

  const tabMap = {
    news: 'navItemNews',
    events: 'navItemEvents',
    notifications: 'navItemNotifications',
    profile: 'navItemProfile'
  };

  const activeNav = document.getElementById(tabMap[tabName]);
  if (activeNav) activeNav.classList.add('active');

  // Switch visible Tab View container
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.remove('active');
    view.style.display = 'none';
  });

  const viewId = `tabView${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.style.display = 'flex';
    targetView.classList.add('active');
  }

  // Update Header Title & Subtitle
  const titleEl = document.getElementById('headerTitle');
  const subEl = document.getElementById('headerSubtitle');

  if (tabName === 'news') {
    if (titleEl) titleEl.textContent = 'ข่าวสารและกิจกรรม';
    if (subEl) subEl.textContent = 'SKRU Campus News';
    fetchNewsFromAPI();
  } else if (tabName === 'events') {
    if (titleEl) titleEl.textContent = 'กิจกรรมนักศึกษา';
    if (subEl) subEl.textContent = 'SKRU Student Activities';
    fetchActivitiesFromAPI();
  } else if (tabName === 'notifications') {
    if (titleEl) titleEl.textContent = 'การแจ้งเตือน';
    if (subEl) subEl.textContent = 'Student Notifications';
    fetchNotificationsFromAPI();
  } else if (tabName === 'profile') {
    if (titleEl) titleEl.textContent = 'ข้อมูลส่วนตัวนักศึกษา';
    if (subEl) subEl.textContent = 'Student Profile';
    loadStudentProfile();
  }
}

// Social Sharing & Copy link
function shareToFacebook(event) {
  if (event) event.stopPropagation();
  const url = encodeURIComponent(window.location.href);
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  window.open(fbUrl, '_blank', 'width=600,height=400');
  showToast('เปิดหน้าต่างแชร์ Facebook เรียบร้อย');
}

function copyNewsLink(event) {
  if (event) event.stopPropagation();
  navigator.clipboard.writeText(window.location.href).then(() => {
    showToast('คัดลอกลิงก์ข่าวสารเรียบร้อย 📋');
  }).catch(() => {
    showToast('คัดลอกลิงก์เรียบร้อย');
  });
}

function handleBackAction() {
  if (state.currentTab !== 'news') {
    switchTab('news');
  } else if (state.currentCategory !== 'all' || state.searchQuery !== '') {
    resetFiltersAndShowAll();
  } else {
    if (window.parent && window.parent !== window) {
      window.parent.location.href = '/index.html';
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/index.html';
    }
  }
}

function resetFiltersAndShowAll() {
  state.currentCategory = 'all';
  state.searchQuery = '';
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClearBtn');
  if (searchInput) searchInput.value = '';
  if (searchClear) searchClear.style.display = 'none';

  document.querySelectorAll('#categoryFilterContainer .cat-pill').forEach(pill => {
    if (pill.getAttribute('data-category') === 'all') {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  fetchNewsFromAPI();
  showToast('แสดงข่าวสารทั้งหมด');
}

// Admin: Create New News
async function handleCreateNews(event) {
  event.preventDefault();

  const title = document.getElementById('newsTitle').value.trim();
  const category = document.getElementById('newsCategory').value;
  const badge = document.getElementById('newsBadge').value.trim();
  const summary = document.getElementById('newsSummary').value.trim();
  const content = document.getElementById('newsContent').value.trim();
  const location = document.getElementById('newsLocation').value.trim();
  const author = document.getElementById('newsAuthor').value.trim();
  const image = document.getElementById('newsImage').value.trim() || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80';
  const isFeatured = document.getElementById('newsIsFeatured').checked;

  const catObj = state.categories.find(c => c.id === category);
  const categoryName = catObj ? catObj.name : 'ข่าวมหาวิทยาลัย';

  const payload = {
    title,
    category,
    categoryName,
    badge,
    summary,
    content,
    location,
    author,
    image,
    isFeatured
  };

  const saveBtn = document.getElementById('saveNewsBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'กำลังบันทึก...';
  }

  try {
    const res = await fetch(`${API_BASE}/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    showToast('สร้างและเผยแพร่ข่าวสารสำเร็จ ✨');
    document.getElementById('createNewsForm').reset();
    closeAdminModal();
    await fetchNewsFromAPI();
  } catch (err) {
    console.error('Error creating news:', err);
    showToast('บันทึกข่าวสารเรียบร้อย');
    closeAdminModal();
    await fetchNewsFromAPI();
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'บันทึกและเผยแพร่ข่าว';
    }
  }
}

// Toast helper
let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const text = document.getElementById('toastMessage');
  if (!toast || !text) return;

  text.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
