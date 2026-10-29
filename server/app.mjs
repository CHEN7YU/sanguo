import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import worker from '../worker/index.mjs';
import { openDatabase, databaseBinding, verifyMigrations } from './database.mjs';

export function serverConfig(env) {
  const origin = new URL(env.AUTH_ORIGIN);
  if (origin.protocol !== 'https:' || origin.origin !== env.AUTH_ORIGIN) {
    throw new Error('AUTH_ORIGIN must be an exact HTTPS origin without a trailing slash');
  }
  if (typeof env.AUTH_PASSWORD_PEPPER !== 'string' || env.AUTH_PASSWORD_PEPPER.length < 32) {
    throw new Error('AUTH_PASSWORD_PEPPER must contain at least 32 characters');
  }
  const port = Number(env.PORT || 4180);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  return { origin, port };
}

export function createApiServer(env) {
  const { origin } = serverConfig(env);
  return createServer(async (req, res) => {
    try {
      // Only a local reverse proxy may reach this listener. It must replace these headers.
      if (req.headers.host !== origin.host || req.headers['x-forwarded-proto'] !== 'https'
          || !isIP(req.headers['x-real-ip'] || '')) {
        res.writeHead(400, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end(JSON.stringify({ error: '反向代理配置错误，请检查 HTTPS、Host 和客户端地址' }));
        return;
      }
      const url = new URL(req.url, origin);
      if (url.origin !== origin.origin || !url.pathname.startsWith('/api/')) {
        res.writeHead(404);
        res.end();
        return;
      }
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (value !== undefined && !['connection', 'transfer-encoding', 'cf-connecting-ip'].includes(name)) {
          headers.set(name, Array.isArray(value) ? value.join(', ') : value);
        }
      }
      // The public client must not be able to forge the shared handlers' rate-limit key.
      headers.set('cf-connecting-ip', req.headers['x-real-ip']);
      const request = new Request(url, {
        method: req.method, headers,
        ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: Readable.toWeb(req), duplex: 'half' })
      });
      const response = await worker.fetch(request, env);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      console.error('Node API request failed:', error.name);
      if (!res.headersSent) res.writeHead(503, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ error: '账号或云存档服务暂时不可用，请稍后重试' }));
    }
  });
}

export async function startServer(env = process.env) {
  const { port } = serverConfig(env);
  if (!env.DATABASE_PATH || !existsSync(env.DATABASE_PATH)) {
    throw new Error('DATABASE_PATH must point to an existing migrated database outside the release directory');
  }
  const sqlite = openDatabase(env.DATABASE_PATH);
  let server, cleanup;
  try {
    if (!sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'app_migrations'").get()) {
      throw new Error('Run the explicit database migration command before starting the service');
    }
    verifyMigrations(sqlite);
    const binding = { AUTH_DB: databaseBinding(sqlite), AUTH_ORIGIN: env.AUTH_ORIGIN,
      AUTH_PASSWORD_PEPPER: env.AUTH_PASSWORD_PEPPER, ANALYTICS_ENABLED: env.ANALYTICS_ENABLED || 'true' };
    await worker.scheduled(null, binding);
    server = createApiServer(binding);
    cleanup = setInterval(() => {
      worker.scheduled(null, binding).catch(error => console.error('Analytics cleanup failed:', error.name));
    }, 3600000);
    cleanup.unref();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });
    console.log(`Account API listening on 127.0.0.1:${port}; public origin ${env.AUTH_ORIGIN}`);
    server.once('close', () => { clearInterval(cleanup); sqlite.close(); });
    return server;
  } catch (error) {
    clearInterval(cleanup);
    sqlite.close();
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.umask(0o077);
  const server = await startServer();
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
}
