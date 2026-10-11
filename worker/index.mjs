import { handleAuth } from './auth.mjs';
import { handleSaves } from './saves.mjs';

export default {
  async fetch(request, env) {
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      if (['/api/saves', '/api/saves/history'].includes(new URL(request.url).pathname)) return await handleSaves(request, env);
      return await handleAuth(request, env);
    } catch {
      console.error('Account API failed; check AUTH_ORIGIN, D1 binding and migrations');
      return Response.json({ error: '账号或云存档服务暂时不可用，请稍后重试；游客试玩不受影响' }, {
        status: 503, headers: { 'cache-control': 'no-store' }
      });
    }
  }
};
