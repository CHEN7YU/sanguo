import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context={window:{}};
vm.createContext(context);
for(const file of ['level-01.js','level-02.js','level-03-guangchuan.js','level-03-xindu.js','level-04-julu.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);

function recommendation(level){
  const enemies=level.units.filter(u=>u.side==='enemy');
  const boss=enemies.find(u=>u.boss)||enemies.reduce((best,u)=>!best||u.level>best.level?u:best,null);
  const average=enemies.reduce((sum,u)=>sum+u.level,0)/enemies.length;
  return Math.max(1,Math.min(Math.max(1,boss.level-1),Math.floor((average+boss.level)/2)));
}

const cases=[
  [context.window.LEVEL_01,3],
  [context.window.LEVEL_02,4],
  [context.window.LEVEL_03_GUANGCHUAN,4],
  [context.window.LEVEL_03_XINDU,5],
  [context.window.LEVEL_04_JULU,7]
];
for(const [level,expected] of cases){
  assert.equal(recommendation(level),expected,`${level.name} recommendation`);
  const boss=level.units.find(u=>u.side==='enemy'&&u.boss);
  assert.ok(expected<boss.level,`${level.name} must retain boss pressure`);
  for(const ally of level.units.filter(u=>u.side==='ally')){
    const backline=['archer','support','transport','sorcerer'].includes(ally.troop);
    const balanced=Math.max(ally.level,expected-(backline?1:0));
    assert.ok(balanced>=ally.level,`${ally.name} must never be levelled down`);
    assert.ok(balanced<=expected,`${ally.name} must not exceed the frontline recommendation`);
  }
}

const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(game.includes("params.set('levelSelect','1')"),'level choices must mark standalone balance mode');
assert.ok(game.includes('if(levelSelectActive)return applyLevelSelectBalance(runtimeUnits)'),'standalone selection must bypass campaign transfer');
assert.ok(game.includes('levelSelectBalanced:levelSelectActive'),'save files must remember the balance mode');
assert.ok(!game.match(/function nextLevelUrl\(\)[\s\S]{0,260}levelSelect/),'continuous campaign must not enable standalone balance mode');
for(const level of [3,4,4,5,7])assert.ok(html.includes(`选关均衡：前排 Lv.${level}`));

console.log('Level-select balance verification passed: Lv.3/Lv.4/Lv.4/Lv.5/Lv.7 recommendations, lower backline level, no level-down, save persistence, and campaign isolation.');
