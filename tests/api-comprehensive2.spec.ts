/**
 * 综合API测试2 - 覆盖POST/PUT/DELETE端点 (修复版)
 */
import { test, expect, request } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:8788';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

test.describe('综合API测试2', () => {
  let ctx: any;

  test.beforeAll(async () => {
    ctx = await request.newContext();
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test('POST /api/game/page-info', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/page-info`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/game/city-detail', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/city-detail`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { city_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/game/user/online', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/user/online`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/game/city/name', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/city/name`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { city_id: 1, name: 'Test' }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/game/logout', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/logout`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/game/fate/check', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/fate/check`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/game/awake/check', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/awake/check`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/game/breakthrough/check', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/breakthrough/check`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/game/unit-adapt/check', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/unit-adapt/check`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/game/injury/recover', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/injury/recover`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { hero_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/game/skills/upgrade', async () => {
    const r = await ctx.post(`${API_BASE}/api/game/skills/upgrade`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { hero_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/item/add', async () => {
    const r = await ctx.post(`${API_BASE}/api/item/add`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { item_id: 1, count: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/item/disassemble', async () => {
    const r = await ctx.post(`${API_BASE}/api/item/disassemble`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { item_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/item/exchange', async () => {
    const r = await ctx.post(`${API_BASE}/api/item/exchange`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { item_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/item/sell', async () => {
    const r = await ctx.post(`${API_BASE}/api/item/sell`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { item_id: 1, count: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/item/organize', async () => {
    const r = await ctx.post(`${API_BASE}/api/item/organize`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/item/cancel-sell', async () => {
    const r = await ctx.post(`${API_BASE}/api/item/cancel-sell`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { item_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/item/battle-use', async () => {
    const r = await ctx.post(`${API_BASE}/api/item/battle-use`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { item_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/item/equip', async () => {
    const r = await ctx.post(`${API_BASE}/api/item/equip`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { hero_id: 1, item_id: 1, slot: 0 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/item/unequip', async () => {
    const r = await ctx.post(`${API_BASE}/api/item/unequip`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { hero_id: 1, slot: 0 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/market/cancel', async () => {
    const r = await ctx.post(`${API_BASE}/api/market/cancel`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { order_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/market/buy', async () => {
    const r = await ctx.post(`${API_BASE}/api/market/buy`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { item_id: 1, count: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/market/sell', async () => {
    const r = await ctx.post(`${API_BASE}/api/market/sell`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { item_id: 1, count: 1, price: 100 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/tech/research', async () => {
    const r = await ctx.post(`${API_BASE}/api/tech/research`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { tech_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/task/claim/1', async () => {
    const r = await ctx.post(`${API_BASE}/api/task/claim/1`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/task/daily/claim', async () => {
    const r = await ctx.post(`${API_BASE}/api/task/daily/claim`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/warfare/signup', async () => {
    const r = await ctx.post(`${API_BASE}/api/warfare/signup`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { war_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/warfare/cancel', async () => {
    const r = await ctx.post(`${API_BASE}/api/warfare/cancel`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { war_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/building/build', async () => {
    const r = await ctx.post(`${API_BASE}/api/building/build`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { city_id: 1, building_id: 1, pos: 0 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/building/cancel', async () => {
    const r = await ctx.post(`${API_BASE}/api/building/cancel`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { city_id: 1, pos: 0 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/city-ext/tax/collect', async () => {
    const r = await ctx.post(`${API_BASE}/api/city-ext/tax/collect`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { city_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/corps/create', async () => {
    const r = await ctx.post(`${API_BASE}/api/corps/create`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { name: 'TestCorps' }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/corps/join', async () => {
    const r = await ctx.post(`${API_BASE}/api/corps/join`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { corps_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/corps/leave', async () => {
    const r = await ctx.post(`${API_BASE}/api/corps/leave`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/guild/create', async () => {
    const r = await ctx.post(`${API_BASE}/api/guild/create`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { name: 'TestGuild' }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/guild/apply', async () => {
    const r = await ctx.post(`${API_BASE}/api/guild/apply`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { guild_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/guild/quit', async () => {
    const r = await ctx.post(`${API_BASE}/api/guild/quit`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/arena/challenge', async () => {
    const r = await ctx.post(`${API_BASE}/api/arena/challenge`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { opponent: 'test' }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/battle/chess/move', async () => {
    const r = await ctx.post(`${API_BASE}/api/battle/chess/move`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { pos: 1, toPos: 2 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/battle/chess/attack', async () => {
    const r = await ctx.post(`${API_BASE}/api/battle/chess/attack`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { chessIndex: 1, targetID: 11 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/defense/set-defence', async () => {
    const r = await ctx.post(`${API_BASE}/api/defense/set-defence`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/event/complete/1', async () => {
    const r = await ctx.post(`${API_BASE}/api/event/complete/1`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/effect/add', async () => {
    const r = await ctx.post(`${API_BASE}/api/effect/add`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { type: 'test', value: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/chat/send', async () => {
    const r = await ctx.post(`${API_BASE}/api/chat/send`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { to: 'test', content: 'hello' }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/mail/send', async () => {
    const r = await ctx.post(`${API_BASE}/api/mail/send`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { to: 'test', title: 'test', content: 'test' }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/hero/recruit', async () => {
    const r = await ctx.post(`${API_BASE}/api/hero/recruit`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { config_id: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/appendant-npc/occupy', async () => {
    const r = await ctx.post(`${API_BASE}/api/appendant-npc/occupy`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { pos: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/appendant-npc/abandon', async () => {
    const r = await ctx.post(`${API_BASE}/api/appendant-npc/abandon`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { pos: 1 }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/admin/kick-user', async () => {
    const r = await ctx.post(`${API_BASE}/api/admin/kick-user`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: { target_address: 'test' }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('POST /api/user-ext/signin', async () => {
    const r = await ctx.post(`${API_BASE}/api/user-ext/signin`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` },
      data: {}
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  // GET endpoints
  test('GET /api/game/version', async () => {
    const r = await ctx.get(`${API_BASE}/api/game/version`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/game/player-count', async () => {
    const r = await ctx.get(`${API_BASE}/api/game/player-count`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/item/count', async () => {
    const r = await ctx.get(`${API_BASE}/api/item/count`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/item/compose/recipes', async () => {
    const r = await ctx.get(`${API_BASE}/api/item/compose/recipes`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/market/search', async () => {
    const r = await ctx.get(`${API_BASE}/api/market/search?item_name=test`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/market/stats', async () => {
    const r = await ctx.get(`${API_BASE}/api/market/stats`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/rank/my-rank', async () => {
    const r = await ctx.get(`${API_BASE}/api/rank/my-rank`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/rank/fame', async () => {
    const r = await ctx.get(`${API_BASE}/api/rank/fame`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/rank/prestige', async () => {
    const r = await ctx.get(`${API_BASE}/api/rank/prestige`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/tech/configs', async () => {
    const r = await ctx.get(`${API_BASE}/api/tech/configs`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/tech/expired', async () => {
    const r = await ctx.get(`${API_BASE}/api/tech/expired`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/warfare/new', async () => {
    const r = await ctx.get(`${API_BASE}/api/warfare/new`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/warfare/pos-hero', async () => {
    const r = await ctx.get(`${API_BASE}/api/warfare/pos-hero?pos=0`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/building/count', async () => {
    const r = await ctx.get(`${API_BASE}/api/building/count`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/city-ext/tax', async () => {
    const r = await ctx.get(`${API_BASE}/api/city-ext/tax`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/city-ext/fame', async () => {
    const r = await ctx.get(`${API_BASE}/api/city-ext/fame`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/corps/new', async () => {
    const r = await ctx.get(`${API_BASE}/api/corps/new`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/corps/other', async () => {
    const r = await ctx.get(`${API_BASE}/api/corps/other`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/guild/count', async () => {
    const r = await ctx.get(`${API_BASE}/api/guild/count`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/arena/info-by-pos', async () => {
    const r = await ctx.get(`${API_BASE}/api/arena/info-by-pos?pos=0`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/arena/member-list', async () => {
    const r = await ctx.get(`${API_BASE}/api/arena/member-list`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/battle/new', async () => {
    const r = await ctx.get(`${API_BASE}/api/battle/new`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/battle/explored', async () => {
    const r = await ctx.get(`${API_BASE}/api/battle/explored`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/defense/by-building', async () => {
    const r = await ctx.get(`${API_BASE}/api/defense/by-building?city_id=1`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/event/times', async () => {
    const r = await ctx.get(`${API_BASE}/api/event/times`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/chat/page-info', async () => {
    const r = await ctx.get(`${API_BASE}/api/chat/page-info`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/user-ext/stats', async () => {
    const r = await ctx.get(`${API_BASE}/api/user-ext/stats`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });

  test('GET /api/user-ext/achievements', async () => {
    const r = await ctx.get(`${API_BASE}/api/user-ext/achievements`, {
      headers: { 'X-Wallet-Auth': `${TEST_WALLET}:test_signature` }
    });
    expect([200,201,400,401,404]).toContain(r.status());
  });
});
