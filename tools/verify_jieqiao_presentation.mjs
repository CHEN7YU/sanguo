import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const levelSource=fs.readFileSync(path.join(root,'level-05-jieqiao.js'),'utf8');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const portraitBlock=game.match(/const portraitPaths = \{([\s\S]*?)\n  \};/)?.[1]||'';
const portraits=new Map([...portraitBlock.matchAll(/([a-zA-Z0-9_]+):'([^']+)'/g)].map(match=>[match[1],match[2]]));

function load(route){
  const transfer={schema:1,fromLevelId:route,toLevelId:'jieqiao'};
  const sandbox={window:{},location:{search:''},URLSearchParams,localStorage:{getItem:()=>JSON.stringify(transfer)}};
  vm.createContext(sandbox);vm.runInContext(levelSource,sandbox);return sandbox.window.LEVEL_05_JIEQIAO;
}

for(const route of ['julu','qinghe']){
  const level=load(route);
  for(const unit of level.units.filter(unit=>(unit.originalId??999)<256)){
    const portrait=portraits.get(unit.id);
    assert.ok(portrait,`${route}: missing portrait mapping for ${unit.name}`);
    assert.ok(fs.existsSync(path.join(root,...portrait.split('/'))),`${route}: missing portrait file for ${unit.name}`);
  }

  // The original map has a long northern infiltration route around the
  // mountains. Verify that Liu Bei can reach the granary without crossing
  // mountain, river, fence or any other impassable terrain.
  const start=level.units.find(unit=>unit.id==='liu');
  const goal=level.alternateVictory;
  const blocked=new Set(['hill','water','wall','cliff','gate','fence','house','fire','muddyWater']);
  const queue=[[start.x,start.y]],seen=new Set([`${start.x},${start.y}`]);
  while(queue.length){
    const [x,y]=queue.shift();
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=level.width||ny>=level.height||seen.has(key)||blocked.has(level.terrain[ny][nx]))continue;
      seen.add(key);queue.push([nx,ny]);
    }
  }
  assert.ok(seen.has(`${goal.x},${goal.y}`),`${route}: northern granary route is blocked`);
}

assert.ok(game.includes("const duelAttackNativeFacing={zhaoyun:'right'}"),'Zhao Yun duel attack facing is not declared');
assert.ok(game.includes('attackProgress!==null&&attackNative!==staticNative?-flipX:flipX'),'Zhao Yun duel does not correct the attack-strip direction');
assert.ok(game.includes('function portraitForUnit(u)'),'named portrait fallback is not wired');
assert.ok(game.includes("previewParams.has('zhaoyunDuelPreview')"),'Zhao Yun duel QA route is missing');

const map=fs.readFileSync(path.join(root,'assets','level-05-jieqiao','jieqiao-map-v3.webp'));
assert.equal(map.subarray(0,4).toString(),'RIFF');
assert.equal(map.subarray(8,12).toString(),'WEBP');
assert.ok(map.length<2_000_000,'Jieqiao aligned release map exceeds 2 MiB');

console.log('Jieqiao presentation verified: every named general has a portrait, Zhao Yun keeps facing during spear attacks, and Liu Bei can reach the northern granary on the original terrain route.');
