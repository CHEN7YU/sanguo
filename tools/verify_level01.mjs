import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const original = JSON.parse(fs.readFileSync(new URL('docs/original-audit/level-01-original.json', root), 'utf8'));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('level-01.js', root), 'utf8'), context, { filename: 'level-01.js' });
const current = context.window.LEVEL_01;
const errors = [];
const check = (label, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${label}: current=${JSON.stringify(actual)} original=${JSON.stringify(expected)}`);
};

check('chapter', current.chapter, original.battle.chapter);
check('battle name', current.name, original.battle.name);
check('turn limit', current.maxTurns, original.battle.turn_limit);
check('objective', current.objective, original.battle.objective);
check('defeat condition', current.defeat, original.battle.defeat);
check('map width', current.width, original.map.width);
check('map height', current.height, original.map.height);
check('terrain grid', current.terrainCodes, original.map.terrain_codes);

const sideMap = { player: 'ally', guest: 'guest', enemy: 'enemy' };
const simplified = text => [...text].map(character => ({
  虧: '亏', 長: '长', 聯: '联', 軍: '军', 還: '还', 來: '来', 煩: '烦', 誰: '谁', 隊: '队',
  龍: '龙', 對: '对', 華: '华', 與: '与', 單: '单', 厲: '厉', 級: '级', 關: '关', 昇: '升',
  斬: '斩', 劉: '刘', 備: '备', 敗: '败', 領: '领', 勝: '胜', '．': '。', 將: '将', 個: '个',
  聽: '听', 說: '说', 過: '过', 為: '为', 這: '这', 種: '种', 無: '无', 輩: '辈', 嗎: '吗',
  沒: '没', 殺: '杀', 眾: '众', 敵: '敌', 活: '活', 動: '动', 體: '体', 給: '给', 見: '见', 進: '进'
}[character] || character)).join('');
const currentByOriginalId = new Map(current.units.map(unit => [unit.originalId, unit]));
for (const unit of original.units) {
  const actual = currentByOriginalId.get(unit.avatar_id);
  if (!actual) {
    errors.push(`missing unit avatar_id=${unit.avatar_id} ${unit.name}`);
    continue;
  }
  for (const [field, expected] of Object.entries({
    name: unit.name,
    x: unit.x,
    y: unit.y,
    side: sideMap[unit.side],
    level: unit.level,
    hp: unit.max_hp,
    maxHp: unit.max_hp,
    morale: unit.morale,
    wuli: unit.wuli,
    zhili: unit.zhili,
    tongyu: unit.tongyu,
    atk: unit.attack,
    def: unit.defense,
    move: unit.move,
    strategy: unit.max_strategy,
    maxStrategy: unit.max_strategy
  })) check(`${unit.name}.${field}`, actual[field], expected);

  const originalEquipment = unit.items.map(item => simplified(item.name));
  const treasureNames = { qinglong: '青龙偃月刀', spear: '蛇矛' };
  const currentEquipment = (actual.treasureItems || []).map(id => treasureNames[id]);
  check(`${unit.name}.equipment`, currentEquipment, originalEquipment);
}

check('unit count', current.units.length, original.units.length);
check('march dialogue', current.marchDialogue.map(line => line.text), original.events.march_dialogue.map(line => simplified(line.text)));
check('opening dialogue', current.intro.map(line => line.text), original.events.opening_dialogue.map(line => simplified(line.text)));
check('treasure event', current.events.treasure, { ...original.events.treasure.tile, gold: 100 });
check('supply event', current.events.supply, { ...original.events.supply.tile, item: 'bean', amount: 1 });
const currentDuelText = [
  ...current.events.duel.challenge,
  ...current.events.duel.aftermath,
  current.events.duel.levelUp,
  current.events.duel.report,
  current.events.duel.occupation
].map(line => line.text);
check('duel event dialogue', currentDuelText, original.events.duel.dialogue.map(line => simplified(line.text)));
check('normal victory dialogue', current.events.normalVictory.map(line => line.text), original.events.normal_victory.map(line => simplified(line.text)));
check('battle reward', current.events.battleReward, 100);

if (errors.length) {
  console.error(`Level 01 verification failed (${errors.length} mismatch${errors.length === 1 ? '' : 'es'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Level 01 verified: ${current.width}×${current.height} terrain, ${current.units.length} units, battle metadata, equipment, treasure/supply, duel and victory events match the extracted original data.`);
}
