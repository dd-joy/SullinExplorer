import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { getVideos } from '../youtube-feed.mjs';
import { getObjekts } from '../objekt-feed.mjs';
await mkdir('data', { recursive:true });
let previous = { photos:[] };
try { previous = JSON.parse(await readFile('data/photos.json', 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const accounts = ['sullinface','first__nun','imsullinlove'];
const results = await Promise.allSettled(accounts.map(async account => {
  const response = await fetch(`https://api.fxtwitter.com/2/profile/${account}/media?count=40`, { signal:AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Unable to read ${account}`);
  const data = await response.json();
  if (data.code !== 200 || !Array.isArray(data.results)) throw new Error(`Invalid response: ${account}`);
  return data.results.filter(post => post.author?.screen_name?.toLowerCase() === account).flatMap(post =>
    (post.media?.photos || post.media?.all || []).filter(media => media.type === 'photo').flatMap(media => {
      const image = new URL(media.url), source = new URL(post.url);
      if (image.protocol !== 'https:' || image.hostname !== 'pbs.twimg.com' || source.protocol !== 'https:' || !['x.com','twitter.com'].includes(source.hostname)) return [];
      return [{ image:image.href, post:source.href, account, text:post.text || '', width:media.width, height:media.height, timestamp:Number(post.created_timestamp) || 0 }];
    }));
}));
const successful = results.filter(result => result.status === 'fulfilled');
const unique = new Map();
[...successful.flatMap(result => result.value), ...previous.photos].sort((a,b) => b.timestamp-a.timestamp).forEach(photo => {
  const key = new URL(photo.image).pathname;
  if (!unique.has(key)) unique.set(key, photo);
});
if (successful.length) await writeFile('data/photos.json', JSON.stringify({ updated:Date.now(), photos:[...unique.values()] }));
for (const [i, result] of results.entries()) if (result.status === 'rejected') console.warn(`Photo feed unavailable: ${accounts[i]}`);
let videoSuccess = false;
try {
  const videos = await getVideos();
  await writeFile('data/videos.json', JSON.stringify(videos));
  videoSuccess = true;
} catch { console.warn('Video feeds unavailable; retaining existing file.'); }
if (!successful.length && !videoSuccess) process.exitCode = 1;
try {
  const objekts = await getObjekts();
  let older = { photos:[] };
  try { older = JSON.parse(await readFile('data/objekts.json', 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const entries = new Map(older.photos.map(photo => [photo.slug, photo]));
  objekts.photos.forEach(photo => entries.set(photo.slug, photo));
  await writeFile('data/objekts.json', JSON.stringify({ updated:objekts.updated, photos:[...entries.values()] }));
} catch { console.warn('Objekt index unavailable; retaining existing file.'); }
