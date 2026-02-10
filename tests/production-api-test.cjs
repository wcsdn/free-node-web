/**
 * 生产环境 API 全面测试
 * 运行: node tests/production-api-test.cjs
 */

const https = require('https');
const http = require('http');

// 测试配置
const API_BASE = 'https://game.free-node.xyz';
const WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const SIGNATURE = 'test_signature';

const authHeader = `${WALLET}:${SIGNATURE}`;

// HTTP 请求辅助函数
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Auth': authHeader,
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Timeout')));

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testEndpoint(method, path, name) {
  try {
    const start = Date.now();
    const result = await request(method, path);
    const duration = Date.now() - start;
    
    const status = result.status >= 200 && result.status < 400 ? '✅' : '❌';
    console.log(`${status} ${name.padEnd(40)} ${String(result.status).padStart(3)} ${duration}ms`);
    
    return { name, status: result.status, duration, success: result.status >= 200 && result.status < 400 };
  } catch (error) {
    console.log(`❌ ${name.padEnd(40)} ERR ${error.message}`);
    return { name, status: 0, duration: 0, success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('🎯 生产环境 API 全面测试');
  console.log(`🌐 ${API_BASE}`);
  console.log('='.repeat(70));
  console.log('');

  const results = [];

  // 1. 健康检查
  console.log('📋 健康检查:');
  results.push(await testEndpoint('GET', '/health', 'GET /health'));

  // 2. 核心接口
  console.log('\n🏠 核心接口:');
  results.push(await testEndpoint('POST', '/api/game/user-info', 'POST /api/game/user-info'));
  results.push(await testEndpoint('POST', '/api/game/character', 'POST /api/game/character'));
  results.push(await testEndpoint('POST', '/api/game/city/list', 'POST /api/game/city/list'));

  // 3. 城市接口
  console.log('\n🏙️ 城市接口:');
  results.push(await testEndpoint('GET', '/api/game/city/interior/1', 'GET /api/game/city/interior/1'));
  results.push(await testEndpoint('POST', '/api/game/city/detail', 'POST /api/game/city/detail'));
  results.push(await testEndpoint('POST', '/api/game/city/collect', 'POST /api/game/city/collect'));

  // 4. 建筑接口
  console.log('\n🏗️ 建筑接口:');
  results.push(await testEndpoint('GET', '/api/building', 'GET /api/building'));
  results.push(await testEndpoint('GET', '/api/building/city/1', 'GET /api/building/city/1'));

  // 5. 武将接口
  console.log('\n⚔️ 武将接口:');
  results.push(await testEndpoint('POST', '/api/hero/list', 'POST /api/hero/list'));

  // 6. 战斗接口
  console.log('\n🎖️ 战斗接口:');
  results.push(await testEndpoint('POST', '/api/battle/stats', 'POST /api/battle/stats'));
  results.push(await testEndpoint('POST', '/api/battle/power', 'POST /api/battle/power'));

  // 7. 竞技场
  console.log('\n🏆 竞技场:');
  results.push(await testEndpoint('POST', '/api/arena/list', 'POST /api/arena/list'));

  // 8. 副本
  console.log('\n🗺️ 副本:');
  results.push(await testEndpoint('POST', '/api/dungeon/list', 'POST /api/dungeon/list'));

  // 9. 商城
  console.log('\n🛒 商城:');
  results.push(await testEndpoint('POST', '/api/shop/list', 'POST /api/shop/list'));

  // 10. 市场
  console.log('\n📦 市场:');
  results.push(await testEndpoint('POST', '/api/market/list', 'POST /api/market/list'));

  // 11. 邮件
  console.log('\n📧 邮件:');
  results.push(await testEndpoint('POST', '/api/mail/list', 'POST /api/mail/list'));

  // 12. 军团
  console.log('\n👥 军团:');
  results.push(await testEndpoint('POST', '/api/corps/list', 'POST /api/corps/list'));

  // 13. 任务
  console.log('\n📜 任务:');
  results.push(await testEndpoint('POST', '/api/task/list', 'POST /api/task/list'));

  // 14. 每日
  console.log('\n📅 每日:');
  results.push(await testEndpoint('POST', '/api/daily/list', 'POST /api/daily/list'));

  // 15. 礼品
  console.log('\n🎁 礼品:');
  results.push(await testEndpoint('POST', '/api/gift/validate', 'POST /api/gift/validate'));

  // 统计
  console.log('\n' + '='.repeat(70));
  console.log('📊 测试结果统计');
  console.log('='.repeat(70));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const timeouts = results.filter(r => r.error === 'Timeout').length;
  
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`⏰ 超时: ${timeouts}`);
  console.log(`📈 总计: ${results.length}`);
  
  if (failed > 0 || timeouts > 0) {
    console.log('\n❌ 失败的接口:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name} ${r.status ? `(HTTP ${r.status})` : r.error}`);
    });
  }
  
  console.log('='.repeat(70));
  
  return passed === results.length;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('测试运行失败:', err);
  process.exit(1);
});
