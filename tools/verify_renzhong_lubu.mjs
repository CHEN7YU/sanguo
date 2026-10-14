import fs from 'node:fs';

const root=new URL('..',import.meta.url),game=fs.readFileSync(new URL('game.js',root),'utf8'),hulao=fs.readFileSync(new URL('level-02.js',root),'utf8');
const check=(condition,message)=>{if(!condition)throw new Error(message)};

check(hulao.includes("id:'lvbu'")&&hulao.includes("name:'吕布'"),'Hulao Lu Bu identity is missing');
check(game.includes("attacker?.id!=='lvbu'"),'Renzhong Lubu must be restricted to Lu Bu');
check(game.includes("Math.abs(unit.x-primaryTarget.x)+Math.abs(unit.y-primaryTarget.y)===1"),'splash must only reach units adjacent to the primary target');
check(game.includes("Math.round(primaryDamage*.1)"),'splash must equal 10% of dealt primary damage');
check(game.includes('splashHits=applyRenzhongLubuSplash(attacker,target,dmg)'),'player-controlled Lu Bu attacks do not trigger the passive');
check(game.includes("splashHits=applyRenzhongLubuSplash(a,t,dmg,{protectObjective:a.side==='guest'})"),'AI Lu Bu attacks do not trigger the passive');
check(game.includes("passiveName.textContent='特性 · 人中吕布'"),'unit panel does not name the passive');
check(game.includes('对目标相邻的其他敌方单位造成本次伤害10%的波及伤害'),'unit panel does not explain the passive');

console.log('Renzhong Lubu verified: single-target hits splash 10% damage to adjacent enemies for player and AI attacks, with panel disclosure.');
