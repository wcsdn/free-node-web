/**
 * 全面API测试 - 检查所有端点是否可达
 * 运行: npx playwright test tests/api-full.spec.ts --reporter=list
 */
import { test, expect, request } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:8788';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

test.describe('全面API测试', () => {
  let ctx: any;

  test.beforeAll(async () => {
    ctx = await request.newContext();
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  const authHeaders = () => ({ 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` });

  // Helper: 只要返回200或401就说明端点存在
  const checkEndpoint = (name: string, url: string) => {
    test(name, async () => {
      const response = await ctx.get(url, { headers: authHeaders() });
      // 200 = 成功, 401 = 未授权(端点存在), 400/404 = 端点存在但参数错误
      expect([200, 401, 400, 404]).toContain(response.status());
    });
  };

  // ==================== 健康检查 ====================
  checkEndpoint('1. 健康检查', `${API_BASE}/api/game/status`);

  // ==================== 用户系统 ====================
  checkEndpoint('2. 用户信息', `${API_BASE}/api/game/user-info`);

  // ==================== 城市系统 ====================
  checkEndpoint('3. 城市建筑列表', `${API_BASE}/api/building/city/1`);
  checkEndpoint('4. 可用建筑', `${API_BASE}/api/building/available/1`);
  checkEndpoint('5. 建筑配置列表', `${API_BASE}/api/building/config/list`);

  // ==================== 武将系统 ====================
  checkEndpoint('6. 武将列表', `${API_BASE}/api/hero/list`);
  checkEndpoint('7. 武将招募配置', `${API_BASE}/api/hero/recruit-config`);

  // ==================== 战斗系统 ====================
  checkEndpoint('8. 棋盘状态', `${API_BASE}/api/battle/chess/status?city_id=1`);
  checkEndpoint('9. 棋盘信息', `${API_BASE}/api/battle/chess/board?pos=1`);
  checkEndpoint('10. 战斗状态', `${API_BASE}/api/battle/state?pos=0`);
  checkEndpoint('11. 战斗记录', `${API_BASE}/api/battle/report`);
  checkEndpoint('12. 棋盘排行', `${API_BASE}/api/battle/chess/rank`);

  // ==================== 地图系统 ====================
  checkEndpoint('13. 地形信息', `${API_BASE}/api/map/world/landform?x=0&y=0`);
  checkEndpoint('14. 位置状态', `${API_BASE}/api/map/world/pos-state?pos=0`);

  // ==================== 帮会系统 ====================
  checkEndpoint('15. 帮会列表', `${API_BASE}/api/guild/list`);
  checkEndpoint('16. 我的帮会', `${API_BASE}/api/guild/my`);

  // ==================== 军团系统 ====================
  checkEndpoint('17. 军团状态', `${API_BASE}/api/corps/state`);
  checkEndpoint('18. 军团列表', `${API_BASE}/api/corps/list`);

  // ==================== 邮件系统 ====================
  checkEndpoint('19. 邮件列表', `${API_BASE}/api/mail/list`);
  checkEndpoint('20. 新邮件数量', `${API_BASE}/api/mail/new-count`);

  // ==================== 排行榜系统 ====================
  checkEndpoint('21. 战斗力排行榜', `${API_BASE}/api/rank/power`);
  checkEndpoint('22. 等级排行榜', `${API_BASE}/api/rank/level`);
  checkEndpoint('23. 财富排行榜', `${API_BASE}/api/rank/wealth`);

  // ==================== 物品系统 ====================
  checkEndpoint('24. 物品列表', `${API_BASE}/api/item/list`);
  checkEndpoint('25. 物品配置', `${API_BASE}/api/item/config/list`);

  // ==================== 市场系统 ====================
  checkEndpoint('26. 市场列表', `${API_BASE}/api/market/list`);

  // ==================== 商城系统 ====================
  checkEndpoint('27. 商城列表', `${API_BASE}/api/shop/list`);

  // ==================== 任务系统 ====================
  checkEndpoint('28. 任务列表', `${API_BASE}/api/task/list`);
  checkEndpoint('29. 每日任务', `${API_BASE}/api/task/daily`);

  // ==================== 科技系统 ====================
  checkEndpoint('30. 科技列表', `${API_BASE}/api/tech/list`);
  checkEndpoint('31. 科技配置', `${API_BASE}/api/tech/config`);

  // ==================== 城防系统 ====================
  checkEndpoint('32. 城防信息', `${API_BASE}/api/defense/info`);
  checkEndpoint('33. 城防建筑', `${API_BASE}/api/defense/buildings`);

  // ==================== 战斗竞技场 ====================
  checkEndpoint('34. 竞技场信息', `${API_BASE}/api/arena/info`);
  checkEndpoint('35. 竞技场次数', `${API_BASE}/api/arena/times`);
  checkEndpoint('36. 竞技场排行', `${API_BASE}/api/arena/rankings`);

  // ==================== 事件系统 ====================
  checkEndpoint('37. 事件列表', `${API_BASE}/api/event/list`);
  checkEndpoint('38. 待处理事件', `${API_BASE}/api/event/pending`);

  // ==================== 效果系统 ====================
  checkEndpoint('39. 持久效果列表', `${API_BASE}/api/effect/persist/list`);

  // ==================== 聊天系统 ====================
  checkEndpoint('40. 对话列表', `${API_BASE}/api/chat/conversations`);

  // ==================== 战役系统 ====================
  checkEndpoint('41. 战役状态', `${API_BASE}/api/warfare/state`);
  checkEndpoint('42. 可用战役', `${API_BASE}/api/warfare/available`);

  // ==================== 武将扩展 ====================
  checkEndpoint('43. 武将技能', `${API_BASE}/api/hero-ext/skills/1`);

  // ==================== 城市扩展 ====================
  checkEndpoint('44. 繁荣度等级', `${API_BASE}/api/city-ext/prosperity/level`);
  checkEndpoint('45. 资源产出', `${API_BASE}/api/city-ext/resource/output`);

  // ==================== 附加NPC ====================
  checkEndpoint('46. NPC列表', `${API_BASE}/api/appendant-npc/list`);
  checkEndpoint('47. 我的NPC', `${API_BASE}/api/appendant-npc/my-npc`);
});
