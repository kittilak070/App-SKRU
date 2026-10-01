import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const resources = JSON.parse(await readFile(new URL('./data/resources.json', import.meta.url), 'utf8'));
const categories = new Set(['academic', 'finance', 'elearning']);
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
]);

export function createServer() {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    const send = (status, body, type = 'application/json; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': type });
      res.end(req.method === 'HEAD' ? undefined : (type.startsWith('application/json') ? JSON.stringify(body) : body));
    };
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      return send(405, { error: 'Method not allowed' });
    }
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/health') return send(200, { status: 'ok' });
      if (url.pathname === '/api/resources') {
        const category = url.searchParams.get('category') || 'all';
        const query = (url.searchParams.get('q') || '').trim().toLowerCase();
        if (category !== 'all' && !categories.has(category)) return send(400, { error: 'Invalid category' });
        if (query.length > 200) return send(400, { error: 'Query must not exceed 200 characters' });
        const result = resources.filter(r => (category === 'all' || r.cat === category) && `${r.name} ${r.desc}`.toLowerCase().includes(query));
        return send(200, { resources: result, total: result.length });
      }
      if (url.pathname.startsWith('/api/resources/')) {
        const resource = resources.find(r => r.id === url.pathname.slice('/api/resources/'.length));
        return resource ? send(200, resource) : send(404, { error: 'Resource not found' });
      }
      const asset = assets.get(url.pathname);
      if (!asset) return send(404, { error: 'Not found' });
      send(200, await readFile(new URL(`./public/${asset[0]}`, import.meta.url)), asset[1]);
    } catch {
      send(500, { error: 'Unable to complete request' });
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  createServer().listen(port, host, () => console.log(`SKRU: http://${host}:${port}`));
}
