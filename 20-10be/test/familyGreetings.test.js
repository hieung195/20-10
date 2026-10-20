const test = require('node:test');
const assert = require('node:assert/strict');
const { generateGreeting } = require('../services/greetingService');

test('mẹ và tên có Yến luôn nhận lá thư đặc biệt, kể cả link cũ', async () => {
  for (const name of ['mẹ', 'MẸ', 'mẹ yêu', 'Yến', 'Nguyễn Thị Yến', 'yen', 'Yến']) {
    const result = await generateGreeting(name, 'classmate');
    assert.equal(result.special, true, name);
    assert.equal(result.recipient, 'Mẹ');
    assert.match(result.greeting, /Con thương mẹ rất nhiều/);
    assert.match(result.greeting, /mẹ cứ nghỉ một chút/);
  }
});

test('người thân có lời chúc riêng, ổn định và không nhắc lớp học', async () => {
  const seen = new Set();
  for (const name of ['bà ngoại', 'bà nội', 'dì Hoa', 'chị Lan', 'Hieu']) {
    const result = await generateGreeting(name, 'family');
    assert.equal(result.special, false);
    assert.ok(result.greeting.includes(name));
    assert.ok(result.greeting.length > 600);
    assert.doesNotMatch(result.greeting, /cùng lớp|12A1|tụi tớ|chưa quen/);
    assert.deepEqual(result, await generateGreeting(name, 'visitor'));
    seen.add(result.greeting);
  }
  assert.equal(seen.size, 5);
});


test('xưng hô đúng theo tên, kể cả viết hoa, không dấu, họ tên và đã có vai vế', async () => {
  for (const [name, recipient] of [
    ['ngọc', 'chị Ngọc'], ['hà', 'chị Hà'], ['đức', 'anh Đức'],
    ['phúc', 'anh Phúc'], ['giàu', 'anh Giàu'], ['vinh', 'ba Vinh'],
    ['ĐỨC', 'anh Đức'], ['duc', 'anh Duc'], ['Nguyễn Thị Ngọc', 'chị Nguyễn Thị Ngọc'],
    ['chị Ngọc', 'chị Ngọc'], ['anh Phúc', 'anh Phúc'], ['ba Vinh', 'ba Vinh'],
  ]) {
    const result = await generateGreeting(name, 'family');
    assert.equal(result.recipient, recipient);
    assert.ok(result.greeting.includes(`gửi đến ${recipient}`));
    assert.ok(result.greeting.includes(`Chúc ${recipient}`));
  }
  assert.equal((await generateGreeting('Thanh Hà My', 'family')).recipient, 'Thanh Hà My');
});
