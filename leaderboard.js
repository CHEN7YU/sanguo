(() => {
  'use strict';

  const API_URL = 'https://sanguozhi-zhaolie-leaderboard.fanduanyang.chatgpt.site';
  const STORAGE_KEY = 'zhaolie-leaderboard-local-v1';
  const PLAYER_KEY = 'zhaolie-leaderboard-player-v1';
  const NICKNAME_KEY = 'zhaolie-leaderboard-nickname-v1';
  const RULE_VERSION = 1;
  const levels = {
    'sishui-pass': { name: '汜水关之战', targetSeconds: 600, targetTurns: 12, maxTurns: 30 },
    'hulao-pass': { name: '虎牢关之战', targetSeconds: 900, targetTurns: 15, maxTurns: 30 },
    guangchuan: { name: '广川之战', targetSeconds: 720, targetTurns: 14, maxTurns: 30 },
    xindu: { name: '信都之战', targetSeconds: 780, targetTurns: 15, maxTurns: 30 },
    julu: { name: '巨鹿之战', targetSeconds: 900, targetTurns: 16, maxTurns: 30 },
    qinghe: { name: '清河之战', targetSeconds: 840, targetTurns: 15, maxTurns: 30 },
    jieqiao: { name: '界桥之战', targetSeconds: 1200, targetTurns: 22, maxTurns: 40 },
    beihai: { name: '北海之战', targetSeconds: 900, targetTurns: 16, maxTurns: 30 },
    xuzhou: { name: '徐州之战', targetSeconds: 1080, targetTurns: 18, maxTurns: 30 },
    xiaopei: { name: '小沛之战', targetSeconds: 900, targetTurns: 10, maxTurns: 30 },
    taishan: { name: '泰山之战', targetSeconds: 1080, targetTurns: 18, maxTurns: 40 },
    huainan: { name: '淮南之战', targetSeconds: 1200, targetTurns: 22, maxTurns: 30 }
  };

  let activeLevel = null;
  let elapsedMs = 0;
  let clockStartedAt = 0;
  let clockRunning = false;
  let lastResult = null;
  let shownLevelId = 'sishui-pass';
  let championsLoadedAt = 0;
  const CHAMPION_REFRESH_MS = 5 * 60 * 1000;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const playerId = (() => {
    try {
      let id = localStorage.getItem(PLAYER_KEY);
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(PLAYER_KEY, id);
      }
      return id;
    } catch {
      return `session-${Math.random().toString(36).slice(2)}`;
    }
  })();

  function currentElapsed() {
    return Math.max(0, Math.round(elapsedMs + (clockRunning ? performance.now() - clockStartedAt : 0)));
  }

  function resumeClock() {
    if (clockRunning || document.hidden) return;
    clockStartedAt = performance.now();
    clockRunning = true;
  }

  function pauseClock() {
    if (!clockRunning) return;
    elapsedMs += performance.now() - clockStartedAt;
    clockRunning = false;
  }

  function reset(level) {
    activeLevel = level?.id || null;
    elapsedMs = 0;
    clockStartedAt = 0;
    clockRunning = false;
    lastResult = null;
    document.getElementById('battleScoreCard')?.classList.add('hidden');
  }

  function start(level) {
    if (level?.id && activeLevel !== level.id) reset(level);
    resumeClock();
  }

  function snapshotClock() {
    return { elapsedMs: currentElapsed(), levelId: activeLevel };
  }

  function restoreClock(snapshot, level) {
    activeLevel = level?.id || snapshot?.levelId || null;
    elapsedMs = Math.max(0, Number(snapshot?.elapsedMs) || 0);
    clockRunning = false;
    resumeClock();
  }

  function scoreMetrics({ levelId, elapsedMs: duration, turns, lossPercent, retreatCount, victoryType }) {
    const rule = levels[levelId] || { targetSeconds: 900, targetTurns: 15, maxTurns: 30 };
    const seconds = Math.max(1, Math.round(duration / 1000));
    const safeTurns = clamp(Math.round(turns), 1, rule.maxTurns);
    const loss = clamp(Number(lossPercent) || 0, 0, 100);
    const timeRatio = clamp(1 - Math.max(0, seconds - rule.targetSeconds) / (rule.targetSeconds * 2), 0, 1);
    const turnRatio = clamp(1 - Math.max(0, safeTurns - rule.targetTurns) / Math.max(1, rule.maxTurns - rule.targetTurns), 0, 1);
    const timeScore = Math.round(2500 * timeRatio);
    const turnScore = Math.round(3000 * turnRatio);
    const preservationScore = Math.round(3500 * (1 - loss / 100));
    const noRetreatBonus = retreatCount === 0 ? 400 : 0;
    const duelBonus = victoryType === 'duel' ? 350 : 0;
    const efficiencyBonus = seconds <= rule.targetSeconds && safeTurns <= rule.targetTurns ? 250 : 0;
    const bonusScore = noRetreatBonus + duelBonus + efficiencyBonus;
    const score = clamp(timeScore + turnScore + preservationScore + bonusScore, 0, 10000);
    const grade = score >= 9000 ? 'S' : score >= 8000 ? 'A' : score >= 6500 ? 'B' : score >= 5000 ? 'C' : 'D';
    return { score, grade, timeScore, turnScore, preservationScore, bonusScore, seconds };
  }

  function finish({ level, turns, units, victoryType = 'normal' }) {
    pauseClock();
    const allies = (units || []).filter(unit => unit.side === 'ally');
    const totalHp = allies.reduce((sum, unit) => sum + Math.max(0, Number(unit.maxHp) || 0), 0);
    const remainingHp = allies.reduce((sum, unit) => sum + Math.max(0, Number(unit.hp) || 0), 0);
    const lossPercent = totalHp ? Math.round((1 - remainingHp / totalHp) * 1000) / 10 : 0;
    const retreatCount = allies.filter(unit => (Number(unit.hp) || 0) <= 0).length;
    const raw = {
      levelId: level.id,
      levelName: level.name,
      elapsedMs: currentElapsed(),
      turns,
      lossPercent,
      retreatCount,
      victoryType,
      maxTurns: level.maxTurns || levels[level.id]?.maxTurns || 30,
      ruleVersion: RULE_VERSION
    };
    lastResult = { ...raw, ...scoreMetrics(raw) };
    renderScoreCard(lastResult);
    return lastResult;
  }

  function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function championEntries(entries) {
    const winners = new Map();
    (Array.isArray(entries) ? entries : []).forEach(entry => {
      if (!entry || !levels[entry.levelId] || !Number.isFinite(Number(entry.score))) return;
      const candidate = {
        ...entry,
        score: Number(entry.score),
        elapsedMs: Math.max(0, Number(entry.elapsedMs) || 0),
        turns: Math.max(0, Number(entry.turns) || 0)
      };
      const current = winners.get(candidate.levelId);
      const better = !current
        || candidate.score > current.score
        || (candidate.score === current.score && candidate.elapsedMs < current.elapsedMs)
        || (candidate.score === current.score && candidate.elapsedMs === current.elapsedMs && candidate.turns < current.turns);
      if (better) winners.set(candidate.levelId, candidate);
    });
    return Object.keys(levels).map(levelId => winners.get(levelId)).filter(Boolean);
  }

  function setChampionLabel(text) {
    const label = document.querySelector('.title-champion-label');
    if (!label) return;
    const mark = document.createElement('span');
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '◆';
    label.replaceChildren(mark, document.createTextNode(` ${text}`));
  }

  function createChampionItem(entry, duplicate = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'title-champion-item';
    button.dataset.championLevel = entry.levelId;
    if (duplicate) button.tabIndex = -1;
    button.title = `查看${levels[entry.levelId].name}完整排行榜`;
    button.addEventListener('click', () => void openLeaderboard(entry.levelId));

    const levelName = document.createElement('strong');
    levelName.textContent = levels[entry.levelId].name;
    const grade = document.createElement('em');
    grade.textContent = entry.grade || '—';
    const nickname = document.createElement('span');
    nickname.textContent = entry.nickname || '无名将军';
    const score = document.createElement('b');
    score.textContent = `${entry.score.toLocaleString('zh-CN')}分`;
    const detail = document.createElement('small');
    detail.textContent = `${formatTime(Math.round(entry.elapsedMs / 1000))} · ${entry.turns}回合`;
    button.append(levelName, grade, nickname, score, detail);
    return button;
  }

  function createChampionSet(entries, duplicate = false) {
    const set = document.createElement('div');
    set.className = 'title-champion-set';
    if (duplicate) set.setAttribute('aria-hidden', 'true');
    entries.forEach(entry => set.appendChild(createChampionItem(entry, duplicate)));
    return set;
  }

  function renderChampionTicker(entries, mode = 'online') {
    const ticker = document.getElementById('titleChampionTicker');
    const track = document.getElementById('titleChampionTrack');
    if (!ticker || !track) return;
    const champions = championEntries(entries);
    track.replaceChildren();
    ticker.classList.remove('hidden');
    ticker.dataset.mode = mode;
    ticker.setAttribute('aria-label', '全服各关最高战绩');
    setChampionLabel('天下战报');

    if (!champions.length) {
      track.classList.add('static');
      const empty = document.createElement('div');
      empty.className = 'title-champion-set';
      const message = document.createElement('span');
      message.className = 'title-champion-item title-champion-empty';
      message.textContent = mode === 'unavailable' ? '天下战报暂不可用 · 请稍后重试' : '全服尚无战绩 · 首位通关者将登上战报';
      empty.appendChild(message);
      track.appendChild(empty);
      return;
    }

    track.classList.remove('static');
    track.style.setProperty('--ticker-duration', `${Math.max(32, champions.length * 8)}s`);
    track.append(createChampionSet(champions), createChampionSet(champions, true));
  }

  async function loadTitleChampions(force = false) {
    if (!force && Date.now() - championsLoadedAt < CHAMPION_REFRESH_MS) return;
    championsLoadedAt = Date.now();
    try {
      if (!API_URL) throw new Error('offline');
      const response = await fetch(`${API_URL}/api/leaderboard?scope=champions`, { cache: 'no-store' });
      if (!response.ok && [400, 404].includes(response.status)) {
        const legacyResponses = await Promise.allSettled(Object.keys(levels).map(async levelId => {
          const levelResponse = await fetch(`${API_URL}/api/leaderboard?level=${encodeURIComponent(levelId)}`, { cache: 'no-store' });
          if (!levelResponse.ok) return null;
          const levelData = await levelResponse.json();
          return levelData.entries?.[0] || null;
        }));
        const legacyChampions = legacyResponses
          .filter(result => result.status === 'fulfilled' && result.value)
          .map(result => result.value);
        if (legacyChampions.length) {
          renderChampionTicker(legacyChampions, 'online');
          return;
        }
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      renderChampionTicker(data.entries || [], 'online');
    } catch (error) {
      console.warn('天下战报读取失败', error);
      renderChampionTicker([], 'unavailable');
    }
  }

  function renderScoreCard(result) {
    const card = document.getElementById('battleScoreCard');
    if (!card) return;
    card.classList.remove('hidden');
    card.querySelector('[data-score-total]').textContent = result.score.toLocaleString('zh-CN');
    card.querySelector('[data-score-grade]').textContent = result.grade;
    card.querySelector('[data-score-time]').textContent = `${formatTime(result.seconds)} · ${result.timeScore}分`;
    card.querySelector('[data-score-turns]').textContent = `第${result.turns}回合 · ${result.turnScore}分`;
    card.querySelector('[data-score-loss]').textContent = `损失${result.lossPercent}% · ${result.preservationScore}分`;
    card.querySelector('[data-score-bonus]').textContent = `${result.bonusScore}分`;
    const nickname = document.getElementById('scoreNickname');
    if (nickname && !nickname.value) {
      try { nickname.value = localStorage.getItem(NICKNAME_KEY) || ''; } catch {}
    }
    document.getElementById('scoreUploadStatus').textContent = '输入昵称后上传本关最高成绩';
  }

  function localEntries() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function storeLocal(entry) {
    const entries = localEntries();
    const index = entries.findIndex(item => item.playerId === entry.playerId && item.levelId === entry.levelId);
    if (index < 0) entries.push(entry);
    else if (entry.score >= entries[index].score) entries[index] = entry;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-100))); } catch {}
  }

  function nicknameValue() {
    const value = document.getElementById('scoreNickname')?.value.trim().replace(/[<>]/g, '') || '';
    return value.slice(0, 16);
  }

  async function uploadResult() {
    if (!lastResult) return;
    const nickname = nicknameValue();
    const status = document.getElementById('scoreUploadStatus');
    const button = document.getElementById('scoreUploadBtn');
    if (nickname.length < 2) {
      status.textContent = '昵称至少需要2个字符';
      return;
    }
    try { localStorage.setItem(NICKNAME_KEY, nickname); } catch {}
    const payload = { ...lastResult, playerId, nickname };
    button.disabled = true;
    status.textContent = '正在上传战绩……';
    try {
      if (!API_URL) throw new Error('offline');
      const response = await fetch(`${API_URL}/api/leaderboard`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      status.textContent = data.improved === false ? `已有更高纪录 · 当前第${data.rank}名` : `上传成功 · 本关第${data.rank}名`;
      void loadTitleChampions(true);
      await openLeaderboard(lastResult.levelId);
    } catch {
      storeLocal({ ...payload, createdAt: new Date().toISOString() });
      status.textContent = '在线榜暂不可用，成绩已保存在本机试玩榜';
      void loadTitleChampions(true);
    } finally {
      button.disabled = false;
    }
  }

  function renderRows(entries, mode = 'online') {
    const body = document.getElementById('leaderboardRows');
    const empty = document.getElementById('leaderboardEmpty');
    body.replaceChildren();
    const sorted = [...entries].sort((a, b) => b.score - a.score || a.elapsedMs - b.elapsedMs || a.turns - b.turns).slice(0, 50);
    empty.classList.toggle('hidden', sorted.length > 0);
    sorted.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = `leaderboard-row${entry.playerId === playerId ? ' mine' : ''}`;
      const values = [index + 1, entry.nickname || '无名将军', entry.score, entry.grade, formatTime(Math.round(entry.elapsedMs / 1000)), `${entry.turns}回合`, `损失${entry.lossPercent}%`];
      values.forEach(value => {
        const span = document.createElement('span');
        span.textContent = String(value);
        row.appendChild(span);
      });
      body.appendChild(row);
    });
    document.getElementById('leaderboardMode').textContent = mode === 'online' ? '全服排行榜 · 每位玩家仅显示最高成绩' : '本机试玩榜 · 在线服务暂不可用';
  }

  async function loadLeaderboard(levelId) {
    const status = document.getElementById('leaderboardMode');
    status.textContent = '正在读取排行榜……';
    try {
      if (!API_URL) throw new Error('offline');
      const response = await fetch(`${API_URL}/api/leaderboard?level=${encodeURIComponent(levelId)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      renderRows(data.entries || [], 'online');
    } catch {
      renderRows(localEntries().filter(entry => entry.levelId === levelId), 'local');
    }
  }

  async function openLeaderboard(levelId = activeLevel || shownLevelId) {
    shownLevelId = levels[levelId] ? levelId : 'sishui-pass';
    document.getElementById('leaderboardOverlay')?.classList.remove('hidden');
    document.querySelectorAll('[data-leaderboard-level]').forEach(button => button.classList.toggle('active', button.dataset.leaderboardLevel === shownLevelId));
    document.getElementById('leaderboardTitle').textContent = `${levels[shownLevelId].name}排行榜`;
    await loadLeaderboard(shownLevelId);
  }

  function closeLeaderboard() {
    document.getElementById('leaderboardOverlay')?.classList.add('hidden');
  }

  function init() {
    document.getElementById('titleLeaderboardBtn')?.addEventListener('click', () => openLeaderboard(activeLevel || 'sishui-pass'));
    document.getElementById('scoreLeaderboardBtn')?.addEventListener('click', () => openLeaderboard(lastResult?.levelId));
    document.getElementById('scoreUploadBtn')?.addEventListener('click', uploadResult);
    document.getElementById('leaderboardCloseBtn')?.addEventListener('click', closeLeaderboard);
    document.getElementById('leaderboardRefreshBtn')?.addEventListener('click', () => loadLeaderboard(shownLevelId));
    document.querySelectorAll('[data-leaderboard-level]').forEach(button => button.addEventListener('click', () => openLeaderboard(button.dataset.leaderboardLevel)));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseClock();
      else {
        if (activeLevel && !lastResult) resumeClock();
        if (!document.getElementById('titleScreen')?.classList.contains('hidden')) void loadTitleChampions();
      }
    });
    void loadTitleChampions();
    setInterval(() => {
      if (!document.hidden && !document.getElementById('titleScreen')?.classList.contains('hidden')) void loadTitleChampions();
    }, CHAMPION_REFRESH_MS);
  }

  window.ZhaolieLeaderboard = { init, reset, start, finish, snapshotClock, restoreClock, scoreMetrics, championEntries, loadTitleChampions, openLeaderboard };
  init();
})();
