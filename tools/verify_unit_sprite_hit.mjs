import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const start=game.indexOf('  function unitSpriteTileAt(');
const end=game.indexOf('  function actionTileAt(',start);
assert.ok(start>=0&&end>start,'unit sprite hit helper is missing');
const helper=game.slice(start,end);
const actionStart=game.indexOf('  function actionTileAt(',end);
const actionEnd=game.indexOf('  function gridCell(',actionStart);
assert.ok(actionStart>=0&&actionEnd>actionStart,'action tile helper is missing');
const actionHelper=game.slice(actionStart,actionEnd);

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

function runMoveAction({ground,occupied=false}){
  const guan={id:'guan',originalId:1,troop:'cavalry',side:'ally',hp:560,x:10,y:7};
  const context={
    phase:'move',reachable:new Map([['10,6',0]]),keyOf:(x,y)=>`${x},${y}`,
    screenToTile:()=>ground,unitSpriteTileAt:()=>({x:guan.x,y:guan.y}),
    unitAt:(x,y)=>occupied&&x===guan.x&&y===guan.y?guan:null,
    structureTileAt:()=>null,map:Array.from({length:10},()=>Array(14).fill('plain')),
    ROWS:10,COLS:14,bgRect:{cell:80,w:1120,h:800},iso:(x,y)=>({x:x*80,y:y*80})
  };
  vm.runInNewContext(actionHelper+';result=actionTileAt(500,390);',context);
  return context.result;
}

assert.equal(JSON.stringify(runMoveAction({ground:{x:10,y:6}})),JSON.stringify({x:10,y:6}),'reachable ground above Guan Yu must win over his tall painted sprite');
assert.equal(JSON.stringify(runMoveAction({ground:{x:10,y:7},occupied:true})),JSON.stringify({x:10,y:7}),'an occupied unit cell must remain selectable');
console.log('Unit sprite hit passed: attack targets remain easy to click, while highlighted empty movement cells take priority over overlapping mounted sprites.');
