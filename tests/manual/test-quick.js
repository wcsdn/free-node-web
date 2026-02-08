#!/usr/bin/env node
/**
 * Quick Test - Verify character and hero endpoints
 */
const http = require('http');

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8788';
const WALLET = '0x1234567890abcdef1234567890abcdef12345678';

function req(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-Wallet-Auth': `${WALLET}:test_sig`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, parseError: true });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

async function main() {
  console.log('Testing Character/Hero Endpoints...\n');
  
  const tests = [
    { name: 'GET /api/character', path: '/api/character' },
    { name: 'GET /api/character/info', path: '/api/character/info' },
    { name: 'GET /api/hero', path: '/api/hero' },
    { name: 'GET /api/hero/list', path: '/api/hero/list' },
    { name: 'GET /api/city', path: '/api/city' },
    { name: 'GET /api/building', path: '/api/building' },
    { name: 'GET /api/battle', path: '/api/battle' },
    { name: 'GET /api/item', path: '/api/item' },
    { name: 'GET /health', path: '/health' },
  ];

  let ok = 0, fail = 0;
  for (const t of tests) {
    try {
      const r = await req(t.path);
      if (r.status === 200 && r.data && !r.parseError && (r.data.success !== undefined || r.data.status === 'ok')) {
        console.log(`✅ ${t.name}: OK`);
        if (r.data.data !== undefined) {
          const type = Array.isArray(r.data.data) ? `[] (${r.data.data.length})` : '{}';
          console.log(`   └─ ${type}`);
        }
        ok++;
      } else {
        console.log(`❌ ${t.name}: ${r.status} - ${r.parseError ? 'parse error' : JSON.stringify(r.data).substring(50)}`);
        fail++;
      }
    } catch (e) {
      console.log(`❌ ${t.name}: ${e.message}`);
      fail++;
    }
  }
  
  console.log(`\n${ok} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
