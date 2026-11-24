const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const darkModeToggle = document.getElementById('dark-mode');
const windows7Toggle = document.getElementById('windows7-mode');
const languageOption = document.getElementById('language-option');
const fullscreenToggle = document.getElementById('fullscreen-mode');
const fullscreenStatus = document.getElementById('fullscreen-status');
const languages = ['ko', 'en', 'th'];
const translations = {
  ko: { language: '언어: 한국어', darkMode: '다크모드', windows7Mode: 'Windows 7 모드', settings: '설정', options: '설정 옵션', firstNun: '@첫눈' },
  en: { language: 'Language: English', darkMode: 'Dark mode', windows7Mode: 'Windows 7 mode', settings: 'Settings', options: 'Settings options', firstNun: '@first__nun' },
  th: { language: 'ภาษา: ไทย', darkMode: 'โหมดมืด', windows7Mode: 'โหมด Windows 7', settings: 'การตั้งค่า', options: 'ตัวเลือกการตั้งค่า', firstNun: '@first__nun' },
};
translations.ko.fullscreen = '전체 화면';
translations.en.fullscreen = 'Full screen';
translations.th.fullscreen = 'เต็มหน้าจอ';
translations.ko.fullscreenError = '전체 화면을 열 수 없어요. F11 키를 사용해 주세요.';
translations.en.fullscreenError = 'Full screen is unavailable. Please use F11.';
translations.th.fullscreenError = 'ไม่สามารถเปิดเต็มหน้าจอได้ โปรดกด F11';
translations.ko.namuTitle = '설린 - 나무위키';
translations.en.namuTitle = 'Sullin - NamuWiki';
translations.th.namuTitle = 'พิรดา บุญรักษา - NamuWiki';
translations.ko.namuDescription = '나무위키에서 설린에 관한 정보를 찾아보세요.';
translations.en.namuDescription = 'Explore information about Sullin on NamuWiki.';
translations.th.namuDescription = 'ค้นหาข้อมูลเกี่ยวกับซอลลินบน NamuWiki';
translations.ko.fandomDescription = 'tripleS Wiki에서 설린의 프로필과 관련 정보를 살펴보세요.';
translations.en.fandomDescription = 'Explore Sullin’s profile and related information on tripleS Wiki.';
translations.th.fandomDescription = 'อ่านประวัติและข้อมูลเกี่ยวกับซอลลินบน tripleS Wiki';
translations.ko.sullinFace = '@설린 모음집';
translations.en.sullinFace = '@sullinface';
translations.th.sullinFace = '@sullinface';
translations.ko.sullinFaceDescription = '@sullinface 계정에서 설린의 게시물을 만나보세요.';
translations.en.sullinFaceDescription = 'Explore posts of Sullin from @sullinface.';
translations.th.sullinFaceDescription = 'สำรวจโพสต์เกี่ยวกับซอลลินจาก @sullinface';
translations.ko.images = '이미지';
translations.en.images = 'Images';
translations.th.images = 'รูปภาพ';
translations.ko.shopping = '쇼핑';
translations.en.shopping = 'Shopping';
translations.th.shopping = 'ช็อปปิ้ง';
Object.assign(translations.ko, {
  allResults: '전체', videos: '동영상', social: '소셜', playlists: '재생목록', sullinName: '설린', archiveLabel: '아카이브',
  explorerDescription: '설린의 순간을 찾아서. SullinExplorer 유튜브 채널에서 영상을 만나보세요.',
  triplesDescription: 'tripleS의 유튜브 채널. 설린과 tripleS의 영상들을 한곳에서 찾아보세요.',
  officialDescription: 'tripleS의 소식을 확인할 수 있는 @triplescosmos 계정으로 이동합니다.',
  firstDescription: '설린을 향한 시선. @first__nun 계정의 게시물을 만나보세요.',
  loveDescription: '설린을 좋아하는 마음을 담아. @imsullinlove 계정으로 이동합니다.',
  archiveDescription: '태국 출신의 tripleS S22 멤버. 2024년 4월 2일에 공개됐다.',
});
Object.assign(translations.en, {
  allResults: 'All', videos: 'Videos', social: 'Social', playlists: 'Playlists', sullinName: 'Sullin', archiveLabel: 'Archive',
  explorerDescription: 'Explore moments of Sullin. Discover videos on the SullinExplorer YouTube channel.',
  triplesDescription: 'The tripleS YouTube channel. Explore videos of Sullin and tripleS.',
  officialDescription: 'Visit @triplescosmos for updates from tripleS.',
  firstDescription: 'A closer look at Sullin. Explore posts from @first__nun.',
  loveDescription: 'With love for Sullin. Visit the @imsullinlove account.',
  archiveDescription: 'The Thai S22 member of tripleS. She was revealed on April 2, 2024.',
});
Object.assign(translations.th, {
  allResults: 'ทั้งหมด', videos: 'วิดีโอ', social: 'โซเชียล', playlists: 'เพลย์ลิสต์', sullinName: 'พิรดา บุญรักษา', archiveLabel: 'คลังข้อมูล',
  explorerDescription: 'ค้นพบช่วงเวลาของซอลลินผ่านวิดีโอบนช่อง YouTube SullinExplorer',
  triplesDescription: 'ช่อง YouTube ของ tripleS สำรวจวิดีโอของซอลลินและ tripleS',
  officialDescription: 'ติดตามข่าวสารของ tripleS ผ่านบัญชี @triplescosmos',
  firstDescription: 'สำรวจช่วงเวลาของซอลลินผ่านโพสต์จาก @first__nun',
  loveDescription: 'ด้วยความรักที่มีต่อซอลลิน เยี่ยมชมบัญชี @imsullinlove',
  archiveDescription: 'สมาชิก S22 ของ tripleS จากประเทศไทย เปิดตัวเมื่อวันที่ 2 เมษายน 2024',
});

let resultCategory = 'all';
const searchQuery = document.getElementById('search-query');
const resultItems = [...document.querySelectorAll('.search-result')];

function updateResults() {
  const showImages = resultCategory === 'image';
  document.querySelector('.results-layout').classList.toggle('images-view', showImages);
  document.querySelector('.search-results').hidden = showImages || resultCategory === 'video';
  window.sullinVideos.show(resultCategory === 'video', document.documentElement.lang, searchQuery.value);
  window.sullinGallery.show(showImages, document.documentElement.lang, searchQuery.value);
  document.querySelector('.knowledge-panel').hidden = resultCategory !== 'all';
  const query = searchQuery.value.trim().toLowerCase();
  let count = 0;
  resultItems.forEach((item) => {
    const matchesQuery = !query || ['sullin', '설린', 'ซอลลิน'].includes(query)
      || item.textContent.toLowerCase().includes(query);
    const matchesCategory = resultCategory === 'all' || item.dataset.resultCategory === resultCategory;
    item.hidden = !(matchesQuery && matchesCategory);
    if (!item.hidden) count++;
  });
  const language = document.documentElement.lang;
  document.getElementById('result-count').textContent = language === 'ko'
    ? `검색결과 ${count}개` : language === 'th' ? `ผลการค้นหา ${count} รายการ` : `${count} results`;
}

document.getElementById('search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  updateResults();
  const query = searchQuery.value.trim();
  document.querySelector('.browser-address > span').textContent = `https://www.Nungle.com/search?q=${encodeURIComponent(query)}`;
  document.querySelector('.browser-tab > span').textContent = `${query || 'Nungle'} - Nungle Search`;
});
document.getElementById('clear-search').addEventListener('click', () => {
  searchQuery.value = '';
  searchQuery.focus();
});
document.querySelectorAll('[data-category]').forEach((button) => {
  button.addEventListener('click', () => {
    resultCategory = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    updateResults();
  });
});

function syncFullscreen() {
  fullscreenToggle.checked = Boolean(document.fullscreenElement);
}

fullscreenToggle.addEventListener('change', async () => {
  fullscreenStatus.hidden = true;
  fullscreenToggle.disabled = true;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    fullscreenStatus.textContent = translations[document.documentElement.lang].fullscreenError;
    fullscreenStatus.hidden = false;
  } finally {
    syncFullscreen();
    fullscreenToggle.disabled = false;
  }
});
document.addEventListener('fullscreenchange', syncFullscreen);
syncFullscreen();

function setLanguage(language) {
  document.documentElement.lang = language;
  const text = translations[language];
  languageOption.textContent = text.language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = text[element.dataset.i18n];
  });
  settingsToggle.setAttribute('aria-label', text.settings);
  settingsPanel.setAttribute('aria-label', text.options);
  const namuHost = language === 'ko' ? 'namu.wiki' : 'en.namu.wiki';
  document.getElementById('namu-result-link').href = `https://${namuHost}/w/%EC%84%A4%EB%A6%B0`;
  document.getElementById('namu-result-url').textContent = `https://${namuHost} › w › 설린`;
  updateResults();
}

const systemLanguage = (navigator.language || 'en').toLowerCase().split('-')[0];
let initialLanguage = languages.includes(systemLanguage) ? systemLanguage : 'en';
try {
  const savedLanguage = localStorage.getItem('sullin-language');
  if (languages.includes(savedLanguage)) initialLanguage = savedLanguage;
} catch {
  // Use the system language when storage is unavailable.
}
setLanguage(initialLanguage);

languageOption.addEventListener('click', () => {
  const next = languages[(languages.indexOf(document.documentElement.lang) + 1) % languages.length];
  setLanguage(next);
  try {
    localStorage.setItem('sullin-language', next);
  } catch {
    // Language selection still works for the current visit.
  }
});

function setWindows7(enabled) {
  document.documentElement.dataset.windows7 = String(enabled);
  windows7Toggle.checked = enabled;
}

try {
  const savedMode = localStorage.getItem('sullin-windows7');
  const previousMode = localStorage.getItem('sullin-mosaic') === 'true'
    || localStorage.getItem('sullin-low-quality') === 'true';
  setWindows7(savedMode === null ? previousMode : savedMode === 'true');
} catch {
  setWindows7(false);
}

windows7Toggle.addEventListener('change', () => {
  setWindows7(windows7Toggle.checked);
  try {
    localStorage.setItem('sullin-windows7', String(windows7Toggle.checked));
  } catch {
    // Keep the effect available when storage is blocked.
  }
});

// A repeating displacement ramp gathers samples toward each 1.1px cell centre.
const mosaicMap = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="x"><stop stop-color="rgb(255,0,0)"/><stop offset="1" stop-color="rgb(0,0,0)"/></linearGradient><linearGradient id="y" x2="0" y2="1"><stop stop-color="rgb(0,255,0)"/><stop offset="1" stop-color="rgb(0,0,0)"/></linearGradient></defs><path fill="url(#x)" d="M0 0h64v64H0z"/><path style="mix-blend-mode:screen" fill="url(#y)" d="M0 0h64v64H0z"/></svg>';
document.getElementById('mosaic-map').setAttribute('href', `data:image/svg+xml,${encodeURIComponent(mosaicMap)}`);

function setDarkMode(enabled) {
  document.documentElement.dataset.theme = enabled ? 'dark' : 'light';
  darkModeToggle.checked = enabled;
}

try {
  setDarkMode(localStorage.getItem('sullin-dark-mode') === 'true');
} catch {
  setDarkMode(false);
}

darkModeToggle.addEventListener('change', () => {
  setDarkMode(darkModeToggle.checked);
  try {
    localStorage.setItem('sullin-dark-mode', String(darkModeToggle.checked));
  } catch {
    // Keep the switch usable when browser storage is unavailable.
  }
});

function setSettingsOpen(open) {
  settingsPanel.hidden = !open;
  settingsToggle.setAttribute('aria-expanded', String(open));
}

settingsToggle.addEventListener('click', () => {
  setSettingsOpen(settingsPanel.hidden);
});

document.addEventListener('click', (event) => {
  if (!settingsToggle.contains(event.target) && !settingsPanel.contains(event.target)) {
    setSettingsOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !settingsPanel.hidden) {
    setSettingsOpen(false);
    settingsToggle.focus();
  }
});
