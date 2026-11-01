import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const release=process.env.PREVIEW_RELEASE;
if(!release)throw Error('Set PREVIEW_RELEASE to the existing complete release directory');
const out=path.resolve(root,'../output/touch-preview-dist');
fs.mkdirSync(out,{recursive:true});
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const names=new Set(fs.readdirSync(release).filter(f=>/\.(?:html|css|m?js)$/.test(f)));
for(const m of index.matchAll(/(?:src|href)="([^"?]+\.(?:css|m?js))(?:\?[^\"]*)?"/g))if(!m[1].includes('/'))names.add(m[1]);
names.add('index.html');
for(const name of names){
 const source=fs.existsSync(path.join(root,name))?path.join(root,name):path.join(release,name);
 let text=fs.readFileSync(source,'utf8');
 if(/\.m?js$/.test(name)){
  text=text.replace(/\b(?:window\.)?localStorage\b/g,'window.TouchPreviewStorage')
   .replace(/\b(?:window\.)?sessionStorage\b/g,'window.TouchPreviewSession')
   .replaceAll('/api/','/sanguo-touch-preview/api/');
 }
 if(name==='index.html')text=text.replace('<head>','<head>\n<script src="preview-storage.js"></script>')
  .replace(/<script[^>]+src="analytics\.js[^>]*><\/script>/g,'')
  .replace('<title>','<title>触控预览 · ');
 fs.writeFileSync(path.join(out,name),text);
}
// A facade, not an override of browser Storage: production keys remain untouched.
fs.writeFileSync(path.join(out,'preview-storage.js'),`(()=>{
 const prefix='touch-preview-v1:';
 function isolate(storage){
  const keys=()=>Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(k=>k?.startsWith(prefix));
  return Object.freeze({getItem:k=>storage.getItem(prefix+k),setItem:(k,v)=>storage.setItem(prefix+k,v),removeItem:k=>storage.removeItem(prefix+k),clear:()=>keys().forEach(k=>storage.removeItem(k)),key:i=>keys()[i]?.slice(prefix.length)??null,get length(){return keys().length}});
 }
 window.TouchPreviewStorage=isolate(localStorage);window.TouchPreviewSession=isolate(sessionStorage);
})();`);
fs.writeFileSync(path.join(out,'preview-info.json'),JSON.stringify({kind:'isolated-touch-preview',created:new Date().toISOString(),storagePrefix:'touch-preview-v1:',apiDisabled:true,files:[...names]},null,2));
console.log(`Touch preview: ${names.size+2} files -> ${out}; assets are served from a pinned production release`);
