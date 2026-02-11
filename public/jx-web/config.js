/**
 * API Configuration
 * 配置 API 端点和环境变量
 */

// 环境检测
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// API 配置
const API_CONFIG = {
  // 开发环境
  development: {
    baseURL: 'http://localhost:8788',
    apiPrefix: '/api'
  },
  // 生产环境
  production: {
    baseURL: 'https://game.free-node.xyz',
    apiPrefix: '/api'
  }
};

// 当前环境配置
const currentConfig = isDevelopment ? API_CONFIG.development : API_CONFIG.production;

// 导出全局配置
window.API_BASE_URL = currentConfig.baseURL;
window.API_PREFIX = currentConfig.apiPrefix;

// 完整 API URL
window.getApiUrl = function(endpoint) {
  // 如果 endpoint 已经包含完整 URL，直接返回
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // 如果 endpoint 不以 / 开头，添加 /
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  // 如果 endpoint 不以 /api 开头，添加 API 前缀
  if (!endpoint.startsWith(window.API_PREFIX)) {
    endpoint = window.API_PREFIX + endpoint;
  }
  
  return window.API_BASE_URL + endpoint;
};

// 日志输出
console.log('=== API Configuration ===');
console.log('Environment:', isDevelopment ? 'Development' : 'Production');
console.log('Base URL:', window.API_BASE_URL);
console.log('API Prefix:', window.API_PREFIX);
console.log('========================');
