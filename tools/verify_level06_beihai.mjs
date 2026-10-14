import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const check=(condition,message)=>{if(!condition)throw new Error(message)};
const loadScript=(file,context)=>vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});

const context={window:{},location:{search:''},localStorage:{getItem:()=>null}};
loadScript('level-06-beihai.js',context);
const level=context.window.LEVEL_06_BEIHAI;
check(level?.id==='beihai','Beihai level is not registered');
check(level.width===24&&level.height===20,'Beihai must use the original 24x20 grid');
check(level.terrain.length===20&&level.terrain.every(row=>row.length===24),'Beihai terrain dimensions are invalid');

const counts=level.terrain.flat().reduce((out,type)=>(out[type]=(out[type]||0)+1,out),{});
const expected={plain:167,forest:64,hill:88,water:44,bridge:5,wall:25,city:7,grass:76,village:1,gate:1,treasure:2};
for(const [type,count] of Object.entries(expected))check(counts[type]===count,`${type} count differs from HEXZMAP: ${counts[type]} != ${count}`);
check(level.terrain[2][2]==='gate','Original gate must begin closed at (2,2)');
check(level.maxTurns===30&&level.objectiveUnitId==='guanhai','Original turn limit or commander is wrong');

const byId=Object.fromEntries(level.units.map(unit=>[unit.id,unit]));
for(const [id,x,y] of [['liu',22,3],['guan',21,4],['zhang',20,5],['jian',22,5],['zhaoyun',21,2],['kongrong',3,0],['taishici',2,0],['mengsu',1,0],['guanhai',6,7]]){
  check(byId[id]?.x===x&&byId[id]?.y===y,`${id} deployment is wrong`);
}
check(byId.kongrong.aiType===2&&byId.taishici.aiType===2&&byId.mengsu.aiType===2,'North Sea defenders must begin in original AI2 wait mode');
check(byId.guanhai.aiType===6&&byId.guanhai.aiTarget===(7|(10<<8)),'Guan Hai original AI6 destination is wrong');
check(byId.guanhai.runtimeAiTarget===(10|(7<<8)),'Guan Hai must stop on reachable painted ground instead of entering the sealed hill pocket');
check(level.alliedAiAvoidsObjective===true,'Beihai allied AI must leave Guan Hai to the player');
check(level.objectiveAiTargetsPlayerOnly===true,'Guan Hai must engage Liu Bei army instead of fighting Beihai allied AI');
check(level.units.filter(unit=>unit.side==='enemy').length===13,'Original enemy deployment must contain 13 units');
check(level.units.filter(unit=>unit.troop==='beast').length===2,'Two beast trainers are required');

const gateEvent=level.areaEvents.find(event=>event.id==='beihai-open-gate');
check(gateEvent?.rect?.x1===7&&gateEvent.rect.y1===9&&gateEvent.rect.x2===19&&gateEvent.rect.y2===14,'Gate trigger rectangle differs from SNR1D');
check(gateEvent.terrainUpdates?.some(update=>update.x===2&&update.y===2&&update.type==='plain'),'Gate event must open (2,2)');
check(gateEvent.aiUpdates?.every(update=>update.aiType===1)&&gateEvent.aiUpdates.length===3,'Gate event must activate all three defenders');
check(level.areaEvents.some(event=>event.rect.x1===5&&event.rect.y1===11&&event.item==='premiumWine'),'Special wine hidden event is missing');
check(level.areaEvents.some(event=>event.rect.x1===17&&event.rect.y1===13&&event.item==='moraleScroll'),'Morale scroll hidden event is missing');
check(level.events.duel.attackerId==='zhaoyun'&&level.events.duel.defenderId==='guanhai'&&level.events.duel.endsBattle,'Original Zhao Yun vs Guan Hai duel is wrong');
check(level.events.battleReward===300,'Original gold reward must be 300');
check(level.battleTrack==='assets/audio/hulao-lubu-theme.mp3','Beihai must reuse the approved Hulao battle music');
const runtimeTerrain=level.terrain.map(row=>[...row]);
for(const update of level.paintedTerrainOverrides||[])runtimeTerrain[update.y][update.x]=update.type;
check(runtimeTerrain[10][18]==='village','Painted North Sea village must align to visible building at (18,10)');
check(runtimeTerrain[11][18]==='grass','Stale village trigger below the painted building must be removed from (18,11)');
check(runtimeTerrain[16][13]==='treasure','Painted southern North Sea treasure depot must align to visible building at (13,16)');
check(runtimeTerrain[17][13]==='plain','Stale treasure trigger below the painted building must be removed from (13,17)');
check(runtimeTerrain[5][11]==='treasure','Northern North Sea treasure depot must remain aligned at (11,5)');
for(const [x,y] of [[0,2],[14,3],[19,5],[20,8],[21,11],[23,14]])check(runtimeTerrain[y][x]==='water',`Painted river cell ${x},${y} must be impassable`);
for(const [x,y] of [[2,3],[20,9],[21,9],[20,10],[21,10]])check(runtimeTerrain[y][x]==='bridge',`Painted bridge cell ${x},${y} must remain passable`);
for(const [x,y] of [[13,6],[16,7],[18,9],[23,10]])check(runtimeTerrain[y][x]!=='water',`Painted land cell ${x},${y} must not retain stale river collision`);

const cardinal=[[1,0],[-1,0],[0,1],[0,-1]];
const reachable=(start,goal,blocked)=>{
  const queue=[start];
  const seen=new Set([start.join(',')]);
  while(queue.length){
    const [x,y]=queue.shift();
    if(x===goal[0]&&y===goal[1])return true;
    for(const [dx,dy] of cardinal){
      const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=level.width||ny>=level.height||seen.has(key)||blocked.has(runtimeTerrain[ny][nx]))continue;
      seen.add(key); queue.push([nx,ny]);
    }
  }
  return false;
};
const bossRuntime=[byId.guanhai.runtimeAiTarget&0xff,byId.guanhai.runtimeAiTarget>>8];
const ordinaryBlocked=new Set(['water','wall','hill']);
check(reachable([byId.liu.x,byId.liu.y],bossRuntime,ordinaryBlocked),'Player infantry must be able to reach Guan Hai runtime position without crossing water, wall, or mountain');
for(const unit of level.units)check(runtimeTerrain[unit.y][unit.x]!=='water',`${unit.id} must not deploy in painted river water`);

const storyContext={window:{},location:{search:''},localStorage:{getItem:()=>null},URLSearchParams};
loadScript('story-data.js',storyContext);
const story=storyContext.window.STORY_BY_LEVEL.beihai;
check(Array.isArray(story)&&story.length>=20,'Beihai prebattle story is incomplete');
for(const required of ['曹操','糜竺','公孙瓒','赵云','管亥'])check(story.some(line=>line.speaker===required),`Story is missing ${required}`);

for(const relative of [
  level.battlefieldArt,'assets/level-06-beihai/portraits/guan-hai-v1.webp','assets/level-06-beihai/portraits/kong-rong-v1.webp',
  'assets/level-06-beihai/portraits/taishi-ci-v1.webp','assets/level-06-beihai/portraits/meng-su-v1.webp',
  'assets/level-06-beihai/animation/guan-hai/guan-hai-walk-v2.webp','assets/level-06-beihai/animation/taishi-ci/taishi-ci-attack-v2.webp',
  'assets/level-06-beihai/animation/beast/beast-death-v1.webp'
])check(fs.existsSync(path.join(root,relative)),`Missing Beihai asset: ${relative}`);

const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const leaderboard=fs.readFileSync(path.join(root,'leaderboard.js'),'utf8');
check(game.includes("levelIndex==='8' ? window.LEVEL_06_BEIHAI"),'Level 8 loader is missing');
check(game.includes("targetId==='beihai'?'8'"),'Beihai save routing is missing');
check(game.includes("level.nextLevelId==='beihai'?'8'"),'Jieqiao-to-Beihai campaign routing is missing');
check(game.includes("level.alliedAiAvoidsObjective?allEnemies.filter(u=>u.id!==objectiveUnitId):allEnemies"),'Allied AI objective-avoidance support is missing');
check(game.includes("level.objectiveAiTargetsPlayerOnly&&e.id===objectiveUnitId?allAllies.filter(u=>u.side==='ally'):allAllies"),'Objective commander player-only targeting support is missing');
check(game.includes("caster.side==='guest'&&level.alliedAiAvoidsObjective&&target.id===objectiveUnitId"),'Allied strategies must also avoid the objective commander');
check(game.includes("caster.id===objectiveUnitId&&level.objectiveAiTargetsPlayerOnly&&target.side==='guest'"),'Objective commander strategies must also ignore allied NPCs');
check(game.includes('for(const update of event.terrainUpdates||[])'),'Runtime terrain update support is missing');
check(index.includes('data-select-level="8"')&&index.includes('level-06-beihai.js'),'Beihai menu or script include is missing');
check(leaderboard.includes("beihai: { name: '北海之战'"),'Beihai leaderboard rule is missing');

console.log(`Beihai verified: ${level.width}x${level.height}, ${level.units.length} units, ${story.length} story beats, gate/loot/duel/AI/save/leaderboard integration.`);
