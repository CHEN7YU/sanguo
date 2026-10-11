import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const releaseRoot=path.resolve(process.argv[2]||path.join(projectRoot,'site-test','dist'));
const sourceFiles=fs.readdirSync(releaseRoot,{withFileTypes:true})
  .filter(entry=>entry.isFile()&&/\.(?:html|css|js)$/i.test(entry.name))
  .map(entry=>path.join(releaseRoot,entry.name));
const assetPattern=/assets\/[A-Za-z0-9_./\- ()\u3400-\u9fff]+?\.(?:png|jpe?g|webp|avif|svg|mp3|opus|wav|mp4)/g;
const assetRootPattern=/const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*['"](assets\/[A-Za-z0-9_./\- ()\u3400-\u9fff]+\/)["']/g;
const assetSuffixPattern='[A-Za-z0-9_./\\- ()\\u3400-\\u9fff]+?\\.(?:png|jpe?g|webp|avif|svg|mp3|opus|wav|mp4)';
const references=new Set();
for(const source of sourceFiles){
  const text=fs.readFileSync(source,'utf8');
  for(const match of text.matchAll(assetPattern))references.add(match[0]);
  for(const rootMatch of text.matchAll(assetRootPattern)){
    const variable=rootMatch[1].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const joinedPattern=new RegExp(`${variable}\\s*\\+\\s*['"](${assetSuffixPattern})['"]`,'g');
    for(const joinedMatch of text.matchAll(joinedPattern))references.add(rootMatch[2]+joinedMatch[1]);
  }
}
const missing=[...references].filter(reference=>!fs.existsSync(path.join(releaseRoot,...reference.split('/')))).sort();
if(missing.length){
  console.error(`Release asset verification failed: ${missing.length} referenced files are absent from ${releaseRoot}`);
  for(const file of missing)console.error(file);
  process.exit(1);
}
const bytes=[...references].reduce((sum,reference)=>sum+fs.statSync(path.join(releaseRoot,...reference.split('/'))).size,0);
console.log(`Release asset verification passed: ${references.size} referenced assets, ${(bytes/1048576).toFixed(2)} MiB.`);
