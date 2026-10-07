import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const rules=require('../battle-rules.js');
const context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'level-04-qinghe.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'story-data.js'),'utf8'),context);
const level=context.window.LEVEL_04_QINGHE;
const original=JSON.parse(fs.readFileSync(path.join(root,'docs/original-audit/level-04-qinghe-map.json'),'utf8'));

assert.equal(level.width,28);assert.equal(level.height,16);assert.equal(level.maxTurns,30);
assert.equal(level.objectiveUnitId,'quyi');assert.equal(level.squareGrid,true);assert.equal(level.structuresBakedIntoArt,false);
assert.equal(level.battlefieldArt,'assets/level-04-qinghe/qinghe-map-remaster-v2.webp');
assert.equal(JSON.stringify(level.terrainCodes),JSON.stringify(original.terrain_codes));
assert.equal(level.events.battleReward,200);

const expected=[
  [60,2,10,9,2],[256,4,9,5,0],[257,10,7,5,4],[258,9,9,4,4],
  [328,8,8,4,4],[292,3,8,2,0],[274,2,9,4,0],[275,10,10,4,4],
  [310,-1,-1,3,1],[311,-1,-1,3,1]
];
for(const [id,x,y,lvl,ai] of expected){const u=level.units.find(q=>q.originalId===id);assert.ok(u,`missing original unit ${id}`);assert.deepEqual([u.x,u.y,u.level,u.aiType],[x,y,lvl,ai],`deployment mismatch ${id}`)}
for(const u of level.units.filter(u=>u.side!=='reserve')){
  assert.ok(u.x>=0&&u.y>=0&&u.x<28&&u.y<16,`${u.name} outside battlefield`);
  assert.ok(!['water','cliff','wall','gate','fence','house','fire','muddyWater'].includes(level.terrain[u.y][u.x]),`${u.name} starts on impassable terrain`);
  const stats=rules.derivedStats({troop:u.troop,level:u.level,wuli:u.wuli,zhili:u.zhili,tongyu:u.tongyu});
  assert.ok(Number.isFinite(stats.attack)&&Number.isFinite(stats.defense),`${u.name} cannot complete a runtime stat calculation`);
}

assert.equal(level.terrain[9][1],'supply');assert.equal(level.terrain[12][12],'treasure');
assert.equal(JSON.stringify(level.events.loot['9,1']),JSON.stringify({item:'wine',amount:1}));
assert.equal(JSON.stringify(level.events.loot['12,12']),JSON.stringify({gold:100}));
assert.equal(level.openingDuel.winnerId,'quyi');assert.equal(level.openingDuel.loserId,'yangang');
assert.ok(level.environmentFx.waterBands.every(band=>Array.isArray(band.from)&&Array.isArray(band.to)),'water motion bands must use runtime geometry objects');
assert.equal(level.events.duel.attackerId,'guan');assert.equal(level.events.duel.defenderId,'quyi');assert.equal(level.events.duel.endsBattle,true);
const turn7=level.timedEvents.find(event=>event.turn===7);assert.ok(turn7);assert.equal(JSON.stringify(turn7.spawns.map(x=>x.unitId)),JSON.stringify(['bandit1','bandit2']));
assert.deepEqual(rules.learnedStrategies({troop:'cavalry',level:9}),[],'Qu Yi must not receive a fabricated tactic');
assert.deepEqual(rules.learnedStrategies({troop:'support',level:4}),[],'original military band has no combat tactic');

const assets=[
  'assets/level-04-qinghe/qinghe-map-remaster-v2.webp',
  'assets/level-04-qinghe/qu-yi-mounted-v1.webp','assets/level-04-qinghe/qu-yi-portrait-v1.webp',
  'assets/level-04-qinghe/yan-gang-mounted-v1.webp','assets/level-04-qinghe/yan-gang-portrait-v1.webp'
];
let runtimeBytes=0;for(const asset of assets){const size=fs.statSync(path.join(root,asset)).size;assert.ok(size>1000,`missing ${asset}`);runtimeBytes+=size}
assert.ok(runtimeBytes<3*1024*1024,`Qinghe core art exceeds budget: ${runtimeBytes}`);

const story=context.window.QINGHE_PRE_BATTLE_STORY;assert.equal(story.length,7);
assert.ok(story.every(line=>!line.freeRoam&&!line.setup&&!line.route),'Qinghe story must use backgrounds and portraits without new roaming scenes');
assert.equal(story[5].text,'明白了，那么去清河吧。');assert.equal(story[6].text,'好像是敌人，列队。');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),game=fs.readFileSync(path.join(root,'game.js'),'utf8');
assert.ok(html.includes('data-select-level="6"'));assert.ok(html.includes('data-leaderboard-level="qinghe"'));
assert.ok(game.includes("levelIndex==='6' ? window.LEVEL_04_QINGHE"));
assert.ok(game.includes("params.set('secondRouteChoice','1')"));
assert.ok(game.includes("previewParams.has('routeChoice')||previewParams.has('secondRouteChoice')"));
assert.ok(game.includes("secondRouteChoiceFlow?['5','6']:['3','4']"));
assert.ok(game.includes("const routeStart=['julu','qinghe'].includes(level.id)?5:14"));
assert.ok(game.includes('playDuelCinematic(winner,loser,opening)'));
assert.ok(game.includes("targetId==='qinghe'?'6'"));
assert.ok(game.includes("['julu','qinghe'].includes(targetId)?'secondRouteChoice':'routeChoice'"));
assert.ok(game.includes("quyi:'assets/level-04-qinghe/qu-yi-mounted-v1.webp'"));
assert.ok(game.includes("yangang:'assets/level-04-qinghe/yan-gang-portrait-v1.webp'"));

console.log(`Qinghe verification passed: exact 28x16 original terrain, deployment, opening duel, turn-seven bandits, loot, Guan Yu duel, second route choice and ${(runtimeBytes/1024/1024).toFixed(2)} MiB core art.`);
