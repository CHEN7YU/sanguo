import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const context={window:{},URLSearchParams,location:{search:''},localStorage:{getItem:()=>null}};
vm.createContext(context);
vm.runInContext(read('level-10-huainan.js'),context,{filename:'level-10-huainan.js'});
vm.runInContext(read('story-data.js'),context,{filename:'story-data.js'});
const level=context.window.LEVEL_10_HUAINAN;
assert.equal(level.id,'huainan');
assert.equal(level.name,'淮南之战');
assert.equal(level.width,24);assert.equal(level.height,24);assert.equal(level.maxTurns,30);
assert.equal(level.victoryCondition,'eliminateAllEnemies');
assert.equal(level.objectiveUnitId,'jiling');
assert.equal(level.commanderDefeatEndsBattle,false);

const audit=JSON.parse(read('docs/original-audit/level-10-huainan-map.json'));
assert.deepEqual(JSON.parse(JSON.stringify(level.terrainCodes)),audit.terrain_codes,'runtime terrain must match HEXZMAP.R3 section 13');
const counts=level.terrainCodes.flat().reduce((out,code)=>(out[code]=(out[code]||0)+1,out),{});
for(const [hex,data] of Object.entries(audit.terrain_counts))assert.equal(counts[parseInt(hex,16)],data.count,`terrain ${hex}`);
assert.equal(level.terrain[2][0],'fort');
assert.equal(level.terrain[22][2],'treasure');
assert.equal(level.terrain[12][17],'village');
assert.equal(level.terrain[19][18],'village');
for(let y=13;y<=17;y++)assert.equal(level.terrain[y][18],'bridge');
assert.equal(level.structureScaleByType?.village,.68,'Huainan village art must stay within the original land cells instead of covering the river and bridge');
assert.equal(level.viewProjection.rowShift,undefined,'Huainan grid rows must never be shifted independently from their neighbours');
const runtime=level.terrain.map(row=>[...row]);
for(const override of level.paintedTerrainOverrides)runtime[override.y][override.x]=override.type;
const movementEdgeKey=(x1,y1,x2,y2)=>x1<x2||x1===x2&&y1<y2?`${x1},${y1}>${x2},${y2}`:`${x2},${y2}>${x1},${y1}`;
const blockedMovementEdges=new Set(level.blockedMovementEdges.map(edge=>movementEdgeKey(...edge)));
const expectedRiverBands=new Map([
  [0,[[2,4]]],[1,[[3,7]]],[2,[[4,8]]],[3,[[6,9]]],[4,[[7,10]]],[5,[[8,11]]],[6,[[9,11]]],[7,[[10,12]]],
  [8,[[11,13]]],[9,[[12,13]]],[10,[[12,14]]],[11,[[13,17]]],[12,[[15,17],[19,23]]],[13,[[19,23]]]
]);
for(const [y,bands] of expectedRiverBands)for(const [x1,x2] of bands)for(let x=x1;x<=x2;x++)assert.equal(runtime[y][x],'water',`painted river cell ${x},${y} must be impassable`);
for(let y=12;y<=17;y++)assert.equal(runtime[y][18],'bridge',`painted bridge cell 18,${y} must stay passable`);
for(let y=13;y<=17;y++)assert.equal(runtime[y][17],'plain',`dry square left of the southern bridge must stay passable at 17,${y}`);
assert.equal(runtime[12][17],'water','the former village cell is visibly river in the remaster');
assert.equal(runtime[10][19],'village','the northern village must sit on the dry bridge approach');
assert.deepEqual(JSON.parse(JSON.stringify(level.paintedTerrainMigrations)),[{fromX:17,fromY:12,x:19,y:10,type:'village'}]);
const movementRules={plain:[1,1,1,1],water:[Infinity,Infinity,Infinity,Infinity],bridge:[1,1,1,1],village:[2,2,2,2]};
for(const [y,bands] of expectedRiverBands)for(const [x1,x2] of bands)for(let x=x1;x<=x2;x++)assert.equal(Number.isFinite(movementRules[runtime[y][x]][1]),false,`cavalry must not enter painted water ${x},${y}`);

const movementClassByTroop={infantry:0,archer:0,transport:0,cavalry:1,heavyCavalry:1,support:2,martial:3,bandit:3,beast:3};
const terrainMovement={
  plain:[1,1,1,1],forest:[1,Infinity,2,1],hill:[Infinity,Infinity,Infinity,1],water:[Infinity,Infinity,Infinity,Infinity],
  bridge:[1,1,1,1],wall:[Infinity,Infinity,Infinity,Infinity],city:[1,1,1,1],grass:[1,1,1,1],village:[2,2,2,2],
  cliff:[Infinity,Infinity,Infinity,Infinity],gate:[Infinity,Infinity,Infinity,Infinity],rough:[1,2,2,1],fence:[Infinity,Infinity,Infinity,Infinity],
  fort:[2,3,2,2],camp:[2,3,2,2],supply:[2,3,2,2],treasure:[2,3,2,2],house:[Infinity,Infinity,Infinity,Infinity],
  fire:[Infinity,Infinity,Infinity,Infinity],muddyWater:[Infinity,Infinity,Infinity,Infinity]
};
function floodFrom(start,troop){
  const movementClass=movementClassByTroop[troop]??0,seen=new Set([`${start.x},${start.y}`]),queue=[[start.x,start.y]];
  while(queue.length){
    const [x,y]=queue.shift();
    for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
      const key=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=level.width||ny>=level.height||seen.has(key))continue;
      if(blockedMovementEdges.has(movementEdgeKey(x,y,nx,ny)))continue;
      if(!Number.isFinite(terrainMovement[runtime[ny][nx]]?.[movementClass]))continue;
      seen.add(key);queue.push([nx,ny]);
    }
  }
  return seen;
}
const strategicSites=[];
for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++)if(['camp','fort','treasure','village'].includes(runtime[y][x]))strategicSites.push({x,y,type:runtime[y][x]});
assert.equal(strategicSites.filter(site=>site.type==='camp').length,8,'all eight original Huainan camps must remain on the runtime map');
for(const id of ['liu','guan','mizhu','pangong']){
  const actor=level.units.find(row=>row.id===id),reachable=floodFrom(actor,actor.troop);
  for(const site of strategicSites)assert.ok(reachable.has(`${site.x},${site.y}`),`${actor.name} cannot reach ${site.type} at ${site.x},${site.y}`);
}
assert.notEqual(runtime[14][2],'fence','northwest camp entrance 2,14 must remain open');
assert.notEqual(runtime[14][3],'fence','northwest camp entrance 3,14 must remain open');
for(const [x,y] of [[4,14],[5,14],[6,14],[7,14],[7,15],[7,16],[7,17],[7,18],[7,20],[7,22],[7,23]])assert.notEqual(runtime[y][x],'fence',`painted open ground ${x},${y} must not inherit the old DOS fence`);
for(const [x,y] of [[0,14],[1,14],...[14,15,16,18,19,20,21].map(y=>[8,y]),[9,18],[1,20],[1,21],[4,21],[5,21],[6,21],[7,21]])assert.equal(runtime[y][x],'fence',`painted palisade or tower ${x},${y} must be impassable`);
for(let x=2;x<=7;x++)assert.ok(blockedMovementEdges.has(movementEdgeKey(x,14,x,15)),`north camp wall edge ${x},14-${x},15 must block crossing`);
for(const edge of [[1,18,2,18],[1,19,2,19],[2,19,2,20],[3,20,4,20]])assert.ok(blockedMovementEdges.has(movementEdgeKey(...edge)),`southwest camp fence edge ${edge.join(',')} missing`);
assert.equal(blockedMovementEdges.has(movementEdgeKey(3,19,3,20)),false,'the painted gate above camp 3,20 must stay open');
for(const [x,y] of [[9,17],[8,17],[7,17],[2,21],[3,21],[2,22],[3,22]])assert.ok(!['fence','wall','cliff','water','muddyWater'].includes(runtime[y][x]),`painted camp entrance ${x},${y} must be passable`);
for(const edge of [[9,17,8,17],[8,17,7,17],[2,21,2,22],[3,21,3,22]])assert.equal(blockedMovementEdges.has(movementEdgeKey(...edge)),false,`painted camp gate edge ${edge.join(',')} must stay open`);
for(const troop of ['infantry','cavalry','support','martial']){
  assert.ok(floodFrom({x:9,y:17},troop).has('7,17'),`${troop} cannot enter the southwest camp through its painted east gate`);
  assert.ok(floodFrom({x:3,y:22},troop).has('3,20'),`${troop} cannot enter the southwest camp through its painted south gate`);
}

const unit=id=>level.units.find(row=>row.id===id);
const expectedInitial={jiling:[18,2,20,'heavyCavalry'],lejiu:[15,17,20,'infantry'],chenji:[14,4,19,'infantry'],yuanInf1:[11,15,20,'infantry'],yuanInf2:[11,6,21,'infantry'],yuanCav1:[11,9,20,'cavalry'],yuanCav2:[11,4,21,'cavalry'],yuanArch1:[11,18,19,'archer'],yuanArch2:[10,16,19,'archer'],yuanArch3:[11,3,18,'archer'],yuanBand:[11,1,21,'support'],yuanMartial:[11,7,19,'martial']};
for(const [id,[levelNo,x,y,troop]] of Object.entries(expectedInitial)){const row=unit(id);assert.ok(row,`${id} missing`);assert.equal(row.level,levelNo);assert.equal(row.x,x);assert.equal(row.y,y);assert.equal(row.troop,troop);assert.equal(row.side,'enemy')}
assert.deepEqual(JSON.parse(JSON.stringify(level.paintedDeploymentOverrides)),[
  {unitId:'yuanInf2',fromX:6,fromY:21,x:6,y:20},
  {unitId:'yuanCav2',fromX:4,fromY:21,x:4,y:20},
  {unitId:'yuanBand',fromX:1,fromY:21,x:3,y:21}
]);
for(const placement of level.paintedDeploymentOverrides)assert.notEqual(runtime[placement.y][placement.x],'fence',`${placement.unitId} must be moved off the painted palisade`);
const expectedReserve={chengong:[18,11,1],zhangliao:[17,11,2],weixu:[14,12,1],songxian:[14,10,2],lvCav1:[11,9,0],lvCav2:[10,11,0],lvCav3:[11,13,0],lvMartial:[11,13,2],lvInf:[10,9,1],lvBandit:[11,14,1]};
for(const [id,[levelNo,x,y]] of Object.entries(expectedReserve)){const row=unit(id);assert.ok(row,`${id} missing`);assert.equal(row.side,'reserve');assert.equal(row.level,levelNo);assert.equal(row.x,x);assert.equal(row.y,y)}
const turn6=level.timedEvents.find(event=>event.turn===6);
assert.ok(turn6);assert.equal(turn6.spawns.length,10);assert.equal(turn6.activateUnitIds.length,12);
assert.equal(turn6.activateLog,'第6回合：袁术军与吕布军开始全面追击');
assert.ok(turn6.dialogue.some(line=>line.text.includes('徐州')));
assert.equal(turn6.battleMusicAfter,'assets/audio/langrisser-ii-leon.opus','Lu Bu reinforcement must permanently switch Huainan battle music to Leon');

assert.deepEqual(JSON.parse(JSON.stringify(level.alternateVictory)),{unitId:'liu',x:0,y:2,minTurn:6,exp:50,goldReward:0,label:'刘备撤至西北鹿砦',log:'刘备撤至西北鹿砦，全体存活部队获得经验50'});
const approach=level.areaEvents.find(event=>event.id==='huainan-retreat-warning');
assert.deepEqual(JSON.parse(JSON.stringify(approach.rect)),{x1:3,y1:10,x2:9,y2:13});
assert.equal(approach.aiUpdates.length,22);assert.ok(approach.aiUpdates.every(update=>update.aiType===3&&update.aiTarget===0));
assert.deepEqual(JSON.parse(JSON.stringify(level.events.loot['2,22'])),{item:'fireScroll',amount:1});
assert.equal(level.events.battleReward,400);assert.equal(level.events.victoryMusicId,16);
assert.equal(level.events.duel.attackerId,'guan');assert.equal(level.events.duel.defenderId,'zhangliao');assert.equal(level.events.duel.endsBattle,false);

assert.ok(Array.isArray(context.window.HUAINAN_CONTINUOUS_STORY)&&context.window.HUAINAN_CONTINUOUS_STORY.length>=8);
assert.ok(Array.isArray(context.window.HUAINAN_LEVEL_SELECT_STORY)&&context.window.HUAINAN_LEVEL_SELECT_STORY.length>context.window.HUAINAN_CONTINUOUS_STORY.length);
assert.ok(context.window.HUAINAN_CONTINUOUS_STORY.some(line=>line.location==='淮南议事厅'));
const aftermath=context.window.HUAINAN_POST_BATTLE_STORY;
assert.ok(Array.isArray(aftermath.normal)&&Array.isArray(aftermath.alternate),'both Huainan victory branches need post-battle stories');
assert.equal(aftermath.normal[0].speaker,'张飞','eliminate-all victory must open with Zhang Fei confronting Lu Bu');
assert.ok(aftermath.normal[0].text.includes('吕布这个畜生'),'eliminate-all victory must keep Zhang Fei outburst');
assert.ok(aftermath.normal[0].setup?.some(actor=>actor.name==='张飞'),'Zhang Fei must be staged on screen for the normal-victory outburst');
assert.ok(aftermath.alternate.some(line=>line.speaker==='张飞'&&line.text.includes('吕布这个畜生')),'retreat victory must keep the same Zhang Fei outburst');
assert.ok(context.window.NPC_DIALOGUE_BY_LEVEL.huainan?.['关羽']);

const provenance=JSON.parse(read('docs/original-audit/level-10-huainan-portraits/portrait-provenance.json'));
const expectedFaces=new Map([['袁术',144],['袁胤',145],['纪灵',146],['乐就',165],['陈纪',156],['曹豹',190],['董昭',157],['张绣',155],['陈宫',149]]);
for(const portrait of provenance.portraits){assert.equal(portrait.faceId,expectedFaces.get(portrait.name),`${portrait.name} face id`);for(const key of ['referenceRgba','referencePng','masterPng','runtimeWebp'])assert.ok(fs.existsSync(path.join(root,portrait[key])),`${portrait.name} missing ${key}`)}
assert.equal(provenance.portraits.length,expectedFaces.size);

for(const asset of ['assets/level-10-huainan/huainan-map-v1.webp','assets/level-10-huainan/units/ji-ling-unit-v1.webp','assets/level-10-huainan/units/le-jiu-unit-v1.webp','assets/level-10-huainan/units/chen-ji-unit-v1.webp',...['walk','attack','critical','block','hurt','death'].map(action=>`assets/level-10-huainan/animation/ji-ling/ji-ling-${action}-v1.webp`)])assert.ok(fs.existsSync(path.join(root,asset)),`missing ${asset}`);
const game=read('game.js'),html=read('index.html'),styles=read('style.css'),audio=read('audio-config.js'),board=read('leaderboard.js'),taishan=read('level-09-taishan.js');
assert.ok(game.includes("previewParams.has('huainanCampGatePreview')&&level.id==='huainan'"),'Huainan camp-gate browser preview is missing');
assert.match(game,/function traversable\(u,x,y\).*?!isOpponent\(u,occupant\)/,'movement routes must pass through same-side units');
assert.match(game,/function canCrossMovementEdge\(x1,y1,x2,y2\)/,'painted palisades must support blocked cell edges');
assert.match(game,/function calcReach\(u\).*?canCrossMovementEdge\(x,y,nx,ny\)/,'reachability must respect palisade edges');
assert.match(game,/function findPath\(u,tx,ty\).*?canCrossMovementEdge\(x,y,nx,ny\)/,'movement animation paths must respect palisade edges');
assert.match(game,/function calcReach\(u\).*?traversable\(u,nx,ny\)/,'reachability must use same-side traversal');
assert.match(game,/function findPath\(u,tx,ty\).*?!traversable\(u,nx,ny\)/,'movement animation path must use the same traversal rule');
assert.match(game,/async function moveSelected\(x,y\).*?if\(occupant\)/,'occupied friendly cells must remain invalid final destinations');
for(const token of ["levelIndex==='12' ? window.LEVEL_10_HUAINAN","nextLevelId==='huainan'?window.LEVEL_10_HUAINAN","targetId==='huainan'?'12'","saveTaishanPostBattle()","postBattleAction='next'","level.id==='huainan'&&pendingCampaignAtBoot?.fromLevelId==='taishan'"])assert.ok(game.includes(token),`runtime missing ${token}`);
for(const token of [
  'function resolvedNextLevelId()',
  "return level.id==='taishan'&&window.LEVEL_10_HUAINAN?'huainan':null",
  "if(action==='pending'&&resolvedNextLevelId())action='next'",
  "const nextLevelId=resolvedNextLevelId(),nextIndex=nextLevelId==='huainan'?'12'",
  "if(resolvedNextLevelId())writeCampaignTransfer(campaignVictoryType)"
])assert.ok(game.includes(token),`Taishan-to-Huainan compatibility routing missing: ${token}`);
assert.ok(taishan.includes("nextLevelId:'huainan'"));
for(const token of ['level-10-huainan.js','level-10-huainan-animation-bounds.js','data-select-level="12"','data-leaderboard-level="huainan"'])assert.ok(html.includes(token),`index missing ${token}`);
assert.ok(styles.includes(".level-choice.huainan{background-image:url('assets/level-10-huainan/huainan-map-v1.webp')}"));
assert.ok(audio.includes("'huainan': 'assets/level-03/thousand-suns-dw7th-mix.opus'"));
assert.ok(audio.includes("'huainan-lvbu-turn6': 'assets/audio/langrisser-ii-leon.opus'"));
assert.ok(game.includes('if(event.battleMusicAfter)setBattleMusicTrack(event.battleMusicAfter)'));
assert.ok(game.includes('battleMusicTrack:activeBattleTrack'),'persistent battle music must be saved');
assert.ok(game.includes('const restoredBattleTrack=save.battleMusicTrack'),'persistent battle music must be restored on load');
assert.ok(board.includes("huainan: { name: '淮南之战'"));
assert.ok(game.includes("turn<(rule.minTurn||1)"),'withdrawal must stay locked until turn 6');
assert.ok(game.includes("turn=Math.max(turn,Number(rule.minTurn)||1)"),'alternate victory preview must honor its unlock turn');
assert.ok(game.includes("previewParams.has('treasurePickupPreview')"),'treasure pickup runtime preview missing');
assert.ok(game.includes("previewParams.has('southwestCampAudit')"),'southwest camp collision preview missing');
assert.ok(game.includes("level.structureScaleByType?.[base]"),'per-level structure art scale support missing');
assert.ok(game.includes("function unitAt(x,y){return units.find(u=>u.side!=='reserve'&&u.hp>0"),'inactive reserve units must never create invisible movement blockers');
assert.ok(!game.includes('for(const ally of units.filter(q=>(q.side===\'ally\'||q.side===\'guest\')&&q.hp>0)){ally.exp=(ally.exp||0)+amount'),'alternate victory must not award its EXP twice');

console.log('Huainan verification passed: original terrain/deployment, painted southwest camp walls and gates, all camps and structures reachable, friendly pass-through, bridge-left access, reserve collision, turn-6 reinforcement, retreat path, duel, reward, story variants, portraits, assets and campaign routing.');
