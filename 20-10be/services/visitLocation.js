const net = require('node:net');
const cache = new Map();
async function locate(ip) {
  ip = String(ip || '').replace(/^::ffff:/, '');
  if (!net.isIP(ip) || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|::1$|f[cd]|fe80)/i.test(ip)) return { label: 'Mạng nội bộ / localhost', approximate: true };
  if (cache.has(ip)) return cache.get(ip);
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(3000) });
    const info = await response.json();
    if (!info.success) throw new Error('Unknown location');
    const location = { label: [info.city, info.region, info.country].filter(Boolean).join(', '), approximate: true };
    if (cache.size > 1000) cache.clear();
    cache.set(ip, location);
    return location;
  } catch { return { label: 'Chưa xác định được vị trí', approximate: true }; }
}
module.exports = { locate };
