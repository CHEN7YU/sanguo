import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const folder = path.join(root, 'docs', 'original-audit', 'level-10-huainan-portraits');
const provenance = JSON.parse(fs.readFileSync(path.join(folder, 'portrait-provenance.json'), 'utf8'));
const tiles = [];
for (const record of provenance.portraits) {
  const input = path.join(root, record.referenceRgba);
  const output = path.join(root, record.referencePng);
  await sharp(fs.readFileSync(input), { raw: { width: 64, height: 80, channels: 4 } })
    .resize(320, 400, { kernel: 'nearest' })
    .png()
    .toFile(output);
  tiles.push({ input: output, left: (tiles.length % 4) * 320, top: Math.floor(tiles.length / 4) * 400 });
}
await sharp({ create: { width: 1280, height: Math.ceil(tiles.length / 4) * 400, channels: 3, background: '#111923' } })
  .composite(tiles)
  .png()
  .toFile(path.join(folder, 'huainan-original-portrait-reference-grid.png'));
console.log(`Rendered ${tiles.length} Huainan portrait references.`);
