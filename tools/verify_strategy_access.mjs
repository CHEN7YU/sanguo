import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const rules=require('../battle-rules.js');
const levelSource=fs.readFileSync(new URL('../level-01.js',import.meta.url),'utf8');
const level02Source=fs.readFileSync(new URL('../level-02.js',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sandbox={window:{}};
vm.runInNewContext(levelSource,sandbox,{filename:'level-01.js'});
const level=sandbox.window.LEVEL_01;
vm.runInNewContext(level02Source,sandbox,{filename:'level-02.js'});
const level02=sandbox.window.LEVEL_02;

function check(condition,message){if(!condition)throw new Error(message)}

for(const unit of level.units){
  const learned=rules.learnedStrategies({troop:unit.troop,level:unit.level,override:level.strategyAccess?.[unit.id]});
  check(learned.length===0,`${unit.name} should have no intrinsic strategy in battle one, got ${learned.join(',')}`);
}
check(rules.learnedStrategies({troop:'cavalry',level:99}).includes('recover')===false,'cavalry must never learn aid from the implemented original progression');
check(rules.learnedStrategies({troop:'infantry',level:5}).length===0,'short infantry must not learn a tactic before level 6');
check(rules.learnedStrategies({troop:'infantry',level:6})[0]==='fire','short infantry must learn 焦热 at level 6');
check(rules.learnedStrategies({troop:'cavalry',level:9}).length===0,'light cavalry must not learn a tactic before level 10');
check(rules.learnedStrategies({troop:'cavalry',level:10})[0]==='whirlwind','light cavalry must learn 旋风 at level 10');
check(rules.learnedStrategies({troop:'archer',level:5}).length===0,'archers must not learn a tactic before level 6');
check(rules.learnedStrategies({troop:'archer',level:6})[0]==='vortex','archers must learn 漩涡 at level 6');
check(!rules.learnedStrategies({troop:'cavalry',level:99}).includes('contain'),'牵制 is not an original cavalry progression tactic');
for(const unit of level02.units){
  const learned=rules.learnedStrategies({troop:unit.troop,level:unit.level,override:level02.strategyAccess?.[unit.id]});
  check(learned.length===0,`${unit.name} should have no intrinsic strategy in battle two, got ${learned.join(',')}`);
}
check(game.includes("learnedStrategyIds(selected)"),'player strategy menu is not filtered by learned skills');
check(game.includes("const learned=new Set(learnedStrategyIds(caster));if(!learned.size)return null"),'AI is not filtered by learned skills');
check(game.includes("if(!knowsStrategy(caster,type))return false"),'NPC strategy execution lacks a second learned-skill guard');
check(game.includes("hasPhysicalAttack:!!physicalPlan?.target"),'AI strategy must yield to a reachable physical attack');
check(html.includes('id="passiveSkill"')&&game.includes("passiveName.textContent='被动 · 仁德号令'"),'Liu Bei passive skill description is missing');
check(game.includes('相邻友方单位攻击、防御、移动、会心与格挡提高10%（敌军无效）'),'Liu Bei aura scope is not explained');

console.log('Strategy access verified: battle-one and battle-two units cast no tactics; original infantry/cavalry/archer thresholds, NPC execution guard, physical-attack priority, and Liu Bei aura are enforced.');
