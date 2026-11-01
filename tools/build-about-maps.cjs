// Derive lightweight promotional images from the game's existing battlefield art.
// Usage: node tools/build-about-maps.cjs <source-assets-directory> [sharp-module-path]
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.argv[3] || 'sharp');
const maps = [
  [
    "sishui",
    "汜水关之战",
    "第一战",
    "sishui-remaster-v3.webp"
  ],
  [
    "hulao",
    "虎牢关之战",
    "第二战",
    "hulao-remaster-v2.webp"
  ],
  [
    "guangchuan",
    "广川之战",
    "第三战 · 路线甲",
    "level-03/guangchuan-map-v1.webp"
  ],
  [
    "xindu",
    "信都之战",
    "第三战 · 路线乙",
    "level-03-xindu/xindu-map-v1.webp"
  ],
  [
    "julu",
    "巨鹿之战",
    "第四战 · 路线甲",
    "level-04-julu/julu-map-aligned-v3.webp"
  ],
  [
    "qinghe",
    "清河之战",
    "第四战 · 路线乙",
    "level-04-qinghe/qinghe-map-remaster-v2.webp"
  ],
  [
    "jieqiao",
    "界桥之战",
    "第五战",
    "level-05-jieqiao/jieqiao-map-v3.webp"
  ],
  [
    "beihai",
    "北海之战",
    "第六战",
    "level-06-beihai/beihai-map-v1.webp"
  ],
  [
    "xuzhou",
    "徐州之战",
    "第七战",
    "level-07-xuzhou/xuzhou-map-v1.webp"
  ],
  [
    "xiaopei",
    "小沛之战",
    "第八战",
    "level-08-xiaopei/xiaopei-map-v2.webp"
  ],
  [
    "taishan",
    "泰山之战",
    "第九战",
    "level-09-taishan/taishan-map-v2.webp"
  ],
  [
    "huainan",
    "淮南之战",
    "第十战",
    "level-10-huainan/huainan-map-v1.webp"
  ]
];
async function main() {
  const source = path.resolve(process.argv[2] || 'assets');
  const output = path.resolve(__dirname, '../assets/about/maps');
  await fs.mkdir(output, { recursive: true });
  let thumbBytes = 0;
  for (const [id, , , file] of maps) {
    const input = path.join(source, file);
    const thumb = await sharp(input).resize(640, 400, {fit:'contain', background:'#071b34'}).webp({quality:76}).toFile(path.join(output, id + '-thumb.webp'));
    await sharp(input).resize(1600, 1200, {fit:'inside', withoutEnlargement:true}).webp({quality:88}).toFile(path.join(output, id + '-full.webp'));
    thumbBytes += thumb.size;
  }
  console.log('Built ' + maps.length + ' map previews; total thumbnails: ' + Math.round(thumbBytes / 1024) + ' KiB.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
