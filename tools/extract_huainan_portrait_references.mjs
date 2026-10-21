import fs from 'node:fs';
import path from 'node:path';
import { decodeFace } from './koei_viewer/face-decoder.ts';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'docs', 'original-audit', 'level-10-huainan-portraits');
const records = [
  { name: '袁术', characterId: 11, faceId: 144, slug: 'yuan-shu' },
  { name: '袁胤', characterId: 42, faceId: 145, slug: 'yuan-yin' },
  { name: '纪灵', characterId: 69, faceId: 146, slug: 'ji-ling' },
  { name: '乐就', characterId: 66, faceId: 165, slug: 'le-jiu' },
  { name: '陈纪', characterId: 71, faceId: 156, slug: 'chen-ji' },
  { name: '曹豹', characterId: 26, faceId: 190, slug: 'cao-bao' },
  { name: '董昭', characterId: 70, faceId: 157, slug: 'dong-zhao' },
  { name: '张绣', characterId: 101, faceId: 155, slug: 'zhang-xiu' },
  { name: '陈宫', characterId: 75, faceId: 149, slug: 'chen-gong' }
];

fs.mkdirSync(output, { recursive: true });
for (const record of records) {
  const id = String(record.faceId).padStart(3, '0');
  const source = path.join(root, 'tools', 'koei_viewer', 'FACEDAT', `${id}.UNPACKED`);
  const decoded = decodeFace(new Uint8Array(fs.readFileSync(source)));
  const target = path.join(output, `${record.slug}-face-${id}.rgba`);
  fs.writeFileSync(target, decoded.pixels);
  record.referenceRgba = path.relative(root, target).replaceAll('\\', '/');
  record.referencePng = record.referenceRgba.replace(/\.rgba$/, '.png');
  record.masterPng = `assets-master/level-10-huainan/portraits/${record.slug}-portrait-master-v1.png`;
  record.runtimeWebp = `assets/level-10-huainan/portraits/${record.slug}-remaster-v1.webp`;
  record.redrawMethod = 'OpenAI built-in ImageGen; original face controls identity, project remaster style controls finish';
}
fs.writeFileSync(path.join(output, 'portrait-provenance.json'), JSON.stringify({
  source: 'BAKDATA.R3 character record byte +14 -> FACEDAT.R3 portrait record',
  formula: '0x1100 + characterId * 21; face id at record offset +14',
  portraits: records
}, null, 2));
console.log(`Decoded ${records.length} verified Huainan portrait references.`);
