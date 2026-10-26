import fs from 'node:fs';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const failures=[];
const expect=(condition,message)=>{if(!condition)failures.push(message)};

for(const name of ['art','friendlyArt','terrainArt','attackArt','criticalArt','blockArt','directionalAttackArt','friendlyAttackArt','walkArt','friendlyWalkArt','deathArt','friendlyDeathArt','hurtArt','friendlyHurtArt']){
  expect(new RegExp(`const\\s+${name}\\s*=\\s*lazyImageMap\\(`).test(game),`${name} 没有使用延迟图片表`);
}
expect(game.includes('function ensureStageAssets()'),'缺少当前关卡资源装载入口');
expect(/function hideTitle\([^)]*\)\{ensureStageAssets\(\)/.test(game),'离开开始画面时没有装载当前关卡资源');
expect(!game.includes('Object.values(dialoguePortraits).forEach(preloadImage)'),'仍在启动时预载全部剧情头像');
expect(!/Object\.entries\([^)]*Paths\)\.map\(\(\[key,src\]\)=>\[key,preloadImage\(src\)\]\)/.test(game),'仍有完整战斗资源表在启动时预载');
expect(/id="openingVideo"[^>]+data-src="[^"]+"[^>]+preload="none"/.test(index),'21MB 开篇视频没有延迟到新游戏后加载');
expect(/id="storyMusic"[^>]+data-src="[^"]+"[^>]+preload="none"/.test(index),'剧情音乐仍在开始画面预载');
expect(/id="battleMusic"[^>]+data-src="[^"]+"[^>]+preload="none"/.test(index),'战斗音乐仍在开始画面预载');

const buildTokens=[...index.matchAll(/\?build=([^"']+)/g)].map(match=>match[1]);
expect(new Set(buildTokens).size===1,'index.html 缓存版本号不统一');
expect(buildTokens[0]&&game.includes(`const RUNTIME_BUILD='${buildTokens[0]}'`),'game.js 运行版本号与 index.html 不一致');

if(failures.length){
  console.error(`按关卡加载检查失败（${failures.length} 项）`);
  for(const failure of failures)console.error(`- ${failure}`);
  process.exit(1);
}
console.log('按关卡加载检查通过：首屏不预载战斗图、全剧情头像或开篇视频；进入关卡后只请求当前出场表资源。');
