/**
 * Fight Service - 战斗服务层
 * 从 jx/BLL/Fight.cs 和 jx/BLL/FightSummaryCode.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { BattleRecord, ServiceResult } from '../types/models';
import { getUnitTypeBonus } from '../utils/battle-engine';
import battleLimitsConfig from '../config/battle_limits.json';

// 战斗限制配置 (从 battle_limits.json 加载)
export const BATTLE_LIMITS = {
  ATTACK_SAME_CITY_MAX: battleLimitsConfig.ATTACK_SAME_CITY_MAX || 2,
  ATTACK_LOW_LEVEL_MAX: battleLimitsConfig.ATTACK_LOW_LEVEL_MAX || 5,
  DEF_CITY_MAX: battleLimitsConfig.DEF_CITY_MAX || 5,
  LEVEL_XIANLING: battleLimitsConfig.LEVEL_XIANLING || 8,
  RESET_HOURS: battleLimitsConfig.RESET_HOURS || 24,
};

// 战斗类型
export const BATTLE_TYPES = {
  PVE: 'pve',      // 打怪/NPC
  PVP: 'pvp',      // 玩家对战
  GUILD: 'guild',  // 帮派战
  ARENA: 'arena',   // 竞技场
};

// 战斗状态
export const BATTLE_STATUS = {
  PENDING: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

// 战斗配置
export const BATTLE_CONFIG = {
  MAX_ROUNDS: 20,           // 最大回合数
  BASE_DAMAGE: 100,         // 基础伤害
  CRITICAL_RATE: 0.1,       // 暴击率
  CRITICAL_DAMAGE: 1.5,     // 暴击伤害
  DEFENSE_RATE: 0.2,        // 防御减伤率
  MAX_DAILY_BATTLES: 50,     // 每日最大战斗次数
  REWARD_EXP_BASE: 100,     // 基础经验奖励
  REWARD_GOLD_BASE: 50,     // 基础金币奖励
};

// 兵种相克表 (数字ID版 - 参考 battle-engine.ts)
// 1=步兵, 2=骑兵, 3=弓兵, 4=枪兵
// 克制关系: 步>骑>弓>步 (克制方伤害+20%)
export const UNIT_COUNTER: { [key: number]: { strong: number; weak: number } } = {
  1: { strong: 2, weak: 3 },  // 步兵克骑兵、被弓兵克
  2: { strong: 3, weak: 1 },  // 骑兵克弓兵、被步兵克
  3: { strong: 1, weak: 2 },  // 弓兵克步兵、被骑兵克
  4: { strong: 2, weak: 3 },  // 枪兵克骑兵、被弓兵克
};

// ==================== 战报编解码 ====================
// 参考 jx/BLL/FightSummaryCode.cs 的编码格式
// 字段分隔符: #
// 键值分隔符: $
// 格式: FieldName$Value#
// 复合类型: ++Begin++$TypeName#...++End++$TypeName#

export interface BattleSummaryCityInfo {
  Flag: number;        // 1=攻击方, 2=攻击援助, 3=防守方, 4=防守援助
  CityID: number;
  CityPos: number;
  Name: string;
  Power: number;       // 战前实力
  PowerBattleOver: number;  // 战后实力
  Army: number;        // 兵种
  HeroName: string;
  HeroLevel: number;
}

export interface BattleSummarySkillEffect {
  SkillID: number;
  UsCrushBlow: number;   // 必杀
  OtherDodge: number;    // 闪避
  SkillLevel: number;
}

export interface BattleSummaryHero {
  HeroID: number;
  HeroName: string;
  HeroLevel: number;
  HeroQuality: number;
  HeroPower: number;
}

export interface BattleSummaryRes {
  Type: number;
  Key: string;
  Value: number;
}

export interface BattleSummaryServerInfo {
  CityList: BattleSummaryCityInfo[];
  Res: BattleSummaryRes[];
  SkillEffectList: BattleSummarySkillEffect[];
  HeroList: BattleSummaryHero[];
  StatDefenceBuildList: any[];
  CityBuilds: any[];
  OrgResList: any[];
  FightWinName: string;
  FightWinFlag: number;
  FightTime: string;
  AttackPoint: number;
  DefencePoint: number;
  NoLossAttack: number;
  NoLossDefence: number;
  UserType: number;
  AttackInsignia: number;
  DefInsignia: number;
  AttackPointBattleOver: number;
  BuildDefencePower: number;
  BuildDefencePowerBattleOver: number;
  IsSkillExp: number;
  AttackPowerPer: number;
  DefencePowerPer: number;
  AttackPowerBattleBegin: number;
  DefencePowerBattleBegin: number;
  AttackPowerBattleEnd: number;
  DefencePowerBattleEnd: number;
  AttackPlundInsignia: number;
  WeiWang: number;
}

/**
 * 编码战报 - 将 BattleSummaryServerInfo 编码为压缩字符串
 * 参考 jx/BLL/FightSummaryCode.cs::CodingFightSummary
 */
export function encodeBattleSummary(summary: BattleSummaryServerInfo): string {
  let str = '';

  // 编码城市列表
  str += encodeBattleSummaryCity(summary.CityList);

  // 编码资源
  str += encodeBattleSummaryRes(summary.Res);

  // 编码技能效果
  str += encodeBattleSummarySkillEffect(summary.SkillEffectList);

  // 编码武将列表
  str += encodeBattleSummaryHero(summary.HeroList);

  // 基本字段
  str += `FightWinName$${summary.FightWinName}#`;
  str += `FightWinFlag$${summary.FightWinFlag}#`;
  str += `FightTime$${summary.FightTime}#`;
  str += `AttackPoint$${summary.AttackPoint}#`;
  str += `DefencePoint$${summary.DefencePoint}#`;
  str += `NoLossAttack$${summary.NoLossAttack}#`;
  str += `NoLossDefence$${summary.NoLossDefence}#`;
  str += `UserType$${summary.UserType}#`;

  // 整数字段
  str += writeAppointStrByInt("AttackInsignia", summary.AttackInsignia);
  str += writeAppointStrByInt("DefInsignia", summary.DefInsignia);
  str += writeAppointStrByInt("AttackPointBattleOver", summary.AttackPointBattleOver);
  str += writeAppointStrByInt("BuildDefencePower", summary.BuildDefencePower);
  str += writeAppointStrByInt("BuildDefencePowerBattleOver", summary.BuildDefencePowerBattleOver);
  str += writeAppointStrByInt("IsSkillExp", summary.IsSkillExp);
  str += writeAppointStrByInt("AttackPlundInsignia", summary.AttackPlundInsignia);

  // 威名 (可能为负数)
  if (summary.WeiWang >= 0) {
    str += writeAppointStrByInt("WeiWang", summary.WeiWang);
  }

  // Float字段
  str += writeAppointStrByFloat("AttackPowerPer", summary.AttackPowerPer);
  str += writeAppointStrByFloat("DefencePowerPer", summary.DefencePowerPer);
  str += writeAppointStrByFloat("AttackPowerBattleBegin", summary.AttackPowerBattleBegin);
  str += writeAppointStrByFloat("DefencePowerBattleBegin", summary.DefencePowerBattleBegin);
  str += writeAppointStrByFloat("AttackPowerBattleEnd", summary.AttackPowerBattleEnd);
  str += writeAppointStrByFloat("DefencePowerBattleEnd", summary.DefencePowerBattleEnd);

  // 结束标记
  str += "++End++$FightSummaryServerInfo#";

  return str;
}

/**
 * 解码战报 - 将压缩字符串解码为 BattleSummaryServerInfo
 * 参考 jx/BLL/FightSummaryCode.cs::DecodeFightSummary
 */
export function decodeBattleSummary(encoded: string): BattleSummaryServerInfo | null {
  try {
    const strArray = encoded.split('#');
    let num = 0;

    const summary: BattleSummaryServerInfo = {
      CityList: [],
      Res: [],
      SkillEffectList: [],
      HeroList: [],
      StatDefenceBuildList: [],
      CityBuilds: [],
      OrgResList: [],
      FightWinName: '',
      FightWinFlag: 0,
      FightTime: '',
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
      AttackPowerPer: 0,
      DefencePowerPer: 0,
      AttackPowerBattleBegin: 0,
      DefencePowerBattleBegin: 0,
      AttackPowerBattleEnd: 0,
      DefencePowerBattleEnd: 0,
      AttackPlundInsignia: 0,
      WeiWang: -1,
    };

    let maxNum = 0;

    while (num < strArray.length) {
      if (maxNum++ > 5000) return null;

      const part = strArray[num];
      if (!part) {
        num++;
        continue;
      }

      const kv = part.split('$');
      if (kv.length < 2) {
        num++;
        continue;
      }

      const key = kv[0];
      const value = kv[1];

      switch (key) {
        case '++Begin++':
          if (value === 'CityList') {
            summary.CityList = decodeBattleSummaryCity(strArray, num);
          } else if (value === 'Res') {
            summary.Res = decodeBattleSummaryRes(strArray, num);
          } else if (value === 'SkillEffectList') {
            summary.SkillEffectList = decodeBattleSummarySkillEffect(strArray, num);
          } else if (value === 'HeroList') {
            summary.HeroList = decodeBattleSummaryHero(strArray, num);
          }
          break;
        case 'FightWinName':
          summary.FightWinName = value;
          break;
        case 'FightWinFlag':
          summary.FightWinFlag = parseInt(value) || 0;
          break;
        case 'FightTime':
          summary.FightTime = value;
          break;
        case 'AttackPoint':
          summary.AttackPoint = parseInt(value) || 0;
          break;
        case 'DefencePoint':
          summary.DefencePoint = parseInt(value) || 0;
          break;
        case 'NoLossAttack':
          summary.NoLossAttack = parseInt(value) || 0;
          break;
        case 'NoLossDefence':
          summary.NoLossDefence = parseInt(value) || 0;
          break;
        case 'UserType':
          summary.UserType = parseInt(value) || 0;
          break;
        case 'AttackInsignia':
          summary.AttackInsignia = parseInt(value) || 0;
          break;
        case 'DefInsignia':
          summary.DefInsignia = parseInt(value) || 0;
          break;
        case 'AttackPointBattleOver':
          summary.AttackPointBattleOver = parseInt(value) || 0;
          break;
        case 'BuildDefencePower':
          summary.BuildDefencePower = parseInt(value) || 0;
          break;
        case 'BuildDefencePowerBattleOver':
          summary.BuildDefencePowerBattleOver = parseInt(value) || 0;
          break;
        case 'IsSkillExp':
          summary.IsSkillExp = parseInt(value) || 0;
          break;
        case 'AttackPowerPer':
          summary.AttackPowerPer = parseFloat(value) || 0;
          break;
        case 'DefencePowerPer':
          summary.DefencePowerPer = parseFloat(value) || 0;
          break;
        case 'AttackPowerBattleBegin':
          summary.AttackPowerBattleBegin = parseFloat(value) || 0;
          break;
        case 'DefencePowerBattleBegin':
          summary.DefencePowerBattleBegin = parseFloat(value) || 0;
          break;
        case 'AttackPowerBattleEnd':
          summary.AttackPowerBattleEnd = parseFloat(value) || 0;
          break;
        case 'DefencePowerBattleEnd':
          summary.DefencePowerBattleEnd = parseFloat(value) || 0;
          break;
        case 'AttackPlundInsignia':
          summary.AttackPlundInsignia = parseInt(value) || 0;
          break;
        case 'WeiWang':
          summary.WeiWang = parseInt(value) || 0;
          break;
        case '++End++':
          if (value === 'FightSummaryServerInfo') {
            return summary;
          }
          break;
      }

      num++;
    }

    return summary;
  } catch {
    return null;
  }
}

// ==================== 内部编码函数 ====================

function writeBeginStr(type: string): string {
  return `++Begin++$${type}#`;
}

function writeEndStr(type: string): string {
  return `++End++$${type}#`;
}

function writeAppointStrByInt(name: string, value: number): string {
  return `${name}$${value}#`;
}

function writeAppointStrByFloat(name: string, value: number): string {
  return `${name}$${value.toString()}#`;
}

function writeAppointStrByStr(name: string, value: string): string {
  return `${name}$${value}#`;
}

function encodeBattleSummaryCity(cityList: BattleSummaryCityInfo[]): string {
  if (!cityList || cityList.length === 0) return '';

  let str = writeBeginStr('CityList');

  for (const city of cityList) {
    str += writeBeginStr('City');
    str += writeAppointStrByInt('Flag', city.Flag);
    str += writeAppointStrByInt('CityID', city.CityID);
    str += writeAppointStrByInt('CityPos', city.CityPos);
    str += writeAppointStrByStr('Name', city.Name);
    str += writeAppointStrByInt('Power', city.Power);
    str += writeAppointStrByInt('PowerBattleOver', city.PowerBattleOver);
    str += writeAppointStrByInt('Army', city.Army);
    str += writeAppointStrByStr('HeroName', city.HeroName);
    str += writeAppointStrByInt('HeroLevel', city.HeroLevel);
    str += writeEndStr('City');
  }

  str += writeEndStr('CityList');
  return str;
}

function encodeBattleSummaryRes(resList: BattleSummaryRes[]): string {
  if (!resList || resList.length === 0) return '';

  let str = writeBeginStr('Res');

  for (const res of resList) {
    str += writeBeginStr('ResItem');
    str += writeAppointStrByInt('Type', res.Type);
    str += writeAppointStrByStr('Key', res.Key);
    str += writeAppointStrByInt('Value', res.Value);
    str += writeEndStr('ResItem');
  }

  str += writeEndStr('Res');
  return str;
}

function encodeBattleSummarySkillEffect(effects: BattleSummarySkillEffect[]): string {
  if (!effects || effects.length === 0) return '';

  let str = writeBeginStr('SkillEffectList');

  for (const effect of effects) {
    str += writeBeginStr('SkillEffect');
    str += writeAppointStrByInt('SkillID', effect.SkillID);
    str += writeAppointStrByInt('UsCrushBlow', effect.UsCrushBlow);
    str += writeAppointStrByInt('OtherDodge', effect.OtherDodge);
    str += writeAppointStrByInt('SkillLevel', effect.SkillLevel);
    str += writeEndStr('SkillEffect');
  }

  str += writeEndStr('SkillEffectList');
  return str;
}

function encodeBattleSummaryHero(heroes: BattleSummaryHero[]): string {
  if (!heroes || heroes.length === 0) return '';

  let str = writeBeginStr('HeroList');

  for (const hero of heroes) {
    str += writeBeginStr('Hero');
    str += writeAppointStrByInt('HeroID', hero.HeroID);
    str += writeAppointStrByStr('HeroName', hero.HeroName);
    str += writeAppointStrByInt('HeroLevel', hero.HeroLevel);
    str += writeAppointStrByInt('HeroQuality', hero.HeroQuality);
    str += writeAppointStrByInt('HeroPower', hero.HeroPower);
    str += writeEndStr('Hero');
  }

  str += writeEndStr('HeroList');
  return str;
}

// ==================== 内部解码函数 ====================

function decodeBattleSummaryCity(strArray: string[], startIdx: number): BattleSummaryCityInfo[] {
  const cities: BattleSummaryCityInfo[] = [];
  let num = startIdx;
  let maxNum = 0;

  while (num < strArray.length) {
    if (maxNum++ > 1000) break;

    const part = strArray[num];
    if (!part) {
      num++;
      continue;
    }

    const kv = part.split('$');
    if (kv.length < 2) {
      num++;
      continue;
    }

    if (kv[0] === '++End++' && kv[1] === 'CityList') {
      num++;
      break;
    }

    if (kv[0] === '++Begin++' && kv[1] === 'City') {
      const city: BattleSummaryCityInfo = {
        Flag: 0,
        CityID: 0,
        CityPos: 0,
        Name: '',
        Power: 0,
        PowerBattleOver: 0,
        Army: 0,
        HeroName: '',
        HeroLevel: 0,
      };

      num++;
      while (num < strArray.length) {
        if (maxNum++ > 1000) break;

        const fieldPart = strArray[num];
        if (!fieldPart) {
          num++;
          continue;
        }

        const fieldKv = fieldPart.split('$');
        if (fieldKv.length < 2) {
          num++;
          continue;
        }

        if (fieldKv[0] === '++End++' && fieldKv[1] === 'City') {
          num++;
          break;
        }

        switch (fieldKv[0]) {
          case 'Flag':
            city.Flag = parseInt(fieldKv[1]) || 0;
            break;
          case 'CityID':
            city.CityID = parseInt(fieldKv[1]) || 0;
            break;
          case 'CityPos':
            city.CityPos = parseInt(fieldKv[1]) || 0;
            break;
          case 'Name':
            city.Name = fieldKv[1];
            break;
          case 'Power':
            city.Power = parseInt(fieldKv[1]) || 0;
            break;
          case 'PowerBattleOver':
            city.PowerBattleOver = parseInt(fieldKv[1]) || 0;
            break;
          case 'Army':
            city.Army = parseInt(fieldKv[1]) || 0;
            break;
          case 'HeroName':
            city.HeroName = fieldKv[1];
            break;
          case 'HeroLevel':
            city.HeroLevel = parseInt(fieldKv[1]) || 0;
            break;
        }

        num++;
      }

      cities.push(city);
      continue;
    }

    num++;
  }

  return cities;
}

function decodeBattleSummaryRes(strArray: string[], startIdx: number): BattleSummaryRes[] {
  const resList: BattleSummaryRes[] = [];
  return resList;
}

function decodeBattleSummarySkillEffect(strArray: string[], startIdx: number): BattleSummarySkillEffect[] {
  const effects: BattleSummarySkillEffect[] = [];
  return effects;
}

function decodeBattleSummaryHero(strArray: string[], startIdx: number): BattleSummaryHero[] {
  const heroes: BattleSummaryHero[] = [];
  return heroes;
}

// ==================== 伤害计算 ====================

export interface DamageParams {
  attackerAttack: number;      // 攻击方攻击力
  attackerLevel: number;       // 攻击方等级
  attackerType: number;        // 攻击方兵种类型 (1=步,2=骑,3=弓,4=枪)
  defenderDefense: number;     // 防御方防御力
  defenderLevel: number;       // 防御方等级
  defenderType: number;        // 防御方兵种类型
  defenderBuildingDefense?: number;  // 城防加成
  attackerHeroPower?: number;  // 武将加成
}

/**
 * 计算战斗伤害 - 基于属性的真实伤害计算
 * 参考 jx/BLL/Fight.cs 和 battle-engine.ts
 * 
 * 伤害公式: damage = attack * 1.5 - defense * 0.5, 最低为1
 * 兵种相克: 步>骑>弓>步, 克制方伤害+20%
 */
export function calculateDamage(params: DamageParams): {
  damage: number;
  isCritical: boolean;
  isMiss: boolean;
  typeBonus: number;
} {
  const {
    attackerAttack,
    attackerLevel,
    attackerType,
    defenderDefense,
    defenderLevel,
    defenderType,
    defenderBuildingDefense = 0,
    attackerHeroPower = 0,
  } = params;

  // 基础伤害 = attack * 1.5 - defense * 0.5 (最低1)
  // 攻击力 = attackerAttack + attackerHeroPower
  const attackPower = attackerAttack + attackerHeroPower;
  let baseDamage = attackPower * 1.5 - defenderDefense * 0.5;

  // 兵种相克加成: 步>骑>弓>步, 克制方+20%
  let typeBonus = 1.0;
  if (attackerType && defenderType) {
    const counter = UNIT_COUNTER[attackerType];
    if (counter && counter.strong === defenderType) {
      typeBonus = 1.2; // 克制方伤害+20%
    }
  }

  // 应用兵种相克加成
  baseDamage = baseDamage * typeBonus;

  // 应用城防减免
  if (defenderBuildingDefense > 0) {
    baseDamage = baseDamage - defenderBuildingDefense * 0.3;
  }

  // 最终伤害，最低为1
  const damage = Math.max(1, Math.floor(baseDamage));

  return {
    damage,
    isCritical: false, // 新公式不含暴击
    isMiss: false,      // 新公式不含闪避
    typeBonus,
  };
}

// ==================== 棋盘数据 ====================

export interface ChessboardData {
  Pos: number;
  Height: number;
  Width: number;
  Time: number;
  State: number;
  TotalSecondsNow: number;
  BattleSeconds: number;
  WaitSeconds: number;
  ChessunitMap: any;
  ChessplayerList: any;
  ChessmanList: any;
}

/**
 * 获取棋盘数据 - 根据位置获取战场信息
 * 只有当战场存在时返回 Pos != -1 的数据
 * 
 * 注意: battles 表当前没有 pos 和 state 列
 * - pos 参数用于验证用户是否有权访问该战场
 * - 通过 attacker_address/defender_address 关联战场
 */
export async function getChessboardByPos(db: D1Database, pos: number, walletAddress: string): Promise<ChessboardData | null> {
  // 查询用户参与的最新战斗 (result 为空表示进行中)
  // 使用 attacker_address 或 defender_address 查询
  const battle: any = await db.prepare(`
    SELECT * FROM battles
    WHERE (attacker_address = ? OR defender_address = ?)
      AND result IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(walletAddress, walletAddress).first();

  if (!battle) {
    // 没有进行中的战斗，尝试获取最近一场未完成的
    const recentBattle: any = await db.prepare(`
      SELECT * FROM battles
      WHERE (attacker_address = ? OR defender_address = ?)
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(walletAddress, walletAddress).first();
    
    if (!recentBattle) {
      return null; // 没有战场
    }
    
    // 如果最近一场战斗已结束，返回 null
    if (recentBattle.result) {
      return null;
    }
    
    return null; // 有战场但已结束
  }

  // 获取攻击方信息
  const attackerCity: any = await db.prepare(`
    SELECT c.*
    FROM cities c
    WHERE c.wallet_address = ?
    LIMIT 1
  `).bind(battle.attacker_address).first();

  // 获取防御方信息
  const defenderCity: any = battle.defender_address ? await db.prepare(`
    SELECT c.*
    FROM cities c
    WHERE c.wallet_address = ?
    LIMIT 1
  `).bind(battle.defender_address).first() : null;

  // 获取攻击方武将列表 (state=1 在队列, state=10 参战中)
  const attackerHeroesResult: any = await db.prepare(`
    SELECT * FROM heroes 
    WHERE wallet_address = ? AND state IN (1, 10) 
    ORDER BY attack DESC LIMIT 5
  `).bind(battle.attacker_address).all();
  const attackerHeroes: any[] = attackerHeroesResult.results || [];

  // 获取防御方武将列表
  const defenderHeroesResult: any = battle.defender_address ? await db.prepare(`
    SELECT * FROM heroes 
    WHERE wallet_address = ? AND state IN (1, 10) 
    ORDER BY attack DESC LIMIT 5
  `).bind(battle.defender_address).all() : { results: [] };
  const defenderHeroes: any[] = defenderHeroesResult.results || [];

  // 构建棋盘数据
  const now = Date.now();
  const battleSeconds = 300; // 5分钟战斗时间
  const waitSeconds = 60;    // 1分钟等待时间
  const battleStartTime = new Date(battle.created_at).getTime();
  const elapsedSeconds = Math.floor((now - battleStartTime) / 1000);
  const remainingSeconds = Math.max(0, battleSeconds - elapsedSeconds);

  // 生成棋盘地图
  const chessunitMap = generateBattleChessunitMap(attackerHeroes, defenderHeroes);

  // 生成玩家列表
  // 前端 Chess.js 期望: ID, Camp, EventState, UserName, CityName, MyChessman
  // chessmanList 索引: 攻击方 0-4 (IDs 1-5), 防守方 5-9 (IDs 11-15)
  const chessplayerList = [
    {
      ID: 0,  // 玩家索引 (hero.Player 会匹配这个)
      Camp: 1,  // 1=攻击方
      Flag: 1,  // 兼容
      UserName: battle.attacker_address,
      CityName: attackerCity?.name || '进攻方',
      CityPos: attackerCity?.position || pos,
      HeroName: attackerHeroes[0]?.name || '主将',
      HeroLevel: attackerHeroes[0]?.level || 1,
      Power: calculatePlayerPower(attackerHeroes),
      Chessman: attackerHeroes.map((h, i) => i),  // chessmanList 索引 (0-based)
      MyChessman: attackerHeroes.map((h, i) => i + 1),  // chessmanList ID (1-based)
      EventState: 0,
    },
  ];

  if (defenderCity) {
    chessplayerList.push({
      ID: 1,  // 玩家索引 (hero.Player 会匹配这个)
      Camp: 3,  // 3=防守方
      Flag: 3,  // 兼容
      UserName: battle.defender_address,
      CityName: defenderCity.name || '防守方',
      CityPos: defenderCity.position || 0,
      HeroName: defenderHeroes[0]?.name || '守将',
      HeroLevel: defenderHeroes[0]?.level || 1,
      Power: calculatePlayerPower(defenderHeroes),
      Chessman: defenderHeroes.map((h, i) => attackerHeroes.length + i),  // chessmanList 索引 (0-based)
      MyChessman: defenderHeroes.map((h, i) => i + 11),  // chessmanList ID (11-20)
      EventState: 0,
    });
  }

  // 生成单位列表 (ChessmanList)
  // 注意: ID 字段是 ChessmanList 中的位置索引，1-10 是攻击方，11-20 是防守方
  // 字段名与前端 Chess.js 期望一致: HitPoint, MaxHitPoint, ActionPoint, Camp, State, Speed
  const chessmanList: any[] = [];

  // 行动力消耗配置: [普通攻击, 技能攻击, 暴击]
  const actionNeedDefault = [10, 30, 50];
  // 移动消耗配置: [本方地形, 对方地形, 中立地形]
  const moveExpendDefault = [1, 2, 1];
  // 抗性配置: [金抗, 木抗, 水抗, 火抗, 土抗, 无属性抗]
  const resistDefault = [0, 0, 0, 0, 0, 0];
  
  // 攻击方单位 (索引 1-10)
  for (let i = 0; i < attackerHeroes.length; i++) {
    const h = attackerHeroes[i];
    const baseStats = getBaseStatsByType(h.config_id || 1);
    chessmanList.push({
      ID: i + 1,  // 1-10 是攻击方 (也是 ChessIndex)
      HeroID: h.id,  // 原始武将ID
      ChessIndex: i + 1,  // 前端 Chess.js 期望的字段
      Name: h.name,
      Level: h.level,
      Type: h.config_id || 1,  // 兵种类型
      Attack: h.attack,
      AttackPoint: h.attack,
      AttackRange: baseStats.attackRange,
      Defense: h.defense,
      HitPoint: h.hp || h.max_hp,
      MaxHitPoint: h.max_hp,
      ActionPoint: 100,
      MaxActionPoint: 100,
      ActionNeed: actionNeedDefault,
      ActionState: 0,
      ActionFlag: [0, 0, 0],
      Speed: baseStats.speed,
      MoveExpend: moveExpendDefault,
      X: i % 8,
      Y: Math.floor(i / 4),  // 前两排
      Camp: 1,  // 1=攻击方
      Flag: 1,  // 1=攻击方 (兼容)
      State: 0,  // 0=正常, 99=死亡
      Player: 0,  // 玩家索引
      PlayerIndex: 0,  // 前端 Chess.js 期望的字段
      Image: '',
      Visible: 1,
      Resist: resistDefault,  // 前端 Chess.js 期望的抗性数组
      Dodge: 0,  // 前端 Chess.js 期望的闪避
      CrushBlow: 0,  // 前端 Chess.js 期望的暴击
      SkillName: '',  // 前端 Chess.js 期望的技能名
      SkillElement: 0,  // 前端 Chess.js 期望的技能属性
      SkillType: 0,  // 前端 Chess.js 期望的技能类型
      SkillEffType: 0,  // 前端 Chess.js 期望的技能效果类型
      MovePoint: 4,  // 前端 Chess.js 期望的移动力
      Element: baseStats.element || 0,  // 元素属性
    });
  }
  
  // 防守方单位 (索引 11-20)
  for (let i = 0; i < defenderHeroes.length; i++) {
    const h = defenderHeroes[i];
    const baseStats = getBaseStatsByType(h.config_id || 1);
    chessmanList.push({
      ID: i + 11,  // 11-20 是防守方 (也是 ChessIndex)
      HeroID: h.id,
      ChessIndex: i + 11,  // 前端 Chess.js 期望的字段
      Name: h.name,
      Level: h.level,
      Type: h.config_id || 1,
      Attack: h.attack,
      AttackPoint: h.attack,
      AttackRange: baseStats.attackRange,
      Defense: h.defense,
      HitPoint: h.hp || h.max_hp,
      MaxHitPoint: h.max_hp,
      ActionPoint: 100,
      MaxActionPoint: 100,
      ActionNeed: actionNeedDefault,
      ActionState: 0,
      ActionFlag: [0, 0, 0],
      Speed: baseStats.speed,
      MoveExpend: moveExpendDefault,
      X: i % 8,
      Y: 4 + Math.floor(i / 4),  // 后两排
      Camp: 3,  // 3=防守方
      Flag: 3,  // 3=防守方 (兼容)
      State: 0,  // 0=正常, 99=死亡
      Player: 1,  // 玩家索引
      PlayerIndex: 1,  // 前端 Chess.js 期望的字段
      Image: '',
      Visible: 1,
      Resist: resistDefault,  // 前端 Chess.js 期望的抗性数组
      Dodge: 0,  // 前端 Chess.js 期望的闪避
      CrushBlow: 0,  // 前端 Chess.js 期望的暴击
      SkillName: '',  // 前端 Chess.js 期望的技能名
      SkillElement: 0,  // 前端 Chess.js 期望的技能属性
      SkillType: 0,  // 前端 Chess.js 期望的技能类型
      SkillEffType: 0,  // 前端 Chess.js 期望的技能效果类型
      MovePoint: 4,  // 前端 Chess.js 期望的移动力
      Element: baseStats.element || 0,  // 元素属性
    });
  }

  // 判断战斗状态
  // battles表没有state列，state=1表示进行中（result为null），state=2表示已结束
  const battleState = battle.result ? BATTLE_STATUS.COMPLETED : BATTLE_STATUS.IN_PROGRESS;

  return {
    Pos: pos,
    Height: 8,
    Width: 8,
    Time: remainingSeconds,
    State: battleState,  // 使用正确的状态值
    TotalSecondsNow: Math.floor(now / 1000),
    BattleSeconds: battleSeconds,
    WaitSeconds: waitSeconds,
    ChessunitMap: chessunitMap,
    ChessplayerList: chessplayerList,
    ChessmanList: chessmanList,
  };
}

/**
 * 生成战斗棋盘地图 - 8x8 格子
 * 前端 Chess.js 期望: 扁平数组，每个元素是 Chessunit 对象 {X, Y, HeroID, BuildingID}
 * 索引 = y * 8 + x
 */
function generateBattleChessunitMap(attackerHeroes: any[], defenderHeroes: any[]): any[] {
  const map: any[] = [];
  
  // 初始化所有格子为空
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      map.push({
        X: x,
        Y: y,
        HeroID: -1,  // -1 表示无武将
        BuildingID: -1,  // -1 表示无建筑
        MoveExpend: 1,
        EffList: [],
      });
    }
  }

  // 放置攻击方武将 (索引 1-10)
  attackerHeroes.forEach((h, i) => {
    const x = i % 8;
    const y = Math.floor(i / 4);
    if (y < 2) {
      const idx = y * 8 + x;
      map[idx].HeroID = i;  // chessmanList 索引 (0-based)
    }
  });

  // 放置防御方武将 (索引 11-20)
  defenderHeroes.forEach((h, i) => {
    const x = i % 8;
    const y = 4 + Math.floor(i / 4);
    if (y >= 4 && y < 8) {
      const idx = y * 8 + x;
      map[idx].HeroID = attackerHeroes.length + i;  // chessmanList 索引 (0-based)
    }
  });

  return map;
}

/**
 * 根据兵种类型获取基础属性
 * 1=步兵, 2=骑兵, 3=弓兵, 4=枪兵
 */
function getBaseStatsByType(type: number): { speed: number; attackRange: number; element: number } {
  switch (type) {
    case 2: // 骑兵
      return { speed: 3, attackRange: 1, element: 1 };
    case 3: // 弓兵
      return { speed: 2, attackRange: 3, element: 2 };
    case 4: // 枪兵
      return { speed: 2, attackRange: 1, element: 3 };
    default: // 步兵 (1) 和未知
      return { speed: 2, attackRange: 1, element: 0 };
  }
}

/**
 * 生成默认棋盘地图
 */
function generateDefaultChessunitMap(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < 8; y++) {
    const row: number[] = [];
    for (let x = 0; x < 8; x++) {
      // 0 = 空地, 1-5 = 兵种单位
      row.push(0);
    }
    map.push(row);
  }
  return map;
}

/**
 * 生成玩家列表
 */
function generateChessplayerList(walletAddress: string, city: any, heroes: any[]): any[] {
  const players = [];

  // 攻击方（当前玩家）
  players.push({
    Flag: 1,
    UserName: walletAddress,
    CityName: city?.name || '我的城市',
    CityPos: city?.position || 0,
    HeroName: heroes[0]?.name || '主将',
    HeroLevel: heroes[0]?.level || 1,
    Power: calculatePlayerPower(heroes),
    Chessman: generatePlayerChessman(heroes),
  });

  return players;
}

/**
 * 生成单位列表
 */
function generateChessmanList(heroes: any[]): any[] {
  const chessmen = [];

  for (let i = 0; i < heroes.length; i++) {
    const hero = heroes[i];
    chessmen.push({
      ID: hero.id,
      Name: hero.name,
      Level: hero.level,
      Type: hero.config_id || 1,
      Attack: hero.attack,
      Defense: hero.defense,
      HP: hero.hp,
      MaxHP: hero.max_hp,
      X: i % 8,
      Y: Math.floor(i / 8),
    });
  }

  return chessmen;
}

/**
 * 计算玩家总战力
 */
function calculatePlayerPower(heroes: any[]): number {
  let power = 0;
  for (const hero of heroes) {
    power += hero.attack * 2 + hero.defense * 1.5 + hero.level * 10;
  }
  return Math.floor(power);
}

/**
 * 生成玩家的棋子位置
 */
function generatePlayerChessman(heroes: any[]): number[] {
  const chessman: number[] = [];
  for (let i = 0; i < heroes.length; i++) {
    chessman.push(i);
  }
  return chessman;
}

// ==================== FightService ====================

class FightService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ============ 战斗限制相关方法 ============

  /**
   * 获取繁荣度等级 - 根据城市繁荣度转换为等级
   * 繁荣度到等级的转换: 每 100 繁荣度 = 1 级
   * @param walletAddress 玩家钱包地址
   * @returns 繁荣度等级 (1-100+)
   */
  async getProsperityLevel(walletAddress: string): Promise<number> {
    try {
      // 从 cities 表获取繁荣度
      const city: any = await this.db.prepare(`
        SELECT prosperity FROM cities WHERE wallet_address = ?
      `).bind(walletAddress).first();

      if (!city) {
        return 1; // 默认等级
      }

      const prosperity = city.prosperity || 0;
      // 每 100 繁荣度 = 1 级，最低 1 级
      const level = Math.max(1, Math.floor(prosperity / 100) + 1);
      
      return level;
    } catch (error) {
      console.error('[FightService] getProsperityLevel error:', error);
      return 1;
    }
  }

  /**
   * 检查攻击次数限制 - 使用 battle_limits.json 配置
   * @param walletAddress 攻击方钱包地址
   * @param targetPos 目标位置
   * @param targetLevel 目标城市等级 (可选，用于检查低等级玩家限制)
   * @returns { valid: boolean, error?: number, message?: string }
   */
  async checkAttackCityLimit(
    walletAddress: string,
    targetPos: number,
    targetLevel?: number
  ): Promise<{ valid: boolean; error?: number; message?: string }> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. 检查当日攻击同一城市次数 (ATTACK_SAME_CITY_MAX)
      const sameTargetCount: any = await this.db.prepare(`
        SELECT COUNT(*) as count FROM battles
        WHERE attacker_address = ?
          AND defender_address IS NOT NULL
          AND DATE(created_at) = ?
      `).bind(walletAddress, today).first();

      if ((sameTargetCount as any).count >= BATTLE_LIMITS.ATTACK_SAME_CITY_MAX) {
        return {
          valid: false,
          error: 30131,
          message: `同一天攻击同一个玩家不能超过${BATTLE_LIMITS.ATTACK_SAME_CITY_MAX}次`
        };
      }

      // 2. 检查累计攻击低级别玩家次数 (ATTACK_LOW_LEVEL_MAX)
      // 获取攻击方繁荣度等级
      const attackerLevel = await this.getProsperityLevel(walletAddress);

      // 如果目标等级明确提供且低于攻击方一定等级（仙灵等级），检查限制
      if (targetLevel && targetLevel < BATTLE_LIMITS.LEVEL_XIANLING) {
        const lowLevelCount: any = await this.db.prepare(`
          SELECT COUNT(*) as count FROM battles b
          JOIN cities c ON b.defender_address = c.wallet_address
          WHERE b.attacker_address = ?
            AND b.result = 'win'
            AND DATE(b.created_at) = ?
            AND c.level < ?
        `).bind(walletAddress, today, BATTLE_LIMITS.LEVEL_XIANLING).first();

        if ((lowLevelCount as any).count >= BATTLE_LIMITS.ATTACK_LOW_LEVEL_MAX) {
          return {
            valid: false,
            error: 30132,
            message: `同一天累计攻击低等级玩家不能超过${BATTLE_LIMITS.ATTACK_LOW_LEVEL_MAX}次`
          };
        }
      }

      // 3. 检查防守方城市数量限制 (DEF_CITY_MAX)
      // 获取攻击方作为防守方的被攻击次数
      const defendCount: any = await this.db.prepare(`
        SELECT COUNT(*) as count FROM battles
        WHERE defender_address = ?
          AND DATE(created_at) = ?
      `).bind(walletAddress, today).first();

      if ((defendCount as any).count >= BATTLE_LIMITS.DEF_CITY_MAX) {
        return {
          valid: false,
          error: 30133,
          message: `同日被攻击次数不能超过${BATTLE_LIMITS.DEF_CITY_MAX}次`
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('[FightService] checkAttackCityLimit error:', error);
      return { valid: true }; // 出错时默认允许
    }
  }

  // ============ 战斗计算 ============

  /**
   * 计算战斗结果
   */
  calculateBattle(params: {
    attackerPower: number;
    defenderPower: number;
    attackerCount: number;
    defenderCount: number;
    attackerType: number;
    defenderType: number;
    attackerHeroPower?: number;
    defenderHeroPower?: number;
  }): {
    winner: 'attacker' | 'defender' | 'draw';
    attackerLoss: number;
    defenderLoss: number;
    attackerRemaining: number;
    defenderRemaining: number;
    rounds: number;
    isCritical: boolean;
    expReward: number;
    goldReward: number;
  } {
    const { attackerPower, defenderPower, attackerCount, defenderCount, attackerType, defenderType } = params;

    // 兵种相克加成
    const attackerCounter = UNIT_COUNTER[attackerType];
    const defenderCounter = UNIT_COUNTER[defenderType];

    let attackerBonus = 1;
    let defenderBonus = 1;

    if (attackerCounter && attackerCounter.strong === defenderType) {
      attackerBonus = 1.5;
    }
    if (defenderCounter && defenderCounter.strong === attackerType) {
      defenderBonus = 1.5;
    }

    // 计算总攻击力（含武将加成）
    const totalAttackerPower = attackerPower + (params.attackerHeroPower || 0);
    const totalDefenderPower = defenderPower + (params.defenderHeroPower || 0);

    // 回合计算
    let rounds = 0;
    let attackerLoss = 0;
    let defenderLoss = 0;
    let isCritical = false;

    while (rounds < BATTLE_CONFIG.MAX_ROUNDS && attackerCount - attackerLoss > 0 && defenderCount - defenderLoss > 0) {
      rounds++;

      // 暴击判定
      const criticalRoll = Math.random();
      const isCrit = criticalRoll < BATTLE_CONFIG.CRITICAL_RATE;

      // 伤害计算
      const attackerDamage = (totalAttackerPower * attackerBonus * (isCrit ? BATTLE_CONFIG.CRITICAL_DAMAGE : 1)) /
        Math.max(1, totalDefenderPower * (1 - BATTLE_CONFIG.DEFENSE_RATE));
      const defenderDamage = (totalDefenderPower * defenderBonus) /
        Math.max(1, totalAttackerPower * (1 - BATTLE_CONFIG.DEFENSE_RATE));

      // 随机波动 ±20%
      const attackerFinalDamage = Math.floor(attackerDamage * (0.8 + Math.random() * 0.4));
      const defenderFinalDamage = Math.floor(defenderDamage * (0.8 + Math.random() * 0.4));

      attackerLoss += Math.min(attackerFinalDamage, defenderCount - defenderLoss);
      defenderLoss += Math.min(defenderFinalDamage, attackerCount - attackerLoss);

      if (isCrit) isCritical = true;
    }

    // 计算奖励
    const winner = attackerLoss < defenderLoss ? 'attacker' : defenderLoss < attackerLoss ? 'defender' : 'draw';
    const isWin = winner === 'attacker';

    const expReward = isWin ? Math.floor(BATTLE_CONFIG.REWARD_EXP_BASE * (1 + rounds / BATTLE_CONFIG.MAX_ROUNDS)) : 0;
    const goldReward = isWin ? Math.floor(BATTLE_CONFIG.REWARD_GOLD_BASE * (1 + rounds / BATTLE_CONFIG.MAX_ROUNDS)) : 0;

    return {
      winner,
      attackerLoss: Math.min(attackerLoss, attackerCount),
      defenderLoss: Math.min(defenderLoss, defenderCount),
      attackerRemaining: Math.max(0, attackerCount - attackerLoss),
      defenderRemaining: Math.max(0, defenderCount - defenderLoss),
      rounds,
      isCritical,
      expReward,
      goldReward,
    };
  }

  // ============ 战斗记录 ============

  /**
   * 记录战斗结果
   * 使用正确的 battles 表结构:
   * id, attacker_address, defender_address, battle_type, result, report, created_at
   */
  async recordBattle(walletAddress: string, battle: {
    battleType: string;
    opponentAddress?: string;
    opponentName?: string;
    result: 'win' | 'lose' | 'draw';
    rounds: number;
    attackerPower: number;
    defenderPower: number;
    attackerLoss: number;
    defenderLoss: number;
    expReward: number;
    goldReward: number;
    report?: string;
  }): Promise<ServiceResult<{ battleId: number }>> {
    try {
      const now = new Date().toISOString();

      const result = await this.db.prepare(`
        INSERT INTO battles (
          attacker_address, defender_address, battle_type, result, report, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        walletAddress,
        battle.opponentAddress || null,
        battle.battleType,
        battle.result,
        battle.report || null,
        now
      ).run();

      return { ok: true, data: { battleId: result.meta.last_row_id } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  }

  /**
   * 获取战斗记录列表
   * 修正: 使用 attacker_address 或 defender_address 查询
   */
  async getBattleRecords(walletAddress: string, options: {
    battleType?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { battleType, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    // 查询用户参与的战斗 (作为攻击方或防守方)
    let query = 'SELECT * FROM battles WHERE attacker_address = ? OR defender_address = ?';
    const params: any[] = [walletAddress, walletAddress];

    if (battleType) {
      query += ' AND battle_type = ?';
      params.push(battleType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const result = await this.db.prepare(query).bind(...params).all();

    const totalCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battles WHERE attacker_address = ? OR defender_address = ?
    `).bind(walletAddress, walletAddress).first();

    return {
      records: (result.results || []).map(this.formatBattleRecord),
      total: (totalCount as any).count,
      page,
      pageSize,
    };
  }

  /**
   * 获取单场战斗详情
   */
  async getBattleById(walletAddress: string, battleId: number) {
    // 只允许查看自己参与的战斗
    const result: any = await this.db.prepare(`
      SELECT * FROM battles WHERE id = ? AND (attacker_address = ? OR defender_address = ?)
    `).bind(battleId, walletAddress, walletAddress).first();

    if (!result) return null;

    return this.formatBattleRecord(result);
  }

  /**
   * 获取今日战斗统计
   */
  async getTodayBattleStats(walletAddress: string) {
    const today = new Date().toISOString().split('T')[0];

    const stats: any = await this.db.prepare(`
      SELECT
        COUNT(*) as total_battles,
        SUM(CASE WHEN result = 'win' AND attacker_address = ? THEN 1 ELSE 0 END) as win_count,
        SUM(CASE WHEN result = 'lose' AND attacker_address = ? THEN 1 ELSE 0 END) as lose_count,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draw_count
      FROM battles
      WHERE (attacker_address = ? OR defender_address = ?) AND DATE(created_at) = ?
    `).bind(walletAddress, walletAddress, walletAddress, walletAddress, today).first();

    return {
      totalBattles: stats?.total_battles || 0,
      winCount: stats?.win_count || 0,
      loseCount: stats?.lose_count || 0,
      drawCount: stats?.draw_count || 0,
      totalExp: 0,
      totalGold: 0,
      winRate: stats?.total_battles > 0 ?
        Math.round(((stats?.win_count || 0) / stats?.total_battles) * 100) : 0,
    };
  }

  // ============ 战斗查询 ============

  /**
   * 检查目标位置状态
   */
  async checkTargetState(walletAddress: string, cityId: number, targetPos: number) {
    // 检查是否是自己的城市
    const myCity: any = await this.db.prepare(`
      SELECT position FROM cities WHERE wallet_address = ? AND id = ?
    `).bind(walletAddress, cityId).first();

    if (myCity && myCity.position === targetPos) {
      return { valid: false, error: 7, message: '不能攻击自己的城市' };
    }

    // 检查位置类型
    const target: any = await this.db.prepare(`
      SELECT * FROM cities WHERE position = ?
    `).bind(targetPos).first();

    if (target) {
      // 玩家城市
      return { valid: true, type: 'player', owner: target.wallet_address };
    }

    // 检查 NPC
    const npc: any = await this.db.prepare(`
      SELECT * FROM npc_floors WHERE position = ?
    `).bind(targetPos).first();

    if (npc) {
      return { valid: true, type: 'npc', level: npc.difficulty };
    }

    // 空地
    return { valid: true, type: 'empty' };
  }

  /**
   * 检查攻击次数限制
   */
  async checkAttackLimit(walletAddress: string, targetPos: number) {
    const today = new Date().toISOString().split('T')[0];

    // 检查当日攻击同一人次数 (使用 attacker_address)
    const sameTargetCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battles
      WHERE attacker_address = ?
        AND defender_address IS NOT NULL
        AND DATE(created_at) = ?
    `).bind(walletAddress, today).first();

    if ((sameTargetCount as any).count >= 2) {
      return { valid: false, error: 30131, message: '同一天攻击同一个玩家不能超过2次' };
    }

    // 检查累计攻击低级别玩家次数
    const lowLevelCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battles
      WHERE attacker_address = ?
        AND result = 'win'
        AND DATE(created_at) = ?
    `).bind(walletAddress, today).first();

    if ((lowLevelCount as any).count >= 5) {
      return { valid: false, error: 30132, message: '同一天累计攻击低级别玩家不能超过5次' };
    }

    return { valid: true };
  }

  // ============ 格式化 ============

  private formatBattleRecord(record: any) {
    return {
      id: record.id,
      attackerAddress: record.attacker_address,
      defenderAddress: record.defender_address,
      battleType: record.battle_type,
      result: record.result,
      report: record.report,
      createdAt: record.created_at,
    };
  }
}

export const fightService = {
  create(db: D1Database) {
    return new FightService(db);
  },

  // 静态方法
  calculateBattle(params: any) {
    const service = new FightService(null as any);
    return service.calculateBattle(params);
  },

  async recordBattle(db: D1Database, walletAddress: string, battle: any) {
    const service = new FightService(db);
    return service.recordBattle(walletAddress, battle);
  },

  async getBattleRecords(db: D1Database, walletAddress: string, options?: any) {
    const service = new FightService(db);
    return service.getBattleRecords(walletAddress, options);
  },

  async getBattleById(db: D1Database, walletAddress: string, battleId: number) {
    const service = new FightService(db);
    return service.getBattleById(walletAddress, battleId);
  },

  async getTodayBattleStats(db: D1Database, walletAddress: string) {
    const service = new FightService(db);
    return service.getTodayBattleStats(walletAddress);
  },

  async checkTargetState(db: D1Database, walletAddress: string, cityId: number, targetPos: number) {
    const service = new FightService(db);
    return service.checkTargetState(walletAddress, cityId, targetPos);
  },

  async checkAttackLimit(db: D1Database, walletAddress: string, targetPos: number) {
    const service = new FightService(db);
    return service.checkAttackLimit(walletAddress, targetPos);
  },

  async getProsperityLevel(db: D1Database, walletAddress: string) {
    const service = new FightService(db);
    return service.getProsperityLevel(walletAddress);
  },

  async checkAttackCityLimit(db: D1Database, walletAddress: string, targetPos: number, targetLevel?: number) {
    const service = new FightService(db);
    return service.checkAttackCityLimit(walletAddress, targetPos, targetLevel);
  },
};

export default fightService;