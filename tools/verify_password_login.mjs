import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import worker from '../worker/index.mjs';

const sqlite = new DatabaseSync(':memory:');
for (const name of ['0001_auth.sql', '0002_cloud_saves.sql', '0003_password_login.sql']) {
  sqlite.exec(fs.readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8'));
}
const db = {
  prepare(sql) {
    return { values: [], bind(...values) { this.values = values; return this; },
      async first() { return sqlite.prepare(sql).get(...this.values) || null; },
      async run() { return sqlite.prepare(sql).run(...this.values); },
      async all() { return { results: sqlite.prepare(sql).all(...this.values) }; } };
  },
  async batch(statements) {
    sqlite.exec('BEGIN');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      sqlite.exec('COMMIT');
      return results;
    } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  }
};
const origin = 'https://game.example';
const env = { AUTH_DB: db, AUTH_ORIGIN: origin, AUTH_PASSWORD_PEPPER: 'test-only-not-a-production-secret'.repeat(2) };
let ip = 1;
function request(path, { method = path === '/api/auth/session' ? 'GET' : 'POST', body, headers = {} } = {}) {
  return new Request(origin + path, { method, headers: { origin, 'content-type': 'application/json',
    'cf-connecting-ip': `192.0.2.${ip}`, ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
const call = (path, options, bindings = env) => worker.fetch(request(path, options), bindings);
const sign = (username, password, register = false, headers = {}) =>
  call(`/api/auth/${register ? 'register' : 'login'}`, { body: { username, password }, headers });
const cookie = response => response.headers.get('set-cookie')?.split(';')[0];
function resetLimits() { sqlite.exec('DELETE FROM auth_attempts'); ip++; }

try {
  let response = await call('/api/auth/session', {}, {});
  assert.deepEqual(await response.json(), { user: null, providers: { password: false }, cloudSaves: false });
  assert.equal((await call('/api/auth/register', { body: { username: 'alice', password: '0123' } }, {})).status, 503);
  assert.equal((await call('/api/auth/wechat/start', { method: 'GET' })).status, 404);
  assert.equal((await call('/api/auth/login', { method: 'GET' })).status, 405);
  assert.equal((await sign('alice', '0123', true, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await sign('alice', '0123', true, { 'cf-connecting-ip': '' })).status, 503);
  assert.equal((await sign('alice', '0123', true, { 'content-type': 'application/json-invalid' })).status, 415);
  for (const password of ['123', '12345', '１２３４', '12a4', ' 1234', 1234, null]) {
    resetLimits();
    assert.equal((await sign('alice', password, true)).status, 400);
  }
  for (const username of ['a', 'x'.repeat(21), 'a b', 'alice!', '', null]) {
    resetLimits();
    assert.equal((await sign(username, '0123', true)).status, 400);
  }
  resetLimits();
  response = await sign('Alice', '0123', true);
  assert.equal(response.status, 201);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax; Max-Age=604800/);
  const aliceCookie = cookie(response);
  const alice = (await response.json()).user;
  assert.ok(alice.id);
  assert.equal(alice.username, 'Alice');
  assert.equal((await (await call('/api/auth/session', { headers: { cookie: aliceCookie } })).json()).user.id, alice.id);
  const credential = sqlite.prepare('SELECT * FROM password_credentials WHERE username = ?').get('alice');
  assert.match(credential.password_hash, /^[a-f0-9]{64}$/);
  assert.match(credential.salt, /^[a-f0-9]{32}$/);
  assert.notEqual(credential.password_hash, '0123');
  assert.notEqual(sqlite.prepare('SELECT token_hash FROM auth_sessions').get().token_hash, aliceCookie.split('=')[1]);
  assert.equal((await sign('alice', '9999', true)).status, 409);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1, 'duplicate registration must not leave an orphan user');
  response = await sign(' ALICE ', '0123');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.id, alice.id, 'case and trimmed whitespace must resolve the existing save owner');
  let loginCookie = cookie(response);
  resetLimits();
  for (let i = 0; i < 5; i++) {
    const result = await sign('alice', '0123');
    assert.equal(result.status, 200);
    loginCookie = cookie(result);
  }
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM auth_sessions WHERE user_id = ?').get(alice.id).n, 5,
    'successful login must bound sessions rather than accumulating rows indefinitely');
  resetLimits();
  assert.equal((await sign('alice', '9999')).status, 401);
  const wrongMessage = await (await sign('alice', '9998')).json();
  const unknownMessage = await (await sign('unknown', '9998')).json();
  assert.equal(wrongMessage.error, unknownMessage.error);
  assert.equal((await (await call('/api/auth/session', { headers: { cookie: loginCookie } })).json()).user.id, alice.id);
  resetLimits();
  response = await sign('刘备_2', '0000', true);
  assert.equal(response.status, 201);
  const bobCookie = cookie(response);
  const bob = (await response.json()).user;
  assert.notEqual(bob.id, alice.id);
  resetLimits();
  response = await sign('samepin', '0123', true);
  assert.equal(response.status, 201);
  const secondCredential = sqlite.prepare('SELECT salt, password_hash FROM password_credentials WHERE username = ?').get('samepin');
  assert.notEqual(secondCredential.salt, credential.salt);
  assert.notEqual(secondCredential.password_hash, credential.password_hash);
  resetLimits();
  for (let i = 0; i < 5; i++) { ip++; assert.equal((await sign('alice', '8888')).status, 401); }
  ip++;
  response = await sign('alice', '0123');
  assert.equal(response.status, 429, 'per-account limit must hold across source IPs');
  assert.ok(Number(response.headers.get('retry-after')) > 0);
  assert.equal(response.headers.get('set-cookie'), null);
  sqlite.exec('UPDATE auth_attempts SET expires_at = 0');
  assert.equal((await sign('alice', '0123')).status, 200, 'limit expires and successful login works again');
  resetLimits();
  for (let i = 0; i < 20; i++) assert.equal((await sign(`unknown${i}`, '0123')).status, 401);
  assert.equal((await sign('alice', '0123')).status, 429, 'per-IP limit must hold across usernames');
  resetLimits();
  for (let i = 0; i < 5; i++) assert.equal((await sign(`registered${i}`, '0000', true)).status, 201);
  assert.equal((await sign('registered6', '0000', true)).status, 429, 'registration needs a separate quota');
  resetLimits();
  const parallel = await Promise.all(Array.from({ length: 6 }, () => { ip++; return sign('alice', '9999'); }));
  assert.equal(parallel.filter(result => result.status === 429).length, 1, 'atomic limiter must reject the sixth concurrent attempt');
  resetLimits();
  const racers = await Promise.all([sign('race', '1111', true), sign('RACE', '2222', true)]);
  assert.deepEqual(racers.map(result => result.status).sort(), [201, 409]);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM password_credentials WHERE username = ?').get('race').n, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM users WHERE NOT EXISTS (SELECT 1 FROM password_credentials WHERE user_id = users.id)').get().n, 0);
  resetLimits();
  assert.equal((await call('/api/auth/login', { body: { username: 'alice', password: '0123' } },
    { ...env, AUTH_PASSWORD_PEPPER: 'different-server-secret'.repeat(3) })).status, 401);
  resetLimits();
  response = await sign('alice', '0123', false, { cookie: loginCookie });
  assert.equal(response.status, 200);
  const rotatedCookie = cookie(response);
  assert.notEqual(rotatedCookie, loginCookie);
  assert.equal((await (await call('/api/auth/session', { headers: { cookie: loginCookie } })).json()).user, null);
  const cloud = { saveStore: { schema: 1, auto: { schema: 1, levelId: 'sishui-pass', savedAt: Date.now(),
    phaseType: 'prep', gold: 800 }, manual: Array(6).fill(null) }, campaignTransfer: null };
  response = await call('/api/saves', { method: 'PUT', headers: { cookie: rotatedCookie, 'x-save-owner': alice.id },
    body: { payload: cloud, baseRevision: 0, requestId: crypto.randomUUID() } });
  assert.equal(response.status, 200);
  response = await call('/api/saves', { method: 'GET', headers: { cookie: rotatedCookie, 'x-save-owner': alice.id } });
  assert.equal((await response.json()).payload.saveStore.auto.gold, 800);
  response = await call('/api/saves', { method: 'GET', headers: { cookie: bobCookie, 'x-save-owner': bob.id } });
  assert.equal((await response.json()).payload, null, 'another registered account cannot read Alice progress');
  assert.equal((await call('/api/auth/logout', { headers: { cookie: rotatedCookie, origin: 'https://evil.example' } })).status, 403);
  response = await call('/api/auth/logout', { headers: { cookie: rotatedCookie } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await (await call('/api/auth/session', { headers: { cookie: rotatedCookie } })).json()).user, null);
  sqlite.exec('UPDATE auth_sessions SET expires_at = 0');
  assert.equal((await (await call('/api/auth/session', { headers: { cookie: aliceCookie } })).json()).user, null);
  const oversized = new Request(origin + '/api/auth/register', { method: 'POST',
    headers: { origin, 'cf-connecting-ip': '192.0.2.254', 'content-type': 'application/json' }, body: 'x'.repeat(1025) });
  assert.equal((await worker.fetch(oversized, env)).status, 413);
  console.log('Password API passed: exact 4 ASCII digits/leading zero, names, salted+peppered hashes, real sessions/cloud saves, CSRF, duplicate/concurrent registration, per-IP/account limits, expiry, rotation and logout.');

  async function client(sessionResponse) {
    const ids = ['accountLoginBtn', 'accountLogoutBtn', 'accountStatus', 'accountDialog', 'accountForm',
      'accountUsername', 'accountPassword', 'accountNotice', 'accountSubmitBtn', 'accountToggleBtn',
      'accountCloseBtn', 'accountDialogTitle'];
    const elements = Object.fromEntries(ids.map(id => [id, { textContent: '', hidden: false, disabled: false, value: '',
      handlers: {}, addEventListener(event, handler) { this.handlers[event] = handler; }, focus() { this.focused = true; },
      showModal() { this.open = true; }, close() { this.open = false; } }]));
    const calls = [];
    let post = Response.json({ user: { id: 'new-account', username: '刘备' } });
    const state = { document: { getElementById: id => elements[id] },
      location: { pathname: '/', assign(url) { this.assigned = url; } },
      sessionStorage: { removed: [], removeItem(key) { this.removed.push(key); } },
      localStorage: { removed: [], removeItem(key) { this.removed.push(key); } },
      AbortSignal, events: {}, addEventListener(name, handler) { this.events[name] = handler; },
      fetch: async (url, options = {}) => { calls.push({ url, ...options }); return (options.method === 'POST' ? post : sessionResponse).clone(); } };
    state.window = state;
    vm.runInNewContext(fs.readFileSync(new URL('../auth.js', import.meta.url), 'utf8'), state);
    await new Promise(resolve => setImmediate(resolve));
    return { elements, state, calls, setPost(response) { post = response; } };
  }
  const guest = Response.json({ user: null, providers: { password: true } });
  let c = await client(guest);
  assert.equal(c.elements.accountLoginBtn.disabled, false);
  c.elements.accountLoginBtn.handlers.click({ stopPropagation() {} });
  assert.equal(c.elements.accountDialog.open, true);
  assert.equal(c.elements.accountUsername.focused, true);
  c.elements.accountUsername.value = '刘备';
  c.elements.accountPassword.value = '12345';
  await c.elements.accountForm.handlers.submit({ preventDefault() {} });
  assert.equal(c.calls.length, 1, 'invalid password must not reach the server');
  assert.match(c.elements.accountNotice.textContent, /4位数字/);
  c.elements.accountToggleBtn.handlers.click();
  assert.equal(c.elements.accountPassword.autocomplete, 'new-password');
  c.elements.accountPassword.value = '0123';
  await c.elements.accountForm.handlers.submit({ preventDefault() {} });
  assert.equal(c.calls[1].url, '/api/auth/register');
  assert.equal(JSON.parse(c.calls[1].body).password, '0123');
  assert.equal(c.state.location.assigned, '/');
  assert.equal(c.elements.accountPassword.value, '');
  assert.deepEqual(c.state.localStorage.removed, [], 'login must not migrate or clear guest/account saves');
  c = await client(guest);
  c.elements.accountUsername.value = 'Alice'; c.elements.accountPassword.value = '0123';
  c.setPost(Response.json({ error: '用户名或密码不正确' }, { status: 401 }));
  await c.elements.accountForm.handlers.submit({ preventDefault() {} });
  assert.equal(c.state.location.assigned, undefined);
  assert.equal(c.elements.accountPassword.value, '');
  assert.equal(c.elements.accountSubmitBtn.disabled, false);
  assert.match(c.elements.accountNotice.textContent, /不正确/);
  c = await client(Response.json({ user: null, providers: { password: false } }));
  assert.equal(c.elements.accountLoginBtn.disabled, true);
  assert.match(c.elements.accountStatus.textContent, /尚未配置/);
  c = await client(new Response('static preview'));
  assert.equal(c.elements.accountLoginBtn.disabled, true);
  assert.match(c.elements.accountStatus.textContent, /游客试玩/);
  c = await client(Response.json({ user: { id: 'alice', username: 'Alice' }, providers: { password: true } }));
  assert.equal(c.elements.accountLoginBtn.textContent, '切换账号');
  assert.equal(c.elements.accountLogoutBtn.hidden, false);
  await c.elements.accountLogoutBtn.handlers.click({ stopPropagation() {} });
  assert.equal(c.state.location.assigned, '/');
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /type="password" inputmode="numeric"/);
  assert.match(html, /pattern="\[0-9\]\{4\}"/);
  assert.doesNotMatch(html, /wechatLoginBtn|微信登录/);
  console.log('Password client passed: guest, dialog/modes, numeric validation, leading zero, register/login errors, safe reload/switch, no password persistence and logout.');
} finally {
  sqlite.close();
}
