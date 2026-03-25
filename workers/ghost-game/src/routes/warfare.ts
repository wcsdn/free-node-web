/**
 * Warfare Routes - 战争系统
 * 参考 jx/BLL/MapUnit.cs 和 jx/BLL/Fight.cs
 * 实现名城战/竞技场战争系统
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import warfareConfig from '../config/warfare.json';
import {
  getChessInfo,
  getChessEvent,
  createChessboard,
  addChessman,
  addPlayer,
  actionMove,
  actionAttack,
  getChessboard,
  removeChessboard,
  CHESSBOARD_WIDTH,
  CHESSBOARD_HEIGHT,
  BATTLE_TYPES,
} from '../services/chessboard.svc';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 错误码映射 (来自 C# BLLEX/ChessEx.cs)
const ERROR_CODES: Record<number, string> = {
  60039: '无最高等级侠客，无法报名',
  60044: '已在报名列表中，请勿重复报名',
  60045: '未找到报名记录，无法取消',
  60046: '该城市没有出战队列侠客',
  60047: '该城市已有军团驻守，无法报名',
  60048: '更新侠客状态失败',
  60052: '已在战场中，无法报名',
  60053: '服务器区服不匹配',
  60054: '战场未开放',
  60055: '已进入战场，无法取消',
};

// Warfare 配置类型
interface WarfareEntry {
  Id: number;
  AthleticsType: number;
  AthleticsMode: number;
  RoomName: string;
  RoomShow: string;
  ManHow: number;
}

// ==================== 工具函数 ====================

/**
 * 获取战区列表 (支持按 type/mode 筛选)
 * 参考 GetWarfareArea(int type, int model) - Main.aspx.cs:4128
 */
function getWarfareAreas(type?: number, mode?: number): WarfareEntry[] {
  const areas = (warfareConfig.Warfare || []) as WarfareEntry[];
  return areas.filter(entry => {
    if (type !== undefined && entry.AthleticsType !== type) return false;
    if (mode !== undefined && entry.AthleticsMode !== mode) return false;
    return true;
  });
}

/**
 * 获取战区详情
 * 参考 GetWarfareDetail(int id) - Main.aspx.cs:4153
 */
function getWarfareDetail(id: number): WarfareEntry | null {
  const areas = (warfareConfig.Warfare || []) as WarfareEntry[];
  return areas.find(e => e.Id === id) || null;
}

// ==================== 错误处理 ====================

function handleError(err: any): { code: number; message: string } {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = Number(err.code);
    if (ERROR_CODES[code]) {
      return { code, message: ERROR_CODES[code] };
    }
  }
  return { code: -1, message: err?.message || '未知错误' };
}

// ==================== 路由实现 ====================

/**
 * GET /warfare/area - 获取战区列表
 * 参考: Main.aspx.cs GetWarfareArea(int type, int model)
 * 
 * Query: type (AthleticsType), mode (AthleticsMode)
 * 
 * AthleticsType: 1=个人竞技, 2=组队竞技, 3=帮派竞技
 * AthleticsMode: 1=死战模式, 2=夺旗模式, 3=竞速模式
 */
app.get('/area', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { type, mode } = c.req.query();

  try {
    const typeNum = type ? parseInt(type) : undefined;
    const modeNum = mode ? parseInt(mode) : undefined;

    const areas = getWarfareAreas(typeNum, modeNum);

    // 格式化返回数据，与 C# GetWarfareArea 保持一致
    // C# 返回格式: {ID:'1',Area:'龙争虎斗'}_{ID:'2',Area:'势均力敌'}_...
    // 前端通过 split('_') 分割，然后 eval() 解析每个对象
    const resultStr = areas.map(entry => 
      `{ID:'${entry.Id}',Area:'${entry.RoomName}',AthleticsType:'${entry.AthleticsType}',AthleticsMode:'${entry.AthleticsMode}',ManHow:'${entry.ManHow}',Description:'${entry.RoomShow}'}`
    ).join('_');

    return success(c, resultStr);
  } catch (err: any) {
    return error(c, err.message);
  }
});

/**
 * GET /warfare/waiting - 获取等待中的名城战
 * 参考: ChessEx.getWaitingList() - 返回各房间等待人数
 * 
 * Query: battle_type (BattleType), athletics_type (AthleticsType)
 * 
 * 返回各等级段的等待人数统计
 * 
 * FIX: maxLevel 从 time_events.state 字段获取 (state=levelSegment 1-10, 0表示未设置)
 *       同时支持按 athleticsType 和 battleType 筛选
 */
app.get('/waiting', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { battle_type, athletics_type } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 从 time_events 表查询等待中的名城战
    // event_type = 'warfare_select' 表示名城战报名
    // target_id 编码: cityId(低8位) | athleticsType(8-12位) | battleType(12-16位)
    // state 字段: levelSegment (1-10) 表示等待中的等级段，0=未设置(兼容旧数据)
    //           >10 的值表示特殊状态: 11=已匹配(在战场中), 12=战斗中
    let query = `
      SELECT te.*, c.name as city_name, c.position as city_pos
      FROM time_events te
      LEFT JOIN cities c ON (te.target_id & 0xFF) = c.id
      WHERE te.event_type = 'warfare_select'
        AND (te.state BETWEEN 1 AND 10 OR te.state = 0)
        AND te.end_time > datetime('now')
    `;
    const bindings: any[] = [];

    if (battle_type) {
      // target_id 的 12-16 位存储 battleType
      query += ` AND ((te.target_id >> 12) & 0xF) = ?`;
      bindings.push(parseInt(battle_type));
    }

    if (athletics_type) {
      // target_id 的 8-12 位存储 athleticsType
      query += ` AND ((te.target_id >> 8) & 0xF) = ?`;
      bindings.push(parseInt(athletics_type));
    }

    query += ` ORDER BY te.created_at DESC LIMIT 200`;

    const result = await db.prepare(query).bind(...bindings).all();

    // 按最高等级分段统计 (参考 C# getWaitingList 逻辑)
    // 索引1-10 对应等级段 1-10
    const waitingByLevel: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
      6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
    };

    const waitingList = (result.results || []).map((row: any) => {
      // FIX: 从 state 字段获取 levelSegment (1-10)，不再是错误的 row.state/10 计算
      // state 1-10 = levelSegment 1-10
      const levelSegment = Math.min(Math.max(row.state || 1, 1), 10);
      if (waitingByLevel[levelSegment] !== undefined) {
        waitingByLevel[levelSegment]++;
      }
      // 从 target_id 正确解码各字段
      const cityId = row.target_id & 0xFF;
      const athleticsType = (row.target_id >> 8) & 0xF;
      const battleType = (row.target_id >> 12) & 0xF;

      return {
        EventID: row.id,
        CityID: cityId,
        CityName: row.city_name || `城市${cityId}`,
        CityPos: row.city_pos || 0,
        UserName: row.wallet_address,
        AthleticsType: athleticsType,
        BattleType: battleType,
        LevelSegment: levelSegment,
        StartTime: row.start_time,
        EndTime: row.end_time,
        State: row.state,
      };
    });

    // C# 风格的返回: 数组索引1-10代表各等级段人数
    const waitingArray = [
      0, // 占位，索引0不用
      waitingByLevel[1] || 0,
      waitingByLevel[2] || 0,
      waitingByLevel[3] || 0,
      waitingByLevel[4] || 0,
      waitingByLevel[5] || 0,
      waitingByLevel[6] || 0,
      waitingByLevel[7] || 0,
      waitingByLevel[8] || 0,
      waitingByLevel[9] || 0,
      waitingByLevel[10] || 0,
    ];

    return success(c, {
      waitingByLevel: waitingArray,
      waitingList,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

/**
 * GET /warfare/user-battle - 获取用户当前参战状态
 * 参考: ChessEx.getUserBattleInfo() - Main.aspx.cs:4213
 * 
 * Query: pos (棋盘位置)
 * 
 * 返回格式: battleState_battleType_AthleticsType
 * battleState: 0=未报名, 1=已报名等待, 2=战斗中
 * 
 * FIX: 正确判断 battleState - 参考 C# XmlData.battlePos 和 XmlData.applay 逻辑
 *       - XmlData.battlePos 包含则表示已在战场中 (battleState=2)
 *       - XmlData.applay 有记录但 battlePos 没有则表示等待中 (battleState=1)
 *       - 两者都没有则未报名 (battleState=0)
 */
app.get('/user-battle', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // FIX: 分别检查 XmlData.battlePos 等价 (活跃战斗) 和 XmlData.applay 等价 (等待报名)
    // 1. 检查是否有活跃的 warfare 战斗 (battlePos 等价 - C# 中包含 userName 表示已在战场)
    // FIX: 移除错误的 JOIN，直接从 battles 表查询活跃战斗
    const activeBattle: any = await db.prepare(`
      SELECT b.*
      FROM battles b
      WHERE (b.attacker_address = ? OR b.defender_address = ?)
        AND b.result IS NULL
        AND b.created_at > datetime('now', '-2 hours')
      ORDER BY b.created_at DESC
      LIMIT 1
    `).bind(walletAddress, walletAddress).first();

    // 2. 查询报名记录 (applay 等价)
    // target_id 编码: cityId(低8位) | athleticsType(8-12位) | battleType(12-16位)
    // state 字段: levelSegment(1-10) = 等待中, >10 = 特殊状态
    const regResult: any = await db.prepare(`
      SELECT te.*,
             ch.name as hero_name, ch.level as hero_level
      FROM time_events te
      LEFT JOIN heroes ch ON ch.wallet_address = te.wallet_address
        AND ch.city_id = (te.target_id & 0xFF)
        AND ch.state = 10
      WHERE te.wallet_address = ?
        AND te.event_type = 'warfare_select'
        AND te.end_time > datetime('now')
      ORDER BY te.created_at DESC
      LIMIT 1
    `).bind(walletAddress).first();

    // 3. 正确判断 battleState (与 C# getUserBattleInfo 逻辑一致)
    // C#: if XmlData.battlePos 不存在 && XmlData.applay 存在 -> battleState=1 (等待)
    // C#: if XmlData.battlePos 存在 -> battleState=2 (战斗中)
    let battleState = 0;
    let battleType = 0;
    let athleticsType = 0;
    let cityId = 0;
    let cityName = '';
    let cityPos = 0;
    let heroName: string | null = null;
    let heroLevel = 0;
    let startTime = '';
    let endTime = '';
    let levelSegment = 0;

    if (activeBattle) {
      // 已在战场中 (XmlData.battlePos 存在)
      battleState = 2;
      // 从 battles 表获取 warfare 相关信息
      // battles 表可能没有存储 athleticsType 等信息，需要从 time_events 补充
      if (regResult) {
        battleType = (regResult.target_id >> 12) & 0xF;
        athleticsType = (regResult.target_id >> 8) & 0xF;
        cityId = regResult.target_id & 0xFF;
        startTime = regResult.start_time;
        endTime = regResult.end_time;
        levelSegment = Math.min(Math.max(regResult.state || 1, 1), 10);
        heroName = regResult.hero_name;
        heroLevel = regResult.hero_level || 0;
      }
    } else if (regResult) {
      // 已报名等待 (XmlData.applay 存在，battlePos 不存在)
      battleState = 1;
      battleType = (regResult.target_id >> 12) & 0xF;
      athleticsType = (regResult.target_id >> 8) & 0xF;
      cityId = regResult.target_id & 0xFF;
      startTime = regResult.start_time;
      endTime = regResult.end_time;
      levelSegment = Math.min(Math.max(regResult.state || 1, 1), 10);
      heroName = regResult.hero_name;
      heroLevel = regResult.hero_level || 0;

      // FIX: 正确查询城市信息 (不依赖有问题的 JOIN)
      const cityInfo: any = await db.prepare(`
        SELECT name, position FROM cities WHERE id = ?
      `).bind(cityId).first();
      if (cityInfo) {
        cityName = cityInfo.name || `城市${cityId}`;
        cityPos = cityInfo.position || 0;
      } else {
        cityName = `城市${cityId}`;
      }
    }

    // 前端 cb_CreateMyWarfare 使用 result.value.split("_") 解析
    // 格式: "battleState_battleType_athleticsType"
    return success(c, `${battleState}_${battleType}_${athleticsType}`);
  } catch (err: any) {
    return error(c, err.message);
  }
});

/**
 * GET /warfare/detail - 获取名城战详情
 * 参考: Main.aspx.cs GetWarfareDetail(int id)
 * 
 * Query: warfare_id (战区ID)
 */
app.get('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { warfare_id } = c.req.query();

  if (!warfare_id) {
    return error(c, 'warfare_id is required');
  }

  try {
    const id = parseInt(warfare_id);
    const detail = getWarfareDetail(id);

    if (!detail) {
      return error(c, '战区不存在', 404);
    }

    // 前端 cb_CreateWarfareDetail 使用 split("________") 解析
    // 格式: "RoomName________RoomShow________id" (8个下划线分隔)
    return success(c, `${detail.RoomName}________${detail.RoomShow}________${detail.Id}`);
  } catch (err: any) {
    return error(c, err.message);
  }
});

/**
 * POST /warfare/cancel - 取消名城战报名
 * 参考: ChessEx.cancelBattle() - Main.aspx.cs Ys_CancelBattle
 * 
 * Body: { city_id }
 * 
 * 错误码:
 * -100: Session超时
 * 60045: 未找到报名记录
 * 60052: 已在战场中
 * 60053: 区服不匹配
 * 60055: 已进入战场无法取消
 */
app.post('/cancel', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id } = await c.req.json();

  if (!city_id) {
    return c.json({ success: false, code: 1, message: 'city_id is required' });
  }

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 查询报名记录 - target_id 的低8位包含 city_id
    // target_id 格式: cityId (低8位) | athleticsType (8-12位) | battleType (12-16位)
    const record = await db.prepare(`
      SELECT * FROM time_events
      WHERE wallet_address = ?
        AND event_type = 'warfare_select'
        AND (target_id & 0xFF) = ?
        AND end_time > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(walletAddress, city_id).first();

    if (!record) {
      return c.json({ success: false, code: 60045, message: ERROR_CODES[60045] || '未找到报名记录' });
    }

    const row = record as any;

    // FIX: 检查是否已进入战场
    // state 编码: 1-10 = 等待中(等级段), 11 = 已匹配, 12 = 战斗中
    // state >= 11 不能取消 (已匹配或战斗中)
    if ((row.state as number) >= 11) {
      return c.json({ success: false, code: 60055, message: ERROR_CODES[60055] || '已进入战场，无法取消' });
    }

    // FIX: 双重检查 - 也检查 battles 表中是否有活跃 warfare 战斗
    const battleRecord = await db.prepare(`
      SELECT id FROM battles
      WHERE (attacker_address = ? OR defender_address = ?)
        AND result IS NULL
        AND created_at > datetime('now', '-2 hours')
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(walletAddress, walletAddress).first();

    if (battleRecord) {
      return c.json({ success: false, code: 60052, message: ERROR_CODES[60052] || '已在战场中' });
    }

    // 从 target_id 中提取 city_id
    const storedCityId = row.target_id & 0xFF;

    // 删除报名记录
    await db.prepare(`
      DELETE FROM time_events
      WHERE wallet_address = ?
        AND event_type = 'warfare_select'
        AND (target_id & 0xFF) = ?
    `).bind(walletAddress, city_id).run();

    // 重置相关侠客状态 (state 10 -> 1)
    await db.prepare(`
      UPDATE heroes
      SET state = 1
      WHERE wallet_address = ?
        AND city_id = ?
        AND state = 10
    `).bind(walletAddress, storedCityId).run();

    // 如果有军团，也要重置状态
    await db.prepare(`
      UPDATE corps_system
      SET state = 3
      WHERE wallet_address = ?
        AND city_id = ?
        AND state = 1
    `).bind(walletAddress, storedCityId).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    const { code, message } = handleError(err);
    return c.json({ success: false, code: code || -1, message });
  }
});

/**
 * POST /warfare/select - 选择参加名城战
 * 参考: ChessEx.SelectBattle() - Main.aspx.cs Ys_SelectBattle
 * 
 * Body: { area, warfare_type, city_id, pos }
 * 
 * area: 战区ID (AthleticsType)
 * warfare_type: 战斗类型 (BattleType) - 1=死战,2=夺旗,3=竞速
 * city_id: 城市ID
 * pos: 棋盘位置
 * 
 * 错误码:
 * -100: Session超时
 * 60039: 无最高等级侠客
 * 60044: 已在报名列表中
 * 60046: 城市没有出战队列侠客
 * 60047: 城市已有军团驻守
 * 60048: 更新侠客状态失败
 * 60053: 区服不匹配
 * 60054: 战场未开放
 */
app.post('/select', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { area, warfare_type, city_id, pos } = await c.req.json();

  if (!area || !city_id) {
    return c.json({ success: false, code: 1, message: 'area and city_id are required' });
  }

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    const athleticsType = parseInt(area); // AthleticsType
    const battleType = parseInt(warfare_type || '1'); // BattleType (默认死战模式)

    // 验证 battleType 有效性 (1=死战, 2=夺旗, 3=竞速)
    if (battleType < 1 || battleType > 3) {
      return c.json({ success: false, code: 1, message: '无效的战斗类型' });
    }

    // 验证夺旗/竞速模式需要 AthleticsType=2 或 3
    if ((battleType === 2 || battleType === 3) && athleticsType === 1) {
      return c.json({ success: false, code: 1, message: '夺旗/竞速模式需要组队或帮派类型' });
    }

    // 检查 warfare.json 中是否存在对应的配置
    const warfareEntry = (warfareConfig.Warfare || []).find(
      (w: any) => w.AthleticsType === athleticsType && w.AthleticsMode === battleType
    );
    if (!warfareEntry) {
      return c.json({ success: false, code: 1, message: '该战区配置不存在' });
    }

    // 1. 检查战场是否开放 (battleIsOpen 配置)
    // 战场默认开放，除非明确配置为关闭
    try {
      const isOpenResult = await db.prepare(`
        SELECT value FROM system_config WHERE key = 'battleIsOpen'
      `).first();
      
      if (isOpenResult && (isOpenResult as any).value === '0') {
        return c.json({ success: false, code: 60054, message: ERROR_CODES[60054] || '战场未开放' });
      }
    } catch (e) {
      // system_config 表不存在时，默认开放
    }

    // 2. 检查是否已在报名列表中
    const existingRecord = await db.prepare(`
      SELECT * FROM time_events
      WHERE wallet_address = ?
        AND event_type = 'warfare_select'
        AND end_time > datetime('now')
    `).bind(walletAddress).first();

    if (existingRecord) {
      return c.json({ success: false, code: 60044, message: ERROR_CODES[60044] || '已在报名列表中' });
    }

    // 3. 检查城市是否存在且属于当前用户
    const cityResult = await db.prepare(`
      SELECT c.*, ch.id as hero_count
      FROM cities c
      LEFT JOIN heroes ch ON ch.city_id = c.id AND ch.state = 2
      WHERE c.id = ?
        AND c.wallet_address = ?
    `).bind(city_id, walletAddress).first();

    if (!cityResult) {
      return c.json({ success: false, code: 60053, message: ERROR_CODES[60053] || '城市不存在或不属于当前用户' });
    }

    // 4. 检查是否有出战队列侠客 (state = 2 表示在出战队列)
    const heroCountResult = await db.prepare(`
      SELECT COUNT(*) as count FROM heroes
      WHERE wallet_address = ?
        AND city_id = ?
        AND state = 2
    `).bind(walletAddress, city_id).first();

    const heroCount = (heroCountResult as any)?.count || 0;
    if (heroCount <= 0) {
      return c.json({ success: false, code: 60046, message: ERROR_CODES[60046] || '该城市没有出战队列侠客' });
    }

    // 5. 检查城市是否已有军团驻守 (state = 1 表示已驻守)
    const corpsResult = await db.prepare(`
      SELECT id FROM corps_system
      WHERE city_id = ? AND state = 1
    `).bind(city_id).first();
    if (corpsResult) {
      return c.json({ success: false, code: 60047, message: ERROR_CODES[60047] || '该城市已有军团驻守' });
    }

    // 6. 计算最高等级侠客的等级段 (与 C# SelectBattle 逻辑完全一致)
    const maxLevelResult = await db.prepare(`
      SELECT MAX(level) as max_level FROM heroes
      WHERE wallet_address = ?
        AND city_id = ?
        AND state = 2
    `).bind(walletAddress, city_id).first();

    const maxLevel = (maxLevelResult as any)?.max_level || 1;
    // FIX: 正确计算 levelSegment (C# 使用 maxLevel/10 整除)
    // maxLevel 1-9 -> segment 1, 10-19 -> 2, ..., 90-99 -> 9, 100+ -> 10
    let levelSegment = 1;
    if (maxLevel >= 10) levelSegment = 10;
    else if (maxLevel >= 9) levelSegment = 9;
    else if (maxLevel >= 8) levelSegment = 8;
    else if (maxLevel >= 7) levelSegment = 7;
    else if (maxLevel >= 6) levelSegment = 6;
    else if (maxLevel >= 5) levelSegment = 5;
    else if (maxLevel >= 4) levelSegment = 4;
    else if (maxLevel >= 3) levelSegment = 3;
    else if (maxLevel >= 2) levelSegment = 2;
    else levelSegment = 1;

    // FIX: 检查是否已在战场中 (XmlData.battlePos 等价检查)
    // 如果用户已经有活跃的 warfare 战斗记录，不能重复报名
    const activeWarfare: any = await db.prepare(`
      SELECT id FROM battles
      WHERE (attacker_address = ? OR defender_address = ?)
        AND result IS NULL
        AND created_at > datetime('now', '-2 hours')
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(walletAddress, walletAddress).first();

    if (activeWarfare) {
      return c.json({ success: false, code: 60052, message: ERROR_CODES[60052] || '已在战场中，无法报名' });
    }

    // 7. 编码 target_id
    // 格式: cityId (低8位) | athleticsType (8-12位) | battleType (12-16位)
    // 注意: 不再将 levelSegment 编码到 target_id (留给 state 字段)
    const targetId = city_id | (athleticsType << 8) | (battleType << 12);

    // 8. 更新侠客状态为 10 (参战中)
    const updateHeroResult = await db.prepare(`
      UPDATE heroes
      SET state = 10
      WHERE wallet_address = ?
        AND city_id = ?
        AND state = 2
    `).bind(walletAddress, city_id).run();

    if (updateHeroResult.meta.changes === 0) {
      return c.json({ success: false, code: 60048, message: ERROR_CODES[60048] || '更新侠客状态失败' });
    }

    // 9. 创建名城战报名事件
    // 报名有效期: 60分钟 (参考 warfare.json 中的限制时间)
    // FIX: state 存储 levelSegment (1-10)，让 waiting 接口能正确统计各等级段人数
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);

    await db.prepare(`
      INSERT INTO time_events (
        wallet_address, event_type, target_id, start_time, end_time, state
      ) VALUES (?, 'warfare_select', ?, datetime('now'), ?, ?)
    `).bind(walletAddress, targetId, endTime.toISOString(), levelSegment);

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    const { code, message } = handleError(err);
    return c.json({ success: false, code: code || -1, message });
  }
});

// ==================== 辅助接口 ====================

/**
 * GET /warfare/config - 获取战场配置
 * 返回 warfare.json 中的完整配置
 */
app.get('/config', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  try {
    // 分类返回各类型战区
    const personalAreas = getWarfareAreas(1); // 个人竞技
    const teamAreas = getWarfareAreas(2); // 组队竞技
    const guildAreas = getWarfareAreas(3); // 帮派竞技

    return success(c, {
      AthleticsTypes: {
        1: { name: '个人竞技', description: '单人参与的竞技战斗' },
        2: { name: '组队竞技', description: '组队参与的竞技战斗' },
        3: { name: '帮派竞技', description: '帮派间的竞技战斗' },
      },
      AthleticsModes: {
        1: { name: '死战模式', description: '消灭所有敌人或战力损失超过40%' },
        2: { name: '夺旗模式', description: '摧毁对方主城' },
        3: { name: '竞速模式', description: '侠客单位首先到达对方侠客出生点' },
      },
      PersonalAreas: personalAreas.map(a => ({
        ID: a.Id,
        Name: a.RoomName,
        ManHow: a.ManHow,
      })),
      TeamAreas: teamAreas.map(a => ({
        ID: a.Id,
        Name: a.RoomName,
        ManHow: a.ManHow,
      })),
      GuildAreas: guildAreas.map(a => ({
        ID: a.Id,
        Name: a.RoomName,
        ManHow: a.ManHow,
      })),
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

/**
 * GET /warfare/is-open - 检查战场是否开放
 * 参考: ChessEx.IsOpen()
 */
app.get('/is-open', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 战场默认开放，除非明确配置为关闭
    const result = await db.prepare(`
      SELECT value FROM system_config WHERE key = 'battleIsOpen'
    `).first();

    const isOpen = result ? (result as any).value === '1' : true; // 默认开放

    return success(c, {
      isOpen,
      message: isOpen ? '战场已开放' : '战场未开放',
    });
  } catch (err: any) {
    // 配置表不存在时默认开放
    return success(c, {
      isOpen: true,
      message: '战场已开放',
    });
  }
});

// ==================== 战役战斗接口 ====================

/**
 * GET /warfare/battle - 获取名城战战场信息
 * 参考: ChessEx.GetChessboardPos() + GetChessboard()
 * 
 * Query: 无需参数，通过 wallet_address 自动识别用户
 * 
 * 功能:
 * 1. 检查用户是否已匹配进入战场 (XmlData.battlePos)
 * 2. 如果已匹配，返回战场位置 (pos) 和棋盘信息
 * 3. 如果未匹配，返回 battleState=1 和等待信息
 * 
 * 返回格式:
 * - matched: true/false - 是否已匹配进入战场
 * - pos: 战场位置 (0 表示未匹配)
 * - battleState: 0=未报名, 1=等待中, 2=战斗中
 */
app.get('/battle', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 1. 检查是否有活跃 warfare 战斗记录
    // battles 表中 result 为 NULL 表示战斗中
    const activeBattle: any = await db.prepare(`
      SELECT b.*,
             te.target_id,
             te.start_time as warfare_start,
             te.end_time as warfare_end,
             te.state as warfare_state
      FROM battles b
      LEFT JOIN time_events te ON te.wallet_address = b.attacker_address
        AND te.event_type = 'warfare_select'
        AND te.end_time > datetime('now')
      WHERE (b.attacker_address = ? OR b.defender_address = ?)
        AND b.result IS NULL
        AND b.created_at > datetime('now', '-2 hours')
      ORDER BY b.created_at DESC
      LIMIT 1
    `).bind(walletAddress, walletAddress).first();

    if (activeBattle) {
      // 用户已在战场中 (XmlData.battlePos 存在)
      // 返回战场位置 - 这里简化为使用 battle id 作为 pos
      // 实际实现中，pos 应该是从 XmlData.battlePos[userName] 获取的真实战场位置
      const pos = activeBattle.id || 1;
      const athleticsType = activeBattle.target_id ? (activeBattle.target_id >> 8) & 0xF : 0;
      const battleType = activeBattle.target_id ? (activeBattle.target_id >> 12) & 0xF : 0;

      return success(c, {
        matched: true,
        pos,
        battleState: 2,
        battleType,
        AthleticsType: athleticsType,
        battleId: activeBattle.id,
        startTime: activeBattle.created_at,
        message: '已进入战场',
      });
    }

    // 2. 检查是否已报名等待
    const regResult: any = await db.prepare(`
      SELECT te.*,
             ch.name as hero_name, ch.level as hero_level
      FROM time_events te
      LEFT JOIN heroes ch ON ch.wallet_address = te.wallet_address
        AND ch.state = 10
      WHERE te.wallet_address = ?
        AND te.event_type = 'warfare_select'
        AND te.end_time > datetime('now')
      ORDER BY te.created_at DESC
      LIMIT 1
    `).bind(walletAddress).first();

    if (regResult) {
      // 已报名但尚未匹配
      const battleType = (regResult.target_id >> 12) & 0xF;
      const athleticsType = (regResult.target_id >> 8) & 0xF;
      const cityId = regResult.target_id & 0xFF;
      const levelSegment = Math.min(Math.max(regResult.state || 1, 1), 10);

      return success(c, {
        matched: false,
        pos: 0,
        battleState: 1,
        battleType,
        AthleticsType: athleticsType,
        cityId,
        levelSegment,
        heroName: regResult.hero_name,
        heroLevel: regResult.hero_level,
        startTime: regResult.start_time,
        endTime: regResult.end_time,
        message: '已报名，等待系统分配对手',
      });
    }

    // 3. 未报名
    return success(c, {
      matched: false,
      pos: 0,
      battleState: 0,
      message: '未报名名城战',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

/**
 * GET /warfare/result - 获取名城战战斗结果
 * 参考: 战斗结束后获取战报和奖励
 * 
 * Query: battle_id (可选，不提供则返回最近一场)
 * 
 * 返回格式:
 * - result: 1=胜利, 0=失败, null=无结果
 * - rewards: 奖励信息
 * - battleReport: 战报摘要
 */
app.get('/result', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { battle_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let query = `
      SELECT b.*,
             te.target_id,
             te.state as warfare_state,
             -- 判断输赢: attacker 为用户，result=1 表示胜利，result=0 表示失败
             CASE
               WHEN b.attacker_address = ? AND b.result = 1 THEN 1
               WHEN b.attacker_address = ? AND b.result = 0 THEN 0
               WHEN b.defender_address = ? AND b.result = 1 THEN 0
               WHEN b.defender_address = ? AND b.result = 0 THEN 1
               ELSE NULL
             END as win
      FROM battles b
      LEFT JOIN time_events te ON te.wallet_address = b.attacker_address
        AND te.event_type = 'warfare_select'
      WHERE (b.attacker_address = ? OR b.defender_address = ?)
        AND b.result IS NOT NULL
    `;
    const bindings = [walletAddress, walletAddress, walletAddress, walletAddress, walletAddress, walletAddress];

    if (battle_id) {
      query += ` AND b.id = ?`;
      bindings.push(battle_id);
    }

    query += ` ORDER BY b.created_at DESC LIMIT 1`;

    const result: any = await db.prepare(query).bind(...bindings).first();

    if (!result) {
      return success(c, {
        result: null,
        battleId: null,
        message: '暂无战斗结果',
        rewards: null,
        battleReport: null,
      });
    }

    // 解析 warfare 配置
    const athleticsType = result.target_id ? (result.target_id >> 8) & 0xF : 0;
    const battleType = result.target_id ? (result.target_id >> 12) & 0xF : 0;
    const cityId = result.target_id ? result.target_id & 0xFF : 0;

    // 计算奖励 (参考 C# 战役奖励逻辑)
    // 胜利: 增加个人胜利点数 + 战勋
    // 失败: 无胜利点数，可能有少量战勋
    const isWin = result.win === 1;
    const warfareArea = getWarfareDetail(athleticsType > 0 ? athleticsType : 1);
    const roomName = warfareArea?.RoomName || '名城战';

    let rewards: any = null;
    if (result.result !== null) {
      rewards = {
        // 胜利点数 (只在 warfare_select 事件中记录)
        victoryPoint: isWin ? 1 : 0,
        // 战勋奖励 (胜利全拿，失败部分)
        warExploit: isWin ? 10 : 3,
        // 经验奖励
        exp: isWin ? 500 : 200,
        // 金币奖励
        gold: isWin ? 100 : 30,
        // 战斗评价
        rating: isWin ? (result.power_loss < 20 ? 'SSS' : result.power_loss < 40 ? 'SS' : 'S') : 'C',
      };
    }

    // 解析战报摘要
    let battleReport: any = null;
    if (result.summary) {
      try {
        battleReport = JSON.parse(result.summary);
      } catch (e) {
        battleReport = { raw: result.summary };
      }
    }

    return success(c, {
      result: result.win,
      battleId: result.id,
      cityId,
      athleticsType,
      battleType,
      roomName,
      rewards,
      battleReport,
      isWarfare: true,
      startTime: result.created_at,
      endTime: result.updated_at,
      message: isWin ? '恭喜获胜！' : '战斗失败，再接再厉',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

/**
 * POST /warfare/match - 手动触发匹配检查 (可选，用于加速匹配)
 * 参考: 名城战自动匹配逻辑的手动触发接口
 * 
 * 实际匹配在 C# 中由服务器定时器触发，这里提供手动触发检查
 */
app.post('/match', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 1. 检查战场是否开放 (system_config 表可能不存在，默认开放)
    try {
      const isOpenResult = await db.prepare(`
        SELECT value FROM system_config WHERE key = 'battleIsOpen'
      `).first();
      if (isOpenResult && (isOpenResult as any).value === '0') {
        return error(c, '战场未开放', 400);
      }
    } catch (e) {
      // system_config 表不存在时，默认开放
    }

    // 2. 检查用户是否已报名
    const regResult: any = await db.prepare(`
      SELECT te.*,
             (te.target_id & 0xFF) as city_id,
             ((te.target_id >> 8) & 0xF) as athletics_type,
             ((te.target_id >> 12) & 0xF) as battle_type,
             te.state as level_segment
      FROM time_events te
      WHERE te.wallet_address = ?
        AND te.event_type = 'warfare_select'
        AND te.end_time > datetime('now')
      ORDER BY te.created_at DESC
      LIMIT 1
    `).bind(walletAddress).first();

    if (!regResult) {
      return error(c, '未报名名城战', 400);
    }

    const { city_id, athletics_type, battle_type, level_segment } = regResult;
    const roomId = athletics_type; // 简化: roomID 暂用 athleticsType

    // 3. 查找同等级段、同类型、同房间的等待用户
    // C# 逻辑: 等待人数达到 ManHow 时创建战场
    const warfareArea = getWarfareDetail(athletics_type);
    const manHow = warfareArea?.ManHow || 2;

    const waitingUsers: any = await db.prepare(`
      SELECT te.wallet_address,
             te.target_id,
             (te.target_id & 0xFF) as city_id
      FROM time_events te
      WHERE te.event_type = 'warfare_select'
        AND te.state = ?
        AND ((te.target_id >> 8) & 0xF) = ?
        AND ((te.target_id >> 12) & 0xF) = ?
        AND te.end_time > datetime('now')
        AND te.wallet_address != ?
      ORDER BY te.created_at ASC
      LIMIT ?
    `).bind(level_segment, athletics_type, battle_type, walletAddress, manHow).all();

    // 4. 如果等待人数足够，尝试创建战斗
    if (waitingUsers.results && waitingUsers.results.length >= manHow - 1) {
      // 需要 ManHow 人，包括当前用户
      const opponent = waitingUsers.results[0];

      // 创建 warfare 战斗记录
      // attacker = 当前用户, defender = 对手
      const battleResult = await db.prepare(`
        INSERT INTO battles (
          attacker_address, defender_address,
          attacker_city_id, defender_city_id,
          battle_type, athletics_type,
          state, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
      `).bind(
        walletAddress,
        opponent.wallet_address,
        city_id,
        opponent.city_id,
        battle_type,
        athletics_type
      ).run();

      const newBattleId = battleResult.meta.last_row_id;

      // 创建战场 (Chessboard)
      const chessboard = createChessboard(
        newBattleId,
        battle_type,
        athletics_type,
        1, // serverUnit (默认1)
        1, // maxLevel (简化)
        roomId
      );

      // 更新当前用户 time_events state = 11 (已匹配)
      await db.prepare(`
        UPDATE time_events
        SET state = 11
        WHERE wallet_address = ?
          AND event_type = 'warfare_select'
          AND end_time > datetime('now')
      `).bind(walletAddress).run();

      // 更新对手 time_events state = 11 (已匹配)
      await db.prepare(`
        UPDATE time_events
        SET state = 11
        WHERE wallet_address = ?
          AND event_type = 'warfare_select'
          AND end_time > datetime('now')
      `).bind(opponent.wallet_address).run();

      return success(c, {
        matched: true,
        battleId: newBattleId,
        pos: newBattleId,
        opponentAddress: opponent.wallet_address,
        opponentCityId: opponent.city_id,
        message: '匹配成功！已进入战场',
      });
    }

    // 5. 等待人数不足
    return success(c, {
      matched: false,
      waitingCount: (waitingUsers.results?.length || 0) + 1,
      requiredCount: manHow,
      message: `等待匹配中，还需 ${manHow - (waitingUsers.results?.length || 0) - 1} 名对手`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ==================== 战场核心接口 ====================

/**
 * GET /warfare/chess-info - 获取战场完整信息
 * 参考: ChessEx.GetChessInfo() - ChessEx.cs
 * 
 * Query: pos (战场位置)
 * 
 * 返回棋盘信息、棋子列表、玩家列表等完整战场数据
 */
app.get('/chess-info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos } = c.req.query();

  if (!pos) {
    return error(c, 'pos is required');
  }

  const posNum = parseInt(pos);
  const chessInfo = getChessInfo(posNum);

  if (!chessInfo) {
    return error(c, '战场不存在或已结束', 404);
  }

  return success(c, {
    Height: chessInfo.Height,
    Width: chessInfo.Width,
    Pos: chessInfo.Pos,
    BattleSeconds: chessInfo.BattleSeconds,
    WaitSeconds: chessInfo.WaitSeconds,
    State: chessInfo.State,
    TotalSecondsNow: chessInfo.TotalSecondsNow,
    // 网格数据 (简化返回，只返回有棋子的位置)
    ChessunitMap: chessInfo.ChessunitMap,
    // 棋子列表
    ChessmanList: chessInfo.ChessmanList,
    // 玩家列表
    ChessplayerList: chessInfo.ChessplayerList,
  });
});

/**
 * GET /warfare/chess-event - 获取战场事件
 * 参考: ChessEx.GetChessEvent() - ChessEx.cs
 * 
 * Query: pos (战场位置), state (上次事件ID)
 * 
 * 返回从指定事件ID之后的新事件列表
 */
app.get('/chess-event', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos, state } = c.req.query();

  if (!pos) {
    return error(c, 'pos is required');
  }

  const posNum = parseInt(pos);
  const stateNum = state ? parseInt(state) : 0;

  // 查找用户在战场中的位置
  const chessboard = getChessboard(posNum);
  if (!chessboard) {
    return error(c, '战场不存在或已结束', 404);
  }

  // 查找用户对应的 player ID
  let playerId = -1;
  for (let i = 0; i < chessboard.PlayerList.length; i++) {
    if (chessboard.PlayerList[i]?.UserName === walletAddress) {
      playerId = i;
      break;
    }
  }

  if (playerId < 0) {
    return error(c, '您不在此战场中', 400);
  }

  const events = getChessEvent(posNum, walletAddress, playerId, stateNum);

  if (!events) {
    return error(c, '获取事件失败', 500);
  }

  return success(c, {
    events: events || [],
    player: playerId,
    state: chessboard.EventList.length,
  });
});

/**
 * POST /warfare/action-move - 移动棋子
 * 参考: ChessEx.ActionMove() - ChessEx.cs
 * 
 * Body: { pos, obj_id, target_x, target_y }
 * 
 * pos: 战场位置
 * obj_id: 棋子ID
 * target_x: 目标X坐标
 * target_y: 目标Y坐标
 * 
 * 返回: { code, message }
 *   0=成功, 101=战场不存在, 102=战斗状态异常, 10=目标位置不在棋盘内,
 *   11=棋子不存在, 12=棋子不属于该玩家, 13=棋子状态异常, 14=目标位置已被占用,
 *   15=移动距离超出范围, 16=行动点不足
 */
app.post('/action-move', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos, obj_id, target_x, target_y } = await c.req.json();

  if (pos === undefined || obj_id === undefined || target_x === undefined || target_y === undefined) {
    return error(c, 'pos, obj_id, target_x, target_y are required');
  }

  const posNum = parseInt(pos);
  const objIdNum = parseInt(obj_id);
  const targetXNum = parseInt(target_x);
  const targetYNum = parseInt(target_y);

  // 查找用户在战场中的位置
  const chessboard = getChessboard(posNum);
  if (!chessboard) {
    return error(c, '战场不存在', 404);
  }

  // 查找用户对应的 player ID
  let playerId = -1;
  for (let i = 0; i < chessboard.PlayerList.length; i++) {
    if (chessboard.PlayerList[i]?.UserName === walletAddress) {
      playerId = i;
      break;
    }
  }

  if (playerId < 0) {
    return error(c, '您不在此战场中', 400);
  }

  const result = actionMove(posNum, walletAddress, playerId, objIdNum, targetXNum, targetYNum);

  return c.json({
    success: result.code === 0,
    code: result.code,
    message: result.message,
  });
});

/**
 * POST /warfare/action-attack - 攻击
 * 参考: ChessEx.ActionAttack() - ChessEx.cs
 * 
 * Body: { pos, obj_id, target_id, type }
 * 
 * pos: 战场位置
 * obj_id: 攻击方棋子ID
 * target_id: 目标棋子ID
 * type: 攻击类型 (1=普通攻击, 2=技能攻击)
 * 
 * 返回: { code, message, event }
 */
app.post('/action-attack', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos, obj_id, target_id, type } = await c.req.json();

  if (pos === undefined || obj_id === undefined || target_id === undefined) {
    return error(c, 'pos, obj_id, target_id are required');
  }

  const posNum = parseInt(pos);
  const objIdNum = parseInt(obj_id);
  const targetIdNum = parseInt(target_id);
  const typeNum = type ? parseInt(type) : 1;

  // 查找用户在战场中的位置
  const chessboard = getChessboard(posNum);
  if (!chessboard) {
    return error(c, '战场不存在', 404);
  }

  // 查找用户对应的 player ID
  let playerId = -1;
  for (let i = 0; i < chessboard.PlayerList.length; i++) {
    if (chessboard.PlayerList[i]?.UserName === walletAddress) {
      playerId = i;
      break;
    }
  }

  if (playerId < 0) {
    return error(c, '您不在此战场中', 400);
  }

  const result = actionAttack(posNum, walletAddress, playerId, objIdNum, targetIdNum, typeNum);

  return c.json({
    success: result.code === 0,
    code: result.code,
    message: result.message,
    event: result.event,
  });
});

/**
 * GET /warfare/chessboard-size - 获取棋盘尺寸
 */
app.get('/chessboard-size', async (c) => {
  return success(c, {
    width: CHESSBOARD_WIDTH,
    height: CHESSBOARD_HEIGHT,
  });
});

export default app;
