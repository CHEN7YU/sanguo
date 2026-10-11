import { sessionUser } from './auth.mjs';
import { validatePayload, MAX_BUNDLE_BYTES } from '../save-format.mjs';

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function entry(row) {
  return row ? { payload: JSON.parse(row.payload), revision: row.revision, updatedAt: row.updated_at } : { payload: null, revision: 0, updatedAt: null };
}

export async function handleSaves(request, env) {
  const url = new URL(request.url);
  if (!env.AUTH_ORIGIN || new URL(env.AUTH_ORIGIN).origin !== url.origin || url.protocol !== 'https:') {
    return json({ error: '云存档服务未配置或域名不匹配' }, 503);
  }
  if (!['GET', 'PUT'].includes(request.method)) return json({ error: '请求方法不支持' }, 405);
  const user = await sessionUser(request, env);
  if (!user) return json({ error: '登录已失效，请重新登录；本机进度仍保留' }, 401);
  // This header detects another tab changing the browser session; it never authorizes access.
  if (request.headers.get('x-save-owner') !== user.id) return json({ error: '账号已切换，请刷新后重试' }, 409);
  const select = () => env.AUTH_DB.prepare('SELECT payload, revision, updated_at FROM save_bundles WHERE user_id = ?').bind(user.id).first();
  if (request.method === 'GET') {
    if (url.pathname === '/api/saves/history') {
      const rows = await env.AUTH_DB.prepare('SELECT payload, revision, updated_at FROM save_history WHERE user_id = ? ORDER BY revision DESC')
        .bind(user.id).all();
      return json({ userId: user.id, entries: rows.results.map(entry) });
    }
    return json({ userId: user.id, ...entry(await select()) });
  }
  if (url.pathname !== '/api/saves') return json({ error: '请求方法不支持' }, 405);
  if (request.headers.get('origin') !== url.origin) return json({ error: '请求来源无效' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: '需要JSON存档数据' }, 415);
  if (Number(request.headers.get('content-length')) > MAX_BUNDLE_BYTES + 2048) return json({ error: '存档文件过大' }, 413);
  const reader = request.body?.getReader();
  if (!reader) return json({ error: '缺少存档数据' }, 400);
  const chunks = [];
  let bytes = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    bytes += part.value.length;
    if (bytes > MAX_BUNDLE_BYTES + 2048) { await reader.cancel(); return json({ error: '存档文件过大' }, 413); }
    chunks.push(part.value);
  }
  let body, payload;
  try {
    const buffer = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder().decode(buffer));
    payload = validatePayload(body.payload, { cloud: true });
    if (!Number.isSafeInteger(body.baseRevision) || body.baseRevision < 0) throw new Error('云存档版本无效');
    if (typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(body.requestId)) throw new Error('同步请求标识无效');
  } catch (error) {
    return json({ error: error.message || '存档数据格式错误' }, 400);
  }
  const now = Date.now();
  const result = await env.AUTH_DB.prepare(
    `INSERT INTO save_bundles (user_id, payload, revision, updated_at, request_id)
     SELECT ?, ?, 1, ?, ? WHERE ? = 0 OR EXISTS (SELECT 1 FROM save_bundles WHERE user_id = ?)
     ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, revision = save_bundles.revision + 1, updated_at = excluded.updated_at, request_id = excluded.request_id
     WHERE save_bundles.revision = ? RETURNING revision, updated_at`
  ).bind(user.id, JSON.stringify(payload), now, body.requestId, body.baseRevision, user.id, body.baseRevision).first();
  if (!result) {
    const retry = await env.AUTH_DB.prepare('SELECT revision, updated_at FROM save_bundles WHERE user_id = ? AND request_id = ? AND payload = ?')
      .bind(user.id, body.requestId, JSON.stringify(payload)).first();
    if (retry) return json({ userId: user.id, revision: retry.revision, updatedAt: retry.updated_at });
    return json({ error: '云端已有其他版本，请选择保留哪一份', userId: user.id, ...entry(await select()) }, 409);
  }
  return json({ userId: user.id, revision: result.revision, updatedAt: result.updated_at });
}
