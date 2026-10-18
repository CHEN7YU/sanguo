import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const game = fs.readFileSync(new URL('game.js', root), 'utf8');
const css = fs.readFileSync(new URL('style.css', root), 'utf8');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

check(game.includes("longSpear:{name:'长枪',effect:'classUpgrade',requiredLevel:15,fromClass:'短兵',toClass:'长兵'}"), '长枪缺少15级短兵进阶说明数据');
check(game.includes("repeatingCrossbow:{name:'连弩',effect:'classUpgrade',requiredLevel:15,fromClass:'弓兵',toClass:'连弩兵'}"), '连弩缺少15级弓兵进阶说明数据');
check(game.includes("原作用途：Lv.${item.requiredLevel}以上${item.fromClass}进阶为${item.toClass}；本版暂未开放转职，可转交，占1格"), '转职道具说明必须明确原作用途、当前状态和携带栏占用');
check(game.includes("携带者${item.effect==='defense'?'防御':'攻击'}提高${item.bonus}% · 无需主动使用 · 可转交 · 占1格"), '常驻宝物说明必须明确数值、触发方式和携带栏占用');
check(game.includes("item?.effect==='classUpgrade'?'转职道具':'自动生效'"), '宝物列表状态标签必须区分转职道具和自动生效宝物');
check(css.includes('.treasure-item-row small{display:block') && css.includes('white-space:normal'), '窄侧栏中的宝物说明必须允许换行');

if (errors.length) {
  console.error(`Treasure description verification failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Treasure descriptions verified: effects, requirements, current availability, transfer behavior and slot use are visible.');
}
