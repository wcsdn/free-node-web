/**
 * API 一致性测试套件
 * 测试前端调用的 API 与后端返回的数据是否匹配
 * 
 * 运行方式：在浏览器控制台执行此文件内容
 * 或者使用 test-api.html 页面
 */

const API_TEST_CONFIG = {
  // 测试使用的钱包地址
  testWallet: '0x1234567890abcdef1234567890abcdef12345678',
  testAuth: '0x1234567890abcdef1234567890abcdef12345678:test_signature',
  
  // API 基础地址
  baseURL: window.API_BASE_URL || 'http://localhost:8788',
  apiPrefix: window.API_PREFIX || '/api',
  
  // 等待时间（毫秒）
  timeout: 10000,
  
  // 是否打印详细日志
  verbose: true
};

/**
 * 发送 API 请求的辅助函数
 */
async function apiRequest(endpoint, method = 'GET', data = null, needAuth = true) {
  const url = API_TEST_CONFIG.baseURL + API_TEST_CONFIG.apiPrefix + endpoint;
  
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (needAuth) {
    options.headers['X-Wallet-Auth'] = API_TEST_CONFIG.testAuth;
  }
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  } else if (data && method === 'GET') {
    const params = new URLSearchParams(data);
    const separator = endpoint.includes('?') ? '&' : '?';
    // 如果 URL 已经有参数
    if (endpoint.includes('?')) {
      // 合并参数
      const [base, existingParams] = endpoint.split('?');
      const mergedParams = new URLSearchParams(existingParams);
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          mergedParams.append(key, value);
        }
      });
      // 更新 URL
    }
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data: result,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

/**
 * 测试结果收集器
 */
class APITestRunner {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.pending = 0;
  }
  
  addResult(test) {
    this.results.push(test);
    if (test.status === 'passed') this.passed++;
    else if (test.status === 'failed') this.failed++;
    else this.pending++;
  }
  
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 API 测试结果汇总');
    console.log('='.repeat(60));
    console.log(`✅ 通过: ${this.passed}`);
    console.log(`❌ 失败: ${this.failed}`);
    console.log(`⏳ 待测: ${this.pending}`);
    console.log(`📈 总计: ${this.results.length}`);
    console.log('='.repeat(60));
    
    if (this.failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }
    
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.results.length,
      details: this.results
    };
  }
}

/**
 * 核心测试用例 - 这些是页面加载时必须调用的 API
 */
const CORE_TESTS = [
  // 基础信息
  { name: 'GetVersionInfo', endpoint: '/game/version', method: 'GET', needAuth: false },
  { name: 'GetServerInfo', endpoint: '/game/status', method: 'GET', needAuth: false },
  { name: 'GetUserInfo', endpoint: '/game/user-info', method: 'GET' },
  
  // 城市信息
  { name: 'GetCityInteriorInfo', endpoint: '/game/city/interior/1', method: 'POST', data: { city_id: 1 } },
  
  // 建筑
  { name: 'GetBuildingList', endpoint: '/game/city/building-list/1', method: 'POST', data: { city_id: 1 } },
  
  // 武将
  { name: 'GetCityHero', endpoint: '/hero/list', method: 'GET' },
  
  // 物品
  { name: 'GetItemList', endpoint: '/item/list', method: 'GET' },
  
  // 邮件
  { name: 'GetMailList', endpoint: '/mail/list', method: 'GET' },
  { name: 'GetNewMailNum', endpoint: '/mail/new-count', method: 'GET' },
  
  // 任务
  { name: 'GetTask', endpoint: '/task/list', method: 'GET' },
  
  // 聊天
  { name: 'GetChatMessages', endpoint: '/chat/messages', method: 'GET', data: { last_id: 0 } },
];

/**
 * 运行核心 API 测试
 */
async function runCoreAPITests() {
  console.log('\n🚀 开始核心 API 测试...\n');
  
  const runner = new APITestRunner();
  
  for (const test of CORE_TESTS) {
    if (API_TEST_CONFIG.verbose) {
      console.log(`📡 测试: ${test.name} -> ${test.method} ${test.endpoint}`);
    }
    
    try {
      const result = await apiRequest(
        test.endpoint, 
        test.method, 
        test.data || null, 
        test.needAuth !== false
      );
      
      if (result.success && result.data && result.data.success) {
        runner.addResult({
          name: test.name,
          status: 'passed',
          endpoint: test.endpoint,
          response: result.data
        });
        console.log(`  ✅ 通过`);
      } else {
        runner.addResult({
          name: test.name,
          status: 'failed',
          endpoint: test.endpoint,
          error: result.data?.error || `HTTP ${result.status}`,
          response: result.data
        });
        console.log(`  ❌ 失败: ${result.data?.error || `HTTP ${result.status}`}`);
      }
    } catch (error) {
      runner.addResult({
        name: test.name,
        status: 'failed',
        endpoint: test.endpoint,
        error: error.message
      });
      console.log(`  ❌ 异常: ${error.message}`);
    }
  }
  
  return runner.printSummary();
}

/**
 * 运行所有已配置的 API 测试
 */
async function runAllAPITests() {
  console.log('\n🚀 开始完整 API 测试...\n');
  console.log('这可能需要几分钟时间...\n');
  
  const runner = new APITestRunner();
  
  // 获取所有 API 配置
  const apiMapping = window.API_MAPPING || {};
  const tests = Object.entries(apiMapping).map(([name, config]) => ({
    name,
    ...config
  }));
  
  let completed = 0;
  const total = tests.length;
  
  for (const test of tests) {
    completed++;
    
    if (completed % 20 === 0) {
      console.log(`📊 进度: ${completed}/${total}`);
    }
    
    try {
      // 构建请求
      let endpoint = test.endpoint;
      let data = {};
      
      // 处理路径参数
      if (test.params && test.params.length > 0) {
        // 使用默认测试值
        test.params.forEach(param => {
          if (param === 'city_id' || param === 'cityID') data.city_id = 1;
          else if (param === 'hero_id' || param === 'heroID') data.hero_id = 1;
          else if (param === 'item_id' || param === 'itemID') data.item_id = 1;
          else if (param === 'page') data.page = 1;
          else if (param === 'pageSize') data.pageSize = 10;
          else if (param === 'rank_type') data.rank_type = 1;
          else if (param === 'mail_type') data.mail_type = 0;
          else if (param === 'item_type') data.item_type = 1;
          else if (param === 'task_type') data.task_type = 1;
          else if (param === 'last_id') data.last_id = 0;
          else if (param === 'username') data.username = API_TEST_CONFIG.testWallet;
          else data[param] = 1; // 默认值
        });
      }
      
      // 替换路径参数
      Object.keys(data).forEach(key => {
        const placeholder = ':' + key;
        if (endpoint.includes(placeholder)) {
          endpoint = endpoint.replace(placeholder, data[key]);
          delete data[key];
        }
      });
      
      const result = await apiRequest(
        endpoint,
        test.httpMethod || 'GET',
        Object.keys(data).length > 0 ? data : null,
        test.auth !== false
      );
      
      if (result.success && result.data && result.data.success) {
        runner.addResult({
          name: test.name,
          status: 'passed',
          endpoint: test.endpoint,
          response: result.data
        });
      } else {
        runner.addResult({
          name: test.name,
          status: 'failed',
          endpoint: test.endpoint,
          error: result.data?.error || `HTTP ${result.status}`,
          response: result.data
        });
      }
    } catch (error) {
      runner.addResult({
        name: test.name,
        status: 'failed',
        endpoint: test.endpoint,
        error: error.message
      });
    }
  }
  
  return runner.printSummary();
}

/**
 * 测试特定 API 的详细返回格式
 */
async function testAPIDetail(name) {
  const config = window.API_MAPPING?.[name];
  if (!config) {
    console.error(`❌ 未找到 API 配置: ${name}`);
    return null;
  }
  
  console.log(`\n🔍 详细测试: ${name}`);
  console.log(`   端点: ${config.endpoint}`);
  console.log(`   方法: ${config.httpMethod}`);
  console.log(`   参数: ${JSON.stringify(config.params)}`);
  
  // 构建测试参数
  let endpoint = config.endpoint;
  let data = {};
  
  if (config.params) {
    config.params.forEach(param => {
      if (param === 'city_id' || param === 'cityID') data.city_id = 1;
      else if (param === 'page') data.page = 1;
      else if (param === 'last_id') data.last_id = 0;
      else data[param] = 1;
    });
  }
  
  // 替换路径参数
  Object.keys(data).forEach(key => {
    const placeholder = ':' + key;
    if (endpoint.includes(placeholder)) {
      endpoint = endpoint.replace(placeholder, data[key]);
      delete data[key];
    }
  });
  
  const result = await apiRequest(
    endpoint,
    config.httpMethod || 'GET',
    Object.keys(data).length > 0 ? data : null,
    config.auth !== false
  );
  
  console.log(`\n📥 请求结果:`);
  console.log(`   状态: ${result.status}`);
  console.log(`   成功: ${result.success}`);
  console.log(`   响应:`, JSON.stringify(result.data, null, 2));
  
  return result;
}

/**
 * 对比前端期望的字段和后端返回的字段
 */
function analyzeFieldMismatch(name, expectedFields, actualData) {
  if (!actualData || !actualData.data) {
    return { match: false, error: '无响应数据' };
  }
  
  const actualFields = Object.keys(actualData.data);
  const missing = expectedFields.filter(f => !actualFields.includes(f));
  const extra = actualFields.filter(f => !expectedFields.includes(f));
  
  return {
    match: missing.length === 0,
    missing,
    extra,
    actualFields
  };
}

// 导出到全局
window.APITestRunner = {
  runCoreAPITests,
  runAllAPITests,
  testAPIDetail,
  analyzeFieldMismatch,
  apiRequest,
  config: API_TEST_CONFIG
};

// 自动运行核心测试
console.log('\n🎯 API 一致性测试套件已加载');
console.log('使用方法:');
console.log('  window.APITestRunner.runCoreAPITests()  - 运行核心 API 测试');
console.log('  window.APITestRunner.runAllAPITests()   - 运行全部 API 测试');
console.log('  window.APITestRunner.testAPIDetail("GetUserInfo") - 测试单个 API');

