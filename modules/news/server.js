const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'news-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'));
    }
  }
});

// Helper functions for reading/writing data
const readJSON = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
};

// ================= API ENDPOINTS =================

// 1. Get Categories
app.get('/api/categories', (req, res) => {
  const categories = readJSON(CATEGORIES_FILE);
  res.json({ success: true, data: categories });
});

// 2. Get All News (with filtering & search)
app.get('/api/news', (req, res) => {
  const { category, search, featured } = req.query;
  let newsList = readJSON(NEWS_FILE);
  const comments = readJSON(COMMENTS_FILE);

  // Attach comment counts
  newsList = newsList.map(item => {
    const itemComments = comments.filter(c => c.newsId === item.id);
    return {
      ...item,
      commentCount: itemComments.length
    };
  });

  // Filter by category
  if (category && category !== 'all') {
    newsList = newsList.filter(item => item.category === category);
  }

  // Filter by search keyword
  if (search) {
    const q = search.toLowerCase();
    newsList = newsList.filter(item =>
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.summary && item.summary.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.author && item.author.toLowerCase().includes(q))
    );
  }

  // Filter featured
  if (featured === 'true') {
    newsList = newsList.filter(item => item.isFeatured);
  }

  res.json({
    success: true,
    total: newsList.length,
    data: newsList
  });
});

// 3. Get Single News by ID with Comments
app.get('/api/news/:id', (req, res) => {
  const { id } = req.params;
  const newsList = readJSON(NEWS_FILE);
  const newsItem = newsList.find(item => item.id === id);

  if (!newsItem) {
    return res.status(404).json({ success: false, message: 'ไม่พบข่าวสารที่ระบุ' });
  }

  // Increment view count
  newsItem.views = (newsItem.views || 0) + 1;
  writeJSON(NEWS_FILE, newsList);

  const comments = readJSON(COMMENTS_FILE).filter(c => c.newsId === id);

  res.json({
    success: true,
    data: {
      ...newsItem,
      comments,
      commentCount: comments.length
    }
  });
});

// 4. Create News Article
app.post('/api/news', (req, res) => {
  const { title, summary, content, category, categoryName, badge, image, location, author, isFeatured } = req.body;

  if (!title || !summary) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกหัวข้อและเนื้อหาย่อของข่าว' });
  }

  const newsList = readJSON(NEWS_FILE);
  const now = new Date();
  
  // Format Thai date string (e.g., 28 ต.ค. 2567)
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const thaiDate = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;

  const newArticle = {
    id: 'news-' + Date.now(),
    title: title.trim(),
    summary: summary.trim(),
    content: content ? content.trim() : summary.trim(),
    category: category || 'university',
    categoryName: categoryName || 'ข่าวมหาวิทยาลัย',
    badge: badge || 'ข่าวประชาสัมพันธ์',
    image: image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    date: thaiDate,
    location: location || 'มหาวิทยาลัยราชภัฏสงขลา',
    likes: 0,
    isFeatured: isFeatured === true || isFeatured === 'true',
    author: author || 'สำนักประชาสัมพันธ์และสารสนเทศ',
    views: 1,
    createdAt: now.toISOString()
  };

  // If new article is featured, unset previous featured if needed or keep as top featured
  if (newArticle.isFeatured) {
    newsList.forEach(item => { item.isFeatured = false; });
  }

  newsList.unshift(newArticle);
  writeJSON(NEWS_FILE, newsList);

  res.status(201).json({
    success: true,
    message: 'สร้างข่าวสารสำเร็จ',
    data: newArticle
  });
});

// 5. Update News Article
app.put('/api/news/:id', (req, res) => {
  const { id } = req.params;
  const newsList = readJSON(NEWS_FILE);
  const index = newsList.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบข่าวสารที่ต้องการแก้ไข' });
  }

  const updatedData = { ...newsList[index], ...req.body, id };
  newsList[index] = updatedData;
  writeJSON(NEWS_FILE, newsList);

  res.json({
    success: true,
    message: 'อัปเดตข่าวสารสำเร็จ',
    data: updatedData
  });
});

// 6. Delete News Article
app.delete('/api/news/:id', (req, res) => {
  const { id } = req.params;
  let newsList = readJSON(NEWS_FILE);
  const beforeLen = newsList.length;
  newsList = newsList.filter(item => item.id !== id);

  if (newsList.length === beforeLen) {
    return res.status(404).json({ success: false, message: 'ไม่พบข่าวสารที่ต้องการลบ' });
  }

  writeJSON(NEWS_FILE, newsList);

  // Also remove comments associated with this news
  let comments = readJSON(COMMENTS_FILE);
  comments = comments.filter(c => c.newsId !== id);
  writeJSON(COMMENTS_FILE, comments);

  res.json({ success: true, message: 'ลบข่าวสารสำเร็จ' });
});

// 7. Toggle / Increment Likes on News
app.post('/api/news/:id/like', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'like' or 'unlike'
  const newsList = readJSON(NEWS_FILE);
  const newsItem = newsList.find(item => item.id === id);

  if (!newsItem) {
    return res.status(404).json({ success: false, message: 'ไม่พบข่าวสาร' });
  }

  if (action === 'unlike') {
    newsItem.likes = Math.max(0, (newsItem.likes || 0) - 1);
  } else {
    newsItem.likes = (newsItem.likes || 0) + 1;
  }

  writeJSON(NEWS_FILE, newsList);
  res.json({
    success: true,
    likes: newsItem.likes,
    action: action === 'unlike' ? 'unliked' : 'liked'
  });
});

// 8. Get Comments for a News item
app.get('/api/news/:id/comments', (req, res) => {
  const { id } = req.params;
  const comments = readJSON(COMMENTS_FILE).filter(c => c.newsId === id);
  res.json({ success: true, total: comments.length, data: comments });
});

// 9. Add Comment to a News item
app.post('/api/news/:id/comments', (req, res) => {
  const { id } = req.params;
  const { author, text, avatar } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อความความคิดเห็น' });
  }

  const newsList = readJSON(NEWS_FILE);
  const newsItem = newsList.find(item => item.id === id);
  if (!newsItem) {
    return res.status(404).json({ success: false, message: 'ไม่พบข่าวสาร' });
  }

  const defaultAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  ];

  const comments = readJSON(COMMENTS_FILE);
  const newComment = {
    id: 'comment-' + Date.now(),
    newsId: id,
    author: (author && author.trim()) || 'นักศึกษา SKRU',
    avatar: avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
    text: text.trim(),
    timeAgo: 'เมื่อสักครู่',
    likes: 0,
    createdAt: new Date().toISOString()
  };

  comments.unshift(newComment);
  writeJSON(COMMENTS_FILE, comments);

  res.status(201).json({
    success: true,
    message: 'แสดงความคิดเห็นสำเร็จ',
    data: newComment,
    totalComments: comments.filter(c => c.newsId === id).length
  });
});

// 10. Like a Comment
app.post('/api/comments/:commentId/like', (req, res) => {
  const { commentId } = req.params;
  const { action } = req.body;
  const comments = readJSON(COMMENTS_FILE);
  const comment = comments.find(c => c.id === commentId);

  if (!comment) {
    return res.status(404).json({ success: false, message: 'ไม่พบความคิดเห็น' });
  }

  if (action === 'unlike') {
    comment.likes = Math.max(0, (comment.likes || 0) - 1);
  } else {
    comment.likes = (comment.likes || 0) + 1;
  }

  writeJSON(COMMENTS_FILE, comments);
  res.json({
    success: true,
    likes: comment.likes,
    action: action === 'unlike' ? 'unliked' : 'liked'
  });
});

// 11. Image Upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'ไม่พบไฟล์รูปภาพ' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'อัปโหลดรูปภาพสำเร็จ',
    imageUrl
  });
});

// Fallback to index.html for SPA feel
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 University News System is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
