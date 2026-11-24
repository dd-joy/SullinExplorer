(() => {
  const panel = document.getElementById('image-gallery');
  const grid = document.getElementById('gallery-grid');
  const status = document.getElementById('gallery-status');
  const refresh = document.getElementById('gallery-refresh');
  const interval = 5 * 60 * 1000;
  const accounts = ['sullinface', 'first__nun', 'imsullinlove'];
  const disabledSources = new Set(['objekt']);
  const cacheKey = 'sullin-gallery-photos-v2';
  const copy = {
    ko: { source: '@설린 모음집', refresh: '새로고침', loading: '사진을 불러오는 중…', error: '사진을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.', count: n => `사진 ${n}장 · 5분마다 자동 갱신`, cached: ' · 저장된 사진 표시 중' },
    en: { source: '@sullinface', refresh: 'Refresh', loading: 'Loading photos…', error: 'Unable to load photos. Please try again later.', count: n => `${n} photos · Refreshes every 5 minutes`, cached: ' · Showing saved photos' },
    th: { source: '@sullinface', refresh: 'รีเฟรช', loading: 'กำลังโหลดรูปภาพ…', error: 'โหลดรูปภาพไม่สำเร็จ โปรดลองอีกครั้งภายหลัง', count: n => `${n} รูป · อัปเดตทุก 5 นาที`, cached: ' · แสดงรูปภาพที่บันทึกไว้' },
  };
  let language = 'ko';
  let query = 'Sullin';
  let photos = [];
  let objektPhotos = [];
  let objektUpdated = 0;
  let objektPending = false;
  let objektFailed = false;
  async function loadObjekts() {
    if (objektPending || Date.now() - objektUpdated < 60 * 60 * 1000) return;
    objektPending = true;
    try {
      const response = await fetch(window.sullinDeployment?.static ? 'data/objekts.json' : '/api/objekts', { cache:'no-store', signal:AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error('Objekts unavailable');
      const data = await response.json();
      if (!Array.isArray(data.photos)) throw new Error('Invalid Objekt list');
      objektPhotos = data.photos.filter(photo => photo.kind === 'objekt');
      objektUpdated = Date.now();
      objektFailed = false;
    } catch { objektFailed = true; }
    finally { objektPending = false; render(); }
  }
  let lastSuccess = 0;
  let lastAttempt = 0;
  let loading = false;
  let failed = false;
  let storageFailed = false;
  const storageWarnings = {
    ko: ' · 저장 공간이 부족하거나 차단되어 새 사진 목록을 저장하지 못했어요.',
    en: ' · Unable to save new photos: browser storage is full or unavailable.',
    th: ' · บันทึกรายการรูปภาพใหม่ไม่ได้ พื้นที่จัดเก็บเต็มหรือถูกปิดกั้น',
  };
  let layoutFrame = 0;
  const preview = document.getElementById('image-preview');
  let selectedPhoto = null;
  let selectedCard = null;
  const previewLabels = {
    ko: { post: '원본 게시물', close: '닫기' },
    en: { post: 'View original post', close: 'Close' },
    th: { post: 'ดูโพสต์ต้นฉบับ', close: 'ปิด' },
  };

  function closePreview(restoreFocus = false) {
    preview.hidden = true;
    selectedPhoto = null;
    grid.querySelectorAll('.gallery-selected').forEach(card => card.classList.remove('gallery-selected'));
    if (restoreFocus && selectedCard?.isConnected) selectedCard.focus();
  }

  function openPreview(photo, card) {
    selectedPhoto = photo;
    selectedCard = card;
    grid.querySelectorAll('.gallery-selected').forEach(item => item.classList.remove('gallery-selected'));
    card.classList.add('gallery-selected');
    const row = [...grid.querySelectorAll('.gallery-card')].filter(item => item.offsetTop === card.offsetTop);
    row[row.length - 1].after(preview);
    const image = document.getElementById('preview-image');
    image.src = photo.image;
    image.alt = photo.text || 'Sullin';
    const account = photo.account || new URL(photo.post).pathname.split('/')[1];
    const source = document.getElementById('preview-account');
    source.textContent = account === 'first__nun' && language === 'ko' ? '@첫눈'
      : account === 'sullinface' && language === 'ko' ? '@설린 모음집' : `@${account}`;
    source.href = photo.kind === 'objekt' ? 'https://apollo.cafe/?member=Sullin&artist=tripleS' : `https://x.com/${account}`;
    if (photo.kind === 'objekt') source.textContent = 'Sullin · COSMO Objekt';
    document.getElementById('preview-text').textContent = photo.text;
    document.getElementById('preview-dimensions').textContent = photo.width && photo.height ? `${photo.width} × ${photo.height}` : '';
    const labels = previewLabels[language] || previewLabels.en;
    const post = document.getElementById('preview-post');
    post.href = photo.post;
    post.textContent = photo.kind === 'objekt' ? ({ ko:'Objekt 보기', en:'View Objekt', th:'ดู Objekt' }[language] || 'View Objekt') : labels.post;
    document.getElementById('preview-close').setAttribute('aria-label', labels.close);
    preview.hidden = false;
    document.getElementById('preview-close').focus({ preventScroll: true });
    preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  document.getElementById('preview-close').addEventListener('click', () => closePreview(true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !preview.hidden) closePreview(true);
  });

  function layoutPhotos() {
    const width = grid.clientWidth;
    if (!width) return;
    const gap = 14;
    const targetHeight = width < 600 ? 160 : 220;
    let row = [];
    let ratios = 0;
    function finish(last) {
      if (!row.length) return;
      const fittedHeight = (width - gap * (row.length - 1)) / ratios;
      const height = last ? Math.min(targetHeight, fittedHeight) : fittedHeight;
      row.forEach(card => {
        card.style.width = `${Number(card.dataset.ratio) * height}px`;
        card.querySelector('img').style.height = `${height}px`;
      });
      row = [];
      ratios = 0;
    }
    [...grid.querySelectorAll('.gallery-card')].forEach(card => {
      const ratio = Number(card.dataset.ratio) || 1;
      row.push(card);
      ratios += ratio;
      if (ratios * targetHeight + gap * (row.length - 1) >= width) finish(false);
    });
    finish(true);
  }

  function scheduleLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(layoutPhotos);
  }
  new ResizeObserver(scheduleLayout).observe(grid);
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Array.isArray(cached.photos)) {
      photos = cached.photos;
      lastSuccess = Number(cached.time) || 0;
    }
  } catch { /* Storage is optional. */ }

  function safeUrl(value, hosts) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && hosts.includes(url.hostname) ? url.href : null;
    } catch { return null; }
  }

  function render() {
    closePreview();
    panel.append(preview);
    const text = copy[language] || copy.en;
    const sources = document.getElementById('gallery-source');
    sources.replaceChildren();
    function sourceButton(key, label) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-source-toggle';
      button.dataset.source = key;
      button.textContent = label;
      button.setAttribute('aria-pressed', String(!disabledSources.has(key)));
      button.addEventListener('click', () => {
        if (disabledSources.has(key)) disabledSources.delete(key);
        else disabledSources.add(key);
        render();
        sources.querySelector(`[data-source="${key}"]`)?.focus({ preventScroll:true });
      });
      sources.append(button);
    }
    accounts.forEach(account => {
      sourceButton(account, account === 'sullinface' ? text.source
        : account === 'first__nun' && language === 'ko' ? '@첫눈' : `@${account}`);
    });
    sourceButton('objekt', 'COSMO Objekt');
    refresh.textContent = text.refresh;
    refresh.disabled = loading;
    const term = query.trim().toLowerCase();
    const general = !term || ['sullin', '설린', 'ซอลลิน', 'พิรดา บุญรักษา'].includes(term);
    const combined = [...photos, ...objektPhotos].sort((a, b) => b.timestamp - a.timestamp);
    const visible = combined.filter(photo =>
      !disabledSources.has(photo.kind === 'objekt' ? 'objekt' : photo.account || new URL(photo.post).pathname.split('/')[1]) &&
      (general || photo.text.toLowerCase().includes(term)));
    grid.replaceChildren();
    visible.forEach(photo => {
      const imageUrl = safeUrl(photo.image, photo.kind === 'objekt' ? ['resources.cosmo.fans','static.cosmo.fans'] : ['pbs.twimg.com']);
      const postUrl = safeUrl(photo.post, photo.kind === 'objekt' ? ['apollo.cafe'] : ['x.com', 'twitter.com']);
      if (!imageUrl || !postUrl) return;
      const link = document.createElement('a');
      link.className = 'gallery-card';
      link.dataset.ratio = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : photo.kind === 'objekt' ? 0.625 : 1;
      link.href = postUrl;
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (selectedPhoto === photo && !preview.hidden) closePreview(true);
        else openPreview(photo, link);
      });
      const image = document.createElement('img');
      const thumbnail = new URL(imageUrl);
      if (photo.kind !== 'objekt') thumbnail.searchParams.set('name', 'small');
      image.src = thumbnail.href;
      image.alt = photo.text || `Sullin · @${photo.account}`;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('load', () => {
        if (image.naturalWidth && image.naturalHeight) {
          link.dataset.ratio = image.naturalWidth / image.naturalHeight;
          if (photo.kind === 'objekt') { photo.width = image.naturalWidth; photo.height = image.naturalHeight; }
          scheduleLayout();
        }
      });
      link.append(image);
      grid.append(link);
    });
    scheduleLayout();
    status.textContent = loading ? text.loading : failed
      ? text.error + (photos.length ? text.cached : '') : text.count(visible.length);
    if (storageFailed) status.textContent += storageWarnings[language] || storageWarnings.en;
    if (objektFailed) status.textContent += ({ ko:' · Objekt를 불러오지 못했어요.', en:' · Unable to load Objekts.', th:' · โหลด Objekt ไม่สำเร็จ' }[language] || '');
  }

  async function load(force = false) {
    if (loading || (!force && Date.now() - Math.max(lastSuccess, lastAttempt) < interval)) return;
    loading = true;
    lastAttempt = Date.now();
    render();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      if (window.sullinDeployment?.static) {
        const response = await fetch('data/photos.json', { cache:'no-store', signal:controller.signal });
        if (!response.ok) throw new Error('Archive unavailable');
        const data = await response.json();
        if (!Array.isArray(data.photos)) throw new Error('Invalid archive');
        photos = data.photos;
        lastSuccess = Date.now();
        failed = false;
        return;
      }
      const responses = await Promise.allSettled(accounts.map(async account => {
        const response = await fetch(`https://api.fxtwitter.com/2/profile/${account}/media?count=40`, { signal: controller.signal });
        if (!response.ok) throw new Error('HTTP error');
        const data = await response.json();
        if (data.code !== 200 || !Array.isArray(data.results)) throw new Error('Invalid response');
        return { account, posts: data.results };
      }));
      const successful = responses.filter(response => response.status === 'fulfilled').map(response => response.value);
      if (!successful.length) throw new Error('All accounts unavailable');
      // Keep the existing archive even when photos disappear from recent timelines.
      const collected = [];
      successful.forEach(({ account, posts }) => {
        posts.filter(post => post.author?.screen_name?.toLowerCase() === account)
          .forEach(post => {
            (post.media?.photos || post.media?.all || []).filter(media => media.type === 'photo').forEach(media => {
              if (safeUrl(media.url, ['pbs.twimg.com']) && safeUrl(post.url, ['x.com', 'twitter.com'])) {
                collected.push({ image: media.url, post: post.url, text: post.text || '', width: media.width, height: media.height, account, timestamp: Number(post.created_timestamp) || 0 });
              }
            });
          });
      });
      collected.push(...photos);
      const unique = new Map();
      collected.sort((a, b) => b.timestamp - a.timestamp).forEach(photo => {
        const key = new URL(photo.image).pathname;
        if (!unique.has(key)) unique.set(key, photo);
      });
      photos = [...unique.values()];
      lastSuccess = Date.now();
      failed = successful.length !== accounts.length;
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ photos, time: lastSuccess }));
        storageFailed = false;
      } catch {
        storageFailed = true;
      }
    } catch {
      failed = true;
    } finally {
      clearTimeout(timeout);
      loading = false;
      render();
    }
  }

  refresh.addEventListener('click', () => { load(true); objektUpdated = 0; loadObjekts(); });
  setInterval(() => { if (!panel.hidden && !document.hidden) { load(); } }, interval);
  document.addEventListener('visibilitychange', () => { if (!panel.hidden && !document.hidden) load(); });
  window.sullinGallery = {
    show(visible, nextLanguage, nextQuery) {
      panel.hidden = !visible;
      language = nextLanguage;
      query = nextQuery;
      if (visible) { render(); load(); loadObjekts(); }
    },
  };
})();
