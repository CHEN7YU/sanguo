import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'assets','troops','bandit-combat-v3');
const files=['attack.webp','hurt.webp','friendlyAttack.webp','friendlyHurt.webp'];
for(const name of files){
  const file=path.join(dir,name);assert.ok(fs.existsSync(file),`${name} missing`);const decoded=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true}),{width,height}=decoded.info;
  assert.equal(width%5,0,`${name}: five frames must divide evenly`);const cellW=width/5;
  for(let frame=0;frame<5;frame++)for(let y=0;y<height;y++)for(const x of [0,1,cellW-2,cellW-1])assert.ok(decoded.data[(y*width+frame*cellW+x)*4+3]<=2,`${name} frame ${frame}: transparent side gutter missing`)
}
const game=fs.readFileSync(path.join(root,'game.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const token of ["bandit:'assets/troops/bandit-combat-v3/attack.webp'","bandit:'assets/troops/bandit-combat-v3/hurt.webp'","bandit:'assets/troops/bandit-combat-v3/friendlyAttack.webp'","bandit:'assets/troops/bandit-combat-v3/friendlyHurt.webp'",'window.BANDIT_COMBAT_CLEAN_BOUNDS','Object.assign(attackFrameBounds,banditCombatCleanBounds.attack||{})','Object.assign(hurtFrameBounds,banditCombatCleanBounds.hurt||{})'])assert.ok(game.includes(token),`runtime token missing: ${token}`);
assert.ok(html.indexOf('bandit-combat-bounds-v3.js')<html.indexOf('game.js?build='),'bandit bounds must load before runtime');
console.log('Bandit combat wrap verified: attack and hurt frames have isolated transparent gutters for both factions.');
