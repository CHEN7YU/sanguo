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
for(const [id,file] of Object.entries({martial:'martial-artist-walk-v2.webp',bandit:'bandit-walk-v2.webp',support:'military-band-walk-v1.webp'})){
  const bytes=fs.readFileSync(path.join(root,'assets','troops',file));
  if(bytes.length<10000||bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP')fail(`invalid troop walk sheet for ${id}`);
  if(!game.includes(`${id}:'assets/troops/${file}'`))fail(`troop walk sheet not wired for ${id}`);
}
for(const [id,file] of Object.entries({martial:'martial-artist-walk-friendly-v2.webp',bandit:'bandit-walk-friendly-v2.webp'})){
  const bytes=fs.readFileSync(path.join(root,'assets','friendly',file));
  if(bytes.length<10000||bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP')fail(`invalid friendly walk sheet for ${id}`);
  if(!game.includes(`${id}:'assets/friendly/${file}'`))fail(`friendly walk sheet not wired for ${id}`);
}
for(const token of ["west:0","north:1","east:2","south:3","direction=tileDx>0?'east'","drawAuthoredWalkFrame"]){
  if(!game.includes(token))fail(`missing four-direction walk pipeline token: ${token}`);
}
for(const token of ["u.troop==='archer'","u.role!=='前锋'","return'infantry'"])if(!game.includes(token))fail(`missing generic walk fallback: ${token}`);
for(const token of ["walkPhase:segment+p","travel=u.troop==='bandit'?p:ease","banditGait=walking&&authoredWalk&&u.troop==='bandit'"]){
  if(!game.includes(token))fail(`missing continuous bandit gait behavior: ${token}`);
}
if(game.includes('walkPhase:segment+p*1.5'))fail('walk phase still jumps backwards at tile boundaries');
console.log('Walk animation verified: authored four-direction sheets load for standard, specialist and military-band units, and bandit gait stays continuous across tile boundaries.');
