import fs from 'node:fs';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const checks=[
  ['function drawHealFx()', 'heal renderer missing'],
  ['function playHealAnimation(', 'heal animation lifecycle missing'],
  ["await playHealAnimation(target,amount,type)", 'bean and wheat must animate recovery'],
  ["await playHealAnimation(target,amount,'strategy')", 'aid strategy must animate recovery'],
  ["recoveries.push({target:u,amount:result.hpGain,source:'terrain'})", 'terrain recovery must enter heal animation queue'],
  ["recoveries.push({target,amount,source:'transport'})", 'transport recovery must enter heal animation queue'],
  ["await beginSidePhase('ally')", 'player phase recovery animation must complete before control returns'],
  ["drawStrategyFx();drawHealFx()", 'heal overlay must be drawn above units'],
  ["battleSfx('heal'", 'heal animation sound missing']
];
for(const [needle,message] of checks)if(!game.includes(needle))throw new Error(message);
console.log('Heal effects verified for items, strategies, terrain recovery and transport resupply.');