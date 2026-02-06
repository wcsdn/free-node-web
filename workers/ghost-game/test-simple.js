/**
 * Simple API Test Script
 */
const http = require('http');

const API_BASE = 'http://127.0.0.1:8788';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f7b7b2';
const TEST_SIGNATURE = 'test_signature';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
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
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Free-Node Web Game - API Integration Tests\n');
  console.log('Server:', API_BASE);
  console.log('Wallet:', TEST_WALLET);
  console.log('='.repeat(50));

  const endpoints = [
    '/api/character',
    '/api/city',
    '/api/city/buildings',
    '/api/hero',
    '/api/building',
    '/api/corps',
    '/api/battle',
    '/api/task',
    '/api/mail',
    '/api/shop',
    '/api/arena',
    '/api/rank',
    '/api/dungeon',
    '/api/item',
    '/api/skill',
    '/api/tech',
    '/api/daily',
    '/api/signin',
    '/api/notification',
    '/api/chat',
    '/api/defense',
    '/api/military',
    '/api/activity',
    '/api/market',
    '/api/item-craft'
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(endpoint);
      const name = endpoint.replace('/api/', '');
      
      if (result.status === 200 && result.data.success) {
        console.log(`✅ ${name}: OK`);
        passed++;
      } else {
        console.log(`❌ ${name}: ${result.status} - ${result.data.error || JSON.stringify(result.data).substring(0, 50)}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${endpoint}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);
}

runTests().catch(console.error);
