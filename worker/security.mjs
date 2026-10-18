const encoder = new TextEncoder();
export const hex = bytes => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');

export async function keyedHash(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, encoder.encode(value));
}

export async function consumeLimit(env, bucket, limit, windowMs) {
  const now = Date.now();
  const key = hex(await keyedHash(env.AUTH_PASSWORD_PEPPER, `limit:${bucket}`));
  const result = await env.AUTH_DB.prepare(
    `INSERT INTO auth_attempts (bucket, attempts, expires_at) VALUES (?, 1, ?)
     ON CONFLICT(bucket) DO UPDATE SET
       attempts = CASE WHEN auth_attempts.expires_at <= ? THEN 1 ELSE auth_attempts.attempts + 1 END,
       expires_at = CASE WHEN auth_attempts.expires_at <= ? THEN excluded.expires_at ELSE auth_attempts.expires_at END
     RETURNING attempts, expires_at`
  ).bind(key, now + windowMs, now, now).first();
  return result.attempts > limit ? Math.max(1, Math.ceil((result.expires_at - now) / 1000)) : 0;
}
