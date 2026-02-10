/**
 * Ghost Game 接口测试套件
 * 使用正式数据测试前后端接口连通性
 */

import gameApi from '../../services/gameApi';

// 测试配置
const TEST_WALLET = '0x12345...';
const TEST_SIGNATURE = 'test_signature';

// API 基础配置
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8788';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  data?: any;
}

const testResults: TestResult[] = [];

function logTest(name: string, status: 'pass' | 'fail' | 'skip', message?: string, data?: any) {
  testResults.push({ name, status, message, data });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  console.log(`${icon} ${name}: ${message || status}`);
}

// 测试分类
const testCategories = {
  core: '核心功能',
  city: '城市系统',
  hero: '武将系统',
  battle: '战斗系统',
  resource: '资源系统',
  social: '社交系统',
  extend: '扩展系统',
};

// 测试用例定义
const testCases = [
  // 核心功能
  {
    category: 'core',
    name: '服务器状态检查',
    test: async () => {
      try {
        // 直接使用 fetch 测试
        const res = await fetch(`${API_BASE}/api/game/status`);
        if (res.ok) {
          const data = await res.json();
          logTest('服务器状态检查', 'pass', '服务器运行正常', data);
          return true;
        } else {
          logTest('服务器状态检查', 'fail', `HTTP ${res.status}`);
          return false;
        }
      } catch (error: any) {
        logTest('服务器状态检查', 'fail', error.message);
        return false;
      }
    },
  },
  
  // 城市系统
  {
    category: 'city',
    name: '城市列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/game/city/list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('城市列表', 'pass', `获取到 ${data.data?.cities?.length || 0} 个城市`);
          return true;
        }
        logTest('城市列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('城市列表', 'fail', error.message);
        return false;
      }
    },
  },
  
  // 武将系统
  {
    category: 'hero',
    name: '武将列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/game/hero/list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('武将列表', 'pass', `获取到 ${data.data?.heroes?.length || 0} 个武将`);
          return true;
        }
        logTest('武将列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('武将列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 军团系统
  {
    category: 'social',
    name: '军团列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/corps`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('军团列表', 'pass', `获取到 ${data.data?.corps?.length || 0} 个军团`);
          return true;
        }
        logTest('军团列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('军团列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 邮件系统
  {
    category: 'social',
    name: '邮件列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/mail`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('邮件列表', 'pass', `获取到 ${data.data?.mails?.length || 0} 封邮件`);
          return true;
        }
        logTest('邮件列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('邮件列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 商店系统
  {
    category: 'resource',
    name: '商店列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/shop/list?type=1`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('商店列表', 'pass', `获取到 ${data.data?.items?.length || 0} 个商品`);
          return true;
        }
        logTest('商店列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('商店列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 科技系统
  {
    category: 'extend',
    name: '科技列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/technic/list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('科技列表', 'pass', `获取到 ${data.data?.technics?.length || 0} 个科技`);
          return true;
        }
        logTest('科技列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('科技列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 技能系统
  {
    category: 'extend',
    name: '技能列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/skill/list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('技能列表', 'pass', `获取到 ${data.data?.skills?.length || 0} 个技能`);
          return true;
        }
        logTest('技能列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('技能列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 繁荣度系统
  {
    category: 'city',
    name: '繁荣度信息',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/interior/info`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('繁荣度信息', 'pass', '获取成功');
          return true;
        }
        logTest('繁荣度信息', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('繁荣度信息', 'fail', error.message);
        return false;
      }
    },
  },

  // 签到系统
  {
    category: 'resource',
    name: '签到信息',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/signin/info`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('签到信息', 'pass', `连续签到 ${data.data?.consecutiveDays || 0} 天`);
          return true;
        }
        logTest('签到信息', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('签到信息', 'fail', error.message);
        return false;
      }
    },
  },

  // NPC 占领系统
  {
    category: 'extend',
    name: 'NPC 列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/appendant-npc/npc-list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('NPC 列表', 'pass', `获取到 ${data.data?.npcs?.length || 0} 个NPC据点`);
          return true;
        }
        logTest('NPC 列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('NPC 列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 帮会系统
  {
    category: 'social',
    name: '帮会列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/guild/list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('帮会列表', 'pass', `获取到 ${data.data?.guilds?.length || 0} 个帮会`);
          return true;
        }
        logTest('帮会列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('帮会列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 任务系统
  {
    category: 'extend',
    name: '任务列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/task/list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('任务列表', 'pass', `获取到 ${data.data?.tasks?.length || 0} 个任务`);
          return true;
        }
        logTest('任务列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('任务列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 日常任务
  {
    category: 'extend',
    name: '日常任务',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/daily/list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('日常任务', 'pass', `获取到 ${data.data?.tasks?.length || 0} 个日常任务`);
          return true;
        }
        logTest('日常任务', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('日常任务', 'fail', error.message);
        return false;
      }
    },
  },

  // 地图系统
  {
    category: 'city',
    name: '地图信息',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/map/info`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('地图信息', 'pass', `地图尺寸: ${data.data?.width}x${data.data?.height}`);
          return true;
        }
        logTest('地图信息', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('地图信息', 'fail', error.message);
        return false;
      }
    },
  },

  // 副本系统
  {
    category: 'battle',
    name: '副本列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/dungeon/list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('副本列表', 'pass', `获取到 ${data.data?.dungeons?.length || 0} 个副本`);
          return true;
        }
        logTest('副本列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('副本列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 竞技场
  {
    category: 'battle',
    name: '竞技场信息',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/arena/info`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('竞技场信息', 'pass', `排名: #${data.data?.myRank || 0}, 积分: ${data.data?.myScore || 0}`);
          return true;
        }
        logTest('竞技场信息', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('竞技场信息', 'fail', error.message);
        return false;
      }
    },
  },

  // 物品系统
  {
    category: 'resource',
    name: '物品列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/item/list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('物品列表', 'pass', `获取到 ${data.data?.items?.length || 0} 个物品`);
          return true;
        }
        logTest('物品列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('物品列表', 'fail', error.message);
        return false;
      }
    },
  },

  // 市场
  {
    category: 'resource',
    name: '市场列表',
    test: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/market/list`, {
          headers: { 'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}` },
        });
        if (res.ok) {
          const data = await res.json();
          logTest('市场列表', 'pass', `获取到 ${data.data?.listings?.length || 0} 个挂单`);
          return true;
        }
        logTest('市场列表', 'fail', `HTTP ${res.status}`);
        return false;
      } catch (error: any) {
        logTest('市场列表', 'fail', error.message);
        return false;
      }
    },
  },
];

// 运行测试
async function runTests() {
  console.log('='.repeat(70));
  console.log('🎮 Ghost Game API 接口测试');
  console.log('='.repeat(70));
  console.log(`测试地址: ${API_BASE}`);
  console.log(`测试钱包: ${TEST_WALLET}`);
  console.log(`测试签名: ${TEST_SIGNATURE}`);
  console.log(`测试用例: ${testCases.length} 个`);
  console.log('='.repeat(70));
  
  // 按分类运行测试
  const categoryGroups = testCases.reduce((acc, tc) => {
    if (!acc[tc.category]) acc[tc.category] = [];
    acc[tc.category].push(tc);
    return acc;
  }, {} as Record<string, typeof testCases>);

  for (const [category, tests] of Object.entries(categoryGroups)) {
    console.log(`\n📂 ${testCategories[category as keyof typeof testCategories] || category}`);
    console.log('-'.repeat(50));
    
    for (const tc of tests) {
      await tc.test();
    }
  }

  // 统计结果
  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;
  const skipCount = testResults.filter(r => r.status === 'skip').length;

  console.log('\n' + '='.repeat(70));
  console.log('📊 测试结果统计');
  console.log('='.repeat(70));
  console.log(`✅ 通过: ${passCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`⏭️  跳过: ${skipCount}`);
  console.log(`📈 通过率: ${((passCount / testCases.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  return { passCount, failCount, skipCount, total: testCases.length };
}

// 导出测试函数
export { runTests, testCases, testResults };

// 如果在 Node.js 环境运行
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}
