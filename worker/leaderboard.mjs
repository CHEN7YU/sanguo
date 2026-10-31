import { consumeLimit } from './security.mjs';

const RULE_VERSION = 1;
const MAX_BODY_BYTES = 4096;

export const levelRules = Object.freeze({
  'sishui-pass': { name: '汜水关之战', targetSeconds: 600, targetTurns: 12, maxTurns: 30 },
  'hulao-pass': { name: '虎牢关之战', targetSeconds: 900, targetTurns: 15, maxTurns: 30 },
  guangchuan: { name: '广川之战', targetSeconds: 720, targetTurns: 14, maxTurns: 30 },
  xindu: { name: '信都之战', targetSeconds: 780, targetTurns: 15, maxTurns: 30 },
  julu: { name: '巨鹿之战', targetSeconds: 900, targetTurns: 16, maxTurns: 30 },
  qinghe: { name: '清河之战', targetSeconds: 840, targetTurns: 15, maxTurns: 30 },
  jieqiao: { name: '界桥之战', targetSeconds: 1200, targetTurns: 22, maxTurns: 40 },
  beihai: { name: '北海之战', targetSeconds: 900, targetTurns: 16, maxTurns: 30 },
  xuzhou: { name: '徐州之战', targetSeconds: 1080, targetTurns: 18, maxTurns: 30 },
  xiaopei: { name: '小沛之战', targetSeconds: 900, targetTurns: 10, maxTurns: 30 },
  taishan: { name: '泰山之战', targetSeconds: 1080, targetTurns: 18, maxTurns: 40 },
  huainan: { name: '淮南之战', targetSeconds: 1200, targetTurns: 22, maxTurns: 30 }
});

const rankOrder = 'score DESC, elapsed_ms ASC, turns ASC, updated_at ASC, id ASC';

function json(data, status = 200, extra = {}) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store', ...extra } });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateScore({ levelId, elapsedMs, turns, lossPercent, retreatCount, victoryType }) {
  const rule = levelRules[levelId];
  const seconds = Math.max(1, Math.round(elapsedMs / 1000));
  const safeTurns = clamp(Math.round(turns), 1, rule.maxTurns);
  const loss = clamp(lossPercent, 0, 100);
  const timeRatio = clamp(1 - Math.max(0, seconds - rule.targetSeconds) / (rule.targetSeconds * 2), 0, 1);
  const turnRatio = clamp(1 - Math.max(0, safeTurns - rule.targetTurns) / Math.max(1, rule.maxTurns - rule.targetTurns), 0, 1);
  const score = clamp(
    Math.round(2500 * timeRatio)
      + Math.round(3000 * turnRatio)
      + Math.round(3500 * (1 - loss / 100))
      + (retreatCount === 0 ? 400 : 0)
      + (victoryType === 'duel' ? 350 : 0)
      + (seconds <= rule.targetSeconds && safeTurns <= rule.targetTurns ? 250 : 0),
    0,
    10000
  );
  const grade = score >= 9000 ? 'S' : score >= 8000 ? 'A' : score >= 6500 ? 'B' : score >= 5000 ? 'C' : 'D';
  return { score, grade };
}

function publicEntry(row) {
  return {
    nickname: row.nickname,
    levelId: row.level_id,
    levelName: row.level_name,
    score: row.score,
    grade: row.grade,
    elapsedMs: row.elapsed_ms,
    turns: row.turns,
    lossPercent: row.loss_tenths / 10,
    retreatCount: row.retreats,
    victoryType: row.victory_type,
    updatedAt: row.updated_at
  };
}

async function readJson(request) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw Object.assign(new Error('战绩需要JSON数据'), { status: 415 });
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
    throw Object.assign(new Error('战绩数据过大'), { status: 413 });
  }
  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error('缺少战绩数据'), { status: 400 });
  const chunks = [];
  let size = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw Object.assign(new Error('战绩数据过大'), { status: 413 });
    }
    chunks.push(part.value);
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw Object.assign(new Error('战绩数据格式错误'), { status: 400 });
  }
}

async function getLeaderboard(url, env) {
  if (url.searchParams.get('scope') === 'champions') {
    const entries = [];
    for (const levelId of Object.keys(levelRules)) {
      const row = await env.AUTH_DB.prepare(
        `SELECT * FROM leaderboard_scores WHERE level_id = ? ORDER BY ${rankOrder} LIMIT 1`
      ).bind(levelId).first();
      if (row) entries.push(publicEntry(row));
    }
    return json({ entries });
  }
  const levelId = url.searchParams.get('level');
  if (!levelRules[levelId]) return json({ error: '未知关卡' }, 400);
  const rows = await env.AUTH_DB.prepare(
    `SELECT * FROM leaderboard_scores WHERE level_id = ? ORDER BY ${rankOrder} LIMIT 50`
  ).bind(levelId).all();
  return json({ levelId, levelName: levelRules[levelId].name, entries: rows.results.map(publicEntry) });
}

async function postLeaderboard(request, url, env) {
  if (url.protocol !== 'https:' || !env.AUTH_ORIGIN || new URL(env.AUTH_ORIGIN).origin !== url.origin) {
    return json({ error: '排行榜服务尚未就绪' }, 503);
  }
  if (request.headers.get('origin') !== url.origin) return json({ error: '请求来源无效' }, 403);
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip) return json({ error: '无法验证战绩来源' }, 503);
  const retry = await consumeLimit(env, `leaderboard:ip:${ip}`, 60, 60000);
  if (retry) return json({ error: '战绩上传过于频繁' }, 429, { 'retry-after': String(retry) });

  let body;
  try { body = await readJson(request); }
  catch (error) { return json({ error: error.message }, error.status || 400); }

  const levelId = String(body.levelId || '');
  const rule = levelRules[levelId];
  if (!rule) return json({ error: '未知关卡' }, 400);
  const playerId = String(body.playerId || '').trim().slice(0, 80);
  const nickname = String(body.nickname || '').replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, 16);
  const elapsedMs = Math.round(Number(body.elapsedMs));
  const turns = Math.round(Number(body.turns));
  const lossPercent = Number(body.lossPercent);
  const retreatCount = Math.round(Number(body.retreatCount));
  const victoryType = String(body.victoryType || 'normal');
  if (playerId.length < 8 || nickname.length < 2) return json({ error: '玩家信息无效' }, 400);
  if (!Number.isFinite(elapsedMs) || elapsedMs < 1000 || elapsedMs > 8 * 60 * 60 * 1000) return json({ error: '战斗时间无效' }, 400);
  if (!Number.isFinite(turns) || turns < 1 || turns > rule.maxTurns) return json({ error: '回合数无效' }, 400);
  if (!Number.isFinite(lossPercent) || lossPercent < 0 || lossPercent > 100) return json({ error: '损失数据无效' }, 400);
  if (!Number.isFinite(retreatCount) || retreatCount < 0 || retreatCount > 20) return json({ error: '撤退数据无效' }, 400);
  if (!['normal', 'duel', 'alternate'].includes(victoryType)) return json({ error: '胜利类型无效' }, 400);

  const calculated = calculateScore({ levelId, elapsedMs, turns, lossPercent, retreatCount, victoryType });
  const existing = await env.AUTH_DB.prepare(
    'SELECT score, elapsed_ms FROM leaderboard_scores WHERE player_id = ? AND level_id = ?'
  ).bind(playerId, levelId).first();
  const improved = !existing || calculated.score > existing.score
    || (calculated.score === existing.score && elapsedMs < existing.elapsed_ms);
  const now = Date.now();
  await env.AUTH_DB.prepare(
    `INSERT INTO leaderboard_scores
      (player_id, nickname, level_id, level_name, score, grade, elapsed_ms, turns, loss_tenths, retreats, victory_type, rule_version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(player_id, level_id) DO UPDATE SET
       nickname = excluded.nickname, level_name = excluded.level_name, score = excluded.score,
       grade = excluded.grade, elapsed_ms = excluded.elapsed_ms, turns = excluded.turns,
       loss_tenths = excluded.loss_tenths, retreats = excluded.retreats,
       victory_type = excluded.victory_type, rule_version = excluded.rule_version,
       updated_at = excluded.updated_at
     WHERE excluded.score > leaderboard_scores.score
       OR (excluded.score = leaderboard_scores.score AND excluded.elapsed_ms < leaderboard_scores.elapsed_ms)`
  ).bind(
    playerId, nickname, levelId, rule.name, calculated.score, calculated.grade, elapsedMs, turns,
    Math.round(lossPercent * 10), retreatCount, victoryType, RULE_VERSION, now, now
  ).run();
  const saved = await env.AUTH_DB.prepare(
    'SELECT * FROM leaderboard_scores WHERE player_id = ? AND level_id = ?'
  ).bind(playerId, levelId).first();
  if (!saved) return json({ error: '保存战绩失败' }, 500);
  const rank = await env.AUTH_DB.prepare(
    `SELECT COUNT(*) + 1 AS rank FROM leaderboard_scores
     WHERE level_id = ? AND (
       score > ? OR (score = ? AND elapsed_ms < ?)
       OR (score = ? AND elapsed_ms = ? AND turns < ?)
       OR (score = ? AND elapsed_ms = ? AND turns = ? AND updated_at < ?)
       OR (score = ? AND elapsed_ms = ? AND turns = ? AND updated_at = ? AND id < ?)
     )`
  ).bind(
    levelId, saved.score, saved.score, saved.elapsed_ms,
    saved.score, saved.elapsed_ms, saved.turns,
    saved.score, saved.elapsed_ms, saved.turns, saved.updated_at,
    saved.score, saved.elapsed_ms, saved.turns, saved.updated_at, saved.id
  ).first();
  return json({ entry: publicEntry(saved), rank: rank.rank, improved });
}

export async function handleLeaderboard(request, env) {
  const url = new URL(request.url);
  if (request.method === 'GET') return getLeaderboard(url, env);
  if (request.method === 'POST') return postLeaderboard(request, url, env);
  return json({ error: '请求方法不支持' }, 405);
}
