import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const assets=[
  'hua-squad-friendly-v1.webp','infantry-squad-friendly-v1.webp','archer-squad-friendly-v1.webp','officer-squad-friendly-v1.webp',
  'support-friendly-v1.webp','martial-artist-friendly-v2.webp','bandit-friendly-v2.webp','hua-walk-friendly-v1.webp',
  'officer-walk-friendly-v1.webp','archer-walk-friendly-v1.webp','infantry-walk-friendly-v1.webp','hua-attack-friendly-v1.webp',
  'infantry-attack-friendly-v1.webp','archer-attack-friendly-v1.webp','officer-attack-friendly-v1.webp','hua-death-friendly-v1.webp',
  'martial-artist-walk-friendly-v2.webp','bandit-walk-friendly-v2.webp','martial-artist-attack-friendly-v2.webp','bandit-attack-friendly-v2.webp',
  'martial-artist-hurt-friendly-v2.webp','bandit-hurt-friendly-v2.webp',
  'wounded-units-atlas-friendly-v1.webp'
];
for(const name of assets){
  const path=new URL(`../assets/friendly/${name}`,import.meta.url);
  assert.ok(fs.existsSync(path),`${name} must exist`);
  assert.ok(fs.statSync(path).size>20_000,`${name} must contain production artwork`);
  assert.ok(source.includes(`assets/friendly/${name}`),`${name} must be referenced by the runtime`);
}
assert.doesNotMatch(source,/getImageData\(/,'runtime must not recolour units through an off-screen canvas');
assert.doesNotMatch(source,/friendlyArtCache/,'runtime must not keep friendly canvas caches');
assert.match(source,/return mediaReady\(friendly\)\?friendly:source/,'missing friendly files must fall back to a visible base sprite');
console.log('baked friendly asset checks passed');
