import fs from 'node:fs';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const levels=fs.readdirSync(new URL('..',import.meta.url)).filter(name=>/^level-.*\.js$/.test(name));
const check=(condition,message)=>{if(!condition)throw new Error(message)};

check(game.includes("function qianlixingAttackBonus(u){return u?.id==='guan'?Math.min(.1,Math.max(0,Number(u.turnMoveDistance)||0)*.02):0}"),'Qianlixing must grant 2% attack per moved tile with a 10% cap');
check(game.includes('u.turnMoveDistance=movementDistance'),'Player movement distance is not recorded');
check(game.includes("qianlixing?' · 千里行':''"),'Qianlixing is not shown beside Guan Yu role and level');
check(game.includes('永久有效。每移动1格，本次行动攻击提高2%，最多10%'),'Qianlixing panel explanation is missing');
check(game.includes('千里行+${Math.round(qianlixing*100)}%攻击'),'Qianlixing is not shown in attack forecast');
check(game.includes("previewParams.has('qianlixingPreview')"),'Qianlixing visual regression preview is missing');
check(game.includes("clearActionMoveBonus(attacker);phase='select'"),'Qianlixing is not reset after physical attack');
check(game.includes('clearActionMoveBonus(who);selected=null'),'Qianlixing is not reset after waiting');
check(game.includes('clearActionMoveBonus(caster);phase=\'select\''),'Qianlixing is not reset after strategy or item use');

for(const level of levels){
  const source=fs.readFileSync(new URL(`../${level}`,import.meta.url),'utf8');
  if(source.includes("id:'guan'"))check(source.includes("id:'guan'"),`${level} lost Guan Yu identity`);
}

console.log(`Guan Yu Qianlixing verified: +2% physical attack per moved tile, capped at 10%, reset after action, visible across ${levels.length} level scripts.`);
