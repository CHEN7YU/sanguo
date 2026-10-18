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

const canonicalStoryPortraits=[
  ['刘备','liu'],['关羽','guan'],['张飞','zhang'],['公孙瓒','gongsun'],['陶谦','tao'],
  ['孔融','kongrong'],['吕布','lvbu'],['华雄','hua'],['李肃','li'],['胡轸','hu'],['赵岑','zhao']
];
for(const [name,id] of canonicalStoryPortraits){
  if(!game.includes(name+':portraitPaths.'+id))fail(name+' story portrait must reuse the canonical battle portrait');
}
const zhaoyunStorySheet="赵云:storyActorRoot+'zhao-yun-walk-sheet-v1.webp'";
if((game.match(new RegExp(zhaoyunStorySheet.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length<2)fail('赵云室内与行军剧情必须统一使用专属步行小人');
if(game.includes("赵云:storyActorRoot+'gongsun-zan-walk-sheet-v4.webp'")||game.includes("赵云:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-walk-v2.webp'"))fail('赵云剧情仍在复用公孙瓒或战斗骑兵素材');

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
const qinghe=sandbox.window.QINGHE_PRE_BATTLE_STORY;
const jieqiao=sandbox.window.JIEQIAO_PRE_BATTLE_STORY;
for(const [name,story] of [['汜水关',first],['广川',guangchuan],['信都',xindu],['巨鹿',julu],['清河',qinghe],['界桥',jieqiao]]){
  const roam=story?.find(line=>line.freeRoam);
  if(!roam?.setup?.some(actor=>actor.name==='刘备'))fail(`${name} lost its Liu Bei free-roam scene`);
}
if(hulao?.some(line=>line.freeRoam))fail('虎牢关原作直行过场不应凭空增加自由行动');

const dialogue=sandbox.window.NPC_DIALOGUE_BY_LEVEL;
for(const level of ['sishui-pass','guangchuan','xindu','julu','qinghe','jieqiao'])if(!dialogue?.[level])fail(`${level} NPC dialogue mapping is missing`);
console.log(`Story visuals verified: ${checked} optimized WebP assets resolve; early free-roam scenes remain through 界桥.`);
