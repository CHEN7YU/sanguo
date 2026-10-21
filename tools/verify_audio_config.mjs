import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url));
const fail=message=>{throw new Error(message)};
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'audio-config.js'),'utf8'),sandbox);
const battles=sandbox.window.GAME_AUDIO_CONFIG?.battles;
const library=sandbox.window.GAME_AUDIO_CONFIG?.library;
const stories=sandbox.window.GAME_AUDIO_CONFIG?.stories;
const events=sandbox.window.GAME_AUDIO_CONFIG?.events;
const victory=sandbox.window.GAME_AUDIO_CONFIG?.victory;
const emperorTheme=library?.['romance-of-the-three-kingdoms-13-emperors-theme-taoyuan-oath'];
if(emperorTheme?.title!=='皇帝のテーマ〈桃園の誓い〉'||emperorTheme?.source!=='三國志13'||emperorTheme?.usage!=='victory-xuzhou-and-later')fail('统一胜利曲 library metadata is missing');
if(emperorTheme?.asset!=='assets/audio/romance-of-the-three-kingdoms-13-emperors-theme-taoyuan-oath.opus'||victory!==emperorTheme.asset)fail('统一胜利曲 mapping is wrong');
const emperorThemeFile=fs.readFileSync(path.join(root,...emperorTheme.asset.split('/')));
if(emperorThemeFile.length<2000000||emperorThemeFile.subarray(0,4).toString()!=='OggS')fail('统一胜利曲 compressed Opus asset is missing or invalid');
const eternity=library?.['romance-of-the-three-kingdoms-11-eternity'];
if(eternity?.title!=='悠久〈Eternity〉'||eternity?.source!=='三國志11'||eternity?.usage!=='story-luoyang')fail('悠久 library metadata is missing');
if(eternity?.asset!=='assets/audio/romance-of-the-three-kingdoms-11-eternity.opus'||stories?.luoyang!==eternity.asset)fail('洛阳剧情 music is not mapped to 悠久');
const eternityFile=fs.readFileSync(path.join(root,...eternity.asset.split('/')));
if(eternityFile.length<700000||eternityFile.subarray(0,4).toString()!=='OggS')fail('悠久 compressed Opus asset is missing or invalid');
const springBuds=library?.['romance-of-the-three-kingdoms-11-spring-buds'];
if(springBuds?.title!=='春の萌芽〈Spring Buds〉'||springBuds?.source!=='三國志11'||springBuds?.usage!=='story-tent')fail('春の萌芽 library metadata is missing');
if(springBuds?.asset!=='assets/audio/romance-of-the-three-kingdoms-11-spring-buds.opus'||stories?.tent!==springBuds.asset)fail('帐篷剧情 music is not mapped to 春の萌芽');
const springBudsFile=fs.readFileSync(path.join(root,...springBuds.asset.split('/')));
if(springBudsFile.length<1000000||springBudsFile.subarray(0,4).toString()!=='OggS')fail('春の萌芽 compressed Opus asset is missing or invalid');
const prologue=library?.['romance-of-the-three-kingdoms-11-prologue'];
if(prologue?.title!=='序章〈Prologue〉'||prologue?.source!=='三國志11'||prologue?.usage!=='story-world-map')fail('序章 library metadata is missing');
if(prologue?.asset!=='assets/audio/romance-of-the-three-kingdoms-11-prologue.opus'||stories?.world!==prologue.asset)fail('世界地图剧情 music is not mapped to 序章');
const prologueFile=fs.readFileSync(path.join(root,...prologue.asset.split('/')));
if(prologueFile.length<1000000||prologueFile.subarray(0,4).toString()!=='OggS')fail('序章 compressed Opus asset is missing or invalid');
const onesSide=library?.['langrisser-ii-ones-side'];
if(onesSide?.title!=="One's Side"||onesSide?.source!=='Langrisser II'||onesSide?.version!=='Mega Drive')fail("One's Side library metadata is missing");
if(onesSide?.usage!=='taishan,xuzhou-taishici-reinforcement')fail("One's Side usage metadata is wrong");
if(onesSide?.asset!=='assets/audio/langrisser-ii-ones-side.opus')fail("One's Side library asset is wrong");
if(battles?.taishan!==onesSide.asset)fail('泰山之战 battle music is not mapped to One\'s Side');
if(events?.['xuzhou-taishici-turn5']!==onesSide.asset)fail('徐州第5回合太史慈援军 music is not mapped to One\'s Side');
const onesSidePath=path.join(root,onesSide.asset);
if(!fs.existsSync(onesSidePath)||fs.statSync(onesSidePath).size<1000000)fail("One's Side compressed audio is missing or invalid");
const huainanTheme=library?.['dynasty-warriors-7-thousand-suns-dw7th-mix'];
if(huainanTheme?.title!=='Thousand Suns -DW 7TH MIX-'||huainanTheme?.usage!=='guangchuan,xindu,jieqiao,huainan'||battles?.huainan!==huainanTheme.asset)fail('淮南之战 music mapping is wrong');
const huainanThemeFile=fs.readFileSync(path.join(root,...huainanTheme.asset.split('/')));
if(huainanThemeFile.length<100000||huainanThemeFile.subarray(0,4).toString()!=='OggS')fail('淮南之战 compressed Opus asset is missing or invalid');
const shopTheme=library?.['langrisser-ii-theme'];
if(shopTheme?.title!=='Theme of Langrisser'||shopTheme?.source!=='Langrisser II'||shopTheme?.usage!=='shop')fail('Theme of Langrisser library metadata is missing');
if(shopTheme?.asset!=='assets/audio/langrisser-ii-theme-of-langrisser.opus')fail('Theme of Langrisser library asset is wrong');
if(sandbox.window.GAME_AUDIO_CONFIG?.shop!==shopTheme.asset)fail('Global shop music is not mapped to Theme of Langrisser');
const shopThemePath=path.join(root,shopTheme.asset);
if(!fs.existsSync(shopThemePath)||fs.statSync(shopThemePath).size<400000)fail('Theme of Langrisser compressed audio is missing or invalid');
const enemyReinforcements=library?.['langrisser-ii-enemy-reinforcements'];
if(enemyReinforcements?.title!=='Enemy Reinforcements'||enemyReinforcements?.source!=='Langrisser II'||enemyReinforcements?.usage!=='unassigned')fail('Enemy Reinforcements library metadata is missing');
if(enemyReinforcements?.asset!=='assets/audio/langrisser-ii-enemy-reinforcements.opus')fail('Enemy Reinforcements library asset is wrong');
const enemyReinforcementsPath=path.join(root,enemyReinforcements.asset);
if(!fs.existsSync(enemyReinforcementsPath)||fs.statSync(enemyReinforcementsPath).size<1000000)fail('Enemy Reinforcements compressed audio is missing or invalid');
const leon=library?.['langrisser-ii-leon'];
if(leon?.title!=='Leon'||leon?.source!=='Langrisser II'||leon?.usage!=='unassigned')fail('Leon library metadata is missing');
if(leon?.asset!=='assets/audio/langrisser-ii-leon.opus')fail('Leon library asset is wrong');
const leonPath=path.join(root,leon.asset);
if(!fs.existsSync(leonPath)||fs.statSync(leonPath).size<1000000)fail('Leon compressed audio is missing or invalid');
const noSurrender=library?.['langrisser-ii-no-surrender'];
if(noSurrender?.title!=='No Surrender'||noSurrender?.source!=='Langrisser II'||noSurrender?.usage!=='unassigned')fail('No Surrender library metadata is missing');
if(noSurrender?.asset!=='assets/audio/langrisser-ii-no-surrender.opus')fail('No Surrender library asset is wrong');
const noSurrenderPath=path.join(root,noSurrender.asset);
if(!fs.existsSync(noSurrenderPath)||fs.statSync(noSurrenderPath).size<1500000)fail('No Surrender compressed audio is missing or invalid');
const welcomeToChina=library?.['dynasty-warriors-6-welcome-to-china'];
if(welcomeToChina?.title!=='WELCOME TO CHINA'||welcomeToChina?.source!=='Dynasty Warriors 6'||welcomeToChina?.usage!=='sishui-pass,xuzhou')fail('WELCOME TO CHINA library metadata is missing');
if(welcomeToChina?.asset!=='assets/audio/dynasty-warriors-6-welcome-to-china.opus')fail('WELCOME TO CHINA library asset is wrong');
if(battles?.['sishui-pass']!==welcomeToChina.asset)fail('汜水关 battle music is not mapped to WELCOME TO CHINA');
if(battles?.xuzhou!==welcomeToChina.asset)fail('徐州之战 battle music is not mapped to WELCOME TO CHINA');
const welcomeFile=fs.readFileSync(path.join(root,...welcomeToChina.asset.split('/')));
if(welcomeFile.length<1000000||welcomeFile.subarray(0,4).toString()!=='OggS')fail('WELCOME TO CHINA compressed Opus asset is missing or invalid');
const welcomeMaster=path.join(root,'assets-master','audio','dynasty-warriors-6-welcome-to-china.mp3');
if(!fs.existsSync(welcomeMaster)||fs.statSync(welcomeMaster).size<2000000)fail('WELCOME TO CHINA master MP3 is missing');
const arena=library?.['dynasty-warriors-2-arena'];
if(arena?.title!=='ARENA〈行军〉'||arena?.source!=='Dynasty Warriors 2'||arena?.usage!=='qinghe,xiaopei')fail('ARENA library metadata is missing');
if(arena?.asset!=='assets/audio/dynasty-warriors-2-arena.opus')fail('ARENA library asset is wrong');
if(battles?.qinghe!==arena.asset)fail('清河之战 battle music is not mapped to ARENA');
if(battles?.xiaopei!==arena.asset)fail('小沛之战 battle music is not mapped to ARENA');
const arenaFile=fs.readFileSync(path.join(root,...arena.asset.split('/')));
if(arenaFile.length<1000000||arenaFile.subarray(0,4).toString()!=='OggS')fail('ARENA compressed Opus asset is missing or invalid');
const arenaMaster=path.join(root,'assets-master','audio','dynasty-warriors-2-arena.mp3');
if(!fs.existsSync(arenaMaster)||fs.statSync(arenaMaster).size<2000000)fail('ARENA master MP3 is missing');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
if(!game.includes("16:window.GAME_AUDIO_CONFIG?.victory||'assets/audio/romance-of-the-three-kingdoms-13-emperors-theme-taoyuan-oath.opus'")||!game.includes('Number(levelIndex)>=9?DEFAULT_CAMPAIGN_VICTORY_MUSIC_ID:null'))fail('统一胜利曲 runtime fallback is missing');
for(const file of ['level-07-xuzhou.js','level-08-xiaopei.js','level-09-taishan.js','level-10-huainan.js'])if(!fs.readFileSync(path.join(root,file),'utf8').includes('victoryMusicId:16'))fail(file+' is not assigned to the unified victory theme');
const sfxSandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'battle-sfx.js'),'utf8'),sfxSandbox);
if(typeof sfxSandbox.window.BattleSfx?.duelClash!=='function')fail('Duel weapon-clash sound is missing');
if(typeof sfxSandbox.window.BattleSfx?.duelFinish!=='function')fail('Duel finishing flesh-hit sound is missing');
if(!game.includes("battleSfx('duelClash',actor,{heavy:true})")||!game.includes("battleSfx('duelClash',h,{heavy:true})"))fail('Ordinary duel contacts are not using the weapon-clash sound');
if(!game.includes("battleSfx('duelFinish',lvbu,{critical:true})")||!game.includes("battleSfx('duelFinish',h,{critical:true})"))fail('Decisive duel blows are not using the finishing flesh-hit sound');
for(const token of [
  'const configuredShopTrack=window.GAME_AUDIO_CONFIG?.shop',
  'SHOP_MUSIC_VOLUME_MULTIPLIER=1.3',
  'TENT_MUSIC_VOLUME_MULTIPLIER=2.2',
  'LUOYANG_MUSIC_VOLUME_MULTIPLIER=2',
  'WORLD_MUSIC_VOLUME_MULTIPLIER=1.5',
  "storyMusicMode==='shop'?SHOP_MUSIC_VOLUME_MULTIPLIER:storyMusicId===14?TENT_MUSIC_VOLUME_MULTIPLIER:storyMusicId===13?LUOYANG_MUSIC_VOLUME_MULTIPLIER:storyMusicId===17?WORLD_MUSIC_VOLUME_MULTIPLIER:1",
  'function startShopMusic()',
  "storyMusicMode='shop'",
  "classList.remove('hidden');startShopMusic();syncShop()",
  "else if(!document.getElementById('shopOverlay').classList.contains('hidden'))startShopMusic()"
])if(!game.includes(token))fail(`Shop music runtime integration is missing: ${token}`);
for(const [id,asset] of Object.entries({'hulao-pass':'assets/audio/hulao-lubu-theme.mp3','beihai':'assets/audio/hulao-lubu-theme.mp3'})){
  if(battles?.[id]!==asset)fail(`wrong battle music for ${id}`);
  const full=path.join(root,...asset.split('/'));
  const file=fs.readFileSync(full);
  if(file.length<100000||file.subarray(0,3).toString()!=='ID3')fail(`invalid MP3 asset for ${id}`);
}
const jieqiaoTrack='assets/level-03/thousand-suns-dw7th-mix.opus';
if(battles?.jieqiao!==jieqiaoTrack)fail('wrong battle music for jieqiao');
const jieqiaoFile=fs.readFileSync(path.join(root,...jieqiaoTrack.split('/')));
if(jieqiaoFile.length<100000||jieqiaoFile.subarray(0,4).toString()!=='OggS')fail('invalid Opus asset for jieqiao');
console.log("Audio config verified: 淮南使用 Thousand Suns -DW 7TH MIX-；清河与小沛使用 ARENA；汜水关与徐州使用 WELCOME TO CHINA；其余已开放关卡曲目均已正确映射。");

for(const levelFile of ['level-03-guangchuan.js','level-03-xindu.js']){
  const levelSandbox={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,levelFile),'utf8'),levelSandbox);
  const level=levelFile.includes('xindu')?levelSandbox.window.LEVEL_03_XINDU:levelSandbox.window.LEVEL_03_GUANGCHUAN;
  const expected='assets/level-03/thousand-suns-dw7th-mix.opus';
  if(level?.battleTrack!==expected)fail(`wrong third-battle music in ${levelFile}`);
  const full=path.join(root,...expected.split('/'));
  const file=fs.readFileSync(full);
  if(file.length<100000||file.subarray(0,4).toString()!=='OggS')fail(`invalid Opus asset for ${levelFile}`);
}
console.log('Audio config verified: both third-battle branches use Thousand Suns -DW 7TH MIX-.');
