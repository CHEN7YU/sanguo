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
if(onesSide?.usage!=='unassigned')fail("One's Side must remain unassigned until a level is selected");
if(onesSide?.asset!=='assets/audio/langrisser-ii-ones-side.opus')fail("One's Side library asset is wrong");
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
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
for(const token of [
  'const configuredShopTrack=window.GAME_AUDIO_CONFIG?.shop',
  'function startShopMusic()',
  "storyMusicMode='shop'",
  "classList.remove('hidden');startShopMusic();syncShop()",
  "else if(!document.getElementById('shopOverlay').classList.contains('hidden'))startShopMusic()"
])if(!game.includes(token))fail(`Shop music runtime integration is missing: ${token}`);
for(const [id,asset] of Object.entries({'sishui-pass':'assets/audio/knights-errant.mp3','hulao-pass':'assets/audio/hulao-lubu-theme.mp3','beihai':'assets/audio/hulao-lubu-theme.mp3'})){
  if(battles?.[id]!==asset)fail(`wrong battle music for ${id}`);
  const full=path.join(root,...asset.split('/'));
  const file=fs.readFileSync(full);
  if(file.length<100000||file.subarray(0,3).toString()!=='ID3')fail(`invalid MP3 asset for ${id}`);
}
const jieqiaoTrack='assets/level-03/thousand-suns-dw7th-mix.opus';
if(battles?.jieqiao!==jieqiaoTrack)fail('wrong battle music for jieqiao');
const jieqiaoFile=fs.readFileSync(path.join(root,...jieqiaoTrack.split('/')));
if(jieqiaoFile.length<100000||jieqiaoFile.subarray(0,4).toString()!=='OggS')fail('invalid Opus asset for jieqiao');
console.log('Audio config verified: 汜水关、虎牢关、北海和界桥之战 tracks are present and mapped by level id.');

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
