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
for(const name of ['weaponType','movementType','charge','attack','block','impact','hoofStep','footStep','movementStep','fall'])check(typeof api[name]==='function',`missing ${name} sound`);
check(api.weaponType({troop:'archer',weapon:'角弓'})==='bow','archer weapon mapping');
check(api.weaponType({troop:'cavalry',weapon:'蛇矛'})==='spear','spear weapon mapping');
check(api.weaponType({troop:'infantry',weapon:'佩剑'})==='sword','sword weapon mapping');
check(api.weaponType({troop:'infantry',weapon:'环首刀'})==='saber','saber weapon mapping');
check(api.movementType({troop:'cavalry'})==='hoof','cavalry must use hoof sounds');
check(api.movementType({troop:'infantry'})==='foot','infantry must use footstep sounds');
check(api.movementType({troop:'archer'})==='foot','archers must use footstep sounds');
check(api.movementType({troop:'bandit'})==='foot','bandits must use footstep sounds');
check(api.movementType({troop:'infantry',mountedVisual:true})==='hoof','mounted named units must use hoof sounds');

function renderMovementSound(name,options={}){
  const count={oscillators:0,noiseSources:0};
  const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
  const node=()=>({connect(){return this}});
  const ctx={
    currentTime:0,sampleRate:8000,
    createGain(){return{...node(),gain:param()}},
    createStereoPanner(){return{...node(),pan:param()}},
    createOscillator(){count.oscillators++;return{...node(),frequency:param(),type:'sine',start(){},stop(){}}},
    createBuffer(){const data=new Float32Array(800);return{getChannelData(){return data}}},
    createBufferSource(){count.noiseSources++;return{...node(),buffer:null,start(){},stop(){}}},
    createBiquadFilter(){return{...node(),type:'bandpass',Q:{value:0},frequency:param()}}
  };
  api[name](ctx,node(),options);
  return count;
}
const hoofGraph=renderMovementSound('hoofStep',{alternate:true,terrain:'plain'});
const footGraph=renderMovementSound('footStep',{alternate:false,terrain:'plain'});
check(hoofGraph.oscillators===2&&hoofGraph.noiseSources===2,'hoof sound must contain two separated hoof impacts');
check(footGraph.oscillators===1&&footGraph.noiseSources===2,'footstep must contain a sole impact and armour/cloth rustle');

const scriptOrder=[...html.matchAll(/<script src="([^"]+)/g)].map(match=>match[1]);
check(scriptOrder.some(x=>x.startsWith('battle-sfx.js')),'battle-sfx.js is not loaded');
check(scriptOrder.findIndex(x=>x.startsWith('battle-sfx.js'))<scriptOrder.findIndex(x=>x.startsWith('game.js')),'battle-sfx.js must load before game.js');

for(const snippet of [
  "movementSound=mounted?'hoofStep':'footStep'",
  "battleSfx(movementSound",
  "battleSfx('footStep',actor",
  "battleSfx('attack'",
  "battleSfx('block'",
  "battleSfx('impact'",
  "battleSfx('fall'",
  "weaponSfxType(attacker)",
  "mounted=isMountedUnit(u)"
])check(gameSource.includes(snippet),`game integration missing: ${snippet}`);

check(/step!==lastStep/.test(gameSource),'movement sounds must be cadence limited');
check(/if\(blocked\)battleSfx\('block'/.test(gameSource),'blocked strikes must use the weapon block sound');
check(/else if\(!missed\)battleSfx\('impact'/.test(gameSource),'misses must not play a hit sound');

console.log('Battle SFX verification passed: distinct horse hooves and infantry footsteps, weapon mapping, action timing, movement cadence, block/hit/fall and script order.');
