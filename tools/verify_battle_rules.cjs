const assert=require('node:assert/strict');
const rules=require('../battle-rules.js');

assert.equal(rules.physicalMoraleDamage(0,1,100),0);
assert.equal(rules.physicalMoraleDamage(1,1,100),1);
assert.equal(rules.physicalMoraleDamage(100,1,100),5);
assert.equal(rules.physicalMoraleDamage(999,1,3),3);

assert.deepEqual(rules.applyMoraleLoss(20,5),{morale:15,loss:5,routed:false});
assert.deepEqual(rules.applyMoraleLoss(3,9),{morale:0,loss:3,routed:true});
assert.deepEqual(rules.applyMoraleLoss(3,9,true),{morale:1,loss:2,routed:false});

assert.equal(rules.confusionRecoveryChance(91,29),.4);
assert.equal(rules.confusionRecoveryChance(400,100),1);
assert.equal(rules.hitRate(100,100,0),.92);
assert.equal(rules.hitRate(0,100,100,{archer:true,targetInForest:true}),.68);
assert.equal(rules.hitRate(100,0,0),.98);

assert.deepEqual(rules.derivedStats({troop:'infantry',level:1,wuli:75,zhili:64,tongyu:91}),{
  attack:265,defense:287,maxHp:500,hpGrowth:50,move:4,maxStrategy:17
});
assert.equal(rules.derivedStats({troop:'infantry',level:2,wuli:75,zhili:64,tongyu:91}).maxStrategy,19);
assert.equal(rules.derivedStats({troop:'cavalry',level:1,wuli:98,zhili:80,tongyu:100,attackBonus:12}).attack,387);
for(const troop of ['bandit','support','martial','heavyCavalry']){
  const stats=rules.derivedStats({troop,level:3,wuli:50,zhili:40,tongyu:40});
  assert.ok(Number.isFinite(stats.attack)&&Number.isFinite(stats.defense)&&Number.isFinite(stats.move),`${troop} must support a complete NPC turn`);
}
assert.deepEqual(rules.derivedStats({troop:'infantry',level:1,wuli:75,zhili:64,tongyu:91,morale:50}),{
  attack:210,defense:232,maxHp:500,hpGrowth:50,move:4,maxStrategy:17
});
assert.equal(rules.affinityPercent('cavalry','infantry'),75);
assert.equal(rules.affinityPercent('infantry','cavalry'),125);
assert.equal(rules.affinityPercent('heavyCavalry','infantry'),75);
assert.equal(rules.affinityPercent('infantry','heavyCavalry'),125);
assert.equal(rules.physicalDamage({attack:387,defense:246,attackerTroop:'cavalry',targetTroop:'infantry',terrainDefense:30,targetHp:500}),206);
assert.equal(rules.physicalDamage({attack:265,defense:354,attackerTroop:'infantry',targetTroop:'cavalry',terrainDefense:0,targetHp:740}),44);
assert.equal(rules.physicalDamage({attack:265,defense:354,attackerTroop:'infantry',targetTroop:'cavalry',terrainDefense:0,targetHp:740,counter:true}),22);
assert.equal(rules.physicalDamage({attack:266,defense:354,attackerTroop:'infantry',targetTroop:'cavalry',terrainDefense:0,targetHp:740,counter:true}),22);

assert.equal(rules.experienceGain(1,1,false,false),6);
assert.equal(rules.experienceGain(1,5,true,true),62);
assert.equal(rules.transportHealingExperience(0),0);
assert.equal(rules.transportHealingExperience(1),1);
assert.equal(rules.transportHealingExperience(25),1);
assert.equal(rules.transportHealingExperience(26),2);
assert.equal(rules.transportHealingExperience(115),5);
assert.equal(rules.transportHealingExperience(999),10);
assert.deepEqual(rules.terrainRecovery({hp:301,maxHp:500,morale:82,tongyu:91,recoverHp:true,recoverMorale:true,hpRoll:4,moraleRoll:2}),{hp:500,morale:100,hpGain:199,moraleGain:18});
assert.deepEqual(rules.terrainRecovery({hp:495,maxHp:500,morale:91,tongyu:42,recoverHp:true,recoverMorale:true,hpRoll:0,moraleRoll:0}),{hp:500,morale:100,hpGain:5,moraleGain:9});
assert.equal(rules.strategyAbility(30,2),31);
assert.equal(rules.fireScrollDamage({targetZhili:30,targetLevel:2,targetTroop:'infantry',randomRoll:2,targetHp:500}),171);
assert.equal(rules.fireScrollDamage({targetZhili:30,targetLevel:2,targetTroop:'infantry',targetInForest:true,randomRoll:3,targetHp:500}),214);

assert.equal(rules.aiStrategyDecision({turn:4,hasPhysicalAttack:true,emergencyHeal:true,role:'西凉军',zhili:80}),'attack');
assert.equal(rules.aiStrategyDecision({turn:4,lastStrategyTurn:2,cooldown:3,role:'西凉军',zhili:80}),'cooldown');
assert.equal(rules.aiStrategyDecision({turn:5,lastStrategyTurn:2,cooldown:3,emergencyHeal:true,role:'西凉军',zhili:40}),'recover');
assert.equal(rules.aiStrategyDecision({turn:5,role:'前锋',zhili:80}),'advance');
assert.equal(rules.aiStrategyDecision({turn:5,role:'西凉军',zhili:54}),'advance');
assert.equal(rules.aiStrategyDecision({turn:5,role:'西凉军',zhili:55}),'offensive');
assert.deepEqual(rules.learnedStrategies({troop:'infantry',level:1}),[]);
assert.deepEqual(rules.learnedStrategies({troop:'infantry',level:6}),['fire']);
assert.deepEqual(rules.learnedStrategies({troop:'cavalry',level:7}),[]);
assert.deepEqual(rules.learnedStrategies({troop:'cavalry',level:9}),[]);
assert.deepEqual(rules.learnedStrategies({troop:'cavalry',level:10}),['whirlwind']);
assert.deepEqual(rules.learnedStrategies({troop:'cavalry',level:99}),['whirlwind','falseReport']);
assert.deepEqual(rules.learnedStrategies({troop:'archer',level:6}),['vortex']);
assert.deepEqual(rules.learnedStrategies({troop:'support',level:1}),[]);
assert.deepEqual(rules.learnedStrategies({troop:'cavalry',level:1,override:['fire']}),['fire']);

const bandAuraUnits=[
  {id:'band',troop:'support',side:'ally',hp:500,x:5,y:5},
  {id:'ally',troop:'infantry',side:'ally',hp:500,x:6,y:6},
  {id:'guest',troop:'cavalry',side:'guest',hp:500,x:4,y:4},
  {id:'enemyBand',troop:'support',side:'enemy',hp:500,x:8,y:8}
];
assert.equal(rules.militaryBandAttackAura({x:6,y:6,id:'ally',side:'ally',units:bandAuraUnits}),true);
assert.equal(rules.militaryBandAttackAura({x:4,y:4,id:'guest',side:'guest',units:bandAuraUnits}),true);
assert.equal(rules.militaryBandAttackAura({x:5,y:5,id:'band',side:'ally',units:bandAuraUnits}),false);
assert.equal(rules.militaryBandAttackAura({x:7,y:7,id:'ally',side:'ally',units:bandAuraUnits}),false);
assert.equal(rules.militaryBandAttackAura({x:7,y:7,id:'enemy',side:'enemy',units:bandAuraUnits}),true);

const nearbyForces=[{id:'yuze',hp:500,maxHp:500,x:8,y:16,spawnOrder:2},{id:'liu',hp:650,maxHp:650,x:12,y:12,spawnOrder:0}];
assert.equal(rules.retaliationTargetId({aiType:0,provokedBy:'yuze',provokedTurn:4,currentTurn:4,actorX:7,actorY:16,candidates:nearbyForces}),'yuze');
assert.equal(rules.retaliationTargetId({aiType:0,provokedBy:'yuze',provokedTurn:3,currentTurn:4,actorX:7,actorY:16,candidates:nearbyForces}),'yuze');
assert.equal(rules.retaliationTargetId({aiType:0,actorX:6,actorY:15,detectionRange:3,currentTurn:4,candidates:nearbyForces}),'yuze');
assert.equal(rules.retaliationTargetId({aiType:0,actorX:2,actorY:2,detectionRange:3,currentTurn:4,candidates:nearbyForces}),null);
assert.equal(rules.retaliationTargetId({aiType:1,provokedBy:'yuze',provokedTurn:4,currentTurn:4,actorX:7,actorY:16,candidates:nearbyForces}),null);
assert.equal(rules.retaliationTargetId({aiType:0,provokedBy:'yuze',provokedTurn:4,currentTurn:4,actorX:7,actorY:16,candidates:[{id:'yuze',hp:0,maxHp:500,x:8,y:16}]}),null);

console.log('Battle rules verified: original stats, damage, experience, terrain recovery, fire scroll, morale, rout, confusion, hit-rate bounds, military-band aura and restrained AI tactic priority and stationary-unit retaliation.');
