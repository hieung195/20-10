const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createJsonStore } = require('../services/jsonStore');

test('nhiều lượt ghi đồng thời không mất dữ liệu, đọc lại được khi khởi động lại', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'family-store-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const store = createJsonStore(dir);
  await Promise.all(Array.from({ length: 30 }, (_, id) => store.update('feedback', [], rows => [...rows, { id, content: 'Mẹ thương con' }])));
  const rows = await createJsonStore(dir).read('feedback', []);
  assert.equal(rows.length, 30);
  assert.equal(new Set(rows.map(row => row.id)).size, 30);
});

test('file lỗi không bị ghi đè; lượt ghi sau vẫn hoạt động', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'family-store-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'feedback.json');
  await fs.writeFile(file, '{broken');
  const store = createJsonStore(dir);
  await assert.rejects(store.update('feedback', [], rows => rows));
  assert.equal(await fs.readFile(file, 'utf8'), '{broken');
  await fs.writeFile(file, '[]');
  await store.update('feedback', [], rows => [...rows, 'hello']);
  assert.deepEqual(await store.read('feedback', []), ['hello']);
});
