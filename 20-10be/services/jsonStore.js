const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

function createJsonStore(directory) {
  let queue = Promise.resolve();
  const file = name => path.join(directory, `${name}.json`);
  const restUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '');
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const remote = Boolean(restUrl && restToken);
  if (Boolean(restUrl) !== Boolean(restToken)) {
    throw new Error('Cần cấu hình cả UPSTASH_REDIS_REST_URL và UPSTASH_REDIS_REST_TOKEN.');
  }
  const redisKey = name => `family-site:v1:${name}`;
  async function command(parts) {
    const response = await fetch(restUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${restToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(parts),
    });
    const payload = await response.json();
    if (!response.ok || payload.error) throw new Error(payload.error || 'Không thể kết nối Upstash Redis.');
    return payload.result;
  }
  async function read(name, fallback) {
    if (remote) {
      const value = await command(['GET', redisKey(name)]);
      if (value === null || value === undefined) return fallback;
      try { return JSON.parse(value); }
      catch { throw new Error(`Dữ liệu ${name} trong Redis không phải JSON hợp lệ.`); }
    }
    try { return JSON.parse(await fs.readFile(file(name), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
  }
  async function write(name, value) {
    if (remote) {
      await command(['SET', redisKey(name), JSON.stringify(value)]);
      return;
    }
    await fs.mkdir(directory, { recursive: true });
    const temporary = `${file(name)}.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
      await fs.rename(temporary, file(name));
    } finally { await fs.rm(temporary, { force: true }); }
  }
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  function update(name, fallback, mutate) {
    const task = queue.then(async () => {
      const lockKey = `${redisKey(name)}:lock`;
      const lockToken = crypto.randomUUID();
      let locked = false;
      if (remote) {
        for (let attempt = 0; attempt < 200; attempt += 1) {
          if (await command(['SET', lockKey, lockToken, 'NX', 'PX', '30000']) === 'OK') {
            locked = true;
            break;
          }
          await wait(40 + Math.floor(Math.random() * 40));
        }
        if (!locked) throw new Error(`Không lấy được khóa ghi dữ liệu ${name} trong Redis.`);
      }
      try {
        const value = await read(name, fallback);
        const next = await mutate(value);
        await write(name, next);
        return next;
      } finally {
        if (locked) {
          const release = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
          await command(['EVAL', release, '1', lockKey, lockToken]).catch(() => {});
        }
      }
    });
    queue = task.catch(() => {});
    return task;
  }
  return { read, update, storage: remote ? 'upstash' : 'json' };
}
module.exports = { createJsonStore };
