import fs from 'node:fs';

const game = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const atlas = new URL('../assets/wounded-units-atlas-v1.webp', import.meta.url);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(fs.existsSync(atlas), 'missing wounded unit atlas');
assert(/u\.hp\/u\.maxHp<=\.3/.test(game), 'critical HP threshold must be 30%');
assert(/function drawAuthoredIdleFrame/.test(game), 'authored idle renderer missing');
assert(/idleFrame=0,idleNextFrame=0,idleBlend=0/.test(game), 'idle key-pose cycle missing');
assert(/function idleFacingFor\(u\)/.test(game), 'idle facing must track the nearest opponent');
assert(/const from=iso\(u\.x,u\.y\),to=iso\(target\.x,target\.y\),screenDx=to\.x-from\.x/.test(game), 'idle facing must use projected screen positions');
assert(/direction:'west',facing:idleFacingFor\(u\)/.test(game), 'idle must use the authored front-facing row');
assert(/authoredIdle&&!wounded&&\(idle\.facing\?\?defaultFacing\(u\)\)>0/.test(game), 'front-facing idle row must mirror toward the opponent');
assert(/feet\*scale/.test(game), 'animation frames must use a fixed foot baseline');
assert(/function drawWoundedUnit/.test(game), 'wounded pose renderer missing');
assert(/function woundedKeyFor/.test(game) && /return'infantry'/.test(game), 'whole-roster wounded fallback missing');
assert(/woundedPreview/.test(game), 'wounded visual audit route missing');
assert(!/idle\.legLift/.test(game), 'old sliced horse-leg idle deformation is still active');
assert(game.includes("songxian:'assets/songxian-walk-v2.webp'"), 'clean Song Xian walk sheet is not wired');
assert(/function genericVisualKeyFor\(u\)\{if\(u\.troop==='cavalry'\)return'hua'/.test(game), 'unnamed cavalry must use mounted art');
assert(/if\(u\.troop==='cavalry'\)return'hua';/.test(game), 'mounted wounded fallback missing');
assert(/function deathKeyFor\(u\).*u\.troop==='cavalry'\?'hua'/.test(game), 'mounted death fallback missing');
assert(html.includes('game.js?build='), 'cache-busted game script missing');

console.log('idle and wounded animation verification passed');
