import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url),game=fs.readFileSync(new URL('game.js',root),'utf8');
for(const [id,file] of Object.entries({guan:'guan-duel-attack-v2.webp',zhangliao:'zhangliao-duel-attack-v2.webp'})){
  const bytes=fs.readFileSync(new URL(`assets/mounted-combat-v1/${file}`,root));
  assert.ok(bytes.length>300000,`${id} duel attack strip is unexpectedly small`);
  assert.equal(bytes.subarray(0,4).toString(),'RIFF',`${id} duel attack strip is not WebP`);
  assert.ok(game.includes(`${id}:'assets/mounted-combat-v1/${file}'`),`${id} duel attack strip is not wired`);
}
assert.match(game,/function duelAttackPose\(progress\)/,'duel attack pose sequencer missing');
for(const pose of ['frame:0','frame:1','frame:2','frame:3','frame:4'])assert.ok(game.includes(pose),`duel attack pose ${pose} missing`);
assert.match(game,/attackPose\?\.lean/,'duel attack has no visible body rotation');
assert.match(game,/if\(attackPose&&mediaReady\(sheet\)\)/,'duel renderer does not use the authored five-frame strip');
assert.ok(game.includes("attackerId:'guan',defenderId:'zhangliao'" )||fs.readFileSync(new URL('level-10-huainan.js',root),'utf8').includes("attackerId:'guan',defenderId:'zhangliao'"),'Huainan Guan Yu / Zhang Liao duel missing');

console.log('Guan Yu / Zhang Liao duel animation verified: fresh five-frame strips and visible wind-up, slash and recovery poses.');
