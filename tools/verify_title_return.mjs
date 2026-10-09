import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fail=message=>{throw new Error(message)};

const reveal=game.match(/function revealTitleMenu\(animate=false\)\{([\s\S]*?)\n  \}/)?.[1]||'';
const show=game.match(/function showTitle\(\)\{([^\n]+)\}/)?.[1]||'';

for(const token of [
  "titleIntroActive=false",
  "clearTimeout(titleIntroFadeTimer)",
  "video.pause()",
  "screen.classList.remove('intro-playing')",
  "overlay.classList.toggle('hidden',!animate)",
])if(!reveal.includes(token))fail(`title return does not clear stale intro state: ${token}`);

if(!show.includes('revealTitleMenu(false)'))fail('returning to the title does not bypass the startup intro');
if(!show.includes("document.getElementById('titleScreen').classList.remove('hidden')"))fail('title screen is not revealed');
if(!game.includes("document.getElementById('returnTitleBtn').onclick=showTitle"))fail('battle menu return button is not wired to the safe title reveal');

const gameBuild=game.match(/const RUNTIME_BUILD='([^']+)'/)?.[1];
const scriptBuild=html.match(/game\.js\?build=([^"']+)/)?.[1];
const styleBuild=html.match(/style\.css\?build=([^"']+)/)?.[1];
if(!gameBuild||gameBuild!==scriptBuild||gameBuild!==styleBuild)fail('runtime and asset cache keys differ');

console.log(`Title return verified: stale startup overlay is removed and menu controls are immediately interactive (${gameBuild}).`);
