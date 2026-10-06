import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const fail=message=>{throw new Error(message)};
const levelFiles=fs.readdirSync(root).filter(name=>/^level-(01|02|03|04).*\.js$/.test(name));
let namedCount=0;
for(const file of levelFiles){
  const sandbox={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
  for(const level of Object.values(sandbox.window).filter(value=>value&&Array.isArray(value.units))){
    for(const unit of level.units.filter(unit=>(unit.originalId??999)<256)){
      namedCount++;
      if(typeof unit.defeatQuote!=='string'||unit.defeatQuote.trim().length<4)fail(`${level.id}: named unit ${unit.name} has no authored defeat quote`);
    }
  }
}

const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
for(const expected of [
  'await playDefeatQuote(target);if(target.id===objectiveUnitId)',
  'await playDefeatQuote(t);if(t.id===objectiveUnitId)',
  'await playDefeatQuote(a);if(a.id===objectiveUnitId)',
  'unit.defeatQuotePlayed=true'
])if(!game.includes(expected))fail(`defeat dialogue ordering regression: ${expected}`);
if(!game.includes("previewParams.has('defeatQuotePreview')"))fail('defeat quote browser preview is missing');
console.log(`Named defeat quotes verified: ${namedCount} allied, guest and enemy generals across all implemented battles.`);
