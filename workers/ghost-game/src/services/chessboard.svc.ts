/**
 * Chessboard Service - 战场状态管理服务
 * 参考 jx/BLL/ChessEx.cs 和 jx/Model/ChessData.cs
 * 实现 14x17 网格的战棋战斗系统
 */
import warfareConfig from '../config/warfare.json';

// 战场数据模型类型
export interface Chessboard {
  Pos: number;
  Width: number;
  Height: number;
  BattleSeconds: number;
  WaitSeconds: number;
  State: number; // 0=等待中, 1=战斗中, 100=平局, 101=B方胜, 102=A方胜
  StartTime: string;
  EndTime?: string;
  BattleType: number; // 1=死战, 2=夺旗, 3=竞速
  TotalSecondsNow?: number;
  AthleticsType: number; // 1=个人, 2=组队, 3=帮派
  ServerUnit: number;
  PlayerNum: number;
  PlayerList: Chessplayer[];
  ChessunitMap: Chessunit[][];
  ChessmanList: Chessman[];
  EventList: Chessevent[];
  PlayerEventState: number[];
}

export interface Chessplayer {
  ID: number;
  Camp: number; // 0=A方, 1=B方
  UserName: string;
  CityID: number;
  CityPos: number;
  CityName: string;
  AthleticsType: number;
  MaxLevel: number;
  RoomID: number;
  ServerUnit: number;
  BattleType: number;
  CorpId: number;
  CorpState: number;
  ChessHero: number[];
  ChessBuilding: number[];
  Insignia: number;
  FrInsignia: number;
  KillMan: number;
}

export interface Chessman {
  ChessIndex: number;
  Player: number;
  Camp: number;
  Type: number; // 1=侠客, 2=建筑
  X: number;
  Y: number;
  Name: string;
  Image: string;
  Level: number;
  Quality: number;
  MaxHitPoint: number;
  HitPoint: number;
  AttackPoint: number;
  CrushBlow: number;
  Dodge: number;
  Speed: number;
  MovePoint: number;
  AttackRange: number;
  SkillMight: number;
  SkillPoint: number;
  SkillType: number;
  SkillEffType: number;
  SkillElement: number;
  SkillName?: string;
  ActionPoint: number;
  MaxActionPoint: number;
  ActionNeed: number[];
  Resist: number[];
  EffList: number[];
  MoveExpend: number[];
  Exploit: number;
  State: number; // 0=正常, 99=死亡
  Visible: number;
  CanMoveOn: number;
  ExpandType: number;
  LandformEffType: number;
  LandformEffRange: number;
  LandformEffValue: number;
  LastActonTime: string;
  // 侠客特有字段
  UserName?: string;
  CiytId?: number;
  HeroId?: number;
  Exp: number;
  GetExp?: number;
  UpLeve?: number;
  Disciple?: number;
  Freducate?: number;
  Educate?: number;
  JunTa?: number;
  LeveExpStatic?: number;
  Element?: number;
  // 建筑特有字段
  DefenceId?: number;
  Index?: number;
}

export interface Chessunit {
  HeroID: number;
  BuildingID: number;
  EffList: number[];
}

export interface Chessevent {
  ID: number;
  ObjAction: number; // 0=移动, 1=普通攻击, 2=技能攻击, 3=地形伤害, 4=陷阱伤害, 5=失去加速, 6=获得加速
  ObjID: number;
  TargetID: number;
  Player: number;
  EffValue: number;
  ExpandEffValue?: number[];
}

export interface ChessboardInfo {
  Height: number;
  Width: number;
  Pos: number;
  BattleSeconds: number;
  WaitSeconds: number;
  State: number;
  TotalSecondsNow: number;
  ChessunitMap: Chessunit[][];
  ChessmanList: Chessman[];
  ChessplayerList: ChessplayerInfo[];
}

export interface ChessplayerInfo {
  UserName: string;
  CityName: string;
  Camp: number;
  ID: number;
  ItemList?: any[];
  MyChessman: number[];
  EventState: number;
}

// 战场内存存储 (简化版，使用 Map 存储)
const chessboardStore = new Map<number, Chessboard>();

// 错误码映射
const CHESS_ERROR_CODES: Record<number, string> = {
  101: '战场位置不存在',
  102: '战斗状态异常',
  10: '目标位置不在棋盘内',
  11: '棋子不存在',
  12: '棋子不属于该玩家',
  13: '棋子状态异常',
  14: '目标位置已被占用',
  15: '移动距离超出范围',
  16: '行动点不足',
  17: '目标不可攻击',
  18: '不能攻击己方单位',
  19: '不能治疗己方单位',
  99: '玩家ID无效',
};

// 战斗类型常量
export const BATTLE_TYPES = {
  DEATH: 1, // 死战模式
  CAPTURE_FLAG: 2, // 夺旗模式
  SPEED: 3, // 竞速模式
} as const;

export const ATHLETICS_TYPES = {
  PERSONAL: 1, // 个人竞技
  TEAM: 2, // 组队竞技
  GUILD: 3, // 帮派竞技
} as const;

// 网格尺寸
export const CHESSBOARD_WIDTH = 14;
export const CHESSBOARD_HEIGHT = 17;

/**
 * 创建新战场
 */
export function createChessboard(
  pos: number,
  battleType: number,
  athleticsType: number,
  serverUnit: number,
  maxLevel: number,
  roomID: number
): Chessboard | null {
  // 检查是否已存在
  if (chessboardStore.has(pos)) {
    return null;
  }

  const warfareArea = (warfareConfig.Warfare || []).find(
    (w: any) => w.AthleticsType === athleticsType && w.AthleticsMode === battleType
  );
  const manHow = warfareArea?.ManHow || 2;

  const chessboard: Chessboard = {
    Pos: pos,
    Width: CHESSBOARD_WIDTH,
    Height: CHESSBOARD_HEIGHT,
    BattleSeconds: 3600,
    WaitSeconds: 10,
    State: 0,
    StartTime: new Date().toISOString(),
    BattleType: battleType,
    AthleticsType: athleticsType,
    ServerUnit: serverUnit,
    PlayerNum: manHow,
    PlayerList: new Array(manHow * 2).fill(null),
    ChessunitMap: [],
    ChessmanList: [],
    EventList: [],
    PlayerEventState: new Array(manHow * 2).fill(0),
  };

  // 初始化网格
  for (let i = 0; i < chessboard.Height; i++) {
    chessboard.ChessunitMap[i] = [];
    for (let j = 0; j < chessboard.Width; j++) {
      chessboard.ChessunitMap[i][j] = {
        HeroID: -1,
        BuildingID: -1,
        EffList: new Array(20).fill(0),
      };
    }
  }

  chessboardStore.set(pos, chessboard);
  return chessboard;
}

/**
 * 获取战场信息
 */
export function getChessboard(pos: number): Chessboard | null {
  return chessboardStore.get(pos) || null;
}

/**
 * 获取完整战场信息 (对应 C# GetChessInfo)
 */
export function getChessInfo(pos: number): ChessboardInfo | null {
  const chessboard = chessboardStore.get(pos);
  if (!chessboard) {
    return null;
  }

  const now = new Date();
  const startTime = new Date(chessboard.StartTime);
  const totalSecondsNow = Math.floor((now.getTime() - startTime.getTime()) / 1000);

  // 更新侠客行动点
  const ChessmanList = chessboard.ChessmanList.map((man) => {
    if (man && man.Type === 1) {
      const lastAction = new Date(man.LastActonTime);
      const spaceTime = Math.floor((now.getTime() - lastAction.getTime()) / 1000);
      if (man.ActionPoint <= man.MaxActionPoint) {
        man.ActionPoint = Math.min(
          spaceTime * man.Speed,
          man.MaxActionPoint
        );
      }
    }
    return man;
  });

  // 构建玩家列表
  const playerList: ChessplayerInfo[] = [];
  for (let i = 0; i < chessboard.PlayerList.length; i++) {
    const player = chessboard.PlayerList[i];
    if (player) {
      chessboard.PlayerEventState[i] = chessboard.EventList.length;
      playerList.push({
        UserName: player.UserName,
        CityName: player.CityName,
        Camp: player.Camp,
        ID: player.ID,
        MyChessman: player.ChessHero,
        EventState: chessboard.EventList.length,
      });
    }
  }

  return {
    Height: chessboard.Height,
    Width: chessboard.Width,
    Pos: chessboard.Pos,
    BattleSeconds: chessboard.BattleSeconds,
    WaitSeconds: chessboard.WaitSeconds,
    State: chessboard.State,
    TotalSecondsNow: chessboard.TotalSecondsNow,
    ChessunitMap: chessboard.ChessunitMap,
    ChessmanList,
    ChessplayerList: playerList,
  };
}

/**
 * 获取战场事件列表 (对应 C# GetChessEvent)
 */
export function getChessEvent(
  pos: number,
  userName: string,
  player: number,
  state: number
): Chessevent[] | null {
  const chessboard = chessboardStore.get(pos);
  if (!chessboard) {
    return null;
  }

  if (player < 0 || player >= chessboard.PlayerList.length) {
    return null;
  }

  const playerObj = chessboard.PlayerList[player];
  if (!playerObj || playerObj.UserName !== userName) {
    return null;
  }

  // 按时间更新战场状态
  updateChessStateByTime(chessboard);

  let index = chessboard.PlayerEventState[player];
  if (state < index) {
    index = state;
  }

  const listNum = chessboard.EventList.length;
  const eventList = chessboard.EventList.slice(index, listNum);
  chessboard.PlayerEventState[player] = listNum;

  return eventList;
}

/**
 * 添加棋子到战场
 */
export function addChessman(
  pos: number,
  chessman: Chessman
): boolean {
  const chessboard = chessboardStore.get(pos);
  if (!chessboard) {
    return false;
  }

  chessman.ChessIndex = chessboard.ChessmanList.length;
  chessboard.ChessmanList.push(chessman);

  // 更新网格
  if (chessman.Y >= 0 && chessman.Y < chessboard.Height &&
      chessman.X >= 0 && chessman.X < chessboard.Width) {
    if (chessman.Type === 1) {
      chessboard.ChessunitMap[chessman.Y][chessman.X].HeroID = chessman.ChessIndex;
    } else if (chessman.Type === 2) {
      chessboard.ChessunitMap[chessman.Y][chessman.X].BuildingID = chessman.ChessIndex;
    }
  }

  return true;
}

/**
 * 添加玩家到战场
 */
export function addPlayer(
  pos: number,
  player: Chessplayer
): boolean {
  const chessboard = chessboardStore.get(pos);
  if (!chessboard) {
    return false;
  }

  chessboard.PlayerList[player.ID] = player;
  return true;
}

/**
 * 移动棋子 (对应 C# ActionMove)
 */
export function actionMove(
  pos: number,
  userName: string,
  player: number,
  objID: number,
  targetX: number,
  targetY: number
): { code: number; message: string } {
  const chessboard = chessboardStore.get(pos);
  if (!chessboard) {
    return { code: 101, message: CHESS_ERROR_CODES[101] };
  }

  if (chessboard.State !== 1) {
    return { code: 102, message: CHESS_ERROR_CODES[102] };
  }

  // 检查目标位置是否在棋盘内
  if (!isInChessboard(chessboard, targetX, targetY)) {
    return { code: 10, message: CHESS_ERROR_CODES[10] };
  }

  // 检查棋子是否存在
  if (objID < 0 || !chessboard.ChessmanList[objID]) {
    return { code: 11, message: CHESS_ERROR_CODES[11] };
  }

  const man = chessboard.ChessmanList[objID];

  // 检查棋子是否属于该玩家
  if (man.Player !== player) {
    return { code: 12, message: CHESS_ERROR_CODES[12] };
  }

  // 检查棋子状态
  if (man.State !== 0) {
    return { code: 13, message: CHESS_ERROR_CODES[13] };
  }

  // 检查目标位置是否被占用
  const targetUnit = chessboard.ChessunitMap[targetY][targetX];
  if (targetUnit.HeroID >= 0) {
    return { code: 14, message: CHESS_ERROR_CODES[14] };
  }
  if (targetUnit.BuildingID >= 0) {
    const building = chessboard.ChessmanList[targetUnit.BuildingID];
    if (building && building.CanMoveOn === 0) {
      return { code: 14, message: CHESS_ERROR_CODES[14] };
    }
  }

  // 检查移动距离
  const moveDist = Math.abs(man.X - targetX) + Math.abs(man.Y - targetY);
  if (moveDist > man.MovePoint) {
    return { code: 15, message: CHESS_ERROR_CODES[15] };
  }

  // 检查行动点是否足够 (移动需要 ActionNeed[0])
  if (!isActionPointEnough(man, 0)) {
    return { code: 16, message: CHESS_ERROR_CODES[16] };
  }

  // 执行移动
  chessboard.ChessunitMap[man.Y][man.X].HeroID = -1;
  chessboard.ChessunitMap[targetY][targetX].HeroID = objID;
  man.X = targetX;
  man.Y = targetY;

  // 更新行动点
  const now = new Date();
  const lastAction = new Date(man.LastActonTime);
  const spaceTime = Math.floor((now.getTime() - lastAction.getTime()) / 1000);
  man.ActionPoint += spaceTime * man.Speed;
  man.ActionPoint -= man.ActionNeed[0];
  man.LastActonTime = now.toISOString();

  // 添加事件
  const event: Chessevent = {
    ID: chessboard.EventList.length,
    ObjAction: 0,
    ObjID: objID,
    TargetID: targetY * chessboard.Width + targetX,
    Player: player,
    EffValue: 0,
  };
  chessboard.EventList.push(event);

  // 更新战场状态
  updateChessStateByObj(chessboard);

  return { code: 0, message: '移动成功' };
}

/**
 * 攻击 (对应 C# ActionAttack)
 */
export function actionAttack(
  pos: number,
  userName: string,
  player: number,
  objID: number,
  targetID: number,
  type: number
): { code: number; message: string; event?: Chessevent } {
  const chessboard = chessboardStore.get(pos);
  if (!chessboard) {
    return { code: 101, message: CHESS_ERROR_CODES[101] };
  }

  if (chessboard.State !== 1) {
    return { code: 102, message: CHESS_ERROR_CODES[102] };
  }

  // 检查棋子是否存在
  if (objID < 0 || !chessboard.ChessmanList[objID]) {
    return { code: 10, message: CHESS_ERROR_CODES[10] };
  }

  // 检查目标是否存在
  if (targetID < 0 || !chessboard.ChessmanList[targetID]) {
    return { code: 11, message: CHESS_ERROR_CODES[11] };
  }

  const man = chessboard.ChessmanList[objID];
  const targetMan = chessboard.ChessmanList[targetID];

  // 检查棋子是否属于该玩家
  if (man.Player !== player) {
    return { code: 12, message: CHESS_ERROR_CODES[12] };
  }

  // 检查棋子状态
  if (man.State !== 0) {
    return { code: 13, message: CHESS_ERROR_CODES[13] };
  }

  // 检查目标状态
  if (targetMan.State !== 0) {
    return { code: 14, message: CHESS_ERROR_CODES[14] };
  }

  // 检查攻击距离 (2格内)
  const attackDist = Math.abs(man.X - targetMan.X) + Math.abs(man.Y - targetMan.Y);
  if (attackDist > 2) {
    return { code: 15, message: CHESS_ERROR_CODES[15] };
  }

  // 检查行动点
  if (!isActionPointEnough(man, type)) {
    return { code: 16, message: CHESS_ERROR_CODES[16] };
  }

  // 检查目标是否可移动 (不可移动建筑不能直接攻击)
  if (targetMan.CanMoveOn === 1) {
    return { code: 17, message: CHESS_ERROR_CODES[17] };
  }

  // 检查阵营 (不能攻击己方)
  if (type === 1 && man.Camp === targetMan.Camp) {
    return { code: 18, message: CHESS_ERROR_CODES[18] };
  }

  // 检查技能类型 (不能治疗敌方)
  if (type === 2 && man.SkillType === 0 && man.Camp === targetMan.Camp) {
    return { code: 19, message: CHESS_ERROR_CODES[19] };
  }

  // 计算伤害
  let damage = calculateDamage(man, targetMan);

  // 应用伤害
  if (type === 1) {
    // 普通攻击
    targetMan.HitPoint = Math.max(0, targetMan.HitPoint - damage);
  } else {
    // 技能攻击 (根据 SkillEffType 处理不同效果)
    switch (man.SkillEffType) {
      case 0: // 伤害技能
        targetMan.HitPoint = Math.max(0, targetMan.HitPoint - damage);
        break;
      case 1: // 治疗技能
        if (man.Camp !== targetMan.Camp) {
          targetMan.HitPoint = Math.max(0, targetMan.HitPoint - damage);
        } else if (targetMan.Type === 1) {
          const healAmount = Math.floor(man.SkillPoint * 0.4);
          targetMan.HitPoint = Math.min(targetMan.MaxHitPoint, targetMan.HitPoint + healAmount);
        }
        break;
      case 2: // 攻击强化
        if (man.Camp !== targetMan.Camp) {
          targetMan.HitPoint = Math.max(0, targetMan.HitPoint - damage);
        } else if (targetMan.Type === 1) {
          targetMan.AttackPoint += Math.floor(man.SkillPoint * 0.5);
        }
        break;
      case 3: // 攻击弱化
        if (man.Camp !== targetMan.Camp) {
          targetMan.HitPoint = Math.max(0, targetMan.HitPoint - damage);
        } else if (targetMan.Type === 1) {
          targetMan.AttackPoint = Math.max(0, targetMan.AttackPoint - Math.floor(man.SkillPoint * 0.5));
        }
        break;
      default:
        targetMan.HitPoint = Math.max(0, targetMan.HitPoint - damage);
    }
  }

  // 更新行动点
  const now = new Date();
  const lastAction = new Date(man.LastActonTime);
  const spaceTime = Math.floor((now.getTime() - lastAction.getTime()) / 1000);
  man.ActionPoint += spaceTime * man.Speed;
  man.ActionPoint -= man.ActionNeed[type];
  man.LastActonTime = now.toISOString();

  // 添加事件
  const event: Chessevent = {
    ID: chessboard.EventList.length,
    ObjAction: type,
    ObjID: objID,
    TargetID: targetID,
    Player: player,
    EffValue: targetMan.HitPoint,
  };
  chessboard.EventList.push(event);

  // 检查目标是否死亡
  if (targetMan.HitPoint <= 0) {
    targetMan.State = 99;
    if (targetMan.Type === 1) {
      chessboard.ChessunitMap[targetMan.Y][targetMan.X].HeroID = -1;
    } else if (targetMan.Type === 2) {
      chessboard.ChessunitMap[targetMan.Y][targetMan.X].BuildingID = -1;
    }
  }

  // 更新战场状态
  updateChessStateByObj(chessboard);

  return { code: 0, message: '攻击成功', event };
}

/**
 * 计算伤害
 */
function calculateDamage(attacker: Chessman, defender: Chessman): number {
  // 五行相克
  let wx = 1;
  if (attacker.Element !== undefined && defender.Element !== undefined) {
    const diff = attacker.Element - defender.Element;
    if (diff === -1 || diff === 4) {
      wx = 1.25;
    } else if (diff === 1 || diff === -4) {
      wx = 0.25;
    }
  }

  // 基础伤害计算
  const attackHert = Math.floor(
    attacker.AttackPoint *
      (1 - defender.Resist[0] * 0.004 / (defender.Resist[0] * 0.004 + 1)) *
      0.25 *
      wx *
      (defender.Educate / 100)
  );

  return Math.max(1, attackHert);
}

/**
 * 检查位置是否在棋盘内
 */
function isInChessboard(chessboard: Chessboard, x: number, y: number): boolean {
  return x >= 0 && x < chessboard.Width && y >= 0 && y < chessboard.Height;
}

/**
 * 检查行动点是否足够
 */
function isActionPointEnough(man: Chessman, actionType: number): boolean {
  if (actionType < 0 || actionType >= man.ActionNeed.length) {
    return false;
  }

  const now = new Date();
  const lastAction = new Date(man.LastActonTime);
  const spaceTime = Math.floor((now.getTime() - lastAction.getTime()) / 1000);
  const point = spaceTime * man.Speed;

  return point + man.ActionPoint >= man.ActionNeed[actionType];
}

/**
 * 按时间更新战场状态
 */
function updateChessStateByTime(chessboard: Chessboard): void {
  const now = new Date();
  const startTime = new Date(chessboard.StartTime);
  const spaceTime = Math.floor((now.getTime() - startTime.getTime()) / 1000);

  // 从等待转为战斗
  if (chessboard.State === 0 && spaceTime >= chessboard.WaitSeconds) {
    chessboard.State = 1;
    const event: Chessevent = {
      ID: chessboard.EventList.length,
      ObjAction: 98,
      Player: -1,
      TargetID: 0,
      ObjID: 0,
      EffValue: 1,
    };
    chessboard.EventList.push(event);
  }

  // 战斗超时
  if (chessboard.State === 1 && spaceTime >= chessboard.BattleSeconds + chessboard.WaitSeconds) {
    // 判断胜负 (死战模式)
    if (chessboard.BattleType === BATTLE_TYPES.DEATH) {
      const camp0Alive = checkCampAlive(chessboard, 0);
      const camp1Alive = checkCampAlive(chessboard, 1);

      if (!camp0Alive && !camp1Alive) {
        chessboard.State = 100;
      } else if (camp0Alive && !camp1Alive) {
        chessboard.State = 102;
      } else if (!camp0Alive && camp1Alive) {
        chessboard.State = 101;
      } else {
        chessboard.State = 100;
      }
    } else {
      chessboard.State = 100;
    }

    const event: Chessevent = {
      ID: chessboard.EventList.length,
      ObjAction: 99,
      Player: -1,
      TargetID: 0,
      ObjID: 0,
      EffValue: chessboard.State,
    };
    chessboard.EventList.push(event);
  }
}

/**
 * 检查某方是否存活
 */
function checkCampAlive(chessboard: Chessboard, camp: number): boolean {
  for (let i = 0; i < chessboard.PlayerList.length; i++) {
    const player = chessboard.PlayerList[i];
    if (player && player.Camp === camp && player.ChessHero.length > 0) {
      for (const heroIndex of player.ChessHero) {
        const man = chessboard.ChessmanList[heroIndex];
        if (man && man.State === 0) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * 按对象更新战场状态 (胜负判定)
 */
function updateChessStateByObj(chessboard: Chessboard): void {
  // 夺旗/竞速模式特殊判定
  if (chessboard.BattleType === BATTLE_TYPES.CAPTURE_FLAG ||
      chessboard.BattleType === BATTLE_TYPES.SPEED) {
    // 检查主城是否被摧毁
    if (chessboard.AthleticsType === ATHLETICS_TYPES.TEAM) {
      // 组队模式检查
      const camp0Building = getCampMainBuilding(chessboard, 0);
      const camp1Building = getCampMainBuilding(chessboard, 1);

      if (!camp0Building || camp0Building.State === 99) {
        chessboard.State = 101; // B方胜
        addEndEvent(chessboard, 101);
        return;
      }
      if (!camp1Building || camp1Building.State === 99) {
        chessboard.State = 102; // A方胜
        addEndEvent(chessboard, 102);
        return;
      }
    }
  }

  // 检查双方存活
  const camp0Alive = checkCampAlive(chessboard, 0);
  const camp1Alive = checkCampAlive(chessboard, 1);

  if (!camp0Alive && !camp1Alive) {
    chessboard.State = 100;
    addEndEvent(chessboard, 100);
  } else if (camp0Alive && !camp1Alive) {
    chessboard.State = 102;
    addEndEvent(chessboard, 102);
  } else if (!camp0Alive && camp1Alive) {
    chessboard.State = 101;
    addEndEvent(chessboard, 101);
  }
}

/**
 * 获取阵营主城建筑
 */
function getCampMainBuilding(chessboard: Chessboard, camp: number): Chessman | null {
  for (const man of chessboard.ChessmanList) {
    if (man && man.Type === 2 && man.Camp === camp && man.Index === 1) {
      return man;
    }
  }
  return null;
}

/**
 * 添加结束事件
 */
function addEndEvent(chessboard: Chessboard, state: number): void {
  chessboard.StartTime = new Date().toISOString();
  const event: Chessevent = {
    ID: chessboard.EventList.length,
    ObjAction: 99,
    Player: -1,
    TargetID: 0,
    ObjID: 0,
    EffValue: state,
  };
  chessboard.EventList.push(event);
}

/**
 * 移除战场
 */
export function removeChessboard(pos: number): boolean {
  return chessboardStore.delete(pos);
}

/**
 * 获取所有战场
 */
export function getAllChessboards(): Chessboard[] {
  return Array.from(chessboardStore.values());
}
