// 送礼记录：增删改（支持 ?recipientId= ?year= 过滤）
const express = require('express');
const router = express.Router();
const db = require('../db');

function clean(body) {
  return {
    recipientId: Number(body.recipientId) || 0,
    giftName: String(body.giftName || '').trim(),
    occasion: String(body.occasion || '').trim() || '日常',
    date: String(body.date || '').trim(),
    amount: Math.max(0, Number(body.amount) || 0),
    notes: String(body.notes || '').trim(),
  };
}

router.get('/', (req, res) => {
  let records = db.read().records;
  const { recipientId, year } = req.query;
  if (recipientId) records = records.filter((r) => r.recipientId === Number(recipientId));
  if (year) records = records.filter((r) => String(r.date).startsWith(String(year)));
  records = [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  res.json(records);
});

router.get('/:id', (req, res) => {
  const record = db.read().records.find((r) => r.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: '送礼记录不存在' });
  res.json(record);
});

router.post('/', (req, res) => {
  const data = clean(req.body);
  if (!data.giftName) return res.status(400).json({ error: '礼物名称不能为空' });
  if (!data.date) return res.status(400).json({ error: '送礼日期不能为空' });
  const dbData = db.read();
  if (!dbData.recipients.some((r) => r.id === data.recipientId)) {
    return res.status(400).json({ error: '收礼人不存在' });
  }
  const record = { id: db.nextId(dbData.records), ...data };
  dbData.records.push(record);
  db.write(dbData);
  res.status(201).json(record);
});

router.put('/:id', (req, res) => {
  const dbData = db.read();
  const record = dbData.records.find((r) => r.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: '送礼记录不存在' });
  const data = clean(req.body);
  if (!data.giftName) return res.status(400).json({ error: '礼物名称不能为空' });
  if (!data.date) return res.status(400).json({ error: '送礼日期不能为空' });
  if (data.recipientId && !dbData.recipients.some((r) => r.id === data.recipientId)) {
    return res.status(400).json({ error: '收礼人不存在' });
  }
  Object.assign(record, data);
  db.write(dbData);
  res.json(record);
});

router.delete('/:id', (req, res) => {
  const dbData = db.read();
  const index = dbData.records.findIndex((r) => r.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: '送礼记录不存在' });
  dbData.records.splice(index, 1);
  db.write(dbData);
  res.json({ ok: true });
});

module.exports = router;
