import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validatePayload } from '../save-format.mjs';

const game = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const cloud = fs.readFileSync(new URL('../cloud-saves.js', import.meta.url), 'utf8');

assert.match(html, /id="levelDeveloperCode"[^>]+type="password"/);
assert.match(html, /id="levelDeveloperUnlockBtn"/);
assert.match(game, /code==='ink to life'\|\|code==='pandaking'/);
assert.match(game, /locked=!developerLevelsUnlocked&&index!==0&&!cleared\.has\(levelId\)/,
  'only the first or completed levels may be selected without a developer code');
assert.match(game, /if\(button\.disabled\|\|button\.getAttribute\('aria-disabled'\)==='true'\)return/,
  'locked level buttons must not navigate');
assert.match(game, /params\.set\('levelSelect','1'\)/, 'developer selection must retain fixed balance levels');
assert.match(game, /function writeCampaignTransfer[\s\S]{0,100}markLevelCleared\(\)/,
  'normal victories must persist completion before the next-level transfer');
assert.match(game, /function playHuainanAftermath[\s\S]{0,100}markLevelCleared\('huainan'\)/,
  'the current final battle must persist completion');
assert.match(game, /function completeXiaopeiNegotiation\(\)\{markLevelCleared\('xiaopei'\)/,
  'the completed negotiation route must unlock Xiaopei');
assert.match(game, /portablePayload\(\).*clearedLevels:readClearedLevels\(\)/);
assert.match(game, /replacePayload\(\{saveStore,campaignTransfer,clearedLevels\}/);
assert.match(cloud, /const CLEARED = 'sanguozhi-zhaolie-cleared-levels-v1'/);
assert.match(cloud, /clearedLevels: \[\]/);
assert.match(css, /\.level-choice\.progress-locked:after\{content:"尚未通关"/);

const empty = { saveStore: { schema: 1, auto: null, manual: Array(6).fill(null) }, campaignTransfer: null };
assert.deepEqual(validatePayload(empty).clearedLevels, [], 'old cloud records must migrate without losing compatibility');
assert.deepEqual(validatePayload({ ...empty, clearedLevels: ['sishui-pass', 'huainan'] }).clearedLevels,
  ['sishui-pass', 'huainan']);
assert.throws(() => validatePayload({ ...empty, clearedLevels: ['unknown'] }), /通关记录损坏/);
assert.throws(() => validatePayload({ ...empty, clearedLevels: ['sishui-pass', 'sishui-pass'] }), /通关记录损坏/);

console.log('Level-select progress verified: completed-stage gating, session-only developer unlock, fixed balance, portable export and cloud persistence.');
