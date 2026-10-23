import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.mjs';
import { validatePayload, MAX_SLOT_BYTES, MAX_BUNDLE_BYTES } from '../save-format.mjs';
import { collectReleaseAssets } from './release-assets.mjs';

const sqlite = new DatabaseSync(':memory:');
for (const name of ['0001_auth.sql', '0002_cloud_saves.sql', '0003_password_login.sql']) {
  sqlite.exec(fs.readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8'));
}
const db = {
  prepare(sql) {
    return {
      values: [], bind(...values) { this.values = values; return this; },
      async first() { return sqlite.prepare(sql).get(...this.values) || null; },
      async all() { return { results: sqlite.prepare(sql).all(...this.values) }; },
      async run() { return sqlite.prepare(sql).run(...this.values); }
    };
  }
};
const origin = 'https://game.example';
const env = { AUTH_DB: db, AUTH_ORIGIN: origin };
const cookie = {};
for (const [i, user] of ['alice', 'bob', 'history'].entries()) {
  sqlite.prepare('INSERT INTO users VALUES (?, ?)').run(user, Date.now());
  const token = String(i + 1).repeat(64);
  sqlite.prepare('INSERT INTO auth_sessions VALUES (?, ?, ?)')
    .run(createHash('sha256').update(token).digest('hex'), user, Date.now() + 86400000);
  cookie[user] = `__Host-zhaolie-session=${token}`;
}
const empty = () => ({ saveStore: { schema: 1, auto: null, manual: Array(6).fill(null) }, campaignTransfer: null, clearedLevels: [] });
const snapshot = (turn = 1) => ({
  schema: 1, levelId: 'sishui-pass', levelName: '汜水关之战', savedAt: Date.now(), turn,
  units: [{ id: 'liu', x: 1, y: 1, hp: 500 }], map: [['plain']]
});
const payload = (turn = 1) => ({ ...empty(), saveStore: { ...empty().saveStore, auto: snapshot(turn) } });
async function call(user, method = 'GET', body, pathname = '/api/saves', extra = {}) {
  return worker.fetch(new Request(origin + pathname, {
    method, headers: { cookie: cookie[user] || '', 'x-save-owner': user || '', origin,
      'content-type': 'application/json', ...extra },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  }), env);
}
const put = (user, baseRevision, data, requestId = randomUUID()) => call(user, 'PUT', { baseRevision, payload: data, requestId });

try {
  assert.equal((await call(null)).status, 401);
  assert.equal((await call('alice', 'GET', undefined, '/api/saves', { 'x-save-owner': 'bob' })).status, 409);
  assert.equal((await put('alice', 0, payload())).status, 200);
  assert.equal((await (await call('bob')).json()).revision, 0);
  assert.equal((await call('alice', 'PUT', { baseRevision: 1, payload: payload(), requestId: randomUUID() }, '/api/saves',
    { origin: 'https://evil.example' })).status, 403);
  assert.equal((await put('alice', 0, payload(2))).status, 409);
  assert.equal((await put('bob', 7, payload())).status, 409, 'missing bundle must not accept a nonzero base');
  const requestId = randomUUID();
  const second = payload(2);
  assert.equal((await put('alice', 1, second, requestId)).status, 200);
  assert.equal((await (await put('alice', 1, second, requestId)).json()).revision, 2, 'lost response retry must not create a second revision');
  assert.equal((await put('alice', 1, payload(3), requestId)).status, 409, 'request ID cannot change the submitted payload');
  const bad = payload(); bad.saveStore.auto.units = [null];
  assert.equal((await put('alice', 2, bad)).status, 400);
  assert.equal((await (await call('alice')).json()).revision, 2);
  const overSlot = payload(); overSlot.saveStore.auto.extra = 'a'.repeat(MAX_SLOT_BYTES);
  assert.equal((await put('alice', 2, overSlot)).status, 400);
  const byteLength = value => new TextEncoder().encode(JSON.stringify(value)).length;
  const exactSlot = payload();
  exactSlot.saveStore.auto.extra = '';
  exactSlot.saveStore.auto.extra = 'a'.repeat(MAX_SLOT_BYTES - byteLength(exactSlot.saveStore.auto));
  assert.equal(byteLength(exactSlot.saveStore.auto), MAX_SLOT_BYTES);
  validatePayload(exactSlot, { cloud: true });
  exactSlot.saveStore.auto.extra += 'a';
  assert.throws(() => validatePayload(exactSlot, { cloud: true }), /100 KiB/);
  const exactBundle = empty();
  for (let i = 0; i < 4; i++) exactBundle.saveStore.manual[i] = { ...snapshot(), extra: 'a'.repeat(88000) };
  exactBundle.saveStore.manual[0].extra += 'a'.repeat(MAX_BUNDLE_BYTES - byteLength(exactBundle));
  assert.equal(byteLength(exactBundle), MAX_BUNDLE_BYTES);
  validatePayload(exactBundle, { cloud: true });
  exactBundle.saveStore.manual[0].extra += 'a';
  assert.throws(() => validatePayload(exactBundle, { cloud: true }), /350 KiB/);
  const total = payload();
  total.saveStore.manual = Array.from({ length: 6 }, () => ({ ...snapshot(), extra: 'a'.repeat(65000) }));
  assert.ok(JSON.stringify(total).length > MAX_BUNDLE_BYTES);
  assert.equal((await put('alice', 2, total)).status, 413);
  assert.equal((await call('alice', 'PUT', { baseRevision: -1, payload: empty(), requestId: randomUUID() })).status, 400);
  assert.equal((await call('alice', 'POST', {})).status, 405);
  const phases = payload();
  phases.saveStore.manual[0] = { schema: 1, levelId: 'jieqiao', savedAt: Date.now(), phaseType: 'story',
    storyIndex: 3, storyActors: [{ name: '刘备', x: 1, y: 2 }] };
  phases.saveStore.manual[1] = { schema: 1, levelId: 'beihai', savedAt: Date.now(), phaseType: 'prep' };
  phases.saveStore.manual[2] = { ...snapshot(), phaseType: 'postbattle', postBattleChoice: 'xuzhou' };
  phases.campaignTransfer = { schema: 1, fromLevelId: 'beihai', toLevelId: 'xuzhou', gold: 1700,
    units: [{ id: 'liu', level: 12, inventory: ['bean'], treasureItems: ['sword'] }] };
  assert.equal((await put('alice', 2, phases)).status, 200);
  assert.deepEqual((await (await call('alice')).json()).payload.campaignTransfer, phases.campaignTransfer);
  const terminal = structuredClone(phases);
  terminal.campaignTransfer.fromLevelId = 'xuzhou';
  terminal.campaignTransfer.toLevelId = 'xuzhou-postbattle';
  terminal.campaignTransfer.postBattleChoice = 'negotiate';
  assert.equal((await put('alice', 3, terminal)).status, 200);
  assert.equal((await (await call('alice')).json()).payload.campaignTransfer.postBattleChoice, 'negotiate');
  let chapterRevision = 4;
  for (const [fromLevelId, toLevelId] of [
    ['xuzhou', 'xiaopei'], ['xiaopei', 'xiaopei-postbattle'], ['xiaopei', 'taishan'],
    ['xiaopei-negotiate', 'taishan'], ['taishan', 'huainan']
  ]) {
    const chapter = payload();
    chapter.saveStore.auto.levelId = fromLevelId === 'xuzhou' ? 'xuzhou' : fromLevelId === 'taishan' ? 'taishan' : 'xiaopei';
    chapter.saveStore.auto.phaseType = 'postbattle';
    chapter.campaignTransfer = { schema: 1, fromLevelId, toLevelId, units: [{ id: 'liu' }],
      gold: 2100, sunQianJoined: true, taishanCleared: fromLevelId === 'taishan' };
    assert.equal((await put('alice', chapterRevision, chapter)).status, 200, `${fromLevelId} -> ${toLevelId}`);
    chapterRevision++;
    assert.deepEqual((await (await call('alice')).json()).payload, chapter);
    assert.equal((await (await call('bob')).json()).payload, null, 'new chapter progress remains account-isolated');
  }
  const invalidDestination = payload();
  invalidDestination.campaignTransfer = { schema: 1, fromLevelId: 'sishui-pass', toLevelId: 'huainan', units: [] };
  assert.throws(() => validatePayload(invalidDestination), /关卡继承/);
  const runtime = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
  assert.doesNotMatch(runtime, /localStorage\.(?:getItem|setItem|removeItem)\((?:CAMPAIGN_KEY|SAVE_KEY|IMPORT_BACKUP_KEY|'sanguozhi-zhaolie-campaign-v1')/,
    'all new chapter paths must use the account storage adapter');
  assert.ok(runtime.indexOf('await window.ZhaolieCloud.ready') < runtime.indexOf('const pendingCampaignAtBoot='),
    'pending chapter routing must read the authenticated account, not guest progress');
  const large = payload(); large.saveStore.manual[0] = { ...snapshot(), extra: 'a'.repeat(85000) };
  large.saveStore.manual[1] = structuredClone(large.saveStore.manual[0]);
  for (let revision = 0; revision < 7; revision++) {
    large.saveStore.auto.turn = revision;
    assert.equal((await put('history', revision, large)).status, 200);
  }
  const history = await (await call('history', 'GET', undefined, '/api/saves/history')).json();
  assert.ok(history.entries.length <= 3);
  const bytes = sqlite.prepare(`SELECT COALESCE(SUM(length(CAST(payload AS BLOB))),0) AS n FROM
    (SELECT payload FROM save_bundles WHERE user_id = 'history' UNION ALL SELECT payload FROM save_history WHERE user_id = 'history')`).get().n;
  assert.ok(bytes <= 512000, `${bytes} exceeds per-user current+history quota`);
  assert.deepEqual((await (await call('bob', 'GET', undefined, '/api/saves/history')).json()).entries, []);
  const [a, b] = await Promise.all([put('bob', 0, payload(10)), put('bob', 0, payload(11))]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  console.log('Cloud API passed: real session ownership, Origin, two accounts, atomic revisions, idempotent retry, format/size limits, campaign and bounded history.');

  const SAVE = 'sanguozhi-zhaolie-save-v1', CAMPAIGN = 'sanguozhi-zhaolie-campaign-v1', BACKUP = 'sanguozhi-zhaolie-import-backup-v1';
  const accountKey = user => `zhaolie-account-save-v1:${user}`;
  function store(initial = {}) {
    const values = new Map(Object.entries(initial));
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, String(value)); },
      removeItem: key => { values.delete(key); } };
  }
  async function client(user, { local = store(), cloud = empty(), revision = 0, offline = false, lock = true } = {}) {
    const ids = ['cloudSaveStatus', 'cloudSaveSummary', 'cloudSaveDialog', 'cloudSaveNotice', 'cloudUseRemoteBtn',
      'cloudUseLocalBtn', 'cloudSyncBtn', 'cloudGuestBtn', 'cloudImportGuestBtn', 'cloudHistoryList',
      'cloudManageBtn', 'cloudCloseBtn', 'cloudHistoryBtn', 'cloudExportBackupBtn',
      'cloudSaveProgress', 'cloudConflictPanel', 'cloudMoreOptions', 'cloudAccountOptions',
      'cloudLocalProgress', 'cloudRemoteProgress', 'cloudRemoteLabel'];
    function element() {
      return { hidden: false, textContent: '', handlers: {}, children: [], addEventListener(name, fn) { this.handlers[name] = fn; },
        replaceChildren() { this.children = []; }, appendChild(value) { this.children.push(value); },
        showModal() {}, close() {}, click() {} };
    }
    const elements = Object.fromEntries(ids.map(id => [id, element()]));
    let remote = { payload: cloud, revision, userId: user }, puts = 0, failAfterPut = false, invalidSession = false, sessionAccount = user;
    const timers = new Map();
    let timerId = 0;
    const context = {
      document: { getElementById: id => elements[id], createElement: element }, navigator: { locks: { request: async (_, __, fn) => fn(lock ? {} : null) } },
      location: { pathname: '/', reload() { this.reloaded = true; }, assign(url) { this.assigned = url; } },
      localStorage: local, sessionStorage: store(), crypto, AbortSignal, Event, URL, Blob, structuredClone,
      console, addEventListener(name, fn) { this.events[name] = fn; }, events: {},
      dispatchEvent(event) { this.events[event.type]?.(event); },
      setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; }, clearTimeout(id) { timers.delete(id); },
      fetch: async (url, options = {}) => {
        if (offline) throw new Error('offline');
        if (url === '/api/auth/session') return Response.json({ user: sessionAccount ? { id: sessionAccount } : null, providers: { password: true } });
        if (invalidSession) return Response.json({ error: 'expired' }, { status: 401 });
        if (url.endsWith('/history')) return Response.json({ userId: user, entries: [{ payload: payload(77), revision: 1 }] });
        if (options.method !== 'PUT') return Response.json(remote);
        puts++;
        const body = JSON.parse(options.body);
        if (remote.requestId === body.requestId && JSON.stringify(remote.payload) === JSON.stringify(body.payload)) return Response.json(remote);
        if (remote.revision !== body.baseRevision) return Response.json({ ...remote, error: 'conflict' }, { status: 409 });
        remote = { payload: body.payload, userId: user, revision: remote.revision + 1, requestId: body.requestId };
        if (failAfterPut) { failAfterPut = false; throw new Error('response lost'); }
        return Response.json(remote);
      }
    };
    context.window = context;
    vm.runInNewContext(fs.readFileSync(new URL('../cloud-saves.js', import.meta.url), 'utf8'), context, {
      filename: fileURLToPath(new URL('../cloud-saves.js', import.meta.url)),
      importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER
    });
    await context.ZhaolieCloud.ready;
    return { context, elements, local, timers, puts: () => puts, remote: () => remote,
      setRemote(data) { remote = { ...remote, ...data }; }, setOffline(value) { offline = value; },
      loseResponse() { failAfterPut = true; }, expire() { invalidSession = true; }, setSession(value) { sessionAccount = value; } };
  }
  const local = store({ [SAVE]: JSON.stringify(payload(6).saveStore), [CAMPAIGN]: JSON.stringify(phases.campaignTransfer),
    [BACKUP]: JSON.stringify({ guest: true }) });
  let c = await client(null, { local });
  assert.equal(JSON.parse(c.context.ZhaolieStorage.getItem(SAVE)).auto.turn, 6);
  assert.equal(c.puts(), 0);
  assert.equal(c.elements.cloudSyncBtn.hidden, true);
  assert.equal(c.elements.cloudAccountOptions.hidden, true);
  c.elements.cloudManageBtn.handlers.click({ stopPropagation() {} });
  assert.equal(c.elements.cloudMoreOptions.open, false, 'advanced tools must be collapsed on open');
  assert.match(c.elements.cloudSaveNotice.textContent, /游客进度只保存在这台设备/);
  c = await client('alice', { local });
  assert.equal(JSON.parse(c.context.ZhaolieStorage.getItem(SAVE)).auto, null, 'must not silently migrate guest saves');
  c.context.ZhaolieStorage.setItem(SAVE, JSON.stringify(payload(12).saveStore));
  c.context.ZhaolieStorage.setItem(CAMPAIGN, JSON.stringify(phases.campaignTransfer));
  assert.equal(JSON.parse(local.getItem(SAVE)).auto.turn, 6);
  await c.context.ZhaolieCloud.flush();
  assert.equal(c.remote().payload.saveStore.auto.turn, 12);
  assert.equal(c.elements.cloudSaveStatus.textContent, '进度已保存到云端');
  assert.equal(c.elements.cloudConflictPanel.hidden, true);
  assert.equal(c.elements.cloudSyncBtn.hidden, false);
  assert.equal(c.elements.cloudSyncBtn.disabled, false);
  assert.equal(c.elements.cloudImportGuestBtn.hidden, true, 'nonempty accounts must not advertise guest migration');
  assert.doesNotMatch(c.elements.cloudSaveStatus.textContent, /第12回合|版本/);
  assert.match(c.elements.cloudSaveProgress.textContent, /第12回合/);
  const bob = await client('bob', { local });
  assert.equal(JSON.parse(bob.context.ZhaolieStorage.getItem(SAVE)).auto, null);
  assert.equal(JSON.parse(local.getItem(accountKey('alice'))).payload.saveStore.auto.turn, 12);
  assert.equal(JSON.parse(local.getItem(BACKUP)).guest, true);
  assert.throws(() => c.context.ZhaolieCloud.replacePayload(bad), /损坏/);
  assert.equal(JSON.parse(local.getItem(accountKey('alice'))).payload.saveStore.auto.turn, 12, 'failed import cannot overwrite account');
  c.context.ZhaolieCloud.replacePayload(payload(14));
  assert.equal(JSON.parse(c.context.ZhaolieStorage.getItem(BACKUP)).payload.saveStore.auto.turn, 12);
  c.loseResponse();
  await c.context.ZhaolieCloud.flush();
  assert.ok(JSON.parse(local.getItem(accountKey('alice'))).pending);
  c.context.ZhaolieStorage.setItem(SAVE, JSON.stringify(payload(15).saveStore));
  await c.context.ZhaolieCloud.flush();
  await c.context.ZhaolieCloud.flush();
  assert.equal(c.remote().payload.saveStore.auto.turn, 15);
  assert.equal(c.remote().revision, 3, 'retry and subsequent edit create exactly two revisions');
  c.context.ZhaolieStorage.setItem(SAVE, JSON.stringify(payload(16).saveStore));
  c.setRemote({ payload: payload(99), revision: 4 });
  await c.context.ZhaolieCloud.flush();
  assert.match(c.elements.cloudSaveStatus.textContent, /冲突/);
  assert.equal(c.elements.cloudConflictPanel.hidden, false);
  assert.equal(c.elements.cloudSyncBtn.hidden, true, 'sync must not compete with conflict choices');
  assert.match(c.elements.cloudLocalProgress.textContent, /第16回合/);
  assert.match(c.elements.cloudRemoteProgress.textContent, /第99回合/);
  assert.equal(c.remote().payload.saveStore.auto.turn, 99);
  await c.elements.cloudUseLocalBtn.handlers.click();
  assert.equal(c.remote().payload.saveStore.auto.turn, 16);
  assert.equal(c.elements.cloudConflictPanel.hidden, true);
  assert.equal(c.elements.cloudSyncBtn.hidden, false);
  assert.equal(JSON.parse(c.context.ZhaolieStorage.getItem(BACKUP)).payload.saveStore.auto.turn, 99);
  c.expire();
  c.context.ZhaolieStorage.setItem(SAVE, JSON.stringify(payload(17).saveStore));
  await c.context.ZhaolieCloud.flush();
  assert.ok(JSON.parse(local.getItem(accountKey('alice'))).dirty);
  assert.match(c.elements.cloudSaveStatus.textContent, /未同步/);
  local.setItem('zhaolie-last-account', 'alice');
  c = await client('alice', { local, offline: true });
  assert.equal(JSON.parse(c.context.ZhaolieStorage.getItem(SAVE)).auto.turn, 17);
  c.context.ZhaolieStorage.setItem(SAVE, JSON.stringify(payload(18).saveStore));
  assert.equal(JSON.parse(local.getItem(accountKey('alice'))).payload.saveStore.auto.turn, 18);
  assert.equal(c.puts(), 0);
  c = await client('alice', { offline: true, local: store({ 'zhaolie-last-account': 'alice',
    [accountKey('alice')]: JSON.stringify({ payload: payload(20), revision: 0, dirty: true }) }) });
  c.setOffline(false);
  await c.context.ZhaolieCloud.flush();
  assert.equal(c.remote().payload.saveStore.auto.turn, 20, 'network recovery must revalidate session and synchronize');
  c = await client('alice', { offline: true, local: store({ 'zhaolie-last-account': 'alice',
    [accountKey('alice')]: JSON.stringify({ payload: payload(21), revision: 0, dirty: true }) }) });
  c.setOffline(false); c.setSession('bob');
  await c.context.ZhaolieCloud.flush();
  assert.equal(c.puts(), 0, 'changed session must not send old account progress');
  assert.equal(JSON.parse(c.local.getItem(accountKey('alice'))).payload.saveStore.auto.turn, 21);
  assert.throws(() => c.context.ZhaolieStorage.setItem(SAVE, JSON.stringify(payload(22).saveStore)), /刷新/);
  c = await client('alice', { local: store({ [accountKey('alice')]: JSON.stringify({ payload: payload(5), revision: 1, dirty: true }) }),
    cloud: payload(6), revision: 2 });
  assert.equal(c.elements.cloudUseRemoteBtn.hidden, false);
  await c.elements.cloudUseRemoteBtn.handlers.click();
  assert.equal(JSON.parse(c.context.ZhaolieStorage.getItem(SAVE)).auto.turn, 6);
  assert.equal(JSON.parse(c.context.ZhaolieStorage.getItem(BACKUP)).payload.saveStore.auto.turn, 5);
  assert.equal(c.context.location.reloaded, true);
  c = await client('alice', { local: store({ [accountKey('alice')]: '{broken' }) });
  assert.throws(() => c.context.ZhaolieStorage.setItem(SAVE, JSON.stringify(empty().saveStore)), /未就绪/);
  assert.equal(c.local.getItem(accountKey('alice')), '{broken');
  c = await client('alice', { lock: false });
  assert.throws(() => c.context.ZhaolieStorage.setItem(SAVE, JSON.stringify(empty().saveStore)), /刷新/);
  assert.equal(c.puts(), 0);
  assert.equal(c.elements.cloudSyncBtn.disabled, true, 'readonly account must not offer writable actions');
  c = await client('alice', { cloud: payload(3), revision: 3 });
  await c.elements.cloudHistoryBtn.handlers.click();
  await c.elements.cloudHistoryList.children[0].handlers.click();
  assert.equal(JSON.parse(c.context.ZhaolieStorage.getItem(SAVE)).auto.turn, 3, 'history click only selects, does not immediately overwrite');
  assert.equal(c.elements.cloudRemoteLabel.textContent, '你选择的旧存档');
  const beforeCancel = c.puts();
  await c.elements.cloudUseLocalBtn.handlers.click();
  assert.equal(c.puts(), beforeCancel, 'canceling restore must not write a new cloud version');
  assert.equal(c.elements.cloudConflictPanel.hidden, true);
  assert.equal(c.remote().payload.saveStore.auto.turn, 3);
  await c.elements.cloudHistoryList.children[0].handlers.click();
  await c.elements.cloudUseRemoteBtn.handlers.click();
  assert.equal(c.remote().revision, 4);
  assert.equal(c.remote().payload.saveStore.auto.turn, 77);
  c = await client('alice', { local: store({ [SAVE]: JSON.stringify(payload(7).saveStore) }) });
  await c.elements.cloudImportGuestBtn.handlers.click();
  assert.equal(c.remote().payload.saveStore.auto.turn, 7);
  c = await client('alice', { local: store({ [SAVE]: JSON.stringify(payload(7).saveStore) }), cloud: payload(8), revision: 1 });
  await c.elements.cloudImportGuestBtn.handlers.click();
  assert.equal(c.remote().payload.saveStore.auto.turn, 8);
  assert.match(c.elements.cloudSaveNotice.textContent, /账号进度/);
  const game = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
  assert.doesNotMatch(game, /localStorage\.(getItem|setItem|removeItem)\((SAVE_KEY|CAMPAIGN_KEY|IMPORT_BACKUP_KEY)/);
  assert.ok(game.indexOf('await window.ZhaolieCloud.ready') < game.indexOf('const level ='));
  assert.match(game, /window\.refreshJieqiaoLevel/);
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('cloud-saves.js') < html.indexOf('level-01.js'));
  assert.match(html, /save-format\.mjs/);
  const advanced = html.slice(html.indexOf('<details id="cloudMoreOptions">'), html.indexOf('</details>', html.indexOf('<details id="cloudMoreOptions">')));
  assert.match(advanced, /id="cloudHistoryBtn"/);
  assert.match(advanced, /id="cloudExportBackupBtn"/);
  assert.doesNotMatch(advanced, /id="cloudSyncBtn"|id="cloudUseRemoteBtn"/);
  assert.equal(validatePayload(phases).campaignTransfer.gold, 1700);
  const references = collectReleaseAssets([game]);
  const cliReferences = JSON.parse(execFileSync(process.execPath, [
    fileURLToPath(new URL('./release-assets.mjs', import.meta.url)), fileURLToPath(new URL('../', import.meta.url)), 'game.js'
  ], { encoding: 'utf8' }));
  assert.deepEqual(new Set(cliReferences), references, 'Sites CLI must use the same asset enumeration as Cloudflare');
  for (const id of ['yujin', 'yuejin', 'lidian', 'guojia', 'caohong', 'xiahouyuan', 'mifang', 'sunqian', 'tao', 'transport']) {
    assert.ok(references.has(`assets/level-07-xuzhou/units/${id}-walk-v1.webp`), `missing enumerated walk asset for ${id}`);
  }
  console.log('Cloud client passed: unchanged guests, account isolation, pre-boot identity, offline queue, idempotent retry with new edits, atomic import/backup, explicit conflict/history selection, expired session and single-tab lock.');
} finally {
  sqlite.close();
}
