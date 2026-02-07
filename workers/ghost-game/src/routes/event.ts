/**
 * 时间事件路由 - 处理建筑建造、科技研究、英雄训练等
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 事件类型
const EVENT_TYPES = {
  BUILDING: 1,      // 建筑建造/升级
  TECHNIC: 2,        // 科技研究
  DEFENCE: 3,        // 防御建筑
  HERO: 4,           // 英雄训练
  CORPS: 5,          // 军团事件
};

// 动作类型
const ACTION_TYPES = {
  BUILD: 1,          // 建造
  UPGRADE: 2,        // 升级
  RESEARCH: 3,      // 研究
  TRAIN: 4,         // 训练
  DEGRADE: 5,       // 降级
  DESTROY: 6,       // 拆除
  MOVE: 7,          // 移动
  GATHER: 8,        // 采集
  REINFORCE: 9,     // 增援
  RETURN: 10,       // 召回
  ATTACK: 11,       // 攻击
  DEFEND: 12,       // 防御
  SUPPORT: 13,      // 支援
};

// 获取玩家所有等待中的事件
app.get('/pending', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const cityId = c.req.query('city_id');

  try {
    let query = `
      SELECT te.*, c.name as city_name
      FROM time_events te
      JOIN cities c ON te.wallet_address = c.wallet_address AND c.id = te.city_id
      WHERE te.wallet_address = ? AND te.end_time > datetime('now')
    `;
    const params: any[] = [walletAddress];

    if (cityId) {
      query += ' AND te.city_id = ?';
      params.push(parseInt(cityId));
    }

    query += ' ORDER BY te.end_time ASC';

    const events = await db.prepare(query).bind(...params).all();

    // 计算剩余时间
    const now = new Date();
    const eventsWithRemain = (events.results || []).map((event: any) => {
      const endTime = new Date(event.end_time);
      const remainSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

      return {
        ...event,
        remain_seconds: remainSeconds,
        remain_time: formatDuration(remainSeconds),
      };
    });

    return success(c, {
      events: eventsWithRemain,
      total: eventsWithRemain.length,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取单个事件的详细信息
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const event: any = await db.prepare(`
      SELECT te.*, c.name as city_name
      FROM time_events te
      JOIN cities c ON te.wallet_address = c.wallet_address AND c.id = te.city_id
      WHERE te.id = ? AND te.wallet_address = ?
    `).bind(eventId, walletAddress).first();

    if (!event) return error(c, 'Event not found');

    // 计算剩余时间
    const now = new Date();
    const endTime = new Date(event.end_time);
    const remainSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

    // 获取关联对象的名称和图片
    let objName = '';
    let objImg = '';

    switch (event.event_type) {
      case EVENT_TYPES.BUILDING:
        // 建筑
        const building: any = await db.prepare(`
          SELECT b.*, bc.name as config_name, bc.image
          FROM buildings b
          JOIN building_configs bc ON b.config_id = bc.id
          WHERE b.id = ?
        `).bind(event.target_id).first();
        if (building) {
          objName = building.config_name || `建筑 Lv.${building.level}`;
          objImg = building.image || '';
        }
        break;

      case EVENT_TYPES.TECHNIC:
        // 科技
        const tech: any = await db.prepare(`
          SELECT t.*, tc.name as tech_name
          FROM technics t
          JOIN tech_configs tc ON t.static_index = tc.id
          WHERE t.id = ?
        `).bind(event.target_id).first();
        if (tech) {
          objName = tech.tech_name || `科技 Lv.${tech.technic_level}`;
        }
        break;

      case EVENT_TYPES.HERO:
        // 英雄
        const hero: any = await db.prepare(`
          SELECT * FROM heroes WHERE id = ?
        `).bind(event.target_id).first();
        if (hero) {
          objName = hero.name || `英雄 Lv.${hero.level}`;
        }
        break;
    }

    return success(c, {
      event: {
        ...event,
        remain_seconds: remainSeconds,
        remain_time: formatDuration(remainSeconds),
        obj_name: objName,
        obj_img: objImg,
      },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 取消事件（返还部分资源）
app.post('/:id/cancel', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取事件信息
    const event: any = await db.prepare(`
      SELECT * FROM time_events WHERE id = ? AND wallet_address = ?
    `).bind(eventId, walletAddress).first();

    if (!event) return error(c, 'Event not found');

    // 检查是否正在战斗中
    if (event.event_type === EVENT_TYPES.HERO && event.action_type === ACTION_TYPES.ATTACK) {
      return error(c, 'Cannot cancel battle in progress');
    }

    // 返还比例
    const RETURN_RATE = 0.7; // 70%

    // 根据事件类型处理
    let refundMoney = 0;
    let refundFood = 0;
    let refundPopulation = 0;

    if (event.event_type === EVENT_TYPES.BUILDING) {
      // 建筑取消返还部分资源
      const building: any = await db.prepare(`
        SELECT * FROM buildings WHERE id = ?
      `).bind(event.target_id).first();

      if (building) {
        // 获取建筑配置
        const config: any = await db.prepare(`
          SELECT * FROM building_configs WHERE id = ?
        `).bind(building.config_id).first();

        if (config) {
          refundMoney = Math.floor((config.build_money || 0) * RETURN_RATE);
          refundFood = Math.floor((config.build_food || 0) * RETURN_RATE);
          refundPopulation = Math.floor((config.build_population || 0) * RETURN_RATE);

          // 更新城市资源
          await db.prepare(`
            UPDATE cities 
            SET money = money + ?, food = food + ?, population = population + ?
            WHERE id = ?
          `).bind(refundMoney, refundFood, refundPopulation, event.city_id).run();

          // 删除建筑
          await db.prepare('DELETE FROM buildings WHERE id = ?').bind(event.target_id).run();
        }
      }
    } else if (event.event_type === EVENT_TYPES.TECHNIC) {
      // 科技取消返还部分资源
      const tech: any = await db.prepare(`
        SELECT t.*, tc.research_money, tc.research_food
        FROM technics t
        JOIN tech_configs tc ON t.static_index = tc.id
        WHERE t.id = ?
      `).bind(event.target_id).first();

      if (tech) {
        refundMoney = Math.floor((tech.research_money || 0) * RETURN_RATE);
        refundFood = Math.floor((tech.research_food || 0) * RETURN_RATE);

        await db.prepare(`
          UPDATE cities 
          SET money = money + ?, food = food + ?
          WHERE id = ?
        `).bind(refundMoney, refundFood, event.city_id).run();

        // 删除科技
        await db.prepare('DELETE FROM technics WHERE id = ?').bind(event.target_id).run();
      }
    } else if (event.event_type === EVENT_TYPES.HERO) {
      // 英雄训练取消
      const hero: any = await db.prepare(`
        SELECT h.*, hc.train_money, hc.train_food
        FROM heroes h
        JOIN hero_configs hc ON h.config_id = hc.id
        WHERE h.id = ?
      `).bind(event.target_id).first();

      if (hero) {
        refundMoney = Math.floor((hero.train_money || 0) * RETURN_RATE);
        refundFood = Math.floor((hero.train_food || 0) * RETURN_RATE);

        await db.prepare(`
          UPDATE cities 
          SET money = money + ?, food = food + ?
          WHERE id = ?
        `).bind(refundMoney, refundFood, event.city_id).run();

        // 取消训练状态
        await db.prepare(`
          UPDATE heroes SET training = 0, state = 0 WHERE id = ?
        `).bind(event.target_id).run();
      }
    }

    // 删除事件
    await db.prepare('DELETE FROM time_events WHERE id = ?').bind(eventId).run();

    return success(c, {
      event_id: eventId,
      refunded: {
        money: refundMoney,
        food: refundFood,
        population: refundPopulation,
      },
      message: 'Event cancelled successfully',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 加速事件（消耗钻石）
app.post('/:id/speedup', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = parseInt(c.req.param('id'));
  const { use_gold } = await c.req.json(); // 是否使用金条加速

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取事件信息
    const event: any = await db.prepare(`
      SELECT te.*, c.gold
      FROM time_events te
      JOIN cities c ON te.city_id = c.id
      WHERE te.id = ? AND te.wallet_address = ?
    `).bind(eventId, walletAddress).first();

    if (!event) return error(c, 'Event not found');

    // 计算剩余时间（秒）
    const now = new Date();
    const endTime = new Date(event.end_time);
    const remainSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

    if (remainSeconds <= 0) {
      return error(c, 'Event already completed');
    }

    // 计算加速费用（10金条/小时，不足1小时按1小时计算）
    const hours = Math.ceil(remainSeconds / 3600);
    const goldCost = hours * 10;

    // 验证金条
    const character: any = await db.prepare(`
      SELECT gold FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!character || character.gold < goldCost) {
      return error(c, `Not enough gold. Need ${goldCost} gold`);
    }

    // 扣除金条
    await db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(goldCost, walletAddress).run();

    // 完成事件
    await completeEvent(db, event);

    return success(c, {
      event_id: eventId,
      gold_used: goldCost,
      message: 'Event completed successfully',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 完成事件（内部方法）
async function completeEvent(db: any, event: any) {
  const now = new Date();

  switch (event.event_type) {
    case EVENT_TYPES.BUILDING:
      // 建筑完成
      await db.prepare(`
        UPDATE buildings SET state = 0 WHERE id = ?
      `).bind(event.target_id).run();
      break;

    case EVENT_TYPES.TECHNIC:
      // 科技完成
      await db.prepare(`
        UPDATE technics SET state = 0 WHERE id = ?
      `).bind(event.target_id).run();
      break;

    case EVENT_TYPES.HERO:
      // 英雄训练完成
      await db.prepare(`
        UPDATE heroes SET training = 0, state = 0 WHERE id = ?
      `).bind(event.target_id).run();
      break;
  }

  // 删除事件
  await db.prepare('DELETE FROM time_events WHERE id = ?').bind(event.id).run();
}

// 获取正在进行的队列数量
app.get('/queue/:cityId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('cityId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const queue: any = await db.prepare(`
      SELECT COUNT(*) as count
      FROM time_events
      WHERE wallet_address = ? AND city_id = ? AND end_time > datetime('now')
    `).bind(walletAddress, cityId).first();

    return success(c, {
      city_id: cityId,
      queue_count: queue?.count || 0,
      max_queue: 5, // 最大队列数
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 辅助函数：格式化时间
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export default app;
