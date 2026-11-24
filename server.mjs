import http from 'node:http';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getVideos } from './youtube-feed.mjs';
import { getObjekts } from './objekt-feed.mjs';
const derive = promisify(scrypt);
const root = new URL('./', import.meta.url);
let account;
try { account = JSON.parse(process.env.ADMIN_AUTH_JSON || await readFile(new URL('.admin-auth.json', root), 'utf8')); }
catch { console.error('Run npm run setup-admin first, or set ADMIN_AUTH_JSON.'); process.exit(1); }
account.email = (account.email || account.username || '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email) || !/^[a-f0-9]{32}$/.test(account.salt) || !/^[a-f0-9]{128}$/.test(account.hash)) throw new Error('Run npm run setup-admin to configure a valid admin email.');
const sessions = new Map();
const attempts = new Map();
const moderationFile = new URL(process.env.MODERATION_FILE || '.image-moderation.json', root);
let hiddenPosts = new Set();
try { hiddenPosts = new Set(JSON.parse(await readFile(moderationFile, 'utf8')).hiddenPosts); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
let moderationQueue = Promise.resolve();
function moderate(id, hidden) {
  const operation = moderationQueue.then(async () => {
    const updated = new Set(hiddenPosts);
    if (hidden) updated.add(id); else updated.delete(id);
    const temp = new URL(`${moderationFile.href}.tmp`);
    await writeFile(temp, JSON.stringify({ hiddenPosts:[...updated] }), { mode:0o600 });
    await rename(temp, moderationFile);
    hiddenPosts = updated;
  });
  moderationQueue = operation.catch(() => {});
  return operation;
}
const lifetime = 8 * 60 * 60 * 1000;
const secure = process.env.NODE_ENV === 'production';
const cookie = (token, age) => `sullin_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${secure ? '; Secure' : ''}`;
const types = { html:'text/html; charset=utf-8', css:'text/css', js:'text/javascript', png:'image/png', ttf:'font/ttf', cur:'image/x-icon' };
const publicFiles = new Set(['index.html','style.css','script.js','gallery.js','auth.js','favicon.png','frame.png','goto.png','product-sans.ttf','sullin-profile.png','twitter.png','watermark.png','window-top.png','xcom.png','youtube.png','cursors/normal.cur','cursors/link.cur','cursors/unavailable.cur']);
publicFiles.add('videos.js');
publicFiles.add('deployment-config.js');
const json = (res, code, data, headers = {}) => { res.writeHead(code, { 'Content-Type':'application/json', 'Cache-Control':'no-store', ...headers }); res.end(JSON.stringify(data)); };
async function body(req) {
  let text = '';
  for await (const chunk of req) { text += chunk; if (text.length > 4096) throw new Error('Body too large'); }
  return JSON.parse(text);
}
function current(req) {
  const token = /(?:^|;\s*)sullin_admin=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
  const expires = sessions.get(token);
  return expires > Date.now() ? token : null;
}
const cleanup = setInterval(() => {
  for (const [key, expiry] of sessions) if (expiry <= Date.now()) sessions.delete(key);
  for (const [key, value] of attempts) if (value.until <= Date.now()) attempts.delete(key);
}, 60000);
cleanup.unref();
export const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'GET' && url.pathname === '/api/objekts') {
        try { return json(res, 200, await getObjekts()); }
        catch { return json(res, 502, { error:'objekts_unavailable' }); }
      }
      if (req.method === 'GET' && url.pathname === '/api/videos') {
        try { return json(res, 200, await getVideos()); }
        catch { return json(res, 502, { error:'youtube_unavailable' }); }
      }
      if (req.method === 'GET' && url.pathname === '/api/gallery/moderation') return json(res, 200, { hiddenPosts:[...hiddenPosts] });
      if (req.method === 'GET' && url.pathname === '/api/admin/session') return json(res, 200, { authenticated:Boolean(current(req)) });
      if (req.method !== 'POST') return json(res, 405, { error:'method' });
      const expectedOrigin = process.env.PUBLIC_ORIGIN || `${secure ? 'https' : 'http'}://${req.headers.host}`;
      if (req.headers.origin !== expectedOrigin || !req.headers['content-type']?.startsWith('application/json')) return json(res, 403, { error:'origin' });
      if (url.pathname === '/api/admin/images') {
        if (!current(req)) return json(res, 401, { error:'unauthorized' });
        const input = await body(req);
        if (typeof input.postId !== 'string' || !/^\d{1,30}$/.test(input.postId) || typeof input.hidden !== 'boolean') return json(res, 400, { error:'invalid' });
        await moderate(input.postId, input.hidden);
        return json(res, 200, { hiddenPosts:[...hiddenPosts] });
      }
      if (url.pathname === '/api/admin/logout') {
        const token = current(req); if (token) sessions.delete(token);
        return json(res, 200, { authenticated:false }, { 'Set-Cookie':cookie('', 0) });
      }
      if (url.pathname !== '/api/admin/login') return json(res, 404, { error:'not_found' });
      const ip = req.socket.remoteAddress;
      let limit = attempts.get(ip);
      if (!limit || limit.until <= Date.now()) { limit = { count:0, until:Date.now()+15*60*1000 }; attempts.set(ip, limit); }
      if (limit.count >= 5) return json(res, 429, { error:'rate_limit' });
      limit.count++;
      const input = await body(req);
      if (typeof input.email !== 'string' || typeof input.password !== 'string' || input.password.length > 1024) return json(res, 400, { error:'invalid' });
      const hash = await derive(input.password, account.salt, 64);
      if (!timingSafeEqual(hash, Buffer.from(account.hash, 'hex')) || input.email.trim().toLowerCase() !== account.email) return json(res, 401, { error:'credentials' });
      attempts.delete(ip);
      const token = randomBytes(32).toString('hex');
      sessions.set(token, Date.now()+lifetime);
      return json(res, 200, { authenticated:true }, { 'Set-Cookie':cookie(token, lifetime/1000) });
    }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!publicFiles.has(file)) { res.writeHead(404); return res.end('Not found'); }
    const content = await readFile(new URL(file, root));
    res.writeHead(200, { 'Content-Type':types[file.split('.').pop()] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { json(res, 400, { error:'invalid_request' }); }
});
server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log('SullinExplorer server ready'));
