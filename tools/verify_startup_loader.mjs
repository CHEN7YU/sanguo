import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const loader=fs.readFileSync(new URL('../startup-loader.js',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');

new vm.Script(loader,{filename:'startup-loader.js'});

assert.ok(html.indexOf('id="startupLoader"')<html.indexOf('id="titleScreen"'),
  'the loading screen must exist before the title screen can paint');
assert.ok(html.indexOf('startup-loader.js?build=')<html.indexOf('cloud-saves.js?build='),
  'the loader must start before game and cloud scripts');
for(const token of ['role="progressbar"','aria-valuemin="0"','aria-valuemax="100"','id="startupLoaderRetry"','<noscript>']){
  assert.ok(html.includes(token),`loading screen accessibility/fallback is missing: ${token}`);
}

for(const token of [
  "image.addEventListener('load'",
  "image.addEventListener('error'",
  'settled/registered',
  'failed||!sealed||settled<registered||!pageLoaded',
  "retry.addEventListener('click',()=>location.reload())",
  'window.ZhaolieStartup={ready,trackImage,seal,fail}'
])assert.ok(loader.includes(token),`loader does not track real asset readiness: ${token}`);

assert.ok(game.includes('function lazyImage(src)'));
assert.equal((game.match(/new Image\(\)/g)||[]).length,1,
  'all runtime image creation must pass through the lazy image registry');
assert.ok(game.includes('function ensureStageAssets()')&&game.includes('hideTitle(playMusic=true){ensureStageAssets()'),
  'battle images must start loading only after the player leaves the title screen');
assert.ok(!game.includes('Object.values(dialoguePortraits).forEach(preloadImage)'),
  'the title screen must not preload every dialogue portrait');
assert.ok(game.includes('window.ZhaolieStartup?.seal()'), 'game must seal the resource manifest after registration');
assert.ok(game.includes('window.ZhaolieStartup.ready.then(playTitleIntro)'),
  'the title intro must wait until the loading screen has finished');

const builds=[...html.matchAll(/(?:src|href)="[^"]+\?build=([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(builds).size,1,'all startup resources must use one cache version');
assert.equal(builds[0],game.match(/const RUNTIME_BUILD='([^']+)'/)?.[1],
  'HTML and runtime cache versions must match');

console.log(`Startup loader verified: page readiness, failure retry, accessible fallback, delayed battle assets and intro (${builds[0]}).`);
