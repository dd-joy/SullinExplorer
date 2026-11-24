// Reads the public member index; no COSMO login, private API, or remote code execution.
// Data structure reference: https://github.com/teamreflex/cosmo-web
export function parseObjekts(html) {
  const photos = new Map();
  for (const match of html.matchAll(/\{id:"[^"\n]+",contract:[^}]+\}/g)) {
    const record = match[0];
    const field = name => {
      const raw = new RegExp(`(?:^|,)${name}:"((?:\\\\.|[^"\\\\])*)"`).exec(record)?.[1];
      if (raw === undefined) return '';
      try { return JSON.parse(`"${raw}"`); } catch { return ''; }
    };
    if (field('member') !== 'Sullin' || field('artist') !== 'triples') continue;
    const slug = field('slug');
    if (!/^[a-z0-9-]+$/.test(slug)) continue;
    const image = field('frontImage');
    try {
      const url = new URL(image);
      if (url.protocol !== 'https:' || !['resources.cosmo.fans','static.cosmo.fans'].includes(url.hostname)) continue;
    } catch { continue; }
    const post = new URL('https://apollo.cafe/');
    post.searchParams.set('member', 'Sullin');
    post.searchParams.set('artist', 'tripleS');
    post.searchParams.set('id', slug);
    photos.set(slug, {
      kind:'objekt', image, post:post.href, account:'COSMO', slug,
      text:`${field('collectionId')} · ${field('class')} Objekt`,
      timestamp:Math.floor(Date.parse(field('createdAt')) / 1000) || 0,
    });
  }
  if (!photos.size) throw new Error('Public Objekt index format changed or empty');
  return { updated:Date.now(), photos:[...photos.values()] };
}
let cached;
let pending;
export async function getObjekts() {
  if (cached && Date.now() - cached.updated < 60 * 60 * 1000) return cached;
  if (pending) return pending;
  pending = (async () => {
    try {
      const response = await fetch('https://apollo.cafe/?member=Sullin&artist=tripleS', { signal:AbortSignal.timeout(25000), headers:{ 'User-Agent':'SullinExplorer/1.0 (public Objekt index reader)' } });
      if (!response.ok) throw new Error('Objekt index unavailable');
      const html = await response.text();
      if (html.length > 4000000) throw new Error('Index too large');
      cached = parseObjekts(html);
      return cached;
    } catch (error) { if (cached) return cached; throw error; }
  })().finally(() => { pending = null; });
  return pending;
}
