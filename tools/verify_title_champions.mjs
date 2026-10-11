import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const source = fs.readFileSync('leaderboard.js', 'utf8');
const route = fs.readFileSync('leaderboard-service/app/api/leaderboard/route.ts', 'utf8');

assert.match(html, /id="titleChampionTicker"/);
assert.match(html, /id="titleChampionTrack"/);
assert.match(css, /@keyframes title-champions-scroll/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(css, /max-height:430px[\s\S]*?title-champion-ticker/);
assert.match(source, /scope=champions/);
assert.match(source, /CHAMPION_REFRESH_MS = 5 \* 60 \* 1000/);
assert.match(source, /Promise\.allSettled\(Object\.keys\(levels\)/);
assert.match(source, /textContent = entry\.nickname \|\| '无名将军'/);
assert.match(source, /addEventListener\('click', \(\) => void openLeaderboard\(entry\.levelId\)\)/);
assert.match(route, /jieqiao: \{ name: "界桥之战"/);
assert.match(route, /beihai: \{ name: "北海之战"/);
assert.match(route, /searchParams\.get\("scope"\) === "champions"/);
assert.match(route, /\.limit\(1\)/);

const storage = new Map();
const context = {
  window: {},
  document: {
    hidden: false,
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value))
  },
  crypto: { randomUUID: () => 'player-test-0001' },
  performance: { now: () => 0 },
  fetch: async () => { throw new Error('offline'); },
  setInterval: () => 0,
  Element: class Element {},
  console
};
vm.createContext(context);
vm.runInContext(source, context);

const winners = context.window.ZhaolieLeaderboard.championEntries([
  { levelId: 'sishui-pass', nickname: '甲', score: 8000, elapsedMs: 500000, turns: 12 },
  { levelId: 'sishui-pass', nickname: '乙', score: 9000, elapsedMs: 600000, turns: 13 },
  { levelId: 'sishui-pass', nickname: '丙', score: 9000, elapsedMs: 550000, turns: 14 },
  { levelId: 'qinghe', nickname: '丁', score: 7000, elapsedMs: 700000, turns: 15 },
  { levelId: 'unknown', nickname: '错', score: 10000, elapsedMs: 1, turns: 1 }
]);

assert.equal(winners.length, 2, '每关只能保留一个冠军，未知关卡必须忽略');
assert.equal(winners[0].nickname, '丙', '同分时应优先耗时较短者');
assert.equal(winners[1].levelId, 'qinghe', '冠军应按关卡流程顺序输出');

console.log('title champion ticker verification passed');
