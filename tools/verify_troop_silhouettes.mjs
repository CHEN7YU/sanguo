import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
for(const [troop,file] of [['martial','assets/troops/martial-artist-v2.webp'],['bandit','assets/troops/bandit-v2.webp']]){
  assert.match(source,new RegExp(`${troop}:'${file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'`));
  assert.match(source,new RegExp(`u\\.troop==='${troop}'\\)return'${troop}'`));
  const url=new URL(`../${file}`,import.meta.url);
  assert.ok(fs.existsSync(url),`${file} must exist`);
  assert.ok(fs.statSync(url).size>20_000,`${file} must contain production artwork`);
}
assert.match(source,/\['martial','bandit'\]\.includes\(u\.troop\)/);
console.log('troop silhouette regression checks passed');
