import fs from 'node:fs';

const game = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const checks = [
  ["function duelVisualKeyFor(u){return art[u.id]?u.id:genericVisualKeyFor(u)}", 'duel facing must follow the rendered sprite key'],
  ["officer:'right',infantry:'right',archer:'right',support:'right'", 'generic enemy sheets must declare their native right-facing direction'],
  ["duelNativeFacing[duelVisualKeyFor(u)]", 'duel facing must not fall back to the character id'],
  ["duelFacingScale(g,'right')", 'the left-side attacker must face right during exchanges'],
  ["duelFacingScale(h,'left')", 'the right-side defender must face left during exchanges'],
  ["yujin:'left',yuejin:'left',lidian:'left',guojia:'left',caohong:'left',xiahouyuan:'left'", 'Xuzhou action sheets must keep their authored left-facing direction'],
  ["duelFacingScale(lvbu,ms>=8400?'right':'left')", 'Lu Bu may face right only after his retreat begins']
];

for (const [needle, message] of checks) {
  if (!game.includes(needle)) throw new Error(message);
}

const duelFiles = [
  ['level-01.js', "attackerId:'guan', defenderId:'hua'"],
  ['level-02.js', "attackerId:'zhang', defenderId:'lvbu'"],
  ['level-03-guangchuan.js', "attackerId:'guan',defenderId:'fengji'"],
  ['level-03-xindu.js', "attackerId:'zhang',defenderId:'chunyu'"],
  ['level-04-julu.js', "attackerId:'zhang',defenderId:'yanliang'"]
  ,['level-05-jieqiao.js', "attackerId:'zhang',defenderId:'wenchou'"]
  ,['level-06-beihai.js', "attackerId:'zhaoyun',defenderId:'guanhai'"]
  ,['level-07-xuzhou.js', "attackerId:'guan',defenderId:'yujin'"]
];

for (const [file, duel] of duelFiles) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  if (!source.includes(duel)) throw new Error(`${file} duel roster changed; re-audit its facing`);
}

console.log('Duel facing verified for Sishui, Hulao, Guangchuan, Xindu, Julu, Jieqiao, Beihai and Xuzhou.');
