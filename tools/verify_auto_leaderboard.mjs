import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';

const source = readFileSync(new URL('../leaderboard.js', import.meta.url), 'utf8');
const queueKey = 'zhaolie-leaderboard-pending-v1';
const settle = async () => { for (let i = 0; i < 12; i++) await new Promise(setImmediate); };
function harness({ account = 'account-a', storage = new Map(), failure = false } = {}) {
  const elements = new Map(), events = {}, posts = [], intervals = [];
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set(['hidden']);
      elements.set(id, { value: '', textContent: '', disabled: false, listeners: {},
        classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x),
          toggle: (x, on) => on ? classes.add(x) : classes.delete(x) },
        querySelector: selector => element(id + selector), addEventListener(type, fn) { this.listeners[type] = fn; } });
    }
    return elements.get(id);
  }
  const state = { account, failure, posts, storage, element, events };
  const window = { location: { origin: 'https://game.example' }, addEventListener: (type, fn) => { events[type] = fn; },
    ZhaolieCloud: { account: () => state.account, ready: Promise.resolve() } };
  vm.runInNewContext(source, { window, document: { hidden: false,
    getElementById: id => ['titleChampionTicker', 'titleChampionTrack'].includes(id) ? null : element(id),
    querySelector: () => null, querySelectorAll: () => [], addEventListener() {} },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    performance: { now: () => 0 }, crypto: { randomUUID }, AbortSignal, console,
    setInterval: fn => intervals.push(fn), fetch: async (url, options = {}) => {
      if (options.method !== 'POST') return { ok: true, json: async () => ({ entries: [] }) };
      const body = JSON.parse(options.body); posts.push(body);
      if (state.failure) throw new Error('network disconnected');
      return { ok: true, json: async () => ({ entry: { nickname: '登录名' }, rank: 3, improved: true }) };
    } });
  state.api = window.ZhaolieLeaderboard;
  state.finish = (id = 'huainan') => {
    const level = { id, name: id, maxTurns: 30 };
    state.api.reset(level); state.api.restoreClock({ elapsedMs: 600000 }, level);
    state.api.finish({ level, turns: 12, units: [{ side: 'ally', maxHp: 100, hp: 80 }] });
  };
  return state;
}

const signed = harness();
await settle(); signed.finish(); await settle();
assert.equal(signed.posts.length, 1, 'victory uploads without clicking');
assert.equal(signed.posts[0].accountId, 'account-a');
assert.equal(signed.posts[0].nickname, undefined, 'server supplies account name');
assert(signed.element('scoreNickname').classList.contains('hidden'));
assert(signed.element('scoreUploadBtn').classList.contains('hidden'));
assert(signed.element('leaderboardOverlay').classList.contains('hidden'), 'automatic upload must not open leaderboard');
assert.match(signed.element('scoreUploadStatus').textContent, /登录名.*自动上传/);
assert.equal(JSON.parse(signed.storage.get(queueKey)).length, 0);

const offline = harness({ failure: true });
await settle(); offline.finish(); await settle();
assert.equal(JSON.parse(offline.storage.get(queueKey)).length, 1);
assert.match(offline.element('scoreUploadStatus').textContent, /网络恢复后自动补传/);
offline.failure = false; offline.events.online(); await settle();
assert.equal(offline.posts.length, 2);
assert.equal(JSON.parse(offline.storage.get(queueKey)).length, 0);

const interrupted = harness({ failure: true });
await settle(); interrupted.finish(); await settle();
const wrongAccount = harness({ account: 'account-b', storage: interrupted.storage });
await settle(); assert.equal(wrongAccount.posts.length, 0, 'other account cannot submit pending scores');
const reloaded = harness({ storage: interrupted.storage });
await settle(); assert.equal(reloaded.posts.length, 1, 'reload retries original account pending score');

const guest = harness({ account: null });
await settle(); guest.finish(); await settle();
assert.equal(guest.posts.length, 0, 'guest must not be silently uploaded');
assert(!guest.element('scoreNickname').classList.contains('hidden'));
assert(!guest.element('scoreUploadBtn').classList.contains('hidden'));

const advancing = harness();
await settle(); advancing.finish('huainan'); advancing.api.reset({ id: 'taishan' }); await settle();
assert.equal(advancing.posts[0].levelId, 'huainan', 'scene changes do not mutate captured result');
console.log('Auto leaderboard verified: authenticated victory, no popup, guest controls, offline recovery, reload, owner isolation, scene changes.');
