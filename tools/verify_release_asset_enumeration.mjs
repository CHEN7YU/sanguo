import assert from 'node:assert/strict';
import fs from 'node:fs';
import {collectReleaseAssets} from './release-assets.mjs';
const sample="const ids=['guan','zhang']; for(const id of ids)paths[id]=`assets/mounted-combat-v1/${id}-attack.webp`;";
assert.deepEqual([...collectReleaseAssets([sample])],['assets/mounted-combat-v1/guan-attack.webp','assets/mounted-combat-v1/zhang-attack.webp']);
assert.equal(collectReleaseAssets(["const ids=[compute()]; for(const id of ids)paths[id]=`assets/test/${id}.webp`;"]).size,0);
const assets=collectReleaseAssets([fs.readFileSync(new URL('../game.js',import.meta.url),'utf8')]);
for(const id of ['hua','zhang','zhaoyun','lvbu','gongsun','houcheng'])assert.ok(assets.has(`assets/mounted-combat-v1/${id}-attack.webp`),id);
console.log('PASS static named-array asset enumeration; mounted attack images included');
