import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const root=new URL('../',import.meta.url);
const game=fs.readFileSync(new URL('game.js',root),'utf8');
const portraits=[
  ['曹操','assets/story-portraits/remaster-v5/cao-cao-v5.webp'],
  ['吕布','assets/story-portraits/remaster-v5/lv-bu-v5.webp']
];

for(const [name,path] of portraits){
  const url=new URL(path,root);
  assert.ok(fs.existsSync(url),`${name} remaster portrait must exist`);
  const stat=fs.statSync(url);
  assert.ok(stat.size>=50000,`${name} portrait must be a production-quality asset`);
  const metadata=await sharp(fileURLToPath(url)).metadata();
  assert.equal(metadata.width,512,`${name} portrait width`);
  assert.equal(metadata.height,512,`${name} portrait height`);
  assert.match(game,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`${name} portrait must be used by the game`);
}

assert.doesNotMatch(game,/cao-cao-v4\.webp|lv-bu-v4\.webp/);
console.log('Cao Cao and Lu Bu portrait remasters verified: v5 artwork, square production assets and live game references.');
