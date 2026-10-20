const test = require('node:test');
const assert = require('node:assert/strict');
const { locate } = require('../services/visitLocation');

test('ưu tiên vị trí thành phố từ Vercel edge và giải mã tên có dấu', async () => {
  const location = await locate('203.0.113.12', {
    city: '%C4%90%C3%A0%20N%E1%BA%B5ng',
    region: 'Da%20Nang',
    country: 'VN',
  });
  assert.deepEqual(location, { label: 'Đà Nẵng, Việt Nam', approximate: true });
});

test('dùng tỉnh/khu vực nếu Vercel không gửi thành phố', async () => {
  const location = await locate('203.0.113.12', { region: 'California', country: 'US' });
  assert.deepEqual(location, { label: 'California, Hoa Kỳ', approximate: true });
});
