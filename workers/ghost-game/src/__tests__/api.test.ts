/**
 * Unit Tests - 前端-后端接口验证测试
 * 测试关键接口：用户注册、城市、军团、武将
 */
import { describe, test, expect } from 'vitest';

// 测试配置
const API_BASE = process.env.API_BASE || 'http://localhost:8788';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const TEST_SIGNATURE = 'test_signature';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============ Helper Functions ============

async function post<T>(endpoint: string, body: object): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

// ============ Test Suite ============

describe('API Interface Tests', () => {
  
  test('User Registration - 用户注册/自动创建', async () => {
    const response = await post<{
      user: any;
      cities: any[];
      cityCount: number;
    }>('/api/game/user-info', {
      wallet_address: TEST_WALLET,
      signature: TEST_SIGNATURE,
    });

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.cities).toBeDefined();
    expect(response.data.cities.length).toBeGreaterThanOrEqual(1);
    expect(response.data.cityCount).toBeGreaterThanOrEqual(1);
  });

  test('City List - 获取城市列表', async () => {
    const response = await post<any[]>('/api/game/city/list', {
      wallet_address: TEST_WALLET,
      signature: TEST_SIGNATURE,
    });

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('Hero List - 获取武将列表', async () => {
    const response = await post<any[]>('/api/game/hero/list', {
      wallet_address: TEST_WALLET,
      signature: TEST_SIGNATURE,
    });

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('Corps List - 获取军团列表', async () => {
    const response = await post<any[]>('/api/game/corps/list', {
      wallet_address: TEST_WALLET,
      signature: TEST_SIGNATURE,
    });

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
  });
});

// ============ Repository Layer Tests ============

describe('Repository Layer Tests', () => {
  
  test('Repository exports - 仓储层导出', async () => {
    const repos = await import('../repositories');
    
    // 保留的repo
    expect(repos.cityRepo).toBeDefined();
    expect(repos.heroRepo).toBeDefined();
    expect(repos.itemRepo).toBeDefined();
    expect(repos.skillRepo).toBeDefined();
    expect(repos.technicRepo).toBeDefined();
    expect(repos.defenceRepo).toBeDefined();
    expect(repos.npcFloorRepo).toBeDefined();
    expect(repos.serverRepo).toBeDefined();
  });

  test('Service exports - 服务层导出', async () => {
    const services = await import('../services');
    
    expect(services.cityService).toBeDefined();
    expect(services.heroService).toBeDefined();
    expect(services.corpsService).toBeDefined();
    expect(services.buildingService).toBeDefined();
    expect(services.skillService).toBeDefined();
    expect(services.itemService).toBeDefined();
    expect(services.mailService).toBeDefined();
    expect(services.technicService).toBeDefined();
    expect(services.defenceService).toBeDefined();
    expect(services.npcFloorService).toBeDefined();
    expect(services.userService).toBeDefined();
    expect(services.fightService).toBeDefined();
  });
});
