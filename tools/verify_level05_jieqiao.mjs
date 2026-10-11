import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../level-05-jieqiao.js',import.meta.url),'utf8');
const storySource=fs.readFileSync(new URL('../story-data.js',import.meta.url),'utf8');
function load(route){
  const transfer={schema:1,fromLevelId:route,toLevelId:'jieqiao'};
  const context={window:{},location:{search:''},URLSearchParams,localStorage:{getItem:key=>key==='sanguozhi-zhaolie-campaign-v1'?JSON.stringify(transfer):null}};
  vm.createContext(context);vm.runInContext(source,context);return context.window.LEVEL_05_JIEQIAO;
}
function loadStory(route){
  const context={window:{},location:{search:`?jieqiaoRoute=${route}`},URLSearchParams,localStorage:{getItem:()=>JSON.stringify({schema:1,fromLevelId:route==='julu'?'qinghe':'julu',toLevelId:'jieqiao'})}};
  vm.createContext(context);vm.runInContext(storySource,context);return context.window.JIEQIAO_PRE_BATTLE_STORY;
}

for(const route of ['julu','qinghe']){
  const level=load(route);
  const story=loadStory(route);
  assert.equal(level.id,'jieqiao');
  assert.equal(level.width,32);assert.equal(level.height,24);assert.equal(level.maxTurns,40);
  assert.equal(level.terrain.length,24);assert.ok(level.terrain.every(row=>row.length===32));
  assert.equal(level.squareGrid,true);assert.deepEqual([...level.viewProjection.rowShift],Array(24).fill(0));
  assert.equal(level.terrain[18][0],'water');assert.equal(level.terrain[13][12],'hill');
  assert.equal(level.terrain[1][27],'supply');assert.equal(level.alternateVictory.x,27);assert.equal(level.alternateVictory.y,1);
  const ids=new Set(level.units.map(unit=>unit.id));
  for(const id of ['liu','guan','zhang','jian','gongsun','zhoubi','chenjiang','zhaoyun','yuanshao','wenchou','tianfeng'])assert.ok(ids.has(id),`${route}: missing ${id}`);
  assert.equal(level.units.find(unit=>unit.id==='zhaoyun').side,'reserve');
  assert.equal(level.openingDuelSequence.length,2);
  assert.equal(level.openingDuelSequence[0].loserId,'chenjiang');assert.equal(level.openingDuelSequence[0].loserDefeated,true);
  assert.equal(level.openingDuelSequence[1].winnerId,'zhaoyun');assert.equal(level.openingDuelSequence[1].loserDefeated,false);
  assert.equal(level.events.duel.attackerId,'zhang');assert.equal(level.events.duel.defenderId,'wenchou');assert.equal(level.events.duel.endsBattle,false);
  assert.equal(level.events.battleReward,200);
  assert.equal(level.events.loot['14,23'].treasureId,'longSpear');
  assert.equal(level.events.loot['22,3'].item,'wheat');
  assert.equal(level.events.loot['8,21'].item,'fireScroll');
  assert.equal(level.events.loot['29,1'].treasureId,'repeatingCrossbow');
  assert.equal(level.intro.length,9);assert.equal(level.intro[0].speaker,'赵云');assert.equal(level.intro[5].speaker,'沮授');
  assert.equal(story.length,6);assert.equal(story.at(-1).text,'大哥，到界桥了，请列队。');
  const roam=story.find(line=>line.freeRoam);assert.ok(roam,`${route}: Jieqiao must restore pre-battle free conversation`);
  for(const name of ['刘备','关羽','张飞','简雍'])assert.ok(roam.setup.some(actor=>actor.name===name),`${route}: Jieqiao roam missing ${name}`);
  assert.ok(story.filter(line=>line.move||line.thenMove||line.route).length>=4,`${route}: Jieqiao story actors must visibly march`);
  assert.ok(!level.events.postVictory.some(line=>line.text.includes('正式与刘备')),'赵云不得在界桥后被错误写成立即入队');
  for(const unit of level.units.filter(unit=>unit.originalId<256))assert.ok(unit.defeatQuote,`${route}: named unit lacks defeat quote: ${unit.name}`);
  const front=new Map(level.areaEvents[0].aiUpdates.map(update=>[update.unitId,update]));
  const pursuit=new Set(level.areaEvents[1].aiUpdates.map(update=>update.unitId));
  const P=(x,y)=>x|(y<<8);
  if(route==='julu'){
    assert.ok(ids.has('quyi'));assert.ok(!ids.has('zhanghe'));
    assert.equal(level.units.find(unit=>unit.id==='cav2').x,23);assert.equal(level.units.find(unit=>unit.id==='band1').aiType,0);
    assert.equal(front.get('quyi').aiTarget,P(13,23));assert.deepEqual([...pursuit].sort(),['cav2','chenzhen','quyi','tianfeng','xuyou','yuanshao'].sort());
    assert.equal(story[0].speaker,'麴义');assert.equal(story[1].speaker,'严纲');
  }else{
    assert.ok(ids.has('zhanghe'));assert.ok(!ids.has('quyi'));
    assert.equal(level.units.find(unit=>unit.id==='cav2').x,5);assert.equal(level.units.find(unit=>unit.id==='band1').aiType,1);
    assert.equal(front.get('zhanghe').aiTarget,P(13,23));assert.deepEqual([...pursuit].sort(),['jiaochu','shenpei','tianfeng','yanliang','yuanshao','zhanghe'].sort());
    assert.equal(story[0].speaker,'张郃');assert.equal(story[1].speaker,'公孙越');
  }
}

{
  const context={window:{},location:{search:''},URLSearchParams,localStorage:{getItem:()=>null}};
  vm.createContext(context);vm.runInContext(storySource,context);
  assert.ok(context.window.NPC_DIALOGUE_BY_LEVEL.jieqiao?.关羽?.length,'Jieqiao free roam needs a Guan Yu departure interaction');
}

const release=new URL('../assets/level-05-jieqiao/jieqiao-map-v3.webp',import.meta.url);
assert.ok(fs.statSync(release).size<2_000_000,'release map exceeds 2 MB');
const audit=fs.readFileSync(new URL('../docs/original-audit/level-05-jieqiao-audit.md',import.meta.url),'utf8');
assert.match(audit,/7b99fde5d33496075e98458e66e9c6d485d09c8b9934d507f688bdd9c7cfbef6/);
assert.match(audit,/赵云在后续徐州救援剧情中/);
console.log('Level 05 Jieqiao verification passed for both branch variants.');
