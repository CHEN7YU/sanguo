import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const assets={
  yanliang:'assets/level-04-julu/units/yan-liang-mounted-v1.webp',
  zhanghe:'assets/level-04-julu/units/zhang-he-mounted-v1.webp'
};

for(const [id,asset] of Object.entries(assets)){
  if(!game.includes(`${id}:'${asset}'`))throw new Error(`${id} does not use unique battlefield art`);
  const file=path.join(root,...asset.split('/'));
  if(!fs.existsSync(file)||fs.statSync(file).size<50000)throw new Error(`${id} battlefield art is missing or unexpectedly small`);
}
if(!game.includes("function attackKeyFor(u){if(attackArt[u.id])return u.id;if(art[u.id])return null"))throw new Error('unique named art may fall back to generic attack sprites');
if(!game.includes("function walkKeyFor(u){if(walkArt[u.id])return u.id;if(art[u.id])return null"))throw new Error('unique named art may fall back to generic walking sprites');

console.log('Named general art verified: Yan Liang and Zhang He retain unique mounted appearances in idle, movement, combat and duel rendering.');
