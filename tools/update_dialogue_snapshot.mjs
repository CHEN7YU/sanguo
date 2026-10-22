import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourceFiles=['level-01.js','level-02.js','level-03-guangchuan.js','level-03-xindu.js','level-04-julu.js','level-04-qinghe.js','level-05-jieqiao.js','level-06-beihai.js','level-07-xuzhou.js','level-08-xiaopei.js','level-09-taishan.js','level-10-huainan.js','story-data.js'];
const context={window:{},URLSearchParams,location:{search:'?dialogue=original'},localStorage:{getItem(){return null}}};
vm.createContext(context);
for(const file of sourceFiles)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});

const rows=[],seen=new WeakSet(),quoteKeys=new Set(['defeatQuote','criticalQuote','critQuote','blockQuote','quote']);
function walk(value,trail,speaker=''){
  if(value==null)return;
  if(typeof value==='string'){if(/[^\x00-\x7f]/.test(value)&&trail.some(part=>/NPC_DIALOGUE/i.test(String(part))))rows.push({path:trail.join('.'),speaker:String(trail.at(-2)||speaker),text:value});return}
  if(typeof value!=='object'||seen.has(value))return;
  seen.add(value);
  if(Array.isArray(value)){value.forEach((item,index)=>walk(item,[...trail,index],speaker));return}
  const nextSpeaker=typeof value.speaker==='string'?value.speaker:speaker;
  if(typeof value.text==='string'&&typeof value.speaker==='string')rows.push({path:trail.concat('text').join('.'),speaker:value.speaker,text:value.text});
  for(const[key,item]of Object.entries(value)){
    if(key==='speaker'||key==='text')continue;
    if(typeof item==='string'&&quoteKeys.has(key)&&/[^\x00-\x7f]/.test(item))rows.push({path:trail.concat(key).join('.'),speaker:value.name||nextSpeaker,text:item});
    else walk(item,[...trail,key],nextSpeaker);
  }
}
for(const[name,value]of Object.entries(context.window))walk(value,[name]);
const out={schema:1,capturedAt:'2026-10-22',sourceBuild:'20261022-huainan-story-v246',description:'Original authored story and battle dialogue before the Romance vernacular rewrite. Runtime source files remain unchanged; use ?dialogue=original to preview this version.',sourceFiles:[...sourceFiles,'game.js'],count:rows.length,rows};
const target=path.join(root,'docs','dialogue','original-dialogue-snapshot-20261013.json');
fs.writeFileSync(target,`${JSON.stringify(out,null,2)}\n`,'utf8');
console.log(`Dialogue snapshot updated: ${rows.length} original lines.`);
