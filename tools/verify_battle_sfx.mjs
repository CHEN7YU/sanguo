import fs from 'node:fs';
import vm from 'node:vm';

const sfxSource=fs.readFileSync(new URL('../battle-sfx.js',import.meta.url),'utf8');
const gameSource=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

const sandbox={window:{}};
vm.runInNewContext(sfxSource,sandbox,{filename:'battle-sfx.js'});
const api=sandbox.window.BattleSfx;

function check(condition,message){if(!condition)throw new Error(message)}

check(api&&Object.isFrozen(api),'BattleSfx must expose a frozen reusable API');
for(const name of ['weaponType','charge','attack','block','impact','movementStep','fall'])check(typeof api[name]==='function',`missing ${name} sound`);
check(api.weaponType({troop:'archer',weapon:'角弓'})==='bow','archer weapon mapping');
check(api.weaponType({troop:'cavalry',weapon:'蛇矛'})==='spear','spear weapon mapping');
check(api.weaponType({troop:'infantry',weapon:'佩剑'})==='sword','sword weapon mapping');
check(api.weaponType({troop:'infantry',weapon:'环首刀'})==='saber','saber weapon mapping');

const scriptOrder=[...html.matchAll(/<script src="([^"]+)/g)].map(match=>match[1]);
check(scriptOrder.some(x=>x.startsWith('battle-sfx.js')),'battle-sfx.js is not loaded');
check(scriptOrder.findIndex(x=>x.startsWith('battle-sfx.js'))<scriptOrder.findIndex(x=>x.startsWith('game.js')),'battle-sfx.js must load before game.js');

for(const snippet of [
  "battleSfx('movementStep'",
  "battleSfx('attack'",
  "battleSfx('block'",
  "battleSfx('impact'",
  "battleSfx('fall'",
  "weaponSfxType(attacker)",
  "mounted=isMountedUnit(u)",
  "battleSfx('movementStep',u,{mounted"
])check(gameSource.includes(snippet),`game integration missing: ${snippet}`);

check(/step!==lastStep/.test(gameSource),'movement sounds must be cadence limited');
check(/if\(blocked\)battleSfx\('block'/.test(gameSource),'blocked strikes must use the weapon block sound');
check(/else if\(!missed\)battleSfx\('impact'/.test(gameSource),'misses must not play a hit sound');

console.log('Battle SFX verification passed: weapon mapping, action timing, movement cadence, block/hit/fall and script order.');
