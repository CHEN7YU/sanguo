import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const release=path.join(root,'assets','level-05-jieqiao','wen-chou-animation');
const names=['walk','attack','critical','block','hurt','death'];
let total=0;
for(const name of names){
  const file=path.join(release,`wen-chou-${name}-v1.webp`),data=fs.readFileSync(file);
  assert.equal(data.subarray(0,4).toString(),'RIFF',`${name}: invalid WebP header`);
  assert.equal(data.subarray(8,12).toString(),'WEBP',`${name}: invalid WebP signature`);
  assert.ok(data.length>50000,`${name}: suspiciously small animation sheet`);
  total+=data.length;
}
assert.ok(total<2*1024*1024,`release set exceeds 2 MiB: ${total}`);

const boundsSource=fs.readFileSync(path.join(root,'wen-chou-animation-bounds.js'),'utf8');
const context={window:{}};vm.runInNewContext(boundsSource,context);
const bounds=context.window.WEN_CHOU_ANIMATION_BOUNDS;
assert.equal(bounds.walk.length,4);assert.ok(bounds.walk.every(row=>row.length===4));
for(const key of ['attack','critical','block','hurt','death'])assert.equal(bounds[key].length,5,`${key}: needs five frames`);

const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
for(const token of [
  "wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-walk-v1.webp'",
  "wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-attack-v1.webp'",
  "wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-critical-v1.webp'",
  "wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-block-v1.webp'",
  "wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-hurt-v1.webp'",
  "wenchou:'assets/level-05-jieqiao/wen-chou-animation/wen-chou-death-v1.webp'",
  'window.WEN_CHOU_ANIMATION_BOUNDS',
  "wenchou:'right'",
  "previewParams.has('reactionPreview')"
])assert.ok(game.includes(token),`missing runtime token: ${token}`);

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('wen-chou-animation-bounds.js'),'animation bounds are not loaded before runtime');
console.log(`Wen Chou animation set verified: ${names.length} sheets, ${(total/1048576).toFixed(2)} MiB.`);
