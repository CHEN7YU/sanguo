import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const release=path.join(root,'assets','level-05-jieqiao','zhao-yun-animation');
const names=['walk','directional-attack','attack','critical','block','hurt','death'];
let total=0;
for(const name of names){
  const file=path.join(release,`zhao-yun-${name}-v2.webp`),data=fs.readFileSync(file);
  assert.equal(data.subarray(0,4).toString(),'RIFF',`${name}: invalid WebP header`);
  assert.equal(data.subarray(8,12).toString(),'WEBP',`${name}: invalid WebP signature`);
  assert.ok(data.length>50000,`${name}: suspiciously small animation sheet`);
  total+=data.length;
}
assert.ok(total<4*1024*1024,`release set exceeds 4 MiB: ${total}`);

const source=fs.readFileSync(path.join(root,'zhao-yun-animation-bounds.js'),'utf8');
const context={window:{}};vm.runInNewContext(source,context);
const bounds=context.window.ZHAO_YUN_ANIMATION_BOUNDS;
assert.equal(bounds.walk.length,4);assert.ok(bounds.walk.every(row=>row.length===4));
assert.equal(bounds.directionalAttack.length,4);assert.ok(bounds.directionalAttack.every(row=>row.length===5));
for(const key of ['attack','critical','block','hurt','death'])assert.equal(bounds[key].length,5,`${key}: needs five frames`);

const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
for(const token of [
  "zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-walk-v2.webp'",
  "zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-attack-v2.webp'",
  "zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-death-v2.webp'",
  'function drawAuthoredDirectionalAttackFrame',
  'function drawAuthoredBlockFrame',
  'function drawAuthoredCriticalFrame',
  "zhaoyun:'常山赵子龙在此！'",
  "u.id==='zhaoyun'?1.08:1",
  'zhaoyunReactionPreview'
])assert.ok(game.includes(token),`missing runtime token: ${token}`);

console.log(`Zhao Yun animation set verified: ${names.length} sheets, ${(total/1048576).toFixed(2)} MiB.`);
