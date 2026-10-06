import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const releaseRoot=path.resolve(process.argv[2]||path.join(projectRoot,'site-test','dist'));
const sourceFiles=fs.readdirSync(releaseRoot,{withFileTypes:true})
  .filter(entry=>entry.isFile()&&/\.(?:html|css|js)$/i.test(entry.name))
  .map(entry=>path.join(releaseRoot,entry.name));
const assetPattern=/assets\/[A-Za-z0-9_./\- ()\u3400-\u9fff]+?\.(?:png|jpe?g|webp|avif|svg|mp3|opus|wav|mp4)/g;
const references=new Set();
for(const source of sourceFiles){
  const text=fs.readFileSync(source,'utf8');
  for(const match of text.matchAll(assetPattern))references.add(match[0]);
}
const missing=[...references].filter(reference=>!fs.existsSync(path.join(releaseRoot,...reference.split('/')))).sort();
if(missing.length){
  console.error(`Release asset verification failed: ${missing.length} referenced files are absent from ${releaseRoot}`);
  for(const file of missing)console.error(file);
  process.exit(1);
}
const bytes=[...references].reduce((sum,reference)=>sum+fs.statSync(path.join(releaseRoot,...reference.split('/'))).size,0);
console.log(`Release asset verification passed: ${references.size} referenced assets, ${(bytes/1048576).toFixed(2)} MiB.`);
