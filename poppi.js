(() => {
  const form = document.getElementById('search-form');
  const query = document.getElementById('search-query');
  const home = document.querySelector('.home');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mascot = document.createElement('div');
  mascot.className = 'poppi-mascot';
  mascot.hidden = true;
  const pet = document.createElement('button');
  pet.type = 'button';
  pet.className = 'poppi-pet';
  const facing = document.createElement('span');
  facing.className = 'poppi-facing';
  const image = document.createElement('img');
  image.src = 'poppi.png';
  image.alt = 'Poppi';
  image.draggable = false;
  facing.append(image);
  pet.append(facing);
  const sparkle = document.createElement('span');
  sparkle.className = 'poppi-sparkle';
  sparkle.textContent = '✦';
  sparkle.setAttribute('aria-hidden', 'true');
  const bubble = document.createElement('span');
  bubble.className = 'poppi-bubble';
  bubble.setAttribute('role', 'status');
  mascot.append(pet, sparkle, bubble);
  document.body.append(mascot);
  let active = false, frame = 0, lastTime = 0, idleUntil = 0, reactionUntil = 0;
  let x = 0, y = 0, target = { x:0, y:0 }, bubbleTimer;
  let leaving = false, exitTimer, rapidClicks = [], previousClick = -Infinity;
  const labels = {
    ko: { pet:'패스블린 쓰다듬기 · 빠르게 4번 누르면 숨기기', hello:'패스블린 등장!', happy:['헤헤 ♡', '같이 놀자!', '설린 최고!'] },
    en: { pet:'Pet Poppi · click four times quickly to dismiss', hello:'Poppi is here!', happy:['Hehe ♡', 'Let’s play!', 'Sullin ♡'] },
    th: { pet:'ลูบ Poppi · คลิกเร็ว ๆ 4 ครั้งเพื่อซ่อน', hello:'Poppi มาแล้ว!', happy:['ฮิฮิ ♡', 'มาเล่นกัน!', 'ซอลลิน ♡'] },
  };
  const text = () => labels[document.documentElement.lang] || labels.en;
  function bounds() {
    const area = home.getBoundingClientRect();
    const width = mascot.offsetWidth || 110;
    const height = mascot.offsetHeight || 145;
    const left = Math.max(8, area.left + 8);
    const top = Math.max(90, area.top + 36);
    return { left, top, right:Math.max(left, Math.min(innerWidth, area.right) - width - 12), bottom:Math.max(top, Math.min(innerHeight, area.bottom) - height - 12) };
  }
  function clamp() {
    const b = bounds();
    x = Math.max(b.left, Math.min(b.right, x));
    y = Math.max(b.top, Math.min(b.bottom, y));
  }
  function draw() { mascot.style.transform = `translate3d(${x}px,${y}px,0)`; }
  function chooseTarget() {
    const b = bounds();
    target = { x:b.left + Math.random() * (b.right - b.left), y:b.top + Math.random() * (b.bottom - b.top) };
    facing.style.setProperty('--poppi-direction', target.x < x ? '-1' : '1');
  }
  function say(message) {
    bubble.textContent = message;
    mascot.classList.add('poppi-speaking');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => mascot.classList.remove('poppi-speaking'), 2200);
  }
  function tick(now) {
    if (!active || leaving || document.hidden || reduceMotion.matches) { frame = 0; lastTime = 0; return; }
    const dt = Math.min((now - (lastTime || now)) / 1000, 0.05);
    lastTime = now;
    if (now < reactionUntil || now < idleUntil) {
      mascot.classList.remove('poppi-walking');
    } else {
      mascot.classList.remove('poppi-happy');
      const dx = target.x - x, dy = target.y - y, distance = Math.hypot(dx, dy);
      if (distance < 3) {
        idleUntil = now + 1200 + Math.random() * 2400;
        chooseTarget();
        mascot.classList.remove('poppi-walking');
      } else {
        const step = Math.min(distance, 56 * dt);
        x += dx / distance * step; y += dy / distance * step;
        clamp(); draw();
        mascot.classList.add('poppi-walking');
      }
    }
    frame = requestAnimationFrame(tick);
  }
  function startLoop() {
    if (!frame && active && !leaving && !document.hidden && !reduceMotion.matches) frame = requestAnimationFrame(tick);
  }
  function hide() {
    active = false;
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    clearTimeout(bubbleTimer);
    clearTimeout(exitTimer);
    leaving = false;
    rapidClicks = [];
    previousClick = -Infinity;
    mascot.hidden = true;
    mascot.classList.remove('poppi-happy', 'poppi-walking', 'poppi-speaking', 'poppi-leaving');
  }
  function jumpAway() {
    leaving = true;
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    clearTimeout(bubbleTimer);
    mascot.classList.remove('poppi-happy', 'poppi-walking', 'poppi-speaking');
    mascot.style.setProperty('--poppi-exit-x', `${x}px`);
    mascot.style.setProperty('--poppi-exit-y', `${y}px`);
    mascot.style.setProperty('--poppi-exit-top', `${y - 85}px`);
    mascot.style.setProperty('--poppi-exit-bottom', `${innerHeight + 180}px`);
    mascot.classList.add('poppi-leaving');
    exitTimer = setTimeout(hide, reduceMotion.matches ? 180 : 1150);
  }
  function appear() {
    if (leaving) hide();
    mascot.hidden = false;
    if (!active) {
      const b = bounds(); x = b.right; y = b.bottom;
      active = true; draw(); chooseTarget();
    }
    reactionUntil = performance.now() + 900;
    mascot.classList.add('poppi-happy');
    pet.setAttribute('aria-label', text().pet);
    say(text().hello);
    startLoop();
  }
  form.addEventListener('submit', () => {
    if (['패스블린','poppi'].includes(query.value.trim().toLowerCase())) appear();
    else hide();
  });
  pet.addEventListener('click', () => {
    if (!active || leaving) return;
    const now = performance.now();
    if (now - previousClick > 450) rapidClicks = [];
    previousClick = now;
    rapidClicks = rapidClicks.filter(time => now - time <= 1200);
    rapidClicks.push(now);
    if (rapidClicks.length >= 4) { jumpAway(); return; }
    reactionUntil = now + 1100;
    mascot.classList.remove('poppi-happy');
    void pet.offsetWidth;
    mascot.classList.add('poppi-happy');
    const options = text().happy;
    say(options[Math.floor(Math.random() * options.length)]);
  });
  document.addEventListener('visibilitychange', startLoop);
  window.addEventListener('resize', () => { if (active && !leaving) { clamp(); draw(); chooseTarget(); } });
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) { cancelAnimationFrame(frame); frame = 0; mascot.classList.remove('poppi-walking', 'poppi-happy'); }
    else startLoop();
  });
})();
