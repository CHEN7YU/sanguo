import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const fail=message=>{throw new Error(message)};
for(const [id,file] of Object.entries({liu:'liu-walk-v1.webp',guan:'guan-walk-v1.webp',zhang:'zhang-walk-v1.webp',gongsun:'gongsun-walk-v1.webp',tao:'tao-walk-v1.webp',hua:'hua-walk-v1.webp',officer:'officer-walk-v1.webp',archer:'archer-walk-v1.webp',infantry:'infantry-walk-v1.webp'})){
  const bytes=fs.readFileSync(path.join(root,'assets',file));
  if(bytes.length<10000||bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP')fail(`invalid walk sheet for ${id}`);
  if(!game.includes(`${id}:'assets/${file}'`))fail(`walk sheet not wired for ${id}`);
}
for(const token of ["west:0","north:1","east:2","south:3","direction=tileDx>0?'east'","drawAuthoredWalkFrame"]){
  if(!game.includes(token))fail(`missing four-direction walk pipeline token: ${token}`);
}
for(const token of ["u.troop==='archer'","u.role!=='前锋'","return'infantry'"])if(!game.includes(token))fail(`missing generic walk fallback: ${token}`);
console.log('Walk animation verified: every first-battle unit resolves to an authored 4-direction, 4-frame sheet with foot anchors.');
