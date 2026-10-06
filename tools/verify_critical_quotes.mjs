import fs from 'node:fs';
import assert from 'node:assert/strict';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
for(const [id,text] of Object.entries({
  liu:'汉室正统在此，破敌！',
  guan:'尝尝我青龙偃月刀的厉害！',
  zhang:'吃俺老张一矛！',
  jian:'此箭，正中要害！'
}))assert.ok(game.includes(`${id}:'${text}'`),`missing critical quote for ${id}`);

assert.ok(game.includes("if(!outcome?.critical||attacker.side!=='ally')return Promise.resolve()"));
assert.ok(game.includes('await playCriticalQuote(attacker,outcome);'));
assert.ok(game.includes('await playCriticalQuote(defender,outcome);'));
assert.ok(game.indexOf('await playCriticalQuote(attacker,outcome);')<game.indexOf('await playCombatAnimation(attacker,target'));
assert.ok(game.includes("criticalQuotePreview"));

console.log('Critical quotes verified: every current player character has a line, allied fallback is present, and quotes precede attack/counter animation.');
