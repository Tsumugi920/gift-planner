// 礼物灵感：增删改查 + 待买/已买状态切换（支持 ?recipientId= ?status= ?q= 过滤）
const express = require('express');
const router = express.Router();
const db = require('../db');

const STATUSES = ['to-buy', 'bought'];

function clean(body) {
  return {
    recipientId: Number(body.recipientId) || 0,
    name: String(body.name || '').trim(),
    category: String(body.category || '').trim() || '其他',
    price: Math.max(0, Number(body.price) || 0),
    status: STATUSES.includes(body.status) ? body.status : 'to-buy',
    occasion: String(body.occasion || '').trim(),
    notes: String(body.notes || '').trim(),
  };
}

router.get('/', (req, res) => {
  let gifts = db.read().gifts;
  const { recipientId, status, q } = req.query;
  if (recipientId) gifts = gifts.filter((g) => g.recipientId === Number(recipientId));
  if (status) gifts = gifts.filter((g) => g.status === status);
  const kw = String(q || '').toLowerCase();
  if (kw) {
    gifts = gifts.filter((g) =>
      [g.name, g.category, g.occasion].some((v) => String(v || '').toLowerCase().includes(kw))
    );
  }
  gifts = [...gifts].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(gifts);
});

router.get('/:id', (req, res) => {
  const gift = db.read().gifts.find((g) => g.id === Number(req.params.id));
  if (!gift) return res.status(404).json({ error: '礼物灵感不存在' });
  res.json(gift);
});

router.post('/', (req, res) => {
  const data = clean(req.body);
  if (!data.name) return res.status(400).json({ error: '礼物名称不能为空' });
  const dbData = db.read();
  if (!dbData.recipients.some((r) => r.id === data.recipientId)) {
    return res.status(400).json({ error: '收礼人不存在，请先在「收礼人」页添加' });
  }
  const now = new Date().toISOString();
  const gift = {
    id: db.nextId(dbData.gifts),
    ...data,
    createdAt: now,
    boughtAt: data.status === 'bought' ? now : null,
  };
  dbData.gifts.push(gift);
  db.write(dbData);
  res.status(201).json(gift);
});

router.put('/:id', (req, res) => {
  const dbData = db.read();
  const gift = dbData.gifts.find((g) => g.id === Number(req.params.id));
  if (!gift) return res.status(404).json({ error: '礼物灵感不存在' });
  const data = clean(req.body);
  if (!data.name) return res.status(400).json({ error: '礼物名称不能为空' });
  if (data.recipientId && !dbData.recipients.some((r) => r.id === data.recipientId)) {
    return res.status(400).json({ error: '收礼人不存在' });
  }
  const statusChanged = data.status !== gift.status;
  Object.assign(gift, data);
  if (statusChanged) {
    gift.boughtAt = data.status === 'bought' ? new Date().toISOString() : null;
  }
  db.write(dbData);
  res.json(gift);
});

router.delete('/:id', (req, res) => {
  const dbData = db.read();
  const index = dbData.gifts.findIndex((g) => g.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: '礼物灵感不存在' });
  dbData.gifts.splice(index, 1);
  db.write(dbData);
  res.json({ ok: true });
});

module.exports = router;
