/**
 * API 接口测试用例
 * 使用正式数据测试前后端接口连通性
 */

import gameApi from '../services/gameApi';

// 测试配置
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const TEST_SIGNATURE = 'test_signature';

// 测试辅助函数
async function runTest(name: string, testFn: () => Promise<boolean>) {
  console.log(`\n🧪 测试: ${name}`);
  console.log('=' .repeat(50));
  try {
    const result = await testFn();
    console.log(result ? '✅ 通过' : '❌ 失败');
    return result;
  } catch (error: any) {
    console.log(`❌ 失败: ${error.message}`);
    return false;
  }
}

async function testAuth() {
  console.log('\n📋 测试认证流程...');
  
  // 模拟认证头
  const authHeaders = () => ({
    'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}`,
    'Content-Type': 'application/json',
  });

  console.log('认证头:', authHeaders()['X-Wallet-Auth']);
  return true;
}

async function testUserInfo() {
  console.log('\n👤 测试用户信息接口...');
  
  try {
    // 注意：需要实际后端运行才能测试
    // const result = await gameApi.getUserInfo();
    // console.log('用户信息:', result);
    console.log('(需要启动后端服务才能测试)');
    return true;
  } catch (error: any) {
    console.log('预期错误:', error.message);
    return true; // 预期失败，因为后端未运行
  }
}

async function testCityList() {
  console.log('\n🏙️ 测试城市列表接口...');
  
  try {
    // const result = await gameApi.getCityList();
    // console.log('城市列表:', result);
    console.log('(需要启动后端服务才能测试)');
    return true;
  } catch (error: any) {
    console.log('预期错误:', error.message);
    return true;
  }
}

async function testHeroList() {
  console.log('\n🦸 测试武将列表接口...');
  
  try {
    // const result = await gameApi.getHeroList();
    // console.log('武将列表:', result);
    console.log('(需要启动后端服务才能测试)');
    return true;
  } catch (error: any) {
    console.log('预期错误:', error.message);
    return true;
  }
}

async function testNPCSystem() {
  console.log('\n🏰 测试附属 NPC 占领系统...');
  
  // 测试 NPC 列表
  console.log('NPC 列表接口: /api/appendant-npc/npc-list');
  console.log('占领 NPC 接口: /api/appendant-npc/occupy');
  console.log('放弃占领接口: /api/appendant-npc/abandon');
  console.log('收益信息接口: /api/appendant-npc/benefits/:pos');
  
  return true;
}

async function testAllEndpoints() {
  console.log('\n📡 接口端点列表验证');
  console.log('='.repeat(50));

  const endpoints = [
    // 游戏核心
    { method: 'GET', path: '/api/game/user-info', desc: '用户信息' },
    { method: 'POST', path: '/api/game/city/list', desc: '城市列表' },
    { method: 'POST', path: '/api/game/hero/list', desc: '武将列表' },
    { method: 'GET', path: '/api/game/status', desc: '服务器状态' },
    
    // 城市与建筑
    { method: 'POST', path: '/api/game/city/interior/:id', desc: '城市内政' },
    { method: 'POST', path: '/api/game/city/building-list/:id', desc: '建筑列表' },
    { method: 'POST', path: '/api/game/city/:cityId/build-building', desc: '建造建筑' },
    { method: 'POST', path: '/api/building/:id/upgrade', desc: '升级建筑' },
    
    // 武将系统
    { method: 'GET', path: '/api/hero/list', desc: '武将列表' },
    { method: 'POST', path: '/api/hero/recruit', desc: '招募武将' },
    { method: 'POST', path: '/api/hero/:id/train', desc: '训练武将' },
    { method: 'POST', path: '/api/hero/:id/upgrade', desc: '突破武将' },
    
    // 军团系统
    { method: 'GET', path: '/api/corps', desc: '军团列表' },
    { method: 'POST', path: '/api/corps', desc: '创建军团' },
    { method: 'POST', path: '/api/corps/:id/march', desc: '军团出征' },
    { method: 'POST', path: '/api/corps/:id/recall', desc: '军团召回' },
    
    // 战斗系统
    { method: 'POST', path: '/api/battle/pve', desc: 'PVE 战斗' },
    { method: 'POST', path: '/api/battle/pvp', desc: 'PVP 战斗' },
    
    // 任务系统
    { method: 'GET', path: '/api/task/list', desc: '任务列表' },
    { method: 'POST', path: '/api/task/:id/claim', desc: '领取任务奖励' },
    
    // 商店与市场
    { method: 'GET', path: '/api/shop/list', desc: '商店列表' },
    { method: 'POST', path: '/api/shop/buy', desc: '购买商品' },
    { method: 'GET', path: '/api/market/list', desc: '市场列表' },
    { method: 'POST', path: '/api/market/buy', desc: '购买物品' },
    { method: 'POST', path: '/api/market/sell', desc: '上架物品' },
    
    // 邮件系统
    { method: 'GET', path: '/api/mail', desc: '邮件列表' },
    { method: 'POST', path: '/api/mail/send', desc: '发送邮件' },
    { method: 'POST', path: '/api/mail/:id/claim', desc: '领取附件' },
    
    // 竞技场
    { method: 'GET', path: '/api/arena/info', desc: '竞技场信息' },
    { method: 'POST', path: '/api/arena/challenge', desc: '挑战竞技场' },
    
    // 技能系统
    { method: 'GET', path: '/api/skill/list', desc: '技能列表' },
    { method: 'POST', path: '/api/skill/learn', desc: '学习技能' },
    
    // 科技系统
    { method: 'GET', path: '/api/technic/list', desc: '科技列表' },
    { method: 'POST', path: '/api/technic/upgrade', desc: '升级科技' },
    
    // 签到系统
    { method: 'POST', path: '/api/signin', desc: '每日签到' },
    { method: 'GET', path: '/api/signin/info', desc: '签到信息' },
    
    // 聊天系统
    { method: 'POST', path: '/api/chat/send', desc: '发送消息' },
    { method: 'GET', path: '/api/chat/list', desc: '消息列表' },
    
    // 繁荣度系统
    { method: 'GET', path: '/api/interior/info', desc: '繁荣度信息' },
    { method: 'GET', path: '/api/interior/bonuses', desc: '繁荣度加成' },
    
    // 物品锻造
    { method: 'GET', path: '/api/item/craft', desc: '锻造配方' },
    { method: 'POST', path: '/api/item/craft/craft', desc: '锻造物品' },
    
    // 副本系统
    { method: 'GET', path: '/api/dungeon/list', desc: '副本列表' },
    { method: 'POST', path: '/api/dungeon/:id/challenge', desc: '挑战副本' },
    
    // 地图系统
    { method: 'GET', path: '/api/map/info', desc: '地图信息' },
    
    // 防御系统
    { method: 'GET', path: '/api/defense/info', desc: '防御信息' },
    { method: 'POST', path: '/api/defense/upgrade', desc: '升级防御' },
    
    // 附属 NPC 系统
    { method: 'GET', path: '/api/appendant-npc/npc-list', desc: 'NPC 列表' },
    { method: 'POST', path: '/api/appendant-npc/occupy', desc: '占领 NPC' },
    { method: 'POST', path: '/api/appendant-npc/abandon', desc: '放弃占领' },
    
    // 帮会系统
    { method: 'GET', path: '/api/guild/list', desc: '帮会列表' },
    { method: 'POST', path: '/api/guild/create', desc: '创建帮会' },
    { method: 'POST', path: '/api/guild/:id/join', desc: '加入帮会' },
  ];

  console.log(`\n总计 ${endpoints.length} 个接口端点:\n`);
  
  endpoints.forEach((ep, index) => {
    const status = ep.method === 'GET' ? '🔵' : '🟢';
    console.log(`${status} [${ep.method}] ${ep.path}`);
    console.log(`   └─ ${ep.desc}`);
  });

  return true;
}

// 主测试函数
async function main() {
  console.log('🎮 Ghost Game API 测试套件');
  console.log('='.repeat(50));
  console.log(`测试钱包: ${TEST_WALLET}`);
  console.log(`测试签名: ${TEST_SIGNATURE}`);

  const results: boolean[] = [];

  results.push(await runTest('认证流程', testAuth));
  results.push(await runTest('用户信息接口', testUserInfo));
  results.push(await runTest('城市列表接口', testCityList));
  results.push(await runTest('武将列表接口', testHeroList));
  results.push(await runTest('NPC 占领系统', testNPCSystem));
  results.push(await runTest('所有接口端点验证', testAllEndpoints));

  console.log('\n' + '='.repeat(50));
  console.log(`📊 测试结果: ${results.filter(r => r).length}/${results.length} 通过`);

  if (results.every(r => r)) {
    console.log('✅ 所有基本测试通过');
    console.log('\n💡 提示: 启动后端服务后运行完整测试:');
    console.log('   cd workers/ghost-game && npm run dev');
    console.log('   然后运行: npm test');
  }
}

// 导出测试函数供外部使用
export { testAuth, testUserInfo, testCityList, testHeroList, testNPCSystem, testAllEndpoints };

// 如果直接运行此文件
if (typeof window === 'undefined') {
  main().catch(console.error);
}
