/**
 * 前后端集成测试脚本
 * 运行: node tests/integration.test.ts
 */
import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:8789';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

const headers = {
  'Content-Type': 'application/json',
  'X-Wallet-Auth': TEST_WALLET,
};

async function test(endpoint: string, method = 'GET', body?: any) {
  const opts: any = { method, headers };
  if (body) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  const data = await res.json();
  console.log(`[${method}] ${endpoint}:`, data.success ? '✅' : '❌', data.error || 'OK');
  return data;
}

async function runTests() {
  console.log('='.repeat(50));
  console.log('前后端集成测试');
  console.log('='.repeat(50));

  // 1. 健康检查
  console.log('\n📋 健康检查:');
  await test('/health');

  // 2. 繁荣度系统
  console.log('\n🏙️ 繁荣度系统:');
  await test('/api/interior/level');
  await test('/api/interior/levels');
  await test('/api/interior/bonuses');

  // 3. 技能系统
  console.log('\n⚔️ 技能系统:');
  await test('/api/skill/configs');
  await test('/api/skill');

  // 4. 战斗系统
  console.log('\n🎖️ 战斗系统:');
  await test('/api/battle/stats');
  await test('/api/battle/power');

  // 5. 物品锻造
  console.log('\n🔨 物品锻造:');
  await test('/api/item/craft');
  await test('/api/item/craft?type=potion');

  // 6. 科技系统
  console.log('\n🔬 科技系统:');
  await test('/api/tech/list');
  await test('/api/tech/config');

  // 7. 任务系统
  console.log('\n📜 任务系统:');
  await test('/api/daily');
  await test('/api/task');

  console.log('\n' + '='.repeat(50));
  console.log('测试完成！');
  console.log('='.repeat(50));
}

runTests().catch(console.error);
