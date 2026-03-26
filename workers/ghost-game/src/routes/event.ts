/**
 * 时间事件路由 - 处理建筑建造、科技研究、英雄训练、防御建筑、军团事件等
 * 
 * C# 参考: jx/BLL/Event.cs, jx/BLL/Building.cs, jx/BLL/Technic.cs, jx/BLL/Hero.cs
 * 
 * 字段映射 (C# EventInfo → JS):
 *   ID → id
 *   EventType → event_type (1=建筑,2=科技,3=防御,4=英雄,5=军团)
 *   ActionType → action_type (1=建造,2=升级,3=研究,4=训练,5=降级,6=拆除...)
 *   State / EventState → state (0=未完成,1=进行中,2=等待中)
 *   ObjType → object_type (同 event_type)
 *   ObjID → object_id (静态配置ID)
 *   ObjLevel → object_level (目标等级)
 *   BeginTime → start_time
 *   OverTime → end_time
 *   RemainTime → remain_seconds (计算得出)
 *   EventPos → event_pos (位置)
 *   EventQueue → event_queue (队列序号)
 *   TargetCity → target_city (目标城市)
 *   CityID → city_id
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import taskService from '../services/task.service';
import { finishFightEvent } from '../services/battle-settlement.svc';
import missionsByLevelConfig from '../config/missions_by_level.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// ============================================
// 常量定义
// ============================================

// 事件类型 (对应 C# ObjType)
const EVENT_TYPES = {
  BUILDING: 1,    // 内政建筑
  TECHNIC: 2,     // 科技
  DEFENCE: 3,     // 防御建筑
  HERO: 4,        // 英雄
  CORPS: 5,       // 军团/部队
};

// 动作类型 (对应 C# ActionType)
const ACTION_TYPES = {
  BUILD: 1,        // 建造
  UPGRADE: 2,      // 升级
  RESEARCH: 3,     // 研究
  TRAIN: 4,        // 训练
  DEGRADE: 5,      // 降级
  DESTROY: 6,      // 拆除
  MOVE: 7,         // 移动
  GATHER: 8,       // 采集
  REINFORCE: 9,    // 增援
  RETURN: 10,      // 召回
  ATTACK: 11,      // 攻击
  DEFEND: 12,      // 防御
  SUPPORT: 13,     // 支援
  // 扩展动作类型
  BUILD_DEFENCE: 20,  // 建造防御建筑
  MOVE_TROOP: 21,    // 部队移动
  COLONIZE: 22,      // 殖民
  HERO_AUTO_EXP: 23, // 英雄自动经验
  ARENA_FIGHT: 26,    // 竞技场战斗
};

// 事件状态
const EVENT_STATES = {
  NOT_STARTED: 0,  // 未开始
  IN_PROGRESS: 1,  // 进行中
  WAITING: 2,      // 等待中（排在后面）
  COMPLETED: 3,    // 已完成
  CANCELLED: 4,    // 已取消
};

// 取消返还比例 (与 C# ConfigurationManager.AppSettings["EventBreakReturnResPercent"] 一致)
const EVENT_BREAK_RETURN_PERCENT = 70; // 70%

// ============================================
// 辅助函数
// ============================================

// 竞技场默认时间配置（与 arena.ts 保持一致）
const ARENA_DEFAULT_START = '20:00:00';
const ARENA_DEFAULT_END = '22:00:00';

/**
 * 检查当前是否在竞技场时间段内
 * 参考 jx/BLL/FestivalActive.IsAtArenaTime()
 */
async function isAtArenaTime(kv: KVNamespace | undefined): Promise<boolean> {
  let startTime = ARENA_DEFAULT_START;
  let endTime = ARENA_DEFAULT_END;
  if (kv) {
    try {
      const savedStart = await kv.get('arena:start_time');
      const savedEnd = await kv.get('arena:end_time');
      if (savedStart) startTime = savedStart;
      if (savedEnd) endTime = savedEnd;
    } catch (_) { /* use defaults */ }
  }
  // 非零时间才认为配置了活动
  if (startTime === '00:00:00' && endTime === '00:00:00') return false;
  const now = new Date();
  const todayStart = new Date(now);
  const sp = startTime.split(':');
  todayStart.setHours(parseInt(sp[0]), parseInt(sp[1]), parseInt(sp[2]), 0);
  const todayEnd = new Date(now);
  const ep = endTime.split(':');
  todayEnd.setHours(parseInt(ep[0]), parseInt(ep[1]), parseInt(ep[2]), 0);
  return now >= todayStart && now <= todayEnd;
}

/**
 * 获取用户的帮派 UID（仅数值部分）
 * 参考 C#: WebGame.BLL.Organize.GetMyOrgnizeInfo(userName).MyOrganize.UID
 */
async function getUserGuildUID(db: any, walletAddress: string): Promise<number | null> {
  const row: any = await db.prepare(`
    SELECT guild_id FROM guild_members WHERE wallet_address = ?
  `).bind(walletAddress).first();
  return row ? row.guild_id : null;
}

/**
 * 格式化时长为可读字符串
 */
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

/**
 * 将 DB 行结果映射为 C# EventInfo 格式
 */
/**
 * 根据 ObjType 从已JOIN的行数据中提取 ObjName 和 ObjImg
 * 适用于 list 路由中的 LEFT JOIN 查询
 */
function extractObjNameImg(row: any, objType: number): { objName: string; objImg: string } {
  let objName = '';
  let objImg = '';

  switch (objType) {
    case EVENT_TYPES.BUILDING:
      // LEFT JOIN building_configs bc ON b.static_index = bc.id
      objName = row.config_name || '';
      objImg = row.config_image || row.image || '';
      break;
    case EVENT_TYPES.TECHNIC:
      // LEFT JOIN tech_configs tc ON t.static_index = tc.id
      objName = row.tech_name || row.config_name || '';
      objImg = row.tech_image || row.config_image || row.image || '';
      break;
    case EVENT_TYPES.DEFENCE:
      // LEFT JOIN defence_configs dc ON d.static_index = dc.id
      objName = row.config_name || '';
      objImg = row.config_image || row.image || '';
      break;
    case EVENT_TYPES.HERO:
      // LEFT JOIN hero_configs hc ON h.config_id = hc.id
      objName = row.hero_name || row.config_name || row.name || '';
      objImg = row.portrait || row.config_portrait || row.image || '';
      break;
  }

  return { objName, objImg };
}

/**
 * 补充单个事件的 ObjName / ObjImg / FromCityName
 * 参考 C# GetValidEvent 中填充 ObjName/ObjImg 的逻辑
 */
async function enrichEventInfo(db: any, event: any): Promise<void> {
  const objType = parseInt(event.ObjType) || parseInt(event.object_type) || 0;
  const objId = parseInt(event.ObjID) || parseInt(event.object_id) || 0;
  const objectLevel = parseInt(event.ObjLevel) || parseInt(event.object_level) || 1;

  // ObjName / ObjImg
  if (objId > 0) {
    try {
      switch (objType) {
        case EVENT_TYPES.BUILDING: {
          // C#: XmlData.IntertorBuilding[eventArray[i].ObjID].Name
          //     XmlData.IntertorBuilding[eventArray[i].ObjID].InteriorData[eventArray[i].ObjLevel].Image
          const building: any = await db.prepare(`
            SELECT bc.name as config_name, bc.image
            FROM buildings b
            JOIN building_configs bc ON b.static_index = bc.id
            WHERE b.id = ?
          `).bind(objId).first();
          if (building) {
            event.ObjName = building.config_name || `建筑 Lv.${objectLevel}`;
            event.ObjImg = building.image || '';
          }
          break;
        }
        case EVENT_TYPES.TECHNIC: {
          // C#: XmlData.Technic[eventArray[i].ObjID].Name
          //     XmlData.Technic[eventArray[i].ObjID].Image
          const tech: any = await db.prepare(`
            SELECT tc.name as tech_name, tc.image
            FROM technics t
            JOIN tech_configs tc ON t.static_index = tc.id
            WHERE t.id = ?
          `).bind(objId).first();
          if (tech) {
            event.ObjName = tech.tech_name || `科技 Lv.${objectLevel}`;
            event.ObjImg = tech.image || '';
          }
          break;
        }
        case EVENT_TYPES.HERO: {
          // C#: Hero.GetHeroByID → heroSingle.Name
          //     XmlData.HreoPortrait[heroSingle.PortraitIndex].Image
          const hero: any = await db.prepare(`
            SELECT h.name, h.portrait, hc.portrait as config_portrait
            FROM heroes h
            LEFT JOIN hero_configs hc ON h.config_id = hc.id
            WHERE h.id = ?
          `).bind(objId).first();
          if (hero) {
            event.ObjName = hero.name || `英雄 Lv.${objectLevel}`;
            event.ObjImg = hero.portrait || hero.config_portrait || '';
          }
          break;
        }
        case EVENT_TYPES.DEFENCE: {
          // C#: XmlData.DefenceBuilding[eventArray[i].ObjID].Name
          //     XmlData.DefenceBuilding[eventArray[i].ObjID].Image
          const defence: any = await db.prepare(`
            SELECT dc.name as config_name, dc.image
            FROM defence_buildings d
            JOIN defence_configs dc ON d.static_index = dc.id
            WHERE d.id = ?
          `).bind(objId).first();
          if (defence) {
            event.ObjName = defence.config_name || `防御 Lv.${objectLevel}`;
            event.ObjImg = defence.image || '';
          }
          break;
        }
        case EVENT_TYPES.CORPS: {
          // C#: CorpsInfo / CityShotInfo → ObjName (城市名)
          // 对于部队类型，ObjName 通常是目标城市名，已通过 TargetCity 字段提供
          break;
        }
      }
    } catch (err) {
      // enrichment 失败不影响主流程
      console.warn('[Event] enrichEventInfo failed:', err);
    }
  }

  // FromCityName - 来源城市名（当前城市）
  const cityId = parseInt(event.CityID) || parseInt(event.city_id) || 0;
  if (cityId > 0) {
    try {
      const city: any = await db.prepare(`
        SELECT c.name FROM cities c WHERE c.id = ?
      `).bind(cityId).first();
      if (city) {
        event.FromCityName = city.name || '';
      }
    } catch (err) {
      event.FromCityName = '';
    }
  } else {
    event.FromCityName = '';
  }
}

function mapEventInfo(row: any, objName = '', objImg = '', fromCityName = ''): any {
  const now = new Date();
  const endTime = new Date(row.end_time);
  const startTime = new Date(row.start_time);
  const remainSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

  // 计算事件状态 (参考 C# GetValidEvent)
  // 如果开始时间 > 当前时间，则为等待中(2)，否则为进行中(1)
  let state = row.state || row.event_state || EVENT_STATES.IN_PROGRESS;
  if (startTime > now) {
    state = EVENT_STATES.WAITING;
  } else if (remainSeconds <= 0) {
    state = EVENT_STATES.COMPLETED;
  }

  return {
    // C# EventInfo 核心字段
    ID: row.id,
    EventType: row.event_type || 0,
    ActionType: row.action_type || 0,
    State: state,
    ObjType: row.object_type || row.event_type || 0,
    ObjID: row.object_id || row.target_id || 0,
    ObjLevel: row.object_level || 1,
    BeginTime: row.start_time,
    OverTime: row.end_time,
    RemainTime: remainSeconds,
    EventPos: row.event_pos || 0,
    EventQueue: row.event_queue || 0,
    TargetCity: row.target_city || 0,
    CityID: row.city_id || 0,
    UserName: row.wallet_address,
    // C# EventInfo 缺失字段补全 (参考 jx/Model/EventInfo.cs)
    ObjImg: objImg,
    ObjName: objName,
    FromCityName: fromCityName,
    // 额外字段
    target_id: row.target_id,
    event_queue: row.event_queue || 0,
    event_pos: row.event_pos || 0,
    object_type: row.object_type || 0,
    object_id: row.object_id || 0,
    object_level: row.object_level || 1,
    city_id: row.city_id || 0,
    city_name: row.city_name || '',
    // 计算字段
    remain_seconds: remainSeconds,
    remain_time: formatDuration(remainSeconds),
    // 兼容
    state: state,
    event_state: state,
  };
}

// ============================================
// GET /event/list - 获取所有事件（支持未登录）
// ============================================
app.get('/list', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: false, error: 'Database not configured' }, 503);

  // 可选认证：未登录也能查看
  const walletAddress = await verifyWalletAuth(c).catch(() => null);
  const cityId = c.req.query('city_id');
  const eventType = c.req.query('event_type');
  const { page = '1', page_size = '20' } = c.req.query();
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(page_size as string) || 20));
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    let query = `SELECT te.* FROM time_events te WHERE 1=1`;
    const params: any[] = [];

    if (walletAddress) {
      query += ` AND te.wallet_address = ?`;
      params.push(walletAddress);
    }

    // time_events表没有city_id列，只有wallet_address
    // 如果需要按城市过滤，需要先通过wallet_address查城市

    if (eventType !== undefined) {
      query += ' AND te.event_type = ?';
      params.push(parseInt(eventType));
    }

    query += ' ORDER BY te.end_time ASC LIMIT ? OFFSET ?';
    params.push(pageSizeNum, offset);

    const events = await db.prepare(query).bind(...params).all();
    const rows = events.results || [];
    const mappedEvents = rows.map((row: any) => mapEventInfo(row));
    // 补充 ObjName / ObjImg / FromCityName
    await Promise.all(mappedEvents.map((evt: any) => enrichEventInfo(db, evt)));

    return c.json({ success: true, data: { events: mappedEvents, total: mappedEvents.length, page: pageNum } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ============================================
// GET /event/active - 获取进行中的事件（支持未登录）
// ============================================
app.get('/active', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: false, error: 'Database not configured' }, 503);

  const walletAddress = await verifyWalletAuth(c).catch(() => null);

  try {
    let query = `SELECT te.* FROM time_events te WHERE te.end_time > datetime('now')`;
    const params: any[] = [];

    if (walletAddress) {
      query += ` AND te.wallet_address = ?`;
      params.push(walletAddress);
    }

    query += ' ORDER BY te.end_time ASC';

    const events = await db.prepare(query).bind(...params).all();
    const rows = events.results || [];
    const mappedEvents = rows.map((row: any) => mapEventInfo(row));
    // 补充 ObjName / ObjImg / FromCityName
    await Promise.all(mappedEvents.map((evt: any) => enrichEventInfo(db, evt)));

    return c.json({ success: true, data: { events: mappedEvents, total: mappedEvents.length } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ============================================
// GET /event/completable - 获取可完成的事件（支持未登录）
// ============================================
app.get('/completable', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ success: false, error: 'Database not configured' }, 503);

  const walletAddress = await verifyWalletAuth(c).catch(() => null);

  try {
    let query = `SELECT te.* FROM time_events te WHERE te.end_time <= datetime('now')`;
    const params: any[] = [];

    if (walletAddress) {
      query += ` AND te.wallet_address = ?`;
      params.push(walletAddress);
    }

    query += ' ORDER BY te.end_time ASC';

    const events = await db.prepare(query).bind(...params).all();
    const rows = events.results || [];
    const mappedEvents = rows.map((row: any) => mapEventInfo(row));
    // 补充 ObjName / ObjImg / FromCityName
    await Promise.all(mappedEvents.map((evt: any) => enrichEventInfo(db, evt)));

    return c.json({ success: true, data: { events: mappedEvents, total: mappedEvents.length } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ============================================
// GET /event/pending - 获取所有等待中的事件
// C#: Event.GetValidEvent(userName, cityID)
// ============================================
app.get('/pending', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const eventType = c.req.query('event_type');

  try {
    let query = `
      SELECT te.* FROM time_events te
      WHERE te.wallet_address = ? AND te.end_time > datetime('now')
    `;
    const params: any[] = [walletAddress];

    if (eventType !== undefined) {
      query += ' AND te.event_type = ?';
      params.push(parseInt(eventType));
    }

    query += ' ORDER BY te.end_time ASC';

    const events = await db.prepare(query).bind(...params).all();
    const rows = events.results || [];

    const mappedEvents = rows.map((row: any) => mapEventInfo(row));
    // 补充 ObjName / ObjImg / FromCityName
    await Promise.all(mappedEvents.map((evt: any) => enrichEventInfo(db, evt)));

    return success(c, {
      events: mappedEvents,
      total: mappedEvents.length,
    });
  } catch (err: any) {
    console.error('GetValidEvent error:', err);
    return error(c, err.message);
  }
});

// ============================================
// GET /event/valid - 获取当前进行中的事件
// C#: Event.GetValidEvent(userName, cityID)
// 返回格式：没有事件时返回 [{ID: -1}]，不是空数组
// 【重要】必须放在 /:id 之前
// ============================================
app.get('/valid', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return success(c, [{ ID: -1 }]);
  }

  const db = c.env.DB;
  if (!db) {
    return success(c, [{ ID: -1 }]);
  }

  try {
    const events = await db.prepare(`
      SELECT * FROM time_events 
      WHERE wallet_address = ? AND end_time > datetime('now')
      ORDER BY end_time ASC
    `).bind(walletAddress).all();

    if (!events.results || events.results.length === 0) {
      return success(c, [{ ID: -1 }]);
    }

    const mapped = events.results.map((row: any) => mapEventInfo(row));
    // 补充 ObjName / ObjImg / FromCityName
    await Promise.all(mapped.map((evt: any) => enrichEventInfo(db, evt)));
    return success(c, mapped);
  } catch (err: any) {
    console.error('GetValidEvent error:', err);
    return success(c, [{ ID: -1 }]);
  }
});

// ============================================
// GET /event/move-time - 计算移动时间 (必须在 /:id 之前)
// ============================================
// GET /event/move-time - 计算移动时间
// C#: Event.GetMoveTime(userName, cityID, cityPos, otherCityPos, taskFlag, arrayType)
// 包含：基础计算 + 科技加速(Technic[15]) + 军团协战减免(arrayType[0]==12) + 竞技场位置处理
// ============================================
app.get('/move-time', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);
  const cityPos = parseInt(c.req.query('city_pos') || '0');
  const otherCityPos = parseInt(c.req.query('target_pos') || '0');
  const taskFlag = parseInt(c.req.query('task_flag') || '0');
  const arrayTypeStr = c.req.query('array_type') || '0';
  const arrayTypes = arrayTypeStr.split(',').map(Number);
  if (!cityPos || !otherCityPos) return error(c, 'city_pos and target_pos are required');
  try {
    const BIG_MAP_LENGTH = parseInt(c.env.BIG_MAP_LENGTH || '20');
    const DISTANCE_TIME_RATE = parseInt(c.env.DISTANCE_TIME_RATE || '18');
    const FIXED_MOVE_TIME = parseInt(c.env.FIXED_MOVE_TIME || '300');
    const MOVE_TO_ARENA_TIME = 30;
    const EVENT_TIME_PERCENT = 100;
    // 计算格子坐标 (x: 1~Length, y: 1~∞)
    const x1 = cityPos % BIG_MAP_LENGTH === 0 ? BIG_MAP_LENGTH : cityPos % BIG_MAP_LENGTH;
    const y1 = Math.floor((cityPos - 1) / BIG_MAP_LENGTH) + 1;
    const x2 = otherCityPos % BIG_MAP_LENGTH === 0 ? BIG_MAP_LENGTH : otherCityPos % BIG_MAP_LENGTH;
    const y2 = Math.floor((otherCityPos - 1) / BIG_MAP_LENGTH) + 1;
    const distance = Math.round(Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2)) * DISTANCE_TIME_RATE);
    let seconds = Math.round((DISTANCE_TIME_RATE * distance + FIXED_MOVE_TIME) * EVENT_TIME_PERCENT * 0.01);
    // C#: 竞技场位置检查 x=0 或 x=BIG_MAP_LENGTH，且 y>15 (通过 ArenaNpcPosList 配置)
    // 简化检查：(x2 === 0 || x2 === BIG_MAP_LENGTH) && y2 > 15
    const isArenaPos = (x2 === 0 || x2 === BIG_MAP_LENGTH) && y2 > 15;
    // C#: FestivalActive.IsAtArenaTime() - 必须同时满足：竞技场位置 且 活动期间
    if (isArenaPos && await isAtArenaTime(c.env.KV)) {
      seconds = MOVE_TO_ARENA_TIME;
    }
    // C#: arrayType[0] == 12 (同盟友军) 享受 5% 时间减免
    // 但必须双方军团 UID 相同才能减免
    if (arrayTypes[0] === 12) {
      const myGuild = await getUserGuildUID(db, walletAddress);
      if (myGuild) {
        const targetCityRow: any = await db.prepare(`
          SELECT wallet_address FROM cities WHERE position = ?
        `).bind(otherCityPos).first();
        if (targetCityRow) {
          const targetGuild = await getUserGuildUID(db, targetCityRow.wallet_address);
          if (targetGuild && myGuild === targetGuild) {
            seconds = Math.round(seconds * 0.95);
          }
        }
      }
    }
    // C#: Technic[15] 移动速度科技加速
    // 从 technics 表查询用户学习的科技等级
    const TECH_SPEEDUP_ID = 15;
    const userTech: any = await db.prepare(`
      SELECT technic_level FROM technics 
      WHERE wallet_address = ? AND static_index = ?
    `).bind(walletAddress, TECH_SPEEDUP_ID).first();
    
    // 从 technics.json 配置文件读取科技效果
    if (userTech && userTech.technic_level > 0) {
      try {
        const technicsConfig = await import('../config/technics.json');
        const tech15 = technicsConfig.default.find((t: any) => t.ID === 15);
        if (tech15 && tech15.InteriorData) {
          const levelData = tech15.InteriorData.find((d: any) => d.Level === userTech.technic_level);
          if (levelData && levelData.EffValue) {
            // EffValue 是百分比，如 100 表示 100% 时间 (无加速)，值越小加速越多
            const speedPercent = levelData.EffValue;
            if (speedPercent < 100) {
              seconds = Math.round(seconds * speedPercent / 100);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load technics config:', e);
      }
    }
    return success(c, { city_pos: cityPos, target_pos: otherCityPos, task_flag: taskFlag, distance, seconds });
  } catch (err: any) { return error(c, err.message); }
});

// ============================================
// GET /event/:id - 获取单个事件详情
// ============================================
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = parseInt(c.req.param('id'));
  if (isNaN(eventId) || eventId <= 0) {
    return error(c, 'Invalid event ID');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const event: any = await db.prepare(`
      SELECT te.* FROM time_events te
      WHERE te.id = ? AND te.wallet_address = ?
    `).bind(eventId, walletAddress).first();

    if (!event) return error(c, 'Event not found', 404);

    const mapped = mapEventInfo(event);

    // 补充对象名称和图片 (使用 C# 字段名 ObjName/ObjImg)
    // 兼容：同时提供下划线版本供旧前端使用
    let objName = '';
    let objImg = '';

    switch (mapped.ObjType) {
      case EVENT_TYPES.BUILDING: {
        const building: any = await db.prepare(`
          SELECT b.*, bc.name as config_name, bc.image
          FROM buildings b
          JOIN building_configs bc ON b.static_index = bc.id
          WHERE b.id = ?
        `).bind(event.target_id).first();
        if (building) {
          objName = building.config_name || `建筑 Lv.${building.level}`;
          objImg = building.image || '';
        }
        break;
      }
      case EVENT_TYPES.TECHNIC: {
        const tech: any = await db.prepare(`
          SELECT t.*, tc.name as tech_name, tc.image
          FROM technics t
          JOIN tech_configs tc ON t.static_index = tc.id
          WHERE t.id = ?
        `).bind(event.target_id).first();
        if (tech) {
          objName = tech.tech_name || `科技 Lv.${tech.level}`;
          objImg = tech.image || '';
        }
        break;
      }
      case EVENT_TYPES.HERO: {
        const hero: any = await db.prepare(`
          SELECT * FROM heroes WHERE id = ?
        `).bind(event.target_id).first();
        if (hero) {
          objName = hero.name || `英雄 Lv.${hero.level}`;
          objImg = hero.portrait || '';
        }
        break;
      }
      case EVENT_TYPES.DEFENCE: {
        const defence: any = await db.prepare(`
          SELECT d.*, dc.name as config_name, dc.image
          FROM defence_buildings d
          JOIN defence_configs dc ON d.static_index = dc.id
          WHERE d.id = ?
        `).bind(event.target_id).first();
        if (defence) {
          objName = defence.config_name || `防御 Lv.${defence.level}`;
          objImg = defence.image || '';
        }
        break;
      }
    }

    // FromCityName - 来源城市名
    const cityId = parseInt(mapped.CityID) || 0;
    let fromCityName = '';
    if (cityId > 0) {
      const city: any = await db.prepare(`SELECT name FROM cities WHERE id = ?`).bind(cityId).first();
      fromCityName = city?.name || '';
    }

    return success(c, {
      ...mapped,
      ObjName: objName,
      ObjImg: objImg,
      FromCityName: fromCityName,
      // 兼容旧前端的下划线版本
      obj_name: objName,
      obj_img: objImg,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============================================
// POST /event/complete - 完成事件（内部调用/加速完成）
// C#: Building.UpdateBuildingLevel, Technic.UpdateTechnicLevel 等
// ============================================
app.post('/complete', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取所有已过期的事件（end_time <= now）
    const overdueEvents = await db.prepare(`
      SELECT * FROM time_events 
      WHERE wallet_address = ? AND end_time <= datetime('now')
      ORDER BY end_time ASC
    `).bind(walletAddress).all();

    if (!overdueEvents.results || overdueEvents.results.length === 0) {
      return success(c, { completed: 0, events: [] });
    }

    const completedIds: number[] = [];
    const errors: string[] = [];

    for (const event of (overdueEvents.results as any[])) {
      try {
        await completeSingleEvent(db, event);
        completedIds.push(event.id);
      } catch (err: any) {
        errors.push(`Event ${event.id}: ${err.message}`);
      }
    }

    return success(c, {
      completed: completedIds.length,
      event_ids: completedIds,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============================================
// POST /event/:id/complete - 完成单个指定事件
// ============================================
app.post('/:id/complete', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = parseInt(c.req.param('id'));
  if (isNaN(eventId) || eventId <= 0) {
    return error(c, 'Invalid event ID');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const event: any = await db.prepare(`
      SELECT * FROM time_events WHERE id = ? AND wallet_address = ?
    `).bind(eventId, walletAddress).first();

    if (!event) return error(c, 'Event not found', 404);

    // 检查事件是否已过期
    const now = new Date();
    const endTime = new Date(event.end_time);

    if (endTime > now) {
      return error(c, 'Event not yet completed. Use speedup to finish early.');
    }

    await completeSingleEvent(db, event);

    return success(c, {
      event_id: eventId,
      message: 'Event completed successfully',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============================================
// POST /event/:id/cancel - 取消事件（返还部分资源）
// C#: Event.DeleteEvent(userName, cityID, eventID)
// ============================================
app.post('/:id/cancel', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = parseInt(c.req.param('id'));
  if (isNaN(eventId) || eventId <= 0) {
    return error(c, 'Invalid event ID');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const event: any = await db.prepare(`
      SELECT * FROM time_events WHERE id = ? AND wallet_address = ?
    `).bind(eventId, walletAddress).first();

    if (!event) return error(c, 'Event not found', 404);

    // 检查事件是否已完成（不能再取消）
    if (new Date(event.end_time) <= new Date()) {
      return error(c, 'Event already completed, cannot cancel');
    }

    // ============================================
    // 【关键修复】ActionType == 8 不可删除 (参考 C# DeleteEvent)
    // C#: if (eventSingle.ActionType == 8) return 30184;
    // ============================================
    const actionType = event.action_type;
    if (actionType === ACTION_TYPES.GATHER) {
      return error(c, 'Gather event cannot be cancelled', 403);
    }

    // 检查战斗相关事件不可取消
    if (actionType === ACTION_TYPES.ATTACK || actionType === ACTION_TYPES.DEFEND) {
      return error(c, 'Battle events cannot be cancelled');
    }

    // 处理资源返还
    const refund = await cancelEventAndRefund(db, event);

    return success(c, {
      event_id: eventId,
      refunded: refund,
      message: 'Event cancelled successfully',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============================================
// POST /event/:id/speedup - 加速事件（消耗金条）
// ============================================
app.post('/:id/speedup', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const eventId = parseInt(c.req.param('id'));
  const { use_gold } = await c.req.json().catch(() => ({}));

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const event: any = await db.prepare(`
      SELECT te.* FROM time_events te
      WHERE te.id = ? AND te.wallet_address = ?
    `).bind(eventId, walletAddress).first();

    if (!event) return error(c, 'Event not found', 404);

    // 计算剩余时间
    const now = new Date();
    const endTime = new Date(event.end_time);
    const remainSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

    if (remainSeconds <= 0) {
      return error(c, 'Event already completed');
    }

    // 计算加速费用：10金条/小时，不足1小时按1小时计算
    const hours = Math.ceil(remainSeconds / 3600);
    const goldCost = hours * 10;

    // 获取角色金条
    const character: any = await db.prepare(`
      SELECT gold FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!character || (character.gold || 0) < goldCost) {
      return error(c, `Not enough gold. Need ${goldCost} gold, have ${character?.gold || 0}`);
    }

    // 扣除金条
    await db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(goldCost, walletAddress).run();

    // 完成事件
    await completeSingleEvent(db, event);

    return success(c, {
      event_id: eventId,
      gold_used: goldCost,
      message: 'Event speeded up and completed',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============================================
// GET /event/queue/:cityId - 获取队列数量
// ============================================
app.get('/queue/:cityId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityId = parseInt(c.req.param('cityId'));
  if (isNaN(cityId) || cityId <= 0) {
    return error(c, 'Invalid city ID');
  }

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
      max_queue: 5,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});



// ============================================
// POST /event/delete - 删除事件（不返还资源）
// C#: Event.DeleteEvent(userName, cityID, eventID) 变体
// ============================================
app.post('/delete', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { event_id, city_id } = await c.req.json().catch(() => ({}));

  if (!event_id) {
    return error(c, 'event_id is required');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 验证事件属于该用户
    const event: any = await db.prepare(`
      SELECT * FROM time_events WHERE id = ? AND wallet_address = ?
    `).bind(event_id, walletAddress).first();

    if (!event) return error(c, 'Event not found', 404);

    // 直接删除事件（不返还资源）
    await db.prepare('DELETE FROM time_events WHERE id = ?').bind(event_id).run();

    return success(c, {
      event_id,
      message: 'Event deleted successfully',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============================================
// 内部方法：完成单个事件
// ============================================
async function completeSingleEvent(db: any, event: any): Promise<void> {
  const eventType = parseInt(event.event_type);
  const targetId = parseInt(event.target_id);
  const cityId = parseInt(event.city_id);
  const objectLevel = parseInt(event.object_level) || 1;
  const walletAddress = event.wallet_address;

  switch (eventType) {
    case EVENT_TYPES.BUILDING: {
      // 建筑建造/升级完成
      // C#: Building.UpdateBuildingLevel(userName, eventID, buildID, level, cityID)
      // 找到该城市的对应建筑，更新等级
      const building: any = await db.prepare(`
        SELECT * FROM buildings WHERE id = ? AND city_id = ?
      `).bind(targetId, cityId).first();

      if (building) {
        // 更新建筑等级
        await db.prepare(`
          UPDATE buildings SET level = ?, state = 0, updated_at = datetime('now')
          WHERE id = ?
        `).bind(objectLevel, targetId).run();
      }
      break;
    }

    case EVENT_TYPES.TECHNIC: {
      // 科技研究完成
      // C#: Technic.UpdateTechnicLevel(userName, eventID, cityID, technicIndex, level)
      const technic: any = await db.prepare(`
        SELECT * FROM technics WHERE id = ? AND city_id = ?
      `).bind(targetId, cityId).first();

      if (technic) {
        await db.prepare(`
          UPDATE technics SET level = ?, state = 0, updated_at = datetime('now')
          WHERE id = ?
        `).bind(objectLevel, targetId).run();
      }
      break;
    }

    case EVENT_TYPES.DEFENCE: {
      // 防御建筑建造完成
      const defence: any = await db.prepare(`
        SELECT * FROM defence_buildings WHERE id = ? AND city_id = ?
      `).bind(targetId, cityId).first();

      if (defence) {
        await db.prepare(`
          UPDATE defence_buildings SET level = ?, state = 0, updated_at = datetime('now')
          WHERE id = ?
        `).bind(objectLevel, targetId).run();
      }
      break;
    }

    case EVENT_TYPES.HERO: {
      // 英雄训练完成
      // C#: Hero.UpdateHeroTrain(userName, cityID, heroID, training, state, eventID)
      const hero: any = await db.prepare(`
        SELECT * FROM heroes WHERE id = ? AND city_id = ?
      `).bind(targetId, cityId).first();

      if (hero) {
        // 训练完成，清除训练状态
        await db.prepare(`
          UPDATE heroes SET training = 0, state = 0, updated_at = datetime('now')
          WHERE id = ?
        `).bind(targetId).run();
      }
      break;
    }

    case EVENT_TYPES.CORPS: {
      // 军团/部队事件完成
      // 主要是移动、增援、召回等事件
      // 这里主要处理部队状态更新
      const troop: any = await db.prepare(`
        SELECT * FROM troops WHERE id = ? AND city_id = ?
      `).bind(targetId, cityId).first();

      if (troop) {
        const actionType = parseInt(event.action_type);
        if (actionType === ACTION_TYPES.MOVE || actionType === ACTION_TYPES.REINFORCE) {
          // 部队移动到达
          await db.prepare(`
            UPDATE troops SET state = 0, updated_at = datetime('now')
            WHERE id = ?
          `).bind(targetId).run();
        } else if (actionType === ACTION_TYPES.RETURN) {
          // 部队召回完成
          await db.prepare(`
            UPDATE troops SET state = 0, location_city_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(event.city_id, targetId).run();
        }
      }

      // ============================================
      // FinishFightEvent - 完整战斗结算
      // 参考 jx/BLL/Event.cs FinishFightEvent 及全部21个子方法
      // actionType=11=攻击, actionType=12=防御, actionType=26=竞技场
      // ============================================
      const battleActionType = parseInt(event.action_type);
      if (battleActionType === ACTION_TYPES.ATTACK ||
          battleActionType === ACTION_TYPES.DEFEND ||
          battleActionType === ACTION_TYPES.ARENA_FIGHT) {

        // 调用完整的战斗结算服务 (21个子方法全部实现)
        const settlementResult = await finishFightEvent(
          db,
          walletAddress,
          cityId,
          event
        );

        if (!settlementResult.success) {
          console.error(`[FinishFightEvent] Settlement failed: ${settlementResult.error}`);
        } else {
          console.log(`[FinishFightEvent] Settlement completed, winner: ${settlementResult.summary?.FightWinName}`);

          // 根据结算结果更新战斗任务
          const isWin = settlementResult.summary?.FightWinFlag === 1;
          const targetType = parseInt(event.target_type) || 1; // 1=玩家

          const fightTask = await taskService.getFitFightTask(db, walletAddress, cityId, parseInt(event.event_pos));
          if (fightTask) {
            const updatedTask = await taskService.updateFightTaskProgress(
              db, walletAddress, cityId, fightTask.id, isWin, targetType
            );
            if (updatedTask) {
              console.log(`[FinishFightEvent] Task ${fightTask.id} progress updated: win=${isWin}`);
            }
          }
        }
      }
      break;
    }

    case 5: {
      // 探索事件 (event_type=5, action_type=14)
      // C#: Event.FinishSearchEvent - 探索完成，触发任务更新和邮件通知
      const actionType = parseInt(event.action_type);
      if (actionType === 14) {
        // 探索事件完成：更新 CityInterior 资源
        // C#: CityInterior.GetCityInteriorInfo(UserName, CityID, dbEvent.EndTime, 1)
        // 探索消耗人口，不需额外扣除（已在 AddSearchEvent 时扣除）
        // 构建 EventInfo 格式
        const eventInfo = {
          ID: event.id,
          TargetCity: parseInt(event.target_city) || 0,
          ActionType: actionType,
          State: 1,
        };

        // 更新城市状态（探索不需要额外资源更新，探索消耗已在添加时扣除）
        // C#: Task.FinishSearchTask(userName, cityID, eventSingle, ...)
        // 这里延迟到任务系统处理，事件完成标记已设置
        console.log(`Search event completed: wallet=${walletAddress}, target=${eventInfo.TargetCity}`);
      }
      break;
    }

    default:
      console.warn(`Unknown event type: ${eventType}`);
  }

  // 删除事件记录
  await db.prepare('DELETE FROM time_events WHERE id = ?').bind(event.id).run();
}

// ============================================
// 内部方法：取消事件并返还资源
// C#: Event.DeleteEvent - 参考 DeleteEvent 中的返还逻辑
// ============================================
async function cancelEventAndRefund(db: any, event: any): Promise<{ money: number; food: number; population: number; gold: number }> {
  const refund = { money: 0, food: 0, population: 0, gold: 0 };
  const eventType = parseInt(event.event_type);
  const targetId = parseInt(event.target_id);
  const cityId = parseInt(event.city_id);
  const actionType = parseInt(event.action_type);
  const objectLevel = parseInt(event.object_level) || 1;

  // 返还比例
  const returnPercent = EVENT_BREAK_RETURN_PERCENT / 100.0;

  switch (eventType) {
    case EVENT_TYPES.BUILDING: {
      // 建筑取消
      // C#: ObjType == 1 处理，返还 CostFood/CostMoney/CostMen * EventBreakReturnResPercent
      const building: any = await db.prepare(`
        SELECT b.*, bc.name as config_name, 
               bc.build_money, bc.build_food, bc.build_population,
               bc.build_gold
        FROM buildings b
        JOIN building_configs bc ON b.static_index = bc.id
        WHERE b.id = ?
      `).bind(targetId).first();

      if (building) {
        if (actionType === ACTION_TYPES.DEGRADE) {
          // 降级：返还比例更低
          // 参考 C#: DegradeNeedResPercent
          const degradePercent = 0.5; // 降级返还50%
          refund.money = Math.floor((building.build_money || 0) * returnPercent * degradePercent);
          refund.food = Math.floor((building.build_food || 0) * returnPercent * degradePercent);
          refund.population = Math.floor((building.build_population || 0) * returnPercent * degradePercent);
        } else {
          // 正常建造/升级取消
          refund.money = Math.floor((building.build_money || 0) * returnPercent);
          refund.food = Math.floor((building.build_food || 0) * returnPercent);
          refund.population = Math.floor((building.build_population || 0) * returnPercent);
          refund.gold = Math.floor((building.build_gold || 0) * returnPercent);
        }

        // 更新城市资源
        if (cityId > 0) {
          await db.prepare(`
            UPDATE cities 
            SET money = money + ?, food = food + ?, population = population + ?
            WHERE id = ?
          `).bind(refund.money, refund.food, refund.population, cityId).run();
        }

        // 删除建筑记录
        await db.prepare('DELETE FROM buildings WHERE id = ?').bind(targetId).run();
      }
      break;
    }

    case EVENT_TYPES.TECHNIC: {
      // 科技取消
      const tech: any = await db.prepare(`
        SELECT t.*, tc.research_money, tc.research_food, tc.research_gold
        FROM technics t
        JOIN tech_configs tc ON t.static_index = tc.id
        WHERE t.id = ?
      `).bind(targetId).first();

      if (tech) {
        refund.money = Math.floor((tech.research_money || 0) * returnPercent);
        refund.food = Math.floor((tech.research_food || 0) * returnPercent);
        refund.gold = Math.floor((tech.research_gold || 0) * returnPercent);

        if (cityId > 0) {
          await db.prepare(`
            UPDATE cities 
            SET money = money + ?, food = food + ?
            WHERE id = ?
          `).bind(refund.money, refund.food, cityId).run();
        }

        // 删除科技记录
        await db.prepare('DELETE FROM technics WHERE id = ?').bind(targetId).run();
      }
      break;
    }

    case EVENT_TYPES.DEFENCE: {
      // 防御建筑取消
      const defence: any = await db.prepare(`
        SELECT d.*, dc.build_money, dc.build_food, dc.build_gold
        FROM defence_buildings d
        JOIN defence_configs dc ON d.static_index = dc.id
        WHERE d.id = ?
      `).bind(targetId).first();

      if (defence) {
        refund.money = Math.floor((defence.build_money || 0) * returnPercent);
        refund.food = Math.floor((defence.build_food || 0) * returnPercent);
        refund.gold = Math.floor((defence.build_gold || 0) * returnPercent);

        if (cityId > 0) {
          await db.prepare(`
            UPDATE cities 
            SET money = money + ?, food = food + ?
            WHERE id = ?
          `).bind(refund.money, refund.food, cityId).run();
        }

        await db.prepare('DELETE FROM defence_buildings WHERE id = ?').bind(targetId).run();
      }
      break;
    }

    case EVENT_TYPES.HERO: {
      // 英雄训练取消
      const hero: any = await db.prepare(`
        SELECT h.*, hc.train_money, hc.train_food, hc.train_gold
        FROM heroes h
        JOIN hero_configs hc ON h.config_id = hc.id
        WHERE h.id = ?
      `).bind(targetId).first();

      if (hero) {
        refund.money = Math.floor((hero.train_money || 0) * returnPercent);
        refund.food = Math.floor((hero.train_food || 0) * returnPercent);
        refund.gold = Math.floor((hero.train_gold || 0) * returnPercent);

        if (cityId > 0) {
          await db.prepare(`
            UPDATE cities 
            SET money = money + ?, food = food + ?
            WHERE id = ?
          `).bind(refund.money, refund.food, cityId).run();
        }

        // 取消训练状态
        await db.prepare(`
          UPDATE heroes SET training = 0, state = 0 WHERE id = ?
        `).bind(targetId).run();
      }
      break;
    }

    case EVENT_TYPES.CORPS: {
      // 军团/部队事件取消（主要是移动中）
      // 采集、增援、移动等可以取消
      if (actionType === ACTION_TYPES.MOVE || actionType === ACTION_TYPES.GATHER) {
        const troop: any = await db.prepare(`
          SELECT * FROM troops WHERE id = ?
        `).bind(targetId).first();

        if (troop) {
          // 部队返回原城市
          await db.prepare(`
            UPDATE troops SET state = 0, location_city_id = city_id WHERE id = ?
          `).bind(targetId).run();
        }
      }
      break;
    }
  }

  // 扣除金条返还
  if (refund.gold > 0) {
    const walletAddress = event.wallet_address;
    await db.prepare(`
      UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
    `).bind(refund.gold, walletAddress).run();
  }

  // ============================================
  // 后续事件时间重排 (参考 C# Event.DeleteEvent 逻辑)
  // 当事件被取消后，后续同类型事件的开始和结束时间需要提前
  // ============================================
  try {
    // 计算被删除事件的持续时间 (spaceTime)
    const now = new Date();
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);

    let spaceTimeSeconds = 0;
    const secondsUntilStart = (eventStart.getTime() - now.getTime()) / 1000;

    if (secondsUntilStart < 0) {
      // 事件已开始，计算剩余时间
      spaceTimeSeconds = Math.max(0, (eventEnd.getTime() - now.getTime()) / 1000);
    } else {
      // 事件尚未开始，使用完整持续时间
      spaceTimeSeconds = (eventEnd.getTime() - eventStart.getTime()) / 1000;
    }

    // 只有 ObjType=1 (建筑) 需要重排 (参考 C# DeleteEvent)
    // 其他类型 (科技/防御/英雄/部队) 暂不处理
    if (eventType === EVENT_TYPES.BUILDING && spaceTimeSeconds > 0) {
      // 获取所有后续事件 (同 ObjType，且结束时间在当前事件之后)
      const subsequentEventsResult: any = await db.prepare(`
        SELECT * FROM time_events
        WHERE wallet_address = ?
          AND city_id = ?
          AND event_type = ?
          AND end_time > ?
        ORDER BY end_time ASC
      `).bind(
        event.wallet_address,
        cityId,
        eventType,
        event.end_time
      ).all();

      // 更新后续事件的时间 (都提前 spaceTimeSeconds)
      const subsequentEvents = subsequentEventsResult.results || subsequentEventsResult;
      for (const evt of subsequentEvents) {
        const evtStart = new Date(evt.start_time);
        const evtEnd = new Date(evt.end_time);

        const newStartTime = new Date(evtStart.getTime() - spaceTimeSeconds * 1000);
        const newEndTime = new Date(evtEnd.getTime() - spaceTimeSeconds * 1000);

        await db.prepare(`
          UPDATE time_events
          SET start_time = ?, end_time = ?
          WHERE id = ?
        `).bind(
          newStartTime.toISOString(),
          newEndTime.toISOString(),
          evt.id
        ).run();
      }
    }
  } catch (rescheduleErr) {
    // 时间重排失败不影响事件取消
    console.error('[Event] Reschedule subsequent events failed:', rescheduleErr);
  }

  // 删除事件记录
  await db.prepare('DELETE FROM time_events WHERE id = ?').bind(event.id).run();

  return refund;
}

// ============================================
// POST /event/search - 添加搜索事件
// C#: Event.AddSearchEvent(userName, cityID, targetPos)
// 前端: AddSearchEvent → POST /event/search
// 消耗 15 人口，探索目标位置
// ============================================
app.post('/search', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, search_type } = await c.req.json().catch(() => ({}));

  if (!city_id) return error(c, 'city_id is required');

  const cityId = parseInt(city_id);
  const targetPos = parseInt(search_type || '0');

  try {
    // 验证城市属于该用户
    const city: any = await db.prepare(`
      SELECT c.*, ci.population as men, ci.food, ci.money, ci.gold
      FROM cities c
      LEFT JOIN city_interior ci ON c.id = ci.city_id
      WHERE c.id = ? AND c.wallet_address = ?
    `).bind(cityId, walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    // 检查人口是否足够（消耗 15 人口）
    const MEN_COST = 15;
    const men = (city as any)?.men || 0;
    if (men < MEN_COST) return error(c, 'Not enough population (need 15)');

    // 搜索时间（秒），默认 5 分钟 = 300 秒
    const SEARCH_TIME = 300;

    const now = new Date();
    const endTime = new Date(now.getTime() + SEARCH_TIME * 1000);

    // 插入搜索事件
    // event_type=5(探索), action_type=14(搜索), object_type=6(探索类型), event_queue=3
    const result = await db.prepare(`
      INSERT INTO time_events (wallet_address, city_id, event_type, action_type, target_id, object_type, object_id, object_level, event_pos, event_queue, target_city, start_time, end_time, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      walletAddress,
      cityId,
      5,       // event_type: 探索
      14,      // action_type: 搜索
      -1,      // target_id: 暂用 -1
      6,       // object_type: 探索类型
      -1,      // object_id
      -1,      // object_level
      cityId,  // event_pos: 城市ID
      3,       // event_queue: 高优先级
      targetPos, // target_city: 目标位置
      now.toISOString(),
      endTime.toISOString(),
      0        // state: 进行中
    ).run();

    // 扣除人口
    await db.prepare(`
      UPDATE city_interior SET population = population - ? WHERE city_id = ?
    `).bind(MEN_COST, cityId).run();

    return success(c, {
      event_id: result.meta?.last_row_id || 0,
      city_id: cityId,
      target_pos: targetPos,
      men_cost: MEN_COST,
      search_time: SEARCH_TIME,
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      message: 'Search event created successfully',
    });
  } catch (err: any) {
    console.error('AddSearchEvent error:', err);
    return error(c, err.message);
  }
});

// ============================================
// POST /event/visit - 添加访问事件（寻访英雄等）
// C#: EventEx.AddEventEx(userName, cityID, actionType, objType, objID, position, goldFlag)
// 前端: AddVisitEvent → POST /event/visit
// actionType: 6=寻访, 27=快速寻访 等
// objType: 1=内政建筑
// goldFlag: 0=普通, 1=使用金条加速
// ============================================
app.post('/visit', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { cityID, actionType, objType, objID, pos, goldFlag } = await c.req.json().catch(() => ({}));

  if (!cityID) return error(c, 'cityID is required');

  const cityId = parseInt(cityID);
  const actType = parseInt(actionType || '6');
  const oType = parseInt(objType || '1');
  const oID = parseInt(objID || '0');
  const position = parseInt(pos || '0');
  const isGoldFlag = goldFlag === 1 || goldFlag === '1';

  try {
    // 验证城市属于该用户
    const city: any = await db.prepare(`
      SELECT c.*, ci.population as men, ci.food, ci.money, ci.gold
      FROM cities c
      LEFT JOIN city_interior ci ON c.id = ci.city_id
      WHERE c.id = ? AND c.wallet_address = ?
    `).bind(cityId, walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    // 寻访英雄消耗的资源（参考 C# 配置）
    const VISIT_MONEY = 100;   // FindHeroNeedMoney
    const VISIT_FOOD = 50;     // FindHeroNeedFood
    const VISIT_TIME_NORMAL = 300;   // 普通寻访 5 分钟（秒）
    const VISIT_TIME_GOLD = 30;      // 快速寻访 30 秒
    const VISIT_GOLD_COST = 5;       // 金条消耗

    const money = (city as any)?.money || 0;
    const food = (city as any)?.food || 0;
    const men = (city as any)?.men || 0;
    const gold = (city as any)?.gold || 0;

    // actionType=6 或 27：寻访英雄
    if (actType === 6 || actType === 27) {
      // 检查资源是否足够
      if (money < VISIT_MONEY || food < VISIT_FOOD) {
        return error(c, 'Not enough resources (need money and food for visit)');
      }

      // 金条模式检查
      if (isGoldFlag && gold < VISIT_GOLD_COST) {
        return error(c, 'Not enough gold (need 5 gold for quick visit)');
      }

      // 计算持续时间
      const visitTime = isGoldFlag ? VISIT_TIME_GOLD : VISIT_TIME_NORMAL;

      const now = new Date();
      const endTime = new Date(now.getTime() + visitTime * 1000);

      // 事件类型：1=英雄事件，event_queue=3
      // actionType: 6=普通寻访, 27=快速寻访
      const result = await db.prepare(`
        INSERT INTO time_events (wallet_address, city_id, event_type, action_type, target_id, object_type, object_id, object_level, event_pos, event_queue, target_city, start_time, end_time, state)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        walletAddress,
        cityId,
        4,       // event_type: 英雄事件
        actType, // action_type: 6 或 27
        -1,      // target_id
        oType,   // object_type: 1=内政建筑
        oID,     // object_id: 建筑静态索引
        1,       // object_level: 目标等级
        position || oID, // event_pos: 位置
        3,       // event_queue: 高优先级
        0,       // target_city
        now.toISOString(),
        endTime.toISOString(),
        0        // state: 进行中
      ).run();

      // 扣除资源
      await db.prepare(`
        UPDATE city_interior
        SET money = money - ?, food = food - ?, gold = gold - ?
        WHERE city_id = ?
      `).bind(
        isGoldFlag ? 0 : VISIT_MONEY,
        isGoldFlag ? 0 : VISIT_FOOD,
        isGoldFlag ? VISIT_GOLD_COST : 0,
        cityId
      ).run();

      return success(c, {
        event_id: result.meta?.last_row_id || 0,
        city_id: cityId,
        action_type: actType,
        object_type: oType,
        object_id: oID,
        position: position || oID,
        gold_flag: isGoldFlag,
        money_cost: isGoldFlag ? 0 : VISIT_MONEY,
        food_cost: isGoldFlag ? 0 : VISIT_FOOD,
        gold_cost: isGoldFlag ? VISIT_GOLD_COST : 0,
        visit_time: visitTime,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        message: 'Visit event created successfully',
      });
    }

    // 其他 actionType 暂返回不支持
    return error(c, `Unsupported actionType: ${actType}. Supported: 6 (visit), 27 (quick visit)`);
  } catch (err: any) {
    console.error('AddVisitEvent error:', err);
    return error(c, err.message);
  }
});

// ============================================
// POST /event/daily - 添加每日任务事件
// C#: Event.AddDailyTaskEvent(userName, cityID)
// 每日任务通过 event_type=6, action_type=15 标识
// 前端: AddDailyTaskEvent → POST /event/daily
// ============================================
app.post('/daily', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, task_type } = await c.req.json().catch(() => ({}));

  if (!city_id) return error(c, 'city_id is required');

  const cityId = parseInt(city_id);
  const taskType = parseInt(task_type || '15'); // action_type=15 表示每日任务

  try {
    // 验证城市属于该用户，并获取人口
    const city: any = await db.prepare(`
      SELECT c.*, ci.population as men
      FROM cities c
      LEFT JOIN city_interior ci ON c.id = ci.city_id
      WHERE c.id = ? AND c.wallet_address = ?
    `).bind(cityId, walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    // C#: AddDailyTaskEvent 扣除 50 人口
    const DAILY_POP_COST = 50;
    const men = (city as any)?.men || 0;
    if (men < DAILY_POP_COST) return error(c, `Not enough population (need ${DAILY_POP_COST})`);

    // 检查每日任务数量限制（参考 C#: 每日任务最多3个）
    const dailyCount: any = await db.prepare(`
      SELECT COUNT(*) as cnt FROM time_events
      WHERE wallet_address = ? AND city_id = ? AND event_type = 6
    `).bind(walletAddress, cityId).first();

    if ((dailyCount?.cnt || 0) >= 4) {
      return error(c, 'Daily task limit reached (max 3)', 403);
    }

    // 每日任务时间：默认 4 小时 = 14400 秒
    // C#: int seconds = int.Parse(ConfigurationManager.AppSettings["DailyTaskNeedTime"]);
    const dailyDuration = 14400;

    const now = new Date();
    const endTime = new Date(now.getTime() + dailyDuration * 1000);

    // event_type=6(每日任务), action_type=15(每日任务类型), event_queue=4
    const result = await db.prepare(`
      INSERT INTO time_events (wallet_address, city_id, event_type, action_type, target_id, object_type, object_id, object_level, event_pos, event_queue, target_city, start_time, end_time, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      walletAddress,
      cityId,
      6,       // event_type: 每日任务
      taskType, // action_type: 15=每日任务
      0,       // target_id
      6,       // object_type: 任务类型
      taskType, // object_id: 任务配置ID
      1,       // object_level
      cityId,  // event_pos
      4,       // event_queue: 低优先级
      0,       // target_city
      now.toISOString(),
      endTime.toISOString(),
      0        // state: 进行中
    ).run();

    // 扣除人口（C#: AddDailyTaskEvent 中 res.Population -= men）
    await db.prepare(`
      UPDATE city_interior SET population = population - ? WHERE city_id = ?
    `).bind(DAILY_POP_COST, cityId).run();

    return success(c, {
      event_id: result.meta?.last_row_id || 0,
      city_id: cityId,
      task_type: taskType,
      duration: dailyDuration,
      men_cost: DAILY_POP_COST,
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      message: 'Daily task event created successfully',
    });
  } catch (err: any) {
    console.error('AddDailyTaskEvent error:', err);
    return error(c, err.message);
  }
});

// ============================================
// POST /event/compose - 添加合成任务事件
// C#: Mission.CreateComposeMission(userName, cityID)
// 合成任务通过 MissionType=3 区分
// 前端: AddComposeTaskEvent → POST /event/compose
// 消耗: 人口100 + 1元宝
// ============================================
app.post('/compose', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id } = await c.req.json().catch(() => ({}));

  if (!city_id) return error(c, 'city_id is required');

  const cityId = parseInt(city_id);

  try {
    // 验证城市属于该用户
    const city: any = await db.prepare(`
      SELECT c.*, ci.population as men, ci.money, ci.food, ci.gold
      FROM cities c
      LEFT JOIN city_interior ci ON c.id = ci.city_id
      WHERE c.id = ? AND c.wallet_address = ?
    `).bind(cityId, walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    // 检查合成任务数量限制（参考 C#: 最多3个合成任务）
    const composeCount: any = await db.prepare(`
      SELECT COUNT(*) as cnt FROM missions
      WHERE wallet_address = ? AND city_id = ? AND mission_type = 3
    `).bind(walletAddress, cityId).first();

    if ((composeCount?.cnt || 0) >= 3) {
      return error(c, 'Compose task limit reached (max 3)', 403);
    }

    // 合成任务消耗：100人口 + 1元宝（参考 C# CreateComposeMission）
    const MEN_COST = 100;
    const GOLD_COST = 1;

    const men = (city as any)?.men || 0;
    const gold = (city as any)?.gold || 0;

    if (men < MEN_COST) return error(c, `Not enough population (need ${MEN_COST})`);
    if (gold < GOLD_COST) return error(c, `Not enough gold (need ${GOLD_COST})`);

    // 获取用户等级（用于生成对应等级的合成任务）
    const userLevel: any = await db.prepare(`
      SELECT user_level FROM city_interior WHERE city_id = ?
    `).bind(cityId).first();
    const level = (userLevel as any)?.user_level || 1;

    // 从JSON配置文件获取合成任务 (NameType=6为合成任务)
    // 参考 jx/BLL/Mission.cs: ComposeMissionByLevel
    const composeMissions = (missionsByLevelConfig.Mission || []).filter(
      (m: any) => m.NameType === 6 && m.Level <= level
    );

    if (composeMissions.length === 0) {
      return error(c, 'No available compose mission for your level', 404);
    }

    // 随机选择一个合成任务
    const composeConfig = composeMissions[Math.floor(Math.random() * composeMissions.length)];

    // 扣除资源
    await db.prepare(`
      UPDATE city_interior
      SET population = population - ?, gold = gold - ?
      WHERE city_id = ?
    `).bind(MEN_COST, GOLD_COST, cityId).run();

    // 创建合成任务记录
    const result = await db.prepare(`
      INSERT INTO missions (wallet_address, city_id, mission_type, condition_index, gain_index, target_pos, mission_state, has_task_item_num, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      walletAddress,
      cityId,
      3,                           // mission_type: 合成任务
      composeConfig.Condition1,     // 合成条件索引
      composeConfig.Gain1,          // 合成奖励索引
      0,                           // target_pos: 无目标位置
      1,                           // mission_state: 进行中
      0                            // has_task_item_num: 初始0
    ).run();

    // 记录元宝消耗日志
    // UserLog.CreateUseGoldLog(userName, 34, "合成任务", 1, true, DateTime.Now)

    return success(c, {
      event_id: result.meta?.last_row_id || 0,
      city_id: cityId,
      compose_id: composeConfig.ID,
      compose_name: composeConfig.Name || '合成任务',
      men_cost: MEN_COST,
      gold_cost: GOLD_COST,
      message: 'Compose task created successfully',
    });
  } catch (err: any) {
    console.error('AddComposeTaskEvent error:', err);
    return error(c, err.message);
  }
});

export default app;
