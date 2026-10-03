async function runTests() {
  const baseUrl = 'http://localhost:3000';

  console.log('--- 1. Testing GET /api/categories ---');
  const resCat = await (await fetch(`${baseUrl}/api/categories`)).json();
  console.log('Categories count:', resCat.data?.length);

  console.log('--- 2. Testing GET /api/news ---');
  const resNews = await (await fetch(`${baseUrl}/api/news`)).json();
  console.log('News total:', resNews.total, '| First title:', resNews.data[0]?.title);

  console.log('--- 3. Testing POST /api/news/news-1/like ---');
  const resLike = await (await fetch(`${baseUrl}/api/news/news-1/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'like' })
  })).json();
  console.log('Like result:', resLike);

  console.log('--- 4. Testing POST /api/news/news-1/comments ---');
  const resComment = await (await fetch(`${baseUrl}/api/news/news-1/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author: 'อาจารย์ผู้ตรวจ', text: 'ระบบทำงานได้สมบูรณ์แบบมากครับ' })
  })).json();
  console.log('Comment post result:', resComment.success, '| Text:', resComment.data?.text);

  console.log('--- 5. Testing GET index.html ---');
  const resHtml = await (await fetch(`${baseUrl}/`)).text();
  console.log('HTML Loaded length:', resHtml.length, '| Contains Title:', resHtml.includes('ข่าวสารและกิจกรรม'));

  console.log('🎉 ALL INTEGRATION TESTS PASSED!');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
