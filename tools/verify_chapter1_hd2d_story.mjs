import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.argv[2]||path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fail=message=>{throw new Error(message)};
const sandbox={window:{},URLSearchParams,location:{search:''},localStorage:{getItem(){return null}}};
vm.runInNewContext(read('story-data.js'),sandbox);
const stories=sandbox.window.STORY_BY_LEVEL;
const game=read('game.js');
const css=read('style.css');

const expected=['hulao-pass','guangchuan','xindu','julu','qinghe','jieqiao','beihai','xuzhou','xiaopei'];
for(const id of expected)if(!Array.isArray(stories[id])||stories[id].length<6)fail(`${id} 剧情缺失或过短`);

const art=[
  'warlord-command-tent-hd2d-v1.webp','pingyuan-council-hall-hd2d-v1.webp',
  'beiping-command-hall-hd2d-v1.webp','xuzhou-council-hall-hd2d-v1.webp',
  'hulao-pursuit-road-hd2d-v1.webp','jizhou-campaign-map-hd2d-v1.webp',
  'beihai-siege-hd2d-v1.webp','xiaopei-cao-camp-hd2d-v1.webp',
  'beihai-council-hall-hd2d-v1.webp','eastern-campaign-map-hd2d-v1.webp'
];
for(const file of art){
  const target=path.join(root,'assets/story-scenes/chapter-1-hd2d',file);
  if(!fs.existsSync(target))fail(`缺少 HD-2D 背景：${file}`);
  const size=fs.statSync(target).size;
  if(size<100_000||size>700_000)fail(`HD-2D 背景体积异常：${file} (${size})`);
  if(!game.includes(file))fail(`运行时未引用 HD-2D 背景：${file}`);
}
if(!game.includes('storyLocationProfiles')||!game.includes("overlay.dataset.storyArt=profile?'custom':'base'"))fail('运行时未按具体地点切换 HD-2D 背景');
if(!game.includes('primeStoryDialogue(line.speaker,line.text);await applyStoryMoment(line)'))fail('人物入场期间仍会显示空白或上一句对白');
if(!css.includes('[data-story-art="custom"] .story-prop'))fail('自定义背景仍会叠加旧营帐家具');
if(!css.includes('[data-story-art="custom"] .story-actors{inset:5% 0 30%!important'))fail('HD-2D 人物没有限制在对白框上方的安全舞台');
if(!read('story-data.js').includes("A('严纲',9,15,1,109)")||!read('story-data.js').includes("A('公孙越',9,15,1,108)"))fail('界桥两条分支仍有人物落在桥边水面');
const profileBlock=game.match(/const storyLocationProfiles=\[(.*?)\n  \];/s)?.[1]||'';
const locationMatchers=[...profileBlock.matchAll(/match:\/([^/]+)\//g)].map(match=>new RegExp(match[1]));
for(const [id,sequence] of [...expected.map(id=>[id,stories[id]]),['xiaopei-negotiate',sandbox.window.XIAOPEI_NEGOTIATE_STORY||[]]])for(const [index,line] of sequence.entries()){
  if(line.scene!=='prologue'&&!locationMatchers.some(pattern=>pattern.test(line.location)))fail(`${id} 第${index+1}段地点没有 HD-2D 背景：${line.location}`);
}

const portraitExceptions=new Set(['史官','军报','提示']);
const allSpeakers=new Set();
for(const id of expected)for(const line of stories[id])allSpeakers.add(line.speaker);
for(const line of sandbox.window.XIAOPEI_NEGOTIATE_STORY||[])allSpeakers.add(line.speaker);
for(const speaker of allSpeakers)if(!portraitExceptions.has(speaker)&&!game.includes(`${speaker}:`))fail(`剧情人物缺少头像或小人映射：${speaker}`);

const stagedStorySequences=expected.map(id=>[id,stories[id]]);
stagedStorySequences.push(['xiaopei-negotiate',sandbox.window.XIAOPEI_NEGOTIATE_STORY||[]]);
if(stagedStorySequences.at(-1)[1].length<10)fail('小沛议和分支剧情缺失或过短');
for(const [id,sequence] of stagedStorySequences){
  const actors=new Map();
  let setups=0,movements=0,facings=0;
  for(const [index,line] of sequence.entries()){
    if(line.setup){
      actors.clear();setups++;
      const occupied=new Set();
      for(const actor of line.setup){
        if(actor.x<0||actor.x>32||actor.y<0||actor.y>20)fail(`${id} 第${index+1}段 ${actor.name} 站位越界`);
        const key=`${actor.x},${actor.y}`;if(occupied.has(key))fail(`${id} 第${index+1}段人物重叠：${key}`);occupied.add(key);actors.set(actor.name,{...actor});
      }
    }
    for(const name of line.remove||[])actors.delete(name);
    for(const actor of line.spawn||[]){if(actor.x<0||actor.x>32||actor.y<0||actor.y>20)fail(`${id} 第${index+1}段 ${actor.name} 入场越界`);actors.set(actor.name,{...actor});}
    for(const changes of [line.move,line.thenMove])for(const [name,target] of Object.entries(changes||{})){movements++;if(!actors.has(name))fail(`${id} 第${index+1}段移动了不存在的人物：${name}`);if(target[0]<0||target[0]>32||target[1]<0||target[1]>20)fail(`${id} 第${index+1}段 ${name} 目标越界`);Object.assign(actors.get(name),{x:target[0],y:target[1]});}
    for(const [name,route] of Object.entries(line.route||{})){movements++;if(!actors.has(name))fail(`${id} 第${index+1}段路线人物不存在：${name}`);for(const target of route)if(target[0]<0||target[0]>32||target[1]<0||target[1]>20)fail(`${id} 第${index+1}段 ${name} 路线越界`);const target=route.at(-1);if(target)Object.assign(actors.get(name),{x:target[0],y:target[1]});}
    for(const [name,target] of Object.entries(line.face||{})){facings++;if(!actors.has(name))fail(`${id} 第${index+1}段转向人物不存在：${name}`);if(typeof target==='string'&&!actors.has(target))fail(`${id} 第${index+1}段朝向不存在的人物：${target}`);}
    for(const name of line.removeAfter||[])actors.delete(name);
  }
  if(id==='beihai'&&(setups<6||movements<8||facings<15))fail('北海战前剧情缺少完整场景编排');
  if(id==='xuzhou'&&(setups<3||movements<5||facings<8))fail('徐州战前剧情缺少完整场景编排');
  if(id==='xiaopei'&&(setups<4||movements<7||facings<12))fail('小沛战前剧情缺少完整场景编排');
  if(id==='xiaopei-negotiate'&&(setups<4||movements<6||facings<10))fail('小沛议和分支缺少完整场景编排');
}

const requiredActors=['赵云','管亥','太史慈','郭嘉','于禁','孙乾','陈登'];
for(const name of requiredActors)if(!game.includes(`${name}:`))fail(`后期剧情缺少重制人物：${name}`);
if(!game.includes("陈登:'assets/level-07-xuzhou/portraits/chen-deng-v1.webp'"))fail('陈登没有使用经原作核对的重绘头像');

console.log(`第2—10关 HD-2D 剧情校验通过：${expected.length}个关卡剧情、${art.length}张地点背景、人物站位/移动/朝向与关键头像映射均已覆盖。`);
