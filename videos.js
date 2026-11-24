(() => {
  const panel = document.getElementById('video-results');
  const list = document.getElementById('video-list');
  const status = document.getElementById('video-status');
  const playerArea = document.getElementById('video-player-area');
  const player = document.getElementById('video-player');
  const copy = {
    ko: { loading:'동영상을 불러오는 중…', error:'동영상을 가져오지 못했어요. npm start 실행 후 서버 주소로 접속해 주세요.', count:n=>`동영상 ${n}개 · 채널 피드 자동 갱신`, partial:'일부 채널을 불러오지 못했어요.', play:'재생', close:'닫기' },
    en: { loading:'Loading videos…', error:'Unable to load videos. Start the server with npm start and open its URL.', count:n=>`${n} videos · Channel feeds update automatically`, partial:'Some channels are unavailable.', play:'Play', close:'Close' },
    th: { loading:'กำลังโหลดวิดีโอ…', error:'โหลดวิดีโอไม่ได้ โปรดเริ่มเซิร์ฟเวอร์ด้วย npm start แล้วเปิด URL ของเซิร์ฟเวอร์', count:n=>`${n} วิดีโอ · อัปเดตจากฟีดช่องอัตโนมัติ`, partial:'โหลดบางช่องไม่สำเร็จ', play:'เล่น', close:'ปิด' },
  };
  let language = 'ko', query = 'Sullin', videos = [], updated = 0, busy = false, error = false, partial = false;
  function closePlayer() { player.replaceChildren(); playerArea.hidden = true; }
  document.getElementById('video-close').addEventListener('click', closePlayer);
  function play(video) {
    closePlayer();
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`;
    iframe.title = video.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    player.append(iframe);
    document.getElementById('video-original').href = `https://www.youtube.com/watch?v=${video.id}`;
    playerArea.hidden = false;
    playerArea.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
  function render() {
    const text = copy[language] || copy.en;
    const term = query.trim().toLowerCase();
    const general = !term || ['sullin','설린','ซอลลิน','พิรดา บุญรักษา'].includes(term);
    const visible = videos.filter(video => general || `${video.title} ${video.description} ${video.channel}`.toLowerCase().includes(term));
    list.replaceChildren();
    visible.forEach(video => {
      if (!/^[\w-]{11}$/.test(video.id)) return;
      const article = document.createElement('article');
      article.className = 'video-result';
      const thumbnail = document.createElement('button');
      thumbnail.type = 'button';
      thumbnail.className = 'video-thumbnail';
      thumbnail.setAttribute('aria-label', `${text.play}: ${video.title}`);
      const image = document.createElement('img');
      image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
      image.alt = ''; image.loading = 'lazy';
      const icon = document.createElement('span'); icon.textContent = '▶';
      thumbnail.append(image, icon);
      thumbnail.addEventListener('click', () => play(video));
      const info = document.createElement('div');
      const title = document.createElement('button');
      title.type = 'button'; title.className = 'video-title'; title.textContent = video.title;
      title.addEventListener('click', () => play(video));
      const meta = document.createElement('p');
      const date = new Date(video.published);
      meta.className = 'video-meta';
      meta.textContent = `${video.channel} · YouTube${Number.isNaN(date.getTime()) ? '' : ' · ' + date.toLocaleDateString(language)}`;
      const description = document.createElement('p');
      description.className = 'video-description'; description.textContent = video.description;
      info.append(title, meta, description);
      article.append(thumbnail, info);
      list.append(article);
    });
    status.textContent = busy ? text.loading : error ? text.error : text.count(visible.length) + (partial ? ` · ${text.partial}` : '');
    document.getElementById('video-close').setAttribute('aria-label', text.close);
  }
  async function load() {
    if (busy || Date.now() - updated < 15 * 60 * 1000) return;
    busy = true; render();
    try {
      const response = await fetch(window.sullinDeployment?.static ? 'data/videos.json' : '/api/videos', { signal:AbortSignal.timeout(25000), cache:'no-store' });
      if (!response.ok) throw new Error('videos');
      const data = await response.json();
      if (!Array.isArray(data.videos)) throw new Error('videos');
      videos = data.videos; partial = Boolean(data.failedChannels?.length);
      updated = Date.now(); error = false;
    } catch { error = true; }
    finally { busy = false; render(); }
  }
  setInterval(() => { if (!panel.hidden && !document.hidden) load(); }, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!panel.hidden && !document.hidden) load(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closePlayer(); });
  window.sullinVideos = {
    show(visible, nextLanguage, nextQuery) {
      panel.hidden = !visible;
      language = nextLanguage; query = nextQuery;
      if (visible) { render(); load(); } else closePlayer();
    },
  };
})();
