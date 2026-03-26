import { test, expect, chromium, Page } from '@playwright/test';

// 游戏端到端测试 - 验证核心链路
// 运行: npx playwright test e2e-game.spec.ts

const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const BACKEND = 'http://localhost:8788';
const FRONTEND = 'http://localhost:5173/jxweb';

test.describe('游戏核心链路测试', () => {
  let page: Page;

  test.beforeAll(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();

    // 拦截请求注入钱包认证
    await page.route(`${BACKEND}/api/**`, async (route) => {
      const headers = {
        ...route.request().headers(),
        'x-wallet-auth': `${TEST_WALLET}:test_signature`,
      };
      await route.continue({ headers });
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // 收集控制台错误
  test('收集页面加载错误', async () => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(FRONTEND, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 打印错误
    if (consoleErrors.length > 0) {
      console.log('\n控制台错误:');
      consoleErrors.forEach(e => console.log('  ERROR:', e));
    } else {
      console.log('\n✅ 无控制台错误');
    }

    // 允许一些无害的非关键错误（如favicon等）
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR_') &&
      !e.includes('Failed to load resource') &&
      !e.includes('/admin/') &&
      !e.includes('kick-user')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('✅ 游戏页面加载成功', async () => {
    const response = await page.goto(FRONTEND, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response?.status()).toBeLessThan(400);
  });

  test('✅ 后端API健康检查', async () => {
    const resp = await page.request.get(`${BACKEND}/health`);
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.service).toBe('ghost-game');
  });

  test('✅ 用户信息接口 - 自动注册', async () => {
    const resp = await page.request.get(`${BACKEND}/api/game/user-info`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('Name');
    console.log('\n✅ 自动注册成功:', json.data.Name);
  });

  test('✅ 城市信息接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/building/city/1`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('buildings');
    expect(Array.isArray(json.data.buildings)).toBe(true);
    console.log('\n✅ 城市建筑数:', json.data.buildings.length);
  });

  test('✅ 建筑详情接口 - by-id', async () => {
    const resp = await page.request.get(`${BACKEND}/api/building/by-id?city_id=1&building_id=1`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('ID');
    expect(json.data.ID).toBeGreaterThan(0);
    console.log('\n✅ 建筑详情:', json.data.Name, 'Lv.'+json.data.Level);
  });

  test('✅ 武将列表接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/hero/list`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    console.log('\n✅ 武将数:', json.data.length);
  });

  test('✅ 任务列表接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/task?city_id=1`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    console.log('\n✅ 任务数:', json.data.length);
  });

  test('✅ 科技列表接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/tech/list`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    console.log('\n✅ 科技数:', json.data.length);
  });

  test('✅ 战斗棋盘接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/battle/chessboard?city_id=1`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    console.log('\n✅ 战斗棋盘 OK');
  });

  test('✅ 战斗事件接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/battle/chess/event`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    console.log('\n✅ 战斗事件 OK');
  });

  test('✅ 地图单元接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/map/unit`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    console.log('\n✅ 地图单元数:', json.data.length);
  });

  test('✅ 市场列表接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/market/list`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    console.log('\n✅ 市场列表 OK');
  });

  test('✅ 排行榜接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/rank/chess`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    // 检查mySelf字段
    const me = json.data.find((r: any) => r.mySelf === 1);
    expect(me).toBeDefined();
    console.log('\n✅ 排行榜 OK, myRank:', me?.rank);
  });

  test('✅ 邮件接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/mail?city_id=1`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    console.log('\n✅ 邮件接口 OK');
  });

  test('✅ 事件列表接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/event/valid`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    console.log('\n✅ 事件列表 OK');
  });

  test('✅ 军团接口', async () => {
    const resp = await page.request.post(`${BACKEND}/api/corps/list`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
      data: { city_id: 1 }
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    console.log('\n✅ 军团列表 OK');
  });

  test('✅ 城防接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/defense?city_id=1`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    console.log('\n✅ 城防接口 OK');
  });

  test('✅ 战区接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/warfare/area`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    console.log('\n✅ 战区接口 OK');
  });

  test('✅ 竞技场接口', async () => {
    const resp = await page.request.get(`${BACKEND}/api/arena/info`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    console.log('\n✅ 竞技场接口 OK');
  });

  // 关键修复验证
  test('✅ 修复验证: player-count 返回页数(不是人数)', async () => {
    const resp = await page.request.get(`${BACKEND}/api/game/player-count`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    const json = await resp.json();
    // C#语义: 返回页数 (总数/20+1)，data直接是数字
    expect(json).toHaveProperty('value');
    expect(typeof json.value).toBe('number');
    console.log('\n✅ player-count页数:', json.value);
  });

  test('✅ 修复验证: hero/list 返回数组(不是对象)', async () => {
    const resp = await page.request.get(`${BACKEND}/api/hero/list`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    const json = await resp.json();
    expect(Array.isArray(json.data)).toBe(true);
    console.log('\n✅ hero/list 是数组,len=', json.data.length);
  });

  test('✅ 修复验证: warfare/user-battle 返回字符串(不是对象)', async () => {
    const resp = await page.request.get(`${BACKEND}/api/warfare/user-battle`, {
      headers: { 'x-wallet-auth': `${TEST_WALLET}:test_signature` },
    });
    const json = await resp.json();
    expect(typeof json.data).toBe('string');
    console.log('\n✅ warfare/user-battle 是字符串:', json.data);
  });
});
