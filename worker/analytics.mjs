import { consumeLimit, hex, keyedHash } from './security.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DAY_MS = 86400000;
const playtimeSchemas = new WeakMap();
export const chinaDay = (now = Date.now()) => new Date(now + 8 * 3600000).toISOString().slice(0, 10);
export const analyticsEnabled = env => env.ANALYTICS_ENABLED === 'true' && !!env.AUTH_DB && !!env.AUTH_ORIGIN
  && typeof env.AUTH_PASSWORD_PEPPER === 'string' && env.AUTH_PASSWORD_PEPPER.length >= 32;

export function deviceCategory(request) {
  const agent = request.headers.get('user-agent') || '';
  if (/ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(agent)) return 'tablet';
  if (/mobi|iphone|ipod|windows phone/i.test(agent)) return 'mobile';
  if (/windows|macintosh|linux|cros/i.test(agent)) return 'desktop';
  return 'other';
}

const PLAYTIME_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS analytics_play_daily (
    day TEXT NOT NULL,
    device TEXT NOT NULL CHECK (device IN ('all', 'desktop', 'mobile', 'tablet', 'other')),
    players INTEGER NOT NULL DEFAULT 0 CHECK (players >= 0),
    play_sessions INTEGER NOT NULL DEFAULT 0 CHECK (play_sessions >= 0),
    play_seconds INTEGER NOT NULL DEFAULT 0 CHECK (play_seconds >= 0),
    PRIMARY KEY (day, device)
  )`,
  `CREATE TABLE IF NOT EXISTS analytics_play_events (
    event_hash TEXT PRIMARY KEY NOT NULL, day TEXT NOT NULL, player_hash TEXT NOT NULL,
    session_hash TEXT NOT NULL,
    device TEXT NOT NULL CHECK (device IN ('desktop', 'mobile', 'tablet', 'other')),
    seconds INTEGER NOT NULL CHECK (seconds BETWEEN 1 AND 120)
  )`,
  'CREATE INDEX IF NOT EXISTS analytics_play_events_day ON analytics_play_events(day)',
  `CREATE TABLE IF NOT EXISTS analytics_play_seen (
    day TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('player', 'session')),
    identity_hash TEXT NOT NULL,
    device TEXT NOT NULL CHECK (device IN ('all', 'desktop', 'mobile', 'tablet', 'other')),
    PRIMARY KEY (day, kind, identity_hash, device)
  )`,
  `CREATE TABLE IF NOT EXISTS analytics_players (
    player_hash TEXT PRIMARY KEY NOT NULL, first_day TEXT NOT NULL, last_day TEXT NOT NULL,
    play_seconds INTEGER NOT NULL DEFAULT 0 CHECK (play_seconds >= 0)
  )`,
  `CREATE TABLE IF NOT EXISTS analytics_play_sessions (
    session_hash TEXT PRIMARY KEY NOT NULL, player_hash TEXT NOT NULL,
    first_day TEXT NOT NULL, last_day TEXT NOT NULL,
    play_seconds INTEGER NOT NULL DEFAULT 0 CHECK (play_seconds >= 0)
  )`,
  'CREATE INDEX IF NOT EXISTS analytics_play_sessions_player ON analytics_play_sessions(player_hash)',
  `CREATE TRIGGER IF NOT EXISTS analytics_play_event_count AFTER INSERT ON analytics_play_events
  BEGIN
    INSERT INTO analytics_play_daily (day, device, players, play_sessions, play_seconds)
      SELECT NEW.day, devices.device,
        CASE WHEN NOT EXISTS (
          SELECT 1 FROM analytics_play_seen s WHERE s.day = NEW.day AND s.kind = 'player'
            AND s.identity_hash = NEW.player_hash AND s.device = devices.device
        ) THEN 1 ELSE 0 END,
        CASE WHEN NOT EXISTS (
          SELECT 1 FROM analytics_play_seen s WHERE s.day = NEW.day AND s.kind = 'session'
            AND s.identity_hash = NEW.session_hash AND s.device = devices.device
        ) THEN 1 ELSE 0 END,
        NEW.seconds
      FROM (SELECT 'all' AS device UNION ALL SELECT NEW.device) AS devices WHERE 1
      ON CONFLICT(day, device) DO UPDATE SET
        players = analytics_play_daily.players + excluded.players,
        play_sessions = analytics_play_daily.play_sessions + excluded.play_sessions,
        play_seconds = analytics_play_daily.play_seconds + excluded.play_seconds;
    INSERT OR IGNORE INTO analytics_play_seen (day, kind, identity_hash, device) VALUES
      (NEW.day, 'player', NEW.player_hash, 'all'),
      (NEW.day, 'player', NEW.player_hash, NEW.device),
      (NEW.day, 'session', NEW.session_hash, 'all'),
      (NEW.day, 'session', NEW.session_hash, NEW.device);
    INSERT INTO analytics_players (player_hash, first_day, last_day, play_seconds)
      VALUES (NEW.player_hash, NEW.day, NEW.day, NEW.seconds)
      ON CONFLICT(player_hash) DO UPDATE SET
        last_day = excluded.last_day,
        play_seconds = analytics_players.play_seconds + excluded.play_seconds;
    INSERT INTO analytics_play_sessions (session_hash, player_hash, first_day, last_day, play_seconds)
      VALUES (NEW.session_hash, NEW.player_hash, NEW.day, NEW.day, NEW.seconds)
      ON CONFLICT(session_hash) DO UPDATE SET
        last_day = excluded.last_day,
        play_seconds = analytics_play_sessions.play_seconds + excluded.play_seconds;
  END`
];

export async function ensurePlaytimeSchema(env) {
  let ready = playtimeSchemas.get(env.AUTH_DB);
  if (!ready) {
    ready = (async () => {
      const existing = await env.AUTH_DB.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'analytics_play_events'"
      ).first();
      if (!existing) await env.AUTH_DB.batch(PLAYTIME_SCHEMA.map(sql => env.AUTH_DB.prepare(sql)));
    })();
    playtimeSchemas.set(env.AUTH_DB, ready);
    try { await ready; } catch (error) { playtimeSchemas.delete(env.AUTH_DB); throw error; }
  }
  return ready;
}

export async function analyticsStatement(request, env, kind, actor, eventId, now = Date.now()) {
  if (!analyticsEnabled(env)) return null;
  const day = chinaDay(now);
  const event = hex(await keyedHash(env.AUTH_PASSWORD_PEPPER, `analytics:event:${kind}:${eventId}`));
  const identity = hex(await keyedHash(env.AUTH_PASSWORD_PEPPER, `analytics:actor:${day}:${kind}:${actor}`));
  return env.AUTH_DB.prepare(
    `INSERT INTO analytics_events (event_hash, day, kind, actor_hash, device) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(event_hash) DO NOTHING`
  ).bind(event, day, kind, identity, deviceCategory(request));
}

function json(data, status = 200, extra = {}) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store', ...extra } });
}

async function analyticsBody(request, limit = 512) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return { error: '统计请求需要JSON数据', status: 415 };
  }
  if (Number(request.headers.get('content-length')) > limit) return { error: '统计请求过大', status: 413 };
  const reader = request.body?.getReader();
  if (!reader) return { error: '缺少统计标识', status: 400 };
  const chunks = [];
  let size = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > limit) { await reader.cancel(); return { error: '统计请求过大', status: 413 }; }
    chunks.push(part.value);
  }
  let body;
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { error: '统计数据格式错误', status: 400 };
  }
  return body;
}

function validUuid(value) {
  return typeof value === 'string' && UUID.test(value);
}

async function analyticsRequest(request, env, limit = 512) {
  if (env.ANALYTICS_ENABLED !== 'true') return { response: json({ error: '接口不存在' }, 404) };
  if (request.method !== 'POST') return { response: json({ error: '请求方法不支持' }, 405) };
  const url = new URL(request.url);
  if (!analyticsEnabled(env) || url.protocol !== 'https:' || new URL(env.AUTH_ORIGIN).origin !== url.origin) {
    return { response: json({ error: '访问统计服务尚未就绪' }, 503) };
  }
  if (request.headers.get('origin') !== url.origin) return { response: json({ error: '请求来源无效' }, 403) };
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip) return { response: json({ error: '无法验证统计请求来源' }, 503) };
  const body = await analyticsBody(request, limit);
  if (body && typeof body === 'object' && body.error) return { response: json({ error: body.error }, body.status) };
  return { url, ip, body };
}

export async function handleAnalytics(request, env) {
  const context = await analyticsRequest(request, env);
  if (context.response) return context.response;
  const { body, ip } = context;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 2
      || !validUuid(body.visitorId) || !validUuid(body.visitId)) return json({ error: '统计标识无效' }, 400);
  const ipRetry = await consumeLimit(env, `analytics:ip:${ip}`, 120, 60000);
  if (ipRetry) return json({ error: '统计请求过于频繁' }, 429, { 'retry-after': String(ipRetry) });
  const visitorRetry = await consumeLimit(env, `analytics:visitor:${body.visitorId}`, 30, 60000);
  if (visitorRetry) return json({ error: '统计请求过于频繁' }, 429, { 'retry-after': String(visitorRetry) });
  await (await analyticsStatement(request, env, 'visit', body.visitorId, body.visitId)).run();
  return json({ ok: true });
}

export async function handlePlaytime(request, env) {
  const context = await analyticsRequest(request, env, 768);
  if (context.response) return context.response;
  const { body, ip } = context;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 4
      || !validUuid(body.visitorId) || !validUuid(body.playId) || !validUuid(body.eventId)
      || !Number.isInteger(body.seconds) || body.seconds < 1 || body.seconds > 120) {
    return json({ error: '游玩时长统计无效' }, 400);
  }
  const ipRetry = await consumeLimit(env, `analytics:play-ip:${ip}`, 240, 60000);
  if (ipRetry) return json({ error: '统计请求过于频繁' }, 429, { 'retry-after': String(ipRetry) });
  const visitorRetry = await consumeLimit(env, `analytics:play:${body.visitorId}`, 8, 60000);
  if (visitorRetry) return json({ error: '统计请求过于频繁' }, 429, { 'retry-after': String(visitorRetry) });
  await ensurePlaytimeSchema(env);
  const day = chinaDay();
  const eventHash = hex(await keyedHash(env.AUTH_PASSWORD_PEPPER, `analytics:event:play:${body.eventId}`));
  const playerHash = hex(await keyedHash(env.AUTH_PASSWORD_PEPPER, `analytics:player:${body.visitorId}`));
  const sessionHash = hex(await keyedHash(env.AUTH_PASSWORD_PEPPER, `analytics:session:${body.playId}`));
  await env.AUTH_DB.prepare(
    `INSERT INTO analytics_play_events (event_hash, day, player_hash, session_hash, device, seconds)
     VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(event_hash) DO NOTHING`
  ).bind(eventHash, day, playerHash, sessionHash, deviceCategory(request), body.seconds).run();
  return json({ ok: true });
}

export async function purgeAnalytics(env, now = Date.now()) {
  if (!analyticsEnabled(env)) return;
  await ensurePlaytimeSchema(env);
  const cutoff = chinaDay(now - 6 * DAY_MS);
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare('DELETE FROM analytics_events WHERE day < ?').bind(cutoff),
    env.AUTH_DB.prepare('DELETE FROM analytics_seen WHERE day < ?').bind(cutoff),
    env.AUTH_DB.prepare('DELETE FROM analytics_play_events WHERE day < ?').bind(cutoff),
    env.AUTH_DB.prepare('DELETE FROM analytics_play_seen WHERE day < ?').bind(cutoff),
    env.AUTH_DB.prepare('DELETE FROM auth_attempts WHERE expires_at <= ?').bind(now)
  ]);
}
