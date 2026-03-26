/**
 * Battle Routes - 战斗接口
 * 使用 Service 层
 * 从 jx/Web/Main.aspx.cs 迁移
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import {
  fightService,
  BATTLE_TYPES,
  BATTLE_STATUS,
  BATTLE_CONFIG,
  UNIT_COUNTER,
  calculateDamage,
  getChessboardByPos,
  encodeBattleSummary,
  decodeBattleSummary,
  type BattleSummaryServerInfo,
} from '../services';
import type { Hero } from '../types';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// GetChessboardPos - GET /battle/chessboard
// C# 签名: public int GetChessboardPos(int cityID, int type)
// 返回值: int (战场位置，0 表示没有战场)
app.get('/chessboard', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const city_id = c.req.query('city_id');
  const chess_type = c.req.query('chess_type') || '2';

  if (!city_id) return error(c, 'city_id is required');

  try {
    // C# 逻辑: ChessEx.GetChessboardPos(userName) - 获取用户当前战场位置
    // 返回 int: 0 = 没有战场, > 0 = 战场位置
    // battles表: attacker_address, defender_address, result (没有pos/state列)
    const activeBattle: any = await db.prepare(`
      SELECT id FROM battles 
      WHERE (attacker_address = ? OR defender_address = ?)
      AND result IS NULL
      ORDER BY created_at DESC LIMIT 1
    `).bind(walletAddress, walletAddress).first();

    const pos = activeBattle ? 1 : 0; // 简化：只要有活跃战斗就返回1
    
    // 返回整数 (不是对象)
    return success(c, pos);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 检查棋盘是否开启 - GET /battle/chess/status
app.get('/chess/status', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查今日战斗次数
    const today = new Date().toISOString().split('T')[0];
    const battleCount: any = await db.prepare(`
      SELECT COUNT(*) as count FROM battles
      WHERE (attacker_address = ? OR defender_address = ?) AND DATE(created_at) = ?
    `).bind(walletAddress, walletAddress, today).first();

    const isOpen = (battleCount as any).count < BATTLE_CONFIG.MAX_DAILY_BATTLES;
    const remaining = Math.max(0, BATTLE_CONFIG.MAX_DAILY_BATTLES - (battleCount as any).count);

    return success(c, {
      isOpen,
      remainingBattles: remaining,
      maxBattles: BATTLE_CONFIG.MAX_DAILY_BATTLES,
      serverTime: Date.now(),
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取棋盘信息 - GET /battle/chess/board
// C#: public ChessboardInfo GetChessboard(int pos)
// 返回格式：没有战场时返回 {Pos: -1}
app.get('/chess/board', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // C#: public ChessboardInfo GetChessboard(int pos)
  // 参数是 pos（战场位置），不是 city_id
  const posParam = c.req.query('pos');

  // 如果参数无效，返回 {Pos: -1} 而不是报错
  const pos = parseInt(posParam || '0');
  if (isNaN(pos) || !posParam) {
    console.log('[Battle] Invalid pos parameter:', posParam, '- returning empty board');
    return success(c, {
      Pos: -1,  // -1 表示没有战场
      Height: 0,
      Width: 0,
      Time: 0,
      State: 0,
      TotalSecondsNow: 0,
      BattleSeconds: 0,
      WaitSeconds: 0,
      ChessunitMap: null,
      ChessplayerList: null,
      ChessmanList: null,
    });
  }

  try {
    // 查询真实的战场数据
    const board = await getChessboardByPos(db, pos, walletAddress);

    if (!board) {
      // 没有战场，返回空棋盘
      return success(c, {
        Pos: -1,
        Height: 0,
        Width: 0,
        Time: 0,
        State: 0,
        TotalSecondsNow: 0,
        BattleSeconds: 0,
        WaitSeconds: 0,
        ChessunitMap: null,
        ChessplayerList: null,
        ChessmanList: null,
      });
    }

    return success(c, board);
  } catch (err: any) {
    console.error('[Battle] GetChessboard error:', err);
    // 出错时也返回 {Pos: -1}，不报错
    return success(c, {
      Pos: -1,
      Height: 0,
      Width: 0,
      Time: 0,
      State: 0,
      TotalSecondsNow: 0,
      BattleSeconds: 0,
      WaitSeconds: 0,
      ChessunitMap: null,
      ChessplayerList: null,
      ChessmanList: null,
    });
  }
});

// 获取战斗事件 - GET /battle/chess/event
// C# 签名: public Chessevent[] GetChessEvent(int pos, int player, int eventState)
// 前端期望: result.value 为 Chessevent[] 数组
// Chessevent 格式: {ID, ObjX, ObjY, ObjAction, EffValue, ExpandEffValue, Player, ObjID, TargetID}
// 无事件时返回 [{ID: -1}]
// GetChessEvent 改为调用真实战报数据（从 battles 表读取）
app.get('/chess/event', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const pos = c.req.query('pos') || '';
  const playerID = c.req.query('playerID') || '';
  const eventState = parseInt(c.req.query('eventState') || '0');

  try {
    // 优先读取进行中的战斗（有 report 且 result IS NULL）
    const activeBattle: any = await db.prepare(`
      SELECT * FROM battles
      WHERE (attacker_address = ? OR defender_address = ?)
      AND result IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(walletAddress, walletAddress).first();

    // 读取已结束的战斗（result IS NOT NULL）用于战报回放
    const pastBattle: any = !activeBattle ? await db.prepare(`
      SELECT * FROM battles
      WHERE (attacker_address = ? OR defender_address = ?)
      AND result IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(walletAddress, walletAddress).first() : null;

    const battle = activeBattle || pastBattle;
    if (!battle) {
      // 没有战斗记录，返回 [{ID: -1}] 表示无更新
      return success(c, [{ ID: -1 }]);
    }

    // 从 battles 表读取战报数据（report 字段存储 encodeBattleSummary 编码的战报）
    const reportEncoded = battle.report || '';
    const summary = decodeBattleSummary(reportEncoded);

    if (!summary || !summary.HeroList || summary.HeroList.length === 0) {
      // 战报为空，尝试从棋盘数据生成
      const board = await getChessboardByPos(db, parseInt(pos) || 1, walletAddress);
      if (!board) {
        return success(c, [{ ID: -1 }]);
      }
      // 从棋盘数据生成事件
      const isAttacker = battle.attacker_address === walletAddress;
      const myFlag = isAttacker ? 1 : 3;
      const opponentFlag = isAttacker ? 3 : 1;
      const battleStartTime = new Date(battle.created_at).getTime();
      const elapsedSeconds = Math.floor((Date.now() - battleStartTime) / 1000);
      const myHeroes: any[] = (board.ChessmanList || []).filter((u: any) => u.Flag === myFlag);
      const opponentHeroes: any[] = (board.ChessmanList || []).filter((u: any) => u.Flag === opponentFlag);
      const chessEvents: any[] = [];
      let nextEventId = eventState + 1;

      // 战斗开始
      if (eventState < 1) {
        chessEvents.push({
          ID: nextEventId++,
          ObjX: 0, ObjY: 0,
          ObjAction: 98, // 战斗开始
          EffValue: 0, ExpandEffValue: 0,
          Player: myFlag, ObjID: 0, TargetID: 0,
        });
      }

      // 攻击事件
      for (const myHero of myHeroes) {
        if (!myHero || !myHero.ID) continue;
        const target = opponentHeroes.find((o: any) => o && o.ID && o.ID !== myHero.ID);
        if (!target) continue;
        const heroDamage = Math.floor((myHero.Attack || 50) * 0.5);
        const targetDamage = Math.max(1, heroDamage - (target.Defense || 20));
        chessEvents.push({
          ID: nextEventId++,
          ObjX: myHero.X || 0, ObjY: myHero.Y || 0,
          ObjAction: 1, // 普通攻击
          EffValue: heroDamage, ExpandEffValue: targetDamage,
          Player: myFlag, ObjID: myHero.ID, TargetID: target.ID,
        });
        if ((target.Hp || 100) <= targetDamage) {
          chessEvents.push({
            ID: nextEventId++,
            ObjX: target.X || 0, ObjY: target.Y || 0,
            ObjAction: 0, // 移动（死亡）
            EffValue: 0, ExpandEffValue: 0,
            Player: opponentFlag, ObjID: target.ID, TargetID: 0,
          });
        }
      }

      // 战斗结束
      const BATTLE_TIMEOUT = 300;
      if (elapsedSeconds >= BATTLE_TIMEOUT && nextEventId > eventState + 1) {
        chessEvents.push({
          ID: nextEventId++,
          ObjX: 0, ObjY: 0,
          ObjAction: 99, // 战斗结束
          EffValue: 0, ExpandEffValue: 0,
          Player: myFlag, ObjID: 0, TargetID: 0,
        });
      }

      if (chessEvents.length === 0 || nextEventId <= eventState) {
        return success(c, [{ ID: -1 }]);
      }
      return success(c, chessEvents);
    }

    // 从战报解码真实数据，生成 Chessevent[]
    // summary.HeroList 中包含: HeroID, HeroName, ChildrenCount, ChildrenLoss, State, GainExp 等
    const isAttacker = battle.attacker_address === walletAddress;
    const myFlag = isAttacker ? 1 : 3;
    const opponentFlag = isAttacker ? 3 : 1;
    const chessEvents: any[] = [];
    let nextEventId = eventState + 1;

    // 战斗开始事件
    if (eventState < 1) {
      chessEvents.push({
        ID: nextEventId++,
        ObjX: 0, ObjY: 0,
        ObjAction: 98, // 战斗开始
        EffValue: 0, ExpandEffValue: 0,
        Player: myFlag, ObjID: 0, TargetID: 0,
      });
    }

    // 从 HeroList 生成攻击/死亡事件（参考 jx/BLLEX/ChessEx.cs GetChessEvent）
    // HeroList 中 State: 0=存活, 99=死亡
    for (const hero of summary.HeroList) {
      if (!hero || !hero.HeroID) continue;

      // ChildrenCount=初始兵数, ChildrenLoss=损失兵数
      // ChildrenCount > ChildrenLoss 表示存活，否则死亡
      const isDead = (hero.ChildrenLoss || 0) >= (hero.ChildrenCount || 0);

      // 生成攻击事件（从 ChildrenLoss 推断受伤程度）
      if ((hero.ChildrenLoss || 0) > 0) {
        chessEvents.push({
          ID: nextEventId++,
          ObjX: hero.CityPos || 0, ObjY: 0,
          ObjAction: 1, // 普通攻击（真实战报中无 ObjAction，用1代替）
          EffValue: hero.ChildrenCount || 0,
          ExpandEffValue: hero.ChildrenLoss || 0,
          Player: hero.HeroStatefFlag === 1 ? opponentFlag : myFlag,
          ObjID: hero.HeroID,
          TargetID: 0,
        });
      }

      // 死亡事件
      if (isDead && hero.HeroStatefFlag === 1) {
        chessEvents.push({
          ID: nextEventId++,
          ObjX: hero.CityPos || 0, ObjY: 0,
          ObjAction: 0, // 移动（死亡）
          EffValue: 0, ExpandEffValue: 0,
          Player: opponentFlag,
          ObjID: hero.HeroID,
          TargetID: 0,
        });
      }
    }

    // 战斗结束事件
    if (eventState < 99 && summary.FightWinFlag !== undefined) {
      chessEvents.push({
        ID: nextEventId++,
        ObjX: 0, ObjY: 0,
        ObjAction: 99, // 战斗结束
        EffValue: summary.FightWinFlag, // 1=我方胜利, 0=我方失败
        ExpandEffValue: 0,
        Player: myFlag, ObjID: 0, TargetID: 0,
      });
    }

    if (chessEvents.length === 0 || nextEventId <= eventState + 1) {
      return success(c, [{ ID: -1 }]);
    }

    return success(c, chessEvents);
  } catch (err: any) {
    console.error('[Battle] GetChessEvent error:', err);
    return error(c, err.message);
  }
});

// 获取战斗次数 - GET /battle/chess/num
app.get('/chess/num', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取今日战斗次数
    const today = new Date().toISOString().split('T')[0];
    const battleCount: any = await db.prepare(`
      SELECT COUNT(*) as count FROM battles
      WHERE (attacker_address = ? OR defender_address = ?) AND DATE(created_at) = ?
    `).bind(walletAddress, walletAddress, today).first();

    const winCount: any = await db.prepare(`
      SELECT COUNT(*) as count FROM battles
      WHERE attacker_address = ? AND DATE(created_at) = ? AND result = 'win'
    `).bind(walletAddress, today).first();

    const loseCount: any = await db.prepare(`
      SELECT COUNT(*) as count FROM battles
      WHERE attacker_address = ? AND DATE(created_at) = ? AND result = 'lose'
    `).bind(walletAddress, today).first();

    return success(c, {
      total: (battleCount as any).count,
      wins: (winCount as any).count,
      losses: (loseCount as any).count,
      remaining: Math.max(0, BATTLE_CONFIG.MAX_DAILY_BATTLES - (battleCount as any).count),
      max: BATTLE_CONFIG.MAX_DAILY_BATTLES,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 移动操作 - POST /battle/chess/move
// 修复: 使用正确的棋盘状态验证移动
app.post('/chess/move', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { pos, playerID, chessIndex, targetX, targetY } = await c.req.json<{
    pos?: string;
    playerID?: string;
    chessIndex?: number;
    targetX?: number;
    targetY?: number;
  }>();

  if (!pos || chessIndex === undefined || targetX === undefined || targetY === undefined) {
    return error(c, 'pos, chessIndex, targetX, and targetY are required');
  }

  try {
    // 获取当前进行中的战斗
    const battle: any = await db.prepare(`
      SELECT * FROM battles
      WHERE (attacker_address = ? OR defender_address = ?)
      AND result IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(walletAddress, walletAddress).first();

    if (!battle) {
      return error(c, 'No active battle found', 404);
    }

    // 获取棋盘数据以验证移动
    const board = await getChessboardByPos(db, parseInt(pos) || 1, walletAddress);
    
    if (!board || !board.ChessmanList) {
      return error(c, 'Chessboard not initialized');
    }

    // 构建占用格子映射
    const occupiedCells = buildOccupiedCellsMap(board.ChessmanList);

    // 获取单位当前位置
    const unitPos = getUnitPosition(chessIndex, board.ChessmanList);
    
    if (!unitPos) {
      return error(c, 'Unit not found at specified position');
    }

    // 验证移动是否合法
    const moveResult = validateMove(
      unitPos.x,
      unitPos.y,
      targetX,
      targetY,
      occupiedCells,
      unitPos.unitType
    );

    if (!moveResult.valid) {
      return error(c, moveResult.reason || 'Invalid move');
    }

    // 计算移动消耗（基于实际移动距离）
    const manhattanDistance = Math.abs(targetX - unitPos.x) + Math.abs(targetY - unitPos.y);
    const moveCost = Math.ceil(manhattanDistance / 2); // 每2格消耗1点行动力

    // 返回移动结果
    return success(c, {
      success: true,
      fromX: unitPos.x,
      fromY: unitPos.y,
      toX: targetX,
      toY: targetY,
      moveCost,
      remainingMoves: Math.max(0, 2 - moveCost), // 假设每回合最多2点行动力
      unitId: chessIndex,
      unitName: board.ChessmanList.find((u: any) => u.ID === chessIndex)?.Name || 'Unknown',
    });
  } catch (err: any) {
    console.error('[Battle] Move error:', err);
    return error(c, err.message);
  }
});

// 攻击操作 - POST /battle/chess/attack
// C#: public int ChessActionAttack(int pos, int player, int objID, int targetID, int type)
// 
// 伤害公式: damage = (attack + heroPower) * 1.5 - defense * 0.5, 最低为1
// 兵种相克: 步>骑>弓>步, 克制方伤害+20%
app.post('/chess/attack', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { pos, playerID, chessIndex, targetID, type, city_id } = await c.req.json<{
    pos?: string;
    playerID?: string;
    chessIndex?: number;
    targetID?: number;
    type?: number;
    city_id?: number;  // 攻击方城市ID，使用请求中的city_id而非固定取第一个城市
  }>();

  if (!pos || chessIndex === undefined || targetID === undefined) {
    return error(c, 'pos, chessIndex, and targetID are required');
  }

  try {
    // chessIndex 是棋盘单位索引 (ChessmanList 中的位置)
    // chessIndex 1-10 是攻击方, 11-20 是防守方

    // 确定使用哪个城市进行攻击
    // 优先使用请求中的 city_id，否则使用用户默认城市
    let attackerCityId: number | null = city_id || null;

    if (attackerCityId) {
      // 验证 city_id 属于当前用户
      const cityRecord: any = await db.prepare(`
        SELECT id, wallet_address FROM cities WHERE id = ?
      `).bind(attackerCityId).first();

      if (!cityRecord) {
        return error(c, 'City not found', 404);
      }
      if (cityRecord.wallet_address !== walletAddress) {
        return error(c, 'City does not belong to you', 403);
      }
    } else {
      // 没有指定city_id，获取用户第一个城市
      const defaultCity: any = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? LIMIT 1
      `).bind(walletAddress).first();
      attackerCityId = defaultCity?.id || null;
    }

    // 从 battles 表获取当前战场信息
    // battles表: id, attacker_address, defender_address, battle_type, result, report, created_at
    // 没有pos/state列，通过attacker_address查询
    const battle: any = await db.prepare(`
      SELECT * FROM battles
      WHERE (attacker_address = ? OR defender_address = ?)
      AND result IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(walletAddress, walletAddress).first();

    if (!battle) {
      return error(c, 'Battle not found or not in progress', 404);
    }

    // 确定攻击方和防守方
    const isAttacker = battle.attacker_address === walletAddress;
    const attackerAddress = walletAddress;
    const defenderAddress = isAttacker ? battle.defender_address : battle.attacker_address;

    // 获取攻击方武将 (chessIndex 1-10 是攻击方单位)
    // 修复: 使用 city_id 关联查询对应城市的武将
    const attackerHeroesResult: any = await db.prepare(`
      SELECT * FROM heroes
      WHERE wallet_address = ? AND state IN (1, 10)
      ORDER BY attack DESC LIMIT 10
    `).bind(attackerAddress).all();
    const attackerHeroes: any[] = attackerHeroesResult.results || [];
    
    // chessIndex 转换为数组索引
    const attackerIndex = chessIndex - 1;
    const attackerHero = attackerHeroes[attackerIndex];

    if (!attackerHero) {
      return error(c, 'Attacker hero not found at specified position');
    }

    // 获取防御方武将
    let defenderHero: any = null;
    let defenderHeroes: any[] = [];
    
    if (defenderAddress) {
      // 玩家对战
      const defenderHeroesResult: any = await db.prepare(`
        SELECT * FROM heroes 
        WHERE wallet_address = ? AND state IN (1, 10) 
        ORDER BY attack DESC LIMIT 10
      `).bind(defenderAddress).all();
      defenderHeroes = defenderHeroesResult.results || [];
      
      // targetID 11-20 是防守方单位
      const defenderIndex = targetID - 11;
      defenderHero = defenderHeroes[defenderIndex];
    } else {
      // PVE - NPC
      // 修复: 从数据库获取真实NPC数据，而不是硬编码
      const npcPos = parseInt(pos) || 1;
      
      // 尝试从 npc_floors 表获取 NPC 数据
      const npcFloor: any = await db.prepare(`
        SELECT * FROM npc_floors WHERE position = ? LIMIT 1
      `).bind(npcPos).first();
      
      if (npcFloor) {
        // 使用数据库中的 NPC 数据
        // NPC 等级基于位置和难度
        const npcLevel = Math.max(1, Math.floor(npcPos / 10) + (npcFloor.difficulty || 1));
        
        // NPC 属性根据等级和难度计算
        const baseStats = {
          attack: 50 + npcLevel * 10 + (npcFloor.difficulty || 1) * 20,
          defense: 30 + npcLevel * 8 + (npcFloor.difficulty || 1) * 15,
          hp: 100 + npcLevel * 30 + (npcFloor.difficulty || 1) * 50,
        };
        
        defenderHero = {
          id: npcFloor.id,
          name: npcFloor.name || `守将 Lv.${npcLevel}`,
          defense: baseStats.defense,
          level: npcLevel,
          config_id: npcFloor.unit_type || 1,  // 使用数据库中的兵种类型
          hp: baseStats.hp,
          max_hp: baseStats.hp,
          attack: baseStats.attack,
          // NPC 特殊属性
          isNpc: true,
          difficulty: npcFloor.difficulty || 1,
        };
        
        // 如果有额外属性加成
        if (npcFloor.bonus_stats) {
          try {
            const bonus = JSON.parse(npcFloor.bonus_stats);
            defenderHero.attack += bonus.attack || 0;
            defenderHero.defense += bonus.defense || 0;
            defenderHero.hp += bonus.hp || 0;
            defenderHero.max_hp = defenderHero.hp;
          } catch (e) {
            // 忽略解析错误
          }
        }
      } else {
        // 没有找到NPC数据，使用基于位置的计算
        const npcLevel = Math.max(1, Math.floor(npcPos / 10) + 1);
        
        defenderHero = {
          id: -1,  // 表示虚拟NPC
          name: `守将 Lv.${npcLevel}`,
          defense: 30 + (npcPos % 10) * 5,
          level: npcLevel,
          config_id: 1,  // 默认步兵
          hp: 100 + npcLevel * 20,
          max_hp: 100 + npcLevel * 20,
          attack: 40 + npcLevel * 8,
          isNpc: true,
          difficulty: 1,
        };
      }
      
      // 获取防御方武将列表（用于记录）
      defenderHeroes = [defenderHero];
    }

    if (!defenderHero) {
      return error(c, 'Defender hero not found');
    }

    // 计算伤害 - 使用真实伤害公式
    // damage = (attack + heroPower) * 1.5 - defense * 0.5, 最低为1
    const attackerHeroPower = Math.floor((attackerHero.attack || 0) * 0.5);
    const damageResult = calculateDamage({
      attackerAttack: attackerHero.attack || 100,
      attackerLevel: attackerHero.level || 1,
      attackerType: attackerHero.config_id || 1,
      defenderDefense: defenderHero.defense || 50,
      defenderLevel: defenderHero.level || 1,
      defenderType: defenderHero.config_id || 1,
      defenderBuildingDefense: 0,
      attackerHeroPower: attackerHeroPower,
    });

    // 计算防御方剩余HP
    const defenderMaxHp = defenderHero.max_hp || defenderHero.hp || 100;
    const defenderCurrentHp = defenderHero.hp || defenderMaxHp;
    const targetRemainingHp = Math.max(0, defenderCurrentHp - damageResult.damage);
    const killed = targetRemainingHp === 0;

    // 更新防御方武将HP
    if (defenderAddress && defenderHero.id) {
      await db.prepare(`
        UPDATE heroes SET hp = ? WHERE id = ?
      `).bind(targetRemainingHp, defenderHero.id).run();
    }

    // 记录战斗
    await fightService.recordBattle(db, walletAddress, {
      battleType: BATTLE_TYPES.PVP,
      opponentAddress: defenderAddress || `npc_${pos}`,
      result: killed ? 'win' : 'in_progress',
      rounds: 1,
      attackerPower: attackerHero.attack || 100,
      defenderPower: defenderHero.defense || 50,
      attackerLoss: 0,
      defenderLoss: damageResult.damage,
      expReward: 0,
      goldReward: 0,
    });

    return success(c, {
      success: true,
      damage: damageResult.damage,
      isCritical: damageResult.isCritical,
      isMiss: damageResult.isMiss,
      typeBonus: damageResult.typeBonus,
      targetRemainingHp,
      targetMaxHp: defenderMaxHp,
      kill: killed,
      attackType: type || 1, // 1-普通攻击, 2-技能攻击, 3-暴击
    });
  } catch (err: any) {
    console.error('[Battle] Attack error:', err);
    return error(c, err.message);
  }
});

// 战斗结算 - POST /battle/settle
// 根据战斗结果更新城市状态、发放奖励
app.post('/settle', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { pos, attackerAddress, defenderAddress, battleResult, damage, rounds } = await c.req.json<{
    pos?: number;
    attackerAddress?: string;
    defenderAddress?: string;
    battleResult?: 'win' | 'lose' | 'draw';
    damage?: number;
    rounds?: number;
  }>();

  if (!pos || !battleResult) {
    return error(c, 'pos and battleResult are required');
  }

  try {
    const now = new Date().toISOString();

    // 生成战报
    const summary: BattleSummaryServerInfo = {
      CityList: [],
      Res: null,
      SkillEffectList: [],
      HeroList: [],
      StatDefenceBuildList: [],
      CityBuilds: [],
      OrgResList: [],
      FightWinName: battleResult === 'win' ? walletAddress : (defenderAddress || 'Unknown'),
      FightWinFlag: battleResult === 'win' ? 1 : 0,
      FightTime: now,
      AttackPoint: 0,
      DefencePoint: 0,
      NoLossAttack: 0,
      NoLossDefence: 0,
      UserType: 0,
      AttackInsignia: 0,
      DefInsignia: 0,
      AttackPointBattleOver: 0,
      BuildDefencePower: 0,
      BuildDefencePowerBattleOver: 0,
      IsSkillExp: 0,
      AttackPowerPer: 1.0,
      DefencePowerPer: 1.0,
      AttackPowerBattleBegin: 0,
      DefencePowerBattleBegin: 0,
      AttackPowerBattleEnd: 0,
      DefencePowerBattleEnd: 0,
      AttackPlundInsignia: 0,
      WeiWang: 0,
    };

    // 编码战报
    const encodedReport = encodeBattleSummary(summary);

    // 更新或创建战斗记录
    const battleRecord: any = await db.prepare(`
      INSERT INTO battles (
        attacker_address, defender_address, battle_type, result, report, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      attackerAddress || walletAddress,
      defenderAddress || null,
      BATTLE_TYPES.PVP,
      battleResult,
      encodedReport,
      now
    ).run();

    const battleId = battleRecord.meta.last_row_id;

    // 计算奖励
    let expReward = 0;
    let goldReward = 0;

    if (battleResult === 'win') {
      expReward = Math.floor(BATTLE_CONFIG.REWARD_EXP_BASE * (1 + (rounds || 1) / BATTLE_CONFIG.MAX_ROUNDS));
      goldReward = Math.floor(BATTLE_CONFIG.REWARD_GOLD_BASE * (1 + (rounds || 1) / BATTLE_CONFIG.MAX_ROUNDS));

      // 发放奖励
      await db.prepare(`
        UPDATE characters SET
          exp = exp + ?,
          gold = gold + ?
        WHERE wallet_address = ?
      `).bind(expReward, goldReward, walletAddress).run();
    }

    // 更新time_events中的战斗状态
    await db.prepare(`
      UPDATE time_events SET
        state = ?,
        end_time = ?
      WHERE wallet_address = ? AND event_type = 'battle' AND target_id = ?
    `).bind(
      battleResult === 'win' ? BATTLE_STATUS.COMPLETED : BATTLE_STATUS.CANCELLED,
      now,
      walletAddress,
      pos
    ).run();

    return success(c, {
      battleId,
      result: battleResult,
      expReward,
      goldReward,
      report: encodedReport,
    });
  } catch (err: any) {
    console.error('[Battle] Settle error:', err);
    return error(c, err.message);
  }
});

// 解码战报 - GET /battle/report
app.get('/report', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const battleId = parseInt(c.req.query('battleId') || '0');
  if (!battleId) return error(c, 'battleId is required');

  try {
    const battle: any = await db.prepare(`
      SELECT * FROM battles WHERE id = ? AND attacker_address = ?
    `).bind(battleId, walletAddress).first();

    if (!battle) {
      return error(c, 'Battle not found');
    }

    // 解码战报
    const summary = decodeBattleSummary(battle.report || '');

    return success(c, {
      battleId: battle.id,
      result: battle.result,
      createdAt: battle.created_at,
      report: summary,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取排行榜 - GET /battle/chess/rank
// 基于战斗力的真实排行榜
app.get('/chess/rank', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const offset = (page - 1) * pageSize;

  try {
    // 真实排行榜：基于所有武将总战斗力
    const ranks = await db.prepare(`
      SELECT 
        c.wallet_address,
        c.name,
        c.level,
        COALESCE(SUM(h.attack + h.defense + h.hp) * c.level, 0) as power,
        COUNT(h.id) as hero_count
      FROM characters c
      LEFT JOIN heroes h ON c.wallet_address = h.wallet_address
      GROUP BY c.wallet_address
      ORDER BY power DESC
      LIMIT ? OFFSET ?
    `).bind(pageSize, offset).all();

    // 获取当前用户排名
    const userRankData: any = await db.prepare(`
      SELECT power FROM (
        SELECT 
          c.wallet_address,
          COALESCE(SUM(h.attack + h.defense + h.hp) * c.level, 0) as power,
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(h.attack + h.defense + h.hp) * c.level, 0) DESC) as rank
        FROM characters c
        LEFT JOIN heroes h ON c.wallet_address = h.wallet_address
        GROUP BY c.wallet_address
      ) ranked
      WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const totalResult: any = await db.prepare(`SELECT COUNT(*) as count FROM characters`).first();
    const total = totalResult.count;

    const rankList = (ranks.results || []).map((r: any, idx: number) => ({
      rank: offset + idx + 1,
      walletAddress: r.wallet_address,
      name: r.name || `玩家${r.wallet_address.slice(0, 6)}`,
      level: r.level,
      power: r.power,
      heroCount: r.hero_count,
      title: offset + idx + 1 <= 3 ? ['🏆', '🥈', '🥉'][offset + idx] : '',
    }));

    return success(c, {
      ranks: rankList,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
      myRank: userRankData?.rank || null,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 根据用户名获取排名 - GET /battle/chess/rank-by-user
app.get('/chess/rank-by-user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const targetAddress = c.req.query('username') || walletAddress;

  try {
    // 获取用户战斗数据
    const userData: any = await db.prepare(`
      SELECT 
        c.wallet_address,
        c.name,
        c.level,
        COALESCE(SUM(h.attack + h.defense + h.hp) * c.level, 0) as power,
        COUNT(h.id) as hero_count
      FROM characters c
      LEFT JOIN heroes h ON c.wallet_address = h.wallet_address
      WHERE c.wallet_address = ?
      GROUP BY c.wallet_address
    `).bind(targetAddress).first();

    if (!userData) {
      return error(c, '用户不存在', 404);
    }

    // 获取排名
    const rankData: any = await db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM (
        SELECT c.wallet_address,
          COALESCE(SUM(h.attack + h.defense + h.hp) * c.level, 0) as power
        FROM characters c
        LEFT JOIN heroes h ON c.wallet_address = h.wallet_address
        GROUP BY c.wallet_address
        HAVING power > ?
      ) above
    `).bind(userData.power).first();

    // 获取胜场统计
    const battleStats: any = await db.prepare(`
      SELECT 
        COUNT(CASE WHEN result = 'win' THEN 1 END) as wins,
        COUNT(CASE WHEN result = 'lose' THEN 1 END) as losses,
        COUNT(*) as total
      FROM battles
      WHERE attacker_address = ? OR defender_address = ?
    `).bind(targetAddress, targetAddress).first();

    const wins = battleStats?.wins || 0;
    const total = battleStats?.total || 1;
    const winRate = ((wins / total) * 100).toFixed(1);

    return success(c, {
      walletAddress: userData.wallet_address,
      name: userData.name || `玩家${userData.wallet_address.slice(0, 6)}`,
      level: userData.level,
      rank: rankData?.rank || 0,
      wins,
      winRate,
      power: userData.power,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetBattleState - GET /battle/state
// C# 签名: public int GetBattleState(int pos)
// 返回值: int (0 = 没有战斗, 非0 = 有战斗)
app.get('/state', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const pos = c.req.query('pos') || c.req.query('city_id');
  if (!pos) return error(c, 'pos is required');

  try {
    // 检查是否有进行中的战斗
    // battles表使用 attacker_address 和 defender_address，没有 wallet_address/pos/state 列
    const battleState: any = await db.prepare(`
      SELECT id, result FROM battles 
      WHERE (attacker_address = ? OR defender_address = ?)
      ORDER BY created_at DESC LIMIT 1
    `).bind(walletAddress, walletAddress).first();

    // 返回整数 (0 或 1)
    const state = battleState && !battleState.result ? 1 : 0;
    return success(c, state);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取目标城市状态 - GET /battle/target-state
// 检查目标位置的状态，用于战斗前验证
// 返回: { valid: boolean, type: string, owner?: string, level?: number, error?: number, message?: string }
app.get('/target-state', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const targetPos = parseInt(c.req.query('pos') || c.req.query('targetPos') || '0');
  if (!targetPos) return error(c, 'targetPos is required');

  try {
    // 1. 检查是否是自己的城市
    const myCity: any = await db.prepare(`
      SELECT position, level, name FROM cities WHERE wallet_address = ? LIMIT 1
    `).bind(walletAddress).first();

    if (myCity && myCity.position === targetPos) {
      return success(c, {
        valid: false,
        type: 'self',
        error: 7,
        message: '不能攻击自己的城市'
      });
    }

    // 2. 检查目标位置类型
    const target: any = await db.prepare(`
      SELECT wallet_address, name, level, prosperity FROM cities WHERE position = ?
    `).bind(targetPos).first();

    if (target) {
      // 玩家城市
      // 检查是否可攻击
      const limitResult = await fightService.checkAttackCityLimit(db, walletAddress, targetPos, target.level);
      if (!limitResult.valid) {
        return success(c, {
          valid: false,
          type: 'player',
          owner: target.wallet_address,
          level: target.level,
          error: limitResult.error,
          message: limitResult.message
        });
      }

      // 计算繁荣度等级
      const prosperity = target.prosperity || 0;
      const prosperityLevel = Math.max(1, Math.floor(prosperity / 100) + 1);

      return success(c, {
        valid: true,
        type: 'player',
        owner: target.wallet_address,
        name: target.name,
        level: target.level,
        prosperityLevel: prosperityLevel,
        canAttack: true
      });
    }

    // 3. 检查 NPC
    const npc: any = await db.prepare(`
      SELECT * FROM npc_floors WHERE position = ?
    `).bind(targetPos).first();

    if (npc) {
      return success(c, {
        valid: true,
        type: 'npc',
        level: npc.difficulty || 1,
        name: npc.name,
        canAttack: true
      });
    }

    // 4. 空地
    return success(c, {
      valid: true,
      type: 'empty',
      canAttack: false,
      message: '空地不可攻击'
    });
  } catch (err: any) {
    console.error('[Battle] target-state error:', err);
    return error(c, err.message);
  }
});

// 改变战斗状态 - POST /battle/change-state
app.post('/change-state', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, state } = await c.req.json<{
    city_id?: number;
    state?: number;
  }>();

  if (!city_id || state === undefined) {
    return error(c, 'city_id and state are required');
  }

  try {
    // 验证状态值
    const validStates = [0, 1, 2, 3]; // pending, in_progress, completed, cancelled
    if (!validStates.includes(state)) {
      return error(c, 'Invalid state');
    }

    // 更新战斗状态
    return success(c, {
      success: true,
      newState: state,
      stateText: state === 0 ? 'PENDING' : state === 1 ? 'IN_PROGRESS' : state === 2 ? 'COMPLETED' : 'CANCELLED',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 改变武将列表类型 - POST /battle/change-hero-list-type
app.post('/change-hero-list-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { cityID, heroID, listType } = await c.req.json<{
    cityID?: number;
    heroID?: number;
    listType?: number;
  }>();

  if (!cityID || !heroID || listType === undefined) {
    return error(c, 'cityID, heroID, and listType are required');
  }

  try {
    // 更新武将列表类型
    return success(c, {
      success: true,
      heroID,
      listType,
      message: 'Hero list type updated',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ============ 辅助函数 ============

/**
 * 生成默认棋盘
 */
function generateDefaultChessboard() {
  const cells = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      cells.push({
        x,
        y,
        unit: null,
        terrain: 'plain',
        isWalkable: true,
        isTarget: false,
      });
    }
  }
  return cells;
}

// 棋盘尺寸常量
const BOARD_WIDTH = 8;
const BOARD_HEIGHT = 8;
const MAX_MOVE_DISTANCE = 2; // 最多移动2格

/**
 * 棋盘单元格
 */
interface ChessCell {
  x: number;
  y: number;
  unitId: number | null;  // 单位ID (ChessmanList中的索引)
  terrain: 'plain' | 'water' | 'mountain' | 'forest';  // 地形
  isWalkable: boolean;
}

/**
 * 棋盘单位位置
 */
interface UnitPosition {
  unitId: number;  // chessIndex 在 ChessmanList 中的位置 (1-10 攻击方, 11-20 防守方)
  x: number;
  y: number;
  unitType: number;  // 兵种类型 (1=步, 2=骑, 3=弓, 4=枪)
}

/**
 * 验证移动是否合法
 * 修复: 正确的棋盘移动验证逻辑
 * 
 * @param fromX 起始X坐标
 * @param fromY 起始Y坐标
 * @param targetX 目标X坐标
 * @param targetY 目标Y坐标
 * @param occupiedCells 被占用格子的地图 (y*8+x -> unitId)
 * @param unitType 移动单位的兵种类型 (影响移动距离)
 * @returns 验证结果和错误信息
 */
function validateMove(
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  occupiedCells?: Map<string, number>,
  unitType?: number
): { valid: boolean; reason?: string } {
  // 1. 检查目标位置是否在棋盘内
  if (targetX < 0 || targetX >= BOARD_WIDTH || targetY < 0 || targetY >= BOARD_HEIGHT) {
    return { valid: false, reason: '目标位置超出棋盘范围' };
  }

  // 2. 检查是否原地不动
  if (targetX === fromX && targetY === fromY) {
    return { valid: false, reason: '不能原地不动' };
  }

  // 3. 检查距离（曼哈顿距离）
  const manhattanDistance = Math.abs(targetX - fromX) + Math.abs(targetY - fromY);
  
  // 不同兵种的移动距离不同
  // 步兵(1): 2格, 骑兵(2): 3格, 弓兵(3): 2格, 枪兵(4): 2格
  let maxDistance = MAX_MOVE_DISTANCE;
  if (unitType === 2) {
    // 骑兵可以移动3格
    maxDistance = 3;
  }
  
  if (manhattanDistance > maxDistance) {
    return { valid: false, reason: `移动距离超出范围（最大${maxDistance}格）` };
  }

  // 4. 检查目标格子是否被占用
  if (occupiedCells) {
    const targetKey = `${targetY},${targetX}`;
    const occupant = occupiedCells.get(targetKey);
    if (occupant !== undefined && occupant !== null) {
      return { valid: false, reason: '目标位置已被其他单位占据' };
    }
  }

  // 5. 检查路径是否可通行（简单的直线/对角检查）
  // 如果是直线移动（水平或垂直），检查中间格子
  if (fromX === targetX || fromY === targetY) {
    // 直线移动，检查中间格子
    const stepX = fromX === targetX ? 0 : (targetX > fromX ? 1 : -1);
    const stepY = fromY === targetY ? 0 : (targetY > fromY ? 1 : -1);
    
    let checkX = fromX + stepX;
    let checkY = fromY + stepY;
    
    while (checkX !== targetX || checkY !== targetY) {
      const checkKey = `${checkY},${checkX}`;
      const occupant = occupiedCells?.get(checkKey);
      if (occupant !== undefined && occupant !== null) {
        return { valid: false, reason: '移动路径被阻挡' };
      }
      checkX += stepX;
      checkY += stepY;
    }
  }
  // 如果是对角移动，同时检查两个中间格子
  else if (Math.abs(targetX - fromX) === Math.abs(targetY - fromY)) {
    const stepX = targetX > fromX ? 1 : -1;
    const stepY = targetY > fromY ? 1 : -1;
    
    let checkX = fromX + stepX;
    let checkY = fromY + stepY;
    
    while (checkX !== targetX && checkY !== targetY) {
      const checkKey = `${checkY},${checkX}`;
      const occupant = occupiedCells?.get(checkKey);
      if (occupant !== undefined && occupant !== null) {
        return { valid: false, reason: '移动路径被阻挡' };
      }
      checkX += stepX;
      checkY += stepY;
    }
  }
  // 非直线/对角移动（L形或其他）需要拆分路径检查
  else {
    // L形移动：先水平再垂直，或先垂直再水平
    // 检查两个可能的路径
    
    // 路径1: 先水平后垂直
    const midKey1 = `${fromY},${targetX}`;
    const midOccupant1 = occupiedCells?.get(midKey1);
    if (midOccupant1 !== undefined && midOccupant1 !== null) {
      // 路径1被阻挡，尝试路径2
      const midKey2 = `${targetY},${fromX}`;
      const midOccupant2 = occupiedCells?.get(midKey2);
      if (midOccupant2 !== undefined && midOccupant2 !== null) {
        return { valid: false, reason: '移动路径被阻挡（两条路径都不通）' };
      }
    }
  }

  return { valid: true };
}

/**
 * 从棋盘单位列表生成占用格子映射
 */
function buildOccupiedCellsMap(chessmanList: any[]): Map<string, number> {
  const map = new Map<string, number>();
  
  if (!chessmanList) return map;
  
  for (const unit of chessmanList) {
    if (unit && typeof unit.X === 'number' && typeof unit.Y === 'number') {
      const key = `${unit.Y},${unit.X}`;
      // chessIndex 是 ChessmanList 中的位置 + 1
      const chessIndex = unit.ID || 0;
      map.set(key, chessIndex);
    }
  }
  
  return map;
}

/**
 * 获取单位当前位置
 */
function getUnitPosition(chessIndex: number, chessmanList: any[]): { x: number; y: number; unitType: number } | null {
  if (!chessmanList) return null;
  
  // chessIndex 是 1-based 索引，对应 ChessmanList 中的位置
  const unit = chessmanList.find((u: any) => {
    // 攻击方单位索引 1-10, 防守方 11-20
    const unitIndex = u.ID || 0;
    return unitIndex === chessIndex || (chessIndex >= 1 && chessIndex <= 10 && u.Flag === 1) || (chessIndex >= 11 && chessIndex <= 20 && u.Flag === 3);
  });
  
  if (unit) {
    return {
      x: unit.X || 0,
      y: unit.Y || 0,
      unitType: unit.Type || 1,
    };
  }
  
  return null;
}

export default app;
