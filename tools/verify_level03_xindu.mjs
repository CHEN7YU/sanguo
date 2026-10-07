import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'level-03-xindu.js'),'utf8'),context);
const level=context.window.LEVEL_03_XINDU;

assert.equal(level.id,'xindu');
assert.equal(level.width,22);
assert.equal(level.height,11);
assert.equal(level.maxTurns,30);
assert.equal(level.objectiveUnitId,'chunyu');
const sourceMap=JSON.parse(fs.readFileSync(path.join(root,'docs/original-audit/level-03-xindu-map.json'),'utf8'));
assert.equal(JSON.stringify(level.terrainCodes),JSON.stringify(sourceMap.terrain_codes));
assert.equal(level.units.length,17);
assert.equal(level.units.filter(u=>u.side==='ally').length,4);
assert.equal(level.units.filter(u=>u.side==='guest').length,3);
assert.equal(level.units.filter(u=>u.side==='enemy').length,10);

const expected=[
  [0,21,7,1],[1,20,6,2],[2,20,8,2],[82,21,5,3],
  [220,1,0,4],[245,3,0,4],[244,0,0,4],[105,1,4,8],
  [256,8,3,4],[257,4,6,4],[258,7,1,4],[292,7,4,1],[293,5,4,1],
  [274,0,4,3],[310,4,7,2],[311,6,3,2],[328,3,3,3]
];
for(const [id,x,y,lvl] of expected){
  const u=level.units.find(q=>q.originalId===id);
  assert.ok(u,`missing original unit ${id}`);
  assert.deepEqual([u.x,u.y,u.level],[x,y,lvl],`deployment mismatch ${id}`);
}
assert.equal(JSON.stringify(level.alternateVictory),JSON.stringify({unitId:'liu',x:1,y:3,exp:50,type:'gate'}));
assert.equal(level.terrain[3][1],'plain');
assert.equal(level.terrain[2][1],'gate');
const runtimeTerrain=level.terrain.map(row=>[...row]);
for(const tile of level.paintedTerrainOverrides||[])runtimeTerrain[tile.y][tile.x]=tile.type;
assert.equal(runtimeTerrain[2][1],'city');
assert.equal(runtimeTerrain[6][12],'bridge');
assert.equal(runtimeTerrain[7][12],'bridge');
assert.equal(runtimeTerrain[8][12],'grass');
const blocked=new Set(['water','hill','wall','cliff','gate','fence','house','fire','muddyWater']);
const route=[[21,7],[21,6],[20,6],[19,6],[18,6],[17,6],[16,6],[15,6],[14,6],[13,6],[12,6],[12,7],[12,8],[11,8],[10,8],[9,8],[9,7]];
for(const [x,y] of route)assert.ok(!blocked.has(runtimeTerrain[y][x]),`central bridge treasure route blocked at ${x},${y}`);
const cityRoute=[[1,3],[1,2],[1,1],[1,0],[2,0],[3,0],[4,0],[5,0]];
for(const [x,y] of cityRoute)assert.ok(!blocked.has(runtimeTerrain[y][x]),`north-west city entrance blocked at ${x},${y}`);
const connected=new Set(['21,7']),queue=[[21,7]];
while(queue.length){
  const [x,y]=queue.shift();
  for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
    const key=`${nx},${ny}`;
    if(runtimeTerrain[ny]?.[nx]&&!blocked.has(runtimeTerrain[ny][nx])&&!connected.has(key)){connected.add(key);queue.push([nx,ny])}
  }
}
for(const [x,y] of cityRoute)assert.ok(connected.has(`${x},${y}`),`north-west city remains disconnected at ${x},${y}`);
assert.equal(runtimeTerrain[7][9],'treasure');
assert.equal(level.events.duel.attackerId,'zhang');
assert.equal(level.events.duel.defenderId,'chunyu');
assert.equal(level.events.battleReward,200);
assert.equal(level.timedEvents.find(e=>e.once==='xindu-turn3-bandit-advance').unitId,'e7');

for(const asset of [
  'assets/level-03-xindu/xindu-map-v1.webp',
  'assets/level-03-xindu/portraits/chunyu-qiong-v1.webp',
  'assets/level-03-xindu/portraits/fan-gong-v1.webp',
  'assets/level-03/thousand-suns-dw7th-mix.opus'
])assert.ok(fs.statSync(path.join(root,asset)).size>1000,`missing ${asset}`);

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const story=fs.readFileSync(path.join(root,'story-data.js'),'utf8');
assert.ok(html.includes('level-03-xindu.js'));
assert.ok(html.includes('data-select-level="4"'));
assert.ok(game.includes("levelIndex==='4' ? window.LEVEL_03_XINDU"));
assert.ok(game.includes("targetId==='xindu'?'4'"));
assert.ok(game.includes('function isSpecialPassable'));
assert.ok(game.includes("victory(false,'alternate')"));
assert.ok(story.includes("'xindu': window.XINDU_PRE_BATTLE_STORY"));
assert.ok(story.includes('淳于琼，你去信都城'));
assert.ok(story.includes('向信都城进军吧'));

console.log('Xindu verification passed: original 22x11 topology and deployment, branch story, three defenders, turn events, duel, dual victory paths, portraits and compressed map.');
