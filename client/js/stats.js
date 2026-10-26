// 预算汇总模块：调用 /api/stats/budget，渲染顶部生日提醒横幅 + 汇总卡片 + 分人明细表
const $ = (id) => document.getElementById(id);

export async function renderStats(ctx) {
  const stats = await ctx.api.getBudget();
  renderBanner(ctx, stats.upcoming);
  renderSummary(ctx, stats);
  renderTable(ctx, stats);
  return stats;
}

function renderBanner(ctx, upcoming) {
  const banner = $('reminder-banner');
  if (!upcoming.length) {
    banner.classList.add('hidden');
    banner.innerHTML = '';
    return;
  }
  banner.classList.remove('hidden');
  banner.innerHTML = upcoming
    .map(
      (u) => `
      <span class="reminder-item">⏰ <strong>${ctx.escapeHtml(u.name)}</strong>（${ctx.escapeHtml(u.relation)}）的生日还有
        <em>${u.daysUntil}</em> 天（${u.nextDate.slice(5).replace('-', ' 月 ')} 日）</span>`
    )
    .join('');
}

function renderSummary(ctx, stats) {
  const c = stats.counts;
  $('stats-summary').innerHTML = `
    <div class="stat-card">
      <span class="label">年度总预算</span>
      <strong>${ctx.formatMoney(stats.totalBudget)}</strong>
      <span class="muted small">${c.recipients} 位收礼人</span>
    </div>
    <div class="stat-card">
      <span class="label">灵感已买花费</span>
      <strong class="green">${ctx.formatMoney(stats.spent)}</strong>
      <span class="muted small">已买 ${c.bought} 件</span>
    </div>
    <div class="stat-card">
      <span class="label">待买计划金额</span>
      <strong class="amber">${ctx.formatMoney(stats.planned)}</strong>
      <span class="muted small">待买 ${c.toBuy} 件</span>
    </div>
    <div class="stat-card">
      <span class="label">预算剩余</span>
      <strong class="${stats.remaining < 0 ? 'red' : ''}">${ctx.formatMoney(stats.remaining)}</strong>
      <span class="muted small">历史送礼累计 ${ctx.formatMoney(stats.historyTotal)}（${c.records} 笔）</span>
    </div>`;
}

function renderTable(ctx, stats) {
  const rows = stats.perRecipient
    .map((r) => {
      const pct = r.budget > 0 ? Math.min(100, Math.round((r.spent / r.budget) * 100)) : null;
      return `
      <tr>
        <td><strong>${ctx.escapeHtml(r.name)}</strong>
          <span class="muted small">（${ctx.escapeHtml(r.relation)}）</span></td>
        <td class="num">${ctx.formatMoney(r.budget)}</td>
        <td class="num">${ctx.formatMoney(r.spent)}</td>
        <td class="num">${ctx.formatMoney(r.planned)}</td>
        <td class="num ${r.remaining < 0 ? 'red' : ''}">${ctx.formatMoney(r.remaining)}</td>
        <td class="progress-cell">
          ${pct === null
            ? '<span class="muted small">未设预算</span>'
            : `<div class="progress"><span style="width:${pct}%"></span></div> <span class="muted mini">${pct}%</span>`}
        </td>
      </tr>`;
    })
    .join('');

  $('stats-table').innerHTML = `
    <h2>每位收礼人的预算使用</h2>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>收礼人</th><th class="num">年度预算</th><th class="num">灵感已花</th>
            <th class="num">待买计划</th><th class="num">剩余</th><th>预算使用</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" class="empty">暂无数据</td></tr>'}</tbody>
      </table>
    </div>`;
}
