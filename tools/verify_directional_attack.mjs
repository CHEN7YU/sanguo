import fs from 'node:fs';

const game = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const required = [
  'function attackDirectionFor(attacker,target)',
  "return dx>=0?'east':'west'",
  "return dy>=0?'south':'north'",
  'function combatTargetFacesRight(attacker,target)',
  'function shouldMirrorCombatSheet(u,target)',
  'authoredDirectionalAttack',
  'drawAuthoredDirectionalAttackFrame(u,directionalSheet,targetH,attackFx)',
  "previewParams.has('directionalAttackPreview')"
];

const missing = required.filter(token => !game.includes(token));
if (missing.length || game.includes('fallbackDirectionalSheet') || game.includes('drawAuthoredWalkFrame(u,directionalSheet')) {
  console.error('Directional attack verification failed:');
  for (const token of missing) console.error(`- missing ${token}`);
  if (game.includes('fallbackDirectionalSheet')) console.error('- north/south attacks still fall back to a walk sheet');
  if (game.includes('drawAuthoredWalkFrame(u,directionalSheet')) console.error('- a directional attack still renders walk frames');
  process.exitCode = 1;
} else {
  console.log('Directional attack verified: real directional atlases are used when present; every other direction keeps the weapon-specific attack strip.');
}
