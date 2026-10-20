const net = require('node:net');

function normalizeIp(value) {
  if (typeof value !== 'string') return null;
  const candidate = value.trim().replace(/^\[|\]$/g, '').replace(/^::ffff:/i, '');
  return net.isIP(candidate) ? candidate : null;
}

function header(req, name) {
  const value = typeof req.get === 'function' ? req.get(name) : req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

function firstForwardedIp(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  return normalizeIp(value.split(',')[0]);
}

function resolveClientIp(req, env = process.env) {
  if (env.VERCEL) {
    // Vercel sets this header at its trusted edge, including when a proxy sits in front.
    const vercelIp = firstForwardedIp(header(req, 'x-vercel-forwarded-for'));
    if (vercelIp) return vercelIp;

    // Vercel overwrites x-forwarded-for for direct requests; retain it as a fallback.
    const forwardedIp = firstForwardedIp(header(req, 'x-forwarded-for'));
    if (forwardedIp) return forwardedIp;

    const realIp = normalizeIp(header(req, 'x-real-ip'));
    if (realIp) return realIp;
  }

  // Express req.ip honors the configured trusted proxy chain. Without a trusted proxy,
  // use the socket address so a client cannot spoof an X-Forwarded-For header.
  const address = env.TRUST_PROXY === 'true' ? req.ip : req.socket?.remoteAddress || req.ip;
  return normalizeIp(address);
}

module.exports = { normalizeIp, resolveClientIp };
