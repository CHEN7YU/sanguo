import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');

assert.match(game,/const eightTileAuraOffsets=\[\[-1,-1\],\[0,-1\],\[1,-1\],\[-1,0\],\[1,0\],\[-1,1\],\[0,1\],\[1,1\]\]/,'military-band aura must paint all eight surrounding tiles');
assert.match(game,/const adjacentSupplyOffsets=\[\[0,-1\],\[-1,0\],\[1,0\],\[0,1\]\]/,'transport aura must match its four adjacent healing cells');
assert.match(game,/function drawSupportAuraSource\(source,/,'shared support-aura renderer missing');
assert.match(game,/label:'军乐范围 · 攻\+10%'/,'military-band aura label missing');
assert.match(game,/label:'运输补给范围'/,'transport aura label missing');
assert.match(game,/function drawTransportAuras\(\)/,'transport aura renderer missing');
assert.match(game,/drawXuandeAura\(\);drawMilitaryBandAuras\(\);drawTransportAuras\(\);/,'support auras are not wired into the battlefield draw pass');
assert.match(game,/target\.hp<target\.maxHp/,'transport aura must identify wounded units that can receive healing');

console.log('Support aura feedback verified: military band paints 8 attack-aura cells and transport paints its 4 healing cells.');
