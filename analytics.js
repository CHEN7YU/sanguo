(() => {
  'use strict';
  if (!['http:', 'https:'].includes(location.protocol)) return;

  const visitorKey = 'zhaolie-visitor-v1';
  const queueKey = 'zhaolie-playtime-queue-v1';
  const heartbeatMs = 30000;
  const maxChunkSeconds = 120;
  let visitorId, visitId, playId, playActive = false, activeSince = null, accruedMs = 0;
  let visitSent = false, visitInFlight = false, visitRetried = false, playSending = false, timer = 0;
  let analyticsAvailable = false, pendingPlayStart = false;
  let playQueue = [];

  function identifiers() {
    if (visitorId) return true;
    try {
      const saved = localStorage.getItem(visitorKey);
      const identity = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(saved || '')
        ? saved : crypto.randomUUID();
      if (saved !== identity) localStorage.setItem(visitorKey, identity);
      const storedQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      playQueue = Array.isArray(storedQueue) ? storedQueue.filter(validQueuedPlay).slice(-200) : [];
      visitId = crypto.randomUUID();
      visitorId = identity;
      return true;
    } catch (error) {
      console.warn('访问统计标识无法保存，本页不统计；游戏不受影响', error);
      return false;
    }
  }

  function validQueuedPlay(item) {
    return item && typeof item === 'object' && Number.isInteger(item.seconds)
      && item.seconds >= 1 && item.seconds <= maxChunkSeconds
      && [item.visitorId, item.playId, item.eventId].every(value =>
        typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value));
  }

  function persistQueue() {
    try { localStorage.setItem(queueKey, JSON.stringify(playQueue.slice(-200))); }
    catch (error) { console.warn('游玩时长暂存失败；游戏不受影响', error); }
  }

  async function post(path, body) {
    const response = await fetch(path, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      credentials: 'omit', mode: 'same-origin', cache: 'no-store', keepalive: true,
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.headers.get('content-type')?.includes('application/json') || (await response.json()).ok !== true) {
      throw new Error('统计服务未确认写入');
    }
  }

  async function trackVisit() {
    if (visitSent || visitInFlight || document.visibilityState === 'hidden') return;
    visitInFlight = true;
    try {
      const session = await window.ZhaolieCloud?.ready;
      if (!session?.analytics || !identifiers()) return;
      analyticsAvailable = true;
      await post('/api/analytics/visit', { visitorId, visitId });
      visitSent = true;
      await drainPlaytime();
      if (pendingPlayStart) startPlaytime();
    } catch (error) {
      console.warn('访问统计暂未送达；游戏和存档不受影响', error);
      if (!visitRetried) { visitRetried = true; setTimeout(trackVisit, 15000); }
    } finally {
      visitInFlight = false;
    }
  }

  async function drainPlaytime() {
    if (playSending || !playQueue.length) return;
    playSending = true;
    try {
      while (playQueue.length) {
        await post('/api/analytics/playtime', playQueue[0]);
        playQueue.shift();
        persistQueue();
      }
    } catch (error) {
      console.warn('游玩时长统计暂未送达；下次联网会继续上报', error);
    } finally {
      playSending = false;
    }
  }

  function resumeClock() {
    if (playActive && document.visibilityState !== 'hidden' && activeSince === null) activeSince = performance.now();
  }

  function pauseClock() {
    if (activeSince === null) return;
    accruedMs += Math.max(0, performance.now() - activeSince);
    activeSince = null;
  }

  function flushPlaytime() {
    if (!playActive || !visitorId || !playId) return;
    pauseClock();
    let seconds = Math.floor(accruedMs / 1000);
    accruedMs -= seconds * 1000;
    while (seconds > 0) {
      const chunk = Math.min(seconds, maxChunkSeconds);
      playQueue.push({ visitorId, playId, eventId: crypto.randomUUID(), seconds: chunk });
      seconds -= chunk;
    }
    if (playQueue.length) {
      playQueue = playQueue.slice(-200);
      persistQueue();
      void drainPlaytime();
    }
    resumeClock();
  }

  function startPlaytime() {
    if (playActive) return;
    if (!analyticsAvailable) { pendingPlayStart = true; void trackVisit(); return; }
    if (!identifiers()) return;
    pendingPlayStart = false;
    playActive = true;
    playId = crypto.randomUUID();
    resumeClock();
    timer = setInterval(flushPlaytime, heartbeatMs);
  }

  function stopPlaytime() {
    pendingPlayStart = false;
    if (!playActive) return;
    pauseClock();
    flushPlaytime();
    playActive = false;
    activeSince = null;
    playId = null;
    if (timer) clearInterval(timer);
    timer = 0;
  }

  window.addEventListener('zhaolie-gameplay-start', startPlaytime);
  window.addEventListener('zhaolie-gameplay-stop', stopPlaytime);
  window.addEventListener('online', () => { void trackVisit(); void drainPlaytime(); });
  window.addEventListener('pagehide', () => { pauseClock(); flushPlaytime(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { pauseClock(); flushPlaytime(); }
    else { resumeClock(); void trackVisit(); void drainPlaytime(); }
  });
  trackVisit();
})();
