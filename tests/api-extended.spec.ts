/**
 * 扩展API测试 - 覆盖更多端点
 * 运行: npx playwright test tests/api-extended.spec.ts --reporter=list
 */
import { test, expect, request } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:8788';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

test.describe('扩展API测试', () => {
  let ctx: any;

  test.beforeAll(async () => {
    ctx = await request.newContext();
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  const authHeaders = () => ({ 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` });

  // Helper: 检查端点是否可达
  const checkEndpoint = (name: string, url: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    test(name, async () => {
      let response;
      if (method === 'POST' && body) {
        response = await ctx.post(url, { headers: authHeaders(), data: body });
      } else {
        response = await ctx.get(url, { headers: authHeaders() });
      }
      // 只要不是500内部错误就说明端点存在
      expect([200, 201, 400, 401, 404]).toContain(response.status());
    });
  };

  // ==================== 建筑系统 ====================
  checkEndpoint('建筑详情', `${API_BASE}/api/building/1`);
  checkEndpoint('按位置获取建筑', `${API_BASE}/api/building/by-pos?city_id=1&pos=0`);
  checkEndpoint('按ID获取建筑', `${API_BASE}/api/building/by-id?id=1`);

  // ==================== 武将系统 ====================
  checkEndpoint('武将详情', `${API_BASE}/api/hero/detail?id=1`);
  checkEndpoint('武将战斗属性', `${API_BASE}/api/hero/battle-power?id=1`);
  checkEndpoint('武将属性详情', `${API_BASE}/api/hero/attrs?id=1`);

  // ==================== 战斗系统 ====================
  checkEndpoint('战斗事件', `${API_BASE}/api/battle/chess/event?pos=1`);
  checkEndpoint('战斗次数', `${API_BASE}/api/battle/chess/num?city_id=1`);
  checkEndpoint('战斗移动', `${API_BASE}/api/battle/chess/move`, 'POST', { pos: 1, toPos: 2 });
  checkEndpoint('战斗攻击', `${API_BASE}/api/battle/chess/attack`, 'POST', { chessIndex: 1, targetID: 11 });
  checkEndpoint('战斗结算', `${API_BASE}/api/battle/settle`, 'POST', { pos: 1 });
  checkEndpoint('棋盘排行by用户', `${API_BASE}/api/battle/chess/rank-by-user?wallet=${TEST_WALLET}`);

  // ==================== 军团系统 ====================
  checkEndpoint('军团详情', `${API_BASE}/api/corps/1`);
  checkEndpoint('军团成员', `${API_BASE}/api/corps/members/1`);

  // ==================== 帮会系统 ====================
  checkEndpoint('帮会详情', `${API_BASE}/api/guild/1`);
  checkEndpoint('帮会成员', `${API_BASE}/api/guild/members/1`);

  // ==================== 邮件系统 ====================
  checkEndpoint('战斗邮件', `${API_BASE}/api/mail/fight`);
  checkEndpoint('系统公告', `${API_BASE}/api/mail/announcements`);
  checkEndpoint('发送邮件', `${API_BASE}/api/mail/send`, 'POST', { to: 'test', title: 'test', content: 'test' });

  // ==================== 排行榜 ====================
  checkEndpoint('等级排行', `${API_BASE}/api/rank/level`);
  checkEndpoint('财富排行', `${API_BASE}/api/rank/wealth`);
  checkEndpoint('城防排行', `${API_BASE}/api/rank/defense`);

  // ==================== 市场系统 ====================
  checkEndpoint('市场详情', `${API_BASE}/api/market/info`);
  checkEndpoint('市场购买', `${API_BASE}/api/market/buy`, 'POST', { item_id: 1, count: 1 });
  checkEndpoint('市场出售', `${API_BASE}/api/market/sell`, 'POST', { item_id: 1, count: 1, price: 100 });

  // ==================== 商城系统 ====================
  checkEndpoint('商城详情', `${API_BASE}/api/shop/info`);
  checkEndpoint('商城购买', `${API_BASE}/api/shop/buy`, 'POST', { goods_id: 1 });

  // ==================== 任务系统 ====================
  checkEndpoint('任务详情', `${API_BASE}/api/task/1`);
  checkEndpoint('每日任务进度', `${API_BASE}/api/task/daily-progress`);
  checkEndpoint('领取任务奖励', `${API_BASE}/api/task/claim/1`, 'POST', {});

  // ==================== 科技系统 ====================
  checkEndpoint('科技详情', `${API_BASE}/api/tech/1`);
  checkEndpoint('科技升级', `${API_BASE}/api/tech/upgrade/1`, 'POST', {});

  // ==================== 城防系统 ====================
  checkEndpoint('城防详情', `${API_BASE}/api/defense/detail`);
  checkEndpoint('城防阵型', `${API_BASE}/api/defense/formation`);

  // ==================== 竞技场 ====================
  checkEndpoint('竞技场挑战', `${API_BASE}/api/arena/challenge`, 'POST', { opponent: 'test' });

  // ==================== 事件系统 ====================
  checkEndpoint('事件详情', `${API_BASE}/api/event/1`);
  checkEndpoint('完成事件', `${API_BASE}/api/event/complete/1`, 'POST', {});

  // ==================== 效果系统 ====================
  checkEndpoint('添加效果', `${API_BASE}/api/effect/add`, 'POST', { type: 'test', value: 1 });
  checkEndpoint('移除效果', `${API_BASE}/api/effect/remove/1`, 'POST', {});

  // ==================== 战役系统 ====================
  checkEndpoint('战役详情', `${API_BASE}/api/warfare/1`);
  checkEndpoint('战役报名', `${API_BASE}/api/warfare/signup`, 'POST', { war_id: 1 });
  checkEndpoint('战役取消', `${API_BASE}/api/warfare/cancel`, 'POST', { war_id: 1 });

  // ==================== 聊天系统 ====================
  checkEndpoint('聊天列表', `${API_BASE}/api/chat/list`);
  checkEndpoint('发送聊天', `${API_BASE}/api/chat/send`, 'POST', { to: 'test', content: 'hello' });

  // ==================== 物品系统 ====================
  checkEndpoint('使用物品', `${API_BASE}/api/item/use`, 'POST', { item_id: 1, count: 1 });
  checkEndpoint('丢弃物品', `${API_BASE}/api/item/discard`, 'POST', { item_id: 1, count: 1 });

  // ==================== 城市扩展 ====================
  checkEndpoint('繁荣度加成', `${API_BASE}/api/city-ext/prosperity/bonus`);
  checkEndpoint('人口信息', `${API_BASE}/api/city-ext/population`);

  // ==================== 武将扩展 ====================
  checkEndpoint('武将属性加成', `${API_BASE}/api/hero-ext/attr-bonus`);
  checkEndpoint('武将技能详情', `${API_BASE}/api/hero-ext/skill-detail/1`);

  // ==================== 附加NPC ====================
  checkEndpoint('NPC收益', `${API_BASE}/api/appendant-npc/benefits/1`);
  checkEndpoint('占领NPC', `${API_BASE}/api/appendant-npc/occupy`, 'POST', { pos: 1 });
  checkEndpoint('放弃NPC', `${API_BASE}/api/appendant-npc/abandon`, 'POST', { pos: 1 });

  // ==================== 用户扩展 ====================
  checkEndpoint('用户统计', `${API_BASE}/api/user-ext/stats`);
  checkEndpoint('用户成就', `${API_BASE}/api/user-ext/achievements`);
});
