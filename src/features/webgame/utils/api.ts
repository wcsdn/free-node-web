/**
 * 统一 API 工具
 * 用于所有 webgame 组件的 API 调用
 */

// 根据环境自动选择 API 地址
function getApiBase(): string {
  // 1. 检查 URL 参数 dev=1
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dev') === '1') {
      return 'http://localhost:8788';
    }
  }

  // 2. 检查环境变量 (使用 any 类型避免 Vite 类型检查问题)
  const env = import.meta.env as any;
  if (env?.VITE_API_BASE_DEV) {
    return env.VITE_API_BASE_DEV;
  }

  // 3. 默认使用生产环境
  return 'https://game.free-node.xyz';
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
