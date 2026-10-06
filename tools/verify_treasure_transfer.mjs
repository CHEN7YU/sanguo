import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const BattleRules = require('../battle-rules.js');
const root = new URL('../', import.meta.url);
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('level-01.js', root), 'utf8'), context);
const source = fs.readFileSync(new URL('game.js', root), 'utf8');
const units = context.window.LEVEL_01.units;
const liu = units.find(unit => unit.id === 'liu');
const guan = units.find(unit => unit.id === 'guan');
const zhang = units.find(unit => unit.id === 'zhang');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

check(JSON.stringify(guan.treasureItems) === '["qinglong"]', '关羽应初始携带青龙偃月刀');
check(JSON.stringify(zhang.treasureItems) === '["spear"]', '张飞应初始携带蛇矛');
check(!liu.treasureItems, '刘备初始不应携带宝物');
check(/qinglong:\{name:'青龙偃月刀',effect:'attack',bonus:12\}/.test(source), '青龙偃月刀应提供12%攻击加成');
check(/spear:\{name:'蛇矛',effect:'attack',bonus:10\}/.test(source), '蛇矛应提供10%攻击加成');
check(source.includes("if(kind==='treasure')"), '转交处理必须覆盖宝物');
check(source.includes('refreshPassiveTreasures(from);refreshPassiveTreasures(to)'), '宝物转交后必须重算双方被动效果');
check(source.includes('u.treasureItems=[...base.treasureItems]'), '重置整备必须恢复进入本关时的宝物归属');
check(source.includes('function capturePrepBaseline()'), '必须记录进入本关时的继承宝物与道具');

const attack = bonus => BattleRules.derivedStats({
  troop: liu.troop,
  level: liu.level,
  wuli: liu.wuli,
  zhili: liu.zhili,
  tongyu: liu.tongyu,
  morale: liu.morale,
  attackBonus: bonus
}).attack;
check(attack(0) === 265, `刘备无宝物攻击应为265，当前为${attack(0)}`);
check(attack(12) === 296, `刘备携带青龙偃月刀后攻击应为296，当前为${attack(12)}`);
check(attack(10) === 291, `刘备携带蛇矛后攻击应为291，当前为${attack(10)}`);

if (errors.length) {
  console.error(`Treasure transfer verification failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Treasure transfer verified: original ownership, 8-slot transfer path, passive attack recalculation and battle-entry reset ownership are wired.');
}
