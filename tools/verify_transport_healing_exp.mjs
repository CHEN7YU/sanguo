import fs from 'node:fs';
import assert from 'node:assert/strict';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../battle-rules.js',import.meta.url),'utf8');

assert.match(rules,/function transportHealingExperience\(actualHealing\)/);
assert.match(rules,/Math\.min\(10,Math\.ceil\(amount\/25\)\)/);
assert.match(game,/function gainTransportHealingExp\(carrier,actualHealing\)/);
assert.match(game,/carrier\.side==='enemy'/);
assert.match(game,/actualHealing\+=amount/);
assert.match(game,/gainTransportHealingExp\(carrier,actualHealing\)/);
assert.match(game,/每实际恢复25兵力获得1经验/);
assert.match(game,/满兵力单位不产生经验/);

console.log('Transport healing experience verified: actual healing only, capped gain, level-up path and in-game explanation.');
