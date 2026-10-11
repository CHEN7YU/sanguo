const SESSION_COOKIE = '__Host-zhaolie-session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');

function cookie(value, seconds = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
}

function sessionToken(request) {
  return request.headers.get('cookie')?.split(';').map(value => value.trim())
    .find(value => value.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) || '';
}

function json(data, status = 200, extra = {}) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store', ...extra } });
}

async function hash(value) {
  return hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function keyedHash(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, encoder.encode(value));
}

async function passwordHash(secret, username, password, salt) {
  const material = await keyedHash(secret, `password:${username}:${password}`);
  const key = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256',
    salt: encoder.encode(salt), iterations: 100000 }, key, 256));
}

function equalHash(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

function configured(env) {
  return !!(env.AUTH_DB && env.AUTH_ORIGIN && typeof env.AUTH_PASSWORD_PEPPER === 'string'
    && env.AUTH_PASSWORD_PEPPER.length >= 32);
}

export async function sessionUser(request, env) {
  const token = sessionToken(request);
  if (!env.AUTH_DB || !/^[a-f0-9]{64}$/.test(token)) return null;
  return env.AUTH_DB.prepare(
    `SELECT users.id, password_credentials.display_name AS username
     FROM auth_sessions JOIN users ON users.id = auth_sessions.user_id
     LEFT JOIN password_credentials ON password_credentials.user_id = users.id
     WHERE token_hash = ? AND expires_at > ?`
  ).bind(await hash(token), Date.now()).first();
}

async function consumeLimit(env, bucket, limit, windowMs) {
  const now = Date.now();
  const key = hex(await keyedHash(env.AUTH_PASSWORD_PEPPER, `limit:${bucket}`));
  const result = await env.AUTH_DB.prepare(
    `INSERT INTO auth_attempts (bucket, attempts, expires_at) VALUES (?, 1, ?)
     ON CONFLICT(bucket) DO UPDATE SET
       attempts = CASE WHEN auth_attempts.expires_at <= ? THEN 1 ELSE auth_attempts.attempts + 1 END,
       expires_at = CASE WHEN auth_attempts.expires_at <= ? THEN excluded.expires_at ELSE auth_attempts.expires_at END
     RETURNING attempts, expires_at`
  ).bind(key, now + windowMs, now, now).first();
  return result.attempts > limit ? Math.max(1, Math.ceil((result.expires_at - now) / 1000)) : 0;
}

async function credentialsBody(request) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return { error: '登录请求需要JSON数据', status: 415 };
  }
  if (Number(request.headers.get('content-length')) > 1024) return { error: '登录请求过大', status: 413 };
  const reader = request.body?.getReader();
  if (!reader) return { error: '请输入用户名和密码', status: 400 };
  const chunks = [];
  let size = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 1024) { await reader.cancel(); return { error: '登录请求过大', status: 413 }; }
    chunks.push(part.value);
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof body?.username !== 'string' || !/^[A-Za-z0-9_\u3400-\u9fff]{2,20}$/.test(body.username.trim())) {
      return { error: '用户名需为2—20个中文、英文字母、数字或下划线', status: 400 };
    }
    if (typeof body.password !== 'string' || !/^[0-9]{4}$/.test(body.password)) {
      return { error: '密码必须恰好为4位数字，可包含开头的0', status: 400 };
    }
    return { displayName: body.username.trim(), username: body.username.trim().toLowerCase(), password: body.password };
  } catch {
    return { error: '登录数据格式错误', status: 400 };
  }
}

async function createSession(request, env, userId) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await hash(token);
  const now = Date.now();
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare('DELETE FROM auth_sessions WHERE expires_at <= ? OR token_hash = ?').bind(now, await hash(sessionToken(request))),
    env.AUTH_DB.prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(tokenHash, userId, now + SESSION_SECONDS * 1000),
    env.AUTH_DB.prepare(
      `DELETE FROM auth_sessions WHERE user_id = ? AND token_hash <> ? AND token_hash NOT IN (
         SELECT token_hash FROM auth_sessions WHERE user_id = ? AND token_hash <> ? ORDER BY expires_at DESC, token_hash LIMIT 4
       )`
    ).bind(userId, tokenHash, userId, tokenHash)
  ]);
  return cookie(token);
}

export async function handleAuth(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!['/api/auth/session', '/api/auth/register', '/api/auth/login', '/api/auth/logout'].includes(path)) {
    return json({ error: '接口不存在' }, 404);
  }
  if (request.method !== (path === '/api/auth/session' ? 'GET' : 'POST')) return json({ error: '请求方法不支持' }, 405);
  if (env.AUTH_ORIGIN && (new URL(env.AUTH_ORIGIN).origin !== url.origin || url.protocol !== 'https:')) {
    return json({ error: '登录服务域名配置不匹配' }, 503);
  }
  if (path === '/api/auth/session') {
    return json({ user: await sessionUser(request, env), providers: { password: configured(env) }, cloudSaves: !!env.AUTH_DB });
  }
  if (request.headers.get('origin') !== url.origin) return json({ error: '请求来源无效' }, 403);
  if (path === '/api/auth/logout') {
    const token = sessionToken(request);
    if (env.AUTH_DB && /^[a-f0-9]{64}$/.test(token)) {
      await env.AUTH_DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await hash(token)).run();
    }
    return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) });
  }
  if (!configured(env)) return json({ error: '账号服务尚未配置，游客可直接试玩' }, 503);
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip) return json({ error: '无法验证请求来源，请从游戏站点登录' }, 503);
  const register = path === '/api/auth/register';
  const ipRetry = await consumeLimit(env, `${register ? 'register' : 'login'}:ip:${ip}`, register ? 5 : 20,
    register ? 3600000 : 900000);
  if (ipRetry) return json({ error: '操作过于频繁，请稍后再试', retryAfter: ipRetry }, 429, { 'retry-after': String(ipRetry) });
  const body = await credentialsBody(request);
  if (body.error) return json({ error: body.error }, body.status);
  const userRetry = await consumeLimit(env, `username:${body.username}`, 5, 900000);
  if (userRetry) return json({ error: '此用户名尝试过于频繁，请15分钟后再试', retryAfter: userRetry },
    429, { 'retry-after': String(userRetry) });
  await env.AUTH_DB.prepare(
    'DELETE FROM auth_attempts WHERE bucket IN (SELECT bucket FROM auth_attempts WHERE expires_at <= ? LIMIT 100)'
  ).bind(Date.now()).run();

  let user;
  if (register) {
    const id = crypto.randomUUID();
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const digest = await passwordHash(env.AUTH_PASSWORD_PEPPER, body.username, body.password, salt);
    await env.AUTH_DB.batch([
      env.AUTH_DB.prepare('INSERT INTO users (id, created_at) VALUES (?, ?)').bind(id, Date.now()),
      env.AUTH_DB.prepare(
        'INSERT OR IGNORE INTO password_credentials (username, display_name, user_id, salt, password_hash) VALUES (?, ?, ?, ?, ?)'
      ).bind(body.username, body.displayName, id, salt, digest),
      env.AUTH_DB.prepare('DELETE FROM users WHERE id = ? AND NOT EXISTS (SELECT 1 FROM password_credentials WHERE user_id = ?)')
        .bind(id, id)
    ]);
    const registered = await env.AUTH_DB.prepare('SELECT user_id FROM password_credentials WHERE username = ?')
      .bind(body.username).first();
    if (registered?.user_id !== id) return json({ error: '此用户名已注册，请登录或换一个名字' }, 409);
    user = { id, username: body.displayName };
  } else {
    const saved = await env.AUTH_DB.prepare('SELECT user_id, display_name, salt, password_hash FROM password_credentials WHERE username = ?')
      .bind(body.username).first();
    // Unknown names perform the same derivation, without revealing whether an account exists.
    const digest = await passwordHash(env.AUTH_PASSWORD_PEPPER, body.username, body.password, saved?.salt || '0'.repeat(32));
    if (!saved || !equalHash(digest, saved.password_hash)) return json({ error: '用户名或密码不正确' }, 401);
    user = { id: saved.user_id, username: saved.display_name };
  }
  return json({ user }, register ? 201 : 200, { 'set-cookie': await createSession(request, env, user.id) });
}
