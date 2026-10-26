// 统计汇总：预算总览 / 每位收礼人明细 / 近期生日提醒
const express = require('express');
const router = express.Router();
const db = require('../db');

const sumPrice = (list) => list.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
const sumAmount = (list) => list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

function upcomingBirthdays(recipients, withinDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return recipients
    .map((r) => {
      const [year, month, day] = String(r.birthday || '').split('-').map(Number);
      if (!year || !month || !day) return null;
      let next = new Date(today.getFullYear(), month - 1, day);
      if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
      const daysUntil = Math.round((next - today) / 86400000);
      return {
        recipientId: r.id,
        name: r.name,
        relation: r.relation,
        birthday: r.birthday,
        nextDate: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`,
        daysUntil,
        turningAge: next.getFullYear() - year,
      };
    })
    .filter(Boolean)
    .filter((item) => item.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

// GET /api/stats/budget —— 预算汇总（前端「预算汇总」页与顶部提醒横幅共用）
router.get('/budget', (req, res) => {
  const data = db.read();

  const perRecipient = data.recipients.map((r) => {
    const gifts = data.gifts.filter((g) => g.recipientId === r.id);
    const spent = sumPrice(gifts.filter((g) => g.status === 'bought'));
    const planned = sumPrice(gifts.filter((g) => g.status === 'to-buy'));
    const historyTotal = sumAmount(data.records.filter((rec) => rec.recipientId === r.id));
    return {
      id: r.id,
      name: r.name,
      relation: r.relation,
      budget: Number(r.budget) || 0,
      spent,
      planned,
      remaining: (Number(r.budget) || 0) - spent,
      giftCount: gifts.length,
      historyTotal,
    };
  });

  const boughtGifts = data.gifts.filter((g) => g.status === 'bought');
  const toBuyGifts = data.gifts.filter((g) => g.status === 'to-buy');
  const totalBudget = data.recipients.reduce((sum, r) => sum + (Number(r.budget) || 0), 0);
  const spent = sumPrice(boughtGifts);
  const planned = sumPrice(toBuyGifts);

  res.json({
    totalBudget,
    spent,
    planned,
    remaining: totalBudget - spent,
    historyTotal: sumAmount(data.records),
    counts: {
      recipients: data.recipients.length,
      gifts: data.gifts.length,
      toBuy: toBuyGifts.length,
      bought: boughtGifts.length,
      records: data.records.length,
    },
    perRecipient,
    upcoming: upcomingBirthdays(data.recipients, 30),
  });
});

module.exports = router;
