import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'about/index.html'), 'utf8');
const css = readFileSync(resolve(root, 'about/about.css'), 'utf8');
const js = readFileSync(resolve(root, 'about/about.js'), 'utf8');
const worker = readFileSync(resolve(root, 'worker/index.mjs'), 'utf8');

for (const marker of ['免费开始试玩', '实际游戏画面', '重制对照', '武将与兵种', '当前可玩内容',
  '视频与开发故事', '最近三次更新', '玩家留言', '几个常见问题']) assert.match(html, new RegExp(marker));
assert.match(html, /class="mobile-play play-link"/);
assert.match(css, /@media\(max-width:600px\)/);
assert.doesNotMatch(html, /<video[^>]+src=/i, 'video bytes must load only after a click');
assert.doesNotMatch(html, /game\.js|level-\d+\.js/, 'introduction page must not preload the game runtime');
assert.match(js, /analytics\/about/);
assert.match(js, /fetch\(`\$\{api\}\/comments/);
assert.match(worker, /handleAboutAnalytics/);
assert.match(worker, /handleComments/);

const assetRefs = [...html.matchAll(/\.\.\/assets\/([^"']+)/g)].map(match => match[1].split('?')[0]);
for (const file of new Set(assetRefs)) {
  const filename = resolve(root, 'assets', ...file.split('/'));
  assert.ok(existsSync(filename), `missing introduction asset: assets/${file}`);
  assert.ok(statSync(filename).size < 25 * 1024 * 1024, `introduction asset exceeds 25 MiB: assets/${file}`);
}
for (const file of ['about/devlog.html', 'about/admin.html', 'about/admin.js']) {
  assert.ok(existsSync(resolve(root, file)), `missing page: ${file}`);
}
console.log(`Introduction page verified: ${new Set(assetRefs).size} assets, lazy video, responsive CTA, comments and conversion analytics.`);
