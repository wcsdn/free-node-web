/**
 * Fight Service - 战斗服务层
 * 从 jx/BLL/Fight.cs 和 jx/BLL/FightSummaryCode.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { BattleRecord, ServiceResult } from '../types/models';
import { getUnitTypeBonus } from '../utils/battle-engine';
import battleLimitsConfig from '../config/battle_limits.json';
import { BATTLE_CONFIG as GAME_BATTLE_CONFIG } from '../config/game-config';

// 战斗限制配置 (从 battle_limits.json 加载)
export const BATTLE_LIMITS = {
  ATTACK_SAME_CITY_MAX: battleLimitsConfig.ATTACK_SAME_CITY_MAX || 2,
  ATTACK_LOW_LEVEL_MAX: battleLimitsConfig.ATTACK_LOW_LEVEL_MAX || 5,
  DEF_CITY_MAX: battleLimitsConfig.DEF_CITY_MAX || 5,
  LEVEL_XIANLING: battleLimitsConfig.LEVEL_XIANLING || 8,
  RESET_HOURS: battleLimitsConfig.RESET_HOURS || 24,
};

// 繁荣度等级阈值数组 (参考 jx/BLL/CityInterior.cs::ProsperityToLevel)
const PROSPERITY_LEVEL_THRESHOLDS = [
  150, 350, 600, 900, 1300, 1800, 2500, 3500, 4800, 6500,
  8800, 11900, 16200, 22000, 29800, 40400, 54700, 74000, 100000
];

// InitRestrictFight 字典 (参考 jx/BLL/Fight.cs::InitRestrictFight)
// 内存中的攻击限制字典，24小时重置一次
interface RestrictFightInfo {
  oldTime: string;                      // 上次战斗计数时间 (ISO string)
  aimCityFight: Map<number, number>;    // 攻击指定城市的次数 (position -> count)
  cityCount: number;                    // 累计攻击低级城市的次数
}
const RestrictFightDict = new Map<string, RestrictFightInfo>();

/**
 * 初始化用户的攻击限制记录 (参考 jx/BLL/Fight.cs::InitRestrictFight)
 * 每次攻击前调用，自动清除超过24小时的记录
 */
function InitRestrictFight(userName: string): void {
  const RESET_HOURS = BATTLE_LIMITS.RESET_HOURS;

  if (!RestrictFightDict.has(userName)) {
    RestrictFightDict.set(userName, {
      oldTime: new Date().toISOString(),
      aimCityFight: new Map(),
      cityCount: 0,
    });
  }

  const record = RestrictFightDict.get(userName)!;
  const lastTime = new Date(record.oldTime).getTime();
  const now = Date.now();
  const elapsedHours = (now - lastTime) / (1000 * 60 * 60);

  if (elapsedHours >= RESET_HOURS) {
    // 重置记录
    record.oldTime = new Date().toISOString();
    record.aimCityFight.clear();
    record.cityCount = 0;
  }
}

/**
 * 获取攻击指定城市的次数 (参考 jx/BLL/Fight.cs::GetFightCityNum flag=1)
 */
function GetFightCityNum(userName: string, cityPos: number): number {
  InitRestrictFight(userName);
  const record = RestrictFightDict.get(userName)!;
  return record.aimCityFight.get(cityPos) || 0;
}

/**
 * 累计攻击低级城市的次数 (参考 jx/BLL/Fight.cs::GetFightCityNum flag=0)
 */
function GetLowLevelAttackCount(userName: string): number {
  InitRestrictFight(userName);
  const record = RestrictFightDict.get(userName)!;
  return record.cityCount;
}

/**
 * 记录攻击指定城市 (参考 jx/BLL/Fight.cs::AddFightCityNum)
 * @returns 0=正常, 1=攻击同一城市超过上限, 2=累计攻击低级超过上限
 */
function AddFightCityNum(userName: string, cityPos: number, isLowLevel: boolean): number {
  InitRestrictFight(userName);
  const record = RestrictFightDict.get(userName)!;

  // 攻击指定城市次数+1
  const currentCount = record.aimCityFight.get(cityPos) || 0;
  record.aimCityFight.set(cityPos, currentCount + 1);

  // 如果是低级城市，累计计数+1
  if (isLowLevel) {
    record.cityCount++;
  }

  return 0;
}

/**
 * 根据繁荣度计算繁荣度等级 (参考 jx/BLL/CityInterior.cs::ProsperityToLevel)
 * 阈值数组: [150, 350, 600, 900, 1300, 1800, 2500, 3500, 4800, 6500, ...]
 */
export function getProsperityLevel(prosperity: number): number {
  let level = 1;
  for (let i = 0; i < PROSPERITY_LEVEL_THRESHOLDS.length; i++) {
    if (PROSPERITY_LEVEL_THRESHOLDS[i] > prosperity) {
      level = i + 1;
      break;
    }
  }
  return level;
}

/**
 * 计算玩家总战力 - 基于繁荣度等级体系 (参考 jx/BLL/Fight.cs)
 * 战力 = 繁荣度等级 * 100 + 武将基础属性总和
 */
export function calculateFightPowerByProsperity(
  prosperity: number,
  heroes: Array<{ attack?: number; defense?: number; level?: number }>
): number {
  // 繁荣度等级
  const prosperityLv = getProsperityLevel(prosperity);

  // 武将属性加成
  let heroPower = 0;
  for (const hero of heroes) {
    heroPower += (hero.attack || 0) * 2 + (hero.defense || 0) * 1.5 + (hero.level || 1) * 10;
  }

  // 战力 = 繁荣度等级 * 100 + 武将总战力
  return Math.floor(prosperityLv * 100 + heroPower);
}

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
  MAX_DAILY_BATTLES: GAME_BATTLE_CONFIG.MAX_DAILY_BATTLES,     // 每日最大战斗次数 (从 game-config.ts 读取)
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

/**
 * 战报城市信息 (对应 C# FightSummaryCityInfo)
 * 编码格式: ++Begin++$CityList#Flag$value#UserName$value#CityName$value#CityPos$value#Power$value#PowerBattleOver$value#++End++$CityList#
 */
export interface BattleSummaryCityInfo {
  Flag: number;          // 1=攻击方, 2=攻击援助, 3=防守方, 4=防守援助
  UserName: string;     // 用户名
  CityName: string;     // 城市名
  CityPos: number;      // 城市位置
  Power: number;        // 战前实力
  PowerBattleOver: number; // 战后实力
}

/**
 * 战报抢夺资源信息 (对应 C# FightSummaryResInfo)
 * 编码格式: ++Begin++$Res#CityName$value#Men$value#Money$value#Food$value#[ItemArray]++End++$Res#
 */
export interface BattleSummaryResInfo {
  CityName: string;
  Men: number;
  Money: number;
  Food: number;
  ItemArray: BattleSummaryItemInfo[];
}

/**
 * 战报抢夺道具信息 (对应 C# FightSummaryItemInfo)
 */
export interface BattleSummaryItemInfo {
  ItemIndex: number;
  ItemPath: string;
  IsFill: number;
  ItemType: number;
  ItemName: string;
}

/**
 * 战报技能效果信息 (对应 C# FightSummarySkillEffectInfo)
 * 编码格式: CityPos, AttackHeroID, AttackHeroName, AttackQuality, AimType, SkillName,
 *           DefenceHeroID, DefenceHeroName, DefenceQuality, PropertyType, PropertyChange,
 *           AttackWuXing, DefenceWuXing, UsCrushBlow, OtherDodge, SkillLevel
 */
export interface BattleSummarySkillEffectInfo {
  CityPos: number;
  AttackHeroID: number;
  AttackHeroName: string;
  AttackQuality: number;
  AimType: number;
  SkillName: string;
  DefenceHeroID: number;
  DefenceHeroName: string;
  DefenceQuality: number;
  PropertyType: number;
  PropertyChange: number;
  AttackWuXing: number;
  DefenceWuXing: number;
  UsCrushBlow: number;
  OtherDodge: number;
  SkillLevel: number;
}

/**
 * 战报武将信息 (对应 C# FightSummaryHeroInfo)
 * 编码格式: CityPos, HeroID, HeroName, ChildrenCount, ChildrenLoss, TrainingCount,
 *           TrainingLoss, GainExp, State, HeroStatefFlag, HeroUpdateFlag, Quality
 */
export interface BattleSummaryHeroInfo {
  CityPos: number;
  HeroID: number;
  HeroName: string;
  ChildrenCount: number;
  ChildrenLoss: number;
  TrainingCount: number;
  TrainingLoss: number;
  GainExp: number;
  State: number;
  HeroStatefFlag: number;
  HeroUpdateFlag: number;
  Quality: number;
}

/**
 * 战报城防统计信息 (对应 C# FightSummaryDefenceInfo)
 */
export interface BattleSummaryDefenceInfo {
  StaticIndex: number;
  DefenceCount: number;
  DefenceLoss: number;
}

/**
 * 内政建筑降级信息 (对应 C# LostLevelBuildInfo)
 */
export interface LostLevelBuildInfo {
  Type: number;
  EndLevel: number;
  Index: number;
  CurrentLevel: number;
}

/**
 * 帮派资源 KeyValue (对应 C# KeyValueInfo)
 */
export interface KeyValueInfo {
  Type: number;
  Key: number;
  Value: number;
  Name: string;
}

/**
 * 帮派附加资源信息 (对应 C# OrgAppendInfo)
 */
export interface OrgAppendInfo {
  CityPos: number;
  OrgResList: KeyValueInfo[];
}

/**
 * 战报服务端信息 (对应 C# FightSummaryServerInfo)
 */
export interface BattleSummaryServerInfo {
  CityList: BattleSummaryCityInfo[];
  Res: BattleSummaryResInfo | null;
  SkillEffectList: BattleSummarySkillEffectInfo[];
  HeroList: BattleSummaryHeroInfo[];
  StatDefenceBuildList: BattleSummaryDefenceInfo[];
  CityBuilds: LostLevelBuildInfo[];
  OrgResList: OrgAppendInfo[];
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

// 向后兼容别名
export type BattleSummaryRes = BattleSummaryResInfo;
export type BattleSummaryHero = BattleSummaryHeroInfo;
export type BattleSummarySkillEffect = BattleSummarySkillEffectInfo;

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

  // 编码城防统计
  str += encodeBattleSummaryDefence(summary.StatDefenceBuildList);

  // 编码内政建筑降级
  str += encodeBattleSummaryCityBuild(summary.CityBuilds);

  // 编码帮派资源
  str += encodeBattleSummaryOrgRes(summary.OrgResList);

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
      Res: null,
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
          } else if (value === 'StatDefenceBuildList') {
            summary.StatDefenceBuildList = decodeBattleSummaryDefenceBuild(strArray, num);
          } else if (value === 'CityBuild') {
            summary.CityBuilds = decodeBattleSummaryCityBuild(strArray, num);
          } else if (value === 'OrgResList') {
            summary.OrgResList = decodeBattleSummaryOrgResList(strArray, num);
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

/**
 * 编码城市列表
 * 参考 jx/BLL/FightSummaryCode.cs::CodingFightSummaryCity
 * 格式: ++Begin++$CityList#Flag$value#UserName$value#CityName$value#CityPos$value#Power$value#PowerBattleOver$value#++End++$CityList#
 * 注意: C# 是扁平结构,没有内层 City 包装
 */
function encodeBattleSummaryCity(cityList: BattleSummaryCityInfo[]): string {
  if (!cityList || cityList.length === 0) return '';

  let str = '';
  for (const city of cityList) {
    str += writeBeginStr('CityList');
    str += writeAppointStrByInt('Flag', city.Flag);
    str += writeAppointStrByStr('UserName', city.UserName);
    str += writeAppointStrByStr('CityName', city.CityName);
    str += writeAppointStrByInt('CityPos', city.CityPos);
    str += writeAppointStrByFloat('Power', city.Power);
    str += writeAppointStrByFloat('PowerBattleOver', city.PowerBattleOver);
    str += writeEndStr('CityList');
  }
  return str;
}

/**
 * 编码资源信息
 * 参考 jx/BLL/FightSummaryCode.cs::CodingFightSummaryRes
 * 格式: ++Begin++$Res#CityName$value#Men$value#Money$value#Food$value#[ItemArray]++End++$Res#
 */
function encodeBattleSummaryRes(res: BattleSummaryResInfo | null | undefined): string {
  if (!res) return '';

  let str = writeBeginStr('Res');
  str += writeAppointStrByStr('CityName', res.CityName);
  str += writeAppointStrByInt('Men', res.Men);
  str += writeAppointStrByInt('Money', res.Money);
  str += writeAppointStrByInt('Food', res.Food);
  str += encodeBattleSummaryItem(res.ItemArray);
  str += writeEndStr('Res');
  return str;
}

/**
 * 编码道具列表
 * 参考 jx/BLL/FightSummaryCode.cs::CodingFightSummaryItem
 */
function encodeBattleSummaryItem(itemList: BattleSummaryItemInfo[]): string {
  if (!itemList || itemList.length === 0) return '';

  let str = '';
  for (const item of itemList) {
    str += writeBeginStr('ItemArray');
    str += writeAppointStrByInt('ItemIndex', item.ItemIndex);
    str += writeAppointStrByStr('ItemPath', item.ItemPath);
    str += writeAppointStrByInt('IsFill', item.IsFill);
    str += writeAppointStrByInt('ItemType', item.ItemType);
    str += writeAppointStrByStr('ItemName', item.ItemName);
    str += writeEndStr('ItemArray');
  }
  return str;
}

/**
 * 编码技能效果列表
 * 参考 jx/BLL/FightSummaryCode.cs::CodingFightSummarySkillEffect
 * 17个字段: CityPos, AttackHeroID, AttackHeroName, AttackQuality, AimType, SkillName,
 *           DefenceHeroID, DefenceHeroName, DefenceQuality, PropertyType, PropertyChange,
 *           AttackWuXing, DefenceWuXing, UsCrushBlow, OtherDodge, SkillLevel
 */
function encodeBattleSummarySkillEffect(effects: BattleSummarySkillEffectInfo[]): string {
  if (!effects || effects.length === 0) return '';

  let str = '';
  for (const effect of effects) {
    str += writeBeginStr('SkillEffectList');
    str += writeAppointStrByInt('CityPos', effect.CityPos);
    str += writeAppointStrByInt('AttackHeroID', effect.AttackHeroID);
    str += writeAppointStrByStr('AttackHeroName', effect.AttackHeroName);
    str += writeAppointStrByInt('AttackQuality', effect.AttackQuality);
    str += writeAppointStrByInt('AimType', effect.AimType);
    str += writeAppointStrByStr('SkillName', effect.SkillName);
    str += writeAppointStrByInt('DefenceHeroID', effect.DefenceHeroID);
    str += writeAppointStrByStr('DefenceHeroName', effect.DefenceHeroName);
    str += writeAppointStrByInt('DefenceQuality', effect.DefenceQuality);
    str += writeAppointStrByInt('PropertyType', effect.PropertyType);
    str += writeAppointStrByInt('PropertyChange', effect.PropertyChange);
    str += writeAppointStrByInt('AttackWuXing', effect.AttackWuXing);
    str += writeAppointStrByInt('DefenceWuXing', effect.DefenceWuXing);
    str += writeAppointStrByInt('UsCrushBlow', effect.UsCrushBlow);
    str += writeAppointStrByInt('OtherDodge', effect.OtherDodge);
    str += writeAppointStrByInt('SkillLevel', effect.SkillLevel);
    str += writeEndStr('SkillEffectList');
  }
  return str;
}

/**
 * 编码武将列表
 * 参考 jx/BLL/FightSummaryCode.cs::CodingFightSummaryHero
 * 13个字段: CityPos, HeroID, HeroName, ChildrenCount, ChildrenLoss, TrainingCount,
 *           TrainingLoss, GainExp, State, HeroStatefFlag, HeroUpdateFlag, Quality
 */
function encodeBattleSummaryHero(heroes: BattleSummaryHeroInfo[]): string {
  if (!heroes || heroes.length === 0) return '';

  let str = '';
  for (const hero of heroes) {
    str += writeBeginStr('HeroList');
    str += writeAppointStrByInt('CityPos', hero.CityPos);
    str += writeAppointStrByInt('HeroID', hero.HeroID);
    str += writeAppointStrByStr('HeroName', hero.HeroName);
    str += writeAppointStrByInt('ChildrenCount', hero.ChildrenCount);
    str += writeAppointStrByInt('ChildrenLoss', hero.ChildrenLoss);
    str += writeAppointStrByInt('TrainingCount', hero.TrainingCount);
    str += writeAppointStrByInt('TrainingLoss', hero.TrainingLoss);
    str += writeAppointStrByInt('GainExp', hero.GainExp);
    str += writeAppointStrByInt('State', hero.State);
    str += writeAppointStrByInt('HeroStatefFlag', hero.HeroStatefFlag);
    str += writeAppointStrByInt('HeroUpdateFlag', hero.HeroUpdateFlag);
    str += writeAppointStrByInt('Quality', hero.Quality);
    str += writeEndStr('HeroList');
  }
  return str;
}

/**
 * 编码城防统计信息
 * 参考 jx/BLL/FightSummaryCode.cs::CodingFightSummaryDefence
 * 3个字段: StaticIndex, DefenceCount, DefenceLoss
 */
function encodeBattleSummaryDefence(defenceList: BattleSummaryDefenceInfo[]): string {
  if (!defenceList || defenceList.length === 0) return '';

  let str = '';
  for (const defence of defenceList) {
    str += writeBeginStr('StatDefenceBuildList');
    str += writeAppointStrByInt('StaticIndex', defence.StaticIndex);
    str += writeAppointStrByInt('DefenceCount', defence.DefenceCount);
    str += writeAppointStrByInt('DefenceLoss', defence.DefenceLoss);
    str += writeEndStr('StatDefenceBuildList');
  }
  return str;
}

/**
 * 编码内政建筑降级信息
 * 参考 jx/BLL/FightSummaryCode.cs::CodingFightSummaryCityBuild
 * 4个字段: Type, EndLevel, Index, CurrentLevel
 */
function encodeBattleSummaryCityBuild(buildList: LostLevelBuildInfo[]): string {
  if (!buildList || buildList.length === 0) return '';

  let str = '';
  for (const build of buildList) {
    str += writeBeginStr('CityBuild');
    str += writeAppointStrByInt('Type', build.Type);
    str += writeAppointStrByInt('EndLevel', build.EndLevel);
    str += writeAppointStrByInt('Index', build.Index);
    str += writeAppointStrByInt('CurrentLevel', build.CurrentLevel);
    str += writeEndStr('CityBuild');
  }
  return str;
}

/**
 * 编码帮派资源列表
 * 参考 jx/BLL/FightSummaryCode.cs::CodingFightSummaryOrgRes
 */
function encodeBattleSummaryOrgRes(orgResList: OrgAppendInfo[]): string {
  if (!orgResList || orgResList.length === 0) return '';

  let str = '';
  for (const orgRes of orgResList) {
    str += writeBeginStr('OrgResList');
    str += writeAppointStrByInt('CityPos', orgRes.CityPos);
    str += encodeBattleSummaryKeyValueList(orgRes.OrgResList);
    str += writeEndStr('OrgResList');
  }
  return str;
}

/**
 * 编码KeyValue列表
 * 参考 jx/BLL/FightSummaryCode.cs::CodingFightSummaryKeyValueList
 * 4个字段: Type, Key, Value, Name
 */
function encodeBattleSummaryKeyValueList(kvList: KeyValueInfo[]): string {
  if (!kvList || kvList.length === 0) return '';

  let str = '';
  for (const kv of kvList) {
    str += writeBeginStr('OrgResList');
    str += writeAppointStrByInt('Type', kv.Type);
    str += writeAppointStrByInt('Key', kv.Key);
    str += writeAppointStrByInt('Value', kv.Value);
    str += writeAppointStrByStr('Name', kv.Name || '');
    str += writeEndStr('OrgResList');
  }
  return str;
}

// ==================== 内部解码函数 ====================

/**
 * 解码城市列表
 * 参考 jx/BLL/FightSummaryCode.cs::DecodeFightSummaryCity
 */
function decodeBattleSummaryCity(strArray: string[], startIdx: number): BattleSummaryCityInfo[] {
  const cities: BattleSummaryCityInfo[] = [];
  let num = startIdx;
  let maxNum = 0;

  // 跳过 ++Begin++$CityList
  if (strArray[num] === '++Begin++$CityList') {
    num++;
  }

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

    if (kv[0] === '++Begin++' && kv[1] === 'CityList') {
      // 开始新的城市
      num++;
      const city: BattleSummaryCityInfo = {
        Flag: 0,
        UserName: '',
        CityName: '',
        CityPos: 0,
        Power: 0,
        PowerBattleOver: 0,
      };

      // 读取城市字段直到 ++End++$CityList
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

        if (fieldKv[0] === '++End++' && fieldKv[1] === 'CityList') {
          num++;
          break;
        }

        switch (fieldKv[0]) {
          case 'Flag':
            city.Flag = parseInt(fieldKv[1]) || 0;
            break;
          case 'UserName':
            city.UserName = fieldKv[1];
            break;
          case 'CityName':
            city.CityName = fieldKv[1];
            break;
          case 'CityPos':
            city.CityPos = parseInt(fieldKv[1]) || 0;
            break;
          case 'Power':
            city.Power = parseFloat(fieldKv[1]) || 0;
            break;
          case 'PowerBattleOver':
            city.PowerBattleOver = parseFloat(fieldKv[1]) || 0;
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

/**
 * 解码资源信息
 * 参考 jx/BLL/FightSummaryCode.cs::DecodeFightSummaryRes
 */
function decodeBattleSummaryRes(strArray: string[], startIdx: number): BattleSummaryResInfo | null {
  let num = startIdx;
  let maxNum = 0;
  let res: BattleSummaryResInfo | null = null;

  // 跳过 ++Begin++$Res
  if (strArray[num] === '++Begin++$Res') {
    num++;
  }

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

    if (kv[0] === '++End++' && kv[1] === 'Res') {
      num++;
      break;
    }

    if (kv[0] === '++Begin++') {
      if (kv[1] === 'ItemArray') {
        // 解码道具数组
        if (!res) res = { CityName: '', Men: 0, Money: 0, Food: 0, ItemArray: [] };
        res.ItemArray = decodeBattleSummaryItemArray(strArray, num);
      }
      num++;
      continue;
    }

    if (!res) {
      res = { CityName: '', Men: 0, Money: 0, Food: 0, ItemArray: [] };
    }

    switch (kv[0]) {
      case 'CityName':
        res.CityName = kv[1];
        break;
      case 'Men':
        res.Men = parseInt(kv[1]) || 0;
        break;
      case 'Money':
        res.Money = parseInt(kv[1]) || 0;
        break;
      case 'Food':
        res.Food = parseInt(kv[1]) || 0;
        break;
    }
    num++;
  }

  return res;
}

/**
 * 解码道具数组
 * 参考 jx/BLL/FightSummaryCode.cs::DecodeFightSummaryItemArray
 */
function decodeBattleSummaryItemArray(strArray: string[], startIdx: number): BattleSummaryItemInfo[] {
  const items: BattleSummaryItemInfo[] = [];
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

    if (kv[0] === '++End++' && kv[1] === 'ItemArray') {
      num++;
      break;
    }

    if (kv[0] === '++Begin++' && kv[1] === 'ItemArray') {
      num++;
      const item: BattleSummaryItemInfo = {
        ItemIndex: 0,
        ItemPath: '',
        IsFill: 0,
        ItemType: 0,
        ItemName: '',
      };

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

        if (fieldKv[0] === '++End++' && fieldKv[1] === 'ItemArray') {
          num++;
          break;
        }

        switch (fieldKv[0]) {
          case 'ItemIndex':
            item.ItemIndex = parseInt(fieldKv[1]) || 0;
            break;
          case 'ItemPath':
            item.ItemPath = fieldKv[1];
            break;
          case 'IsFill':
            item.IsFill = parseInt(fieldKv[1]) || 0;
            break;
          case 'ItemType':
            item.ItemType = parseInt(fieldKv[1]) || 0;
            break;
          case 'ItemName':
            item.ItemName = fieldKv[1];
            break;
        }
        num++;
      }

      items.push(item);
      continue;
    }

    num++;
  }

  return items;
}

/**
 * 解码技能效果列表
 * 参考 jx/BLL/FightSummaryCode.cs::DecodeFightSummarySkillEffect
 * 17个字段
 */
function decodeBattleSummarySkillEffect(strArray: string[], startIdx: number): BattleSummarySkillEffectInfo[] {
  const effects: BattleSummarySkillEffectInfo[] = [];
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

    if (kv[0] === '++Begin++' && kv[1] === 'SkillEffectList') {
      num++;
      const effect: BattleSummarySkillEffectInfo = {
        CityPos: 0,
        AttackHeroID: 0,
        AttackHeroName: '',
        AttackQuality: 0,
        AimType: 0,
        SkillName: '',
        DefenceHeroID: 0,
        DefenceHeroName: '',
        DefenceQuality: 0,
        PropertyType: 0,
        PropertyChange: 0,
        AttackWuXing: 0,
        DefenceWuXing: 0,
        UsCrushBlow: 0,
        OtherDodge: 0,
        SkillLevel: 0,
      };

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

        if (fieldKv[0] === '++End++' && fieldKv[1] === 'SkillEffectList') {
          num++;
          break;
        }

        switch (fieldKv[0]) {
          case 'CityPos':
            effect.CityPos = parseInt(fieldKv[1]) || 0;
            break;
          case 'AttackHeroID':
            effect.AttackHeroID = parseInt(fieldKv[1]) || 0;
            break;
          case 'AttackHeroName':
            effect.AttackHeroName = fieldKv[1];
            break;
          case 'AttackQuality':
            effect.AttackQuality = parseInt(fieldKv[1]) || 0;
            break;
          case 'AimType':
            effect.AimType = parseInt(fieldKv[1]) || 0;
            break;
          case 'SkillName':
            effect.SkillName = fieldKv[1];
            break;
          case 'DefenceHeroID':
            effect.DefenceHeroID = parseInt(fieldKv[1]) || 0;
            break;
          case 'DefenceHeroName':
            effect.DefenceHeroName = fieldKv[1];
            break;
          case 'DefenceQuality':
            effect.DefenceQuality = parseInt(fieldKv[1]) || 0;
            break;
          case 'PropertyType':
            effect.PropertyType = parseInt(fieldKv[1]) || 0;
            break;
          case 'PropertyChange':
            effect.PropertyChange = parseInt(fieldKv[1]) || 0;
            break;
          case 'AttackWuXing':
            effect.AttackWuXing = parseInt(fieldKv[1]) || 0;
            break;
          case 'DefenceWuXing':
            effect.DefenceWuXing = parseInt(fieldKv[1]) || 0;
            break;
          case 'UsCrushBlow':
            effect.UsCrushBlow = parseInt(fieldKv[1]) || 0;
            break;
          case 'OtherDodge':
            effect.OtherDodge = parseInt(fieldKv[1]) || 0;
            break;
          case 'SkillLevel':
            effect.SkillLevel = parseInt(fieldKv[1]) || 0;
            break;
        }
        num++;
      }

      effects.push(effect);
      continue;
    }

    num++;
  }

  return effects;
}

/**
 * 解码武将列表
 * 参考 jx/BLL/FightSummaryCode.cs::DecodeFightSummaryHero
 * 13个字段
 */
function decodeBattleSummaryHero(strArray: string[], startIdx: number): BattleSummaryHeroInfo[] {
  const heroes: BattleSummaryHeroInfo[] = [];
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

    if (kv[0] === '++Begin++' && kv[1] === 'HeroList') {
      num++;
      const hero: BattleSummaryHeroInfo = {
        CityPos: 0,
        HeroID: 0,
        HeroName: '',
        ChildrenCount: 0,
        ChildrenLoss: 0,
        TrainingCount: 0,
        TrainingLoss: 0,
        GainExp: 0,
        State: 0,
        HeroStatefFlag: 0,
        HeroUpdateFlag: 0,
        Quality: 0,
      };

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

        if (fieldKv[0] === '++End++' && fieldKv[1] === 'HeroList') {
          num++;
          break;
        }

        switch (fieldKv[0]) {
          case 'CityPos':
            hero.CityPos = parseInt(fieldKv[1]) || 0;
            break;
          case 'HeroID':
            hero.HeroID = parseInt(fieldKv[1]) || 0;
            break;
          case 'HeroName':
            hero.HeroName = fieldKv[1];
            break;
          case 'ChildrenCount':
            hero.ChildrenCount = parseInt(fieldKv[1]) || 0;
            break;
          case 'ChildrenLoss':
            hero.ChildrenLoss = parseInt(fieldKv[1]) || 0;
            break;
          case 'TrainingCount':
            hero.TrainingCount = parseInt(fieldKv[1]) || 0;
            break;
          case 'TrainingLoss':
            hero.TrainingLoss = parseInt(fieldKv[1]) || 0;
            break;
          case 'GainExp':
            hero.GainExp = parseInt(fieldKv[1]) || 0;
            break;
          case 'State':
            hero.State = parseInt(fieldKv[1]) || 0;
            break;
          case 'HeroStatefFlag':
            hero.HeroStatefFlag = parseInt(fieldKv[1]) || 0;
            break;
          case 'HeroUpdateFlag':
            hero.HeroUpdateFlag = parseInt(fieldKv[1]) || 0;
            break;
          case 'Quality':
            hero.Quality = parseInt(fieldKv[1]) || 0;
            break;
        }
        num++;
      }

      heroes.push(hero);
      continue;
    }

    num++;
  }

  return heroes;
}

/**
 * 解码城防统计信息
 * 参考 jx/BLL/FightSummaryCode.cs::DecodeFightSummaryDefenceBuild
 */
function decodeBattleSummaryDefenceBuild(strArray: string[], startIdx: number): BattleSummaryDefenceInfo[] {
  const defenceList: BattleSummaryDefenceInfo[] = [];
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

    if (kv[0] === '++Begin++' && kv[1] === 'StatDefenceBuildList') {
      num++;
      const defence: BattleSummaryDefenceInfo = {
        StaticIndex: 0,
        DefenceCount: 0,
        DefenceLoss: 0,
      };

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

        if (fieldKv[0] === '++End++' && fieldKv[1] === 'StatDefenceBuildList') {
          num++;
          break;
        }

        switch (fieldKv[0]) {
          case 'StaticIndex':
            defence.StaticIndex = parseInt(fieldKv[1]) || 0;
            break;
          case 'DefenceCount':
            defence.DefenceCount = parseInt(fieldKv[1]) || 0;
            break;
          case 'DefenceLoss':
            defence.DefenceLoss = parseInt(fieldKv[1]) || 0;
            break;
        }
        num++;
      }

      defenceList.push(defence);
      continue;
    }

    num++;
  }

  return defenceList;
}

/**
 * 解码内政建筑降级信息
 * 参考 jx/BLL/FightSummaryCode.cs::DecodeFightSummaryCityBuild
 */
function decodeBattleSummaryCityBuild(strArray: string[], startIdx: number): LostLevelBuildInfo[] {
  const buildList: LostLevelBuildInfo[] = [];
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

    if (kv[0] === '++Begin++' && kv[1] === 'CityBuild') {
      num++;
      const build: LostLevelBuildInfo = {
        Type: 0,
        EndLevel: 0,
        Index: 0,
        CurrentLevel: 0,
      };

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

        if (fieldKv[0] === '++End++' && fieldKv[1] === 'CityBuild') {
          num++;
          break;
        }

        switch (fieldKv[0]) {
          case 'Type':
            build.Type = parseInt(fieldKv[1]) || 0;
            break;
          case 'EndLevel':
            build.EndLevel = parseInt(fieldKv[1]) || 0;
            break;
          case 'Index':
            build.Index = parseInt(fieldKv[1]) || 0;
            break;
          case 'CurrentLevel':
            build.CurrentLevel = parseInt(fieldKv[1]) || 0;
            break;
        }
        num++;
      }

      buildList.push(build);
      continue;
    }

    num++;
  }

  return buildList;
}

/**
 * 解码帮派资源列表
 * 参考 jx/BLL/FightSummaryCode.cs::DecodeFightSummaryOrgResList
 */
function decodeBattleSummaryOrgResList(strArray: string[], startIdx: number): OrgAppendInfo[] {
  const orgResList: OrgAppendInfo[] = [];
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

    if (kv[0] === '++Begin++' && kv[1] === 'OrgResList') {
      num++;
      const orgRes: OrgAppendInfo = {
        CityPos: 0,
        OrgResList: [],
      };

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

        if (fieldKv[0] === '++End++' && fieldKv[1] === 'OrgResList') {
          num++;
          break;
        }

        if (fieldKv[0] === '++Begin++' && fieldKv[1] === 'OrgResList') {
          // 嵌套的 KeyValue 列表
          orgRes.OrgResList = decodeBattleSummaryKeyValue(strArray, num);
          num++;
          continue;
        }

        if (fieldKv[0] === 'CityPos') {
          orgRes.CityPos = parseInt(fieldKv[1]) || 0;
        }
        num++;
      }

      orgResList.push(orgRes);
      continue;
    }

    num++;
  }

  return orgResList;
}

/**
 * 解码KeyValue列表
 * 参考 jx/BLL/FightSummaryCode.cs::DecodeFightSummaryKeyValue
 */
function decodeBattleSummaryKeyValue(strArray: string[], startIdx: number): KeyValueInfo[] {
  const kvList: KeyValueInfo[] = [];
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

    if (kv[0] === '++End++' && kv[1] === 'OrgResList') {
      num++;
      break;
    }

    if (kv[0] === '++Begin++' && kv[1] === 'OrgResList') {
      num++;
      const kvInfo: KeyValueInfo = {
        Type: 0,
        Key: 0,
        Value: 0,
        Name: '',
      };

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

        if (fieldKv[0] === '++End++' && fieldKv[1] === 'OrgResList') {
          num++;
          break;
        }

        switch (fieldKv[0]) {
          case 'Type':
            kvInfo.Type = parseInt(fieldKv[1]) || 0;
            break;
          case 'Key':
            kvInfo.Key = parseInt(fieldKv[1]) || 0;
            break;
          case 'Value':
            kvInfo.Value = parseInt(fieldKv[1]) || 0;
            break;
          case 'Name':
            kvInfo.Name = fieldKv[1];
            break;
        }
        num++;
      }

      kvList.push(kvInfo);
      continue;
    }

    num++;
  }

  return kvList;
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
 * 参考 jx/BLL/Fight.cs
 * 
 * 伤害公式: damage = 攻击力 * 兵种系数 * (1 - 防御力 / (防御力 + 100))
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

  // C# 伤害公式: 攻击力 * 兵种系数 * (1 - 防御力 / (防御力 + 100))
  // 攻击力 = attackerAttack + attackerHeroPower
  const attackPower = attackerAttack + attackerHeroPower;

  // 兵种相克加成: 步>骑>弓>步, 克制方+20%
  let typeBonus = 1.0;
  if (attackerType && defenderType) {
    const counter = UNIT_COUNTER[attackerType];
    if (counter && counter.strong === defenderType) {
      typeBonus = 1.2; // 克制方伤害+20%
    }
  }

  // C# 公式: 攻击力 * 兵种系数 * (1 - 防御力 / (防御力 + 100))
  // 防御减免比例 = 防御力 / (防御力 + 100)
  // 实际造成比例 = 1 - 防御减免比例
  const defenseRatio = defenderDefense / (defenderDefense + 100);
  let baseDamage = attackPower * typeBonus * (1 - defenseRatio);

  // 应用城防减免
  if (defenderBuildingDefense > 0) {
    baseDamage = baseDamage - defenderBuildingDefense * 0.3;
  }

  // 最终伤害，最低为1
  const damage = Math.max(1, Math.floor(baseDamage));

  return {
    damage,
    isCritical: false,
    isMiss: false,
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
 * 计算玩家总战力 - 基于繁荣度等级体系 (参考 jx/BLL/Fight.cs)
 * 战力 = 繁荣度等级 * 100 + 武将总战力
 * @param heroes 武将列表
 * @param prosperity 繁荣度 (可选，如果不提供则只计算武将战力)
 */
function calculatePlayerPower(heroes: any[], prosperity?: number): number {
  if (prosperity !== undefined && prosperity > 0) {
    return calculateFightPowerByProsperity(prosperity, heroes);
  }
  // 纯武将战力
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
   * 使用 jx/BLL/CityInterior.cs::ProsperityToLevel 阈值数组
   * @param walletAddress 玩家钱包地址
   * @returns 繁荣度等级 (1-100+)
   */
  async getProsperityLevel(walletAddress: string): Promise<number> {
    try {
      const city: any = await this.db.prepare(`
        SELECT prosperity FROM cities WHERE wallet_address = ?
      `).bind(walletAddress).first();

      if (!city) {
        return 1;
      }

      return getProsperityLevel(city.prosperity || 0);
    } catch (error) {
      console.error('[FightService] getProsperityLevel error:', error);
      return 1;
    }
  }

  /**
   * 检查攻击次数限制 - 使用 InitRestrictFight 字典 (参考 jx/BLL/Fight.cs)
   * 规则:
   *   - 攻击同一玩家(同一position) ≤ ATTACK_SAME_CITY_MAX (默认2次)
   *   - 累计攻击低级(繁荣度等级 < LEVEL_XIANLING=8) ≤ ATTACK_LOW_LEVEL_MAX (默认5次)
   *   - 字典24小时自动重置
   * @param walletAddress 攻击方钱包地址
   * @param targetPos 目标城市位置
   * @param targetLevel 目标繁荣度等级 (可选)
   * @returns { valid: boolean, error?: number, message?: string }
   */
  async checkAttackCityLimit(
    walletAddress: string,
    targetPos: number,
    targetLevel?: number
  ): Promise<{ valid: boolean; error?: number; message?: string }> {
    try {
      // 1. 检查当日攻击同一城市次数 (ATTACK_SAME_CITY_MAX=2)
      const sameTargetCount = GetFightCityNum(walletAddress, targetPos);
      if (sameTargetCount >= BATTLE_LIMITS.ATTACK_SAME_CITY_MAX) {
        return {
          valid: false,
          error: 30131,
          message: `同一天攻击同一个玩家不能超过${BATTLE_LIMITS.ATTACK_SAME_CITY_MAX}次`
        };
      }

      // 2. 检查累计攻击低级城市次数 (ATTACK_LOW_LEVEL_MAX=5)
      // 低级 = 繁荣度等级 < LEVEL_XIANLING (8)
      if (targetLevel && targetLevel < BATTLE_LIMITS.LEVEL_XIANLING) {
        const lowLevelCount = GetLowLevelAttackCount(walletAddress);
        if (lowLevelCount >= BATTLE_LIMITS.ATTACK_LOW_LEVEL_MAX) {
          return {
            valid: false,
            error: 30132,
            message: `同一天累计攻击低等级玩家不能超过${BATTLE_LIMITS.ATTACK_LOW_LEVEL_MAX}次`
          };
        }
      }

      // 3. 检查防守方被攻击次数限制 (DEF_CITY_MAX=5)
      const today = new Date().toISOString().split('T')[0];
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
   * 修复: 使用 proper date comparison for SQLite
   */
  async getTodayBattleStats(walletAddress: string) {
    // 使用 YYYY-MM-DD 格式用于 SQLite DATE() 比较
    const today = new Date().toISOString().split('T')[0];

    const stats: any = await this.db.prepare(`
      SELECT
        COUNT(*) as total_battles,
        SUM(CASE WHEN result = 'win' AND attacker_address = ? THEN 1 ELSE 0 END) as win_count,
        SUM(CASE WHEN result = 'lose' AND attacker_address = ? THEN 1 ELSE 0 END) as lose_count,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draw_count
      FROM battles
      WHERE (attacker_address = ? OR defender_address = ?) AND DATE(created_at) = DATE(?)
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
    // 使用 BATTLE_LIMITS.ATTACK_SAME_CITY_MAX 替代硬编码值 2
    const sameTargetCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battles
      WHERE attacker_address = ?
        AND defender_address IS NOT NULL
        AND DATE(created_at) = ?
    `).bind(walletAddress, today).first();

    if ((sameTargetCount as any).count >= BATTLE_LIMITS.ATTACK_SAME_CITY_MAX) {
      return { valid: false, error: 30131, message: `同一天攻击同一个玩家不能超过${BATTLE_LIMITS.ATTACK_SAME_CITY_MAX}次` };
    }

    // 检查累计攻击低级别玩家次数
    // 使用 BATTLE_LIMITS.ATTACK_LOW_LEVEL_MAX 替代硬编码值 5
    // 参考 jx/BLL/Fight.cs: if (FightCityNum >= 5) return 30132; (在 GetAttackCity 中，但 GetTargetStateEx 中被注释)
    const lowLevelCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battles
      WHERE attacker_address = ?
        AND result = 'win'
        AND DATE(created_at) = ?
    `).bind(walletAddress, today).first();

    if ((lowLevelCount as any).count >= BATTLE_LIMITS.ATTACK_LOW_LEVEL_MAX) {
      return { valid: false, error: 30132, message: `同一天累计攻击低级别玩家不能超过${BATTLE_LIMITS.ATTACK_LOW_LEVEL_MAX}次` };
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