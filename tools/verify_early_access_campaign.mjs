import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const packagedRoot = path.resolve(toolDir, '../dist');
const sourceRoot = path.resolve(toolDir, '..');
const root = fs.existsSync(path.join(sourceRoot, 'game.js')) ? sourceRoot : packagedRoot;
const levelFiles = [
  ['1', 'level-01.js', 'LEVEL_01'],
  ['2', 'level-02.js', 'LEVEL_02'],
  ['3', 'level-03-guangchuan.js', 'LEVEL_03_GUANGCHUAN'],
  ['4', 'level-03-xindu.js', 'LEVEL_03_XINDU'],
  ['5', 'level-04-julu.js', 'LEVEL_04_JULU'],
  ['6', 'level-04-qinghe.js', 'LEVEL_04_QINGHE'],
  ['7', 'level-05-jieqiao.js', 'LEVEL_05_JIEQIAO'],
  ['8', 'level-06-beihai.js', 'LEVEL_06_BEIHAI'],
  ['9', 'level-07-xuzhou.js', 'LEVEL_07_XUZHOU'],
  ['10', 'level-08-xiaopei.js', 'LEVEL_08_XIAOPEI'],
  ['11', 'level-09-taishan.js', 'LEVEL_09_TAISHAN']
];

function loadLevel(file, globalName) {
  const context = {
    window: {},
    location: { search: '' },
    URLSearchParams,
    localStorage: { getItem: () => null }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  return context.window[globalName];
}

const levels = new Map(levelFiles.map(([index, file, globalName]) => {
  const level = loadLevel(file, globalName);
  assert.ok(level, `${file}: ${globalName} is not registered`);
  return [level.id, { index, file, level }];
}));

const expectedGraph = new Map([
  ['sishui-pass', ['hulao-pass']],
  ['hulao-pass', ['guangchuan', 'xindu']],
  ['guangchuan', ['julu', 'qinghe']],
  ['xindu', ['julu', 'qinghe']],
  ['julu', ['jieqiao']],
  ['qinghe', ['jieqiao']],
  ['jieqiao', ['beihai']],
  ['beihai', ['xuzhou']],
  ['xuzhou', ['xiaopei']],
  ['xiaopei', ['taishan']],
  ['taishan', []]
]);

const impassable = new Set(['water', 'cliff', 'wall', 'fence', 'void', 'mountain']);
const passable = type => !impassable.has(type);
const key = (x, y) => `${x},${y}`;

function effectiveMap(level) {
  const map = level.terrain.map(row => [...row]);
  for (const tile of level.paintedTerrainOverrides || []) {
    assert.ok(tile.x >= 0 && tile.x < level.width && tile.y >= 0 && tile.y < level.height,
      `${level.id}: painted override out of bounds at ${key(tile.x, tile.y)}`);
    map[tile.y][tile.x] = tile.type;
  }
  for (const event of level.areaEvents || []) {
    for (const tile of event.terrainUpdates || []) {
      if (tile.initial === true) map[tile.y][tile.x] = tile.type;
    }
  }
  return map;
}

function runtimeUnit(level, unit) {
  const override = (level.paintedDeploymentOverrides || []).find(item =>
    item.unitId === unit.id && item.fromX === unit.x && item.fromY === unit.y);
  return override ? { ...unit, x: override.x, y: override.y } : unit;
}

function reachableFrom(map, width, height, starts) {
  const seen = new Set();
  const queue = [];
  for (const point of starts) {
    if (point.x < 0 || point.y < 0 || point.x >= width || point.y >= height) continue;
    if (!passable(map[point.y][point.x])) continue;
    const id = key(point.x, point.y);
    if (!seen.has(id)) { seen.add(id); queue.push(point); }
  }
  for (let i = 0; i < queue.length; i++) {
    const { x, y } = queue[i];
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy, id = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || seen.has(id) || !passable(map[ny][nx])) continue;
      seen.add(id); queue.push({ x: nx, y: ny });
    }
  }
  return seen;
}

function eventPoints(level) {
  const points = [];
  for (const [name, event] of Object.entries(level.events || {})) {
    if (Number.isInteger(event?.x) && Number.isInteger(event?.y)) points.push({ name: `events.${name}`, x: event.x, y: event.y });
  }
  for (const [coord] of Object.entries(level.events?.loot || {})) {
    const [x, y] = coord.split(',').map(Number);
    points.push({ name: `events.loot.${coord}`, x, y });
  }
  for (const [i, event] of (level.areaEvents || []).entries()) {
    if (event.rect && event.rect.x1 === event.rect.x2 && event.rect.y1 === event.rect.y2) {
      points.push({ name: `areaEvents[${i}]`, x: event.rect.x1, y: event.rect.y1 });
    }
  }
  return points;
}

for (const [id, { level }] of levels) {
  assert.equal(level.id, id);
  assert.equal(level.terrain.length, level.height, `${id}: terrain height mismatch`);
  assert.ok(level.terrain.every(row => row.length === level.width), `${id}: terrain width mismatch`);
  assert.ok(level.maxTurns > 0, `${id}: turn limit missing`);
  assert.ok(level.objective && level.defeat, `${id}: victory/defeat text missing`);
  const map = effectiveMap(level);
  const occupied = new Set();
  const active = level.units.filter(unit => unit.side !== 'reserve').map(unit => runtimeUnit(level, unit));
  for (const unit of active) {
    assert.ok(unit.x >= 0 && unit.x < level.width && unit.y >= 0 && unit.y < level.height,
      `${id}: ${unit.name} spawns out of bounds at ${key(unit.x, unit.y)}`);
    assert.ok(passable(map[unit.y][unit.x]), `${id}: ${unit.name} spawns on ${map[unit.y][unit.x]} at ${key(unit.x, unit.y)}`);
    assert.ok(!occupied.has(key(unit.x, unit.y)), `${id}: deployment overlap at ${key(unit.x, unit.y)}`);
    occupied.add(key(unit.x, unit.y));
    if ((unit.originalId ?? 999) < 256) assert.ok(unit.defeatQuote, `${id}: named unit ${unit.name} lacks defeat dialogue`);
  }
  const allyStarts = active.filter(unit => unit.side === 'ally');
  assert.ok(allyStarts.some(unit => unit.id === 'liu'), `${id}: Liu Bei is not deployed as an ally`);
  const reachable = reachableFrom(map, level.width, level.height, allyStarts);
  const objective = active.find(unit => unit.id === (level.objectiveUnitId || level.events?.objectiveUnitId));
  if (objective) {
    const canContact = [[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => reachable.has(key(objective.x + dx, objective.y + dy)));
    assert.ok(canContact, `${id}: objective ${objective.name} cannot be reached from the allied deployment`);
  }
  for (const point of eventPoints(level)) {
    assert.ok(point.x >= 0 && point.x < level.width && point.y >= 0 && point.y < level.height,
      `${id}: ${point.name} is out of bounds at ${key(point.x, point.y)}`);
    assert.ok(passable(map[point.y][point.x]), `${id}: ${point.name} is placed on ${map[point.y][point.x]} at ${key(point.x, point.y)}`);
    assert.ok(reachable.has(key(point.x, point.y)), `${id}: ${point.name} at ${key(point.x, point.y)} is unreachable from the allied deployment`);
  }
  const duel = level.events?.duel;
  if (duel) {
    assert.ok(level.units.some(unit => unit.id === duel.attackerId), `${id}: duel attacker ${duel.attackerId} missing`);
    assert.ok(level.units.some(unit => unit.id === duel.defenderId), `${id}: duel defender ${duel.defenderId} missing`);
  }
  const nextIds = expectedGraph.get(id) || [];
  if (nextIds.length === 1 && id !== 'xuzhou') assert.equal(level.nextLevelId, nextIds[0], `${id}: next level must be ${nextIds[0]}`);
  if (id === 'xuzhou') assert.ok(!level.nextLevelId, 'xuzhou must stop for the fight/negotiate choice before Xiaopei');
  if (nextIds.length > 1) assert.ok(nextIds.includes(level.nextLevelId), `${id}: default next level ${level.nextLevelId} is outside its route fork`);
  if (!nextIds.length) assert.ok(!level.nextLevelId, `${id}: current campaign finale must not route into unfinished content`);
}

const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const storySource = fs.readFileSync(path.join(root, 'story-data.js'), 'utf8');
const storyContext = {
  window: {}, location: { search: '' }, URLSearchParams,
  localStorage: { getItem: () => null }
};
vm.createContext(storyContext);
vm.runInContext(storySource, storyContext, { filename: 'story-data.js' });
for (const id of expectedGraph.keys()) {
  const story = storyContext.window.STORY_BY_LEVEL?.[id];
  assert.ok(Array.isArray(story) && story.length, `${id}: prebattle story is missing`);
  for (const [i, line] of story.entries()) {
    assert.ok(line.scene && line.location && line.speaker && line.text, `${id}: incomplete story beat ${i + 1}`);
  }
}

for (const [index, file] of levelFiles) {
  assert.ok(html.includes(file), `index.html does not load ${file}`);
  assert.ok(html.includes(`data-select-level="${index}"`), `level selector is missing level ${index}`);
}
for (const token of [
  "params.set('level',nextIndex);params.set('storySelect','1');params.set('build',RUNTIME_BUILD)",
  "duel?(level.events?.duel?.occupation||normalOccupation):normalOccupation",
  "if(alternate&&alternateExp)units.filter(u=>u.side==='ally'&&u.hp>0)",
  "if(level.id==='hulao-pass')params.set('routeChoice','1')",
  "if(['guangchuan','xindu'].includes(level.id))params.set('secondRouteChoice','1')",
  "targetId==='taishan'?'11'",
  "targetId==='xiaopei'?'10'",
  "if(save.phaseType==='postbattle')",
  "params.set('storySelect','1')",
  "previewParams.has('loadSlot')",
  "previewParams.has('storySelect')"
]) assert.ok(game.includes(token), `campaign runtime is missing: ${token}`);

assert.ok(game.includes("new URLSearchParams({newGame:'1',build:RUNTIME_BUILD})"),'Start Game must route every later-level title screen to a clean first-chapter entry');
assert.ok(game.includes("if(previewParams.has('newGame'))setTimeout(launchFirstChapterNewGame"),'Clean new-game boot dispatch is missing');
assert.ok(game.includes("levelSelectActive=false;selectedBalanceLevel=null"),'New Game must clear level-select balancing state');

assert.ok(game.includes('const LIU_CLEAR_EXP=50'),'Liu Bei clear bonus must remain 50 EXP');
assert.ok(game.includes('const clearExp=awardLiuBeiClearExp()'),'Every completed battle must award Liu Bei clear EXP');
const clearAwardIndex=game.indexOf('const clearExp=awardLiuBeiClearExp()');
const transferAfterAward=game.indexOf('writeCampaignTransfer(campaignVictoryType)',clearAwardIndex);
assert.ok(clearAwardIndex>=0&&transferAfterAward>clearAwardIndex,'Liu Bei clear EXP must be applied before campaign transfer is saved');
assert.ok(game.includes('刘备额外获得经验${clearExp.amount}'),'Victory summary must disclose Liu Bei clear EXP');

assert.equal(levels.get('julu').level.events.duel?.endsBattle, false, 'Julu duel must not end the battle');
assert.equal(levels.get('jieqiao').level.events.duel?.endsBattle, false, 'Jieqiao duel must not end the battle');
assert.equal(levels.get('xuzhou').level.events.duel?.endsBattle, false, 'Xuzhou duel must not end the battle');
assert.equal(levels.get('xiaopei').level.events.duel?.endsBattle, false, 'Xiaopei duel must not end the battle');

console.log(`Campaign audit passed: ${levels.size} battles through Taishan, both route forks, all deployments/objectives/reward tiles, story entry points, save routing and non-ending duels.`);
