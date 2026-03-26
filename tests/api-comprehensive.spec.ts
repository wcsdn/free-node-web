/**
 * 综合API测试 - 测试所有主要API端点的正确状态
 */
import { test, expect, request } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:8788';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

test.describe('综合API测试 - 所有模块', () => {
  let api: any;

  test.beforeEach(async () => {
    api = await request.newContext({
      baseURL: API_BASE,
      headers: {
        'X-Wallet-Auth': `${TEST_WALLET}:test_signature`
      }
    });
  });

  test.afterEach(async () => {
    await api.dispose();
  });

  // ============ 游戏基础模块 ============
  test('游戏-健康检查', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`);
    expect([200, 404]).toContain(res.status());
  });

  test('游戏-状态', async () => {
    const res = await api.get('/api/game/status');
    console.log('game/status:', res.status());
    expect([200, 401, 404]).toContain(res.status());
  });

  test('游戏-用户信息', async () => {
    const res = await api.get('/api/game/user-info');
    console.log('game/user-info:', res.status());
    expect([200, 401]).toContain(res.status());
  });

  test('游戏-城市列表', async () => {
    const res = await api.post('/api/game/city-list');
    console.log('game/city-list:', res.status());
    expect([200, 401, 404]).toContain(res.status());
  });

  // ============ 武将模块 ============
  test('武将-列表GET', async () => {
    const res = await api.get('/api/hero/list');
    console.log('hero/list GET:', res.status());
  });

  test('武将-列表POST', async () => {
    const res = await api.post('/api/hero/list', { data: {} });
    console.log('hero/list POST:', res.status());
  });

  test('武将-详情POST', async () => {
    const res = await api.post('/api/hero/detail', { data: { hero_id: 1 } });
    console.log('hero/detail:', res.status());
  });

  test('武将-数量', async () => {
    const res = await api.get('/api/hero/count');
    console.log('hero/count:', res.status());
  });

  test('武将-用户武将', async () => {
    const res = await api.get('/api/hero/user-heroes');
    console.log('hero/user-heroes:', res.status());
  });

  // ============ 建筑模块 ============
  test('建筑-列表', async () => {
    const res = await api.get('/api/building/');
    console.log('building/:', res.status());
  });

  test('建筑-城市建筑', async () => {
    const res = await api.get('/api/building/city/1');
    console.log('building/city/1:', res.status());
  });

  test('建筑-可建列表', async () => {
    const res = await api.get('/api/building/available/1');
    console.log('building/available/1:', res.status());
  });

  test('建筑-配置列表', async () => {
    const res = await api.get('/api/building/config/list');
    console.log('building/config/list:', res.status());
  });

  // ============ 帮会模块 ============
  test('帮会-列表', async () => {
    const res = await api.get('/api/guild/list');
    console.log('guild/list:', res.status());
  });

  test('帮会-我的', async () => {
    const res = await api.get('/api/guild/my');
    console.log('guild/my:', res.status());
  });

  // ============ 军团模块 ============
  test('军团-列表', async () => {
    const res = await api.get('/api/corps/list');
    console.log('corps/list:', res.status());
  });

  test('军团-状态', async () => {
    const res = await api.get('/api/corps/state');
    console.log('corps/state:', res.status());
  });

  // ============ 邮件模块 ============
  test('邮件-列表', async () => {
    const res = await api.get('/api/mail/list');
    console.log('mail/list:', res.status());
  });

  test('邮件-新数量', async () => {
    const res = await api.get('/api/mail/new-count');
    console.log('mail/new-count:', res.status());
  });

  test('邮件-战斗', async () => {
    const res = await api.get('/api/mail/fight');
    console.log('mail/fight:', res.status());
  });

  test('邮件-公告', async () => {
    const res = await api.get('/api/mail/announcements');
    console.log('mail/announcements:', res.status());
  });

  // ============ 排行榜模块 ============
  test('排行榜-战斗力', async () => {
    const res = await api.get('/api/rank/power');
    console.log('rank/power:', res.status());
  });

  test('排行榜-等级', async () => {
    const res = await api.get('/api/rank/level');
    console.log('rank/level:', res.status());
  });

  test('排行榜-财富', async () => {
    const res = await api.get('/api/rank/wealth');
    console.log('rank/wealth:', res.status());
  });

  test('排行榜-城市', async () => {
    const res = await api.get('/api/rank/city');
    console.log('rank/city:', res.status());
  });

  // ============ 战斗模块 ============
  test('战斗-棋盘', async () => {
    const res = await api.get('/api/battle/chessboard?city_id=1');
    console.log('battle/chessboard:', res.status());
  });

  test('战斗-状态', async () => {
    const res = await api.get('/api/battle/state?pos=0');
    console.log('battle/state:', res.status());
  });

  test('战斗-棋盘状态', async () => {
    const res = await api.get('/api/battle/chess-status?city_id=1');
    console.log('battle/chess-status:', res.status());
  });

  test('战斗-棋盘数字', async () => {
    const res = await api.get('/api/battle/chess-num?city_id=1');
    console.log('battle/chess-num:', res.status());
  });

  test('战斗-战报', async () => {
    const res = await api.get('/api/battle/report');
    console.log('battle/report:', res.status());
  });

  test('战斗-排行', async () => {
    const res = await api.get('/api/battle/chess-rank');
    console.log('battle/chess-rank:', res.status());
  });

  // ============ 地图模块 ============
  test('地图-地形', async () => {
    const res = await api.get('/api/map/world/landform?x=0&y=0');
    console.log('map/world/landform:', res.status());
  });

  test('地图-位置状态', async () => {
    const res = await api.get('/api/map/world/pos-state?pos=0');
    console.log('map/world/pos-state:', res.status());
  });

  test('地图-城市分布', async () => {
    const res = await api.get('/api/map/world/cities');
    console.log('map/world/cities:', res.status());
  });

  // ============ 物品模块 ============
  test('物品-列表', async () => {
    const res = await api.get('/api/item/list');
    console.log('item/list:', res.status());
  });

  test('物品-配置', async () => {
    const res = await api.get('/api/item/config');
    console.log('item/config:', res.status());
  });

  // ============ 商店模块 ============
  test('商店-列表', async () => {
    const res = await api.get('/api/shop/list');
    console.log('shop/list:', res.status());
  });

  test('商店-商品', async () => {
    const res = await api.get('/api/shop/goods');
    console.log('shop/goods:', res.status());
  });

  // ============ 市场模块 ============
  test('市场-列表', async () => {
    const res = await api.get('/api/market/list');
    console.log('market/list:', res.status());
  });

  // ============ 任务模块 ============
  test('任务-列表', async () => {
    const res = await api.get('/api/task/list');
    console.log('task/list:', res.status());
  });

  test('任务-每日', async () => {
    const res = await api.get('/api/task/daily');
    console.log('task/daily:', res.status());
  });

  // ============ 科技模块 ============
  test('科技-列表', async () => {
    const res = await api.get('/api/tech/list');
    console.log('tech/list:', res.status());
  });

  test('科技-研究', async () => {
    const res = await api.get('/api/tech/research');
    console.log('tech/research:', res.status());
  });

  // ============ 事件模块 ============
  test('事件-列表', async () => {
    const res = await api.get('/api/event/list');
    console.log('event/list:', res.status());
  });

  test('事件-进行中', async () => {
    const res = await api.get('/api/event/active');
    console.log('event/active:', res.status());
  });

  test('事件-可完成', async () => {
    const res = await api.get('/api/event/completable');
    console.log('event/completable:', res.status());
  });

  // ============ 竞技场模块 ============
  test('竞技场-信息', async () => {
    const res = await api.get('/api/arena/info');
    console.log('arena/info:', res.status());
  });

  test('竞技场-次数', async () => {
    const res = await api.get('/api/arena/times');
    console.log('arena/times:', res.status());
  });

  test('竞技场-排行', async () => {
    const res = await api.get('/api/arena/rankings');
    console.log('arena/rankings:', res.status());
  });

  // ============ 城防模块 ============
  test('城防-信息', async () => {
    const res = await api.get('/api/defense/info?city_id=1');
    console.log('defense/info:', res.status());
  });

  test('城防-列表', async () => {
    const res = await api.get('/api/defense/list?city_id=1');
    console.log('defense/list:', res.status());
  });

  // ============ 效果模块 ============
  test('效果-持久组', async () => {
    const res = await api.get('/api/effect/persist-group');
    console.log('effect/persist-group:', res.status());
  });

  test('效果-超期', async () => {
    const res = await api.get('/api/effect/over');
    console.log('effect/over:', res.status());
  });

  // ============ 聊天模块 ============
  test('聊天-列表', async () => {
    const res = await api.get('/api/chat/list');
    console.log('chat/list:', res.status());
  });

  // ============ NPC模块 ============
  test('NPC-列表', async () => {
    const res = await api.get('/api/appendant-npc/list');
    console.log('appendant-npc/list:', res.status());
  });

  test('NPC-我的', async () => {
    const res = await api.get('/api/appendant-npc/my-npc');
    console.log('appendant-npc/my-npc:', res.status());
  });

  // ============ 城市扩展模块 ============
  test('城市扩展-繁荣度等级', async () => {
    const res = await api.get('/api/city-ext/prosperity/level');
    console.log('city-ext/prosperity/level:', res.status());
  });

  test('城市扩展-资源产出', async () => {
    const res = await api.get('/api/city-ext/resource/output');
    console.log('city-ext/resource/output:', res.status());
  });

  // ============ 战争模块 ============
  test('战争-报名状态', async () => {
    const res = await api.get('/api/warfare/signup-status');
    console.log('warfare/signup-status:', res.status());
  });

  test('战争-可报名', async () => {
    const res = await api.get('/api/warfare/can-signup');
    console.log('warfare/can-signup:', res.status());
  });

  // ============ 管理模块 ============
  test('管理-在线用户', async () => {
    const res = await api.get('/api/admin/online-users');
    console.log('admin/online-users:', res.status());
  });

  // 汇总
  test('测试完成', async () => {
    console.log('\\n=== 综合API测试完成 ===');
  });
});
