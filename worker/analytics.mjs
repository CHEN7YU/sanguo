import { consumeLimit, hex, keyedHash } from './security.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DAY_MS = 86400000;
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
  const cutoff = chinaDay(now - 6 * DAY_MS);
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare('DELETE FROM analytics_events WHERE day < ?').bind(cutoff),
    env.AUTH_DB.prepare('DELETE FROM analytics_seen WHERE day < ?').bind(cutoff),
    env.AUTH_DB.prepare('DELETE FROM analytics_play_events WHERE day < ?').bind(cutoff),
    env.AUTH_DB.prepare('DELETE FROM analytics_play_seen WHERE day < ?').bind(cutoff),
    env.AUTH_DB.prepare('DELETE FROM auth_attempts WHERE expires_at <= ?').bind(now)
  ]);
}
