/**
 * 统一 API 工具
 * 用于所有 webgame 组件的 API 调用
 */

// 根据环境自动选择 API 地址
function getApiBase(): string {
  if (typeof import.meta === 'undefined') {
    // Node 环境（如测试）
    return process.env.API_BASE || 'http://localhost:8788';
  }
  // 浏览器环境
  // 优先使用环境变量配置的地址
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  return import.meta.env.PROD
    ? 'https://game.free-node.xyz'
    : 'http://localhost:8788';
}

// 获取认证头
function getAuthHeaders(): Record<string, string> {
  const auth = localStorage.getItem('wallet-auth');
  return auth ? { 'X-Wallet-Auth': auth } : {
    'X-Wallet-Auth': '0x1234567890abcdef1234567890abcdef12345678:test_signature'
  };
}

// GET 请求
async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

// POST 请求
async function apiPost<T = any>(path: string, data?: any): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return res.json();
}

// DELETE 请求
async function apiDelete<T = any>(path: string): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return res.json();
}

// 统一导出
export { getApiBase, getAuthHeaders, apiGet, apiPost, apiDelete };
