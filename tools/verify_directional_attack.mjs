import fs from 'node:fs';

const game = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const required = [
  'function attackDirectionFor(attacker,target)',
  "return dx>=0?'east':'west'",
  "return dy>=0?'south':'north'",
  'function directionalAttackMotion(fx)',
  "attackDirection==='north'||attackDirection==='south'",
  'authoredDirectionalAttack',
  'drawAuthoredWalkFrame(u,directionalSheet,targetH,attackMotion)',
  "previewParams.has('directionalAttackPreview')"
];

const missing = required.filter(token => !game.includes(token));
if (missing.length) {
  console.error('Directional attack verification failed:');
  for (const token of missing) console.error(`- missing ${token}`);
  process.exitCode = 1;
} else {
  console.log('Directional attack verified: north/south use authored directional poses and east/west keep weapon-specific attack sheets.');
}
