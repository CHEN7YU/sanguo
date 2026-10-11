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

const storyContext={window:{},location:{search:''},localStorage:{getItem:()=>null},URLSearchParams};
loadScript('story-data.js',storyContext);
const story=storyContext.window.STORY_BY_LEVEL.beihai;
check(Array.isArray(story)&&story.length>=20,'Beihai prebattle story is incomplete');
for(const required of ['曹操','糜竺','公孙瓒','赵云','管亥'])check(story.some(line=>line.speaker===required),`Story is missing ${required}`);

for(const relative of [
  level.battlefieldArt,'assets/level-06-beihai/portraits/guan-hai-v1.webp','assets/level-06-beihai/portraits/kong-rong-v1.webp',
  'assets/level-06-beihai/portraits/taishi-ci-v1.webp','assets/level-06-beihai/portraits/meng-su-v1.webp',
  'assets/level-06-beihai/animation/guan-hai/guan-hai-walk-v1.webp','assets/level-06-beihai/animation/taishi-ci/taishi-ci-attack-v1.webp',
  'assets/level-06-beihai/animation/beast/beast-death-v1.webp'
])check(fs.existsSync(path.join(root,relative)),`Missing Beihai asset: ${relative}`);

const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const leaderboard=fs.readFileSync(path.join(root,'leaderboard.js'),'utf8');
check(game.includes("levelIndex==='8' ? window.LEVEL_06_BEIHAI"),'Level 8 loader is missing');
check(game.includes("targetId==='beihai'?'8'"),'Beihai save routing is missing');
check(game.includes("level.nextLevelId==='beihai'?'8'"),'Jieqiao-to-Beihai campaign routing is missing');
check(game.includes('for(const update of event.terrainUpdates||[])'),'Runtime terrain update support is missing');
check(index.includes('data-select-level="8"')&&index.includes('level-06-beihai.js'),'Beihai menu or script include is missing');
check(leaderboard.includes("beihai: { name: '北海之战'"),'Beihai leaderboard rule is missing');

console.log(`Beihai verified: ${level.width}x${level.height}, ${level.units.length} units, ${story.length} story beats, gate/loot/duel/AI/save/leaderboard integration.`);
