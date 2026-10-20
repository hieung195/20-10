const net = require('node:net');
const cache = new Map();

function decodeGeo(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try { return decodeURIComponent(value.replace(/\+/g, ' ')); }
  catch { return value.trim(); }
}

function countryName(value) {
  if (!value) return '';
  if (!/^[a-z]{2}$/i.test(value)) return value;
  try { return new Intl.DisplayNames(['vi'], { type: 'region' }).of(value.toUpperCase()) || value; }
  catch { return value; }
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 100 && b >= 64 && b <= 127)
      || a >= 224;
  }
  return ip === '::1' || ip === '::' || /^f[cd]/i.test(ip) || /^fe[89ab]/i.test(ip);
}

async function locate(ip, edgeLocation = {}) {
  ip = String(ip || '').replace(/^::ffff:/i, '');
  if (!net.isIP(ip)) return { label: 'Chưa nhận được địa chỉ IP', approximate: true };
  if (isPrivateIp(ip)) return { label: 'Mạng nội bộ / localhost', approximate: true };
  const city = decodeGeo(edgeLocation.city);
  const region = decodeGeo(edgeLocation.region);
  const country = countryName(decodeGeo(edgeLocation.country));
  const edgeLabel = [city, !city && region, country].filter(Boolean).join(', ');
  if (edgeLabel) return { label: edgeLabel, approximate: true };
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
module.exports = { countryName, decodeGeo, isPrivateIp, locate };
