#!/usr/bin/env node
/**
 * 前后端集成测试脚本 (纯 JS)
 */
const http = require('http');

const API_BASE = 'http://localhost:8788';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

function test(endpoint, callback) {
  const url = new URL(API_BASE + endpoint);
  const opts = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'X-Wallet-Auth': TEST_WALLET,
    },
  };

  const req = http.request(opts, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`[GET] ${endpoint}:`, json.success ? '✅' : '❌', json.error || 'OK');
        callback(null, json);
      } catch (e) {
        console.log(`[GET] ${endpoint}: ❌ Parse error`);
        callback(e);
      }
    });
  });

  req.on('error', (e) => {
    console.log(`[GET] ${endpoint}: ❌ Network error`);
    callback(e);
  });

  req.end();
}

async function runTests() {
  console.log('='.repeat(50));
  console.log('前后端集成测试');
  console.log('='.repeat(50));

  const tests = [
    '/health',
    '/api/interior/level',
    '/api/interior/levels',
    '/api/interior/bonuses',
    '/api/skill/configs',
    '/api/skill',
    '/api/battle/stats',
    '/api/battle/power',
    '/api/item/craft',
    '/api/tech',                    // 科技列表
    '/api/tech/configs',            // 科技配置
    '/api/tech/effects',           // 科技效果
    '/api/daily',
    '/api/task',
  ];

  for (const endpoint of tests) {
    await new Promise(resolve => {
      test(endpoint, () => resolve());
    });
    await new Promise(r => setTimeout(r, 100)); // 延迟
  }

  console.log('\n' + '='.repeat(50));
  console.log('测试完成！');
  console.log('='.repeat(50));
}

runTests().catch(console.error);
