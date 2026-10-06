import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const storySource=fs.readFileSync(path.join(root,'story-data.js'),'utf8');
const fail=message=>{throw new Error(message)};
const groups=[
  ['storyPortraitRoot','assets/story-portraits/remaster-v4'],
  ['storyActorRoot','assets/story-actors/remaster-v3'],
  ['storyGestureRoot','assets/story-actors/gestures-v1']
];

let checked=0;
for(const [symbol,directory] of groups){
  const matcher=new RegExp(`${symbol}\\+'([^']+)'`,'g');
  const names=[...game.matchAll(matcher)].map(match=>match[1]);
  if(!names.length)fail(`no ${symbol} assets found`);
  for(const name of new Set(names)){
    if(!name.endsWith('.webp'))fail(`${symbol} still references non-WebP asset: ${name}`);
    const file=path.join(root,directory,name);
    if(!fs.existsSync(file))fail(`missing story visual asset: ${path.relative(root,file)}`);
    if(fs.statSync(file).size<1024)fail(`story visual asset is unexpectedly small: ${path.relative(root,file)}`);
    checked++;
  }
}

const sandbox={window:{}};
vm.runInNewContext(storySource,sandbox);
const first=sandbox.window.PRE_BATTLE_STORY;
const guangchuan=sandbox.window.GUANGCHUAN_PRE_BATTLE_STORY;
const xindu=sandbox.window.XINDU_PRE_BATTLE_STORY;
const hulao=sandbox.window.HULAO_PRE_BATTLE_STORY;
const julu=sandbox.window.JULU_PRE_BATTLE_STORY;
for(const [name,story] of [['汜水关',first],['广川',guangchuan],['信都',xindu]]){
  const roam=story?.find(line=>line.freeRoam);
  if(!roam?.setup?.some(actor=>actor.name==='刘备'))fail(`${name} lost its existing Liu Bei free-roam scene`);
}
if(hulao?.some(line=>line.freeRoam))fail('虎牢关原作直行过场不应凭空增加自由行动');
if(julu?.some(line=>line.freeRoam))fail('后续巨鹿关应继续使用背景图与选项流程');

const dialogue=sandbox.window.NPC_DIALOGUE_BY_LEVEL;
for(const level of ['sishui-pass','guangchuan','xindu'])if(!dialogue?.[level])fail(`${level} NPC dialogue mapping is missing`);
console.log(`Story visuals verified: ${checked} optimized WebP assets resolve; early free-roam scenes remain in 汜水关、广川、信都.`);
