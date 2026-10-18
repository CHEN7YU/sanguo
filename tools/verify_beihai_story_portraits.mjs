import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const releaseRoot=process.argv[2]?path.resolve(process.argv[2]):null;
const storySource=fs.readFileSync(path.join(root,'story-data.js'),'utf8');
const gameSource=fs.readFileSync(path.join(root,'game.js'),'utf8');
const sandbox={window:{}};
vm.runInNewContext(storySource,sandbox,{filename:'story-data.js'});

const story=sandbox.window.BEIHAI_PRE_BATTLE_STORY||[];
const ignored=new Set(['史官','军报','提示']);
const speakers=[...new Set(story.map(line=>line.speaker).filter(name=>name&&!ignored.has(name)))];
const block=gameSource.match(/const storyPortraits=\{([\s\S]*?)\};/)?.[1]||'';
const rootPath=gameSource.match(/const storyPortraitRoot=['"]([^'"]+)['"]/)?.[1]||'';
const mappings=new Map();
const portraitStart=gameSource.indexOf('const portraitPaths');
const portraitOpen=gameSource.indexOf('{',portraitStart);
const portraitEnd=gameSource.indexOf('};',portraitOpen);
const portraitBlock=portraitStart>=0&&portraitOpen>=0&&portraitEnd>=0?gameSource.slice(portraitOpen+1,portraitEnd):'';
const unitPortraits=new Map();
for(const segment of portraitBlock.split(',')){
  const colon=segment.indexOf(':');
  if(colon<0)continue;
  const id=segment.slice(0,colon).trim(),raw=segment.slice(colon+1).trim(),quote=raw[0],end=raw.indexOf(quote,1);
  if(!id||!['"',"'"].includes(quote)||end<0)continue;
  const value=raw.slice(1,end);
  if(value.startsWith('assets/'))unitPortraits.set(id,value);
}
for(const match of block.matchAll(/([\u3400-\u9fff]+):storyPortraitRoot\+'([^']+)'/g))mappings.set(match[1],rootPath+match[2]);
for(const match of block.matchAll(/([\u3400-\u9fff]+):['"](assets\/[^'"]+)['"]/g))mappings.set(match[1],match[2]);

for(const segment of block.split(',')){
  const colon=segment.indexOf(':');
  if(colon<0)continue;
  const name=segment.slice(0,colon).trim(),raw=segment.slice(colon+1).trim();
  if(!raw.startsWith('portraitPaths.'))continue;
  const resolved=unitPortraits.get(raw.slice('portraitPaths.'.length).trim());
  if(resolved)mappings.set(name,resolved);
}

const missingMappings=speakers.filter(name=>!mappings.has(name));
const missingSource=speakers.filter(name=>mappings.has(name)&&!fs.existsSync(path.join(root,...mappings.get(name).split('/'))));
const missingRelease=releaseRoot?speakers.filter(name=>mappings.has(name)&&!fs.existsSync(path.join(releaseRoot,...mappings.get(name).split('/')))):[];
if(missingMappings.length||missingSource.length||missingRelease.length){
  if(missingMappings.length)console.error(`Missing Beihai portrait mappings: ${missingMappings.join('、')}`);
  if(missingSource.length)console.error(`Missing Beihai source portraits: ${missingSource.join('、')}`);
  if(missingRelease.length)console.error(`Missing Beihai release portraits: ${missingRelease.join('、')}`);
  process.exit(1);
}
console.log(`Beihai story portraits verified: ${speakers.length} speakers${releaseRoot?' in source and release':' in source'}.`);
