import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),sharp=require('sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'assets','mounted-combat-v1');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const expectedAttack=['guan','zhang','gongsun','hua','lvbu','zhangliao','houcheng','zhaoyun','wenchou','yanliang','zhanghe','quyi','taishici','caocao','xiahoudun','xiahouyuan','yuejin'];
const expectedCritical=['zhaoyun','wenchou','yanliang','zhanghe','quyi'];
assert.deepEqual(Object.keys(manifest.attack),expectedAttack);
assert.deepEqual(Object.keys(manifest.critical),expectedCritical);
assert.equal(manifest.directionalAttack.zhaoyun.length,4);

function significantComponents(alpha,width,height){const seen=new Uint8Array(width*height),queue=new Int32Array(width*height),sizes=[];for(let start=0;start<seen.length;start++){if(seen[start]||alpha[start]<=2)continue;let head=0,tail=0,size=0;queue[tail++]=start;seen[start]=1;while(head<tail){const p=queue[head++],y=Math.floor(p/width),x=p-y*width;size++;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const q=ny*width+nx;if(seen[q]||alpha[q]<=2)continue;seen[q]=1;queue[tail++]=q}}if(size>=20)sizes.push(size)}return sizes.sort((a,b)=>b-a)}

let total=0,frames=0;
for(const name of fs.readdirSync(dir).filter(name=>name.endsWith('.webp')).sort()){
 const file=path.join(dir,name),decoded=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true}),{width,height}=decoded.info,rows=name==='zhaoyun-directional-attack.webp'?4:1,cols=5;
 assert.equal(width%cols,0,`${name}: width must divide into five isolated frames`);assert.equal(height%rows,0,`${name}: height must divide into ${rows} rows`);const cellW=width/cols,cellH=height/rows;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const alpha=new Uint8Array(cellW*cellH);for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++)alpha[y*cellW+x]=decoded.data[((row*cellH+y)*width+col*cellW+x)*4+3];for(let edge=0;edge<2;edge++){for(let x=0;x<cellW;x++){assert.ok(alpha[edge*cellW+x]<=2,`${name} row ${row} frame ${col}: top gutter is not transparent`);assert.ok(alpha[(cellH-1-edge)*cellW+x]<=2,`${name} row ${row} frame ${col}: bottom gutter is not transparent`)}for(let y=0;y<cellH;y++){assert.ok(alpha[y*cellW+edge]<=2,`${name} row ${row} frame ${col}: left gutter is not transparent`);assert.ok(alpha[y*cellW+cellW-1-edge]<=2,`${name} row ${row} frame ${col}: right gutter is not transparent`)}}const components=significantComponents(alpha,cellW,cellH);assert.equal(components.length,1,`${name} row ${row} frame ${col}: detached cross-frame fragment remains (${components.join(',')})`);frames++}
 total+=fs.statSync(file).size;
}
const game=fs.readFileSync(path.join(root,'game.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),mountedIds=game.match(/const mountedCombatAttackIds=\[([^\]]+)\]/)?.[1]||'';
for(const id of expectedAttack)assert.ok(mountedIds.includes(`'${id}'`),`${id}: cleaned attack sheet is not wired`);
assert.ok(game.includes("attackPaths[id]=`assets/mounted-combat-v1/${id}-attack.webp`"),'mounted attack path rewrite is missing');
for(const id of expectedCritical)assert.ok(game.includes(`assets/mounted-combat-v1/${id}-critical.webp`),`${id}: cleaned critical sheet is not wired`);
assert.ok(game.includes("hua:'assets/mounted-combat-v1/hua-attack-friendly.webp'"),'friendly generic cavalry must use cleaned attack sheet');
assert.ok(game.includes("zhaoyun:'assets/mounted-combat-v1/zhaoyun-directional-attack.webp'"),'Zhao Yun directional attack must use cleaned sheet');
assert.ok(game.includes('Object.assign(attackFrameBounds,mountedCombatCleanBounds.attack||{})'),'clean attack bounds must replace source-sheet bounds');
assert.ok(fs.readFileSync(path.join(root,'tools','build_mounted_combat_v1.mjs'),'utf8').includes('const GUTTER=2'),'mounted frames need transparent gutters to prevent canvas interpolation bleed');
assert.ok(html.indexOf('mounted-combat-bounds-v1.js')<html.indexOf('game.js?build='),'clean bounds must load before the game runtime');
console.log(`Mounted combat wrap verified: ${frames} isolated frames across ${total} compressed bytes.`);
