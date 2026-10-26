# 🎁 gift-planner 送礼灵感

一个前后端完整的送礼规划小应用：管理收礼人、记录礼物灵感（待买 / 已买）、
记送礼流水，并自动汇总预算、提醒近期生日。

技术栈：**Node.js + Express**（后端 REST API + 静态托管）｜ **原生 JS（ES Modules）**（前端，无框架、无构建）

## 功能

- **收礼人**：姓名、关系、生日、喜好、年度预算、备注的增删改查；删除收礼人会级联清理其灵感与记录
- **礼物灵感**：待买 / 已买两种状态，一键「标记已买」「恢复待买」，支持按状态、收礼人、关键字筛选
- **送礼记录**：日期、礼物、场合、金额的送礼流水，可增删改
- **预算汇总**：年度总预算 / 灵感已花 / 待买计划 / 剩余，每位收礼人预算使用进度条，历史送礼累计
- **生日提醒**：页面顶部横幅自动提示 30 天内的生日

内置示例数据：**8 位收礼人、20 条礼物灵感、6 条送礼记录**。

## 目录结构

```
gift-planner/
├── package.json
├── README.md
├── client/                  # 前端（由 Express 静态托管）
│   ├── index.html
│   ├── style.css
│   ├── app.js               # 入口：状态管理、页签、全局刷新
│   └── js/
│       ├── api.js           # REST 请求封装
│       ├── recipients.js    # 收礼人模块
│       ├── gifts.js         # 礼物灵感模块
│       ├── records.js       # 送礼记录模块
│       └── stats.js         # 预算汇总 + 生日提醒模块
└── server/
    ├── index.js             # 后端入口（Express，端口 3021）
    ├── db.js                # data.json 读写与自增 id
    ├── data.json            # 全部数据，持久化于此
    └── routes/
        ├── recipients.js    # /api/recipients
        ├── gifts.js         # /api/gifts
        ├── records.js       # /api/records
        └── stats.js         # /api/stats/budget
```

## 安装与启动

要求 Node.js ≥ 16。

```bash
cd gift-planner
npm install
npm start          # 或 npm run dev（文件改动自动重启）
```

启动后浏览器打开 **http://localhost:3021** 即可。

端口默认 `3021`，可用环境变量覆盖：`PORT=4000 npm start`。

## REST API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/recipients` | 收礼人列表，支持 `?q=` 搜索 |
| POST | `/api/recipients` | 新增收礼人 |
| PUT | `/api/recipients/:id` | 修改收礼人 |
| DELETE | `/api/recipients/:id` | 删除收礼人（级联删除其灵感与记录） |
| GET | `/api/gifts` | 礼物灵感列表，支持 `?recipientId= ?status=to-buy/bought ?q=` |
| POST | `/api/gifts` | 新增灵感 |
| PUT | `/api/gifts/:id` | 修改灵感（改 `status` 为 `bought` 即标记已买） |
| DELETE | `/api/gifts/:id` | 删除灵感 |
| GET | `/api/records` | 送礼记录列表，支持 `?recipientId= ?year=` |
| POST | `/api/records` | 新增送礼记录 |
| PUT | `/api/records/:id` | 修改送礼记录 |
| DELETE | `/api/records/:id` | 删除送礼记录 |
| GET | `/api/stats/budget` | 预算汇总 + 每位收礼人明细 + 30 天内生日提醒 |

curl 示例：

```bash
# 列出收礼人
curl -s http://localhost:3021/api/recipients

# 新增一条礼物灵感
curl -s -X POST http://localhost:3021/api/gifts \
  -H 'Content-Type: application/json' \
  -d '{"recipientId":4,"name":"手冲咖啡壶套装","category":"厨具","price":268,"occasion":"元旦"}'

# 预算汇总
curl -s http://localhost:3021/api/stats/budget
```

## 数据持久化

所有数据保存在 `server/data.json`，每次增删改都会立即写盘，重启服务不丢数据。
想把应用重置回示例数据：停止服务后，用版本库 / 备份中的初始 `data.json` 覆盖即可。

## 字段说明

- 收礼人：`name`（必填）、`relation`、`birthday`（`YYYY-MM-DD`）、`likes`、`budget`（年度预算，元）、`notes`
- 礼物灵感：`recipientId`（必填）、`name`（必填）、`category`、`price`、`status`（`to-buy` / `bought`）、`occasion`、`notes`
- 送礼记录：`recipientId`（必填）、`giftName`（必填）、`date`（必填）、`occasion`、`amount`、`notes`
