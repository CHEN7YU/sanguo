import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const fail=message=>{throw new Error(message)};
const levelFiles=fs.readdirSync(root).filter(name=>/^level-(01|02|03|04|05|06|07).*\.js$/.test(name)&&!name.includes('animation-bounds'));
let namedCount=0;
for(const file of levelFiles){
  const sandbox={window:{},location:{search:''},localStorage:{getItem:()=>null},URLSearchParams};
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
  for(const level of Object.values(sandbox.window).filter(value=>value&&Array.isArray(value.units))){
    for(const unit of level.units.filter(unit=>(unit.originalId??999)<256)){
      namedCount++;
      if(typeof unit.defeatQuote!=='string'||unit.defeatQuote.trim().length<4)fail(`${level.id}: named unit ${unit.name} has no authored defeat quote`);
    }
  }
}

const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
if(!game.includes("if((unit.originalId??999)>=256&&!explicit)return Promise.resolve()"))fail('generic troop defeat dialogue must be guarded by troop identity rather than a fragile name list');
const huainan=fs.readFileSync(path.join(root,'level-10-huainan.js'),'utf8');
if(huainan.includes("Object.assign({defeatQuote:`${data.name}暂且退下！`}"))fail('Huainan still assigns spoken defeat quotes to every generic troop');
const huainanSandbox={window:{}};
vm.runInNewContext(huainan,huainanSandbox,{filename:'level-10-huainan.js'});
const huainanUnits=huainanSandbox.window.LEVEL_10_HUAINAN.units;
const genericArcher=huainanUnits.find(unit=>unit.name==='弓兵队');
if(!genericArcher||genericArcher.defeatQuote)fail('Huainan generic archer must leave the battlefield without dialogue');
const genericInfantry=huainanUnits.find(unit=>unit.name==='步兵队');
if(!genericInfantry||genericInfantry.defeatQuote||(genericInfantry.originalId??0)<256)fail('Huainan generic infantry must leave the battlefield without dialogue');
for(const name of ['纪灵','陈宫','李明']){
  const unit=huainanUnits.find(candidate=>candidate.name===name);
  if(!unit||typeof unit.defeatQuote!=='string'||unit.defeatQuote.length<4)fail(`Huainan named unit ${name} lost its defeat quote`);
}
for(const expected of [
  'await playDefeatQuote(target);if(target.id===objectiveUnitId)',
  'await playDefeatQuote(t);if(checkEnemyForceVictory(t))',
  'await playDefeatQuote(a);if(checkEnemyForceVictory(a))',
  'unit.defeatQuotePlayed=true'
])if(!game.includes(expected))fail(`defeat dialogue ordering regression: ${expected}`);
if(!game.includes("previewParams.has('defeatQuotePreview')"))fail('defeat quote browser preview is missing');
console.log(`Named defeat quotes verified: ${namedCount} allied, guest and enemy generals across all implemented battles.`);
