import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const fail=message=>{throw new Error(message)};
const check=(condition,message)=>{if(!condition)fail(message)};

function evaluateWalkPaths(){
  const start=game.indexOf('const walkPaths='),end=game.indexOf('const walkArt=',start);
  check(start>=0&&end>start,'walk asset registry is missing');
  const context={};
  vm.runInNewContext(`${game.slice(start,end)};this.result=walkPaths`,context);
  return context.result;
}

function loadLevels(){
  const context={window:{},URLSearchParams,location:{search:''},localStorage:{getItem:()=>null}};
  const files=fs.readdirSync(root).filter(file=>/^level-(?!.*animation-bounds).*\.js$/.test(file)).sort();
  for(const file of files)vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return Object.entries(context.window).filter(([key,value])=>key.startsWith('LEVEL_')&&Array.isArray(value?.units));
}

const genericKey=unit=>unit.troop==='cavalry'||unit.troop==='heavyCavalry'?'hua':unit.troop==='archer'?'archer':unit.troop==='martial'?'martial':unit.troop==='bandit'?'bandit':unit.troop==='beast'?'beast':unit.troop==='support'?'support':unit.troop==='transport'?'transport':unit.role!=='前锋'?'officer':'infantry';
const walkPaths=evaluateWalkPaths(),levels=loadLevels(),resolvedAssets=new Map(),troopTypes=new Set();

for(const [levelKey,level] of levels){
  for(const unit of level.units){
    troopTypes.add(unit.troop);
    const key=walkPaths[unit.id]?unit.id:genericKey(unit),relative=walkPaths[key];
    check(relative,`${levelKey}: ${unit.name} (${unit.id}/${unit.troop}) has no authored walk sheet or troop-family fallback`);
    check(fs.existsSync(path.join(root,relative)),`${levelKey}: walk sheet is missing for ${unit.name}: ${relative}`);
    resolvedAssets.set(key,relative);
  }
}

for(const troop of troopTypes){
  const probe={id:'__generic__',troop,role:troop==='infantry'?'前锋':'兵种'};
  const key=genericKey(probe),relative=walkPaths[key];
  check(relative,`troop family ${troop} has no generic authored walk sheet`);
  check(fs.existsSync(path.join(root,relative)),`troop family ${troop} walk sheet is missing: ${relative}`);
  resolvedAssets.set(key,relative);
}

for(const [key,relative] of resolvedAssets){
  const bytes=fs.readFileSync(path.join(root,relative));
  check(bytes.length>10000&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP',`invalid walk sheet for ${key}: ${relative}`);
  const metadata=await sharp(bytes).metadata();
  check((metadata.width||0)>=1000&&(metadata.height||0)>=1000,`walk sheet for ${key} is too small to contain a four-by-four atlas: ${metadata.width}x${metadata.height}`);
}

for(const token of ["west:0","north:1","east:2","south:3","direction=tileDx>0?'east'","drawAuthoredWalkFrame"]){
  check(game.includes(token),`missing four-direction walk pipeline token: ${token}`);
}
for(const token of ["function walkingMotionFor(u,phase,direction='west'","walkPhase:segment+p","phase,direction,facing","walkingMotionFor(u,walking.walkPhase,walking.direction,walking.facing)"]){
  check(game.includes(token),`walking renderer loses authored direction, phase or facing: ${token}`);
}
check(game.includes("function walkKeyFor(u){if(walkArt[u.id]&&walkFrameBounds[u.id])return u.id;const genericKey=genericVisualKeyFor(u);return walkArt[genericKey]&&walkFrameBounds[genericKey]?genericKey:null}"),'named units must fall back to their troop-family authored walk sheet');
check(game.includes("u.troop==='cavalry'||u.troop==='heavyCavalry'"),'heavy cavalry must use the authored cavalry walk family');
check(!game.includes("function walkKeyFor(u){if(walkArt[u.id])return u.id;if(art[u.id])return null;return genericVisualKeyFor(u)}"),'static named art must never disable the troop-family walk fallback');
check(!game.includes('stepLift=')&&!game.includes('banditGait=')&&!game.includes('if(walking&&!authoredWalk){ctx.rotate'),'synthetic hopping/rotation must not substitute for authored walking frames');
check(game.includes('const GLOBAL_MOVEMENT_SPEED=1.5'),'global battlefield movement must be 50% faster');
check(game.includes('/(animationSpeed*GLOBAL_MOVEMENT_SPEED)'),'all battlefield movement must apply the global speed multiplier');
check(!game.includes('walkPhase:segment+p*1.5'),'walk phase still jumps backwards at tile boundaries');

const huainan=levels.find(([,level])=>level.id==='huainan')?.[1];
check(huainan,'Huainan level is missing from the walk audit');
const miZhu=huainan.units.find(unit=>unit.id==='mizhu');
check(miZhu?.troop==='support','Huainan Mi Zhu must remain a military-band unit');
check(walkPaths.mizhu==='assets/level-10-huainan/units/mi-zhu-military-band-walk-v1.webp','Mi Zhu must use his dedicated four-direction military-band atlas');
check(fs.existsSync(path.join(root,walkPaths.mizhu)),'Mi Zhu dedicated walk atlas is missing');
const xuzhou=levels.find(([,level])=>level.id==='xuzhou')?.[1];
check(xuzhou,'Xuzhou level is missing from the walk audit');
const xuzhouSummary=xuzhou.units.map(unit=>`${unit.id}->${walkPaths[unit.id]?unit.id:genericKey(unit)}`);
console.log(`Walk animation verified: ${levels.length} levels, ${levels.reduce((sum,[,level])=>sum+level.units.length,0)} deployed units, ${troopTypes.size} troop families and ${resolvedAssets.size} authored atlases. Xuzhou: ${xuzhouSummary.join(', ')}.`);
