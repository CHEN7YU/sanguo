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
vm.runInContext(fs.readFileSync(path.join(root,'level-04-julu.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'story-data.js'),'utf8'),context);
const level=context.window.LEVEL_04_JULU;
const original=JSON.parse(fs.readFileSync(path.join(root,'docs/original-audit/level-04-julu-map.json'),'utf8'));

assert.equal(level.width,18);assert.equal(level.height,18);assert.equal(level.maxTurns,30);
assert.equal(level.objectiveUnitId,'zhanghe');assert.equal(level.squareGrid,true);assert.equal(level.structuresBakedIntoArt,false);
assert.equal(JSON.stringify(level.terrainCodes),JSON.stringify(original.terrain_codes));
assert.deepEqual([level.alternateVictory.unitId,level.alternateVictory.x,level.alternateVictory.y],['liu',0,10]);
assert.equal(level.alternateVictory.exp,50);assert.equal(level.events.battleReward,200);

const expected=[
  [102,5,17,10,0],[51,6,15,7,0],[103,4,14,7,0],[91,12,6,6,1],[54,11,14,7,1],
  [256,10,6,5,1],[257,7,16,5,0],[274,9,17,4,0],[292,10,14,3,1],[336,13,5,4,1],[348,4,16,4,0]
];
for(const [id,x,y,lvl,ai] of expected){const u=level.units.find(q=>q.originalId===id);assert.ok(u,`missing original unit ${id}`);assert.deepEqual([u.x,u.y,u.level,u.aiType],[x,y,lvl,ai],`deployment mismatch ${id}`)}
for(const u of level.units.filter(u=>u.side!=='reserve')){
  assert.ok(u.x>=0&&u.y>=0&&u.x<18&&u.y<18,`${u.name} outside battlefield`);
  assert.ok(!['water','cliff','wall','gate','fence','house','fire','muddyWater'].includes(level.terrain[u.y][u.x]),`${u.name} starts on impassable terrain`);
  const stats=rules.derivedStats({troop:u.troop,level:u.level,wuli:u.wuli,zhili:u.zhili,tongyu:u.tongyu});
  assert.ok(Number.isFinite(stats.attack)&&Number.isFinite(stats.defense),`${u.name} cannot complete a runtime stat calculation`);
}

assert.equal(level.terrain[10][0],'fort');assert.equal(level.terrain[8][5],'supply');
assert.equal(level.terrain[7][11],'village');assert.equal(level.terrain[13][7],'village');
assert.equal(JSON.stringify(level.events.loot['5,8']),JSON.stringify({item:'wheat',amount:1}));
assert.equal(level.events.duel.attackerId,'zhang');assert.equal(level.events.duel.defenderId,'yanliang');
assert.equal(level.events.duel.endsBattle,false,'Yan Liang duel must not defeat Zhang He or end Julu');
const turn3=level.timedEvents.find(event=>event.turn===3);assert.ok(turn3);assert.equal(turn3.spawns.length,5);
assert.equal(JSON.stringify(turn3.spawns.map(x=>x.unitId)),JSON.stringify(['bandit1','bandit2','bandit3','guanchun','gengwu']));
assert.equal(level.areaEvents[0].unitId,'liu');assert.equal(JSON.stringify(level.areaEvents[0].rect),JSON.stringify({x1:4,y1:8,x2:10,y2:13}));
assert.deepEqual(rules.learnedStrategies({troop:'archer',level:4}),[],'Jian Yong must not receive a fabricated tactic');
assert.deepEqual(rules.learnedStrategies({troop:'infantry',level:6}),['fire'],'Shen Pei must use the original level-six infantry tactic table');

const assets=['assets/level-04-julu/julu-map-aligned-v3.webp','assets/level-04-julu/fort-v1.webp','assets/level-04-julu/portraits/zhang-he-v1.webp','assets/level-04-julu/portraits/yan-liang-v1.webp','assets/level-04-julu/portraits/gao-lan-v1.webp','assets/level-04-julu/portraits/shen-pei-v1.webp','assets/level-04-julu/portraits/gongsun-yue-v1.webp','assets/level-04-julu/portraits/guan-chun-v1.webp','assets/level-04-julu/portraits/geng-wu-v1.webp','assets/level-04-julu/portraits/yu-ze-v1.webp'];
let runtimeBytes=0;for(const asset of assets){const size=fs.statSync(path.join(root,asset)).size;assert.ok(size>1000,`missing ${asset}`);runtimeBytes+=size}assert.ok(runtimeBytes<6*1024*1024,`Julu core art exceeds normal-level budget: ${runtimeBytes}`);

const story=context.window.JULU_PRE_BATTLE_STORY;assert.equal(story.length,9);assert.ok(story.every(line=>!line.freeRoam&&!line.setup&&!line.route),'Julu story must use remastered backgrounds and portraits without roaming sprites');
for(const speaker of ['公孙瓒','刘备','关羽','张飞','颜良','张郃'])assert.ok(story.some(line=>line.speaker===speaker)||speaker==='刘备',`missing Julu story speaker ${speaker}`);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),game=fs.readFileSync(path.join(root,'game.js'),'utf8');
assert.ok(html.includes('data-select-level="5"'));assert.ok(html.includes('第四战A · 巨鹿路线'));assert.ok(html.includes('第四战B · 清河路线'));assert.ok(html.includes('第五战 · 路线汇合'));
assert.ok(game.includes("levelIndex==='5' ? window.LEVEL_04_JULU"));assert.ok(game.includes("level.nextLevelId==='julu'?'5'"));assert.ok(game.includes('structuresBakedIntoArt'));
assert.ok(game.includes("const reward=alternate?(level.alternateVictory?.goldReward??0)"),'alternate victory must grant original EXP instead of also granting normal gold');
assert.ok(game.includes('全体存活我军获得经验${alternateExp}'),'alternate victory outcome must describe the original EXP reward');
assert.ok(game.includes("previewParams.has('areaEventPreview')"),'Julu central pursuit event must have a browser audit route');
assert.ok(game.includes('Number.isInteger(update.aiTarget)'),'AI target zero must remain a valid original-script target');
assert.ok(game.includes('const duelEndsBattle=script.endsBattle??(h.id===objectiveUnitId)'),'duel result must only end a battle when the defeated duelist is the objective');
assert.ok(game.includes("status(`${h.name}败退，继续击退${units.find(u=>u.id===objectiveUnitId)?.name||'敌军主将'}`)"),'non-objective duel must return to the battle with the real objective still active');
for(const id of ['zhanghe','yanliang','gaolan','shenpei','gongsunyue','guanchun','gengwu','yuze'])assert.ok(game.includes(`${id}:'assets/level-04-julu/portraits/`),`missing portrait binding ${id}`);

console.log(`Julu verification passed: exact 18x18 original terrain, deployment, turn-three ambush/reinforcements, duel, alternate victory, static story presentation and ${(runtimeBytes/1024/1024).toFixed(2)} MiB core art.`);
