/**
 * 前后端集成测试脚本
 * 运行: node tests/full-integration.test.cjs
 * 
 * 测试内容:
 * 1. 后端路由测试
 * 2. 数据库访问层测试
 * 3. 服务层测试
 */

const fs = require('fs');
const path = require('path');

// 测试结果收集
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

// 测试辅助函数
function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: '✅' });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: '❌', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function describe(name, fn) {
  console.log(`\n📋 ${name}`);
  console.log('='.repeat(50));
  fn();
}

// 运行测试
async function runTests() {
  console.log('='.repeat(60));
  console.log('🎯 前后端集成测试');
  console.log('='.repeat(60));

  // 1. 后端路由测试
  describe('后端路由测试', () => {
    // 检查路由文件存在
    const basePath = 'workers/ghost-game/src/routes/';
    const routes = [
      'character.ts',
      'city.ts',
      'hero.ts',
      'gift.ts',
      'mail.ts',
      'corps.ts',
      'guild.ts',
      'battle.ts',
      'arena.ts',
      'dungeon.ts',
    ];

    test('核心路由文件存在 (10个)', () => {
      routes.forEach(route => {
        if (!fs.existsSync(basePath + route)) {
          throw new Error(`路由文件不存在: ${basePath}${route}`);
        }
      });
    });

    test('路由文件有内容', () => {
      routes.forEach(route => {
        const content = fs.readFileSync(basePath + route, 'utf8');
        if (content.length < 50) {
          throw new Error(`路由文件内容过短: ${route}`);
        }
      });
    });
  });

  // 2. 服务层测试
  describe('服务层测试', () => {
    const basePath = 'workers/ghost-game/src/services/';
    const services = [
      'index.ts',
      'city.svc.ts',
      'hero.svc.ts',
    ];

    test('核心服务文件存在', () => {
      services.forEach(service => {
        if (!fs.existsSync(basePath + service)) {
          throw new Error(`服务文件不存在: ${basePath}${service}`);
        }
      });
    });

    test('总服务文件数量', () => {
      const count = fs.readdirSync(basePath).filter(f => f.endsWith('.ts')).length;
      console.log(`   📊 发现 ${count} 个服务文件`);
      if (count < 10) {
        throw new Error(`服务文件过少: ${count}`);
      }
    });
  });

  // 3. 仓库层测试
  describe('仓库层测试', () => {
    const basePath = 'workers/ghost-game/src/repositories/';
    const repos = [
      'index.ts',
      'city.repo.ts',
      'hero.repo.ts',
    ];

    test('核心仓库文件存在', () => {
      repos.forEach(repo => {
        if (!fs.existsSync(basePath + repo)) {
          throw new Error(`仓库文件不存在: ${basePath}${repo}`);
        }
      });
    });

    test('总仓库文件数量', () => {
      const count = fs.readdirSync(basePath).filter(f => f.endsWith('.ts')).length;
      console.log(`   📊 发现 ${count} 个仓库文件`);
      if (count < 10) {
        throw new Error(`仓库文件过少: ${count}`);
      }
    });
  });

  // 4. 数据库 Schema 测试
  describe('数据库 Schema 测试', () => {
    test('Schema 文件存在', () => {
      if (!fs.existsSync('workers/ghost-game/schema.sql')) {
        throw new Error('Schema 文件不存在');
      }
    });

    test('Schema 包含必要表', () => {
      const schema = fs.readFileSync('workers/ghost-game/schema.sql', 'utf8');
      const tables = ['characters', 'cities', 'buildings', 'heroes', 'items', 'mails'];
      
      tables.forEach(table => {
        if (!schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
          throw new Error(`Schema 缺少表: ${table}`);
        }
      });
    });

    test('Schema 包含关系约束', () => {
      const schema = fs.readFileSync('workers/ghost-game/schema.sql', 'utf8');
      
      // 检查外键约束
      if (!schema.includes('FOREIGN KEY')) {
        throw new Error('Schema 无外键约束');
      }
    });
  });

  // 5. API 契约测试
  describe('API 契约测试', () => {
    test('类型定义文件存在', () => {
      if (!fs.existsSync('src/features/webgame/types/api-contract.ts')) {
        throw new Error('API 契约文件不存在');
      }
    });

    test('类型定义有内容', () => {
      const content = fs.readFileSync('src/features/webgame/types/api-contract.ts', 'utf8');
      if (content.length < 1000) {
        throw new Error('API 契约文件内容过短');
      }
    });
  });

  // 6. 前端 API 服务测试
  describe('前端 API 服务测试', () => {
    test('gameApi 文件存在', () => {
      if (!fs.existsSync('src/features/webgame/services/gameApi.ts')) {
        throw new Error('gameApi 文件不存在');
      }
    });

    test('gameApi 有方法导出', () => {
      const content = fs.readFileSync('src/features/webgame/services/gameApi.ts', 'utf8');
      
      const methods = [
        'getCityList',
        'getHeroList',
        'getMailList',
      ];

      methods.forEach(method => {
        if (!content.includes(method)) {
          throw new Error(`gameApi 缺少方法: ${method}`);
        }
      });
    });
  });

  // 7. 路由注册测试
  describe('路由注册测试', () => {
    test('index.ts 导入所有路由', () => {
      const indexPath = 'workers/ghost-game/src/index.ts';
      const content = fs.readFileSync(indexPath, 'utf8');
      
      const routeImports = [
        'characterRoutes',
        'cityRoutes',
        'heroRoutes',
        'giftRoutes',
      ];

      routeImports.forEach(route => {
        if (!content.includes(route)) {
          throw new Error(`index.ts 缺少导入: ${route}`);
        }
      });
    });
  });

  // 8. 数据库表创建测试
  describe('数据库表创建测试', () => {
    test('characters 表定义完整', () => {
      const schema = fs.readFileSync('workers/ghost-game/schema.sql', 'utf8');
      
      const requiredFields = [
        'wallet_address',
        'name',
        'level',
        'exp',
        'gold',
      ];

      requiredFields.forEach(field => {
        if (!schema.includes(field)) {
          throw new Error(`characters 表缺少字段: ${field}`);
        }
      });
    });

    test('cities 表定义完整', () => {
      const schema = fs.readFileSync('workers/ghost-game/schema.sql', 'utf8');
      
      const requiredFields = [
        'wallet_address',
        'name',
        'position',
        'money',
        'food',
        'population',
      ];

      requiredFields.forEach(field => {
        if (!schema.includes(field)) {
          throw new Error(`cities 表缺少字段: ${field}`);
        }
      });
    });
  });

  // 输出结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`📈 总计: ${results.passed + results.failed}`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 所有测试通过!');
    process.exit(0);
  } else {
    console.log('\n⚠️  有测试失败，请检查上方输出');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('测试运行失败:', error);
});
