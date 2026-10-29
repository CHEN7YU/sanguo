import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openDatabase, migrateDatabase, databaseBinding, backupDatabase } from '../server/database.mjs';
import { createApiServer, startServer, serverConfig } from '../server/app.mjs';
import { chinaDay } from '../worker/analytics.mjs';

const directory = mkdtempSync(join(tmpdir(), 'sanguo-api-'));
const filename = join(directory, 'accounts.sqlite');
const origin = 'https://game.example';
const config = { AUTH_ORIGIN: origin, AUTH_PASSWORD_PEPPER: 'local-test-pepper-not-for-production'.repeat(2),
  ANALYTICS_ENABLED: 'true', DATABASE_PATH: filename };
let sqlite, server, base;
async function listen() {
  server = createApiServer({ ...config, AUTH_DB: databaseBinding(sqlite) });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
}
async function stop() {
  if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  server = null;
}
async function call(path, { method = 'GET', body, cookie, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(base + path, { method, agent: false, headers: {
      host: 'game.example', 'x-forwarded-proto': 'https', 'x-real-ip': '192.0.2.1', origin,
      'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers
    } }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => resolve(new Response(Buffer.concat(chunks), {
        status: response.statusCode,
        headers: Object.fromEntries(Object.entries(response.headers)
          .map(([name, value]) => [name, Array.isArray(value) ? value.join(', ') : value]))
      })));
    });
    request.on('error', reject);
    request.end(body === undefined ? undefined : JSON.stringify(body));
  });
}
const progress = turn => ({ saveStore: { schema: 1, auto: {
  schema: 1, levelId: 'sishui-pass', savedAt: Date.now(), turn,
  units: [{ id: 'liu', x: 1, y: 1, hp: 500 }], map: [['plain']]
}, manual: Array(6).fill(null) }, campaignTransfer: null, clearedLevels: [] });

try {
  assert.throws(() => serverConfig({ ...config, AUTH_ORIGIN: 'http://game.example' }), /HTTPS/);
  assert.throws(() => serverConfig({ ...config, AUTH_PASSWORD_PEPPER: '' }), /PEPPER/);
  assert.throws(() => serverConfig({ ...config, PORT: '0' }), /PORT/);
  await assert.rejects(startServer(config), /existing migrated database/);
  sqlite = openDatabase(filename);
  await assert.rejects(startServer(config), /explicit database migration/);
  const manager = fileURLToPath(new URL('../server/manage.mjs', import.meta.url));
  execFileSync(process.execPath, [manager, 'migrate'], { env: { ...process.env, DATABASE_PATH: filename } });
  const migrations = sqlite.prepare('SELECT count(*) AS n FROM app_migrations').get().n;
  assert.equal(migrations, 5);
  migrateDatabase(sqlite);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM app_migrations').get().n, migrations);
  const checksum = sqlite.prepare('SELECT checksum FROM app_migrations WHERE name = ?').get('0001_auth.sql').checksum;
  sqlite.prepare('UPDATE app_migrations SET checksum = ? WHERE name = ?').run('changed', '0001_auth.sql');
  assert.throws(() => migrateDatabase(sqlite), /Applied migration changed/);
  await assert.rejects(startServer(config), /Pending or changed migration/);
  sqlite.prepare('UPDATE app_migrations SET checksum = ? WHERE name = ?').run(checksum, '0001_auth.sql');
  const db = databaseBinding(sqlite);
  await assert.rejects(db.batch([
    db.prepare('INSERT INTO users VALUES (?, ?)').bind('rollback', Date.now()),
    db.prepare('INSERT INTO users VALUES (?, ?)').bind('rollback', Date.now())
  ]));
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM users').get().n, 0, 'batch failure must roll back all writes');
  await listen();
  assert.equal((await call('/api/auth/session', { headers: { host: 'evil.example' } })).status, 400);
  assert.equal((await call('/api/auth/session', { headers: { 'x-forwarded-proto': 'http' } })).status, 400);
  assert.equal((await call('/api/auth/session', { headers: { 'x-real-ip': '' } })).status, 400);
  assert.equal((await call('/server/database.mjs')).status, 404, 'API must not serve source, secrets or databases');
  assert.equal((await call('/api/saves')).status, 401);
  assert.equal((await (await call('/api/auth/session')).json()).providers.password, true);
  const registered = await call('/api/auth/register', { method: 'POST', body: { username: 'testuser', password: '0123' } });
  assert.equal(registered.status, 201);
  const cookie = registered.headers.get('set-cookie').split(';')[0];
  assert.match(registered.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  const { user } = await registered.json();
  assert.equal((await call('/api/auth/register', {
    method: 'POST', body: { username: 'forged', password: '0123' }, headers: { origin: 'https://evil.example' }
  })).status, 403);
  assert.equal((await (await call('/api/auth/session', { cookie })).json()).user.id, user.id);
  const save = (baseRevision, turn, requestId = randomUUID()) => call('/api/saves', {
    method: 'PUT', cookie, headers: { 'x-save-owner': user.id },
    body: { baseRevision, requestId, payload: progress(turn) }
  });
  assert.equal((await save(0, 1)).status, 200);
  assert.equal((await save(1, 2)).status, 200);
  assert.equal((await save(0, 3)).status, 409);
  assert.equal((await call('/api/saves', { cookie, headers: { 'x-save-owner': 'other-user' } })).status, 409);
  const history = await (await call('/api/saves/history', { cookie, headers: { 'x-save-owner': user.id } })).json();
  assert.equal(history.entries.length, 1);
  const visitorId = randomUUID(), visitId = randomUUID();
  for (let i = 0; i < 2; i++) {
    assert.equal((await call('/api/analytics/visit', { method: 'POST', body: { visitorId, visitId } })).status, 200);
  }
  assert.equal((await call('/api/analytics/playtime', { method: 'POST',
    body: { visitorId, playId: randomUUID(), eventId: randomUUID(), seconds: 30 } })).status, 200);
  const daily = sqlite.prepare("SELECT * FROM analytics_daily WHERE day = ? AND device = 'all'").get(chinaDay());
  assert.equal(daily.page_views, 1);
  assert.equal(daily.logins, 1);
  assert.equal(sqlite.prepare("SELECT play_seconds FROM analytics_play_daily WHERE device = 'all'").get().play_seconds, 30);
  const copy = join(directory, 'verified-backup.sqlite');
  execFileSync(process.execPath, [manager, 'backup', copy], { env: { ...process.env, DATABASE_PATH: filename } });
  await assert.rejects(backupDatabase(filename, copy), /EEXIST/);
  await assert.rejects(backupDatabase(filename, filename), /separate/);
  const restored = openDatabase(copy);
  try {
    assert.equal(restored.prepare('SELECT payload FROM save_bundles WHERE user_id = ?').get(user.id).payload,
      sqlite.prepare('SELECT payload FROM save_bundles WHERE user_id = ?').get(user.id).payload);
    assert.equal(restored.prepare('SELECT password_hash FROM password_credentials').get().password_hash,
      sqlite.prepare('SELECT password_hash FROM password_credentials').get().password_hash);
  } finally { restored.close(); }
  await stop();
  sqlite.close();
  sqlite = openDatabase(filename);
  migrateDatabase(sqlite);
  await listen();
  assert.equal((await (await call('/api/saves', { cookie, headers: { 'x-save-owner': user.id } })).json()).payload.saveStore.auto.turn, 2);
  const login = await call('/api/auth/login', { method: 'POST', body: { username: 'testuser', password: '0123' } });
  assert.equal(login.status, 200, 'same password must work after service restart');
  const loginCookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/api/auth/logout', { method: 'POST', cookie: loginCookie })).status, 200);
  assert.equal((await call('/api/saves', { cookie: loginCookie, headers: { 'x-save-owner': user.id } })).status, 401);
  for (let i = 0; i < 6; i++) {
    const response = await call('/api/auth/register', { method: 'POST', body: { username: `limit${i}`, password: '0123' },
      headers: { 'cf-connecting-ip': `198.51.100.${i}` } });
    if (i >= 4) assert.equal(response.status, 429, 'forged Cloudflare IP headers must not bypass real-IP rate limits');
  }
  const nginx = readFileSync(new URL('../deploy/aliyun/nginx.conf', import.meta.url), 'utf8');
  assert.match(nginx, /root \/opt\/sanguo\/current\/dist/);
  assert.match(nginx, /proxy_set_header X-Real-IP \$remote_addr/);
  const port = server.address().port;
  await stop();
  server = await startServer({ ...config, DATABASE_PATH: copy, PORT: String(port) });
  base = `http://127.0.0.1:${port}`;
  assert.equal((await (await call('/api/saves', { cookie, headers: { 'x-save-owner': user.id } })).json()).payload.saveStore.auto.turn, 2,
    'production startup must read accounts and progress from the verified backup');
  console.log('Node API verified: real HTTP auth/save/history/statistics, proxy guards, transactional rollback, rate limits, restart persistence and verified backup.');
} finally {
  await stop();
  sqlite?.close();
  rmSync(directory, { recursive: true, force: true });
}
