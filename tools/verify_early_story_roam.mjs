import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../story-data.js', import.meta.url), 'utf8');
const localStorage = { getItem: () => null };
const context = { window: {}, location: { search: '' }, URLSearchParams, localStorage };
vm.createContext(context);
vm.runInContext(source, context);

const stories = context.window.STORY_BY_LEVEL;
const dialogue = context.window.NPC_DIALOGUE_BY_LEVEL;
const requiredRoam = ['sishui-pass', 'guangchuan', 'xindu', 'julu', 'qinghe', 'jieqiao'];
for (const id of requiredRoam) {
  if (!stories[id]?.some(line => line.freeRoam)) throw new Error(`${id} 缺少自由行动剧情`);
  if (!dialogue[id]?.关羽?.length) throw new Error(`${id} 缺少结束自由行动的关羽对白`);
}
if (stories['hulao-pass'].some(line => line.freeRoam)) throw new Error('虎牢关前原作没有自由营帐，不应新增');
for (const id of ['julu', 'qinghe', 'jieqiao']) {
  const moving = stories[id].filter(line => line.move || line.thenMove || line.route);
  if (moving.length < 3) throw new Error(`${id} 的剧情走位不足`);
  const roam = stories[id].find(line => line.freeRoam);
  const names = new Set((roam.setup || []).map(actor => actor.name));
  for (const name of ['刘备', '关羽', '张飞']) if (!names.has(name)) throw new Error(`${id} 自由行动缺少 ${name}`);
}
if (stories.qinghe[5]?.freeRoam !== true) throw new Error('清河路线恢复点未落在自由行动段');
if (stories.julu[5]?.freeRoam !== true) throw new Error('巨鹿路线恢复点未落在自由行动段');

console.log('前期剧情小人走位与自由交谈配置校验通过');
