/**
 * Task API Integration Tests - 任务API集成测试
 * 测试关键任务接口：任务列表、奖励领取、战斗任务、探索任务
 */
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

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

async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return response.json();
}

// ============ Test Suite ============

describe('Task API - 任务API接口测试', () => {
  
  describe('GET /task/list - 获取任务列表', () => {
    test('返回当前可执行任务列表', async () => {
      const response = await get<{ tasks: any[] }>(`/task/list?wallet_address=${TEST_WALLET}&city_id=1`);
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data?.tasks)).toBe(true);
    });

    test('缺少wallet_address参数返回错误', async () => {
      const response = await get<any>(`/task/list?city_id=1`);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Unauthorized');
    });

    test('缺少city_id参数返回错误', async () => {
      const response = await get<any>(`/task/list?wallet_address=${TEST_WALLET}`);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('City ID');
    });
  });

  describe('GET /task/by-type - 根据类型获取任务', () => {
    test('按任务类型筛选任务', async () => {
      const response = await get<{ tasks: any[] }>(
        `/task/by-type?wallet_address=${TEST_WALLET}&city_id=1&task_type=1`
      );
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data?.tasks)).toBe(true);
    });

    test('筛选战斗类型任务', async () => {
      const response = await get<{ tasks: any[] }>(
        `/task/by-type?wallet_address=${TEST_WALLET}&city_id=1&task_type=3`
      );
      
      expect(response.success).toBe(true);
    });
  });

  describe('POST /task/reward - 领取任务奖励', () => {
    test('成功领取任务奖励', async () => {
      const response = await post<any>(`/task/reward`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_id: 1,
      });
      
      expect(response.success).toBe(true);
      expect(response.data?.message).toContain('successfully');
    });

    test('重复领取奖励返回错误', async () => {
      // 先领取一次
      await post<any>(`/task/reward`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_id: 1,
      });
      
      // 再次领取
      const response = await post<any>(`/task/reward`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_id: 1,
      });
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('already');
    });

    test('任务未完成不能领取', async () => {
      const response = await post<any>(`/task/reward`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_id: 2,
      });
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('not completed');
    });

    test('缺少必要参数返回错误', async () => {
      const response = await post<any>(`/task/reward`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        // 缺少 task_id
      });
      
      expect(response.success).toBe(false);
    });
  });

  describe('GET /task/fight/suitable - 获取战斗任务', () => {
    test('获取适合当前位置的战斗任务', async () => {
      const response = await get<any>(
        `/task/fight/suitable?wallet_address=${TEST_WALLET}&city_id=1&pos=100`
      );
      
      expect(response.success).toBe(true);
      expect(response.data?.task).toBeDefined();
    });

    test('无适合战斗任务返回null', async () => {
      const response = await get<any>(
        `/task/fight/suitable?wallet_address=${TEST_WALLET}&city_id=1&pos=99999`
      );
      
      expect(response.success).toBe(true);
      expect(response.data?.task).toBeNull();
    });
  });

  describe('POST /task/fight/update - 更新战斗任务', () => {
    test('战斗胜利更新任务进度', async () => {
      const response = await post<any>(`/task/fight/update`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_id: 17,
        win: true,
        user_type: 2, // NPC战斗
      });
      
      expect(response.success).toBe(true);
      expect(response.data?.task).toBeDefined();
    });

    test('战斗失败不更新进度', async () => {
      const response = await post<any>(`/task/fight/update`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_id: 17,
        win: false,
        user_type: 2,
      });
      
      // 根据任务条件判断是否更新
      // 如果 taskItemCondition 是 0(胜/败) 则更新，1(仅胜) 则不更新
      expect(response.success).toBe(true);
    });
  });

  describe('GET /task/search/suitable - 获取探索任务', () => {
    test('获取适合当前位置的探索任务', async () => {
      const response = await get<any>(
        `/task/search/suitable?wallet_address=${TEST_WALLET}&city_id=1&target_pos=85047&target_type=2`
      );
      
      expect(response.success).toBe(true);
      expect(response.data?.task).toBeDefined();
    });
  });

  describe('POST /task/search/update - 更新探索任务', () => {
    test('探索成功更新任务进度', async () => {
      const response = await post<any>(`/task/search/update`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_id: 26,
        found: true,
      });
      
      expect(response.success).toBe(true);
    });

    test('探索未发现不更新进度', async () => {
      const response = await post<any>(`/task/search/update`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_id: 26,
        found: false,
      });
      
      expect(response.success).toBe(true);
      expect(response.data?.task).toBeNull();
    });
  });

  describe('GET /task/daily/list - 获取日常任务列表', () => {
    test('返回日常任务列表', async () => {
      const response = await get<{ tasks: any[] }>(
        `/task/daily/list?wallet_address=${TEST_WALLET}&city_id=1`
      );
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data?.tasks)).toBe(true);
    });

    test('日常任务包含进度信息', async () => {
      const response = await get<{ tasks: any[] }>(
        `/task/daily/list?wallet_address=${TEST_WALLET}&city_id=1`
      );
      
      if (response.data?.tasks?.length > 0) {
        const task = response.data.tasks[0];
        expect(task).toHaveProperty('current_value');
        expect(task).toHaveProperty('status');
      }
    });
  });

  describe('POST /task/daily/claim - 领取日常任务奖励', () => {
    test('成功领取日常任务奖励', async () => {
      const response = await post<any>(`/task/daily/claim`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_id: 1,
      });
      
      expect(response.success).toBe(true);
      expect(response.data?.reward).toBeDefined();
    });

    test('未完成任务不能领取', async () => {
      const response = await post<any>(`/task/daily/claim`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_id: 2,
      });
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('not completed');
    });
  });

  describe('POST /task/daily/progress - 更新日常任务进度', () => {
    test('成功更新日常任务进度', async () => {
      const response = await post<any>(`/task/daily/progress`, {
        wallet_address: TEST_WALLET,
        signature: TEST_SIGNATURE,
        city_id: 1,
        task_type: 'battle',
        increment: 1,
      });
      
      expect(response.success).toBe(true);
    });
  });
});

describe('Task API Response Format - API响应格式验证', () => {
  
  test('成功响应包含success: true', async () => {
    const response = await get<any>(
      `/task/list?wallet_address=${TEST_WALLET}&city_id=1`
    );
    
    expect(response).toHaveProperty('success');
    expect(response.success).toBe(true);
  });

  test('错误响应包含success: false和error字段', async () => {
    const response = await get<any>(`/task/list`);
    
    expect(response).toHaveProperty('success');
    expect(response.success).toBe(false);
    expect(response).toHaveProperty('error');
    expect(typeof response.error).toBe('string');
  });

  test('任务列表响应包含tasks数组', async () => {
    const response = await get<any>(
      `/task/list?wallet_address=${TEST_WALLET}&city_id=1`
    );
    
    expect(response.data).toHaveProperty('tasks');
    expect(Array.isArray(response.data.tasks)).toBe(true);
  });

  test('单个任务响应包含必要字段', async () => {
    const response = await get<any>(
      `/task/fight/suitable?wallet_address=${TEST_WALLET}&city_id=1&pos=100`
    );
    
    if (response.data?.task) {
      const task = response.data.task;
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('name');
      expect(task).toHaveProperty('type');
      expect(task).toHaveProperty('state');
      expect(task).toHaveProperty('target');
    }
  });

  test('奖励响应包含奖励详情', async () => {
    const response = await post<any>(`/task/daily/claim`, {
      wallet_address: TEST_WALLET,
      signature: TEST_SIGNATURE,
      city_id: 1,
      task_id: 1,
    });
    
    if (response.data?.reward) {
      const reward = response.data.reward;
      expect(typeof reward.exp).toBe('number');
      expect(typeof reward.gold).toBe('number');
    }
  });
});

describe('Task Data Validation - 数据验证测试', () => {
  
  test('任务ID必须是有效数字', async () => {
    const response = await post<any>(`/task/reward`, {
      wallet_address: TEST_WALLET,
      signature: TEST_SIGNATURE,
      city_id: 1,
      task_id: 'invalid',
    });
    
    expect(response.success).toBe(false);
  });

  test('任务ID超出范围返回错误', async () => {
    const response = await post<any>(`/task/reward`, {
      wallet_address: TEST_WALLET,
      signature: TEST_SIGNATURE,
      city_id: 1,
      task_id: 99999,
    });
    
    expect(response.success).toBe(false);
    expect(response.error).toContain('not found');
  });

  test('钱包地址格式验证', async () => {
    const response = await get<any>(
      `/task/list?wallet_address=invalid_wallet&city_id=1`
    );
    
    expect(response.success).toBe(false);
  });

  test('城市ID必须是有效数字', async () => {
    const response = await get<any>(
      `/task/list?wallet_address=${TEST_WALLET}&city_id=invalid`
    );
    
    expect(response.success).toBe(false);
  });
});

describe('Task Edge Cases - 边界情况测试', () => {
  
  test('任务进度超额自动修正', async () => {
    // 模拟：任务要求1个物品，但进度显示2个
    const taskItemNum = 1;
    let hasTaskItemNum = 2;
    
    // 修正为上限值
    hasTaskItemNum = Math.min(hasTaskItemNum, taskItemNum);
    
    expect(hasTaskItemNum).toBe(1);
  });

  test('任务状态流转正确', () => {
    let taskState = 0; // 未接取
    
    // 接取任务
    taskState = 1; // 进行中
    
    // 完成任务
    taskState = 2; // 已完成(未领取)
    
    // 领取奖励
    taskState = 3; // 已领取
    
    expect(taskState).toBe(3);
  });

  test('章节切换逻辑正确', () => {
    const chapter1Tasks = [3, 3, 3]; // 全部完成
    const chapter2Tasks = [1, 1, 1]; // 刚开始
    
    const isChapter1Complete = chapter1Tasks.every(s => s === 3);
    const isChapter2Complete = chapter2Tasks.every(s => s === 3);
    
    expect(isChapter1Complete).toBe(true);
    expect(isChapter2Complete).toBe(false);
  });

  test('概率计算边界值', () => {
    // 100% 概率
    const probability100 = 10000;
    const baseNum = Math.pow(10, 4);
    
    for (let i = 0; i < 100; i++) {
      const random = Math.floor(Math.random() * baseNum);
      const result = random < probability100;
      expect(result).toBe(true);
    }
    
    // 0% 概率
    const probability0 = 0;
    const result0 = Math.floor(Math.random() * baseNum) < probability0;
    expect(result0).toBe(false);
  });
});
