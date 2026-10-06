import fs from 'node:fs';
import assert from 'node:assert/strict';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');

for(const source of [game,css])assert.ok(!source.includes('hue-rotate(155deg)'),'friendly full-sprite hue rotation must stay removed');
assert.match(game,/drawFactionGroundMarker\(u,pos,isMounted,done,flagFade\)/,'friendly ground marker must be rendered');
assert.match(game,/const friendlyAssetPaths=/,'baked friendly static artwork map must exist');
assert.match(game,/const friendlyAttackPaths=/,'baked friendly attack artwork map must exist');
assert.match(game,/const friendlyWalkPaths=/,'baked friendly walk artwork map must exist');
assert.match(game,/return mediaReady\(friendly\)\?friendly:source/,'missing friendly artwork must fall back to the visible base sprite');
assert.ok(!game.includes('getImageData('),'runtime palette conversion must stay removed');
assert.ok(!game.includes('friendlyArtCache'),'off-screen friendly canvas cache must stay removed');
assert.match(game,/portraitImage\.style\.filter=''/,'fallback portraits must preserve natural colours');
assert.match(css,/\.roster-item \.avatar\.ally-generic\{filter:none;border-color:#5ecbd6/,'friendly roster accent must preserve natural colours');

console.log('Natural friendly colours verified with baked WebP artwork and visible fallbacks.');
