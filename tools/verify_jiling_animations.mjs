import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const game=read('game.js'),html=read('index.html'),level=read('level-10-huainan.js');
const animationRoot='assets/level-10-huainan/animation/ji-ling';
const actions=['walk','attack','critical','block','hurt','death'];
let total=0;

assert.match(level,/E\('jiling',69,'纪灵','袁术军主将','heavyCavalry'/,'Ji Ling must remain a named heavy cavalry commander');
for(const action of actions){
  const asset=`${animationRoot}/ji-ling-${action}-v1.webp`;
  const file=path.join(root,...asset.split('/'));
  assert.ok(game.includes(`jiling:'${asset}'`),`Ji Ling ${action} animation is not wired`);
  assert.ok(fs.existsSync(file),`missing ${asset}`);
  const size=fs.statSync(file).size;
  assert.ok(size>50000,`${asset} is unexpectedly small`);
  total+=size;
}
assert.ok(total<2*1024*1024,`Ji Ling animation set is too large: ${total}`);

const boundsSource=read('level-10-huainan-animation-bounds.js'),context={window:{}};
vm.runInNewContext(boundsSource,context);
const bounds=context.window.HUAINAN_ANIMATION_BOUNDS?.jiling;
assert.ok(bounds,'Ji Ling animation bounds are missing');
assert.equal(bounds.walk.length,4);assert.ok(bounds.walk.every(row=>row.length===4),'Ji Ling walk atlas must expose four directions and four frames');
for(const action of actions.slice(1)){
  assert.equal(bounds[action].length,5,`Ji Ling ${action} must expose five frames`);
  assert.ok(bounds[action].every(([x,y,w,h])=>x>=8&&y>=8&&w>100&&h>100),`Ji Ling ${action} frame padding/bounds are invalid`);
}
assert.ok(html.indexOf('level-10-huainan-animation-bounds.js')>html.indexOf('level-10-huainan.js'),'Huainan animation metadata must load with the level');
assert.ok(html.indexOf('level-10-huainan-animation-bounds.js')<html.indexOf('game.js'),'Huainan animation metadata must load before the runtime');
assert.ok(game.includes("const huainanAnimationBounds=window.HUAINAN_ANIMATION_BOUNDS||{}"),'runtime does not install Ji Ling frame bounds');
assert.ok(game.includes("criticalFrameBounds.jiling=jiLingBounds.critical"));
assert.ok(game.includes("blockFrameBounds.jiling=jiLingBounds.block"));

console.log(`Ji Ling animation verified: unique heavy-cavalry idle/walk, attack, critical, block, hurt and defeat sheets (${(total/1048576).toFixed(2)} MiB).`);
