import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { handleAuth } from '../worker/auth.mjs';
import worker from '../worker/index.mjs';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(fs.readFileSync(new URL('../migrations/0001_auth.sql', import.meta.url), 'utf8'));
const db = {
  prepare(sql) {
    return {
      values: [],
      bind(...values) { this.values = values; return this; },
      async first() { return sqlite.prepare(sql).get(...this.values) || null; },
      async run() { return sqlite.prepare(sql).run(...this.values); }
    };
  },
  async batch(statements) {
    sqlite.exec('BEGIN');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      sqlite.exec('COMMIT');
      return results;
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw error;
    }
  }
};
const origin = 'https://game.example';
const env = { AUTH_DB: db, AUTH_ORIGIN: origin, WECHAT_WEBSITE_APP_ID: 'website-test', WECHAT_WEBSITE_APP_SECRET: 'test-only',
  WECHAT_SERVICE_APP_ID: 'service-test', WECHAT_SERVICE_APP_SECRET: 'test-only' };
const request = (pathname, options) => new Request(origin + pathname, options);
const realFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async url => {
  calls++;
  assert.equal(new URL(url).hostname, 'api.weixin.qq.com');
  return Response.json({ openid: 'verified-openid', access_token: 'provider-token' });
};
try {
  let response = await handleAuth(request('/api/auth/session'), {});
  assert.deepEqual(await response.json(), { user: null, providers: { website: false, wechat: false }, cloudSaves: false });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await handleAuth(request('/api/auth/wechat/start?mode=website'), {})).status, 503);
  assert.equal((await handleAuth(request('/api/auth/wechat/start?mode=bogus'), env)).status, 400);
  assert.equal((await handleAuth(request('/api/auth/wechat/start?mode=wechat'), env)).status, 400);
  assert.equal((await handleAuth(request('/api/auth/wechat/start?mode=website', { headers: { 'sec-fetch-site': 'cross-site' } }), env)).status, 403);
  assert.equal((await handleAuth(new Request('https://other.example/api/auth/session'), env)).status, 503);
  assert.equal((await handleAuth(request('/api/auth/logout'), env)).status, 405);

  async function begin(mode = 'website') {
    const response = await handleAuth(request(`/api/auth/wechat/start?mode=${mode}`, { headers: { 'user-agent': 'MicroMessenger' } }), env);
    assert.equal(response.status, 302);
    const target = new URL(response.headers.get('location'));
    assert.equal(target.searchParams.get('scope'), mode === 'website' ? 'snsapi_login' : 'snsapi_base');
    assert.equal(target.searchParams.get('redirect_uri'), origin + '/api/auth/wechat/callback');
    const cookie = response.headers.get('set-cookie').split(';')[0];
    assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
    return { state: target.searchParams.get('state'), cookie };
  }
  const flow = await begin();
  response = await handleAuth(request('/api/auth/wechat/callback?state=forged&code=code', { headers: { cookie: flow.cookie } }), env);
  assert.match(response.headers.get('location'), /auth=invalid_state/);
  assert.equal(calls, 0);
  response = await handleAuth(request(`/api/auth/wechat/callback?state=${flow.state}`, { headers: { cookie: flow.cookie } }), env);
  assert.match(response.headers.get('location'), /auth=cancelled/);
  const expiredCookie = flow.cookie.replace(/\.\d+\./, `.${Date.now() - 301000}.`);
  response = await handleAuth(request(`/api/auth/wechat/callback?state=${flow.state}&code=code`, { headers: { cookie: expiredCookie } }), env);
  assert.match(response.headers.get('location'), /auth=invalid_state/);

  async function complete(flow) {
    const response = await handleAuth(request(`/api/auth/wechat/callback?state=${flow.state}&code=valid`, { headers: { cookie: flow.cookie } }), env);
    assert.match(response.headers.get('location'), /auth=success/);
    const sessionCookie = response.headers.getSetCookie().find(value => value.startsWith('__Host-zhaolie-session='));
    assert.ok(sessionCookie);
    return sessionCookie.split(';')[0];
  }
  const session = await complete(flow);
  let data = await (await handleAuth(request('/api/auth/session', { headers: { cookie: session } }), env)).json();
  assert.ok(data.user.id);
  const originalId = data.user.id;
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1);
  const stored = sqlite.prepare('SELECT token_hash FROM auth_sessions').get().token_hash;
  assert.notEqual(stored, session.split('=')[1]);
  const secondSession = await complete(await begin());
  data = await (await handleAuth(request('/api/auth/session', { headers: { cookie: secondSession } }), env)).json();
  assert.equal(data.user.id, originalId);
  const serviceSession = await complete(await begin('wechat'));
  data = await (await handleAuth(request('/api/auth/session', { headers: { cookie: serviceSession } }), env)).json();
  assert.notEqual(data.user.id, originalId, 'OpenID must not merge across different AppIDs');
  assert.equal((await handleAuth(request('/api/auth/logout', { method: 'POST', headers: { origin: 'https://evil.example', cookie: session } }), env)).status, 403);
  assert.equal((await handleAuth(request('/api/auth/logout', { method: 'POST', headers: { origin, cookie: session } }), env)).status, 200);
  data = await (await handleAuth(request('/api/auth/session', { headers: { cookie: session } }), env)).json();
  assert.equal(data.user, null);
  sqlite.exec('UPDATE auth_sessions SET expires_at = 0');
  data = await (await handleAuth(request('/api/auth/session', { headers: { cookie: secondSession } }), env)).json();
  assert.equal(data.user, null);

  globalThis.fetch = async () => Response.json({ errcode: 40029, errmsg: 'invalid code' });
  const denied = await begin();
  response = await handleAuth(request(`/api/auth/wechat/callback?state=${denied.state}&code=bad`, { headers: { cookie: denied.cookie } }), env);
  assert.match(response.headers.get('location'), /auth=provider_failed/);
  const assetEnv = { ASSETS: { fetch: async () => new Response('static asset') } };
  assert.equal(await (await worker.fetch(request('/game.js'), assetEnv)).text(), 'static asset');
  assert.equal((await worker.fetch(request('/api/unknown'), assetEnv)).status, 404);
  const broken = { ...env, AUTH_DB: { prepare() { throw new Error('database unavailable'); } } };
  response = await worker.fetch(request('/api/auth/session', { headers: { cookie: secondSession } }), broken);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /游客试玩不受影响/);
  console.log('WeChat login checks passed: guest, configuration, OAuth state/expiry, verified identities, session hashing/expiry, logout, provider failure and asset routing.');
  async function clientScenario(response, userAgent = 'desktop') {
    const elements = Object.fromEntries(['wechatLoginBtn', 'wechatLogoutBtn', 'accountStatus'].map(id => [id, {
      hidden: id === 'wechatLogoutBtn', disabled: id === 'wechatLoginBtn', textContent: '',
      handlers: {}, addEventListener(name, handler) { this.handlers[name] = handler; }
    }]));
    const context = { document: { getElementById: id => elements[id] }, navigator: { userAgent },
      location: { href: origin, assign(value) { this.assigned = value; } }, history: { replaceState() {} },
      sessionStorage: { removeItem() {} }, URL, AbortSignal, fetch: async () => response.clone(),
      addEventListener() {} };
    context.window=context;
    vm.runInNewContext(fs.readFileSync(new URL('../auth.js', import.meta.url), 'utf8'), context);
    await new Promise(resolve => setImmediate(resolve));
    return { elements, context };
  }
  let client = await clientScenario(Response.json({ user: null, providers: { website: false, wechat: false } }));
  assert.equal(client.elements.wechatLoginBtn.disabled, true);
  assert.match(client.elements.accountStatus.textContent, /微信登录尚未配置/);
  client = await clientScenario(Response.json({ user: null, providers: { website: true, wechat: false } }));
  assert.equal(client.elements.wechatLoginBtn.disabled, false);
  client.elements.wechatLoginBtn.handlers.click({ stopPropagation() {} });
  assert.equal(client.context.location.assigned, '/api/auth/wechat/start?mode=website');
  client = await clientScenario(Response.json({ user: null, providers: { website: false, wechat: true } }), 'MicroMessenger');
  client.elements.wechatLoginBtn.handlers.click({ stopPropagation() {} });
  assert.equal(client.context.location.assigned, '/api/auth/wechat/start?mode=wechat');
  client = await clientScenario(Response.json({ user: { id: 'user' }, providers: { website: true, wechat: true } }));
  assert.equal(client.elements.wechatLoginBtn.hidden, true);
  assert.equal(client.elements.wechatLogoutBtn.hidden, false);
  assert.match(client.elements.accountStatus.textContent, /当前选择游客存档/);
  client = await clientScenario(new Response('static preview', { headers: { 'content-type': 'text/html' } }));
  assert.equal(client.elements.wechatLoginBtn.disabled, true);
  assert.match(client.elements.accountStatus.textContent, /可直接游客试玩/);
  console.log('Login client checks passed: unconfigured, desktop/WeChat navigation, signed-in status and static preview fallback.');
} finally {
  globalThis.fetch = realFetch;
  sqlite.close();
}
