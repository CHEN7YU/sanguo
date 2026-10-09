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
assert.equal(JSON.stringify(level.paintedDeploymentOverrides),JSON.stringify([
  {unitId:'guan',fromX:20,fromY:6,x:20,y:7},
  {unitId:'jian',fromX:21,fromY:5,x:20,y:5}
]));
assert.equal(JSON.stringify(level.alternateVictory),JSON.stringify({unitId:'liu',x:1,y:3,exp:50,type:'gate'}));
assert.equal(level.terrain[3][1],'plain');
assert.equal(level.terrain[2][1],'gate');
const runtimeTerrain=level.terrain.map(row=>[...row]);
for(const tile of level.paintedTerrainOverrides||[])runtimeTerrain[tile.y][tile.x]=tile.type;
assert.equal(runtimeTerrain[2][1],'city');
const paintedBridges=[[7,5],[12,6],[12,7],[6,9]];
for(const [x,y] of paintedBridges)assert.equal(runtimeTerrain[y][x],'bridge',`painted bridge missing at ${x},${y}`);
const paintedWater=[
  [8,5],[21,5],
  [6,6],[7,6],[8,6],[9,6],[10,6],[18,6],[19,6],[20,6],
  [7,7],[10,7],[11,7],[13,7],[14,7],[15,7],[16,7],[17,7],[18,7],
  [7,8],[14,8],[15,8],
  [1,9],[2,9],[4,9],[5,9],[7,9],
  [0,10],[1,10],[7,10],[8,10]
];
for(const [x,y] of paintedWater)assert.equal(runtimeTerrain[y][x],'water',`painted river must be impassable at ${x},${y}`);
for(const [x,y] of [[4,7],[4,8],[13,9],[14,9]])assert.notEqual(runtimeTerrain[y][x],'bridge',`invisible source bridge remains passable at ${x},${y}`);
assert.equal(runtimeTerrain[8][12],'grass');
const blocked=new Set(['water','hill','wall','cliff','gate','fence','house','fire','muddyWater']);
const route=[[21,7],[20,7],[19,7],[19,8],[18,8],[17,8],[16,8],[16,9],[15,9],[14,9],[13,9],[12,9],[11,9],[10,9],[9,9],[9,8],[9,7]];
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
assert.ok(game.includes('const loadedMap=applyPaintedTerrainOverrides(save.map.map'), 'old saves must receive the corrected painted collision layer');
assert.ok(game.includes('applyPaintedDeploymentOverride({...u,spawnOrder:u.spawnOrder??i'), 'old saves must move original water spawns onto dry painted cells');
assert.ok(game.includes("victory(false,'alternate')"));
assert.ok(story.includes("'xindu': window.XINDU_PRE_BATTLE_STORY"));
assert.ok(story.includes('淳于琼，你去信都城'));
assert.ok(story.includes('向信都城进军吧'));

console.log('Xindu verification passed: original 22x11 topology and deployment, branch story, three defenders, turn events, duel, dual victory paths, portraits and compressed map.');
