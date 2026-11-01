(() => {
  const api = location.pathname.includes('/sanguo/') ? '/api' : '/api';
  const visitorKey = 'zhaolie-about-visitor-v1';
  let visitorId = localStorage.getItem(visitorKey);
  if (!/^[0-9a-f-]{36}$/i.test(visitorId || '')) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(visitorKey, visitorId);
  }
  function track(kind) {
    fetch(`${api}/analytics/about`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitorId, eventId: crypto.randomUUID(), kind }), keepalive: true }).catch(() => {});
  }
  track('view');
  document.querySelectorAll('.play-link').forEach(link => link.addEventListener('click', () => track('play')));

  const range = document.getElementById('comparisonRange');
  const before = document.getElementById('comparisonBefore');
  const line = document.querySelector('.comparison-line');
  range?.addEventListener('input', () => {
    before.style.width = `${range.value}%`;
    line.style.left = `${range.value}%`;
  });

  const dialog = document.getElementById('lightbox');
  const dialogImage = dialog?.querySelector('img');
  const mapCards = [...document.querySelectorAll('[data-map-index]')];
  const mapNavigation = dialog?.querySelector('.lightbox-navigation');
  let currentMap = -1;
  function showImage(button) {
    currentMap = mapCards.indexOf(button);
    dialogImage.src = button.dataset.lightbox;
    dialogImage.alt = button.querySelector('img')?.alt || '游戏截图大图';
    if (mapNavigation) mapNavigation.hidden = currentMap < 0;
    if (currentMap >= 0) document.getElementById('mapCaption').textContent =
      button.querySelector('strong').textContent + ' · ' + (currentMap + 1) + ' / ' + mapCards.length;
  }
  document.querySelectorAll('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    showImage(button);
    dialog.showModal();
  }));
  function moveMap(offset) {
    if (currentMap >= 0 && mapCards.length) showImage(mapCards[(currentMap + offset + mapCards.length) % mapCards.length]);
  }
  document.getElementById('mapPrevious')?.addEventListener('click', () => moveMap(-1));
  document.getElementById('mapNext')?.addEventListener('click', () => moveMap(1));
  dialog?.addEventListener('keydown', event => {
    if (currentMap < 0) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveMap(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  dialog?.querySelector('.lightbox-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  document.getElementById('loadVideo')?.addEventListener('click', () => {
    const shell = document.getElementById('videoShell');
    const video = document.createElement('video');
    video.src = '../assets/video/title-intro.mp4';
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    shell.replaceChildren(video);
    video.play().catch(() => {});
  }, { once: true });

  const feed = document.getElementById('commentFeed');
  const statusNames = { received: '已收到', fixing: '修复中', fixed: '已修复' };
  const kindNames = { comment: '玩家留言', suggestion: '玩法建议', bug: '问题反馈' };
  const levelNames = { 'sishui-pass': '汜水关', 'hulao-pass': '虎牢关', guangchuan: '广川', xindu: '信都', julu: '巨鹿', qinghe: '清河', jieqiao: '界桥', beihai: '北海', xuzhou: '徐州', xiaopei: '小沛', taishan: '泰山', huainan: '淮南', other: '其他' };
  function commentNode(item) {
    const article = document.createElement('article');
    article.className = 'comment-card';
    const head = document.createElement('div');
    const name = document.createElement('b'); name.textContent = item.name;
    const tag = document.createElement('span'); tag.className = `status ${item.status}`; tag.textContent = statusNames[item.status] || '已收到';
    head.append(name, tag);
    if (item.pinned) { const pin = document.createElement('span'); pin.className = 'status pinned'; pin.textContent = '置顶'; head.append(pin); }
    const meta = document.createElement('span'); meta.className = 'meta'; meta.textContent = `${kindNames[item.kind] || '留言'}${item.levelId ? ` · ${levelNames[item.levelId] || item.levelId}` : ''}`;
    const body = document.createElement('p'); body.textContent = item.body;
    article.append(head, meta, body);
    if (item.reply) { const reply = document.createElement('blockquote'); reply.textContent = `作者回复：${item.reply}`; article.append(reply); }
    return article;
  }
  async function loadComments() {
    try {
      const response = await fetch(`${api}/comments`, { headers: { accept: 'application/json' } });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data.comments) || !data.comments.length) return;
      feed.replaceChildren(...data.comments.map(commentNode));
    } catch { /* keep the explanatory fallback */ }
  }
  loadComments();

  const form = document.getElementById('commentForm');
  const formStatus = document.getElementById('formStatus');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true; formStatus.textContent = '正在提交…';
    const data = { ...Object.fromEntries(new FormData(form)), kind: 'comment' };
    try {
      const response = await fetch(`${api}/comments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '提交失败');
      formStatus.textContent = result.message;
      form.reset();
    } catch (error) { formStatus.textContent = error.message || '留言暂时没有送达，请稍后再试'; }
    finally { submit.disabled = false; }
  });
})();
