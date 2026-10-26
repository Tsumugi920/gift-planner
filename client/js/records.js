// 送礼记录模块：按日期倒序的流水表 + 新增 / 编辑 / 删除
const $ = (id) => document.getElementById(id);

export function initRecords(ctx) {
  $('record-date').value = new Date().toISOString().slice(0, 10);

  const form = $('record-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      recipientId: Number($('record-recipient').value) || 0,
      giftName: $('record-gift-name').value.trim(),
      occasion: $('record-occasion').value.trim(),
      date: $('record-date').value,
      amount: Number($('record-amount').value) || 0,
      notes: $('record-notes').value.trim(),
    };
    if (!payload.recipientId) {
      ctx.toast('请选择收礼人', 'error');
      return;
    }
    try {
      if (ctx.state.editing.recordId) {
        await ctx.api.updateRecord(ctx.state.editing.recordId, payload);
        ctx.toast('送礼记录已更新 ✏️');
      } else {
        await ctx.api.createRecord(payload);
        ctx.toast('送礼记录已保存 📜');
      }
      form.reset();
      $('record-date').value = new Date().toISOString().slice(0, 10);
      setEditing(ctx, null);
      await ctx.refreshAll();
    } catch (error) {
      ctx.toast(error.message, 'error');
    }
  });

  form.addEventListener('reset', () => setEditing(ctx, null));

  $('record-tbody').addEventListener('click', async (event) => {
    const editBtn = event.target.closest('[data-edit]');
    const delBtn = event.target.closest('[data-del]');
    const find = (id) => ctx.state.records.find((r) => r.id === Number(id));
    if (editBtn) {
      const record = find(editBtn.dataset.edit);
      if (record) fillForm(ctx, record);
    }
    if (delBtn) {
      const record = find(delBtn.dataset.del);
      if (!record) return;
      if (!window.confirm(`确定删除「${record.giftName}」这条送礼记录吗？`)) return;
      try {
        await ctx.api.deleteRecord(record.id);
        ctx.toast('送礼记录已删除 🗑️');
        await ctx.refreshAll();
      } catch (error) {
        ctx.toast(error.message, 'error');
      }
    }
  });
}

function fillForm(ctx, record) {
  setEditing(ctx, record.id);
  $('record-recipient').value = String(record.recipientId);
  $('record-gift-name').value = record.giftName;
  $('record-occasion').value = record.occasion || '';
  $('record-date').value = record.date || '';
  $('record-amount').value = record.amount ?? '';
  $('record-notes').value = record.notes || '';
  $('record-gift-name').focus();
}

function setEditing(ctx, id) {
  ctx.state.editing.recordId = id;
  const editing = Boolean(id);
  $('record-form-title').textContent = editing ? '编辑送礼记录' : '记一笔送礼';
  $('record-submit').textContent = editing ? '保存修改' : '保存记录';
  $('record-cancel').classList.toggle('hidden', !editing);
}

export function renderRecords(ctx) {
  ctx.fillRecipientSelect($('record-recipient'), ctx.state.recipients, '选择收礼人', false);

  const tbody = $('record-tbody');
  if (!ctx.state.records.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">还没有送礼记录，在左边记一笔吧 ✍️</td></tr>';
    return;
  }

  const nameOf = (id) =>
    (ctx.state.recipients.find((r) => r.id === id) || {}).name || '未知收礼人';

  tbody.innerHTML = ctx.state.records
    .map(
      (rec) => `
      <tr>
        <td>${ctx.formatDate(rec.date)}</td>
        <td>${ctx.escapeHtml(nameOf(rec.recipientId))}</td>
        <td>${ctx.escapeHtml(rec.giftName)}</td>
        <td>${ctx.escapeHtml(rec.occasion || '—')}</td>
        <td class="num">${ctx.formatMoney(rec.amount)}</td>
        <td class="muted small">${ctx.escapeHtml(rec.notes || '—')}</td>
        <td>
          <span class="actions">
            <button class="btn tiny" data-edit="${rec.id}">编辑</button>
            <button class="btn tiny danger" data-del="${rec.id}">删除</button>
          </span>
        </td>
      </tr>`
    )
    .join('');
}
