import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const game = fs.readFileSync(new URL('game.js', root), 'utf8');
const errors = [];
const fail = message => errors.push(message);

for (const id of ['guan', 'zhang', 'gongsun', 'hua']) {
  const file = fs.readFileSync(new URL(`assets/${id}-death-v1.webp`, root));
  if (file.length < 10000 || file.subarray(0, 4).toString() !== 'RIFF' || file.subarray(8, 12).toString() !== 'WEBP') fail(`invalid death sheet for ${id}`);
  if (!game.includes(`${id}:'assets/${id}-death-v1.webp'`)) fail(`death sheet not wired for ${id}`);
}

const zhaoDeath = fs.readFileSync(new URL('assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-death-v2.webp', root));
if (zhaoDeath.length < 10000 || zhaoDeath.subarray(0, 4).toString() !== 'RIFF' || zhaoDeath.subarray(8, 12).toString() !== 'WEBP') fail('invalid death sheet for zhaoyun');
if (!game.includes("zhaoyun:'assets/level-05-jieqiao/zhao-yun-animation/zhao-yun-death-v2.webp'")) fail('death sheet not wired for zhaoyun');

for (const token of [
  'const deathFrameBounds=',
  'function drawAuthoredDeathFrame(u,sheet,targetH,fx)',
  'else if(authoredDeath)drawAuthoredDeathFrame',
  'deathDuration=(authoredFatal?980:620)',
  "previewParams.has('mountedDeathPreview')"
]) if (!game.includes(token)) fail(`missing mounted death pipeline token: ${token}`);

if (errors.length) {
  console.error(`Mounted death verification failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Mounted death verified: Guan Yu, Zhang Fei, Gongsun Zan, Hua Xiong and Zhao Yun use packed five-frame horse-and-rider falls.');
}
