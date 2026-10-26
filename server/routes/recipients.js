// 收礼人：增删改查（删除时级联清理其礼物灵感与送礼记录）
const express = require('express');
const router = express.Router();
const db = require('../db');

function clean(body) {
  return {
    name: String(body.name || '').trim(),
    relation: String(body.relation || '').trim() || '朋友',
    birthday: String(body.birthday || '').trim(),
    likes: String(body.likes || '').trim(),
    budget: Number(body.budget) || 0,
    notes: String(body.notes || '').trim(),
  };
}

// 列表（支持 ?q= 按姓名/关系/喜好搜索）
router.get('/', (req, res) => {
  let recipients = db.read().recipients;
  const q = String(req.query.q || '').toLowerCase();
  if (q) {
    recipients = recipients.filter((r) =>
      [r.name, r.relation, r.likes].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }
  res.json(recipients);
});

router.get('/:id', (req, res) => {
  const recipient = db.read().recipients.find((r) => r.id === Number(req.params.id));
  if (!recipient) return res.status(404).json({ error: '收礼人不存在' });
  res.json(recipient);
});

router.post('/', (req, res) => {
  const data = clean(req.body);
  if (!data.name) return res.status(400).json({ error: '收礼人姓名不能为空' });
  const dbData = db.read();
  const recipient = { id: db.nextId(dbData.recipients), ...data };
  dbData.recipients.push(recipient);
  db.write(dbData);
  res.status(201).json(recipient);
});

router.put('/:id', (req, res) => {
  const dbData = db.read();
  const recipient = dbData.recipients.find((r) => r.id === Number(req.params.id));
  if (!recipient) return res.status(404).json({ error: '收礼人不存在' });
  const data = clean(req.body);
  if (!data.name) return res.status(400).json({ error: '收礼人姓名不能为空' });
  Object.assign(recipient, data);
  db.write(dbData);
  res.json(recipient);
});

router.delete('/:id', (req, res) => {
  const dbData = db.read();
  const id = Number(req.params.id);
  const index = dbData.recipients.findIndex((r) => r.id === id);
  if (index === -1) return res.status(404).json({ error: '收礼人不存在' });
  dbData.recipients.splice(index, 1);
  dbData.gifts = dbData.gifts.filter((g) => g.recipientId !== id);
  dbData.records = dbData.records.filter((r) => r.recipientId !== id);
  db.write(dbData);
  res.json({ ok: true });
});

module.exports = router;
