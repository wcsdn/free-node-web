/**
 * 节日活动路由
 * 支持：日常活动、节日奖励、活动状态检测
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

// 活动类型
const EVENT_TYPES = {
  DAILY_LOGIN: 'daily_login',     // 每日登录
  FIRST_RECHARGE: 'first_recharge', // 首次充值
  LEVEL_REWARD: 'level_reward',   // 等级奖励
  ACCUMULATED_LOGIN: 'accumulated_login', // 累计登录
  CONSUME_REWARD: 'consume_reward', // 消费奖励
  ONLINE_REWARD: 'online_reward', // 在线奖励
};

// 节日活动配置
const FESTIVAL_EVENTS = [
  {
    id: 'spring_festival',
    name: '春节活动',
    type: 'special',
    description: '春节期间特殊活动',
    startDate: '2026-01-20',
    endDate: '2026-02-20',
    rewards: {
      login: [
        { day: 1, reward: { gold: 100, items: [1] } },
        { day: 3, reward: { gold: 200, items: [2] } },
        { day: 7, reward: { gold: 500, items: [3] } },
      ],
    },
  },
  {
    id: 'lantern_festival',
    name: '元宵节活动',
    type: 'special',
    description: '元宵节赏灯活动',
    startDate: '2026-02-01',
    endDate: '2026-02-15',
    rewards: {
      login: [
        { day: 1, reward: { gold: 50, items: [4] } },
        { day: 3, reward: { gold: 100, items: [5] } },
      ],
    },
  },
];

// 获取所有活动
app.get('/', async (c) => {
  const db = c.env.DB;
  const now = new Date();

  const activeEvents = FESTIVAL_EVENTS.filter(event => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return now >= start && now <= end;
  });

  return success(c, {
    events: activeEvents,
    total: activeEvents.length,
  });
});

// 获取活动详情
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = c.req.param('id');
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const event = FESTIVAL_EVENTS.find(e => e.id === eventId);
  if (!event) return error(c, 'Event not found');

  try {
    // 获取玩家活动进度
    const progress: any = await db.prepare(`
      SELECT * FROM festival_progress 
      WHERE wallet_address = ? AND event_id = ?
    `).bind(walletAddress, eventId).first();

    return success(c, {
      ...event,
      progress: progress || { day: 0, claimed: [] },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 领取活动奖励
app.post('/:id/claim', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = c.req.param('id');
  const { day, rewardType } = await c.req.json();
  if (!day) return error(c, 'Missing day');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const event = FESTIVAL_EVENTS.find(e => e.id === eventId);
  if (!event) return error(c, 'Event not found');

  try {
    // 检查活动是否进行中
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    if (now < start || now > end) {
      return error(c, 'Event not active');
    }

    // 获取玩家进度
    const progress: any = await db.prepare(`
      SELECT * FROM festival_progress 
      WHERE wallet_address = ? AND event_id = ?
    `).bind(walletAddress, eventId).first();

    const currentDay = progress?.day || 0;
    const claimedDays = progress?.claimed_days ? JSON.parse(progress.claimed_days) : [];

    // 检查是否已领取
    if (claimedDays.includes(day)) {
      return error(c, 'Reward already claimed');
    }

    // 检查是否满足条件
    if (currentDay < day) {
      return error(c, 'Day requirement not met');
    }

    // 获取奖励配置
    const rewardConfig = event.rewards?.[rewardType || 'login']?.find(r => r.day === day);
    if (!rewardConfig) return error(c, 'Reward config not found');

    // 发放奖励
    if (rewardConfig.reward.gold) {
      await db.prepare(`
        UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
      `).bind(rewardConfig.reward.gold, walletAddress).run();
    }

    if (rewardConfig.reward.items?.length) {
      for (const itemId of rewardConfig.reward.items) {
        await db.prepare(`
          INSERT INTO items (wallet_address, config_id, count, source)
          VALUES (?, ?, 1, 'festival')
        `).bind(walletAddress, itemId).run();
      }
    }

    // 更新进度
    claimedDays.push(day);
    await db.prepare(`
      INSERT OR REPLACE INTO festival_progress 
      (wallet_address, event_id, day, claimed_days, last_claim_time)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(walletAddress, eventId, currentDay, JSON.stringify(claimedDays)).run();

    return success(c, {
      day,
      reward: rewardConfig.reward,
      message: `领取成功，获得 ${rewardConfig.reward.gold || 0} 金条`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 更新活动进度
app.post('/:id/progress', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = c.req.param('id');
  const { increment } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      INSERT OR REPLACE INTO festival_progress 
      (wallet_address, event_id, day, last_update)
      VALUES (?, ?, COALESCE((SELECT day FROM festival_progress WHERE wallet_address = ? AND event_id = ?), 0) + ?, datetime('now'))
    `).bind(walletAddress, eventId, walletAddress, eventId, increment || 1).run();

    return success(c, { message: 'Progress updated' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取所有活动配置
app.get('/config/all', async (c) => {
  return success(c, FESTIVAL_EVENTS);
});

// 每日活动
app.get('/daily', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const today = new Date().toISOString().split('T')[0];

    const activities = [
      { id: 'login', name: '每日登录', completed: false, reward: { gold: 50 } },
      { id: 'build', name: '建造建筑', completed: false, reward: { exp: 100 } },
      { id: 'battle', name: '完成战斗', completed: false, reward: { gold: 30 } },
      { id: 'recruit', name: '招募英雄', completed: false, reward: { exp: 50 } },
    ];

    // 检查完成状态
    const completed: any = await db.prepare(`
      SELECT * FROM daily_activity 
      WHERE wallet_address = ? AND date = ?
    `).bind(walletAddress, today).first();

    if (completed) {
      const completedIds = completed.completed_ids ? JSON.parse(completed.completed_ids) : [];
      activities.forEach(a => {
        if (completedIds.includes(a.id)) a.completed = true;
      });
    }

    return success(c, { activities, date: today });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 完成每日活动
app.post('/daily/complete', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { activity_id } = await c.req.json();
  if (!activity_id) return error(c, 'Missing activity_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const today = new Date().toISOString().split('T')[0];

    const existing: any = await db.prepare(`
      SELECT * FROM daily_activity WHERE wallet_address = ? AND date = ?
    `).bind(walletAddress, today).first();

    const completedIds = existing?.completed_ids ? JSON.parse(existing.completed_ids) : [];
    if (completedIds.includes(activity_id)) {
      return error(c, 'Already completed');
    }

    completedIds.push(activity_id);

    await db.prepare(`
      INSERT OR REPLACE INTO daily_activity (wallet_address, date, completed_ids)
      VALUES (?, ?, ?)
    `).bind(walletAddress, today, JSON.stringify(completedIds)).run();

    return success(c, { activityId: activity_id, message: 'Activity completed' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
