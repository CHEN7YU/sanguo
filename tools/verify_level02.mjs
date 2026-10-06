import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const audit = JSON.parse(fs.readFileSync(path.join(root, 'docs/original-audit/level-02-original.json'), 'utf8'));
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'level-02.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'level-02-animation-bounds.js'), 'utf8'), context);
const level = context.window.LEVEL_02;
const animationBounds = context.window.LEVEL_02_ANIMATION_BOUNDS;

function check(condition, message) {
  if (!condition) throw new Error(message);
}
function troopName(value) {
  if (value === '短兵') return 'infantry';
  if (value === '轻骑兵' || value === '輕騎兵') return 'cavalry';
  if (value === '弓兵') return 'archer';
  throw new Error(`unmapped troop ${value}`);
}

check(level.width === audit.map.width && level.height === audit.map.height, 'map dimensions differ from original');
check(JSON.stringify(level.terrainCodes) === JSON.stringify(audit.map.terrain_codes), 'terrain grid differs from HEXZMAP.R3');
check(level.maxTurns === audit.battle.turn_limit, 'turn limit differs from original');
check(level.squareGrid === true, 'Tiger Gate must use the square-grid renderer');
check(level.units.length === audit.units.length, 'deployment count differs from original');
check(level.environmentFx?.forestZones?.length >= 6, 'level 02 foliage animation masks are missing');
check(level.environmentFx?.waterBands?.length >= 2, 'level 02 river-flow paths are missing');
check(level.environmentFx.waterBands.every(band => Array.isArray(band.gaps) && band.gaps.length), 'level 02 river paths must leave the bridge clear');
check(Array.isArray(level.paintedTerrainOverrides) && level.paintedTerrainOverrides.length > 80, 'painted collision overrides are missing');
const paintedCollision = new Map(level.paintedTerrainOverrides.map(tile => [`${tile.x},${tile.y}`, tile.type]));
for (const y of [4,5]) for (let x=0;x<level.width;x++) {
  check(paintedCollision.get(`${x},${y}`) === (x===6?'bridge':'water'), `river collision mismatch at ${x},${y}`);
}
for (const unit of level.units) check(!['water','cliff','wall'].includes(paintedCollision.get(`${unit.x},${unit.y}`)), `${unit.name} spawns on painted impassable terrain`);
const zhangLiao = level.units.find(unit => unit.id === 'zhangliao');
check(zhangLiao?.mountedVisual === true, 'Zhang Liao must use mounted battlefield presentation');
check(zhangLiao?.className === '骑马短兵', 'Zhang Liao mounted presentation label is missing');
check(zhangLiao?.troop === 'infantry', 'Zhang Liao original short-infantry rules must remain unchanged');

for (const source of audit.units) {
  const unit = level.units.find(item => item.originalId === source.avatar_id);
  check(unit, `missing original unit ${source.name} (${source.avatar_id})`);
  check(unit.name === source.name, `${source.name}: remaster name mismatch`);
  check(unit.x === source.x && unit.y === source.y, `${source.name}: deployment coordinate mismatch`);
  const expectedSide = source.side === 'player' ? 'ally' : source.side;
  check(unit.side === expectedSide, `${source.name}: side mismatch`);
  check(unit.troop === troopName(source.troop_original), `${source.name}: troop mismatch`);
  check(unit.maxHp === source.max_hp && unit.atk === source.attack && unit.def === source.defense, `${source.name}: derived stats mismatch`);
  check(unit.move === source.move && unit.maxStrategy === source.max_strategy, `${source.name}: movement/strategy mismatch`);
  if (source.side === 'enemy') {
    check(unit.level === source.level, `${source.name}: level mismatch`);
    check(unit.aiType === source.ai_type, `${source.name}: AI type mismatch`);
  } else {
    check(unit.level === source.baseline_level_before_carryover, `${source.name}: carryover baseline mismatch`);
    check(unit.carryover === true, `${source.name}: carryover marker missing`);
  }
}

const special = new Map(audit.map.special_tiles.map(tile => [tile.terrain_id, tile]));
const treasureTile = special.get(16);
const supplyTile = special.get(15);
check(level.events.treasure.x === treasureTile.x && level.events.treasure.y === treasureTile.y, 'treasure event is not on original treasure tile');
check(level.events.supply.x === supplyTile.x && level.events.supply.y === supplyTile.y, 'supply event is not on original supply tile');
check(level.events.treasure.item === 'fireScroll' && level.events.treasure.amount === 1, 'treasure reward mismatch');
check(level.events.supply.item === 'bean' && level.events.supply.amount === 1, 'supply reward mismatch');

const duel = level.events.duel;
check(duel.attackerId === 'zhang' && duel.defenderId === 'lvbu', 'duel trigger must remain Zhang Fei contacting Lu Bu');
check(JSON.stringify(duel.allyIds) === JSON.stringify(['liu','guan','zhang']), 'Three Heroes duel must include Liu Bei, Guan Yu and Zhang Fei');
check(duel.title.includes('三英') && duel.kicker.includes('三英战吕布'), 'Three Heroes duel title is missing');
check((duel.reinforcement||[]).some(line => line.speaker === '关羽') && (duel.reinforcement||[]).some(line => line.speaker === '刘备'), 'Guan Yu and Liu Bei reinforcement dialogue is missing');
const turn18 = level.timedEvents.find(event => event.turn === 18 && event.unitId === 'lvbu');
check(turn18?.setAiType === 1, 'turn 18 Lu Bu advance event missing');
check(level.events.battleReward === 100, 'battle reward mismatch');
check(level.marchDialogue.length === audit.events.prebattle_march_dialogue.length, 'march dialogue line count mismatch');
check(level.intro.length === audit.events.opening_dialogue.length, 'opening dialogue line count mismatch');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
check(html.includes('level-02.js?build='), 'index does not load level 02 data');
check(game.includes("levelIndex==='2' ? window.LEVEL_02"), 'level 02 query selection is not wired');
check(game.includes("const squareBattlefield=level.squareGrid===true||level.id==='hulao-pass'"), 'Tiger Gate needs a cache-safe square-grid fallback');
check(game.includes("level.battlefieldArt||'assets/sishui-remaster-v3.webp'"), 'level-specific battlefield art is not wired');
check(game.includes('function buildRuntimeMap()'), 'painted collision grid is not applied at runtime');
check(game.includes("function isMountedUnit(u){return u.troop==='cavalry'||u.mountedVisual===true}"), 'mounted visual override is not wired');
check(game.includes('if(environmentFx.waterBands?.length)'), 'level-specific river animation paths are not wired');
check(game.includes('function updateTerrainInfo(q)'), 'unit-specific terrain information is not wired');
check(game.includes("movementCostLabel(tileCost(actor,q.x,q.y))"), 'terrain information must use the selected unit movement class');
check(game.includes('updateTerrainInfo(hover);draw()'), 'keyboard terrain inspection is not wired');
check(game.includes('updateTerrainInfo(q);const u=unitAt'), 'touch/click terrain inspection is not wired');
check(game.includes("const event=type==='treasure'?level.events?.treasure:type==='supply'?level.events?.supply:null"), 'terrain rewards must be read from the active level event data');
check(game.includes('return`首次进入获得${name}×${event.amount||1}`'), 'item reward tooltip is not wired');
check(html.includes('id="defeatCondition"'), 'battlefield defeat-condition display is missing');
check(game.includes("document.getElementById('defeatCondition').textContent=`败北：${level.defeat}`"), 'level defeat condition is not displayed');
check(game.includes('addLog(`败北条件：${level.defeat}`)'), 'defeat condition is not recorded in battle status');
check(game.includes('async function triggerTimedEvents()'), 'timed event runner is not wired');
check(game.includes("target.id===objectiveUnitId"), 'objective-unit victory is not generic');
for (const asset of ['hulao-remaster-v2.webp','lvbu-squad-v1.webp','zhangliao-squad-v1.webp','houcheng-squad-v1.webp','songxian-squad-v1.webp','weixu-squad-v1.webp']) {
  check(fs.existsSync(path.join(root, 'assets', asset)), `missing level 02 art asset ${asset}`);
}
for (const unit of ['lvbu','zhangliao','houcheng','songxian','weixu']) {
  for (const kind of ['walk','attack','death']) {
    const version = unit === 'songxian' && kind === 'walk' ? 'v2' : 'v1';
    const asset = `${unit}-${kind}-${version}.webp`;
    const assetPath = path.join(root, 'assets', asset);
    check(fs.existsSync(assetPath) && fs.statSync(assetPath).size > 1000, `missing or empty animation asset ${asset}`);
    const bounds = animationBounds?.[kind]?.[unit];
    check(Array.isArray(bounds), `missing ${kind} frame bounds for ${unit}`);
    check(bounds.length === (kind === 'walk' ? 4 : 5), `wrong ${kind} frame count for ${unit}`);
    if (kind === 'walk') check(bounds.every(row => row.length === 4), `wrong directional walk layout for ${unit}`);
  }
  const walkVersion = unit === 'songxian' ? 'v2' : 'v1';
  check(game.includes(`${unit}:'assets/${unit}-walk-${walkVersion}.webp'`), `${unit} walk sheet is not wired`);
  check(game.includes(`${unit}:'assets/${unit}-attack-v1.webp'`), `${unit} attack sheet is not wired`);
  check(game.includes(`${unit}:'assets/${unit}-death-v1.webp'`), `${unit} death sheet is not wired`);
}
const level02Portraits = {
  lvbu:'assets/story-portraits/remaster-v4/lv-bu-v4.webp',
  zhangliao:'assets/zhang-liao-portrait-v1.webp',
  houcheng:'assets/hou-cheng-portrait-v1.webp',
  songxian:'assets/song-xian-portrait-v1.webp',
  weixu:'assets/wei-xu-portrait-v1.webp'
};
for (const [unit, asset] of Object.entries(level02Portraits)) {
  check(fs.existsSync(path.join(root, asset)), `missing level 02 portrait ${asset}`);
  check(game.includes(`${unit}:'${asset}'`), `${unit} portrait is not wired to the correct remaster asset`);
}
const namedDialogueSpeakers = new Set([
  ...level.marchDialogue.map(line => line.speaker),
  ...level.intro.map(line => line.speaker),
  ...(level.events.duel.challenge || []).map(line => line.speaker),
  ...(level.events.duel.exchange || []).map(line => line.speaker),
  ...(level.events.duel.aftermath || []).map(line => line.speaker),
  ...(level.events.normalVictory || []).map(line => line.speaker)
].filter(name => name !== '军报'));
for (const speaker of namedDialogueSpeakers) {
  const unit = level.units.find(item => item.name === speaker);
  check(unit, `dialogue speaker ${speaker} has no level unit identity`);
  check(game.includes(`${unit.id}:`), `dialogue speaker ${speaker} has no portrait mapping`);
}
check(html.includes('level-02-animation-bounds.js?build='), 'index does not load level 02 animation metadata');
check(game.includes('Object.assign(walkFrameBounds,level02AnimationBounds.walk||{})'), 'walk bounds are not installed');
check(game.includes('Math.floor(COLS*.55)'), 'animation preview coordinates are not map-size aware');
check(game.includes("openBattlePrep()},180)"), 'direct/campaign entry to level 02 must open battle preparation');
check(game.includes("passiveName.textContent='事件 · 三英战吕布'"), 'Three Heroes duel hint is not shown in the unit panel');
check(game.includes('function playThreeHeroesDuel(zhang,lvbu)'), 'Three Heroes duel cinematic is missing');
check(game.includes("if(level.id==='hulao-pass')return playThreeHeroesDuel(g,h)"), 'Hulao duel does not use the Three Heroes cinematic');
check(game.includes("duelFacingScale(lvbu,ms>=8400?'right':'left')"), 'Lu Bu facing and retreat direction are not explicit');
check(game.includes("level.nextLevelId?'next':level.nextBattle?'pending':'replay'"), 'second-battle victory outcome routing is not explicit');
check(game.includes("button.textContent='返回开始画面'"), 'unfinished next chapter must return to title instead of replaying silently');
check(html.includes('id="titleLevelSelectBtn">选择关卡</button>'), 'main menu level-select option is missing');
check(!html.includes('id="titleHelpBtn"'), 'obsolete main-menu help option still exists');
check(html.includes('data-select-level="1"') && html.includes('data-select-level="2"'), 'level selector must expose both completed battles');
check(game.includes("params.set('storySelect','1')"), 'level selector must route to the selected battle story');
check(game.includes("previewParams.has('storySelect')"), 'selected-level story boot route is not wired');
check(game.includes("previewParams.has('battleSelect')"), 'battle-only audit route must remain available');
check(game.includes("const mobile=e.aiType===1||e.aiType===3||e.aiType===4||e.aiType===6,canAttack=e.aiType!==6;let plan"), 'enemy AI must support original active, targeted, waypoint and move-only modes');
check(game.includes("const mobile=e.aiType===1||e.aiType===3||e.aiType===4,cells=mobile?calcReach(e)"), 'danger preview must respect stationary and move-only AI modes');
check(game.includes('function capturePrepBaseline()'), 'battle-entry preparation baseline is not captured');
check(game.includes('gold=prepBaseline.gold'), 'shop reset must restore battle-entry gold');
check(!game.includes('function resetShop(){gold=500'), 'shop reset must not erase inherited campaign gold');
check(game.includes('已恢复进入本关时的军需与宝物'), 'shop reset message must describe the restored campaign baseline');
check(game.includes('levelId:level.id'), 'save snapshots must record their battle id');
check(game.includes("params.set('loadSlot',token)"), 'loading another battle must route to its saved slot');
check(game.includes("previewParams.has('loadSlot')"), 'cross-battle saved-slot boot route is missing');
check(game.includes("if(level.id==='sishui-pass')playOpeningMovie"), 'new game on battle two must not replay battle-one prologue');
check(!game.includes('hp:u.hp,strategy:u.strategy,morale:u.morale??100'), 'campaign transfer must not persist tactical troop, strategy or morale');
check(game.includes('u.hp=u.maxHp')&&game.includes('u.strategy=u.maxStrategy')&&game.includes('u.morale=100'), 'battle two must replenish troop, strategy and morale from original battle-entry rules');
check(level.marchDialogue.length===6&&level.marchDialogue[1].speaker==='张飞'&&level.marchDialogue[1].text.includes('乘胜追击'), 'the omitted Zhang Fei pursuit line must be restored');
check(level.marchHandledByStory===true, 'Tiger Gate march must be performed by the story scene instead of repeated as battle dialogue');
check(game.includes("bossProtected=a.side==='guest'&&t.id===objectiveUnitId"), 'allied physical attacks must not take the final blow on Lu Bu');
check(game.includes("bossProtected=caster.side==='guest'&&target.id===objectiveUnitId"), 'allied tactics must not take the final blow on Lu Bu');

console.log('level 02 original-data verification passed');
console.log(`map ${level.width}x${level.height}; units ${level.units.length}; turn limit ${level.maxTurns}; treasure (${treasureTile.x},${treasureTile.y}); supply (${supplyTile.x},${supplyTile.y})`);
