(() => {
  'use strict';
  const SAVE = 'sanguozhi-zhaolie-save-v1';
  const CAMPAIGN = 'sanguozhi-zhaolie-campaign-v1';
  const BACKUP = 'sanguozhi-zhaolie-import-backup-v1';
  const CLEARED = 'sanguozhi-zhaolie-cleared-levels-v1';
  const HINT = 'zhaolie-last-account';
  const emptyPayload = () => ({ saveStore: { schema: 1, auto: null, manual: Array(6).fill(null) }, campaignTransfer: null, clearedLevels: [] });
  let userId = null, session = null, record = null, conflict = null, timer = null;
  let initialized = false, inFlight = false, stale = false, blocked = false, retryable = true;
  let validateFormat;
  let generation = 0;
  const info = document.getElementById('cloudSaveStatus');
  const dialog = document.getElementById('cloudSaveDialog');
  const notice = document.getElementById('cloudSaveNotice');
  const remoteButton = document.getElementById('cloudUseRemoteBtn');
  const localButton = document.getElementById('cloudUseLocalBtn');
  const syncButton = document.getElementById('cloudSyncBtn');
  const guestButton = document.getElementById('cloudGuestBtn');
  const guestImport = document.getElementById('cloudImportGuestBtn');
  const historyList = document.getElementById('cloudHistoryList');
  const progress = document.getElementById('cloudSaveProgress');
  const conflictPanel = document.getElementById('cloudConflictPanel');
  const moreOptions = document.getElementById('cloudMoreOptions');
  const accountOptions = document.getElementById('cloudAccountOptions');
  const key = () => `zhaolie-account-save-v1:${userId}`;
  const hasData = payload => !!payload?.campaignTransfer || !!payload?.clearedLevels?.length || [payload?.saveStore?.auto, ...(payload?.saveStore?.manual || [])].some(Boolean);

  function show(message) {
    const text = message.startsWith('已同步 ·') ? '进度已保存到云端'
      : message.startsWith('已读取云端版本 ') ? '已从云端恢复进度' : message;
    info.textContent = text;
    progress.textContent = record ? describe(record.payload, false) : '';
    const summary = document.getElementById('cloudSaveSummary');
    if (summary) summary.textContent = text;
    syncButton.hidden = !userId || !!conflict;
    syncButton.disabled = !initialized || inFlight || stale || blocked;
    remoteButton.disabled = localButton.disabled = inFlight || stale || blocked;
    conflictPanel.hidden = !conflict;
    accountOptions.hidden = !userId && !blocked;
    guestImport.hidden = !userId || hasData(record?.payload) || !!conflict || !!record?.pending || stale || blocked;
    document.getElementById('cloudHistoryBtn').disabled = !userId || inFlight || stale || blocked;
    document.getElementById('cloudExportBackupBtn').disabled = !record;
  }
  async function lockAccount() {
    if (!navigator.locks) throw new Error('此浏览器不支持账号存档写入锁，请更新浏览器或切换游客');
    await new Promise((resolve, reject) => {
      navigator.locks.request(`zhaolie-save:${userId}`, { ifAvailable: true }, lock => {
        if (!lock) { stale = true; show('此账号已在另一页面游玩，本页只读；关闭另一页面后刷新'); resolve(); return; }
        resolve();
        return new Promise(() => {});
      }).catch(reject);
    });
  }
  function changed() { window.dispatchEvent(new Event('zhaolie-saves-changed')); }
  function validate(payload) {
    if (!validateFormat) throw new Error('存档校验模块未就绪，写入已暂停');
    return validateFormat(payload);
  }
  function persist(next) {
    localStorage.setItem(key(), JSON.stringify(next));
    record = next;
  }
  function assertWritable() {
    if (!initialized || stale || blocked) throw new Error('存档尚未就绪或已在其他页面变化，请刷新；不会覆盖旧进度');
  }
  function ensureCurrentRecord() {
    if (userId && localStorage.getItem(key()) !== JSON.stringify(record)) {
      stale = true;
      show('另一页面修改了本机存档，请刷新后继续，当前写入已暂停');
    }
    assertWritable();
  }
  const storage = {
    getItem(name) {
      if (!initialized || blocked) throw new Error('本机存档未就绪或损坏；原数据保留，可切换游客');
      if (!userId || ![SAVE, CAMPAIGN, CLEARED, BACKUP].includes(name)) return localStorage.getItem(name);
      const value = name === SAVE ? record.payload.saveStore : name === CAMPAIGN ? record.payload.campaignTransfer : name === CLEARED ? record.payload.clearedLevels : record.backup;
      return value === null || value === undefined ? null : JSON.stringify(value);
    },
    setItem(name, text) {
      if (!userId || ![SAVE, CAMPAIGN, CLEARED, BACKUP].includes(name)) { assertWritable(); localStorage.setItem(name, text); return; }
      ensureCurrentRecord();
      const next = structuredClone(record), value = JSON.parse(text);
      if (name === BACKUP) next.backup = value;
      else {
        if (name === SAVE) next.payload.saveStore = value;
        else if (name === CAMPAIGN) next.payload.campaignTransfer = value;
        else next.payload.clearedLevels = value;
        validate(next.payload);
        next.dirty = true;
      }
      persist(next);
      generation++;
      retryable = true;
      if (name !== BACKUP) schedule();
    },
    removeItem(name) {
      if (!userId || ![SAVE, CAMPAIGN, CLEARED, BACKUP].includes(name)) { assertWritable(); localStorage.removeItem(name); return; }
      this.setItem(name, name === SAVE ? JSON.stringify(emptyPayload().saveStore) : name === CLEARED ? '[]' : 'null');
    }
  };
  window.ZhaolieStorage = storage;

  async function api(path, options = {}) {
    const headers = { 'x-save-owner': userId || '', ...options.headers };
    const response = await fetch(path, { ...options, headers, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('当前环境未接入云存档，可保留本机进度');
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || '云存档请求失败');
      error.status = response.status;
      if (response.status === 401 || (response.status === 409 && !('payload' in data))) {
        if (session) session.user = null;
        window.dispatchEvent(new Event('zhaolie-session-expired'));
      }
      if (data.userId === userId && 'payload' in data) error.remote = data;
      throw error;
    }
    if (path.startsWith('/api/saves') && data.userId !== userId) throw new Error('账号发生变化，请刷新');
    return data;
  }
  function describe(payload, detailed = true) {
    const saves = [payload?.saveStore?.auto, ...(payload?.saveStore?.manual || [])].filter(Boolean).sort((a, b) => b.savedAt - a.savedAt);
    const save = saves[0];
    if (!save) return payload?.campaignTransfer ? '有跨关继承进度，无可读取档位' : '暂无存档';
    const label = `${save.levelName || save.levelId} · ${save.phaseType === 'story' ? `剧情第${save.storyIndex + 1}句` : save.phaseType === 'prep' ? '战前整备' : save.phaseType === 'postbattle' ? '战后结算' : `第${save.turn}回合`}`;
    return detailed ? `${label} · ${save.levelSelectBalanced ? '选关试玩' : '主线'} · ${new Date(save.savedAt).toLocaleString()}` : label;
  }
  function showConflict(remote) {
    if (remote.payload) validate(remote.payload);
    conflict = remote;
    show(remote.history ? '请选择是否恢复这份旧存档' : '进度冲突：请选择要保留的一份');
    document.getElementById('cloudLocalProgress').textContent = describe(record.payload);
    document.getElementById('cloudRemoteProgress').textContent = describe(remote.payload);
    document.getElementById('cloudRemoteLabel').textContent = remote.history ? '你选择的旧存档' : '云端的进度';
    remoteButton.textContent = remote.history ? '确认恢复这份存档' : '使用云端进度';
    localButton.textContent = remote.history ? '不恢复，保留当前进度' : '保留这台设备的进度';
    notice.textContent = '选择会替换所有存档和跨关进度，原进度会先备份。';
    remoteButton.hidden = localButton.hidden = false;
  }
  function adopt(remote) {
    ensureCurrentRecord();
    const next = { payload: validate(remote.payload || emptyPayload()), revision: remote.revision, dirty: !!remote.history,
      backup: { kind: 'sanguozhi-zhaolie-portable-save', savedAt: Date.now(), payload: record.payload } };
    persist(next);
    conflict = null;
    remoteButton.hidden = localButton.hidden = true;
    generation++;
    changed();
    show(`已读取云端版本 ${remote.revision} · ${describe(next.payload)}`);
  }
  async function synchronize() {
    clearTimeout(timer);
    timer = null;
    if (!userId || stale || blocked || conflict || inFlight) return;
    ensureCurrentRecord();
    inFlight = true;
    const sentGeneration = generation;
    try {
      if (!session?.user) {
        const currentSession = await api('/api/auth/session');
        if (currentSession.user?.id !== userId) {
          if (currentSession.user) stale = true;
          throw new Error('登录失效或账号已切换，请重新登录；原账号本机进度保留');
        }
        session = currentSession;
      }
      if (!record.dirty) {
        const remote = await api('/api/saves');
        if (remote.revision !== record.revision) showConflict(remote);
        else show(`已同步 · ${describe(record.payload)}`);
        return;
      }
      show('本机已保存 · 正在同步云端');
      if (!record.pending) persist({ ...record, pending: {
        requestId: crypto.randomUUID(), baseRevision: record.revision, payload: structuredClone(record.payload)
      } });
      const sent = record.pending;
      const result = await api('/api/saves', { method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sent) });
      if (result.userId !== userId) throw new Error('账号发生变化，请刷新');
      ensureCurrentRecord();
      persist({ ...record, pending: null, revision: result.revision,
        dirty: generation !== sentGeneration || JSON.stringify(record.payload) !== JSON.stringify(sent.payload) });
      show(record.dirty ? '有新的本机进度待同步' : `已同步 · ${describe(record.payload)}`);
    } catch (error) {
      retryable = !error.status || error.status >= 500;
      if (error.remote && !stale) {
        try { showConflict(error.remote); }
        catch (invalid) { blocked = true; show(`云端存档损坏，原本机进度保留：${invalid.message}`); }
      }
      else show(`本机进度保留，未同步：${error.message}`);
    } finally {
      inFlight = false;
      show(info.textContent);
      if (record?.dirty && retryable && !conflict && !stale && !blocked) timer = setTimeout(() => synchronize(), 60000);
    }
  }
  function schedule() {
    show(userId ? '本机已保存 · 待云端同步' : '游客存档仅保存在本机');
    if (conflict) { showConflict(conflict); return; }
    if (userId && !timer && !inFlight) timer = setTimeout(() => synchronize(), 60000);
    changed();
  }
  async function initialize() {
    ({ validatePayload: validateFormat } = await import('./save-format.mjs?build=20261023-level-select-progress-v256'));
    try {
      session = await api('/api/auth/session');
      userId = session.user?.id || null;
      if (userId) localStorage.setItem(HINT, userId); else localStorage.removeItem(HINT);
    } catch (error) {
      show(error.message);
      userId = localStorage.getItem(HINT);
      if (userId) show('登录服务离线 · 使用上次账号的本机进度，云同步暂停；可切换游客');
    }
    if (sessionStorage.getItem('zhaolie-force-guest') === '1') userId = null;
    if (userId) {
      try {
        await lockAccount();
        const raw = localStorage.getItem(key());
        record = raw ? JSON.parse(raw) : { payload: emptyPayload(), revision: 0, dirty: false };
        validate(record.payload);
        if (!Number.isSafeInteger(record.revision) || record.revision < 0) throw new Error('本机版本记录损坏');
        if (record.pending) {
          validate(record.pending.payload);
          if (!Number.isSafeInteger(record.pending.baseRevision) || typeof record.pending.requestId !== 'string') throw new Error('待同步记录损坏');
        }
        if (!raw && !stale) persist(record);
      } catch (error) { blocked = true; show(error.message); }
    }
    initialized = true;
    guestButton.hidden = !userId;
    if (!userId) { show('游客模式 · 存档仅保存在当前浏览器'); return session; }
    if (blocked || !session?.user) return session;
    try {
      const remote = await api('/api/saves');
      ensureCurrentRecord();
      if (record.pending) await synchronize();
      else if ((record.dirty || (!remote.payload && hasData(record.payload))) && remote.revision !== record.revision) showConflict(remote);
      else if (!record.dirty && remote.revision !== record.revision) adopt(remote);
      else if (record.dirty) await synchronize();
      else show(`已同步 · ${describe(record.payload)}`);
    } catch (error) { show(`本机进度保留，云端读取失败：${error.message}`); }
    return session;
  }
  async function reloadAfter(action) {
    try { await action(); location.reload(); }
    catch (error) { notice.textContent = error.message; }
  }
  remoteButton.addEventListener('click', () => {
    if (inFlight || !conflict || stale || blocked) return;
    return reloadAfter(async () => {
      const remote = await api('/api/saves');
      if (remote.revision !== conflict.revision) { showConflict(remote); throw new Error('云端又有新版本，请重新确认'); }
      if (conflict.history) { adopt(conflict); await synchronize(); }
      else adopt(remote);
    });
  });
  localButton.addEventListener('click', async () => {
    if (inFlight || !conflict || stale || blocked) return;
    if (conflict.history) {
      conflict = null;
      remoteButton.hidden = localButton.hidden = true;
      show('已取消恢复，当前进度未改变');
      notice.textContent = '游戏先保存在本机，再自动同步。换设备前请确认已保存到云端。';
      return;
    }
    try {
      ensureCurrentRecord();
      persist({ ...record, revision: conflict.revision, pending: null, dirty: true,
        backup: { kind: 'sanguozhi-zhaolie-portable-save', savedAt: Date.now(), payload: conflict.payload || emptyPayload() } });
      conflict = null;
      remoteButton.hidden = localButton.hidden = true;
      await synchronize();
      notice.textContent = conflict ? notice.textContent : info.textContent;
    } catch (error) { notice.textContent = error.message; }
  });
  document.getElementById('cloudManageBtn').addEventListener('click', event => {
    event.stopPropagation();
    moreOptions.open = blocked;
    if (!conflict) notice.textContent = userId
      ? '游戏先保存在本机，再自动同步。换设备前请确认已保存到云端。'
      : '游客进度只保存在这台设备。登录后才能使用云存档。';
    dialog.showModal();
  });
  document.getElementById('cloudCloseBtn').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('click', event => event.stopPropagation());
  syncButton.addEventListener('click', () => synchronize().catch(error => { notice.textContent = error.message; }));
  guestButton.addEventListener('click', () => {
    try { sessionStorage.setItem('zhaolie-force-guest', '1'); location.assign(location.pathname); }
    catch (error) { notice.textContent = error.message; }
  });
  guestImport.addEventListener('click', () => {
    return reloadAfter(async () => {
      ensureCurrentRecord();
      if (!session?.user || hasData(record.payload) || conflict || record.pending) throw new Error('请先确认账号在线且为空；有账号进度时需用导出/导入功能，不自动覆盖');
      const remote = await api('/api/saves');
      if (hasData(remote.payload) || remote.revision !== record.revision) { showConflict(remote); throw new Error('云端版本发生变化，请先确认'); }
      const payload = validate({ saveStore: JSON.parse(localStorage.getItem(SAVE) || JSON.stringify(emptyPayload().saveStore)),
        campaignTransfer: JSON.parse(localStorage.getItem(CAMPAIGN) || 'null'),
        clearedLevels: JSON.parse(localStorage.getItem(CLEARED) || '[]') });
      if (!hasData(payload)) throw new Error('没有游客进度可以迁入');
      ensureCurrentRecord();
      persist({ ...record, payload, dirty: true, pending: null });
      generation++;
      await synchronize();
      if (conflict) throw new Error('云端已有进度，迁入尚未同步，请先解决冲突');
    });
  });
  document.getElementById('cloudHistoryBtn').addEventListener('click', async () => {
    historyList.replaceChildren();
    if (!userId) { notice.textContent = '游客没有云端历史版本'; return; }
    try {
      const data = await api('/api/saves/history');
      if (!data.entries.length) { notice.textContent = '暂无云端历史版本'; return; }
      for (const entry of data.entries) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `恢复版本 ${entry.revision}：${describe(entry.payload)}`;
        button.addEventListener('click', async () => {
          if (inFlight || stale || blocked) return;
          try {
            ensureCurrentRecord();
            const remote = await api('/api/saves');
            showConflict({ ...remote, payload: validate(entry.payload), history: true });
            notice.textContent = '确认后将恢复这份旧存档，替换所有当前档位和跨关进度；当前进度会先备份。';
          } catch (error) { notice.textContent = error.message; }
        });
        historyList.appendChild(button);
      }
    } catch (error) { notice.textContent = error.message; }
  });
  window.addEventListener('online', () => { if (initialized) synchronize().catch(error => show(error.message)); });
  window.addEventListener('storage', event => {
    if (userId && event.key === key()) { stale = true; clearTimeout(timer); show('另一页面修改了账号进度，请刷新；写入和同步已暂停'); }
  });
  document.getElementById('cloudExportBackupBtn').addEventListener('click', () => {
    try {
      const raw = userId ? localStorage.getItem(key()) : null;
      if (!raw) throw new Error('没有账号本机记录可以备份');
      const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'zhaolie-account-recovery.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      notice.textContent = '已导出账号原始恢复记录（含本机档、待同步记录和冲突备份）；此文件需人工恢复，不是普通导入文件';
    } catch (error) { notice.textContent = error.message; }
  });
  function replacePayload(payload, { createBackup = true } = {}) {
    ensureCurrentRecord();
    const next = { ...record, payload: validate(payload), dirty: true };
    if (createBackup) next.backup = { kind: 'sanguozhi-zhaolie-portable-save', savedAt: Date.now(), payload: record.payload };
    persist(next);
    generation++;
    retryable = true;
    schedule();
  }
  const ready = initialize().catch(error => {
    initialized = true;
    blocked = true;
    console.error('Save initialization failed', error);
    show(`存档初始化失败，原数据未改动：${error.message}。请刷新或切换游客`);
    guestButton.hidden = false;
    moreOptions.open = true;
    return null;
  });
  window.ZhaolieCloud = { ready, flush: () => synchronize(), replacePayload,
    account: () => userId, summary: () => record ? describe(record.payload) : '游客本机存档' };
})();
