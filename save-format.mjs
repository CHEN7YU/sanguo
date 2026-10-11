export const MAX_BUNDLE_BYTES = 350 * 1024;
export const MAX_SLOT_BYTES = 100 * 1024;
const levels = new Set(['sishui-pass', 'hulao-pass', 'guangchuan', 'xindu', 'julu', 'qinghe', 'jieqiao', 'beihai', 'xuzhou']);
const names = new Set(['汜水关之战', '虎牢关之战', '广川之战', '信都之战', '巨鹿之战', '清河之战', '界桥之战', '北海之战', '徐州之战']);
const size = value => new TextEncoder().encode(JSON.stringify(value)).length;
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const optionalArray = (value, field) => value[field] === undefined || Array.isArray(value[field]);

export function validatePayload(payload, { cloud = false } = {}) {
  const store = payload?.saveStore;
  if (!object(payload) || !object(store) || store.schema !== 1 || !Array.isArray(store.manual) || store.manual.length !== 6) {
    throw new Error('存档格式或版本不支持；不会覆盖原进度');
  }
  for (const save of [store.auto, ...store.manual]) {
    if (save === null) continue;
    if (!object(save) || save.schema !== 1 || !(levels.has(save.levelId) || (!save.levelId && names.has(save.levelName)))
        || !Number.isSafeInteger(save.savedAt) || save.savedAt < 0) throw new Error('档位数据损坏');
    if (cloud && size(save) > MAX_SLOT_BYTES) throw new Error('单个档位超过100 KiB，请先导出备份');
    if (save.campaignTransfer) validateTransfer(save.campaignTransfer);
    if (save.phaseType === 'story') {
      if (!Number.isInteger(save.storyIndex) || save.storyIndex < 0 || !Array.isArray(save.storyActors)
          || !save.storyActors.every(actor => object(actor) && typeof actor.name === 'string'
            && Number.isFinite(actor.x) && Number.isFinite(actor.y))) throw new Error('剧情存档损坏');
    } else if (save.phaseType !== 'prep') {
      if (save.phaseType !== undefined && save.phaseType !== 'postbattle') throw new Error('存档阶段不支持');
      if (!Array.isArray(save.units) || save.units.length > 100 || !save.units.every(unit =>
        object(unit) && typeof unit.id === 'string' && Number.isFinite(unit.x) && Number.isFinite(unit.y)
        && Number.isFinite(unit.hp) && ['inventory', 'treasureItems'].every(field => optionalArray(unit, field)))
          || !Array.isArray(save.map) || save.map.length > 64 || !save.map.length
          || !save.map.every(row => Array.isArray(row) && row.length <= 64 && row.length > 0
            && row.length === save.map[0].length && row.every(tile => typeof tile === 'string'))
          || !['logs', 'brotherMergeSpoken', 'timedEventsFired'].every(field => optionalArray(save, field))) {
        throw new Error('战斗存档损坏');
      }
    }
  }
  validateTransfer(payload.campaignTransfer);
  const normalized = { saveStore: { schema: 1, auto: store.auto, manual: store.manual }, campaignTransfer: payload.campaignTransfer };
  if (cloud && size(normalized) > MAX_BUNDLE_BYTES) throw new Error('账号当前存档总量超过350 KiB，请先导出备份并减少档位内容');
  return normalized;
}

function validateTransfer(transfer) {
  if (transfer === null) return;
  if (!object(transfer) || transfer.schema !== 1 || !Array.isArray(transfer.units)
      || !transfer.units.every(unit => object(unit) && typeof unit.id === 'string'
        && ['inventory', 'treasureItems'].every(field => optionalArray(unit, field)))
      || !levels.has(transfer.fromLevelId)
      || !(levels.has(transfer.toLevelId) || (transfer.fromLevelId === 'xuzhou' && transfer.toLevelId === 'xuzhou-postbattle'))) {
    throw new Error('关卡继承数据损坏');
  }
}
