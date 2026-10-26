import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const fail=message=>{throw new Error(message)};
const levelFiles=fs.readdirSync(root).filter(name=>/^level-(?:0[1-9]|10)(?:-[^.]+)?\.js$/.test(name)&&!name.includes('animation-bounds'));
const quoteOwners=new Map();
const genericDefeatQuote=/(?:暂且退下|我先退下|先退一步|暂退[！。…]*$|(?:全军)?撤退[！。…]*$|^[可恶可恨呀啊噢！？，、。… ]*(?:撤|退兵)[！。…]*$)/;
let namedCount=0;
for(const file of levelFiles){
  const sandbox={window:{},location:{search:''},localStorage:{getItem:()=>null},URLSearchParams};
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
  for(const level of Object.values(sandbox.window).filter(value=>value&&Array.isArray(value.units))){
    for(const unit of level.units.filter(unit=>(unit.originalId??999)<256||unit.name==='李明')){
      namedCount++;
      if(typeof unit.defeatQuote!=='string'||unit.defeatQuote.trim().length<4)fail(`${level.id}: named unit ${unit.name} has no authored defeat quote`);
      const text=unit.defeatQuote.trim(),owner=quoteOwners.get(text);
      if(owner&&owner!==unit.name)fail(`${level.id}: ${unit.name} reuses ${owner}'s defeat quote: ${text}`);
      quoteOwners.set(text,unit.name);
      if(genericDefeatQuote.test(text))fail(`${level.id}: ${unit.name} still uses a generic defeat quote: ${text}`);
    }
  }
}

const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
if(!game.includes("const text=typeof unit.defeatQuote==='string'?unit.defeatQuote.trim():''"))fail('defeat dialogue must require an authored quote');
for(const generic of ['主公……我先退下了！','胜负已分……暂且撤退！'])if(game.includes(generic))fail(`runtime still contains generic defeat fallback: ${generic}`);
const huainan=fs.readFileSync(path.join(root,'level-10-huainan.js'),'utf8');
if(huainan.includes('`${data.name}暂且退下！`'))fail('Huainan still auto-generates generic named-unit defeat quotes');
const huainanSandbox={window:{}};
vm.runInNewContext(huainan,huainanSandbox,{filename:'level-10-huainan.js'});
const huainanUnits=huainanSandbox.window.LEVEL_10_HUAINAN.units;
const genericArcher=huainanUnits.find(unit=>unit.name==='弓兵队');
if(!genericArcher||genericArcher.defeatQuote)fail('Huainan generic archer must leave the battlefield without dialogue');
const genericInfantry=huainanUnits.find(unit=>unit.name==='步兵队');
if(!genericInfantry||genericInfantry.defeatQuote||(genericInfantry.originalId??0)<256)fail('Huainan generic infantry must leave the battlefield without dialogue');
for(const name of ['刘备','关羽','张飞','简雍','赵云','孙乾','藩宫','糜竺','糜芳','李明','纪灵','乐就','陈纪','陈宫','张辽','魏续','宋宪']){
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
console.log(`Named defeat quotes verified: ${namedCount} allied, guest and enemy appearances across all implemented battles.`);
