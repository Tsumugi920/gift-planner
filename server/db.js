// 数据层：全部数据持久化在 server/data.json，每次读改都直接落盘
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function read() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function write(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

// 自增 id：取当前列表最大 id + 1
function nextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

module.exports = { DATA_FILE, read, write, nextId };
