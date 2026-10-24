import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import worker from '../worker/index.mjs';
import { analyticsStatement, chinaDay, deviceCategory } from '../worker/analytics.mjs';

const sqlite = new DatabaseSync(':memory:');
for (const file of fs.readdirSync(new URL('../migrations/', import.meta.url)).filter(file => file.endsWith('.sql')).sort()) {
  sqlite.exec(fs.readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
}
let failAnalytics = false;
const db = {
  prepare(sql) {
    return { values: [], bind(...values) { this.values = values; return this; },
      async first() { return sqlite.prepare(sql).get(...this.values) || null; },
      async all() { return { results: sqlite.prepare(sql).all(...this.values) }; },
      async run() {
        if (failAnalytics && sql.includes('INTO analytics_events')) throw new Error('test-only analytics storage failure');
        return sqlite.prepare(sql).run(...this.values);
      } };
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
const env = { AUTH_DB: db, AUTH_ORIGIN: origin, AUTH_PASSWORD_PEPPER: 'test-only-analytics-secret'.repeat(3), ANALYTICS_ENABLED: 'true' };
const desktop = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const phone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile';
const tablet = 'Mozilla/5.0 (Linux; Android 14; Tablet) AppleWebKit';
const browser = crypto.randomUUID();
const originalNow = Date.now;
let now = Date.parse('2026-10-18T15:59:59Z');
Date.now = () => now;
const request = (path, { method = 'POST', body, headers = {} } = {}) => new Request(origin + path, {
  method, headers: { origin, 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.12', 'user-agent': desktop, ...headers },
  ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) })
});
const call = (path, options, bindings = env) => worker.fetch(request(path, options), bindings);
const visit = (visitorId = browser, visitId = crypto.randomUUID(), headers = {}) =>
  call('/api/analytics/visit', { body: { visitorId, visitId }, headers });
const play = (visitorId = browser, playId = crypto.randomUUID(), eventId = crypto.randomUUID(), seconds = 30, headers = {}) =>
  call('/api/analytics/playtime', { body: { visitorId, playId, eventId, seconds }, headers });
const daily = (day = chinaDay(), device = 'all') =>
  sqlite.prepare('SELECT page_views, visitors, logins, login_users FROM analytics_daily WHERE day = ? AND device = ?').get(day, device);
const playDaily = (day = chinaDay(), device = 'all') =>
  sqlite.prepare('SELECT players, play_sessions, play_seconds FROM analytics_daily WHERE day = ? AND device = ?').get(day, device);
const resetLimits = () => sqlite.exec('DELETE FROM auth_attempts');

try {
  assert.equal(chinaDay(), '2026-10-18');
  assert.equal(chinaDay(now + 1000), '2026-10-19', 'statistics days must roll at China midnight, not UTC midnight');
  for (const [agent, category] of [[desktop, 'desktop'], [phone, 'mobile'], [tablet, 'tablet'],
    ['Mozilla/5.0 (iPad; CPU OS 18_0)', 'tablet'], ['Mozilla/5.0 (Linux; Android 14) Mobile', 'mobile'], ['', 'other']]) {
    assert.equal(deviceCategory(request('/', { headers: { 'user-agent': agent } })), category);
  }
  assert.equal((await call('/api/analytics/visit', { body: {} }, { ...env, ANALYTICS_ENABLED: 'false' })).status, 404);
  assert.equal((await call('/api/analytics/playtime', { body: {} }, { ...env, ANALYTICS_ENABLED: 'false' })).status, 404);
  assert.equal((await call('/api/analytics/visit', { body: {} }, { ...env, AUTH_PASSWORD_PEPPER: undefined })).status, 503);
  assert.equal((await call('/api/analytics/visit', { method: 'GET' })).status, 405);
  assert.equal((await visit(browser, crypto.randomUUID(), { origin: 'https://evil.example' })).status, 403);
  assert.equal((await visit(browser, crypto.randomUUID(), { 'cf-connecting-ip': '' })).status, 503);
  assert.equal((await visit(browser, crypto.randomUUID(), { 'content-type': 'text/plain' })).status, 415);
  for (const body of [null, [], {}, '{bad', { visitorId: browser, visitId: 'bad' },
    { visitorId: browser, visitId: crypto.randomUUID(), username: 'must-not-collect' }]) {
    assert.equal((await call('/api/analytics/visit', { body })).status, 400);
  }
  assert.equal((await call('/api/analytics/visit', { body: 'x'.repeat(513) })).status, 413);
  assert.equal((await call('/api/analytics/playtime', { body: 'x'.repeat(769) })).status, 413);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM analytics_daily').get().n, 0);
  const event = crypto.randomUUID();
  let response = await visit(browser, event);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal((await visit(browser, event)).status, 200);
  assert.deepEqual({ ...daily() }, { page_views: 1, visitors: 1, logins: 0, login_users: 0 },
    'lost-response retries must not inflate page views');
  assert.equal((await visit()).status, 200);
  assert.equal(daily().page_views, 2);
  assert.equal(daily().visitors, 1, 'refresh counts as another page view, not another daily visitor');
  assert.equal((await visit(crypto.randomUUID(), crypto.randomUUID(), { 'user-agent': phone })).status, 200);
  assert.equal((await visit(browser, crypto.randomUUID(), { 'user-agent': tablet })).status, 200);
  assert.equal(daily().visitors, 2, 'overall deduplication must not sum overlapping device visitor counts');
  assert.equal(daily(chinaDay(), 'tablet').visitors, 1);
  resetLimits();
  const concurrentId = crypto.randomUUID();
  const concurrent = await Promise.all(Array.from({ length: 10 }, () => visit(concurrentId)));
  assert.ok(concurrent.every(result => result.status === 200));
  assert.equal(daily().page_views, 14);
  assert.equal(daily().visitors, 3, 'concurrent events for one browser must increment unique count only once');
  const parallelRetry = crypto.randomUUID();
  await Promise.all(Array.from({ length: 5 }, () => visit(concurrentId, parallelRetry)));
  assert.equal(daily().page_views, 15);

  resetLimits();
  const playSession = crypto.randomUUID(), playEvent = crypto.randomUUID();
  response = await play(browser, playSession, playEvent, 30);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal((await play(browser, playSession, playEvent, 30)).status, 200);
  assert.deepEqual({ ...playDaily() }, { players: 1, play_sessions: 1, play_seconds: 30 },
    'lost-response retries must not inflate play time');
  assert.equal((await play(browser, playSession, crypto.randomUUID(), 15)).status, 200);
  assert.deepEqual({ ...playDaily() }, { players: 1, play_sessions: 1, play_seconds: 45 });
  const secondPlayer = crypto.randomUUID();
  assert.equal((await play(secondPlayer, crypto.randomUUID(), crypto.randomUUID(), 20, { 'user-agent': phone })).status, 200);
  assert.deepEqual({ ...playDaily() }, { players: 2, play_sessions: 2, play_seconds: 65 });
  assert.deepEqual({ ...playDaily(chinaDay(), 'mobile') }, { players: 1, play_sessions: 1, play_seconds: 20 });
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM analytics_players').get().n, 2);
  assert.equal(sqlite.prepare('SELECT SUM(play_seconds) AS n FROM analytics_players').get().n, 65);
  for (const body of [{ visitorId: browser, playId: playSession, eventId: crypto.randomUUID(), seconds: 0 },
    { visitorId: browser, playId: playSession, eventId: crypto.randomUUID(), seconds: 121 },
    { visitorId: browser, playId: playSession, eventId: crypto.randomUUID(), seconds: 1, extra: true }]) {
    assert.equal((await call('/api/analytics/playtime', { body })).status, 400);
  }
  now += 1000;
  resetLimits();
  assert.equal((await visit()).status, 200);
  assert.equal(daily().visitors, 1, 'one browser can be counted once on each China day');

  const sign = (password, register = false, headers = {}) => call(`/api/auth/${register ? 'register' : 'login'}`, {
    body: { username: 'metrics_test', password }, headers
  });
  response = await sign('0123', true);
  assert.equal(response.status, 201);
  const userId = (await response.json()).user.id;
  const sessionCookie = response.headers.get('set-cookie').split(';')[0];
  assert.equal(daily().logins, 1, 'registration automatically signs in and counts one successful login');
  const session = await call('/api/auth/session', { method: 'GET', headers: { cookie: sessionCookie } });
  assert.equal((await session.json()).analytics, true);
  assert.equal(daily().logins, 1, 'session refresh is not a new login');
  assert.equal((await sign('9999')).status, 401);
  assert.equal((await sign('0123', true)).status, 409);
  assert.equal(daily().logins, 1, 'failed login and duplicate registration are not successful logins');
  assert.equal((await sign('0123', false, { 'user-agent': phone })).status, 200);
  assert.equal(daily().logins, 2);
  assert.equal(daily().login_users, 1, 'multiple devices still count one daily login account overall');
  assert.equal(daily(chinaDay(), 'mobile').login_users, 1);
  const beforeSessions = sqlite.prepare('SELECT COUNT(*) AS n FROM auth_sessions').get().n;
  failAnalytics = true;
  const originalError = console.error;
  const errors = [];
  try {
    console.error = (...args) => errors.push(args.join(' '));
    response = await sign('0123');
  } finally { console.error = originalError; failAnalytics = false; }
  assert.equal(response.status, 503);
  assert.ok(errors.some(message => message.includes('analytics')));
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM auth_sessions').get().n, beforeSessions,
    'failed analytics transaction must not create an uncounted successful login session');
  assert.equal(daily().logins, 2);

  const analyticsRows = JSON.stringify(['analytics_events', 'analytics_seen', 'analytics_daily', 'analytics_play_events',
    'analytics_play_seen', 'analytics_players', 'analytics_play_sessions', 'auth_attempts']
    .flatMap(table => sqlite.prepare(`SELECT * FROM ${table}`).all()));
  for (const privateValue of [browser, concurrentId, userId, desktop, phone, '192.0.2.12']) {
    assert.ok(!analyticsRows.includes(privateValue), 'counters must not retain raw browser/account IDs, IP or complete user agents');
  }
  for (const path of ['/api/analytics', '/api/analytics/report', '/api/analytics/stats']) {
    assert.equal((await call(path, { method: 'GET', headers: { cookie: sessionCookie } })).status, 404,
      'ordinary users must not have a public statistics read endpoint');
  }
  const beforeRateLimit = daily().page_views;
  resetLimits();
  const limitedBrowser = crypto.randomUUID();
  for (let i = 0; i < 30; i++) assert.equal((await visit(limitedBrowser)).status, 200);
  response = await visit(limitedBrowser);
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
  assert.equal(daily().page_views, beforeRateLimit + 30);
  resetLimits();
  for (let i = 0; i < 120; i++) assert.equal((await visit(crypto.randomUUID())).status, 200);
  assert.equal((await visit(crypto.randomUUID())).status, 429, 'rotating browser IDs must not bypass IP quota');

  const oldNow = now - 12 * 86400000;
  await (await analyticsStatement(request('/'), env, 'visit', crypto.randomUUID(), crypto.randomUUID(), oldNow)).run();
  const oldDay = chinaDay(oldNow);
  const oldPlayVisitor = crypto.randomUUID(), oldPlayId = crypto.randomUUID(), oldPlayEvent = crypto.randomUUID();
  const currentNow = now;
  now = oldNow;
  assert.equal((await play(oldPlayVisitor, oldPlayId, oldPlayEvent, 12)).status, 200);
  now = currentNow;
  assert.equal(daily(oldDay).page_views, 1);
  await worker.scheduled({}, env);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM analytics_events WHERE day = ?').get(oldDay).n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM analytics_seen WHERE day = ?').get(oldDay).n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM analytics_play_events WHERE day = ?').get(oldDay).n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM analytics_play_seen WHERE day = ?').get(oldDay).n, 0);
  assert.equal(daily(oldDay).page_views, 1, 'retention purge must preserve long-term aggregates');
  assert.equal(playDaily(oldDay).play_seconds, 12, 'retention purge must preserve play-time aggregates');
  assert.equal(sqlite.prepare('SELECT play_seconds FROM analytics_players WHERE player_hash IS NOT NULL ORDER BY play_seconds LIMIT 1').get().play_seconds, 12,
    'lifetime player totals must survive detailed-event cleanup');
  const report = fs.readFileSync(new URL('./analytics-report.sql', import.meta.url), 'utf8');
  const queries = report.split(';').map(query => query.trim()).filter(Boolean);
  assert.equal(sqlite.prepare(queries[0]).get().registered_accounts, 1);
  assert.ok(sqlite.prepare(queries[1]).get().players_since_start >= 3);
  for (const query of queries) sqlite.prepare(query).all();
  console.log('Analytics backend passed: China-day PV/UV, atomic retries/concurrency, device/overall deduplication, real login counting, failed-login exclusion, private reads, request limits and aggregate-preserving retention.');

  const source = fs.readFileSync(new URL('../analytics.js', import.meta.url), 'utf8');
  async function client({ enabled = true, local = new Map(), fail = false, hidden = false, storageBlocked = false, badResponse = false } = {}) {
    const calls = [], warnings = [], timers = [], intervals = [], events = {}, documentEvents = {};
    let clock = 0;
    let unavailable = fail;
    const state = {
      location: { protocol: 'https:' }, crypto, AbortSignal,
      localStorage: {
        getItem(key) { if (storageBlocked) throw new Error('storage denied'); return local.get(key) || null; },
        setItem(key, value) { local.set(key, value); }
      },
      document: { visibilityState: hidden ? 'hidden' : 'visible', addEventListener(name, handler) { documentEvents[name] = handler; } },
      console: { warn: (...args) => warnings.push(args) },
      setTimeout(handler, delay) { timers.push({ handler, delay }); },
      setInterval(handler, delay) { const token = { handler, delay, active: true }; intervals.push(token); return token; },
      clearInterval(token) { token.active = false; },
      performance: { now: () => clock },
      addEventListener(name, handler) { events[name] = handler; },
      ZhaolieCloud: { ready: Promise.resolve(enabled ? { analytics: true } : {}) },
      fetch: async (url, options) => {
        calls.push({ url, ...options });
        if (unavailable) throw new Error('network offline');
        if (badResponse) return new Response('maintenance page');
        return Response.json({ ok: true });
      }
    };
    state.window = state;
    vm.runInNewContext(source, state);
    await new Promise(resolve => setImmediate(resolve));
    return { calls, warnings, timers, intervals, state, events, documentEvents, local,
      advance(ms) { clock += ms; }, recover() { unavailable = false; } };
  }
  const local = new Map();
  let c = await client({ local });
  assert.equal(c.calls.length, 1);
  assert.equal(c.calls[0].url, '/api/analytics/visit');
  assert.equal(c.calls[0].credentials, 'omit', 'visit counting must not attach login cookies');
  const first = JSON.parse(c.calls[0].body);
  assert.deepEqual(Object.keys(first).sort(), ['visitId', 'visitorId']);
  await c.events.online();
  assert.equal(c.calls.length, 1);
  c.events['zhaolie-gameplay-start']();
  assert.equal(c.intervals.length, 1);
  assert.equal(c.intervals[0].delay, 30000);
  c.advance(30000);
  c.intervals[0].handler();
  await new Promise(resolve => setImmediate(resolve));
  let playCalls = c.calls.filter(call => call.url === '/api/analytics/playtime');
  assert.equal(playCalls.length, 1);
  assert.equal(JSON.parse(playCalls[0].body).seconds, 30);
  c.advance(5000);
  c.events['zhaolie-gameplay-stop']();
  await new Promise(resolve => setImmediate(resolve));
  playCalls = c.calls.filter(call => call.url === '/api/analytics/playtime');
  assert.equal(playCalls.length, 2);
  assert.equal(JSON.parse(playCalls[1].body).seconds, 5);
  assert.equal(c.intervals[0].active, false);
  assert.match(c.state.localStorage.getItem('zhaolie-playtime-queue-v1'), /^\[\]$/,
    'successful play-time uploads must clear the retry queue');
  c = await client({ local });
  const second = JSON.parse(c.calls[0].body);
  assert.equal(first.visitorId, second.visitorId);
  assert.notEqual(first.visitId, second.visitId, 'each page load has a separate idempotency key');
  c = await client({ fail: true });
  assert.equal(c.warnings.length, 1);
  assert.equal(c.timers.length, 1);
  const failedBody = c.calls[0].body;
  c.recover();
  await c.events.online();
  await c.timers[0].handler();
  assert.equal(c.calls.length, 2);
  assert.equal(c.calls[1].body, failedBody, 'retry must reuse both IDs');
  c = await client({ hidden: true });
  assert.equal(c.calls.length, 0);
  c.state.document.visibilityState = 'visible';
  await c.documentEvents.visibilitychange();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(c.calls.length, 1, 'background preloaded pages count only when shown');
  c = await client({ enabled: false });
  assert.equal(c.calls.length, 0);
  assert.equal(c.local.size, 0, 'disabled/static deployments must not set an analytics identifier');
  c.events['zhaolie-gameplay-start']();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(c.intervals.length, 0);
  assert.equal(c.local.size, 0, 'disabled/static deployments must not start a play timer');
  c = await client({ storageBlocked: true });
  assert.equal(c.calls.length, 0);
  assert.equal(c.warnings.length, 1, 'unavailable browser storage is explicit but never blocks the game');
  c = await client({ badResponse: true });
  assert.equal(c.warnings.length, 1, 'an HTML 200 response must not be mistaken for a persisted counter');
  assert.equal(c.timers.length, 1);
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /src="analytics\.js\?build=/);
  assert.ok(html.indexOf('src="cloud-saves.js') < html.indexOf('src="analytics.js'));
  assert.equal(new Set([...html.matchAll(/\?build=([^"']+)/g)].map(match => match[1])).size, 1,
    'runtime cache version must be uniform');
  const game = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
  assert.match(game, /dispatchEvent\(new Event\('zhaolie-gameplay-start'\)\)/);
  assert.match(game, /dispatchEvent\(new Event\('zhaolie-gameplay-stop'\)\)/);
  const config = JSON.parse(fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.notEqual(config.d1_databases[0].database_id, config.env.preview.d1_databases[0].database_id);
  assert.equal(config.vars.ANALYTICS_ENABLED, 'true');
  assert.equal(config.env.preview.vars.ANALYTICS_ENABLED, 'true');
  assert.deepEqual(config.triggers.crons, ['15 16 * * *']);
  assert.deepEqual(config.env.preview.triggers.crons, ['15 16 * * *']);
  console.log('Analytics client passed: stable anonymous player counting, visible-gameplay timing, idempotent offline retries, no cookies, no public UI and isolated deployment configuration.');
} finally {
  Date.now = originalNow;
  sqlite.close();
}
