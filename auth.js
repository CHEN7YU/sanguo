(() => {
  'use strict';
  const login = document.getElementById('wechatLoginBtn');
  const logout = document.getElementById('wechatLogoutBtn');
  const status = document.getElementById('accountStatus');
  const mode = /MicroMessenger/i.test(navigator.userAgent) ? 'wechat' : 'website';
  let busy = false;

  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!(response.headers.get('content-type') || '').includes('application/json')) {
      throw new Error('此试玩环境未接入登录服务，可直接游客试玩');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '登录服务暂时不可用');
    return data;
  }

  function render(data) {
    login.hidden = !!data.user;
    logout.hidden = !data.user;
    login.disabled = !data.providers[mode];
    status.textContent = data.user
      ? window.ZhaolieCloud?.account()
        ? '已微信登录 · 账号独立存档 · 云同步状态见“管理云存档”'
        : '微信会话有效 · 当前选择游客存档；重新登录可切回账号'
      : data.providers[mode]
        ? '可游客试玩或微信登录 · 登录后使用账号独立存档'
        : '游客模式 · 微信登录尚未配置 · 存档保存在本机';
  }

  const errors = {
    invalid_state: '微信登录已过期或校验失败，请重新登录',
    cancelled: '已取消微信登录，可以直接游客试玩',
    unconfigured: '微信登录尚未配置',
    provider_failed: '微信授权失败，请稍后重试'
  };
  const url = new URL(location.href);
  const result = url.searchParams.get('auth');
  if (result) {
    url.searchParams.delete('auth');
    history.replaceState(null, '', url);
  }
  (window.ZhaolieCloud ? window.ZhaolieCloud.ready : request('/api/auth/session')).then(data => {
    if(!data)throw new Error('登录服务暂时不可用，可继续使用本机进度');
    render(data);
    if (result && result !== 'success') status.textContent = errors[result] || '微信登录未完成，请重试';
  }).catch(error => {
    login.disabled = true;
    status.textContent = error.message;
  });

  login.addEventListener('click', event => {
    event.stopPropagation();
    if (!busy && !login.disabled) {
      busy = true;
      sessionStorage.removeItem('zhaolie-force-guest');
      login.disabled = true;
      status.textContent = mode === 'website'
        ? '即将打开微信扫码页；同一部手机可将游戏链接在微信中打开'
        : '即将前往微信授权';
      location.assign(`/api/auth/wechat/start?mode=${mode}`);
    }
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
    } catch (error) {
      status.textContent = error.message;
    } finally {
      busy = false;
      logout.disabled = false;
    }
  });
  window.addEventListener('zhaolie-session-expired',()=>{
    login.hidden=false;login.disabled=false;logout.hidden=true;
    status.textContent='登录失效或账号已切换 · 本机进度保留，请重新登录';
  });
})();
