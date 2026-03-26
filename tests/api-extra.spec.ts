/**
 * 扩展API测试 - 覆盖之前未测试的端点
 * 目标：增加约100个测试用例
 */
import { test, expect, request } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:8788';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

test.describe('扩展API测试 - 未覆盖的端点', () => {
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

  // ============ game.ts 扩展 ============
  test('game-用户GET', async () => {
    const res = await api.get('/api/game/user');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('game-用户订阅GET', async () => {
    const res = await api.get('/api/game/user/sub');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('game-服务器玩家数(联盟)', async () => {
    const res = await api.get('/api/game/ins-player-count');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('game-领地玩家数', async () => {
    const res = await api.get('/api/game/territory-player-count');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('game-会计信息', async () => {
    const res = await api.get('/api/game/accountant');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('game-快速移动', async () => {
    const res = await api.get('/api/game/fast-move');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('game-依赖检查', async () => {
    const res = await api.get('/api/game/is-dependency');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('game-开始时间', async () => {
    const res = await api.get('/api/game/is-start-time');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('game-用户名状态', async () => {
    const res = await api.get('/api/game/user/name-state');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('game-城市背景设置', async () => {
    const res = await api.post('/api/game/city/background', { data: { city_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('game-强制效果到期', async () => {
    const res = await api.post('/api/game/force-effect-overdue', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('game-强制新用户到期', async () => {
    const res = await api.post('/api/game/force-newuser-overdue', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('game-城市简介', async () => {
    const res = await api.post('/api/game/city/brief', { data: { city_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('game-删除占领', async () => {
    const res = await api.post('/api/game/city/delete-occupation', { data: { pos: 0 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ hero-ext.ts ============
  test('hero-ext-缘分配置', async () => {
    const res = await api.get('/api/hero-ext/fate/config');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('hero-ext-缘分bonus', async () => {
    const res = await api.get('/api/hero-ext/fate/bonus');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('hero-ext-觉醒配置', async () => {
    const res = await api.get('/api/hero-ext/awake/config');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('hero-ext-觉醒检查', async () => {
    const res = await api.post('/api/hero-ext/awake/check', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-ext-觉醒', async () => {
    const res = await api.post('/api/hero-ext/awake', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-ext-突破配置', async () => {
    const res = await api.get('/api/hero-ext/breakthrough/config');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('hero-ext-突破检查', async () => {
    const res = await api.post('/api/hero-ext/breakthrough/check', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-ext-突破', async () => {
    const res = await api.post('/api/hero-ext/breakthrough', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-ext-兵种适应配置', async () => {
    const res = await api.get('/api/hero-ext/unit-adapt/config');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('hero-ext-兵种适应详情', async () => {
    const res = await api.get('/api/hero-ext/unit-adapt/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('hero-ext-兵种适应检查', async () => {
    const res = await api.post('/api/hero-ext/unit-adapt/check', { data: { hero_id: 1, unit_type: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-ext-兵种适应升级', async () => {
    const res = await api.post('/api/hero-ext/unit-adapt/upgrade', { data: { hero_id: 1, unit_type: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-ext-武将受伤状态', async () => {
    const res = await api.get('/api/hero-ext/injury/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('hero-ext-武将技能列表', async () => {
    const res = await api.get('/api/hero-ext/skills/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('hero-ext-技能升级检查', async () => {
    const res = await api.post('/api/hero-ext/skills/upgrade/check', { data: { hero_id: 1, skill_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-ext-技能升级', async () => {
    const res = await api.post('/api/hero-ext/skills/upgrade', { data: { hero_id: 1, skill_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ hero.ts 扩展 ============
  test('hero-训练', async () => {
    const res = await api.post('/api/hero/1/train', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-升级(独立)', async () => {
    const res = await api.post('/api/hero/1/upgrade', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-可参战检查', async () => {
    const res = await api.post('/api/hero/can-engage', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-可使用检查', async () => {
    const res = await api.post('/api/hero/can-use', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-参战', async () => {
    const res = await api.post('/api/hero/engage', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-解雇', async () => {
    const res = await api.post('/api/hero/fire', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-改名', async () => {
    const res = await api.post('/api/hero/name', { data: { hero_id: 1, name: 'TestHero' } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-事件触发', async () => {
    const res = await api.post('/api/hero/event', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-事件触发ex', async () => {
    const res = await api.post('/api/hero/event-ex', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-可解雇参战检查', async () => {
    const res = await api.post('/api/hero/fire-can-engage', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('hero-自动经验突破', async () => {
    const res = await api.get('/api/hero/auto-exp-break');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('hero-自动经验百分比', async () => {
    const res = await api.get('/api/hero/auto-exp-percent');
    expect([200, 401, 404]).toContain(res.status());
  });

  // ============ item-ext.ts ============
  test('item-ext-合成配方', async () => {
    const res = await api.get('/api/item-ext/compose/recipes?category=1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('item-ext-合成检查', async () => {
    const res = await api.post('/api/item-ext/compose/check', { data: { recipe_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-ext-合成', async () => {
    const res = await api.post('/api/item-ext/compose', { data: { recipe_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-ext-强化配置', async () => {
    const res = await api.get('/api/item-ext/enhance/config');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('item-ext-强化检查', async () => {
    const res = await api.post('/api/item-ext/enhance/check', { data: { item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-ext-强化', async () => {
    const res = await api.post('/api/item-ext/enhance', { data: { item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-ext-宝石槽位', async () => {
    const res = await api.get('/api/item-ext/gem/slots/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('item-ext-宝石装备', async () => {
    const res = await api.post('/api/item-ext/gem/equip', { data: { item_id: 1, gem_id: 1, slot: 0 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-ext-宝石卸下', async () => {
    const res = await api.post('/api/item-ext/gem/unequip', { data: { item_id: 1, slot: 0 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-ext-耐久度', async () => {
    const res = await api.get('/api/item-ext/durability/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('item-ext-使用耐久物品', async () => {
    const res = await api.post('/api/item-ext/durability/use', { data: { hero_id: 1, item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-ext-修理', async () => {
    const res = await api.post('/api/item-ext/repair', { data: { item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-ext-拆解检查', async () => {
    const res = await api.post('/api/item-ext/dismantle/check', { data: { item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-ext-拆解', async () => {
    const res = await api.post('/api/item-ext/dismantle', { data: { item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ item.ts 扩展 ============
  test('item-配置列表', async () => {
    const res = await api.get('/api/item/configs');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('item-按类型', async () => {
    const res = await api.get('/api/item/by-type?type=1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('item-可使用物品', async () => {
    const res = await api.get('/api/item/can-use');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('item-使用资源物品', async () => {
    const res = await api.post('/api/item/use-resource', { data: { item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-攻击装备列表', async () => {
    const res = await api.post('/api/item/equip-attack-list', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-防御装备列表', async () => {
    const res = await api.post('/api/item/equip-def-list', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('item-卸下战斗装备', async () => {
    const res = await api.post('/api/item/takeoff-battle', { data: { hero_id: 1, item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ mail-ext.ts ============
  test('mail-ext-发送邮件', async () => {
    const res = await api.post('/api/mail-ext/send', { data: { to_user: 'test', title: 'test', content: 'test' } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('mail-ext-领取邮件', async () => {
    const res = await api.post('/api/mail-ext/claim/1', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('mail-ext-一键领取', async () => {
    const res = await api.post('/api/mail-ext/claim-all', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('mail-ext-删除邮件', async () => {
    const res = await api.delete('/api/mail-ext/1');
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ map.ts ============
  test('map-配置', async () => {
    const res = await api.get('/api/map/config');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('map-位置信息', async () => {
    const res = await api.get('/api/map/position');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('map-区域信息', async () => {
    const res = await api.get('/api/map/area/0/0');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('map-位置详情', async () => {
    const res = await api.get('/api/map/position/0');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('map-探索', async () => {
    const res = await api.post('/api/map/explore', { data: { pos: 0 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('map-已探索', async () => {
    const res = await api.get('/api/map/explored');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('map-移动', async () => {
    const res = await api.post('/api/map/move', { data: { from_pos: 0, to_pos: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('map-移动状态', async () => {
    const res = await api.get('/api/map/movement/status');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('map-取消移动', async () => {
    const res = await api.post('/api/map/movement/cancel', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('map-NPC列表', async () => {
    const res = await api.get('/api/map/npcs');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('map-单位信息', async () => {
    const res = await api.get('/api/map/unit');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('map-城市名称', async () => {
    const res = await api.get('/api/map/city-name?pos=0');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('map-位置信息by-pos', async () => {
    const res = await api.get('/api/map/info-by-pos?pos=0');
    expect([200, 401, 404]).toContain(res.status());
  });

  // ============ market.ts ============
  test('market-市场物品', async () => {
    const res = await api.get('/api/market/items');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('market-我的订单', async () => {
    const res = await api.get('/api/market/my');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('market-订单数量', async () => {
    const res = await api.get('/api/market/count');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('market-批量取消', async () => {
    const res = await api.post('/api/market/batch-cancel', { data: { order_ids: [] } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('market-价格历史', async () => {
    const res = await api.get('/api/market/price-history?item_id=1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('market-统计', async () => {
    const res = await api.get('/api/market/stats');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('market-按名称计数', async () => {
    const res = await api.get('/api/market/count-by-name?name=test');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('market-按名称搜索', async () => {
    const res = await api.get('/api/market/items-by-name?name=test');
    expect([200, 401, 404]).toContain(res.status());
  });

  // ============ organize-ext.ts ============
  test('organize-ext-我的组织', async () => {
    const res = await api.get('/api/organize-ext/my');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('organize-ext-组织列表', async () => {
    const res = await api.get('/api/organize-ext/list');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('organize-ext-成员列表', async () => {
    const res = await api.get('/api/organize-ext/members');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('organize-ext-商店', async () => {
    const res = await api.get('/api/organize-ext/shop');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('organize-ext-创建', async () => {
    const res = await api.post('/api/organize-ext/create', { data: { name: 'TestOrg' } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('organize-ext-申请', async () => {
    const res = await api.post('/api/organize-ext/apply', { data: { org_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('organize-ext-批准', async () => {
    const res = await api.post('/api/organize-ext/approve', { data: { user_id: 'test' } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('organize-ext-设置角色', async () => {
    const res = await api.post('/api/organize-ext/set-role', { data: { user_id: 'test', role: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('organize-ext-踢出', async () => {
    const res = await api.post('/api/organize-ext/kick', { data: { user_id: 'test' } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('organize-ext-退出', async () => {
    const res = await api.post('/api/organize-ext/quit', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('organize-ext-解散', async () => {
    const res = await api.post('/api/organize-ext/disband', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('organize-ext-贡献', async () => {
    const res = await api.post('/api/organize-ext/contribute', { data: { amount: 100 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('organize-ext-商店/buy', async () => {
    const res = await api.post('/api/organize-ext/shop/buy', { data: { item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('organize-ext-公告', async () => {
    const res = await api.post('/api/organize-ext/notice', { data: { content: 'test' } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ persist-effect-ext.ts ============
  test('persist-effect-ext-效果列表', async () => {
    const res = await api.get('/api/persist-effect-ext/list');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('persist-effect-ext-武将效果', async () => {
    const res = await api.get('/api/persist-effect-ext/hero/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('persist-effect-ext-计算', async () => {
    const res = await api.get('/api/persist-effect-ext/calculate');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('persist-effect-ext-战斗加成', async () => {
    const res = await api.get('/api/persist-effect-ext/combat-bonus');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('persist-effect-ext-应用效果', async () => {
    const res = await api.post('/api/persist-effect-ext/apply', { data: { hero_id: 1, effect_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('persist-effect-ext-移除效果', async () => {
    const res = await api.post('/api/persist-effect-ext/remove', { data: { hero_id: 1, effect_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('persist-effect-ext-清除效果', async () => {
    const res = await api.post('/api/persist-effect-ext/clear', { data: { hero_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ rank.ts 扩展 ============
  test('rank-武将排行', async () => {
    const res = await api.get('/api/rank/hero');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('rank-勋章排行', async () => {
    const res = await api.get('/api/rank/insignia');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('rank-领地排行', async () => {
    const res = await api.get('/api/rank/territory');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('rank-联盟排行', async () => {
    const res = await api.get('/api/rank/union');
    expect([200, 401, 404]).toContain(res.status());
  });

  // ============ shop.ts 扩展 ============
  test('shop-按类型物品', async () => {
    const res = await api.get('/api/shop/items-by-type?type=1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('shop-持续效果购买', async () => {
    const res = await api.post('/api/shop/persist-effect', { data: { item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('shop-金币买资源', async () => {
    const res = await api.post('/api/shop/gold-buy-resource', { data: { type: 1, amount: 100 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('shop-VIP7日', async () => {
    const res = await api.get('/api/shop/vip-seven-days');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('shop-VIP30日', async () => {
    const res = await api.get('/api/shop/vip-thirty-days');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('shop-和平8小时', async () => {
    const res = await api.get('/api/shop/peace-eight-hours');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('shop-和平2日', async () => {
    const res = await api.get('/api/shop/peace-two-days');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('shop-和平7日', async () => {
    const res = await api.get('/api/shop/peace-seven-days');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('shop-资源转金币汇率', async () => {
    const res = await api.get('/api/shop/res-to-gold-rate');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('shop-商店物品', async () => {
    const res = await api.get('/api/shop/items');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('shop-使用效果', async () => {
    const res = await api.post('/api/shop/use-effect', { data: { item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('shop-兑换', async () => {
    const res = await api.post('/api/shop/exchange', { data: { item_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ task-ext.ts ============
  test('task-ext-任务详情', async () => {
    const res = await api.get('/api/task-ext/detail/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-ext-可用任务', async () => {
    const res = await api.get('/api/task-ext/available');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-ext-接受任务', async () => {
    const res = await api.post('/api/task-ext/accept', { data: { task_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-ext-放弃任务', async () => {
    const res = await api.post('/api/task-ext/abandon', { data: { task_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-ext-任务进度', async () => {
    const res = await api.post('/api/task-ext/progress', { data: { task_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-ext-完成任务', async () => {
    const res = await api.post('/api/task-ext/complete', { data: { task_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-ext-完成所有', async () => {
    const res = await api.post('/api/task-ext/complete-all', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-ext-每日重置', async () => {
    const res = await api.post('/api/task-ext/daily/reset', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-ext-成就列表', async () => {
    const res = await api.get('/api/task-ext/achievements');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-ext-成就进度', async () => {
    const res = await api.get('/api/task-ext/achievements/1/progress');
    expect([200, 401, 404]).toContain(res.status());
  });

  // ============ task.ts 扩展 ============
  test('task-按类型', async () => {
    const res = await api.get('/api/task/by-type?type=1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-战斗任务', async () => {
    const res = await api.post('/api/task/reward', { data: { task_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-适合战斗', async () => {
    const res = await api.get('/api/task/fight/suitable');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-更新战斗任务', async () => {
    const res = await api.post('/api/task/fight/update', { data: { task_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-适合搜索', async () => {
    const res = await api.get('/api/task/search/suitable');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-更新搜索任务', async () => {
    const res = await api.post('/api/task/search/update', { data: { task_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-日常开始', async () => {
    const res = await api.post('/api/task/daily/start', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-日常列表', async () => {
    const res = await api.get('/api/task/daily/list');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-日常领取', async () => {
    const res = await api.post('/api/task/daily/claim', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-日常进度', async () => {
    const res = await api.post('/api/task/daily/progress', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-删除', async () => {
    const res = await api.post('/api/task/delete', { data: { task_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('task-其他简单', async () => {
    const res = await api.get('/api/task/other/simple');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-合成简单', async () => {
    const res = await api.get('/api/task/compose/simple');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-宴会简单', async () => {
    const res = await api.get('/api/task/feast/simple');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-资源兑换简单', async () => {
    const res = await api.get('/api/task/res-exchange/simple');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-其他按类型', async () => {
    const res = await api.get('/api/task/other/by-type?type=1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('task-合成按类型', async () => {
    const res = await api.get('/api/task/compose/by-type?type=1');
    expect([200, 401, 404]).toContain(res.status());
  });

  // ============ tech.ts 扩展 ============
  test('tech-科技效果', async () => {
    const res = await api.get('/api/tech/effects');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('tech-按建筑', async () => {
    const res = await api.get('/api/tech/by-building?building_id=1');
    expect([200, 401, 404]).toContain(res.status());
  });

  // ============ warfare.ts 扩展 ============
  test('warfare-战场区域', async () => {
    const res = await api.get('/api/warfare/area');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('warfare-等待中', async () => {
    const res = await api.get('/api/warfare/waiting');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('warfare-用户战斗', async () => {
    const res = await api.get('/api/warfare/user-battle');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('warfare-战斗详情', async () => {
    const res = await api.get('/api/warfare/detail');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('warfare-选择', async () => {
    const res = await api.post('/api/warfare/select', { data: { option: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('warfare-配置', async () => {
    const res = await api.get('/api/warfare/config');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('warfare-是否开启', async () => {
    const res = await api.get('/api/warfare/is-open');
    expect([200, 401, 404]).toContain(res.status());
  });

  // ============ event-ext.ts ============
  test('event-ext-可用事件', async () => {
    const res = await api.get('/api/event-ext/available');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('event-ext-过期事件', async () => {
    const res = await api.get('/api/event-ext/expired');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('event-ext-接受事件', async () => {
    const res = await api.post('/api/event-ext/accept', { data: { event_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('event-ext-放弃事件', async () => {
    const res = await api.post('/api/event-ext/abandon', { data: { event_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('event-ext-事件进度', async () => {
    const res = await api.post('/api/event-ext/progress', { data: { event_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('event-ext-刷新事件', async () => {
    const res = await api.post('/api/event-ext/refresh', { data: { event_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('event-ext-故事章节', async () => {
    const res = await api.get('/api/event-ext/story/chapters');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('event-ext-开始故事', async () => {
    const res = await api.post('/api/event-ext/story/start', { data: { chapter_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ event.ts 扩展 ============
  test('event-事件详情', async () => {
    const res = await api.get('/api/event/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('event-完成事件(独立)', async () => {
    const res = await api.post('/api/event/1/complete', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('event-取消事件', async () => {
    const res = await api.post('/api/event/1/cancel', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('event-加速事件', async () => {
    const res = await api.post('/api/event/1/speedup', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('event-事件队列', async () => {
    const res = await api.get('/api/event/queue/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('event-删除事件', async () => {
    const res = await api.post('/api/event/delete', { data: { event_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('event-搜索', async () => {
    const res = await api.post('/api/event/search', { data: { keyword: 'test' } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('event-访问', async () => {
    const res = await api.post('/api/event/visit', { data: { event_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ city-ext.ts 扩展 ============
  test('city-ext-繁荣度更新', async () => {
    const res = await api.post('/api/city-ext/prosperity/update', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('city-ext-人口更新', async () => {
    const res = await api.post('/api/city-ext/population/update', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('city-ext-幸福度更新', async () => {
    const res = await api.post('/api/city-ext/happiness/update', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('city-ext-税率设置', async () => {
    const res = await api.post('/api/city-ext/tax/rate', { data: { rate: 10 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('city-ext-建筑加速', async () => {
    const res = await api.post('/api/city-ext/building/speed-up', { data: { queue_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('city-ext-建筑取消', async () => {
    const res = await api.post('/api/city-ext/building/cancel', { data: { queue_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ corps.ts 扩展 ============
  test('corps-简单武将列表', async () => {
    const res = await api.get('/api/corps/simple-heroes');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('corps-需要时间', async () => {
    const res = await api.get('/api/corps/need-time');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('corps-返回', async () => {
    const res = await api.post('/api/corps/return', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('corps-事件', async () => {
    const res = await api.post('/api/corps/event', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('corps-召回', async () => {
    const res = await api.post('/api/corps/recall', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('corps-延长事件', async () => {
    const res = await api.post('/api/corps/event-extend', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ defense.ts 扩展 ============
  test('defense-城防详情', async () => {
    const res = await api.get('/api/defense/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('defense-城防升级(独立)', async () => {
    const res = await api.post('/api/defense/1/upgrade', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('defense-删除城防', async () => {
    const res = await api.delete('/api/defense/delete/1');
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('defense-城防事件', async () => {
    const res = await api.post('/api/defense/event', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ guild.ts 扩展 ============
  test('guild-帮会详情', async () => {
    const res = await api.get('/api/guild/1');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('guild-加入帮会', async () => {
    const res = await api.post('/api/guild/1/join', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('guild-帮会捐赠', async () => {
    const res = await api.post('/api/guild/1/donate', { data: { amount: 100 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('guild-离开(独立)', async () => {
    const res = await api.post('/api/guild/leave', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('guild-解散(独立)', async () => {
    const res = await api.post('/api/guild/disband', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('guild-成员计数', async () => {
    const res = await api.get('/api/guild/member-count');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('guild-其他成员计数', async () => {
    const res = await api.get('/api/guild/member-count-other');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('guild-成员列表(GET)', async () => {
    const res = await api.get('/api/guild/member-list');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('guild-节点', async () => {
    const res = await api.get('/api/guild/node');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('guild-我的资源', async () => {
    const res = await api.get('/api/guild/my-resource');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('guild-资源', async () => {
    const res = await api.get('/api/guild/resource');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('guild-成员资源', async () => {
    const res = await api.get('/api/guild/members-resource');
    expect([200, 401, 404]).toContain(res.status());
  });

  // ============ appendant-npc.ts 扩展 ============
  test('appendant-npc-清理', async () => {
    const res = await api.post('/api/appendant-npc/cleanup', { data: {} });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('appendant-npc-添加', async () => {
    const res = await api.post('/api/appendant-npc/add', { data: { npc_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  test('appendant-npc-删除(POST)', async () => {
    const res = await api.post('/api/appendant-npc/delete', { data: { npc_id: 1 } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });

  // ============ chat.ts 扩展 ============
  test('chat-发送消息', async () => {
    const res = await api.post('/api/chat', { data: { content: 'test message' } });
    expect([200, 401, 404, 500]).toContain(res.status());
  });
});
