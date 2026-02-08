/**
 * Comprehensive Frontend Integration Test
 * Tests all major API modules by calling actual backend APIs
 */
const http = require('http');

const API_BASE = 'http://localhost:8788';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

const results = {
  passed: [],
  failed: []
};

function test(endpoint, method = 'GET', body = null, description = '') {
  return new Promise((resolve) => {
    const url = new URL(API_BASE + endpoint);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'X-Wallet-Auth': TEST_WALLET,
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const success = json.success !== false;
          const testResult = {
            endpoint: `${method} ${endpoint}`,
            description,
            status: success ? 'PASS' : 'FAIL',
            response: json
          };
          if (success) {
            results.passed.push(testResult);
          } else {
            results.failed.push(testResult);
          }
          console.log(`[${success ? 'PASS' : 'FAIL'}] ${method} ${endpoint} - ${description}`);
          resolve(testResult);
        } catch (e) {
          const testResult = {
            endpoint: `${method} ${endpoint}`,
            description,
            status: 'ERROR',
            error: e.message
          };
          results.failed.push(testResult);
          console.log(`[ERROR] ${method} ${endpoint} - ${description}: Parse error`);
          resolve(testResult);
        }
      });
    });

    req.on('error', (e) => {
      const testResult = {
        endpoint: `${method} ${endpoint}`,
        description,
        status: 'ERROR',
        error: e.message
      };
      results.failed.push(testResult);
      console.log(`[ERROR] ${method} ${endpoint} - ${description}: Network error - ${e.message}`);
      resolve(testResult);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Frontend Integration Tests - Free Node Web');
  console.log('='.repeat(60));
  console.log(`API Base: ${API_BASE}`);
  console.log(`Test Wallet: ${TEST_WALLET}`);
  console.log('='.repeat(60));
  console.log('');

  // 1. Health Check
  console.log('--- 1. Health Check ---');
  await test('/health', 'GET', null, 'Health check');
  
  console.log('');

  // 2. Character/User APIs
  console.log('--- 2. Character/User APIs ---');
  await test('/api/character/info', 'GET', null, 'Get character info');
  await test('/api/character/login', 'POST', { wallet_address: TEST_WALLET }, 'Character login');
  
  console.log('');

  // 3. City APIs
  console.log('--- 3. City APIs ---');
  await test('/api/city/list', 'GET', null, 'Get city list');
  
  console.log('');

  // 4. Building APIs
  console.log('--- 4. Building APIs ---');
  await test('/api/building/city/1', 'GET', null, 'Get buildings for city 1');
  
  console.log('');

  // 5. Hero APIs
  console.log('--- 5. Hero APIs ---');
  await test('/api/hero/list', 'GET', null, 'Get hero list');
  
  console.log('');

  // 6. Battle APIs
  console.log('--- 6. Battle APIs ---');
  await test('/api/battle', 'GET', null, 'Get battle history');
  await test('/api/battle/stats', 'GET', null, 'Get battle stats');
  await test('/api/battle/power', 'GET', null, 'Get battle power');
  
  console.log('');

  // 7. Skill APIs
  console.log('--- 7. Skill APIs ---');
  await test('/api/skill', 'GET', null, 'Get skills');
  await test('/api/skill/configs', 'GET', null, 'Get skill configs');
  await test('/api/skill/list', 'GET', null, 'Get skill list');
  
  console.log('');

  // 8. Item APIs
  console.log('--- 8. Item APIs ---');
  await test('/api/item/list', 'GET', null, 'Get item list');
  await test('/api/item/craft', 'GET', null, 'Get craft recipes');
  await test('/api/item/craft?type=potion', 'GET', null, 'Get craft recipes by type');
  
  console.log('');

  // 9. Mail APIs
  console.log('--- 9. Mail APIs ---');
  await test('/api/mail', 'GET', null, 'Get mail list');
  await test('/api/mail?type=1', 'GET', null, 'Get mail list by type');
  
  console.log('');

  // 10. Task/Daily APIs
  console.log('--- 10. Task/Daily APIs ---');
  await test('/api/task', 'GET', null, 'Get tasks');
  await test('/api/daily', 'GET', null, 'Get daily tasks');
  await test('/api/task/list', 'GET', null, 'Get task list');
  
  console.log('');

  // 11. Corps/Guild APIs
  console.log('--- 11. Corps/Guild APIs ---');
  await test('/api/corps', 'GET', null, 'Get corps list');
  await test('/api/guild/my', 'GET', null, 'Get my guild');
  await test('/api/guild/list', 'GET', null, 'Get guild list');
  
  console.log('');

  // 12. Tech APIs
  console.log('--- 12. Tech APIs ---');
  await test('/api/technic/list', 'GET', null, 'Get technic list');
  await test('/api/technic/config', 'GET', null, 'Get technic config');
  await test('/api/technic/effects', 'GET', null, 'Get technic effects');
  await test('/api/tech/list', 'GET', null, 'Get tech list');
  await test('/api/tech/config', 'GET', null, 'Get tech config');
  
  console.log('');

  // 13. Interior/Craft APIs
  console.log('--- 13. Interior/Craft APIs ---');
  await test('/api/interior/level', 'GET', null, 'Get interior level');
  await test('/api/interior/levels', 'GET', null, 'Get all interior levels');
  await test('/api/interior/bonuses', 'GET', null, 'Get interior bonuses');
  await test('/api/interior/info?city_id=1', 'GET', null, 'Get interior info');
  await test('/api/interior/next-level', 'GET', null, 'Get next level info');
  
  console.log('');

  // 14. Shop APIs
  console.log('--- 14. Shop APIs ---');
  await test('/api/shop/list?type=1', 'GET', null, 'Get shop list');
  
  console.log('');

  // 15. Market APIs
  console.log('--- 15. Market APIs ---');
  await test('/api/market/list', 'GET', null, 'Get market list');
  await test('/api/market/history', 'GET', null, 'Get market history');
  
  console.log('');

  // 16. Military APIs
  console.log('--- 16. Military APIs ---');
  await test('/api/military/list', 'GET', null, 'Get military list');
  await test('/api/military/config', 'GET', null, 'Get military config');
  await test('/api/military/assignments', 'GET', null, 'Get military assignments');
  
  console.log('');

  // 17. Arena APIs
  console.log('--- 17. Arena APIs ---');
  await test('/api/arena/info', 'GET', null, 'Get arena info');
  await test('/api/arena/rank', 'GET', null, 'Get arena rank');
  
  console.log('');

  // 18. Rank APIs
  console.log('--- 18. Rank APIs ---');
  await test('/api/rank/', 'GET', null, 'Get rank list');
  await test('/api/rank/my-rank', 'GET', null, 'Get my rank');
  
  console.log('');

  // 19. Chat APIs
  console.log('--- 19. Chat APIs ---');
  await test('/api/chat/list?channel=global', 'GET', null, 'Get chat list');
  await test('/api/chat/conversations', 'GET', null, 'Get chat conversations');
  
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed.length + results.failed.length}`);
  console.log(`Passed: ${results.passed.length} ✅`);
  console.log(`Failed: ${results.failed.length} ❌`);
  console.log('');

  if (results.failed.length > 0) {
    console.log('Failed Tests:');
    console.log('-'.repeat(60));
    results.failed.forEach((test, i) => {
      console.log(`${i + 1}. ${test.endpoint}`);
      console.log(`   Description: ${test.description}`);
      console.log(`   Error: ${test.error || test.response?.error || 'Unknown error'}`);
    });
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('Test Complete!');
  console.log('='.repeat(60));

  // Save results to file
  const fs = require('fs');
  const outputPath = '/Users/a12345/h5/free-node-web/tests/integration-results.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    apiBase: API_BASE,
    summary: {
      total: results.passed.length + results.failed.length,
      passed: results.passed.length,
      failed: results.failed.length
    },
    passed: results.passed,
    failed: results.failed
  }, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

runTests().catch(console.error);
