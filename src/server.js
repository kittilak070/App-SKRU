const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', apiRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log('====================================================');
  console.log('🚀 SKRU กยศ. Web App is running!');
  console.log('🌐 Access Web App at: http://localhost:' + PORT);
  console.log('📡 API Healthcheck at: http://localhost:' + PORT + '/api/news');
  console.log('====================================================');
});
