/**
 * API Test Script - Verifies all endpoints return proper JSON responses
 * Run: node workers/ghost-game/test-endpoints.js
 */
const http = require('http');

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8788';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const TEST_SIGNATURE = 'test_signature';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, isJson: true });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, isJson: false, parseError: e.message });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 API Endpoint Validation Tests\n');
  console.log('Server:', API_BASE);
  console.log('Wallet:', TEST_WALLET);
  console.log('='.repeat(60));

  const endpoints = [
    // Character endpoints
    { name: 'GET /api/character', path: '/api/character' },
    { name: 'GET /api/character/info', path: '/api/character/info' },
    
    // Hero endpoints  
    { name: 'GET /api/hero', path: '/api/hero' },
    { name: 'GET /api/hero/list', path: '/api/hero/list' },
    
    // City endpoints
    { name: 'GET /api/city', path: '/api/city' },
    { name: 'GET /api/city/buildings', path: '/api/city/buildings' },
    { name: 'GET /api/city/list', path: '/api/city/list' },
    
    // Building endpoints
    { name: 'GET /api/building', path: '/api/building' },
    { name: 'GET /api/building/config/list', path: '/api/building/config/list' },
    
    // Item endpoints
    { name: 'GET /api/item', path: '/api/item' },
    { name: 'GET /api/item/configs', path: '/api/item/configs' },
    
    // Battle endpoints
    { name: 'GET /api/battle', path: '/api/battle' },
    { name: 'GET /api/battle/stats', path: '/api/battle/stats' },
    { name: 'GET /api/battle/power', path: '/api/battle/power' },
    
    // Other endpoints
    { name: 'GET /api/task', path: '/api/task' },
    { name: 'GET /api/mail', path: '/api/mail' },
    { name: 'GET /api/shop', path: '/api/shop' },
    { name: 'GET /api/shop/list', path: '/api/shop/list' },
    { name: 'GET /api/market', path: '/api/market' },
    { name: 'GET /api/arena', path: '/api/arena' },
    { name: 'GET /api/rank', path: '/api/rank' },
    { name: 'GET /api/dungeon', path: '/api/dungeon' },
    { name: 'GET /api/skill', path: '/api/skill' },
    { name: 'GET /api/tech', path: '/api/tech' },
    { name: 'GET /api/daily', path: '/api/daily' },
    { name: 'GET /api/signin', path: '/api/signin' },
    { name: 'GET /api/notification', path: '/api/notification' },
    { name: 'GET /api/chat', path: '/api/chat' },
    { name: 'GET /api/defense', path: '/api/defense' },
    { name: 'GET /api/military', path: '/api/military' },
    { name: 'GET /api/activity', path: '/api/activity' },
    { name: 'GET /api/corps', path: '/api/corps' },
    { name: 'GET /api/corps/member', path: '/api/corps/member' },
    { name: 'GET /api/item/craft', path: '/api/item/craft' },
    
    // Health check
    { name: 'GET /health', path: '/health' },
  ];

  let passed = 0;
  let failed = 0;
  let emptyResponses = 0;

  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(endpoint.path);
      
      if (result.status === 200 && result.isJson) {
        if (result.data && (result.data.success !== undefined || result.data.status === 'ok')) {
          console.log(`✅ ${endpoint.name}: OK`);
          if (result.data.data !== undefined && Array.isArray(result.data.data)) {
            console.log(`   └─ Array with ${result.data.data.length} items`);
          } else if (result.data.data !== undefined && typeof result.data.data === 'object') {
            console.log(`   └─ Object response`);
          }
          passed++;
        } else {
          console.log(`⚠️  ${endpoint.name}: Missing success field`);
          passed++;
        }
      } else if (result.status === 200 && !result.isJson) {
        console.log(`❌ ${endpoint.name}: Empty/Non-JSON response`);
        emptyResponses++;
        failed++;
      } else if (result.status === 301 || result.status === 302) {
        console.log(`🔀 ${endpoint.name}: Redirect (${result.status})`);
        failed++;
      } else {
        console.log(`❌ ${endpoint.name}: ${result.status} - ${result.data?.error || 'Error'}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${endpoint.name}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed, ${emptyResponses} empty`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);
  
  if (emptyResponses > 0) {
    console.log('⚠️  WARNING: Some endpoints returned empty/non-JSON responses!');
    console.log('   These need to be fixed to return proper JSON.\n');
  }
  
  return { passed, failed, emptyResponses };
}

runTests().catch(console.error);
