import { test, expect, request } from '@playwright/test';

// Test Wallet Address
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const AUTH_HEADER = `${TEST_WALLET}:test_signature`;

// API Base URL
const API_BASE = 'http://127.0.0.1:8788';
const FRONTEND_BASE = 'http://127.0.0.1:5173';

const headers = {
  'X-Wallet-Auth': AUTH_HEADER,
  'Content-Type': 'application/json',
};

// 测试前先确认服务已启动
test.beforeAll(async () => {
  // 检查后端服务
  const ctx = await request.newContext();
  const response = await ctx.get(`${API_BASE}/api/game/status`);
  console.log('后端服务状态:', response.status());
});

test.describe('前后端联调测试', () => {
  
  test.describe('1. 用户认证与注册', () => {
    test('用户登录自动注册', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/game/user-info`, { headers });
      
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('ID');
      console.log('✅ 用户登录成功:', body.data?.Name || 'Unknown');
    });
  });

  test.describe('2. 城市系统', () => {
    test('获取城市内饰信息', async () => {
      const ctx = await request.newContext();
      const userResponse = await ctx.get(`${API_BASE}/api/game/user-info`, { headers });
      const userData = await userResponse.json();
      const cityId = userData.data?.CityList?.[0]?.ID || 1;

      const response = await ctx.post(`${API_BASE}/api/game/city/interior-info/${cityId}`, { headers });
      
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✅ 城市内饰信息获取成功');
    });
  });

  test.describe('3. 武将系统', () => {
    test('获取武将列表', async () => {
      const ctx = await request.newContext();
      const response = await ctx.post(`${API_BASE}/api/hero/list`, { 
        headers,
        data: { city_id: 1 }
      });
      
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✅ 武将列表获取成功, 数量:', body.data?.length || 0);
    });
  });

  test.describe('4. 帮会系统', () => {
    test('获取帮会列表', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/guild/list`, { headers });
      
      expect(response.status()).toBe(200);
      console.log('✅ 帮会列表获取成功');
    });

    test('获取我的帮会信息', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/guild/my-info`, { headers });
      
      expect(response.status()).toBe(200);
      const body = await response.json();
      console.log('✅ 我的帮会信息:', body.data?.guildName || '暂无帮会');
    });
  });

  test.describe('5. 邮件系统', () => {
    test('获取邮件列表', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/mail/new`, { headers });
      
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✅ 邮件列表获取成功');
    });

    test('获取新邮件数量', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/mail/new-count`, { headers });
      
      expect(response.status()).toBe(200);
      console.log('✅ 新邮件数量获取成功');
    });
  });

  test.describe('6. 排行榜系统', () => {
    test('获取战斗力排行榜', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/rank/list`, {
        headers,
        params: { rank_type: 2, page: 1, pageSize: 10 }
      });
      
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✅ 战斗力排行榜获取成功');
    });
  });

  test.describe('7. 战斗系统', () => {
    test('获取棋盘状态', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/battle/chess/board`, {
        headers,
        params: { pos: 0 }
      });
      
      expect(response.status()).toBe(200);
      console.log('✅ 棋盘状态获取成功');
    });

    test('获取战斗状态', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/battle/state`, {
        headers,
        params: { pos: 0 }
      });
      
      expect(response.status()).toBe(200);
      console.log('✅ 战斗状态获取成功');
    });
  });

  test.describe('8. 地图系统', () => {
    test('获取地形信息', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/map/world/landform`, {
        headers,
        params: { city_id: 1, pos: 0 }
      });
      
      expect(response.status()).toBe(200);
      console.log('✅ 地形信息获取成功');
    });

    test('获取位置状态', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/map/world/pos-state`, {
        headers,
        params: { pos: 0 }
      });
      
      expect(response.status()).toBe(200);
      console.log('✅ 位置状态获取成功');
    });
  });

  test.describe('9. 物品系统', () => {
    test('获取物品列表', async () => {
      const ctx = await request.newContext();
      const response = await ctx.get(`${API_BASE}/api/item`, {
        headers,
        params: { city_id: 1, item_type: 0, page: 1 }
      });
      
      expect(response.status()).toBe(200);
      console.log('✅ 物品列表获取成功');
    });
  });
});
