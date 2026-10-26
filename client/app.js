// 应用入口：集中管理状态，装配各模块，负责页签切换与全局刷新
import { api } from './js/api.js';
import { initRecipients, renderRecipients } from './js/recipients.js';
import { initGifts, renderGifts } from './js/gifts.js';
import { initRecords, renderRecords } from './js/records.js';
import { renderStats } from './js/stats.js';

const state = {
  recipients: [],
  gifts: [],
  records: [],
  giftFilter: { status: 'all', recipientId: 'all', q: '' },
  editing: { recipientId: null, giftId: null, recordId: null },
};

const ctx = { state, api, toast, refreshAll, escapeHtml, formatMoney, formatDate, fillRecipientSelect };

let toastTimer = null;
function toast(message, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = 'toast';
  }, 2600);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

function formatMoney(value) {
  return '¥' + Number(value || 0).toLocaleString('zh-CN');
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '—';
}

// 用收礼人列表填充下拉框；withAll 为 true 时第一个选项是「全部」
function fillRecipientSelect(select, recipients, placeholder, withAll) {
  const prev = select.value;
  select.innerHTML = '';
  const head = document.createElement('option');
  head.value = withAll ? 'all' : '';
  head.textContent = recipients.length ? placeholder : '请先添加收礼人';
  select.appendChild(head);
  for (const r of recipients) {
    const option = document.createElement('option');
    option.value = String(r.id);
    option.textContent = `${r.name}（${r.relation || '朋友'}）`;
    select.appendChild(option);
  }
  const values = [...select.options].map((o) => o.value);
  select.value = values.includes(prev) ? prev : select.options[0].value;
}

// 拉取全部数据并重绘四个页面
async function refreshAll() {
  try {
    const [recipients, gifts, records] = await Promise.all([
      api.listRecipients(),
      api.listGifts(),
      api.listRecords(),
    ]);
    state.recipients = recipients;
    state.gifts = gifts;
    state.records = records;
    renderRecipients(ctx);
    renderGifts(ctx);
    renderRecords(ctx);
    await renderStats(ctx); // 同时刷新顶部生日提醒横幅
  } catch (error) {
    toast(error.message, 'error');
  }
}

function initTabs() {
  document.querySelectorAll('#tabs .tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tabs .tab').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.panel').forEach((p) =>
        p.classList.toggle('active', p.id === `panel-${btn.dataset.tab}`)
      );
    });
  });
}

async function boot() {
  initTabs();
  initRecipients(ctx);
  initGifts(ctx);
  initRecords(ctx);
  await refreshAll();
}

boot();
