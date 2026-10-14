import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const start=game.indexOf('  function unitSpriteTileAt(');
const end=game.indexOf('  function actionTileAt(',start);
assert.ok(start>=0&&end>start,'unit sprite hit helper is missing');
const helper=game.slice(start,end);

function run({phase,attackable,click}){
  const enemy={id:'e2',originalId:257,troop:'infantry',side:'enemy',hp:650,x:10,y:6};
  const guan={id:'guan',originalId:1,troop:'cavalry',side:'ally',hp:560,x:10,y:7};
  const context={phase,attackable,units:[enemy,guan],bgRect:{scale:1},isMountedUnit:u=>u.troop==='cavalry',iso:(x,y)=>({x:500,y:y===6?420:490})};
  vm.runInNewContext(helper+';result=unitSpriteTileAt('+click.x+','+click.y+');',context);
  return context.result;
}

assert.equal(JSON.stringify(run({phase:'attack',attackable:[{x:10,y:6}],click:{x:500,y:360}})),JSON.stringify({x:10,y:6}));
assert.equal(JSON.stringify(run({phase:'attack',attackable:[{x:10,y:6}],click:{x:500,y:420}})),JSON.stringify({x:10,y:6}));
assert.equal(run({phase:'attack',attackable:[],click:{x:500,y:360}}),null);
console.log('Unit sprite hit passed: visible enemy bodies are clickable throughout their painted height, allied overlap cannot steal attack taps, and non-highlighted units remain excluded.');
