// Global Application State
const defaultCategories = [
  { id: 'all', name: 'ทั้งหมด' },
  { id: 'university', name: 'ข่าวมหาวิทยาลัย' },
  { id: 'student-activities', name: 'กิจกรรมนักศึกษา' },
  { id: 'academic-scholarships', name: 'วิชาการ & ทุน' },
  { id: 'recruitment', name: 'รับสมัครงาน' }
];

const state = {
  currentCategory: 'all',
  searchQuery: '',
  categories: [...defaultCategories],
  allNews: [],
  featuredNews: null,
  activeDetailNews: null,
  activeHeroId: null,
  userLikes: JSON.parse(localStorage.getItem('skru_news_likes') || '{}'),
  commentLikes: JSON.parse(localStorage.getItem('skru_comment_likes') || '{}'),
  showAllComments: false
};

// API Base URL
const API_BASE = '/api';

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadAllData();
});

// Event Listeners setup
function initEventListeners() {
  // Render default category pills immediately
  renderCategoryPills();
  populateAdminCategorySelect();

  // Search Input with debounce
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  let searchTimer;

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

  // Admin Modal triggers
  const openAdminBtn = document.getElementById('openAdminModalBtn');
  if (openAdminBtn) {
    openAdminBtn.addEventListener('click', () => {
      document.getElementById('adminModal').classList.add('active');
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

// Fetch categories & news from API
async function loadAllData() {
  await loadCategoriesFromAPI();
  await fetchNewsFromAPI();
}

// Load Categories dynamically from server (data/categories.json)
async function loadCategoriesFromAPI() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const result = await res.json();
    if (result.success && result.data) {
      state.categories = result.data;
      renderCategoryPills();
      populateAdminCategorySelect();
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

// Render Category Filter Pills
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

  // Attach click listeners to freshly rendered pills
  container.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      container.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const cat = e.currentTarget.getAttribute('data-category');
      state.currentCategory = cat;
      filterAndRenderNews();
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
    const result = await res.json();

    if (result.success) {
      state.allNews = result.data;
      
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
    }
  } catch (err) {
    console.error('Failed to load news:', err);
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กำลังใช้ข้อมูลชั่วคราว');
  }
}

function filterAndRenderNews() {
  fetchNewsFromAPI();
}

// Render Featured Hero Card
function renderHeroCard() {
  const hero = state.featuredNews;
  if (!hero) {
    document.querySelector('.featured-section').style.display = 'none';
    return;
  }
  document.querySelector('.featured-section').style.display = 'block';

  document.getElementById('featuredImg').src = hero.image;
  document.getElementById('featuredBadge').textContent = hero.badge || hero.categoryName || 'ข่าวเด่น';
  document.getElementById('featuredTitle').textContent = hero.title;
  document.getElementById('featuredSummary').textContent = hero.summary;
  
  const isLiked = !!state.userLikes[hero.id];
  const likeBtn = document.getElementById('featuredLikeBtn');
  likeBtn.className = isLiked ? 'btn-like-pill liked' : 'btn-like-pill';
  document.getElementById('featuredLikesText').textContent = `${hero.likes} ไลก์`;
}

// Render Latest News List
function renderLatestNewsList() {
  const container = document.getElementById('latestNewsList');
  if (!container) return;

  // Filter out the hero item from latest list if we have more than 1 news
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
          <img src="${news.image}" alt="${escapeHtml(news.title)}" loading="lazy">
        </div>
        <div class="news-info">
          <div>
            ${news.badge ? `<span class="news-badge">${escapeHtml(news.badge)}</span>` : ''}
            <h4 class="news-card-title">${escapeHtml(news.title)}</h4>
          </div>
          <div class="news-meta">
            <span class="news-meta-item">${escapeHtml(news.date || 'วันนี้')}</span>
            <span class="news-meta-item">${escapeHtml(news.location || '')}</span>
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
    const result = await res.json();
    if (result.success) {
      state.currentNewsComments = result.data;
      renderComments();
    }
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

  if (comments.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding: 18px 0; color:#94A3B8; font-size: 0.88rem;">
        ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!
      </div>
    `;
    return;
  }

  // If not viewing all, show first 2 comments
  const displayComments = state.showAllComments ? comments : comments.slice(0, 2);

  listEl.innerHTML = displayComments.map(c => {
    const isLiked = !!state.commentLikes[c.id];
    return `
      <div class="comment-item" id="comment-${c.id}">
        <img class="comment-avatar" src="${c.avatar}" alt="${escapeHtml(c.author)}">
        <div class="comment-body">
          <div class="comment-bubble">
            <div class="comment-author">${escapeHtml(c.author)}</div>
            <div class="comment-text">${escapeHtml(c.text)}</div>
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

  // Optimistic UI Update
  if (action === 'like') {
    state.userLikes[newsId] = true;
    state.featuredNews.likes += 1;
  } else {
    delete state.userLikes[newsId];
    state.featuredNews.likes = Math.max(0, state.featuredNews.likes - 1);
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
    if (data.success) {
      state.featuredNews.likes = data.likes;
      renderHeroCard();
      showToast(action === 'like' ? 'กดถูกใจข่าวสารแล้ว ❤️' : 'ยกเลิกการถูกใจแล้ว');
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
    comment.likes = Math.max(0, (comment.likes || 0) - 1);
  }
  localStorage.setItem('skru_comment_likes', JSON.stringify(state.commentLikes));
  renderComments();

  try {
    const res = await fetch(`${API_BASE}/comments/${commentId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (data.success) {
      comment.likes = data.likes;
      renderComments();
    }
  } catch (err) {
    console.error('Error liking comment:', err);
  }
}

// Submit a new comment
async function submitComment(event) {
  event.preventDefault();
  const textInput = document.getElementById('commentTextInput');
  const authorInput = document.getElementById('commentAuthorInput');
  const text = textInput.value.trim();
  const author = authorInput.value.trim() || 'นักศึกษา SKRU';

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
      textInput.value = '';
      showToast('แสดงความคิดเห็นสำเร็จ 🎉');
      if (!state.currentNewsComments) state.currentNewsComments = [];
      state.currentNewsComments.unshift(result.data);
      renderComments();
    } else {
      showToast(result.message || 'เกิดข้อผิดพลาดในการส่ง');
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
    const result = await res.json();
    if (!result.success) return;

    const news = result.data;
    state.activeDetailNews = news;

    document.getElementById('modalArticleCategory').textContent = news.categoryName || 'ข่าวสารและกิจกรรม';
    
    const isLiked = !!state.userLikes[news.id];
    
    const bodyHtml = `
      <img src="${news.image}" alt="${escapeHtml(news.title)}" class="article-detail-img">
      
      <div class="article-meta-tags">
        ${news.badge ? `<span class="news-badge" style="font-size:0.8rem; padding: 4px 10px;">${escapeHtml(news.badge)}</span>` : ''}
        <span class="meta-chip"><i class="fa-regular fa-calendar" style="color:#E11D48;"></i> ${news.date || 'วันนี้'}</span>
        <span class="meta-chip"><i class="fa-solid fa-location-dot" style="color:#64748B;"></i> ${news.location || 'มหาวิทยาลัย'}</span>
        <span class="meta-chip"><i class="fa-regular fa-eye"></i> ${news.views || 1} รับชม</span>
      </div>

      <h2 style="font-size: 1.2rem; font-weight: 700; color: #0F172A; line-height: 1.4; margin-bottom: 12px;">
        ${escapeHtml(news.title)}
      </h2>

      <div style="font-size: 0.88rem; color: #64748B; margin-bottom: 16px; font-weight: 500;">
        ผู้ประกาศ: ${escapeHtml(news.author || 'สำนักประชาสัมพันธ์')}
      </div>

      <div class="article-content-text">
        ${escapeHtml(news.content || news.summary)}
      </div>

      <div style="display:flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 20px;">
        <div class="action-buttons-group">
          <button class="btn-social btn-facebook" onclick="shareToFacebook(event)">
            <i class="fa-brands fa-facebook-f"></i>
          </button>
          <button class="btn-social btn-copy" onclick="copyNewsLink(event)">
            <i class="fa-regular fa-clone"></i>
          </button>
        </div>
        <button class="btn-like-pill ${isLiked ? 'liked' : ''}" onclick="toggleDetailNewsLike('${news.id}')">
          <i class="fa-solid fa-heart"></i>
          <span id="detailLikesText">${news.likes || 0} ไลก์</span>
        </button>
      </div>
    `;

    document.getElementById('articleModalBody').innerHTML = bodyHtml;
    document.getElementById('articleModal').classList.add('active');
  } catch (err) {
    console.error('Error loading article detail:', err);
  }
}

function closeArticleModal() {
  document.getElementById('articleModal').classList.remove('active');
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.remove('active');
}

// Like from inside modal
async function toggleDetailNewsLike(newsId) {
  const isLiked = !!state.userLikes[newsId];
  const action = isLiked ? 'unlike' : 'like';

  if (action === 'like') {
    state.userLikes[newsId] = true;
    if (state.activeDetailNews) state.activeDetailNews.likes += 1;
  } else {
    delete state.userLikes[newsId];
    if (state.activeDetailNews) state.activeDetailNews.likes = Math.max(0, state.activeDetailNews.likes - 1);
  }
  localStorage.setItem('skru_news_likes', JSON.stringify(state.userLikes));

  const countSpan = document.getElementById('detailLikesText');
  if (countSpan && state.activeDetailNews) {
    countSpan.textContent = `${state.activeDetailNews.likes} ไลก์`;
    countSpan.parentElement.className = action === 'like' ? 'btn-like-pill liked' : 'btn-like-pill';
  }

  fetch(`${API_BASE}/news/${newsId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });

  fetchNewsFromAPI();
}

// Create News Handler (Admin)
async function handleCreateNews(event) {
  event.preventDefault();
  const title = document.getElementById('newsTitle').value;
  const category = document.getElementById('newsCategory').value;
  const categorySelect = document.getElementById('newsCategory');
  const categoryName = categorySelect.options[categorySelect.selectedIndex].text;
  const badge = document.getElementById('newsBadge').value;
  const summary = document.getElementById('newsSummary').value;
  const content = document.getElementById('newsContent').value;
  const location = document.getElementById('newsLocation').value;
  const author = document.getElementById('newsAuthor').value;
  const image = document.getElementById('newsImage').value || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
  const isFeatured = document.getElementById('newsIsFeatured').checked;

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
  saveBtn.disabled = true;
  saveBtn.textContent = 'กำลังบันทึก...';

  try {
    const res = await fetch(`${API_BASE}/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      showToast('สร้างและเผยแพร่ข่าวสารสำเร็จ ✨');
      document.getElementById('createNewsForm').reset();
      closeAdminModal();
      await fetchNewsFromAPI();
    } else {
      showToast(result.message || 'บันทึกไม่สำเร็จ');
    }
  } catch (err) {
    console.error('Error creating news:', err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'บันทึกและเผยแพร่ข่าว';
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
  if (state.currentCategory !== 'all' || state.searchQuery !== '') {
    resetFiltersAndShowAll();
  } else {
    showToast('คุณอยู่ที่หน้าแรกข่าวสารแล้ว');
  }
}

function resetFiltersAndShowAll() {
  state.currentCategory = 'all';
  state.searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchClearBtn').style.display = 'none';

  document.querySelectorAll('.cat-pill').forEach(pill => {
    if (pill.getAttribute('data-category') === 'all') {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  fetchNewsFromAPI();
  showToast('แสดงข่าวสารทั้งหมด');
}

function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Find clicked item
  const tabs = {
    home: 0,
    news: 1,
    events: 2,
    notifications: 3,
    profile: 4
  };
  const items = document.querySelectorAll('.nav-item');
  if (items[tabs[tabName]]) {
    items[tabs[tabName]].classList.add('active');
  }

  if (tabName === 'news' || tabName === 'home') {
    resetFiltersAndShowAll();
  } else if (tabName === 'events') {
    // Switch to student activities category
    state.currentCategory = 'student-activities';
    document.querySelectorAll('.cat-pill').forEach(pill => {
      if (pill.getAttribute('data-category') === 'student-activities') {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    fetchNewsFromAPI();
    showToast('หมวดหมู่: กิจกรรมนักศึกษา');
  } else if (tabName === 'notifications') {
    showToast('ไม่มีการแจ้งเตือนใหม่ในขณะนี้');
  } else if (tabName === 'profile') {
    showToast('เข้าสู่ระบบในชื่อ: Tanawut Pitchayaboonowng');
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
