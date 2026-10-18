import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sandbox={window:{},location:{search:''},URLSearchParams,localStorage:{getItem:()=>null}};
vm.createContext(sandbox);
vm.runInContext(read('level-09-taishan.js'),sandbox,{filename:'level-09-taishan.js'});
const level=sandbox.window.LEVEL_09_TAISHAN;
assert.ok(level,'Taishan level is not registered');
assert.equal(level.id,'taishan');
assert.equal(level.width,32); assert.equal(level.height,16); assert.equal(level.maxTurns,40);
assert.equal(level.terrain.length,16); assert.ok(level.terrain.every(row=>row.length===32));

const audit=JSON.parse(read('docs/original-audit/level-09-taishan-map-row-major.json'));
assert.equal(audit.storage_order,'row-major');
assert.deepEqual(JSON.parse(JSON.stringify(level.terrainCodes)),audit.terrain_codes,'runtime terrain differs from decoded DOS tactical layer');
const structures=new Map([['10,0','treasure'],['4,2','fort'],['17,3','village'],['8,8','treasure'],['13,11','village']]);
for(const [coord,type] of structures){const[x,y]=coord.split(',').map(Number);assert.equal(level.terrain[y][x],type,`${coord} must be ${type}`)}

const allies=level.units.filter(unit=>unit.side==='ally'), enemies=level.units.filter(unit=>unit.side==='enemy');
assert.equal(allies.length,7); assert.equal(enemies.length,12);
assert.deepEqual(JSON.parse(JSON.stringify(allies.map(({x,y})=>[x,y]))),[[23,11],[22,11],[22,12],[24,10],[25,10],[25,11],[21,10]]);
assert.deepEqual(JSON.parse(JSON.stringify(enemies.map(({x,y})=>[x,y]))),[[4,2],[26,1],[14,5],[15,5],[9,2],[7,1],[4,1],[5,2],[25,2],[5,1],[24,3],[8,3]]);
const runtimeTerrain=level.terrain.map(row=>[...row]);
for(const tile of level.paintedTerrainOverrides||[])runtimeTerrain[tile.y][tile.x]=tile.type;
const expectedCollisionRows=[
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC','CF...FF.CCCCCCC.FFCCCCFCCCF..CFC','CF...F..CCCCCCC..FCFCFC.CCF...CC','CFF.FFF..FCCFCF..CFCCCFC.CF.FFCC',
  'CCC.CCF...C..CC..F.CFCCF.CC.CCCC','CCF..CF.FFCCF.FC.FFCCFCC.F..FCFC','CCF....CCCCCCC.C..CFFCCC.CC.CCFC','CFF...FCCFFCCCCF...CCCCF.CF.FCCC',
  'CFC..FFFFCCCCFCC..F.CCFCF..CCCCC','C......CCCFFCFCF...F..FFCC.FCCCC','C.......F.FCCCCF...FF...FC..CCCC','CCF.......CFCCF..FFFF....CC.FCCC',
  'CCCC.........FF..FF....FFC..FFFC','CCCCCFF.............F...CC..FCCC','CCCFCCCFCF.....F....F.....CCFCCC','CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'
];
assert.deepEqual(JSON.parse(JSON.stringify(level.paintedCollisionRows)),expectedCollisionRows,'visual collision mask changed');
assert.equal(level.paintedTerrainOverrides.length,32*16,'the complete painted battlefield must be explicitly classified');
const runtimeStructures=new Map([['4,2','fort'],['17,3','village'],['19,7','treasure'],['8,11','treasure'],['15,12','village']]);
for(let y=0;y<16;y++)for(let x=0;x<32;x++){
  const cell=expectedCollisionRows[y][x],expected=runtimeStructures.get(`${x},${y}`)||(cell==='C'?'cliff':cell==='F'?'forest':'rough');
  assert.equal(runtimeTerrain[y][x],expected,`painted terrain mismatch at ${x},${y}`);
}
const runtimeUnit=unit=>{const placement=(level.paintedDeploymentOverrides||[]).find(item=>item.unitId===unit.id&&item.fromX===unit.x&&item.fromY===unit.y);return placement?{...unit,x:placement.x,y:placement.y}:unit};
const runtimeAllies=allies.map(runtimeUnit);
assert.deepEqual(JSON.parse(JSON.stringify(runtimeAllies.map(({id,x,y})=>[id,x,y]))),[
  ['liu',8,12],['guan',10,12],['zhang',12,12],['jian',8,13],['zhaoyun',10,13],['sunqian',12,13],['pangong',13,13]
]);
assert.equal(new Set(runtimeAllies.map(({x,y})=>`${x},${y}`)).size,runtimeAllies.length,'runtime allied deployment overlaps');
for(const unit of runtimeAllies)assert.equal(runtimeTerrain[unit.y][unit.x],'rough',`${unit.name} must deploy on visible open ground`);
const alliedCells=new Set(runtimeAllies.map(({x,y})=>`${x},${y}`));
for(const unit of runtimeAllies.filter(unit=>unit.troop==='cavalry')){
  const exits=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[unit.x+dx,unit.y+dy]).filter(([x,y])=>runtimeTerrain[y]?.[x]==='rough'&&!alliedCells.has(`${x},${y}`));
  assert.ok(exits.length,`${unit.name} is boxed in by allies or painted forest at deployment`);
}
const paintedCliffs=[];for(let y=0;y<16;y++)for(let x=0;x<32;x++)if(expectedCollisionRows[y][x]==='C'&&!runtimeStructures.has(`${x},${y}`))paintedCliffs.push([x,y]);
for(const unit of [...allies,...enemies])for(const [x,y] of paintedCliffs){
  const rescued=runtimeUnit({id:unit.id,x,y}),target=runtimeUnit(unit);
  assert.deepEqual([rescued.x,rescued.y],[target.x,target.y],`${unit.name} save migration missing at ${x},${y}`);
}
const runtimeEnemies=enemies.map(runtimeUnit);
assert.deepEqual(JSON.parse(JSON.stringify(runtimeEnemies.map(({id,x,y})=>[id,x,y]))),[
  ['liming',4,2],['banditGuard',16,7],['banditVanguard1',16,4],['banditVanguard2',16,5],['banditLeft1',9,3],['banditLeft2',7,1],['banditLeft3',4,1],['banditReserve',5,2],['beastRight',17,7],['beastLeft',5,1],['martialRight',18,7],['martialLeft',8,3]
]);
const liMing=level.units.find(unit=>unit.id==='liming');
assert.ok(liMing); assert.equal(liMing.name,'李明'); assert.equal(liMing.gender,'female');
assert.equal(liMing.originalId,375); assert.equal(liMing.level,12); assert.equal(liMing.troop,'beast');
assert.equal(level.commanderDefeatEndsBattle,false); assert.equal(level.victoryCondition,'eliminateAllEnemies');

const blocked=new Set(['water','cliff','wall','fence','void','mountain']);
const occupied=new Set();
for(const unit of level.units){assert.ok(!blocked.has(level.terrain[unit.y][unit.x]),`${unit.name} is on blocked terrain`);const k=`${unit.x},${unit.y}`;assert.ok(!occupied.has(k),`deployment overlap at ${k}`);occupied.add(k)}
const queue=[{x:runtimeAllies[0].x,y:runtimeAllies[0].y}], reached=new Set(queue.map(({x,y})=>`${x},${y}`));
for(let i=0;i<queue.length;i++){const{x,y}=queue[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(nx>=0&&ny>=0&&nx<32&&ny<16&&!reached.has(k)&&!blocked.has(runtimeTerrain[ny][nx])){reached.add(k);queue.push({x:nx,y:ny})}}}
for(const coord of runtimeStructures.keys())assert.ok(reached.has(coord),`${coord} is unreachable`);
for(const unit of [...runtimeAllies,...runtimeEnemies])assert.ok(reached.has(`${unit.x},${unit.y}`),`${unit.name} is isolated at runtime`);
assert.ok([[3,2],[5,2],[4,1],[4,3]].some(([x,y])=>reached.has(`${x},${y}`)),'no reachable tile is adjacent to Li Ming');

// Cavalry cannot enter forest, so the visible dirt-road network must remain
// connected without relying on forest shortcuts. This catches the exact class
// of regression where a painted road is marked forest or cliff.
const cavalryBlocked=new Set([...blocked,'forest']);
const cavalryQueue=[{x:10,y:12}],cavalryReached=new Set(['10,12']);
for(let i=0;i<cavalryQueue.length;i++){const{x,y}=cavalryQueue[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(nx>=0&&ny>=0&&nx<32&&ny<16&&!cavalryReached.has(k)&&!cavalryBlocked.has(runtimeTerrain[ny][nx])){cavalryReached.add(k);cavalryQueue.push({x:nx,y:ny})}}}
for(const coord of ['4,2','8,11','15,12','16,4','16,5','16,7','17,3','18,7','19,7'])assert.ok(cavalryReached.has(coord),`visible cavalry road is broken before ${coord}`);
assert.ok(cavalryReached.size>=115,`painted cavalry road network is unexpectedly small: ${cavalryReached.size}`);

assert.deepEqual(Object.keys(level.events.loot).sort(),['19,7','8,11']);
assert.equal(level.events.loot['19,7'].item,'rockScroll'); assert.equal(level.events.loot['8,11'].item,'bomb');
assert.deepEqual(JSON.parse(JSON.stringify(level.paintedTerrainMigrations)),[
  {fromX:10,fromY:0,x:19,y:7,type:'treasure'},{fromX:8,fromY:8,x:8,y:11,type:'treasure'}
]);
assert.equal(level.events.battleReward,400); assert.equal(level.events.postBattleReward,500);
const recruit=level.areaEvents.find(event=>event.id==='taishan-recruit-li-ming');
assert.ok(recruit); assert.equal(recruit.unitId,'liu'); assert.equal(recruit.adjacentToUnitId,'liming');
assert.equal(recruit.recruitUnitId,'liming'); assert.equal(recruit.levelUpUnitId,'liu'); assert.equal(recruit.restoreRecruited,true);

vm.runInContext(read('story-data.js'),sandbox,{filename:'story-data.js'});
assert.ok(Array.isArray(sandbox.window.STORY_BY_LEVEL.taishan)&&sandbox.window.STORY_BY_LEVEL.taishan.length>=8);
assert.ok(sandbox.window.NPC_DIALOGUE_BY_LEVEL.taishan?.['关羽']);
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.window.NPC_DIALOGUE_BY_LEVEL.taishan['关羽'])),['兄长，各军已经整备妥当。','只候兄长一声号令。']);
assert.ok(!sandbox.window.STORY_BY_LEVEL.taishan.some(line=>line.speaker==='关羽'&&line.text.includes('整备妥当')),'Guan Yu readiness line must not repeat after free-roam departure');
assert.ok(sandbox.window.STORY_BY_LEVEL.taishan.some(line=>line.speaker==='史官'&&line.text==='诸将依令归队，厅外号角齐鸣。'),'Taishan departure transition is missing');
assert.ok(!JSON.stringify(sandbox.window.STORY_BY_LEVEL.taishan).includes('七军')&&!JSON.stringify(sandbox.window.NPC_DIALOGUE_BY_LEVEL.taishan).includes('七军'),'Taishan dialogue must say 各军, not 七军');
const game=read('game.js'),html=read('index.html'),audio=read('audio-config.js'),board=read('leaderboard.js'),xiaopei=read('level-08-xiaopei.js');
for(const token of ["level.id==='taishan'","saveTaishanPostBattle()","xiaqiuSkipped:true","pengchengSkipped:true","targetId==='taishan'?'11'","level.nextLevelId==='taishan'?'11'"])assert.ok(game.includes(token),`game runtime missing ${token}`);
assert.ok(xiaopei.includes("nextLevelId:'taishan'"));
for(const token of ['level-09-taishan.js','level-09-taishan-animation-bounds.js','data-select-level="11"','data-leaderboard-level="taishan"'])assert.ok(html.includes(token),`index missing ${token}`);
assert.ok(audio.includes("'taishan': 'assets/audio/langrisser-ii-ones-side.opus'"));
assert.ok(board.includes("taishan: { name: '泰山之战'"));

const assetRoot=path.join(root,'assets','level-09-taishan');
const required=['taishan-map-v2.webp','units/li-ming-unit-v1.webp','portraits/li-ming-remaster-v1.webp','animation/li-ming/li-ming-walk-v1.webp','animation/li-ming/li-ming-attack-v1.webp','animation/li-ming/li-ming-critical-v1.webp','animation/li-ming/li-ming-hurt-v1.webp','animation/li-ming/li-ming-block-v1.webp','animation/li-ming/li-ming-death-v1.webp'];
let bytes=0; for(const rel of required){const file=path.join(assetRoot,...rel.split('/'));assert.ok(fs.existsSync(file),`missing runtime asset ${rel}`);bytes+=fs.statSync(file).size}
assert.ok(bytes<=6*1024*1024,`Taishan runtime assets exceed 6 MiB: ${bytes}`);
for(const rel of ['taishan-clean-terrain-master-v1.png','li-ming-portrait-master-v1.png','li-ming-unit-master-v1.png','li-ming-walk-master-v1.png','li-ming-action-master-v1.png','li-ming-damage-master-v1.png','li-ming-original-face-230.png'])assert.ok(fs.existsSync(path.join(root,'assets-master','level-09-taishan',rel)),`missing master ${rel}`);

console.log(`Taishan verified: exact 32x16 DOS terrain, 7 allies/12 enemies, female Li Ming identity and recruitment, rewards/routing, ${required.length} runtime assets (${(bytes/1024/1024).toFixed(2)} MiB).`);
