(() => {
  'use strict';
  if (!['http:', 'https:'].includes(location.protocol)) return;
  const key = 'zhaolie-visitor-v1';
  let visitorId, visitId;
  function identifiers() {
    if (visitorId) return true;
    try {
      const saved = localStorage.getItem(key);
      const identity = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(saved || '')
        ? saved : crypto.randomUUID();
      if (saved !== identity) localStorage.setItem(key, identity);
      visitId = crypto.randomUUID();
      visitorId = identity;
      return true;
    } catch (error) {
      console.warn('访问统计标识无法保存，本页不统计；游戏不受影响', error);
      return false;
    }
  }
  let sent = false, inFlight = false, retried = false;
  async function track() {
    if (sent || inFlight || document.visibilityState === 'hidden') return;
    inFlight = true;
    try {
      const session = await window.ZhaolieCloud?.ready;
      if (!session?.analytics) return;
      if (!identifiers()) return;
      const response = await fetch('/api/analytics/visit', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visitorId, visitId }), credentials: 'omit', mode: 'same-origin',
        cache: 'no-store', keepalive: true, signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.headers.get('content-type')?.includes('application/json') || (await response.json()).ok !== true) {
        throw new Error('统计服务未确认写入');
      }
      sent = true;
    } catch (error) {
      console.warn('访问统计暂未送达；游戏和存档不受影响', error);
      if (!retried) { retried = true; setTimeout(track, 15000); }
    } finally {
      inFlight = false;
    }
  }
  window.addEventListener('online', track);
  document.addEventListener('visibilitychange', track);
  track();
})();
