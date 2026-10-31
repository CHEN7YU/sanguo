import { sessionUser } from './auth.mjs';
import { consumeLimit } from './security.mjs';

const LEVELS = new Set(['sishui-pass', 'hulao-pass', 'guangchuan', 'xindu', 'julu', 'qinghe', 'jieqiao', 'beihai', 'xuzhou', 'xiaopei', 'taishan', 'huainan', 'other']);
const DEVICES = new Set(['windows', 'mac', 'android', 'iphone', 'ipad', 'other']);
const KINDS = new Set(['comment', 'suggestion', 'bug']);
const STATUSES = new Set(['received', 'fixing', 'fixed']);
const MODERATION = new Set(['pending', 'approved', 'hidden']);

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

async function body(request, limit = 4096) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return { error: '留言需要JSON数据', status: 415 };
  }
  if (Number(request.headers.get('content-length')) > limit) return { error: '留言内容过大', status: 413 };
  const reader = request.body?.getReader();
  if (!reader) return { error: '请填写留言', status: 400 };
  const chunks = [];
  let size = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > limit) { await reader.cancel(); return { error: '留言内容过大', status: 413 }; }
    chunks.push(part.value);
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { error: '留言格式错误', status: 400 };
  }
}

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().replace(/\s{3,}/g, ' ').slice(0, max) : '';
}

function adminAllowed(request, env) {
  const expected = env.COMMENTS_ADMIN_TOKEN;
  const supplied = request.headers.get('x-comments-admin') || '';
  if (typeof expected !== 'string' || expected.length < 32 || supplied.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return difference === 0;
}

export async function handleComments(request, env) {
  const url = new URL(request.url);
  if (!env.AUTH_DB) return json({ error: '留言服务暂不可用' }, 503);
  if (url.pathname === '/api/comments' && request.method === 'GET') {
    const rows = await env.AUTH_DB.prepare(
      `SELECT id, public_name AS name, kind, level_id AS levelId, device, body, status,
              pinned, admin_reply AS reply, created_at AS createdAt, updated_at AS updatedAt
       FROM public_comments WHERE moderation = 'approved'
       ORDER BY pinned DESC, approved_at DESC, created_at DESC LIMIT 50`
    ).all();
    return json({ comments: rows.results || [] });
  }
  if (url.pathname === '/api/comments' && request.method === 'POST') {
    if (request.headers.get('origin') !== url.origin) return json({ error: '请求来源无效' }, 403);
    const ip = request.headers.get('cf-connecting-ip');
    if (!ip) return json({ error: '无法验证请求来源' }, 503);
    const parsed = await body(request);
    if (parsed?.error) return json({ error: parsed.error }, parsed.status);
    const name = cleanText(parsed?.name, 20), message = cleanText(parsed?.body, 600);
    const kind = KINDS.has(parsed?.kind) ? parsed.kind : 'comment';
    const levelId = kind === 'bug' && LEVELS.has(parsed?.levelId) ? parsed.levelId : null;
    const device = kind === 'bug' && DEVICES.has(parsed?.device) ? parsed.device : null;
    if (!/^[A-Za-z0-9_\u3400-\u9fff ·•-]{2,20}$/.test(name)) return json({ error: '公开昵称需为2—20个字' }, 400);
    if (message.length < 2) return json({ error: '留言至少写2个字' }, 400);
    if (kind === 'bug' && (!levelId || !device)) return json({ error: '反馈问题时请选择关卡和设备' }, 400);
    if (await consumeLimit(env, `comments:ip:${ip}`, 5, 3600000)) return json({ error: '留言过于频繁，请稍后再试' }, 429);
    const user = await sessionUser(request, env);
    const now = Date.now(), id = crypto.randomUUID();
    await env.AUTH_DB.prepare(
      `INSERT INTO public_comments
       (id, user_id, public_name, kind, level_id, device, body, status, moderation, pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'received', 'pending', 0, ?, ?)`
    ).bind(id, user?.id || null, name, kind, levelId, device, message, now, now).run();
    return json({ ok: true, id, message: '留言已收到，审核后会公开显示' }, 202);
  }
  if (url.pathname === '/api/comments/admin' && request.method === 'GET') {
    if (!adminAllowed(request, env)) return json({ error: '管理员凭证无效' }, 401);
    const rows = await env.AUTH_DB.prepare(
      `SELECT id, public_name AS name, kind, level_id AS levelId, device, body, status,
              moderation, pinned, admin_reply AS reply, created_at AS createdAt, updated_at AS updatedAt
       FROM public_comments ORDER BY created_at DESC LIMIT 200`
    ).all();
    return json({ comments: rows.results || [] });
  }
  if (url.pathname === '/api/comments/admin' && request.method === 'PATCH') {
    if (!adminAllowed(request, env)) return json({ error: '管理员凭证无效' }, 401);
    const parsed = await body(request);
    if (parsed?.error) return json({ error: parsed.error }, parsed.status);
    const id = typeof parsed?.id === 'string' ? parsed.id : '';
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: '留言编号无效' }, 400);
    const moderation = MODERATION.has(parsed.moderation) ? parsed.moderation : 'pending';
    const status = STATUSES.has(parsed.status) ? parsed.status : 'received';
    const reply = cleanText(parsed.reply, 600) || null;
    const pinned = parsed.pinned ? 1 : 0, now = Date.now();
    const result = await env.AUTH_DB.prepare(
      `UPDATE public_comments SET moderation = ?, status = ?, pinned = ?, admin_reply = ?,
          approved_at = CASE WHEN ? = 'approved' THEN COALESCE(approved_at, ?) ELSE approved_at END,
          updated_at = ? WHERE id = ?`
    ).bind(moderation, status, pinned, reply, moderation, now, now, id).run();
    if (!result.changes) return json({ error: '没有找到这条留言' }, 404);
    return json({ ok: true });
  }
  return json({ error: '接口不存在' }, 404);
}
