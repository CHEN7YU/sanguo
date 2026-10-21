import { readFile } from 'node:fs/promises';

const game = await readFile(new URL('../game.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

const expected = {
  chenliu: ['fireScroll', 'wine', 'bean'],
  guangchuan: ['wine', 'bean', 'injuryMedicine'],
  xindu: ['wine', 'bean', 'injuryMedicine', 'fireScroll', 'vortexScroll', 'rockScroll'],
  beiping: ['wine', 'bean', 'fogScroll'],
  beihai: ['wine', 'bean', 'injuryMedicine', 'fireScroll', 'vortexScroll', 'rockScroll', 'bomb'],
  xuzhou: ['wine', 'bean', 'injuryMedicine', 'moraleScroll', 'supportScroll'],
  xiaopei: ['longSpear', 'repeatingCrossbow', 'horseArmor', 'banditManual', 'fireScroll', 'vortexScroll', 'rockScroll']
};

const failures = [];
for (const [place, items] of Object.entries(expected)) {
  const encoded = `${place}:{location:`;
  const start = game.indexOf(encoded);
  if (start < 0) {
    failures.push(`缺少${place}货单`);
    continue;
  }
  const end = game.indexOf('\n', start);
  const line = game.slice(start, end < 0 ? undefined : end);
  for (const item of items) if (!line.includes(`'${item}'`)) failures.push(`${place}缺少${item}`);
}

const uniqueStocks = new Set(Object.values(expected).map(items => items.join('|')));
if (uniqueStocks.size !== Object.keys(expected).length) failures.push('不同地点仍有完全相同的写死货单');
if (!game.includes("if(level.id==='hulao-pass')return{location:'虎牢关追击途中',items:[]")) failures.push('虎牢关没有保持原作连续作战、无新增道具屋');
if (!html.includes('id="shopList" class="shop-list"')) failures.push('商店没有使用按关卡动态生成的货单');
if ((html.match(/data-shop-item=/g) || []).length) failures.push('HTML里仍残留固定的通用三件商品');

if (failures.length) {
  console.error(`原作道具屋检查失败（${failures.length}）`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`原作道具屋检查通过：${Object.keys(expected).length}个地点，${uniqueStocks.size}套不同货单；虎牢关无新增商店。`);
