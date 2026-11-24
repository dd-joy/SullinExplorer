export const channels = [
  { id:'UCqCjZjw-UkzqIE4MiN-qIuw', name:'TiramiSullin' },
  { id:'UCx2BEg_D9YyH2CclQFDrAfQ', name:'imsullinlove' },
  { id:'UC1W9PwRO6gNVAqk9MctOaPA', name:'SullinExplorer' },
];
function decode(text) {
  return text.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, entity => {
    const named = { '&amp;':'&', '&lt;':'<', '&gt;':'>', '&quot;':'"', '&apos;':"'" };
    if (named[entity]) return named[entity];
    const number = entity.startsWith('&#x') ? parseInt(entity.slice(3), 16) : parseInt(entity.slice(2), 10);
    return number <= 0x10ffff ? String.fromCodePoint(number) : '';
  });
}
export function parseFeed(xml, channel) {
  if (!xml.includes('<feed')) throw new Error('Invalid feed');
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(match => {
    const value = tag => decode(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(match[1])?.[1] || '');
    const id = value('yt:videoId');
    if (!/^[\w-]{11}$/.test(id)) return [];
    return [{ id, title:value('title'), description:value('media:description'), published:value('published'), channel:channel.name, channelId:channel.id }];
  });
}
let cached = [];
let updated = 0;
let pending;
let failedChannels = [];
export async function getVideos() {
  if (Date.now() - updated < 15 * 60 * 1000) return { videos:cached, failedChannels, updated };
  if (pending) return pending;
  pending = (async () => {
    const results = await Promise.allSettled(channels.map(async channel => {
      const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`, { signal:AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('YouTube feed unavailable');
      const xml = await response.text();
      if (xml.length > 2000000) throw new Error('Feed too large');
      return { channel, videos:parseFeed(xml, channel) };
    }));
    failedChannels = channels.filter((channel, i) => results[i].status === 'rejected').map(channel => channel.name);
    const success = results.filter(result => result.status === 'fulfilled').map(result => result.value);
    if (!success.length && !cached.length) throw new Error('YouTube unavailable');
    const replaced = new Set(success.map(result => result.channel.id));
    cached = [...cached.filter(video => !replaced.has(video.channelId)), ...success.flatMap(result => result.videos)]
      .sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
    updated = Date.now();
    return { videos:cached, failedChannels, updated };
  })().finally(() => { pending = null; });
  return pending;
}
