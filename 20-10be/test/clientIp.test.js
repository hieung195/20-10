const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeIp, resolveClientIp } = require('../services/clientIp');

function request(headers = {}, overrides = {}) {
  return {
    headers,
    socket: { remoteAddress: '::ffff:192.168.1.5' },
    ip: '192.168.1.5',
    ...overrides,
  };
}

test('normalizes valid IPv4-mapped IPv6 and rejects malformed addresses', () => {
  assert.equal(normalizeIp('::ffff:203.0.113.8'), '203.0.113.8');
  assert.equal(normalizeIp('[2001:db8::1]'), '2001:db8::1');
  assert.equal(normalizeIp('203.0.113.999'), null);
});

test('uses the Vercel edge client IP before proxy and socket addresses', () => {
  const req = request({
    'x-vercel-forwarded-for': '198.51.100.42, 10.0.0.1',
    'x-forwarded-for': '192.0.2.12',
  });
  assert.equal(resolveClientIp(req, { VERCEL: '1' }), '198.51.100.42');
});

test('uses the first valid Vercel forwarded IP and falls back safely', () => {
  assert.equal(resolveClientIp(request({ 'x-vercel-forwarded-for': '::ffff:198.51.100.7, 10.0.0.1' }), { VERCEL: '1' }), '198.51.100.7');
  assert.equal(resolveClientIp(request({ 'x-vercel-forwarded-for': 'invalid', 'x-forwarded-for': '198.51.100.8, 10.0.0.1' }), { VERCEL: '1' }), '198.51.100.8');
});

test('ignores untrusted forwarding headers outside Vercel', () => {
  const req = request({ 'x-forwarded-for': '198.51.100.9' }, { ip: '203.0.113.10' });
  assert.equal(resolveClientIp(req, {}), '192.168.1.5');
  assert.equal(resolveClientIp(req, { TRUST_PROXY: 'true' }), '203.0.113.10');
});

test('returns null when no valid socket or trusted proxy IP is available', () => {
  assert.equal(resolveClientIp(request({ 'x-forwarded-for': '198.51.100.9' }, { socket: {}, ip: undefined }), {}), null);
});
