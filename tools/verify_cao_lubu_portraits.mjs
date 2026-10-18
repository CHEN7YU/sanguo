import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const root=new URL('../',import.meta.url);
const game=fs.readFileSync(new URL('game.js',root),'utf8');
const portraits=[
  ['曹操','assets/story-portraits/remaster-v6/cao-cao-v6.webp',1122,1402,true],
  ['赵云','assets/story-portraits/remaster-v6/zhao-yun-v6.webp',1122,1402,true],
  ['吕布','assets/story-portraits/remaster-v6/lv-bu-v6.webp',1122,1402,true],
  ['袁绍','assets/story-portraits/remaster-v6/yuan-shao-v6.webp',1122,1402,true],
  ['袁术','assets/story-portraits/remaster-v6/yuan-shu-v6.webp',1122,1402,true],
  ['董卓','assets/story-portraits/remaster-v6/dong-zhuo-v6.webp',1122,1402,true],
  ['道具屋','assets/story-portraits/remaster-v6/shopkeeper-v6.webp',1122,1402,true]
];

for(const [name,path,width,height,alpha] of portraits){
  const url=new URL(path,root);
  assert.ok(fs.existsSync(url),`${name} remaster portrait must exist`);
  const stat=fs.statSync(url);
  assert.ok(stat.size>=50000,`${name} portrait must be a production-quality asset`);
  const metadata=await sharp(fileURLToPath(url)).metadata();
  assert.equal(metadata.width,width,`${name} portrait width`);
  assert.equal(metadata.height,height,`${name} portrait height`);
  assert.equal(!!metadata.hasAlpha,alpha,`${name} portrait alpha standard`);
  assert.match(game,new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`${name} portrait must be used by the game`);
}

assert.doesNotMatch(game,/cao-cao-v[45]\.webp|lv-bu-v5\.webp|zhao-yun-portrait-v2\.webp|yuan-shao-v4\.webp|yuan-shu-v4\.webp|dong-zhuo-v4\.webp|shopkeeper-v4\.webp/);
console.log('Portrait remasters verified: main characters and the item-shop keeper use Liu Bei-standard transparent vertical v6 assets.');
