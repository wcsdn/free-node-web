/**
 * Free-Node Web Game - API Integration Test
 */
const http = require('http');

const API_BASE = 'http://127.0.0.1:8788';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f7b7b2';
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
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
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
  console.log('\n🧪 Free-Node Web Game - API Integration Tests\n');
  console.log('Server:', API_BASE);
  console.log('Wallet:', TEST_WALLET);
  console.log('='.repeat(50));

  const tests = [
    // Main routes
    { name: 'character (GET)', path: '/api/character' },
    { name: 'city (GET)', path: '/api/city' },
    { name: 'hero (GET)', path: '/api/hero' },
    { name: 'building (GET)', path: '/api/building' },
    { name: 'battle (GET)', path: '/api/battle' },
    { name: 'task (GET)', path: '/api/task' },
    { name: 'mail (GET)', path: '/api/mail' },
    { name: 'shop (GET)', path: '/api/shop' },
    { name: 'market (GET)', path: '/api/market' },
    { name: 'arena (GET)', path: '/api/arena' },
    { name: 'rank (GET)', path: '/api/rank' },
    { name: 'dungeon (GET)', path: '/api/dungeon' },
    { name: 'item (GET)', path: '/api/item' },
    { name: 'skill (GET)', path: '/api/skill' },
    { name: 'tech (GET)', path: '/api/tech' },
    { name: 'daily (GET)', path: '/api/daily' },
    { name: 'signin (GET)', path: '/api/signin' },
    { name: 'notification (GET)', path: '/api/notification' },
    { name: 'chat (GET)', path: '/api/chat' },
    { name: 'defense (GET)', path: '/api/defense' },
    { name: 'military (GET)', path: '/api/military' },
    { name: 'activity (GET)', path: '/api/activity' },
    { name: 'item/craft (GET)', path: '/api/item/craft' },
    
    // Nested routes
    { name: 'city/buildings (GET)', path: '/api/city/buildings' },
    { name: 'corps (GET)', path: '/api/corps' },
    { name: 'corps (POST)', path: '/api/corps', method: 'POST', body: { name: 'Test Corps', cityId: 1, formation: 0 } },
    { name: 'corps/member (GET)', path: '/api/corps/member' },
    
    // Health check
    { name: 'health', path: '/health' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await makeRequest(test.path, test.method || 'GET', test.body);
      
      if (result.status === 200 && result.data?.success) {
        console.log(`✅ ${test.name}: OK`);
        if (result.data.data) {
          const dataStr = Array.isArray(result.data.data) 
            ? `(${result.data.data.length} items)` 
            : JSON.stringify(result.data.data).substring(0, 30);
          console.log(`   └─ ${dataStr}`);
        }
        passed++;
      } else if (result.status === 200) {
        console.log(`✅ ${test.name}: OK (${result.data.status || 'ok'})`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: ${result.status} - ${result.data?.error || result.data || 'Unknown error'}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);
  
  return { passed, failed };
}

runTests().catch(console.error);
