// 礼物灵感模块：待买 / 已买卡片 + 状态筛选 + 新增 / 编辑 / 删除 / 一键标记已买
const $ = (id) => document.getElementById(id);

const STATUS_TEXT = { 'to-buy': '待买', bought: '已买' };

export function initGifts(ctx) {
  const form = $('gift-form');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      recipientId: Number($('gift-recipient').value) || 0,
      name: $('gift-name').value.trim(),
      category: $('gift-category').value.trim(),
      price: Number($('gift-price').value) || 0,
      occasion: $('gift-occasion').value.trim(),
      notes: $('gift-notes').value.trim(),
      status: 'to-buy',
    };
    if (!payload.recipientId) {
      ctx.toast('请选择收礼人', 'error');
      return;
    }
    try {
      if (ctx.state.editing.giftId) {
        const original = ctx.state.gifts.find((g) => g.id === ctx.state.editing.giftId);
        await ctx.api.updateGift(original.id, { ...payload, status: original.status });
        ctx.toast('礼物灵感已更新 ✏️');
      } else {
        await ctx.api.createGift(payload);
        ctx.toast('灵感已加入待买清单 🎁');
      }
      form.reset();
      setEditing(ctx, null);
      await ctx.refreshAll();
    } catch (error) {
      ctx.toast(error.message, 'error');
    }
  });

  form.addEventListener('reset', () => setEditing(ctx, null));

  // 待买 / 已买筛选
  $('gift-status-filter').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-status]');
    if (!btn) return;
    ctx.state.giftFilter.status = btn.dataset.status;
    document
      .querySelectorAll('#gift-status-filter .seg-btn')
      .forEach((b) => b.classList.toggle('active', b === btn));
    renderGifts(ctx);
  });

  $('gift-recipient-filter').addEventListener('change', (event) => {
    ctx.state.giftFilter.recipientId = event.target.value;
    renderGifts(ctx);
  });

  $('gift-search').addEventListener('input', (event) => {
    ctx.state.giftFilter.q = event.target.value.trim().toLowerCase();
    renderGifts(ctx);
  });

  // 列表操作：标记已买 / 恢复待买 / 编辑 / 删除
  $('gift-list').addEventListener('click', async (event) => {
    const toggleBtn = event.target.closest('[data-toggle]');
    const editBtn = event.target.closest('[data-edit]');
    const delBtn = event.target.closest('[data-del]');
    const find = (id) => ctx.state.gifts.find((g) => g.id === Number(id));
    try {
      if (toggleBtn) {
        const gift = find(toggleBtn.dataset.toggle);
        const next = gift.status === 'bought' ? 'to-buy' : 'bought';
        await ctx.api.updateGift(gift.id, { ...gift, status: next });
        ctx.toast(next === 'bought' ? `「${gift.name}」已标记为已买 🎉` : `「${gift.name}」已恢复待买`);
        await ctx.refreshAll();
      } else if (editBtn) {
        const gift = find(editBtn.dataset.edit);
        if (gift) fillForm(ctx, gift);
      } else if (delBtn) {
        const gift = find(delBtn.dataset.del);
        if (!gift) return;
        if (!window.confirm(`确定删除礼物「${gift.name}」吗？`)) return;
        await ctx.api.deleteGift(gift.id);
        ctx.toast('礼物灵感已删除 🗑️');
        await ctx.refreshAll();
      }
    } catch (error) {
      ctx.toast(error.message, 'error');
    }
  });
}

function fillForm(ctx, gift) {
  setEditing(ctx, gift.id);
  $('gift-recipient').value = String(gift.recipientId);
  $('gift-name').value = gift.name;
  $('gift-category').value = gift.category || '';
  $('gift-price').value = gift.price ?? '';
  $('gift-occasion').value = gift.occasion || '';
  $('gift-notes').value = gift.notes || '';
  $('gift-name').focus();
}

function setEditing(ctx, id) {
  ctx.state.editing.giftId = id;
  const editing = Boolean(id);
  $('gift-form-title').textContent = editing ? '编辑礼物灵感' : '添加礼物灵感';
  $('gift-submit').textContent = editing ? '保存修改' : '保存灵感';
  $('gift-cancel').classList.toggle('hidden', !editing);
}

export function renderGifts(ctx) {
  const { gifts, recipients } = ctx.state;
  const nameOf = (id) => (recipients.find((r) => r.id === id) || {}).name || '未知收礼人';

  // 表单与筛选下拉框都来自收礼人列表
  ctx.fillRecipientSelect($('gift-recipient'), recipients, '选择收礼人', false);
  ctx.fillRecipientSelect($('gift-recipient-filter'), recipients, '全部收礼人', true);

  const { status, recipientId, q } = ctx.state.giftFilter;
  const shown = gifts.filter(
    (g) =>
      (status === 'all' || g.status === status) &&
      (recipientId === 'all' || g.recipientId === Number(recipientId)) &&
      (!q || [g.name, g.category, g.occasion].some((v) => String(v || '').toLowerCase().includes(q)))
  );

  const toBuyCount = gifts.filter((g) => g.status === 'to-buy').length;
  const boughtCount = gifts.length - toBuyCount;
  const list = $('gift-list');

  if (!shown.length) {
    list.innerHTML = `<div class="empty">没有符合条件的灵感（共 ${gifts.length} 条：待买 ${toBuyCount} · 已买 ${boughtCount}）</div>`;
    return;
  }

  list.innerHTML = shown
    .map((g) => {
      const bought = g.status === 'bought';
      return `
        <article class="card item-card gift ${g.status}">
          <header class="card-head">
            <h3>${ctx.escapeHtml(g.name)}</h3>
            <span class="badge ${g.status}">${STATUS_TEXT[g.status]}</span>
          </header>
          <p class="muted small">🎀 送给 ${ctx.escapeHtml(nameOf(g.recipientId))} · ${ctx.escapeHtml(g.category || '其他')}${g.occasion ? ' · ' + ctx.escapeHtml(g.occasion) : ''}</p>
          <p class="price">${ctx.formatMoney(g.price)}</p>
          ${g.notes ? `<p class="muted small">📝 ${ctx.escapeHtml(g.notes)}</p>` : ''}
          <footer class="card-foot">
            <span class="muted small">${bought ? '已买于 ' + ctx.formatDate(g.boughtAt) : '加入于 ' + ctx.formatDate(g.createdAt)}</span>
            <span class="actions">
              <button class="btn tiny ${bought ? '' : 'success'}" data-toggle="${g.id}">${bought ? '恢复待买' : '标记已买'}</button>
              <button class="btn tiny" data-edit="${g.id}">编辑</button>
              <button class="btn tiny danger" data-del="${g.id}">删除</button>
            </span>
          </footer>
        </article>`;
    })
    .join('');
}
