import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),shared=path.join(root,'assets','level-03'),xindu=path.join(root,'assets','level-03-xindu');
function collect(dir){const files=[];function walk(p){for(const ent of fs.readdirSync(p,{withFileTypes:true})){const f=path.join(p,ent.name);ent.isDirectory()?walk(f):files.push(f)}}walk(dir);return files}
const sharedFiles=collect(shared),xinduFiles=collect(xindu),sourceFormats=/\.(?:png|wav)$/i;
assert.ok([...sharedFiles,...xinduFiles].every(f=>!sourceFormats.test(f)),`runtime level package contains source-format asset`);
const sharedAudio=sharedFiles.filter(f=>/\.(?:opus|ogg|mp3)$/i.test(f)),sharedAudioBytes=sharedAudio.reduce((sum,f)=>sum+fs.statSync(f).size,0);
const routes=[['Guangchuan',sharedFiles],['Xindu',[...xinduFiles,...sharedAudio]]];
for(const [name,files] of routes){const bytes=files.reduce((sum,f)=>sum+fs.statSync(f).size,0);assert.ok(bytes<=6*1024*1024,`${name} package ${(bytes/1048576).toFixed(2)} MiB exceeds 6 MiB`);console.log(`${name} runtime assets: ${(bytes/1048576).toFixed(2)} MiB across ${files.length} files (budget <= 6 MiB).`)}
