/**
 * API 适配器 V2 - 配置驱动版本
 * 根据 api-config.js 中的配置自动生成所有 API 方法
 */

// 全局变量 - 从 iframe 父窗口接收
window.walletAddress = null;
window.authHeader = null;

// 监听来自父窗口的认证信息
window.addEventListener('message', function(event) {
  if (event.data.type === 'AUTH_INFO') {
    window.walletAddress = event.data.walletAddress;
    window.authHeader = event.data.authHeader;
    console.log('✅ 收到认证信息:', window.walletAddress);

    // 认证信息到达后,初始化游戏
    if (typeof InitGame === 'function') {
      InitGame();
    }
  }
});

// API 基础配置
const API_CONFIG = {
  baseURL: window.API_BASE_URL || 'http://localhost:8788',
  timeout: 30000
};

/**
 * 通用 API 请求函数
 * @param {string} endpoint - API 端点
 * @param {string} method - HTTP 方法
 * @param {object} data - 请求数据
 * @param {boolean} needAuth - 是否需要认证
 * @param {function} callback - 回调函数
 */
function apiRequest(endpoint, method, data, needAuth, callback) {
  // 检查认证
  if (needAuth && !window.walletAddress) {
    console.error('❌ 未连接钱包');
    if (callback) callback({ success: false, message: '请先连接钱包' });
    return;
  }

  // 构建完整 URL
  const url = window.getApiUrl ? window.getApiUrl(endpoint) : (API_CONFIG.baseURL + '/api' + endpoint);
  
  // 准备请求配置
  const ajaxConfig = {
    url: url,
    type: method,
    timeout: API_CONFIG.timeout,
    success: function(response) {
      if (callback) {
        // 兼容原始回调格式
        callback(response.data || response);
      }
    },
    error: function(xhr, status, error) {
      console.error('❌ API 请求失败:', endpoint, error);
      if (callback) {
        callback({ 
          success: false, 
          message: xhr.responseJSON?.error || xhr.responseJSON?.message || '请求失败' 
        });
      }
    }
  };

  // 添加认证头
  if (needAuth && window.authHeader) {
    ajaxConfig.headers = { 'Authorization': window.authHeader };
  }

  // 根据 HTTP 方法处理数据
  if (method === 'GET') {
    // GET 请求：参数放在 URL 中
    if (data && Object.keys(data).length > 0) {
      ajaxConfig.data = data;
    }
  } else {
    // POST/PUT/DELETE 请求：参数放在 body 中
    ajaxConfig.contentType = 'application/json';
    ajaxConfig.data = JSON.stringify(data);
  }

  // 发送请求
  $.ajax(ajaxConfig);
}

/**
 * 根据配置生成 API 方法
 * @param {string} methodName - 方法名
 * @param {object} config - API 配置
 * @returns {function} - 生成的 API 方法
 */
function generateApiMethod(methodName, config) {
  return function(...args) {
    // 最后一个参数是回调函数
    const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    
    // 如果有 mock 数据且在开发模式，直接返回 mock
    if (config.mock && window.location.hostname === 'localhost') {
      console.log('🔧 使用 Mock 数据:', methodName, config.mock);
      if (callback) {
        setTimeout(() => callback(config.mock), 100);
      }
      return config.mock;
    }
    
    // 构建请求参数和端点
    const data = {};
    let endpoint = config.endpoint;
    
    if (Array.isArray(config.params)) {
      // 数组格式：按顺序映射参数
      config.params.forEach((paramName, index) => {
        if (args[index] !== undefined) {
          // 检查端点中是否有路径参数占位符
          const pathParam = ':' + paramName;
          if (endpoint.includes(pathParam)) {
            // 替换路径参数
            endpoint = endpoint.replace(pathParam, args[index]);
          } else {
            // 添加到请求数据
            data[paramName] = args[index];
          }
        }
      });
    } else if (typeof config.params === 'object') {
      // 对象格式：自定义参数映射
      Object.keys(config.params).forEach((key, index) => {
        if (args[index] !== undefined) {
          data[config.params[key]] = args[index];
        }
      });
    }
    
    // 添加钱包地址（如果需要认证）
    if (config.auth && window.walletAddress) {
      data.wallet_address = window.walletAddress;
    }
    
    // 发送请求
    apiRequest(
      endpoint,
      config.httpMethod,
      data,
      config.auth !== false, // 默认需要认证
      (response) => {
        // 如果有数据转换函数，应用转换
        if (config.transform && typeof config.transform === 'function') {
          response = config.transform(response);
        }
        
        if (callback) {
          callback(response);
        }
      }
    );
  };
}

/**
 * 初始化 Main 对象
 * 根据 API_MAPPING 配置自动生成所有方法
 */
function initializeMainObject() {
  if (!window.API_MAPPING) {
    console.error('❌ API_MAPPING 未定义，请先加载 api-config.js');
    return;
  }
  
  window.Main = {};
  
  // 遍历配置，生成所有 API 方法
  Object.keys(window.API_MAPPING).forEach(methodName => {
    const config = window.API_MAPPING[methodName];
    window.Main[methodName] = generateApiMethod(methodName, config);
  });
  
  console.log('✅ API 适配器已初始化，共生成', Object.keys(window.Main).length, '个方法');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMainObject);
} else {
  initializeMainObject();
}
