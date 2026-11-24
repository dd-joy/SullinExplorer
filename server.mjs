import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { getVideos } from './youtube-feed.mjs';
import { getObjekts } from './objekt-feed.mjs';
const root = new URL('./', import.meta.url);
const types = { html:'text/html; charset=utf-8', css:'text/css', js:'text/javascript', png:'image/png', ttf:'font/ttf', cur:'image/x-icon' };
const publicFiles = new Set(['index.html','style.css','script.js','gallery.js','favicon.png','frame.png','goto.png','product-sans.ttf','sullin-profile.png','twitter.png','watermark.png','window-top.png','xcom.png','youtube.png','cursors/normal.cur','cursors/link.cur','cursors/unavailable.cur']);
publicFiles.add('videos.js');
publicFiles.add('deployment-config.js');
const json = (res, code, data, headers = {}) => { res.writeHead(code, { 'Content-Type':'application/json', 'Cache-Control':'no-store', ...headers }); res.end(JSON.stringify(data)); };
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
      return json(res, 404, { error:'not_found' });
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
