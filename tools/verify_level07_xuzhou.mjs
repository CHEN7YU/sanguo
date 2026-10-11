import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const check=(condition,message)=>{if(!condition)throw new Error(message)};
const loadScript=(file,context)=>vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});

const context={window:{}};
loadScript('level-07-xuzhou.js',context);
const level=context.window.LEVEL_07_XUZHOU;
check(level?.id==='xuzhou','Xuzhou level is not registered');
check(level.width===30&&level.height===18,'Xuzhou must use the decoded 30x18 grid');
check(level.terrain.length===18&&level.terrain.every(row=>row.length===30),'Xuzhou terrain dimensions are invalid');
const counts=level.terrain.flat().reduce((out,type)=>(out[type]=(out[type]||0)+1,out),{});
const expected={plain:236,forest:41,water:49,bridge:6,wall:12,city:5,grass:47,village:2,cliff:126,rough:16};
for(const [type,count] of Object.entries(expected))check(counts[type]===count,`${type} count differs from HEXZMAP: ${counts[type]} != ${count}`);
check(level.maxTurns===30&&level.victoryCondition==='eliminateAllEnemies','Turn limit or elimination victory is wrong');
check(level.alternateVictory.rect.x1===28&&level.alternateVictory.rect.x2===29&&level.alternateVictory.rect.y1===10&&level.alternateVictory.rect.y2===14,'Xuzhou city victory rectangle must use corrected tactical axes');

const byId=Object.fromEntries(level.units.map(unit=>[unit.id,unit]));
for(const [id,x,y] of [['liu',3,16],['guan',1,15],['zhang',2,15],['jian',2,16],['zhaoyun',2,17],['tao',29,12],['mifang',29,11],['sunqian',29,13],['yujin',25,12],['yuejin',15,1],['lidian',26,9],['guojia',24,14],['caohong',8,1],['xiahouyuan',4,1]]){
  check(byId[id]?.x===x&&byId[id]?.y===y,`${id} deployment is wrong`);
}
check(byId.taishici.side==='reserve'&&byId.taishici.x===-1,'Taishi Ci must begin off-map');
check(level.units.filter(unit=>unit.side==='enemy').length===17,'Original enemy deployment must contain 17 active units');
const reinforcement=level.timedEvents.find(event=>event.once==='xuzhou-taishici-turn5');
check(reinforcement?.turn===5&&reinforcement.spawns?.[0]?.x===6&&reinforcement.spawns?.[0]?.y===17,'Turn-five Taishi Ci reinforcement is wrong');
check(level.events.duel.attackerId==='guan'&&level.events.duel.defenderId==='yujin'&&level.events.duel.endsBattle===false,'Guan Yu vs Yu Jin duel is wrong');
check(level.events.duel.musicId===12&&level.events.victoryMusicId===2,'Xuzhou duel or victory music transition is missing');
check(level.events.battleReward===300&&level.alternateVictory.exp===50,'Original victory rewards are wrong');

const storyContext={window:{}};
loadScript('story-data.js',storyContext);
const story=storyContext.window.STORY_BY_LEVEL.xuzhou;
check(Array.isArray(story)&&story.length>=12,'Xuzhou prebattle story is incomplete');
for(const required of ['孔融','太史慈','张飞','关羽','糜竺'])check(story.some(line=>line.speaker===required),`Story is missing ${required}`);
check(story.some(line=>Array.isArray(line.conversationChoices)&&line.conversationChoices.length===3),'Xuzhou conversation choice scene is missing');

for(const relative of [level.battlefieldArt,'assets/audio/original-music-9.opus','docs/original-audit/level-07-xuzhou-audit.md','docs/original-audit/level-07-xuzhou-map.json'])check(fs.existsSync(path.join(root,relative)),`Missing Xuzhou resource: ${relative}`);
for(const id of ['yu-jin','yue-jin','li-dian','guo-jia','cao-hong','xiahou-yuan','mi-fang','sun-qian'])check(fs.existsSync(path.join(root,`assets/level-07-xuzhou/portraits/${id}-v1.webp`)),`Missing Xuzhou portrait: ${id}`);
for(const id of ['yujin','yuejin','lidian','guojia','caohong','xiahouyuan','mifang','sunqian','tao','transport']){
  for(const suffix of ['unit','action','walk'])check(fs.existsSync(path.join(root,`assets/level-07-xuzhou/units/${id}-${suffix}-v1.webp`)),`Missing Xuzhou unit asset: ${id}-${suffix}`);
}
check(fs.existsSync(path.join(root,'level-07-xuzhou-animation-bounds.js')),'Missing Xuzhou animation bounds');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const leaderboard=fs.readFileSync(path.join(root,'leaderboard.js'),'utf8');
check(game.includes("levelIndex==='9' ? window.LEVEL_07_XUZHOU"),'Level 9 loader is missing');
check(game.includes("targetId==='xuzhou'?'9'"),'Xuzhou save routing is missing');
check(game.includes("level.nextLevelId==='xuzhou'?'9'"),'Beihai-to-Xuzhou campaign routing is missing');
check(game.includes('alternateVictoryContains'),'Rectangular city victory runtime is missing');
check(game.includes("level.victoryCondition==='eliminateAllEnemies'"),'Elimination victory runtime is missing');
check(game.includes('recoverFromTransports')&&game.includes('bestSupportMove'),'Transport recovery or support AI is missing');
check(game.includes('xuzhouAuthoredCombatIds')&&game.includes("xuzhouCombatFrame(u,'attack'"),'Xuzhou authored animation remapping is missing');
check(game.includes("toLevelId:'xuzhou-postbattle'")&&game.includes('postBattleChoice:branch'),'Xuzhou postbattle branch save is missing');
check(game.includes("fillText('入城'"),'Xuzhou city objective highlight is missing');
check(index.includes('data-select-level="9"')&&index.includes('level-07-xuzhou.js'),'Xuzhou menu or script include is missing');
check(index.includes('data-xuzhou-branch="fight"')&&index.includes('data-xuzhou-branch="negotiate"'),'Xuzhou postbattle choices are missing');
check(leaderboard.includes("xuzhou: { name: '徐州之战'"),'Xuzhou leaderboard rule is missing');

console.log(`Xuzhou foundation verified: ${level.width}x${level.height}, ${level.units.length} units, ${story.length} story beats, reinforcement/duel/dual-victory/save/audio/leaderboard integration.`);
