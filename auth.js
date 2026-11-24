(() => {
  const button = document.querySelector('.search-header .login-button');
  if (window.sullinDeployment?.static) { button.hidden = true; return; }
  const dialog = document.getElementById('admin-dialog');
  const form = document.getElementById('admin-form');
  const status = document.getElementById('admin-status');
  const submit = document.getElementById('admin-submit');
  let authenticated = false;
  let busy = false;
  const messages = {
    ko: { title:'관리자 로그인', email:'이메일', password:'비밀번호', login:'로그인', logout:'관리자 · 로그아웃', close:'닫기', unavailable:'인증 서버에 연결할 수 없어요. 서버 주소로 접속해 주세요.', credentials:'이메일 또는 비밀번호가 올바르지 않아요.', limit:'로그인 시도가 너무 많아요. 15분 후 다시 시도해 주세요.' },
    en: { title:'Administrator sign in', email:'Email', password:'Password', login:'Sign in', logout:'Admin · Sign out', close:'Close', unavailable:'Authentication server unavailable. Open the site through its server URL.', credentials:'Incorrect email or password.', limit:'Too many attempts. Please try again in 15 minutes.' },
    th: { title:'เข้าสู่ระบบผู้ดูแล', email:'อีเมล', password:'รหัสผ่าน', login:'เข้าสู่ระบบ', logout:'ผู้ดูแล · ออกจากระบบ', close:'ปิด', unavailable:'เชื่อมต่อเซิร์ฟเวอร์ยืนยันตัวตนไม่ได้ โปรดเปิดเว็บไซต์ผ่าน URL ของเซิร์ฟเวอร์', credentials:'อีเมลหรือรหัสผ่านไม่ถูกต้อง', limit:'พยายามเข้าสู่ระบบมากเกินไป โปรดลองอีกครั้งใน 15 นาที' },
  };
  const text = () => messages[document.documentElement.lang] || messages.en;
  function render() {
    const copy = text();
    button.textContent = authenticated ? copy.logout : copy.login;
    button.disabled = busy;
    document.getElementById('admin-heading').textContent = copy.title;
    document.getElementById('admin-email-label').textContent = copy.email;
    document.getElementById('admin-password-label').textContent = copy.password;
    document.getElementById('admin-close').setAttribute('aria-label', copy.close);
    submit.textContent = copy.login;
    submit.disabled = busy;
    window.sullinGallery.setAdmin(authenticated);
  }
  async function request(path, data) {
    if (!['http:', 'https:'].includes(location.protocol)) throw new Error('unavailable');
    const response = await fetch(`/api/admin/${path}`, {
      method: data ? 'POST' : 'GET', credentials:'same-origin', cache:'no-store',
      ...(data ? { headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(data) } : {}),
      signal:AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(response.status === 401 ? 'credentials' : response.status === 429 ? 'limit' : 'unavailable');
    return response.json();
  }
  button.addEventListener('click', async () => {
    status.textContent = '';
    if (!authenticated) { render(); dialog.showModal(); return; }
    busy = true; render();
    try { await request('logout', {}); authenticated = false; }
    catch { status.textContent = text().unavailable; dialog.showModal(); }
    finally { busy = false; render(); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    busy = true; status.textContent = ''; render();
    try {
      const result = await request('login', { email:form.elements.email.value, password:form.elements.password.value });
      authenticated = result.authenticated === true;
      if (!authenticated) throw new Error('credentials');
      dialog.close();
    } catch (error) { status.textContent = text()[error.message] || text().unavailable; }
    finally { form.elements.password.value = ''; busy = false; render(); }
  });
  document.getElementById('admin-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { form.elements.password.value = ''; });
  new MutationObserver(() => { status.textContent = ''; render(); }).observe(document.documentElement, { attributes:true, attributeFilter:['lang'] });
  render();
  request('session').then(result => { authenticated = result.authenticated === true; render(); }).catch(() => {});
})();
