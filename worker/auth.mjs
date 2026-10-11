const SESSION_COOKIE = '__Host-zhaolie-session';
const FLOW_COOKIE = '__Host-zhaolie-wechat-flow';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const FLOW_SECONDS = 300;

function cookie(name, value, seconds) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
}

function readCookie(request, name) {
  return request.headers.get('cookie')?.split(';').map(value => value.trim())
    .find(value => value.startsWith(`${name}=`))?.slice(name.length + 1) || '';
}

function json(data, status = 200, cookies = []) {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  for (const value of cookies) headers.append('set-cookie', value);
  return new Response(JSON.stringify(data), { status, headers });
}

function randomToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function hash(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function sessionUser(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!env.AUTH_DB || !/^[a-f0-9]{64}$/.test(token)) return null;
  return env.AUTH_DB.prepare(
    'SELECT users.id FROM auth_sessions JOIN users ON users.id = auth_sessions.user_id WHERE token_hash = ? AND expires_at > ?'
  ).bind(await hash(token), Date.now()).first();
}

function settings(env, mode) {
  if (mode === 'website') return { appId: env.WECHAT_WEBSITE_APP_ID, secret: env.WECHAT_WEBSITE_APP_SECRET, scope: 'snsapi_login' };
  if (mode === 'wechat') return { appId: env.WECHAT_SERVICE_APP_ID, secret: env.WECHAT_SERVICE_APP_SECRET, scope: 'snsapi_base' };
  return null;
}

function available(env, mode) {
  const config = settings(env, mode);
  return !!(env.AUTH_DB && env.AUTH_ORIGIN && config?.appId && config?.secret);
}

function redirect(location, cookies = []) {
  const headers = new Headers({ location, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
  for (const value of cookies) headers.append('set-cookie', value);
  return new Response(null, { status: 302, headers });
}

function callbackResult(env, result, cookies = []) {
  const target = new URL('/', env.AUTH_ORIGIN);
  target.searchParams.set('auth', result);
  return redirect(target.href, [cookie(FLOW_COOKIE, '', 0), ...cookies]);
}

async function exchangeCode(config, code) {
  const url = new URL('https://api.weixin.qq.com/sns/oauth2/access_token');
  url.search = new URLSearchParams({ appid: config.appId, secret: config.secret, code, grant_type: 'authorization_code' }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('WeChat token endpoint failed');
  const data = await response.json();
  if (data.errcode || typeof data.openid !== 'string' || !data.openid || data.openid.length > 128
      || typeof data.access_token !== 'string' || !data.access_token) {
    throw new Error('WeChat authorization rejected');
  }
  return data;
}

export async function handleAuth(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const known = ['/api/auth/session', '/api/auth/wechat/start', '/api/auth/wechat/callback', '/api/auth/logout'];
  if (!known.includes(pathname)) return json({ error: '接口不存在' }, 404);
  const method = pathname === '/api/auth/logout' ? 'POST' : 'GET';
  if (request.method !== method) return json({ error: '请求方法不支持' }, 405);
  if (env.AUTH_ORIGIN && (new URL(env.AUTH_ORIGIN).origin !== url.origin || url.protocol !== 'https:')) {
    return json({ error: '登录服务域名配置不匹配' }, 503);
  }

  if (pathname === '/api/auth/session') {
    const user = await sessionUser(request, env);
    return json({
      user,
      providers: { website: available(env, 'website'), wechat: available(env, 'wechat') },
      cloudSaves: !!env.AUTH_DB
    });
  }

  if (pathname === '/api/auth/logout') {
    if (request.headers.get('origin') !== url.origin) return json({ error: '请求来源无效' }, 403);
    const token = readCookie(request, SESSION_COOKIE);
    if (env.AUTH_DB && /^[a-f0-9]{64}$/.test(token)) {
      await env.AUTH_DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await hash(token)).run();
    }
    return json({ ok: true }, 200, [cookie(SESSION_COOKIE, '', 0), cookie(FLOW_COOKIE, '', 0)]);
  }

  if (pathname === '/api/auth/wechat/start') {
    if (request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: '请从游戏页面发起登录' }, 403);
    const mode = url.searchParams.get('mode');
    if (!settings(env, mode)) return json({ error: '微信登录方式无效' }, 400);
    if (!available(env, mode)) return json({ error: '微信登录尚未配置，请直接游客试玩' }, 503);
    if (mode === 'wechat' && !/MicroMessenger/i.test(request.headers.get('user-agent') || '')) {
      return json({ error: '服务号授权需要在微信中打开游戏' }, 400);
    }
    const config = settings(env, mode);
    const state = randomToken();
    const flow = `${mode}.${Date.now()}.${state}`;
    const target = new URL(mode === 'website'
      ? 'https://open.weixin.qq.com/connect/qrconnect'
      : 'https://open.weixin.qq.com/connect/oauth2/authorize');
    target.search = new URLSearchParams({
      appid: config.appId, redirect_uri: `${url.origin}/api/auth/wechat/callback`,
      response_type: 'code', scope: config.scope, state
    }).toString();
    target.hash = 'wechat_redirect';
    return redirect(target.href, [cookie(FLOW_COOKIE, flow, FLOW_SECONDS)]);
  }

  if (!env.AUTH_ORIGIN) return json({ error: '微信登录尚未配置' }, 503);
  const [mode, issuedAt, state] = readCookie(request, FLOW_COOKIE).split('.');
  const age = Date.now() - Number(issuedAt);
  if (!/^[a-f0-9]{64}$/.test(state || '') || state !== url.searchParams.get('state')
      || !Number.isFinite(age) || age < 0 || age > FLOW_SECONDS * 1000) {
    return callbackResult(env, 'invalid_state');
  }
  if (!available(env, mode)) return callbackResult(env, 'unconfigured');
  const code = url.searchParams.get('code');
  if (!code || code.length > 512) return callbackResult(env, 'cancelled');
  let identity;
  const config = settings(env, mode);
  try {
    identity = await exchangeCode(config, code);
  } catch {
    console.error('WeChat authorization exchange failed');
    return callbackResult(env, 'provider_failed');
  }

  // OpenID is scoped to AppID. Cross-application linking requires a separate verified flow.
  const existing = await env.AUTH_DB.prepare('SELECT user_id FROM auth_identities WHERE app_id = ? AND open_id = ?')
    .bind(config.appId, identity.openid).first();
  const userId = existing?.user_id || crypto.randomUUID();
  const token = randomToken();
  const now = Date.now();
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').bind(now),
    env.AUTH_DB.prepare('INSERT OR IGNORE INTO users (id, created_at) VALUES (?, ?)').bind(userId, now),
    env.AUTH_DB.prepare('INSERT OR IGNORE INTO auth_identities (app_id, open_id, user_id) VALUES (?, ?, ?)')
      .bind(config.appId, identity.openid, userId),
    env.AUTH_DB.prepare(
      'INSERT INTO auth_sessions (token_hash, user_id, expires_at) SELECT ?, user_id, ? FROM auth_identities WHERE app_id = ? AND open_id = ?'
    ).bind(await hash(token), now + SESSION_SECONDS * 1000, config.appId, identity.openid),
    env.AUTH_DB.prepare(
      'DELETE FROM users WHERE id = ? AND NOT EXISTS (SELECT 1 FROM auth_identities WHERE user_id = ?)'
    ).bind(userId, userId)
  ]);
  return callbackResult(env, 'success', [cookie(SESSION_COOKIE, token, SESSION_SECONDS)]);
}
