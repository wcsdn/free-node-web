/**
 * Event System Extensions - 事件系统扩展
 * 从 jx/BLL/EventEx.cs + jx/DALEX/EventExAccess.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';

// 事件类型
export const EVENT_TYPES = {
  STORY: { id: 1, name: '剧情事件' },
  RANDOM: { id: 2, name: '随机事件' },
  DAILY: { id: 3, name: '日常事件' },
  WEEKLY: { id: 4, name: '每周事件' },
  LIMITED: { id: 5, name: '限时事件' },
  GUILD: { id: 6, name: '军团事件' },
};

// 事件状态
export const EVENT_STATES = {
  PENDING: 0,     // 未开始
  IN_PROGRESS: 1, // 进行中
  COMPLETED: 2,   // 完成
  FAILED: 3,      // 失败
  EXPIRED: 4,     // 过期
};

// 事件配置
export const EVENT_CONFIG = {
  MAX_CONCURRENT: 5,          // 最大同时进行事件数
  EXPIRE_HOURS: 24,           // 过期时间（小时）
  AUTO_CLEAR_HOURS: 48,       // 自动清除时间（小时）
  REFRESH_INTERVAL: 3600,     // 随机事件刷新间隔（秒）
};

// 随机事件池
export const RANDOM_EVENT_POOL = [
  { id: 101, name: '流浪商人', type: 'shop', weight: 10, reward: { gold: 100 } },
  { id: 102, name: '神秘宝箱', type: 'chest', weight: 15, reward: { item: 1001, count: 1 } },
  { id: 103, name: '迷途旅人', type: 'quest', weight: 20, reward: { exp: 50 } },
  { id: 104, name: '山贼袭击', type: 'combat', weight: 25, reward: { gold: 200 } },
  { id: 105, name: '宝藏线索', type: 'clue', weight: 15, reward: { item: 2001, count: 1 } },
  { id: 106, name: '老友拜访', type: 'story', weight: 10, reward: { gold: 150, exp: 30 } },
];

// 剧情事件配置
export const STORY_EVENT_CONFIG = {
  // 按章节分组的剧情事件
  CHAPTERS: {
    1: { name: '初入江湖', events: [1001, 1002, 1003, 1004, 1005], unlockLevel: 1 },
    2: { name: '扬名立万', events: [1010, 1011, 1012, 1013, 1014], unlockLevel: 10 },
    3: { name: '群雄逐鹿', events: [1020, 1021, 1022, 1023, 1024], unlockLevel: 20 },
    4: { name: '天下大乱', events: [1030, 1031, 1032, 1033, 1034], unlockLevel: 30 },
    5: { name: '一统天下', events: [1040, 1041, 1042, 1043, 1044], unlockLevel: 40 },
  },
};

export class EventServiceExtension {
  private db: D1Database;
  constructor(db: D1Database) { this.db = db; }

  // ==================== 事件查询 ====================

  /** 获取进行中事件 */
  async getActiveEvents(walletAddress: string) {
    const events: any = await this.db.prepare(`
      SELECT e.*, ec.name, ec.description, ec.type as event_type, ec.reward_gold, ec.reward_exp, ec.reward_items
      FROM user_events e
      JOIN events_config ec ON e.event_id = ec.id
      WHERE e.wallet_address = ? AND e.state = ?
      ORDER BY e.created_at DESC
    `).bind(walletAddress, EVENT_STATES.IN_PROGRESS).all();

    return {
      success: true,
      events: (events.results || []).map((e: any) => ({
        id: e.id,
        eventId: e.event_id,
        name: e.name,
        description: e.description,
        type: e.event_type,
        typeName: EVENT_TYPES[e.event_type as keyof typeof EVENT_TYPES]?.name || '未知',
        state: e.state,
        stateName: '进行中',
        progress: e.progress,
        target: e.target,
        startTime: e.start_time,
        expireTime: e.expire_time,
        rewardGold: e.reward_gold,
        rewardExp: e.reward_exp,
        rewardItems: e.reward_items ? JSON.parse(e.reward_items) : [],
      })),
      count: (events.results || []).length,
      maxConcurrent: EVENT_CONFIG.MAX_CONCURRENT,
    };
  }

  /** 获取可接事件列表 */
  async getAvailableEvents(walletAddress: string) {
    const user: any = await this.db.prepare(`SELECT level FROM users WHERE wallet_address = ?`).bind(walletAddress).first();
    const level = user?.level || 1;

    // 获取已接事件ID
    const acceptedIds: any = await this.db.prepare(`
      SELECT event_id FROM user_events WHERE wallet_address = ? AND state IN (?, ?)
    `).bind(walletAddress, EVENT_STATES.IN_PROGRESS, EVENT_STATES.COMPLETED).all();
    const acceptedSet = new Set((acceptedIds.results || []).map((e: any) => e.event_id));

    // 获取符合条件的随机事件
    const randomEvents = RANDOM_EVENT_POOL.filter(e => !acceptedSet.has(e.id));

    // 获取剧情事件（简化：根据等级）
    const chapterEvents = Object.values(STORY_EVENT_CONFIG.CHAPTERS)
      .filter(ch => ch.unlockLevel <= level)
      .flatMap(ch => ch.events)
      .filter(id => !acceptedSet.has(id));

    return {
      success: true,
      randomEvents: randomEvents.map(e => ({
        id: e.id,
        name: e.name,
        type: 'random',
        description: `${e.name} - 几率获得 ${JSON.stringify(e.reward)}`,
      })),
      storyEvents: chapterEvents.map(id => ({
        id,
        name: `剧情事件 ${id}`,
        type: 'story',
        description: '完成剧情任务，推进故事发展',
      })),
    };
  }

  /** 获取过期事件 */
  async getExpiredEvents(walletAddress: string) {
    const events: any = await this.db.prepare(`
      SELECT e.*, ec.name, ec.type as event_type
      FROM user_events e
      JOIN events_config ec ON e.event_id = ec.id
      WHERE e.wallet_address = ? AND e.state = ?
      ORDER BY e.expire_time ASC
    `).bind(walletAddress, EVENT_STATES.IN_PROGRESS).all();

    const now = Date.now() / 1000;
    const expired = (events.results || []).filter((e: any) => e.expire_time < now);

    return {
      success: true,
      expired: expired.map((e: any) => ({
        id: e.id,
        eventId: e.event_id,
        name: e.name,
        type: e.event_type,
        expiredAt: e.expire_time,
      })),
      count: expired.length,
    };
  }

  // ==================== 事件执行 ====================

  /** 接受事件 */
  async acceptEvent(walletAddress: string, eventId: number, eventType: string = 'random') {
    // 检查是否已达上限
    const count: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_events WHERE wallet_address = ? AND state = ?
    `).bind(walletAddress, EVENT_STATES.IN_PROGRESS).first();

    if ((count as any).count >= EVENT_CONFIG.MAX_CONCURRENT) {
      return { success: false, error: '进行中事件已达上限' };
    }

    // 检查是否已接受
    const existing: any = await this.db.prepare(`
      SELECT id FROM user_events WHERE wallet_address = ? AND event_id = ? AND state = ?
    `).bind(walletAddress, eventId, EVENT_STATES.IN_PROGRESS).first();

    if (existing) {
      return { success: false, error: '事件已接受' };
    }

    const now = Math.floor(Date.now() / 1000);
    const expireTime = now + EVENT_CONFIG.EXPIRE_HOURS * 3600;

    await this.db.prepare(`
      INSERT INTO user_events (wallet_address, event_id, state, progress, target, start_time, expire_time, created_at)
      VALUES (?, ?, ?, 0, 1, ?, ?, datetime('now'))
    `).bind(walletAddress, eventId, EVENT_STATES.IN_PROGRESS, now, expireTime).run();

    const event = RANDOM_EVENT_POOL.find(e => e.id === eventId);
    return {
      success: true,
      eventId,
      name: event?.name || `事件 ${eventId}`,
      expireTime,
      message: '事件已接受',
    };
  }

  /** 放弃事件 */
  async abandonEvent(walletAddress: string, eventId: number) {
    await this.db.prepare(`
      UPDATE user_events SET state = ? WHERE wallet_address = ? AND event_id = ?
    `).bind(EVENT_STATES.FAILED, walletAddress, eventId).run();

    return { success: true, eventId, message: '事件已放弃' };
  }

  /** 更新事件进度 */
  async updateProgress(walletAddress: string, eventId: number, delta: number) {
    const event: any = await this.db.prepare(`
      SELECT * FROM user_events WHERE wallet_address = ? AND event_id = ? AND state = ?
    `).bind(walletAddress, eventId, EVENT_STATES.IN_PROGRESS).first();

    if (!event) {
      return { success: false, error: '事件不存在或已完成' };
    }

    const newProgress = Math.min((event.progress || 0) + delta, event.target);
    const completed = newProgress >= event.target;

    await this.db.prepare(`
      UPDATE user_events SET progress = ?, state = ? WHERE id = ?
    `).bind(newProgress, completed ? EVENT_STATES.COMPLETED : EVENT_STATES.IN_PROGRESS, event.id).run();

    if (completed) {
      // 发放奖励
      const reward = RANDOM_EVENT_POOL.find(e => e.id === eventId)?.reward || { gold: 0, exp: 0 };
      
      if (reward.gold && reward.gold > 0) {
        await this.db.prepare(`UPDATE users SET gold = gold + ? WHERE wallet_address = ?`)
          .bind(reward.gold, walletAddress).run();
      }
      if (reward.exp && reward.exp > 0) {
        await this.db.prepare(`UPDATE users SET exp = exp + ? WHERE wallet_address = ?`)
          .bind(reward.exp, walletAddress).run();
      }

      return {
        success: true,
        eventId,
        completed: true,
        reward,
        message: `事件完成！获得 ${JSON.stringify(reward)}`,
      };
    }

    return {
      success: true,
      eventId,
      completed: false,
      progress: newProgress,
      target: event.target,
    };
  }

  /** 刷新随机事件 */
  async refreshRandomEvents(walletAddress: string) {
    const lastRefresh: any = await this.db.prepare(`
      SELECT last_refresh FROM event_refresh WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const now = Math.floor(Date.now() / 1000);
    if (lastRefresh && (now - (lastRefresh as any).last_refresh) < EVENT_CONFIG.REFRESH_INTERVAL) {
      const remaining = EVENT_CONFIG.REFRESH_INTERVAL - (now - (lastRefresh as any).last_refresh);
      return { success: false, error: `请等待 ${Math.ceil(remaining / 60)} 分钟` };
    }

    await this.db.prepare(`
      INSERT INTO event_refresh (wallet_address, last_refresh) VALUES (?, ?)
      ON CONFLICT (wallet_address) DO UPDATE SET last_refresh = ?
    `).bind(walletAddress, now, now).run();

    // 随机选择3个事件
    const shuffled = [...RANDOM_EVENT_POOL].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    return {
      success: true,
      events: selected.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        weight: e.weight,
      })),
      nextRefresh: now + EVENT_CONFIG.REFRESH_INTERVAL,
    };
  }

  // ==================== 剧情事件 ====================

  /** 获取剧情章节 */
  async getStoryChapters(walletAddress: string) {
    const user: any = await this.db.prepare(`SELECT level FROM users WHERE wallet_address = ?`).bind(walletAddress).first();
    const level = user?.level || 1;

    // 获取已完成剧情事件
    const completedEvents: any = await this.db.prepare(`
      SELECT event_id FROM user_events WHERE wallet_address = ? AND state = ?
    `).bind(walletAddress, EVENT_STATES.COMPLETED).all();
    const completedSet = new Set((completedEvents.results || []).map((e: any) => e.event_id));

    const chapters = Object.entries(STORY_EVENT_CONFIG.CHAPTERS).map(([id, ch]: [string, any]) => {
      const completed = ch.events.filter((eid: number) => completedSet.has(eid)).length;
      const total = ch.events.length;
      
      return {
        id: parseInt(id),
        name: ch.name,
        unlockLevel: ch.unlockLevel,
        completed,
        total,
        progress: Math.floor((completed / total) * 100),
        isUnlocked: level >= ch.unlockLevel,
        isCompleted: completed >= total,
      };
    });

    return {
      success: true,
      chapters,
      currentChapter: chapters.find(c => !c.isCompleted && c.isUnlocked) || null,
    };
  }

  /** 开始剧情事件 */
  async startStoryEvent(walletAddress: string, eventId: number) {
    const chapter = Object.values(STORY_EVENT_CONFIG.CHAPTERS).find(ch => 
      ch.events.includes(eventId)
    );

    if (!chapter) {
      return { success: false, error: '无效的剧情事件' };
    }

    // 检查前置事件
    const chapterIndex = chapter.events.indexOf(eventId);
    if (chapterIndex > 0) {
      const preEventId = chapter.events[chapterIndex - 1];
      const preCompleted: any = await this.db.prepare(`
        SELECT id FROM user_events WHERE wallet_address = ? AND event_id = ? AND state = ?
      `).bind(walletAddress, preEventId, EVENT_STATES.COMPLETED).first();

      if (!preCompleted) {
        return { success: false, error: '请先完成前置剧情' };
      }
    }

    return this.acceptEvent(walletAddress, eventId, 'story');
  }
}
