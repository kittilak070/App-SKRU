import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
let server, base;
before(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
test('serves frontend and JavaScript with correct types', async () => {
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /แหล่งเรียนรู้/);
  for (const [path, type] of [['/app.js', 'text/javascript'], ['/styles.css', 'text/css']]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(type));
  }
});
test('lists, filters and looks up learning resources', async () => {
  const all = await (await fetch(base + '/api/resources')).json();
  assert.equal(all.total, 6);
  const result = await (await fetch(base + '/api/resources?category=finance&q=' + encodeURIComponent('ตลาด'))).json();
  assert.deepEqual(result.resources.map(r => r.id), ['set']);
  const item = await (await fetch(base + '/api/resources/set')).json();
  assert.equal(item.id, 'set');
  const empty = await (await fetch(base + '/api/resources?q=not-found-123')).json();
  assert.equal(empty.total, 0);
});
test('rejects invalid filters, writes and private file access', async () => {
  assert.equal((await fetch(base + '/api/resources?category=invalid')).status, 400);
  assert.equal((await fetch(base + '/api/resources?q=' + 'x'.repeat(201))).status, 400);
  assert.equal((await fetch(base + '/api/resources/missing')).status, 404);
  assert.equal((await fetch(base + '/api/resources', { method: 'POST' })).status, 405);
  for (const path of ['/server.js', '/.git/config', '/data/resources.json', '/..%2fserver.js']) {
    assert.equal((await fetch(base + path)).status, 404);
  }
});
