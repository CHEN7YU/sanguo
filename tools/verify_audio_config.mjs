import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url));
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'audio-config.js'),'utf8'),sandbox);
const battles=sandbox.window.GAME_AUDIO_CONFIG?.battles;
const fail=message=>{throw new Error(message)};
for(const [id,asset] of Object.entries({'sishui-pass':'assets/audio/knights-errant.mp3','hulao-pass':'assets/audio/hulao-lubu-theme.mp3'})){
  if(battles?.[id]!==asset)fail(`wrong battle music for ${id}`);
  const full=path.join(root,...asset.split('/'));
  const file=fs.readFileSync(full);
  if(file.length<100000||file.subarray(0,3).toString()!=='ID3')fail(`invalid MP3 asset for ${id}`);
}
const jieqiaoTrack='assets/level-03/thousand-suns-dw7th-mix.opus';
if(battles?.jieqiao!==jieqiaoTrack)fail('wrong battle music for jieqiao');
const jieqiaoFile=fs.readFileSync(path.join(root,...jieqiaoTrack.split('/')));
if(jieqiaoFile.length<100000||jieqiaoFile.subarray(0,4).toString()!=='OggS')fail('invalid Opus asset for jieqiao');
console.log('Audio config verified: 汜水关、虎牢关和界桥之战 tracks are present and mapped by level id.');

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
