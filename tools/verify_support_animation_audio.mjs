import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bounds=JSON.parse(fs.readFileSync(path.join(root,'docs','original-audit','support-animation-bounds.json'),'utf8'));
const fail=message=>{throw new Error(message)};

for(const [kind,file] of Object.entries({walk:'military-band-walk-v1.webp',attack:'military-band-attack-v1.webp'})){
  const bytes=fs.readFileSync(path.join(root,'assets','troops',file));
  if(bytes.length<100000||bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP')fail(`invalid military-band ${kind} sheet`);
  if(!game.includes(`support:'assets/troops/${file}'`))fail(`military-band ${kind} sheet is not wired`);
}
if(bounds.walk.length!==4||bounds.walk.some(row=>row.length!==4))fail('military-band walk sheet must expose 4 directions x 4 frames');
if(bounds.attack.length!==5)fail('military-band attack sheet must expose 5 frames');
for(const token of [
  "support:[[[85,0,193,293]",
  "support:[[15,102,419,552]",
  "['martial','bandit','support'].includes(key)",
  "!['martial','bandit','support'].includes(u.troop)",
])if(!game.includes(token))fail(`missing military-band renderer token: ${token}`);

if(!/<audio id="titleMusic"[^>]*\bautoplay\b/.test(html))fail('title music does not request immediate autoplay');
if(html.includes('titleIntroSoundBtn')||game.includes("getElementById('titleIntroSoundBtn')"))fail('obsolete sound-unlock button still present');
for(const token of [
  "document.addEventListener('pointerdown',unlockMusic,true)",
  "document.addEventListener('touchstart',unlockMusic",
  "document.addEventListener('keydown',unlockMusic,true)",
])if(!game.includes(token))fail(`missing page-wide audio unlock fallback: ${token}`);

console.log('Military-band walk/attack sheets and immediate title-audio startup path verified.');
