import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
assert.match(source,/function mediaWidth\(source\).*source\?\.width/);
assert.match(source,/function mediaHeight\(source\).*source\?\.height/);
assert.match(source,/function mediaReady\(source\)/);
assert.doesNotMatch(source,/canvas\.naturalWidth=/);
assert.doesNotMatch(source,/canvas\.complete=/);
assert.match(source,/authoredIdle=!!\(!walking&&!attackFx&&mediaReady\(idleSheet\)\)/);
assert.match(source,/else if\(mediaReady\(img\)\)/);
console.log('friendly canvas compatibility checks passed');
