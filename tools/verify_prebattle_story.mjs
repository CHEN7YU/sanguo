import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const source=fs.readFileSync(new URL('../story-data.js',import.meta.url),'utf8');
const sandbox={window:{}};vm.runInNewContext(source,sandbox);
const story=sandbox.window.PRE_BATTLE_STORY,npcs=sandbox.window.PRE_BATTLE_NPC_DIALOGUE;
const fail=message=>{throw new Error(message)};
if(!Array.isArray(story)||story.length<60)fail('prebattle story is incomplete');
for(const scene of ['prologue','palace','tent','luoyang','world'])if(!story.some(x=>x.scene===scene))fail(`missing scene ${scene}`);
for(const text of ['陛下，不要担心，把所有朝政都交给臣。','袁绍，袁术，谢谢二位将军响应檄文。','诸侯中有谁敢去迎战华雄？','我们兄弟愿往。','准备好了吗？']){
  if(!story.some(x=>x.text===text)&&!Object.values(npcs).flat().includes(text))fail(`missing original dialogue: ${text}`);
}
const roam=story.find(x=>x.freeRoam);if(!roam||!roam.setup?.some(x=>x.name==='道具屋')||!roam.setup?.some(x=>x.name==='关羽'))fail('free-roam camp setup is incomplete');
const march=story.find(x=>x.scene==='world'&&x.route);if(!march||!Array.isArray(march.route['华雄'])||march.route['华雄'].length<4||!Array.isArray(march.route['吕布'])||march.route['吕布'].length<2)fail('world-map march routes are incomplete');
for(const name of ['袁绍','曹操','袁术','孔融','公孙瓒','陶谦','张飞','道具屋','关羽'])if(!npcs[name]?.length)fail(`missing NPC conversation: ${name}`);
const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
for(const [scene,track] of Object.entries({prologue:2,palace:2,tent:12,luoyang:11,world:3})){
  if(!game.includes(`${scene}:${track}`))fail(`missing original music mapping ${scene} -> ${track}`);
}
if(!game.includes('routeStoryActor')||!game.includes('Object.entries(line.route||{})'))fail('story engine does not execute world-map routes');
if(!game.includes('nearestStoryWalkable')||game.includes('actor.x=target[0];actor.y=target[1]'))fail('story movement can still teleport actors through scenery');
if(!game.includes('Object.entries(line.face||{})')||!game.includes('gesture=wantsGesture&&dir<2'))fail('direction-aware dialogue facing is not wired to the story engine');
for(const name of ['刘备','曹操','关羽','张飞','袁绍','袁术','公孙瓒','陶谦','孔融','董卓','吕布','华雄','李儒','献帝','董承','武官','道具屋'])if(!game.includes(`${name}:storyGestureRoot`))fail(`missing authored talk/bow gesture sheet mapping for ${name}`);
for(const name of ['少女','夫人'])if(!game.includes(`${name}:storyActorRoot`))fail(`missing remastered palace attendant walk sheet for ${name}`);
if(!game.includes("type==='bow'")||!story.some(x=>x.gesture==='bow'))fail('authored bow gesture is not wired to story data');
const actors=new Map();let facedLines=0;
for(const line of story){
  if(line.setup){actors.clear();for(const actor of line.setup)actors.set(actor.name,{...actor})}
  for(const name of line.remove||[])actors.delete(name);
  for(const actor of line.spawn||[])actors.set(actor.name,{...actor});
  for(const changes of [line.move,line.thenMove])for(const [name,target] of Object.entries(changes||{})){const actor=actors.get(name);if(actor){actor.x=target[0];actor.y=target[1]}}
  for(const [name,route] of Object.entries(line.route||{})){const actor=actors.get(name),target=route.at(-1);if(actor&&target){actor.x=target[0];actor.y=target[1]}}
  if(line.face){facedLines++;for(const [name,target] of Object.entries(line.face)){if(!actors.has(name))fail(`facing actor missing at ${line.text}: ${name}`);if(typeof target==='string'&&!actors.has(target))fail(`facing target missing at ${line.text}: ${target}`)}}
  for(const name of line.removeAfter||[])actors.delete(name);
}
if(facedLines<40)fail(`too few authored facing beats: ${facedLines}`);
const tentNavigation={minX:3,maxX:28,minY:6,maxY:17,obstacles:[{x1:18,y1:9,x2:23,y2:12},{x1:28,y1:14,x2:28,y2:17},{x1:4,y1:8,x2:8,y2:10}]};
const blocked=point=>point[0]<tentNavigation.minX||point[0]>tentNavigation.maxX||point[1]<tentNavigation.minY||point[1]>tentNavigation.maxY||tentNavigation.obstacles.some(o=>point[0]>=o.x1&&point[0]<=o.x2&&point[1]>=o.y1&&point[1]<=o.y2);
for(const [index,line] of story.entries())if(line.scene==='tent'){
  for(const actor of [...(line.setup||[]),...(line.spawn||[])])if(blocked([actor.x,actor.y]))fail(`tent actor starts inside scenery at beat ${index+1}: ${actor.name}`);
  for(const type of ['move','thenMove'])for(const [name,target] of Object.entries(line[type]||{}))if(blocked(target))fail(`tent actor walks into scenery at beat ${index+1}: ${name}`);
}
for(const [text,speaker,target] of [
  ['陛下，不要担心，把所有朝政都交给臣。','董卓','献帝'],
  ['袁绍，袁术，谢谢二位将军响应檄文。','曹操','袁绍'],
  ['华雄，把守汜水关的任务交给你了。','董卓','华雄'],
  ['禀告主帅，华雄率领的董卓军攻过来了。','武官','袁绍'],
  ['我们兄弟愿往。','刘备','曹操']
]){
  const line=story.find(item=>item.text===text);if(line?.face?.[speaker]!==target)fail(`incorrect facing pair for ${text}`);
}
for(const track of [2,3,11,12]){
  const wavPath=path.join(root,`assets/audio/original-music-${track}.wav`);
  const wav=fs.readFileSync(wavPath);
  if(wav.length<100000||wav.subarray(0,4).toString()!=='RIFF'||wav.subarray(8,12).toString()!=='WAVE')fail(`invalid rendered original track ${track}`);
}
const hulao=sandbox.window.HULAO_PRE_BATTLE_STORY;
if(!Array.isArray(hulao)||hulao.length!==7)fail('Tiger Gate prebattle story must contain reward plus all six original march lines');
for(const text of ['缴获了黄金100！','敌人好像逃到了前面的虎牢关。大哥，该怎么办？','说什么呀？现在当然是乘胜追击了，我去！','唉！追上去了，还是那么鲁莽。','话不要这么说，我军士气也鼓舞起来了嘛。','现在应该乘势攻下虎牢关。','没办法。好！跟上张飞，进军虎牢关！'])if(!hulao.some(x=>x.text===text))fail(`missing Tiger Gate transition text: ${text}`);
if(!hulao.some(x=>x.route?.['李肃'])||!hulao.some(x=>x.route?.['张飞']))fail('Tiger Gate transition is missing Li Su retreat or Zhang Fei pursuit');
console.log(`Prebattle story verified: ${story.length} first-battle beats, ${hulao.length} Tiger Gate transition beats, ${facedLines} authored facing beats and original scene music present.`);
