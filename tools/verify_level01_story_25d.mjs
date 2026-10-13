import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const read = file => fs.readFileSync(path.join(dist, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`PASS ${message}`);
};

const assets = [
  'assets/story-scenes/level-01-25d/han-palace-25d-v1.webp',
  'assets/story-scenes/level-01-25d/chenliu-coalition-tent-25d-v1.webp',
  'assets/story-scenes/level-01-25d/luoyang-warlord-hall-25d-v1.webp',
  'assets/story-scenes/level-01-25d/sishui-march-map-25d-v1.webp',
];
for (const asset of assets) {
  const stat = fs.statSync(path.join(dist, asset));
  assert(stat.size > 250_000, `${asset} is a full-quality production asset (${stat.size} bytes)`);
}
for (const track of [2, 3, 11, 12]) {
  const file = `assets/audio/original-music-${track}.opus`;
  const stat = fs.statSync(path.join(dist, file));
  assert(stat.size > 1_000_000, `${file} is packaged as compressed story music`);
}

const context = { window: {} };
vm.createContext(context);
vm.runInContext(read('story-data.js'), context);
const story = context.window.PRE_BATTLE_STORY;
assert(Array.isArray(story) && story.length >= 60, `first-stage story remains complete (${story.length} beats)`);
for (const scene of ['prologue', 'palace', 'tent', 'luoyang', 'world']) {
  assert(story.some(line => line.scene === scene), `first-stage story contains ${scene} scene`);
}
assert(story.some(line => line.freeRoam), 'original Liu Bei free-roam conversation segment is preserved');
const npcDialogue = context.window.PRE_BATTLE_NPC_DIALOGUE || {};
for (const speaker of ['刘备', '关羽', '张飞', '曹操', '袁绍', '董卓', '华雄', '吕布']) {
  assert(story.some(line => line.speaker === speaker) || Object.hasOwn(npcDialogue, speaker), `${speaker} dialogue remains present`);
}

const html = read('index.html');
const css = read('style.css');
const game = read('game.js');
assert(html.includes('id="storyStage"') && html.includes('story-lighting'), 'layered 2.5D stage markup is present');
assert(html.includes('depth-palace') && html.includes('depth-world'), 'legacy foreground nodes remain available for compatibility');
assert(css.includes('.story-depth-copy{display:none!important}') && css.includes('.story-foreground{display:none!important}'), 'duplicate foreground and background slices stay disabled');
assert(css.includes('.story-overlay:not(.prologue) .story-actors,.story-overlay[data-scene="world"] .story-actors{inset:0;overflow:hidden}'), 'actors use the full 32 by 20 stage coordinate space');
const palaceLines = story.filter(line => line.scene === 'palace');
assert(palaceLines.length > 0 && palaceLines.every(line => line.location === '洛阳皇宫'), 'imperial palace scene uses the correct Luoyang location');
for (const asset of assets) assert(css.includes(asset), `${asset} is wired into the story stage`);
assert(css.includes('--story-camera-zoom') && css.includes('storyFireGlow'), 'camera and dynamic lighting rules are present');
assert(game.includes('function setStoryCamera') && game.includes("setStoryCamera(speaker)"), 'dialogue camera follows the active speaker');
assert(game.includes("storyMusicAssets={2:") && game.includes("original-music-12.opus"), 'all first-stage scene music resolves to packaged Opus assets');
assert(game.includes("u.id==='caocao'?1.05:1"), 'Cao Cao battle unit is consistently scaled to 105%');
assert(html.includes('20261013-level01-story-layout-v143') && game.includes('20261013-level01-story-layout-v143'), 'cache-busting build id is synchronized');

console.log('Level 01 pre-rendered 2.5D story verification complete.');
