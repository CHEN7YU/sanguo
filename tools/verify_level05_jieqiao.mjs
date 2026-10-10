import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../level-05-jieqiao.js',import.meta.url),'utf8');
function load(route){
  const transfer={schema:1,fromLevelId:route,toLevelId:'jieqiao'};
  const context={window:{},location:{search:''},URLSearchParams,localStorage:{getItem:key=>key==='sanguozhi-zhaolie-campaign-v1'?JSON.stringify(transfer):null}};
  vm.createContext(context);vm.runInContext(source,context);return context.window.LEVEL_05_JIEQIAO;
}

for(const route of ['julu','qinghe']){
  const level=load(route);
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
  for(const key of ['8,21','22,3','14,23','29,1'])assert.ok(level.events.loot[key],`${route}: missing loot ${key}`);
  for(const unit of level.units.filter(unit=>unit.originalId<256))assert.ok(unit.defeatQuote,`${route}: named unit lacks defeat quote: ${unit.name}`);
  if(route==='julu'){assert.ok(ids.has('quyi'));assert.ok(!ids.has('zhanghe'))}
  else{assert.ok(ids.has('zhanghe'));assert.ok(!ids.has('quyi'))}
}

const release=new URL('../assets/level-05-jieqiao/jieqiao-map-v2.webp',import.meta.url);
assert.ok(fs.statSync(release).size<2_000_000,'release map exceeds 2 MB');
console.log('Level 05 Jieqiao verification passed for both branch variants.');
