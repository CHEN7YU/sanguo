(() => {
  const form = document.getElementById('adminLogin'), input = document.getElementById('adminToken');
  const list = document.getElementById('adminList'), status = document.getElementById('adminStatus');
  input.value = sessionStorage.getItem('zhaolie-comments-admin') || '';
  function make(item) {
    const node = document.createElement('article'); node.className = 'admin-item';
    const title = document.createElement('b'); title.textContent = `${item.name} · ${item.kind} · ${new Date(item.createdAt).toLocaleString()}`;
    const body = document.createElement('p'); body.textContent = item.body;
    const reply = document.createElement('textarea'); reply.value = item.reply || ''; reply.placeholder = '作者回复';
    const moderation = document.createElement('select');
    moderation.innerHTML = '<option value="pending">待审核</option><option value="approved">公开</option><option value="hidden">隐藏</option>'; moderation.value = item.moderation;
    const progress = document.createElement('select');
    progress.innerHTML = '<option value="received">已收到</option><option value="fixing">修复中</option><option value="fixed">已修复</option>'; progress.value = item.status;
    const pinned = document.createElement('label'); pinned.innerHTML = '<input type="checkbox"> 置顶'; pinned.querySelector('input').checked = !!item.pinned;
    const save = document.createElement('button'); save.className = 'button primary'; save.textContent = '保存';
    const actions = document.createElement('div'); actions.className = 'admin-actions'; actions.append(moderation, progress, pinned, save);
    save.addEventListener('click', async () => {
      save.disabled = true;
      try {
        const response = await fetch('/api/comments/admin', { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-comments-admin': input.value }, body: JSON.stringify({ id: item.id, moderation: moderation.value, status: progress.value, pinned: pinned.querySelector('input').checked, reply: reply.value }) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error); save.textContent = '已保存';
      } catch (error) { save.textContent = error.message || '失败'; }
      finally { save.disabled = false; setTimeout(() => { save.textContent = '保存'; }, 1800); }
    });
    node.append(title, body, reply, actions); return node;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); status.textContent = '读取中…'; sessionStorage.setItem('zhaolie-comments-admin', input.value);
    try { const response = await fetch('/api/comments/admin', { headers: { 'x-comments-admin': input.value } }); const data = await response.json(); if (!response.ok) throw new Error(data.error); list.replaceChildren(...data.comments.map(make)); status.textContent = `共 ${data.comments.length} 条`; }
    catch (error) { status.textContent = error.message || '读取失败'; }
  });
})();
