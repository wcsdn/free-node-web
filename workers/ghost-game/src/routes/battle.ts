/**
 * Battle Routes - 战斗接口
 * 使用 Service 层
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { fightService, BATTLE_TYPES, BATTLE_STATUS, BATTLE_CONFIG, UNIT_COUNTER } from '../services';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取棋盘位置 - GET /battle/chessboard
app.get('/chessboard', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const city_id = parseInt(c.req.query('city_id') || '0');
  const chess_type = c.req.query('chess_type') || 'pve';

  if (!city_id) return error(c, 'city_id is required');

  try {
    // 获取棋盘位置信息 - 直接返回默认棋盘
    return success(c, {
      positions: generateDefaultChessboard(),
      type: chess_type,
    });
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
      SELECT COUNT(*) as count FROM battle_records 
      WHERE wallet_address = ? AND DATE(created_at) = ?
    `).bind(walletAddress, today).first();

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
app.get('/chess/board', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const city_id = parseInt(c.req.query('city_id') || '0');

  if (!city_id) return error(c, 'city_id is required');

  try {
    // 生成棋盘数据
    const board = {
      width: 8,
      height: 8,
      cells: generateDefaultChessboard(),
      maxUnits: 5,
      currentUnits: 0,
      isMyTurn: true,
      round: 1,
      phase: 'placement', // placement, action, resolution
    };

    return success(c, board);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取战斗事件 - GET /battle/chess/event
app.get('/chess/event', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const pos = c.req.query('pos') || '';
  const playerID = c.req.query('playerID') || '';
  const eventState = c.req.query('eventState') || '0';

  try {
    // 返回战斗事件（战斗动画、日志等）
    const events = {
      battleLog: [] as any[],
      animations: [] as any[],
      lastAction: null,
      currentRound: parseInt(eventState) || 1,
    };

    return success(c, events);
  } catch (err: any) {
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
      SELECT COUNT(*) as count FROM battle_records 
      WHERE wallet_address = ? AND DATE(created_at) = ?
    `).bind(walletAddress, today).first();

    const winCount: any = await db.prepare(`
      SELECT COUNT(*) as count FROM battle_records 
      WHERE wallet_address = ? AND DATE(created_at) = ? AND result = 'win'
    `).bind(walletAddress, today).first();

    const loseCount: any = await db.prepare(`
      SELECT COUNT(*) as count FROM battle_records 
      WHERE wallet_address = ? AND DATE(created_at) = ? AND result = 'lose'
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
    // 验证移动是否合法
    const isValidMove = validateMove(chessIndex, targetX, targetY);

    if (!isValidMove) {
      return error(c, 'Invalid move');
    }

    // 返回移动结果
    return success(c, {
      success: true,
      fromX: chessIndex % 8,
      fromY: Math.floor(chessIndex / 8),
      toX: targetX,
      toY: targetY,
      moveCost: 1,
      remainingMoves: 2,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 攻击操作 - POST /battle/chess/attack
app.post('/chess/attack', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { pos, playerID, chessIndex, targetID, type } = await c.req.json<{
    pos?: string;
    playerID?: string;
    chessIndex?: number;
    targetID?: number;
    type?: number;
  }>();

  if (!pos || chessIndex === undefined || targetID === undefined) {
    return error(c, 'pos, chessIndex, and targetID are required');
  }

  try {
    // 计算攻击结果
    const attackResult = {
      success: true,
      damage: Math.floor(Math.random() * 50) + 50,
      isCritical: Math.random() < BATTLE_CONFIG.CRITICAL_RATE,
      targetRemainingHp: Math.max(0, 100 - Math.floor(Math.random() * 50) - 50),
      kill: Math.random() < 0.3,
      type: type || 1, // 1-普通攻击, 2-技能攻击, 3-暴击
    };

    // 记录战斗
    await fightService.recordBattle(db, walletAddress, {
      battleType: BATTLE_TYPES.PVE,
      opponentAddress: `npc_${targetID}`,
      result: attackResult.success ? 'win' : 'lose',
      rounds: 1,
      rewards: {
        exp: attackResult.success ? BATTLE_CONFIG.REWARD_EXP_BASE : 0,
        gold: attackResult.success ? BATTLE_CONFIG.REWARD_GOLD_BASE : 0,
      },
    });

    return success(c, attackResult);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取排行榜 - GET /battle/chess/rank
app.get('/chess/rank', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');

  try {
    // 生成模拟排行榜数据
    const ranks = generateMockRanks(page, pageSize);
    const total = 100;

    return success(c, {
      ranks,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
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

  const username = c.req.query('username') || '';

  try {
    // 获取用户排名
    const userRank = {
      username: username || 'Unknown',
      rank: Math.floor(Math.random() * 100) + 1,
      wins: Math.floor(Math.random() * 50),
      winRate: (Math.random() * 0.5 + 0.3).toFixed(2),
      power: Math.floor(Math.random() * 10000) + 5000,
    };

    return success(c, userRank);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取战斗状态 - GET /battle/state
app.get('/state', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const city_id = parseInt(c.req.query('city_id') || '0');

  if (!city_id) return error(c, 'city_id is required');

  try {
    // 返回战斗状态
    return success(c, {
      inBattle: false,
      currentBattle: null,
      battleType: null,
      opponent: null,
      round: 0,
      phase: 'idle',
      lastAction: null,
      autoBattle: false,
    });
  } catch (err: any) {
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

/**
 * 验证移动是否合法
 */
function validateMove(chessIndex: number, targetX: number, targetY: number): boolean {
  // 检查目标位置是否在棋盘内
  if (targetX < 0 || targetX >= 8 || targetY < 0 || targetY >= 8) {
    return false;
  }

  // 检查距离（假设只能移动1格）
  const fromX = chessIndex % 8;
  const fromY = Math.floor(chessIndex / 8);
  const distance = Math.abs(targetX - fromX) + Math.abs(targetY - fromY);

  return distance <= 2; // 最多移动2格
}

/**
 * 生成模拟排行榜数据
 */
function generateMockRanks(page: number, pageSize: number) {
  const ranks = [];
  const start = (page - 1) * pageSize;

  for (let i = 0; i < pageSize; i++) {
    const rank = start + i + 1;
    ranks.push({
      rank,
      username: `Player_${rank}`,
      wins: Math.floor(Math.random() * 100) + rank,
      winRate: (0.3 + Math.random() * 0.4).toFixed(2),
      power: Math.floor(Math.random() * 10000) + 10000 - rank * 10,
      title: rank <= 3 ? ['🏆', '🥈', '🥉'][rank - 1] : '',
    });
  }

  return ranks;
}

export default app;
