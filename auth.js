(() => {
  'use strict';
  const login = document.getElementById('accountLoginBtn');
  const logout = document.getElementById('accountLogoutBtn');
  const status = document.getElementById('accountStatus');
  const dialog = document.getElementById('accountDialog');
  const form = document.getElementById('accountForm');
  const username = document.getElementById('accountUsername');
  const password = document.getElementById('accountPassword');
  const notice = document.getElementById('accountNotice');
  const submit = document.getElementById('accountSubmitBtn');
  const toggle = document.getElementById('accountToggleBtn');
  let busy = false, registering = false;

  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('此试玩环境未接入账号服务，可直接游客试玩');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '账号服务暂时不可用');
    return data;
  }
  function setMode() {
    document.getElementById('accountDialogTitle').textContent = registering ? '注册账号' : '账号登录';
    submit.textContent = registering ? '注册并登录' : '登录';
    toggle.textContent = registering ? '已有账号，去登录' : '没有账号，去注册';
    password.autocomplete = registering ? 'new-password' : 'current-password';
    password.value = '';
    notice.textContent = '密码固定4位数字，请记住用户名和密码；目前不支持找回。';
  }
  function render(data) {
    login.hidden = false;
    login.textContent = data.user ? '切换账号' : '账号登录 / 注册';
    logout.hidden = !data.user;
    login.disabled = !data.providers.password;
    status.textContent = data.user
      ? window.ZhaolieCloud?.account()
        ? `已登录：${data.user.username || '旧账号'} · 账号独立存档`
        : '会话有效 · 当前使用游客存档，点击登录可切回账号'
      : data.providers.password ? '游客可直接玩 · 登录后可同步存档' : '游客模式 · 账号服务尚未配置 · 存档保存在本机';
  }
  (window.ZhaolieCloud ? window.ZhaolieCloud.ready : request('/api/auth/session')).then(data => {
    if (!data) throw new Error('账号服务暂时不可用，可继续使用本机进度');
    render(data);
  }).catch(error => { login.disabled = true; status.textContent = error.message; });

  login.addEventListener('click', event => {
    event.stopPropagation();
    if (busy || login.disabled) return;
    registering = false;
    username.value = '';
    setMode();
    dialog.showModal();
    username.focus();
  });
  toggle.addEventListener('click', () => { if (!busy) { registering = !registering; setMode(); } });
  document.getElementById('accountCloseBtn').addEventListener('click', () => {
    if (busy) return;
    password.value = '';
    dialog.close();
  });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); else password.value = ''; });
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('click', event => event.stopPropagation());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const name = username.value.trim(), pin = password.value;
    if (!/^[A-Za-z0-9_\u3400-\u9fff]{2,20}$/.test(name)) { notice.textContent = '用户名需为2—20个中文、英文字母、数字或下划线'; return; }
    if (!/^[0-9]{4}$/.test(pin)) { notice.textContent = '密码必须恰好为4位数字，可包含开头的0'; return; }
    busy = true;
    submit.disabled = toggle.disabled = logout.disabled = true;
    notice.textContent = registering ? '正在注册…' : '正在登录…';
    try {
      await request(registering ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: name, password: pin })
      });
      password.value = '';
      sessionStorage.removeItem('zhaolie-force-guest');
      // Reload before initializing the new account; never relabel the running game's saves.
      location.assign(location.pathname);
    } catch (error) { notice.textContent = error.message; password.value = ''; }
    finally { busy = false; submit.disabled = toggle.disabled = logout.disabled = false; }
  });
  logout.addEventListener('click', async event => {
    event.stopPropagation();
    if (busy) return;
    busy = true;
    logout.disabled = true;
    try {
      await request('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('zhaolie-last-account');
      sessionStorage.removeItem('zhaolie-force-guest');
      location.assign(location.pathname);
    } catch (error) { status.textContent = error.message; }
    finally { busy = false; logout.disabled = false; }
  });
  window.addEventListener('zhaolie-session-expired', () => {
    login.hidden = false; login.disabled = false; logout.hidden = true;
    status.textContent = '登录失效或账号已切换 · 本机进度保留，请重新登录';
  });
})();
