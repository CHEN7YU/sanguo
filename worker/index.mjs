import { handleAuth } from './auth.mjs';
import { handleSaves } from './saves.mjs';
import { handleAnalytics, handlePlaytime, purgeAnalytics } from './analytics.mjs';

export default {
  async fetch(request, env) {
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      if (new URL(request.url).pathname === '/api/analytics/visit') return await handleAnalytics(request, env);
      if (new URL(request.url).pathname === '/api/analytics/playtime') return await handlePlaytime(request, env);
      if (['/api/saves', '/api/saves/history'].includes(new URL(request.url).pathname)) return await handleSaves(request, env);
      return await handleAuth(request, env);
    } catch {
      console.error('Account/save/analytics API failed; check AUTH_ORIGIN, D1 binding and migrations');
      return Response.json({ error: '账号或云存档服务暂时不可用，请稍后重试；游客试玩不受影响' }, {
        status: 503, headers: { 'cache-control': 'no-store' }
      });
    }
  },
  async scheduled(_controller, env) {
    await purgeAnalytics(env);
  }
};
