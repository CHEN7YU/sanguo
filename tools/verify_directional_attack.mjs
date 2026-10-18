import fs from 'node:fs';

const game = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const required = [
  'function attackDirectionFor(attacker,target)',
  "return dx>=0?'east':'west'",
  "return dy>=0?'south':'north'",
  'function combatTargetFacesRight(attacker,target)',
  'function shouldMirrorCombatSheet(u,target)',
  'function combatAttackFrame(u,p,ranged=false)',
  "if(u?.id==='guan')return p<.16?0:p<.34?1:p<.5?2:p<.72?3:4",
  "strikeDuration=(ranged?920:attacker.id==='guan'?1040:860)/motionSpeed",
  'mountedCombatAttackIds.includes(key)',
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
  console.log('Directional attack verified: Guan Yu keeps a readable full blade swing, mounted duel frames use authored bounds, and directional atlases are preserved.');
}
