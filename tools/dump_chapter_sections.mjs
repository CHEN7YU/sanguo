import { readFile } from 'node:fs/promises';

const source = process.argv[2] || 'docs/original-audit/chapter-0-raw.json';
const requested = (process.argv[3] || '').split(',').filter(Boolean).map(Number);
const data = JSON.parse(await readFile(source, 'utf8'));
const paragraphs = data.script[0].paragraph_list;
const indices = requested.length ? requested : paragraphs.map((_, index) => index);

for (const paragraphIndex of indices) {
  const paragraph = paragraphs[paragraphIndex];
  if (!paragraph) continue;
  console.log(`\n========== PARAGRAPH ${paragraphIndex} ==========`);
  for (const section of paragraph.section_list || []) {
    console.log(`\n--- ${section.instr_descr} ---`);
    for (const line of section.script_instr_descr || []) console.log(line);
  }
}
