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
const onesSide=library?.['langrisser-ii-ones-side'];
if(onesSide?.title!=="One's Side"||onesSide?.source!=='Langrisser II'||onesSide?.version!=='Mega Drive')fail("One's Side library metadata is missing");
if(onesSide?.usage!=='taishan')fail("One's Side must be assigned to Taishan");
if(onesSide?.asset!=='assets/audio/langrisser-ii-ones-side.opus')fail("One's Side library asset is wrong");
if(battles?.taishan!==onesSide.asset)fail('泰山之战 battle music is not mapped to One\'s Side');
const onesSidePath=path.join(root,onesSide.asset);
if(!fs.existsSync(onesSidePath)||fs.statSync(onesSidePath).size<1000000)fail("One's Side compressed audio is missing or invalid");
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
if(arena?.title!=='ARENA〈行军〉'||arena?.source!=='Dynasty Warriors 2'||arena?.usage!=='xiaopei')fail('ARENA library metadata is missing');
if(arena?.asset!=='assets/audio/dynasty-warriors-2-arena.opus')fail('ARENA library asset is wrong');
if(battles?.xiaopei!==arena.asset)fail('小沛之战 battle music is not mapped to ARENA');
const arenaFile=fs.readFileSync(path.join(root,...arena.asset.split('/')));
if(arenaFile.length<1000000||arenaFile.subarray(0,4).toString()!=='OggS')fail('ARENA compressed Opus asset is missing or invalid');
const arenaMaster=path.join(root,'assets-master','audio','dynasty-warriors-2-arena.mp3');
if(!fs.existsSync(arenaMaster)||fs.statSync(arenaMaster).size<2000000)fail('ARENA master MP3 is missing');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const sfxSandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'battle-sfx.js'),'utf8'),sfxSandbox);
if(typeof sfxSandbox.window.BattleSfx?.duelClash!=='function')fail('Duel weapon-clash sound is missing');
if(typeof sfxSandbox.window.BattleSfx?.duelFinish!=='function')fail('Duel finishing flesh-hit sound is missing');
if(!game.includes("battleSfx('duelClash',actor,{heavy:true})")||!game.includes("battleSfx('duelClash',h,{heavy:true})"))fail('Ordinary duel contacts are not using the weapon-clash sound');
if(!game.includes("battleSfx('duelFinish',lvbu,{critical:true})")||!game.includes("battleSfx('duelFinish',h,{critical:true})"))fail('Decisive duel blows are not using the finishing flesh-hit sound');
for(const token of [
  'const configuredShopTrack=window.GAME_AUDIO_CONFIG?.shop',
  'SHOP_MUSIC_VOLUME_MULTIPLIER=1.3',
  "storyMusicMode==='shop'?SHOP_MUSIC_VOLUME_MULTIPLIER:1",
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
console.log("Audio config verified: 汜水关与徐州使用 WELCOME TO CHINA；其余已开放关卡曲目均已正确映射。");

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
