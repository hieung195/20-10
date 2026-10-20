const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('node:fs/promises');
const { locate } = require('./services/visitLocation');
require('dotenv').config();
const { createJsonStore } = require('./services/jsonStore');
const { signToken, verifyToken } = require('./utils/jwt');
const { generateGreeting, VALID_AUDIENCE_TYPES } = require('./services/greetingService');
const { sendSuccess, sendError, asyncHandler } = require('./utils/response');

function cloudinaryConfig() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (process.env.CLOUDINARY_URL) {
    try {
      const url = new URL(process.env.CLOUDINARY_URL);
      cloudName ||= url.hostname;
      apiKey ||= decodeURIComponent(url.username);
      apiSecret ||= decodeURIComponent(url.password);
    } catch { /* Cấu hình thiếu hoặc sai sẽ được báo tại chức năng upload. */ }
  }
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

function signCloudinaryParams(params, secret) {
  const text = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return crypto.createHash('sha1').update(`${text}${secret}`).digest('hex');
}

function imageUrl(image) {
  return typeof image === 'string' ? image : image?.url;
}

function createApp(options = {}) {
  const app = express();
  const store = createJsonStore(options.dataDir || process.env.DATA_DIR || path.join(__dirname, '..', 'database'));
  const uploadsDir = path.join(options.dataDir || process.env.DATA_DIR || path.join(__dirname, '..', 'database'), 'uploads');
  const ready = store.update('admins', [], async admins => {
    if (process.env.VERCEL && store.storage !== 'upstash') throw new Error('Cần cấu hình Upstash Redis trước khi chạy trên Vercel.');
    if (admins.length && admins[0].username === process.env.ADMIN_USERNAME && await bcrypt.compare(process.env.ADMIN_PASSWORD || '', admins[0].passwordHash)) return admins;
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
      throw new Error('Cần cấu hình ADMIN_USERNAME, ADMIN_PASSWORD và JWT_SECRET trong .env');
    }
    return [{ id: crypto.randomUUID(), username: process.env.ADMIN_USERNAME, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12) }];
  });
  const defaultRules = require('../database/custom-greetings.json');
  const rulesReady = store.update('custom-greetings', null, rows => rows ?? defaultRules);
  rulesReady.catch(error => console.error(error.message));
  ready.catch(error => console.error(error.message));
  app.disable('x-powered-by');
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' || process.env.VERCEL ? 1 : false);
  app.use(helmet({ contentSecurityPolicy: { directives: { 'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'], 'connect-src': ["'self'", 'https://api.cloudinary.com'], 'media-src': ["'self'"] } } }));
  app.use(cors({ origin(origin, callback) {
    const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
      .filter(Boolean)
      .map(host => `https://${host}`);
    const allowed = ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.FRONTEND_URL, ...vercelOrigins].filter(Boolean);
    callback(origin && !allowed.includes(origin) ? Object.assign(new Error('Not allowed by CORS'), { statusCode: 403 }) : null, true);
  } }));
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use('/uploads', express.static(uploadsDir, { dotfiles: 'deny' }));
  async function greet(name, audienceType = 'family') {
    await rulesReady;
    const rules = await store.read('custom-greetings', []);
    const { normalizeFamilyName } = await import('../shared/familyGreetings.mjs');
    const normalized = normalizeFamilyName(name);
    const matches = rules.flatMap(rule => rule.keywords.map(keyword => ({ rule, keyword: normalizeFamilyName(keyword) }))).filter(({keyword}) => (` ${normalized} `).includes(` ${keyword} `)).sort((a,b) => b.keyword.length - a.keyword.length);
    const base = await generateGreeting(name, audienceType);
    if (!matches.length) return base;
    const rule = matches[0].rule;
    return { ...base, recipient: rule.recipient || base.recipient, greeting: rule.greeting, title: rule.title || base.title, signature: rule.signature || base.signature };
  }
  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', (req, res, next) => {
    if (process.env.VERCEL && store.storage !== 'upstash' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return sendError(res, 'Cần cấu hình Upstash Redis để lưu dữ liệu bền vững.', 503);
    next();
  });
  app.get('/api/health', (req, res) => res.json({ status: 'ok', storage: store.storage }));
  app.get('/api/ready', asyncHandler(async (req, res) => {
    if (process.env.VERCEL && store.storage !== 'upstash') throw new Error('Cần cấu hình Upstash Redis trước khi chạy trên Vercel.');
    await ready;
    await rulesReady;
    await store.read('feedback', []);
    res.json({ status: 'ready', storage: store.storage });
  }));
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
  app.post('/api/auth/admin/login', loginLimiter, asyncHandler(async (req, res) => {
    await ready;
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || password.length > 200) return sendError(res, 'Thông tin đăng nhập không hợp lệ', 400);
    const admin = (await store.read('admins', [])).find(item => item.username === username.trim());
    if (!admin || !await bcrypt.compare(password, admin.passwordHash)) return sendError(res, 'Sai tên đăng nhập hoặc mật khẩu', 401);
    return sendSuccess(res, { token: signToken({ sub: admin.id, typ: 'admin' }) });
  }));
  const authenticate = asyncHandler(async (req, res, next) => {
    await ready;
    let decoded;
    try { decoded = verifyToken((req.headers.authorization || '').replace(/^Bearer /, '')); }
    catch { return sendError(res, 'Phiên đăng nhập đã hết hạn', 401); }
    const admin = (await store.read('admins', [])).find(item => item.id === decoded.sub);
    if (!admin || decoded.typ !== 'admin') return sendError(res, 'Vui lòng đăng nhập lại', 401);
    req.admin = { id: admin.id, username: admin.username };
    next();
  });
  app.get('/api/auth/admin/me', authenticate, (req, res) => sendSuccess(res, req.admin));
  app.post('/api/greetings/generate', asyncHandler(async (req, res) => {
    const { name, audienceType = 'family' } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100 || !VALID_AUDIENCE_TYPES.has(audienceType)) return sendError(res, 'Tên không hợp lệ', 400);
    return sendSuccess(res, await greet(name.trim(), audienceType));
  }));
  app.get('/api/uploads/config', (req, res) => {
    const configured = Boolean(cloudinaryConfig());
    return sendSuccess(res, { mode: configured ? 'cloudinary' : process.env.VERCEL ? 'unavailable' : 'local' });
  });
  const uploadSignatureLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120 });
  app.post('/api/uploads/signature', uploadSignatureLimiter, (req, res) => {
    const cloudinary = cloudinaryConfig();
    if (!cloudinary) return sendError(res, 'Máy chủ chưa cấu hình Cloudinary.', process.env.VERCEL ? 503 : 400);
    const params = {
      allowed_formats: 'avif,gif,jpg,jpeg,png,webp',
      overwrite: false,
      public_id: `family-feedback/${crypto.randomUUID()}`,
      timestamp: Math.floor(Date.now() / 1000),
    };
    return sendSuccess(res, {
      ...params,
      signature: signCloudinaryParams(params, cloudinary.apiSecret),
      apiKey: cloudinary.apiKey,
      cloudName: cloudinary.cloudName,
    });
  });
  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, cb) { fs.mkdir(uploadsDir, { recursive: true }).then(() => cb(null, uploadsDir), cb); },
      filename(req, file, cb) { cb(null, crypto.randomUUID()); },
    }),
    fileFilter(req, file, cb) { if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) return cb(Object.assign(new Error('Chọn ảnh JPEG, PNG, WebP, GIF hoặc AVIF.'), { statusCode: 400 })); cb(null, true); },
  }).array('images'); // Chỉ dùng khi chạy local; trên Vercel ảnh được gửi thẳng lên Cloudinary.
  app.post('/api/feedback', upload, asyncHandler(async (req, res) => {
    const files = req.files || [];
    let savedFiles = false;
    try {
      const { name, sender = '', content = '', requestId } = req.body || {};
      const submittedImages = req.body.images === undefined ? [] : req.body.images;
      const cloudinary = cloudinaryConfig();
      if (typeof name !== 'string' || !name.trim() || name.length > 100 || typeof sender !== 'string' || sender.length > 80 || typeof content !== 'string' || (!content.trim() && !files.length && (!Array.isArray(submittedImages) || !submittedImages.length)) || content.length > 2000 || typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(requestId)) return sendError(res, 'Kiểm tra tên người gửi, lời nhắn hoặc ảnh đính kèm.', 400);
      if (!Array.isArray(submittedImages)) return sendError(res, 'Danh sách ảnh không hợp lệ.', 400);
      const greeting = await greet(name.trim());
      const images = [];
      for (const file of files) {
        const handle = await fs.open(file.path, 'r');
        const header = Buffer.alloc(32);
        try { await handle.read(header, 0, 32, 0); } finally { await handle.close(); }
        const kind = header.subarray(0, 3).equals(Buffer.from([255,216,255])) ? 'jpg' : header.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png' : /^GIF8[79]a/.test(header.toString('ascii',0,6)) ? 'gif' : header.toString('ascii',0,4) === 'RIFF' && header.toString('ascii',8,12) === 'WEBP' ? 'webp' : header.toString('ascii',4,8) === 'ftyp' && /avif|avis/.test(header.toString('ascii',8,32)) ? 'avif' : null;
        if (!kind) return sendError(res, 'Ảnh không hợp lệ. Chọn JPEG, PNG, WebP, GIF hoặc AVIF.', 400);
        const filename = `${file.filename}.${kind}`;
        await fs.rename(file.path, path.join(uploadsDir, filename));
        file.path = path.join(uploadsDir, filename);
        const url = `/uploads/${filename}`;
        images.push({ url, bytes: file.size, format: kind, createdAt: new Date().toISOString() });
      }
      for (const image of submittedImages) {
        if (!cloudinary || !image || typeof image !== 'object' || typeof image.url !== 'string' || typeof image.publicId !== 'string' || !image.publicId.startsWith('family-feedback/')) return sendError(res, 'Ảnh Cloudinary không hợp lệ.', 400);
        let parsedUrl;
        try { parsedUrl = new URL(image.url); } catch { return sendError(res, 'Địa chỉ ảnh không hợp lệ.', 400); }
        const expectedPrefix = `https://res.cloudinary.com/${cloudinary.cloudName}/image/upload/`;
        const format = typeof image.format === 'string' && /^(avif|gif|jpe?g|png|webp)$/i.test(image.format) ? image.format.toLowerCase() : '';
        let publicIdPath;
        try { publicIdPath = decodeURIComponent(parsedUrl.pathname); } catch { return sendError(res, 'Địa chỉ ảnh không hợp lệ.', 400); }
        if (parsedUrl.origin !== 'https://res.cloudinary.com' || !parsedUrl.href.startsWith(expectedPrefix) || !/^family-feedback\/[a-f0-9-]{36}$/i.test(image.publicId) || !format || !publicIdPath.endsWith(`/${image.publicId}.${format}`)) return sendError(res, 'Ảnh Cloudinary không hợp lệ.', 400);
        const bytes = Number(image.bytes);
        images.push({ url: parsedUrl.href, publicId: image.publicId, bytes: Number.isFinite(bytes) && bytes >= 0 ? bytes : 0, format, createdAt: new Date().toISOString() });
      }
      const location = await locate(req.ip);
      let saved;
      let inserted = false;
      await store.update('feedback', [], rows => {
        saved = rows.find(row => row.id === requestId);
        if (saved) return rows;
        inserted = true;
        saved = { id: requestId, name: name.trim(), sender: sender.trim(), recipient: greeting.recipient, content: content.trim(), images, location, createdAt: new Date().toISOString() };
        return [...rows, saved];
      });
      savedFiles = inserted;
      return sendSuccess(res, { id: saved.id, message: 'Đã gửi lời nhắn và ảnh!' }, 201);
    } finally { if (!savedFiles) await Promise.all(files.map(file => fs.rm(file.path, { force: true }))); }
  }));
  app.get('/api/feedback', asyncHandler(async (req, res) => {
    if (typeof req.query.name !== 'string' || req.query.name.length > 100) return sendError(res, 'Thiếu tên người nhận', 400);
    const target = (await greet(req.query.name)).recipient;
    const rows = await store.read('feedback', []);
    const { normalizeFamilyName } = await import('../shared/familyGreetings.mjs');
    const items = rows.filter(row => !row.deletedAt && normalizeFamilyName(row.recipient) === normalizeFamilyName(target)).map(({ id, recipient, content, images = [], createdAt }) => ({ id, recipient, content, images: images.map(imageUrl).filter(Boolean), createdAt })).reverse();
    return sendSuccess(res, { items, total: items.length });
  }));
  app.post('/api/visits', asyncHandler(async (req, res) => {
    const { sessionId, page } = req.body || {};
    if (typeof sessionId !== 'string' || sessionId.length > 100 || typeof page !== 'string' || !page.startsWith('/') || page.length > 500) return sendError(res, 'Thông tin truy cập không hợp lệ', 400);
    const location = await locate(req.ip);
    await store.update('visits', [], rows => [...rows, { id: crypto.randomUUID(), sessionId, page, location, createdAt: new Date().toISOString() }]);
    return sendSuccess(res, { recorded: true });
  }));
  app.get('/api/admin/overview', authenticate, asyncHandler(async (req, res) => {
    const feedback = await store.read('feedback', []);
    const visits = await store.read('visits', []);
    return sendSuccess(res, { feedbackCount: feedback.filter(row => !row.deletedAt).length, visitCount: visits.length, visitors: new Set(visits.map(row => row.sessionId)).size, visits: visits.slice(-200).reverse() });
  }));
  app.get('/api/admin/greetings', authenticate, asyncHandler(async (req, res) => sendSuccess(res, { items: await store.read('custom-greetings', []) })));
  app.post('/api/admin/greetings', authenticate, asyncHandler(async (req, res) => {
    const { id, keywords, recipient = '', greeting, title = '', signature = '' } = req.body || {};
    if (!Array.isArray(keywords) || !keywords.length || keywords.some(key => typeof key !== 'string' || !key.trim() || key.length > 100) || typeof greeting !== 'string' || !greeting.trim() || [recipient,title,signature].some(value => typeof value !== 'string')) return sendError(res, 'Nhập từ khóa và nội dung lời chúc.', 400);
    const item = { id: typeof id === 'string' ? id : crypto.randomUUID(), keywords: [...new Set(keywords.map(key => key.trim()))], recipient: recipient.trim(), greeting: greeting.trim(), title: title.trim(), signature: signature.trim(), updatedAt: new Date().toISOString() };
    await store.update('custom-greetings', [], rows => [...rows.filter(row => row.id !== item.id), item]);
    return sendSuccess(res, item);
  }));
  app.get('/api/admin/images', authenticate, asyncHandler(async (req, res) => {
    const feedback = await store.read('feedback', []);
    const items = [];
    for (const response of feedback) {
      for (const [index, image] of (response.images || []).entries()) {
        const url = imageUrl(image);
        if (!url) continue;
        const id = typeof image === 'string' ? url : image.publicId || url;
        let size = typeof image === 'string' ? 0 : Number(image.bytes) || 0;
        let createdAt = typeof image === 'string' ? response.createdAt : image.createdAt || response.createdAt;
        if (url.startsWith('/uploads/')) {
          try {
            const info = await fs.stat(path.join(uploadsDir, path.basename(url)));
            if (info.isFile()) { size = info.size; createdAt = info.birthtime.toISOString(); }
          } catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
        items.push({ id: `${id}-${index}`, url, size, createdAt, recipient: response.recipient || 'Ảnh đã lưu', feedbackId: response.id });
      }
    }
    items.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    return sendSuccess(res, { items, total: items.length, totalBytes: items.reduce((sum,item) => sum + item.size, 0) });
  }));
  app.delete('/api/admin/feedback/:id', authenticate, asyncHandler(async (req, res) => {
    let found = false;
    await store.update('feedback', [], rows => rows.map(row => {
      if (row.id !== req.params.id) return row;
      found = true;
      return { ...row, deletedAt: row.deletedAt || new Date().toISOString() };
    }));
    if (!found) return sendError(res, 'Không tìm thấy phản hồi', 404);
    return sendSuccess(res, { deleted: true });
  }));
  app.get('/api/admin/feedback', authenticate, asyncHandler(async (req, res) => {
    const rows = await store.read('feedback', []);
    const visible = rows.filter(row => !row.deletedAt);
    return sendSuccess(res, { items: visible.map(row => ({ ...row, images: (row.images || []).map(imageUrl).filter(Boolean) })).reverse(), total: visible.length });
  }));
  app.use('/api', (req, res) => sendError(res, 'Không tìm thấy chức năng này trong bản gia đình', 404));
  app.get('/robots.txt', (req, res) => res.type('text').send('User-agent: *\nDisallow: /\n'));
  if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true') {
    const dist = path.join(__dirname, '..', '20-10fe', 'dist');
    app.use(express.static(dist));
    app.get('*', (req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(path.join(dist, 'index.html')); });
  }
  app.use((error, req, res, next) => {
    console.error(error.message);
    sendError(res, error.statusCode || error.status ? error.message : 'Không thể lưu dữ liệu. Vui lòng thử lại.', error.statusCode || error.status || 500);
  });
  return app;
}
const app = createApp();
if (require.main === module) {
  const server = app.listen(process.env.PORT || 5001, () => console.log('Family server running with JSON storage'));
  server.requestTimeout = 0;
}
module.exports = app;
module.exports.createApp = createApp;
