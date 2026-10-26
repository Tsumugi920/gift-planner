// 统一的 API 请求封装：所有前端模块都通过这里访问后端 REST 接口
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `请求失败（HTTP ${res.status}）`);
  }
  return res.status === 204 ? null : res.json();
}

function qs(params = {}) {
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return pairs.length ? `?${pairs.join('&')}` : '';
}

const post = (data) => ({ method: 'POST', body: JSON.stringify(data) });
const put = (data) => ({ method: 'PUT', body: JSON.stringify(data) });
const del = () => ({ method: 'DELETE' });

export const api = {
  // 收礼人
  listRecipients: (params) => request(`/recipients${qs(params)}`),
  getRecipient: (id) => request(`/recipients/${id}`),
  createRecipient: (data) => request('/recipients', post(data)),
  updateRecipient: (id, data) => request(`/recipients/${id}`, put(data)),
  deleteRecipient: (id) => request(`/recipients/${id}`, del()),

  // 礼物灵感
  listGifts: (params) => request(`/gifts${qs(params)}`),
  getGift: (id) => request(`/gifts/${id}`),
  createGift: (data) => request('/gifts', post(data)),
  updateGift: (id, data) => request(`/gifts/${id}`, put(data)),
  deleteGift: (id) => request(`/gifts/${id}`, del()),

  // 送礼记录
  listRecords: (params) => request(`/records${qs(params)}`),
  getRecord: (id) => request(`/records/${id}`),
  createRecord: (data) => request('/records', post(data)),
  updateRecord: (id, data) => request(`/records/${id}`, put(data)),
  deleteRecord: (id) => request(`/records/${id}`, del()),

  // 预算汇总
  getBudget: () => request('/stats/budget'),
};
