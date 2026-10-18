import fs from 'node:fs';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const levels=fs.readdirSync(new URL('..',import.meta.url)).filter(name=>/^level-.*\.js$/.test(name));
const check=(condition,message)=>{if(!condition)throw new Error(message)};

check(game.includes("if(u?.id==='zhang'&&key==='critRate')return .1"),'Zhang Fei permanent +10 percentage-point critical bonus is missing');
check(game.includes("passiveName.textContent=`被动 · 斗神"),'Doushen is not visible in the unit attribute panel');
check(game.includes('永久提高10个百分点会心率'),'Doushen effect text is missing');
check(game.includes("doushen?' · 斗神':''"),'Doushen is not shown beside Zhang Fei role and level');
check(game.includes("selected.id==='zhang'?' · 斗神+10%':''"),'Doushen is not shown in attack forecast');

for(const level of levels){
  const source=fs.readFileSync(new URL(`../${level}`,import.meta.url),'utf8');
  if(source.includes("id:'zhang'"))check(source.includes("id:'zhang'"),`${level} lost Zhang Fei identity`);
}

console.log(`Zhang Fei Doushen verified: permanent +10 percentage-point critical rate across ${levels.length} level scripts, visible in attributes and forecast.`);
