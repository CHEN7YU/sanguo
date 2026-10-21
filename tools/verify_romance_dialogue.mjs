import fs from 'node:fs';
import vm from 'node:vm';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sourceFiles = [
  'level-01.js','level-02.js','level-03-guangchuan.js','level-03-xindu.js',
  'level-04-julu.js','level-04-qinghe.js','level-05-jieqiao.js','level-06-beihai.js',
  'level-07-xuzhou.js','level-08-xiaopei.js','level-09-taishan.js','level-10-huainan.js','story-data.js'
];

function runtime(search = '') {
  const context = {
    window: {},
    URLSearchParams,
    location: {search},
    localStorage: { getItem(){ return null; } }
  };
  vm.createContext(context);
  for (const file of sourceFiles) vm.runInContext(fs.readFileSync(file,'utf8'), context, {filename:file});
  vm.runInContext(fs.readFileSync('dialogue-style.js','utf8'), context, {filename:'dialogue-style.js'});
  return context;
}

function inventory(root) {
  const rows = [];
  const seen = new WeakSet();
  const quoteKeys = new Set(['defeatQuote','criticalQuote','critQuote','blockQuote','quote']);
  function walk(value, trail, speaker = '') {
    if (value == null) return;
    if (typeof value === 'string') {
      if (/[^\x00-\x7f]/.test(value) && trail.some(part=>/NPC_DIALOGUE/i.test(String(part)))) rows.push({path:trail.join('.'),speaker:String(trail.at(-2)||speaker),text:value});
      return;
    }
    if (typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) { value.forEach((item,index)=>walk(item,[...trail,index],speaker)); return; }
    const nextSpeaker = typeof value.speaker === 'string' ? value.speaker : speaker;
    if (typeof value.text === 'string' && typeof value.speaker === 'string') rows.push({path:trail.concat('text').join('.'),speaker:value.speaker,text:value.text});
    for (const [key,item] of Object.entries(value)) {
      if (key === 'speaker' || key === 'text') continue;
      if (typeof item === 'string' && quoteKeys.has(key) && /[^\x00-\x7f]/.test(item)) rows.push({path:trail.concat(key).join('.'),speaker:value.name||nextSpeaker,text:item});
      else walk(item,[...trail,key],nextSpeaker);
    }
  }
  for (const [name,value] of Object.entries(root)) walk(value,[name]);
  return rows;
}

const styledRuntime = runtime('');
const originalRuntime = runtime('?dialogue=original');
const rows = inventory(styledRuntime.window);
const style = styledRuntime.window.ZhaolieDialogue;
const originalStyle = originalRuntime.window.ZhaolieDialogue;
assert(style?.mode === 'romance', 'default dialogue mode must be romance');
assert(originalStyle?.mode === 'original', '?dialogue=original must restore original dialogue');
assert(rows.length >= 596, `dialogue inventory unexpectedly shrank: ${rows.length}`);

let changed = 0;
const banned = /妈的|混蛋|不陪你们玩|出风头|太棒了|怎么搞的|倒霉|好厉害|没办法/;
for (const row of rows) {
  const styled = style.romance(row.text,row.speaker);
  assert(typeof styled === 'string' && styled.length > 0, `empty styled dialogue: ${row.path}`);
  assert(originalStyle.romance(row.text,row.speaker) === row.text, `original mode changed: ${row.path}`);
  if (row.speaker !== '提示') assert(!banned.test(styled), `modern wording remains at ${row.path}: ${styled}`);
  if (styled !== row.text) changed++;
}
assert(changed >= 200, `too few dialogue lines were restyled: ${changed}`);

const snapshot = JSON.parse(fs.readFileSync('docs/dialogue/original-dialogue-snapshot-20261013.json','utf8'));
assert(snapshot.count === rows.length, `snapshot count ${snapshot.count} != runtime inventory ${rows.length}`);
assert(snapshot.rows.every(row=>typeof row.text === 'string' && row.text.length), 'snapshot contains an empty source line');

const game = fs.readFileSync('game.js','utf8');
assert(game.includes("window.ZhaolieDialogue?.romance?.(text,speaker)||text"), 'story dialogue is not routed through the style layer');
assert(game.includes("window.ZhaolieDialogue?.romance?.(line.text,line.speaker)||line.text"), 'battle dialogue is not routed through the style layer');
assert(game.includes("function preserveDialogueMode(params)"), 'original dialogue mode is not preserved across navigation');
assert((game.match(/preserveDialogueMode\(/g)||[]).length >= 7, 'not every route/load/level navigation preserves original dialogue mode');
const html = fs.readFileSync('index.html','utf8');
const storyIndex = html.search(/story-data\.js\?build=/);
const styleIndex = html.search(/dialogue-style\.js\?build=/);
const gameIndex = html.search(/game\.js\?build=/);
assert(storyIndex >= 0 && storyIndex < styleIndex && styleIndex < gameIndex, 'dialogue style script load order is invalid');

console.log(`Romance dialogue verified: ${rows.length} uses, ${changed} rewritten, original mode preserved.`);
