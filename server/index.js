// gift-planner 后端入口：REST API + 前端静态资源托管
const path = require('path');
const express = require('express');

const recipientsRouter = require('./routes/recipients');
const giftsRouter = require('./routes/gifts');
const recordsRouter = require('./routes/records');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = Number(process.env.PORT) || 3021;

app.use(express.json());

// 前端静态页面（client 目录）
app.use(express.static(path.join(__dirname, '..', 'client')));

// REST API
app.use('/api/recipients', recipientsRouter);
app.use('/api/gifts', giftsRouter);
app.use('/api/records', recordsRouter);
app.use('/api/stats', statsRouter);

// 未匹配到的 API 统一返回 404 JSON
app.use('/api', (req, res) => {
  res.status(404).json({ error: `接口不存在: ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`🎁 gift-planner 已启动: http://localhost:${PORT}`);
  console.log(`   数据文件: server/data.json`);
});
