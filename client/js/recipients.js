// 收礼人模块：卡片列表 + 新增 / 编辑 / 删除（删除时后端会级联清理其灵感与记录）
const $ = (id) => document.getElementById(id);

export function initRecipients(ctx) {
  const form = $('recipient-form');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      name: $('recipient-name').value.trim(),
      relation: $('recipient-relation').value.trim(),
      birthday: $('recipient-birthday').value,
      budget: Number($('recipient-budget').value) || 0,
      likes: $('recipient-likes').value.trim(),
      notes: $('recipient-notes').value.trim(),
    };
    try {
      if (ctx.state.editing.recipientId) {
        await ctx.api.updateRecipient(ctx.state.editing.recipientId, payload);
        ctx.toast('收礼人资料已更新 ✏️');
      } else {
        await ctx.api.createRecipient(payload);
        ctx.toast('收礼人已添加 🙌');
      }
      form.reset();
      setEditing(ctx, null);
      await ctx.refreshAll();
    } catch (error) {
      ctx.toast(error.message, 'error');
    }
  });

  // 「取消编辑」按钮就是 type=reset，同时把表单恢复成新增模式
  form.addEventListener('reset', () => setEditing(ctx, null));

  $('recipient-list').addEventListener('click', async (event) => {
    const editBtn = event.target.closest('[data-edit]');
    const delBtn = event.target.closest('[data-del]');
    if (editBtn) {
      const recipient = ctx.state.recipients.find((r) => r.id === Number(editBtn.dataset.edit));
      if (recipient) fillForm(ctx, recipient);
    }
    if (delBtn) {
      const id = Number(delBtn.dataset.del);
      const recipient = ctx.state.recipients.find((r) => r.id === id);
      if (!recipient) return;
      if (!window.confirm(`确定删除收礼人「${recipient.name}」吗？其礼物灵感与送礼记录会一并删除。`)) return;
      try {
        await ctx.api.deleteRecipient(id);
        ctx.toast('收礼人已删除 🗑️');
        await ctx.refreshAll();
      } catch (error) {
        ctx.toast(error.message, 'error');
      }
    }
  });
}

function fillForm(ctx, recipient) {
  setEditing(ctx, recipient.id);
  $('recipient-name').value = recipient.name;
  $('recipient-relation').value = recipient.relation || '';
  $('recipient-birthday').value = recipient.birthday || '';
  $('recipient-budget').value = recipient.budget ?? '';
  $('recipient-likes').value = recipient.likes || '';
  $('recipient-notes').value = recipient.notes || '';
  $('recipient-name').focus();
}

function setEditing(ctx, id) {
  ctx.state.editing.recipientId = id;
  const editing = Boolean(id);
  $('recipient-form-title').textContent = editing ? '编辑收礼人' : '新增收礼人';
  $('recipient-submit').textContent = editing ? '保存修改' : '保存收礼人';
  $('recipient-cancel').classList.toggle('hidden', !editing);
}

export function renderRecipients(ctx) {
  const { recipients, gifts } = ctx.state;
  const list = $('recipient-list');

  if (!recipients.length) {
    list.innerHTML = '<div class="empty">还没有收礼人，先用左侧表单添加一位吧 🎈</div>';
    return;
  }

  list.innerHTML = recipients
    .map((r) => {
      const mine = gifts.filter((g) => g.recipientId === r.id);
      const toBuy = mine.filter((g) => g.status === 'to-buy').length;
      const spent = mine
        .filter((g) => g.status === 'bought')
        .reduce((sum, g) => sum + (Number(g.price) || 0), 0);
      return `
        <article class="card item-card">
          <header class="card-head">
            <h3>${ctx.escapeHtml(r.name)}</h3>
            <span class="badge relation">${ctx.escapeHtml(r.relation || '朋友')}</span>
          </header>
          <dl class="meta">
            <div><dt>🎂 生日</dt><dd>${ctx.escapeHtml(r.birthday) || '未填写'}</dd></div>
            <div><dt>💰 年度预算</dt><dd>${ctx.formatMoney(r.budget)}</dd></div>
            <div class="full"><dt>❤️ 喜好</dt><dd>${ctx.escapeHtml(r.likes) || '—'}</dd></div>
            ${r.notes ? `<div class="full"><dt>📝 备注</dt><dd>${ctx.escapeHtml(r.notes)}</dd></div>` : ''}
          </dl>
          <footer class="card-foot">
            <span class="muted small">灵感 ${mine.length} · 待买 ${toBuy} · 灵感已花 ${ctx.formatMoney(spent)}</span>
            <span class="actions">
              <button class="btn tiny" data-edit="${r.id}">编辑</button>
              <button class="btn tiny danger" data-del="${r.id}">删除</button>
            </span>
          </footer>
        </article>`;
    })
    .join('');
}
