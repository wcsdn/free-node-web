/**
 * Fight Summary Codec - 战报编解码工具
 * 
 * 用于编码/解码战斗报告数据
 * 格式: Key1$Value1#Key2$Value2#...++End++
 */

// 战报段标识
const SECTION_BEGIN = '++Begin++';
const SECTION_END = '++End++';
const ITEM_SEPARATOR = '#';
const KEY_VALUE_SEPARATOR = '$';

// 战斗结果类型
export type FightResult = 'win' | 'loss' | 'draw';

// 用户类型
export type UserType = 'player' | 'npc';

export interface FightSummaryCityInfo {
  flag: number;          // 1:攻击方 2:攻击援助 3:防守方 4:防守援助
  userName: string;
  cityName: string;
  cityPos: number;
  power: number;
  powerBattleOver: number;
}

export interface FightSummaryResInfo {
  cityName: string;
  men: number;
  money: number;
  food: number;
  items?: FightSummaryItemInfo[];
}

export interface FightSummaryItemInfo {
  itemIndex: number;
  itemPath: string;
  isFill: boolean;
  itemType: number;
  itemName: string;
}

export interface FightSummarySkillEffectInfo {
  cityPos: number;
  attackHeroId: number;
  attackHeroName: string;
  attackQuality: number;
  aimType: number;
  skillName: string;
  defenceHeroId: number;
  defenceHeroName: string;
  defenceQuality: number;
  propertyType: number;
  propertyChange: number;
  attackWuXing: number;
  defenceWuXing: number;
  usCrushBlow: number;
  otherDodge: number;
  skillLevel: number;
}

export interface FightSummaryHeroInfo {
  cityPos: number;
  heroId: number;
  heroName: string;
  childrenCount: number;
  childrenLoss: number;
  trainingCount: number;
  trainingLoss: number;
  gainExp: number;
  state: number;
  heroStateFlag: number;
  heroUpdateFlag: number;
  quality: number;
}

export interface FightSummaryDefenceInfo {
  staticIndex: number;
  defenceCount: number;
  defenceLoss: number;
}

export interface FightSummaryServerInfo {
  cityList: FightSummaryCityInfo[];
  res: FightSummaryResInfo;
  skillEffectList: FightSummarySkillEffectInfo[];
  heroList: FightSummaryHeroInfo[];
  statDefenceBuildList: FightSummaryDefenceInfo[];
  userType: UserType;
  fightWinName: string;
  fightWinFlag: FightResult;
  fightTime: string;
  attackPoint: number;
  defencePoint: number;
  noLossAttack: boolean;
  noLossDefence: boolean;
  attackInsignia: number;
  defInsignia: number;
  attackPlundInsignia: number;
  attackPowerPer: number;
  defencePowerPer: number;
  attackPowerBattleBegin: number;
  defencePowerBattleBegin: number;
  attackPowerBattleEnd: number;
  defencePowerBattleEnd: number;
  weiWang: number;
}

export interface FightSummaryClientInfo {
  attackCity: FightSummaryCityInfo;
  defenceCity: FightSummaryCityInfo;
  attackArmy: FightSummaryHeroInfo[];
  defenceArmy: FightSummaryHeroInfo[];
  defenceUnionArmy?: FightSummaryHeroInfo[];
  defenceBuildList: FightSummaryDefenceInfo[];
  fightResultName: string;
  fightResult: FightResult;
  fightTime: string;
  res: FightSummaryResInfo;
  noLossAttack: boolean;
  noLossDefence: boolean;
  attackInsignia: number;
  defInsignia: number;
  attackPlundInsignia: number;
  userType: UserType;
  weiWang: number;
}

/**
 * 编码战报 (服务器格式 -> 字符串)
 */
export function encodeFightSummary(summary: FightSummaryServerInfo): string {
  let result = '';

  // 编码城市信息
  result += encodeCityList(summary.cityList);

  // 编码资源信息
  result += encodeRes(summary.res);

  // 编码技能效果
  result += encodeSkillEffectList(summary.skillEffectList);

  // 编码英雄信息
  result += encodeHeroList(summary.heroList);

  // 编码城防信息
  result += encodeDefenceList(summary.statDefenceBuildList);

  // 编码基本信息
  result += writeString('FightWinName', summary.fightWinName);
  result += writeString('FightWinFlag', summary.fightWinFlag.toString());
  result += writeString('FightTime', summary.fightTime);
  result += writeInt('AttackPoint', summary.attackPoint);
  result += writeInt('DefencePoint', summary.defencePoint);
  result += writeInt('NoLossAttack', summary.noLossAttack ? 1 : 0);
  result += writeInt('NoLossDefence', summary.noLossDefence ? 1 : 0);
  result += writeInt('AttackInsignia', summary.attackInsignia);
  result += writeInt('DefInsignia', summary.defInsignia);
  result += writeInt('AttackPlundInsignia', summary.attackPlundInsignia);
  result += writeFloat('AttackPowerPer', summary.attackPowerPer);
  result += writeFloat('DefencePowerPer', summary.defencePowerPer);
  result += writeFloat('AttackPowerBattleBegin', summary.attackPowerBattleBegin);
  result += writeFloat('DefencePowerBattleBegin', summary.defencePowerBattleBegin);
  result += writeFloat('AttackPowerBattleEnd', summary.attackPowerBattleEnd);
  result += writeFloat('DefencePowerBattleEnd', summary.defencePowerBattleEnd);

  if (summary.weiWang !== undefined && summary.weiWang >= 0) {
    result += writeInt('WeiWang', summary.weiWang);
  }

  result += '++End++$FightSummaryServerInfo#';

  return result;
}

/**
 * 解码战报 (字符串 -> 服务器格式)
 */
export function decodeFightSummary(encoded: string): FightSummaryServerInfo | null {
  try {
    const summary: FightSummaryServerInfo = {
      cityList: [],
      res: { cityName: '', men: 0, money: 0, food: 0, items: [] },
      skillEffectList: [],
      heroList: [],
      statDefenceBuildList: [],
      userType: 'player',
      fightWinName: '',
      fightWinFlag: 'draw',
      fightTime: '',
      attackPoint: 0,
      defencePoint: 0,
      noLossAttack: false,
      noLossDefence: false,
      attackInsignia: 0,
      defInsignia: 0,
      attackPlundInsignia: 0,
      attackPowerPer: 1,
      defencePowerPer: 1,
      attackPowerBattleBegin: 0,
      defencePowerBattleBegin: 0,
      attackPowerBattleEnd: 0,
      defencePowerBattleEnd: 0,
      weiWang: -100, // 默认值
    };

    const parts = encoded.split(ITEM_SEPARATOR);
    let i = 0;

    while (i < parts.length) {
      const pair = parts[i].split(KEY_VALUE_SEPARATOR);
      if (pair.length !== 2) {
        i++;
        continue;
      }

      const key = pair[0];
      const value = pair[1];

      switch (key) {
        case '++Begin++':
          // 处理嵌套部分
          if (value === 'CityList') {
            summary.cityList = decodeCityList(parts, i);
          } else if (value === 'Res') {
            summary.res = decodeRes(parts, i);
          } else if (value === 'SkillEffectList') {
            summary.skillEffectList = decodeSkillEffectList(parts, i);
          } else if (value === 'HeroList') {
            summary.heroList = decodeHeroList(parts, i);
          } else if (value === 'StatDefenceBuildList') {
            summary.statDefenceBuildList = decodeDefenceList(parts, i);
          }
          break;

        case 'FightWinName':
          summary.fightWinName = value;
          break;

        case 'FightWinFlag':
          summary.fightWinFlag = value as FightResult;
          break;

        case 'FightTime':
          summary.fightTime = value;
          break;

        case 'AttackPoint':
          summary.attackPoint = parseInt(value) || 0;
          break;

        case 'DefencePoint':
          summary.defencePoint = parseInt(value) || 0;
          break;

        case 'NoLossAttack':
          summary.noLossAttack = value === '1';
          break;

        case 'NoLossDefence':
          summary.noLossDefence = value === '1';
          break;

        case 'AttackInsignia':
          summary.attackInsignia = parseInt(value) || 0;
          break;

        case 'DefInsignia':
          summary.defInsignia = parseInt(value) || 0;
          break;

        case 'AttackPlundInsignia':
          summary.attackPlundInsignia = parseInt(value) || 0;
          break;

        case 'AttackPowerPer':
          summary.attackPowerPer = parseFloat(value) || 1;
          break;

        case 'DefencePowerPer':
          summary.defencePowerPer = parseFloat(value) || 1;
          break;

        case 'AttackPowerBattleBegin':
          summary.attackPowerBattleBegin = parseFloat(value) || 0;
          break;

        case 'DefencePowerBattleBegin':
          summary.defencePowerBattleBegin = parseFloat(value) || 0;
          break;

        case 'AttackPowerBattleEnd':
          summary.attackPowerBattleEnd = parseFloat(value) || 0;
          break;

        case 'DefencePowerBattleEnd':
          summary.defencePowerBattleEnd = parseFloat(value) || 0;
          break;

        case 'WeiWang':
          summary.weiWang = parseInt(value) || -100;
          break;

        case '++End++':
          if (value === 'FightSummaryServerInfo') {
            return summary;
          }
          break;
      }

      i++;
    }

    return summary;
  } catch (error) {
    console.error('Failed to decode fight summary:', error);
    return null;
  }
}

// 辅助函数：编码城市列表
function encodeCityList(cityList: FightSummaryCityInfo[]): string {
  let result = '';
  for (const city of cityList) {
    result += SECTION_BEGIN + '$CityList#';
    result += writeInt('Flag', city.flag);
    result += writeString('UserName', city.userName);
    result += writeString('CityName', city.cityName);
    result += writeInt('CityPos', city.cityPos);
    result += writeFloat('Power', city.power);
    result += writeFloat('PowerBattleOver', city.powerBattleOver);
    result += SECTION_END + '$CityList#';
  }
  return result;
}

// 辅助函数：解码城市列表
function decodeCityList(parts: string[], index: number): FightSummaryCityInfo[] {
  const cities: FightSummaryCityInfo[] = [];
  // 简化实现
  return cities;
}

// 辅助函数：编码资源
function encodeRes(res: FightSummaryResInfo): string {
  let result = SECTION_BEGIN + '$Res#';
  result += writeString('CityName', res.cityName);
  result += writeInt('Men', res.men);
  result += writeInt('Money', res.money);
  result += writeInt('Food', res.food);
  if (res.items && res.items.length > 0) {
    result += encodeItems(res.items);
  }
  result += SECTION_END + '$Res#';
  return result;
}

// 辅助函数：解码资源
function decodeRes(parts: string[], index: number): FightSummaryResInfo {
  // 简化实现
  return { cityName: '', men: 0, money: 0, food: 0, items: [] };
}

// 辅助函数：编码技能效果列表
function encodeSkillEffectList(list: FightSummarySkillEffectInfo[]): string {
  let result = '';
  for (const effect of list) {
    result += SECTION_BEGIN + '$SkillEffectList#';
    result += writeInt('CityPos', effect.cityPos);
    result += writeInt('AttackHeroID', effect.attackHeroId);
    result += writeString('AttackHeroName', effect.attackHeroName);
    result += writeInt('AttackQuality', effect.attackQuality);
    result += writeInt('AimType', effect.aimType);
    result += writeString('SkillName', effect.skillName);
    result += writeInt('DefenceHeroID', effect.defenceHeroId);
    result += writeString('DefenceHeroName', effect.defenceHeroName);
    result += writeInt('DefenceQuality', effect.defenceQuality);
    result += writeInt('PropertyType', effect.propertyType);
    result += writeInt('PropertyChange', effect.propertyChange);
    result += SECTION_END + '$SkillEffectList#';
  }
  return result;
}

// 辅助函数：解码技能效果列表
function decodeSkillEffectList(parts: string[], index: number): FightSummarySkillEffectInfo[] {
  return [];
}

// 辅助函数：编码英雄列表
function encodeHeroList(heroList: FightSummaryHeroInfo[]): string {
  let result = '';
  for (const hero of heroList) {
    result += SECTION_BEGIN + '$HeroList#';
    result += writeInt('CityPos', hero.cityPos);
    result += writeInt('HeroID', hero.heroId);
    result += writeString('HeroName', hero.heroName);
    result += writeInt('ChildrenCount', hero.childrenCount);
    result += writeInt('ChildrenLoss', hero.childrenLoss);
    result += writeInt('TrainingCount', hero.trainingCount);
    result += writeInt('TrainingLoss', hero.trainingLoss);
    result += writeInt('GainExp', hero.gainExp);
    result += writeInt('State', hero.state);
    result += SECTION_END + '$HeroList#';
  }
  return result;
}

// 辅助函数：解码英雄列表
function decodeHeroList(parts: string[], index: number): FightSummaryHeroInfo[] {
  return [];
}

// 辅助函数：编码城防列表
function encodeDefenceList(list: FightSummaryDefenceInfo[]): string {
  let result = '';
  for (const defence of list) {
    result += SECTION_BEGIN + '$StatDefenceBuildList#';
    result += writeInt('StaticIndex', defence.staticIndex);
    result += writeInt('DefenceCount', defence.defenceCount);
    result += writeInt('DefenceLoss', defence.defenceLoss);
    result += SECTION_END + '$StatDefenceBuildList#';
  }
  return result;
}

// 辅助函数：解码城防列表
function decodeDefenceList(parts: string[], index: number): FightSummaryDefenceInfo[] {
  return [];
}

// 辅助函数：编码物品列表
function encodeItems(items: FightSummaryItemInfo[]): string {
  let result = '';
  for (const item of items) {
    result += SECTION_BEGIN + '$ItemArray#';
    result += writeInt('ItemIndex', item.itemIndex);
    result += writeString('ItemPath', item.itemPath);
    result += writeInt('IsFill', item.isFill ? 1 : 0);
    result += writeInt('ItemType', item.itemType);
    result += writeString('ItemName', item.itemName);
    result += SECTION_END + '$ItemArray#';
  }
  return result;
}

// 辅助函数：写入字符串
function writeString(key: string, value: string): string {
  return `${key}${KEY_VALUE_SEPARATOR}${value}${ITEM_SEPARATOR}`;
}

// 辅助函数：写入整数
function writeInt(key: string, value: number): string {
  return `${key}${KEY_VALUE_SEPARATOR}${value}${ITEM_SEPARATOR}`;
}

// 辅助函数：写入浮点数
function writeFloat(key: string, value: number): string {
  return `${key}${KEY_VALUE_SEPARATOR}${value.toFixed(4)}${ITEM_SEPARATOR}`;
}

/**
 * 将服务器战报转换为客户端战报
 */
export function serverToClient(serverInfo: FightSummaryServerInfo): FightSummaryClientInfo {
  const clientInfo: FightSummaryClientInfo = {
    attackCity: serverInfo.cityList.find(c => c.flag === 1) || serverInfo.cityList[0],
    defenceCity: serverInfo.cityList.find(c => c.flag === 3) || serverInfo.cityList[1],
    attackArmy: serverInfo.heroList.filter(h => {
      const city = serverInfo.cityList.find(c => c.cityPos === h.cityPos);
      return city && city.flag === 1;
    }),
    defenceArmy: serverInfo.heroList.filter(h => {
      const city = serverInfo.cityList.find(c => c.cityPos === h.cityPos);
      return city && city.flag === 3;
    }),
    defenceBuildList: serverInfo.statDefenceBuildList,
    fightResultName: serverInfo.fightWinName,
    fightResult: serverInfo.fightWinFlag,
    fightTime: serverInfo.fightTime,
    res: serverInfo.res,
    noLossAttack: serverInfo.noLossAttack,
    noLossDefence: serverInfo.noLossDefence,
    attackInsignia: serverInfo.attackInsignia,
    defInsignia: serverInfo.defInsignia,
    attackPlundInsignia: serverInfo.attackPlundInsignia,
    userType: serverInfo.userType,
    weiWang: serverInfo.weiWang || -100,
  };

  // 格式化时间
  try {
    const time = new Date(clientInfo.fightTime);
    clientInfo.fightTime = time.toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    // 使用原始时间
  }

  return clientInfo;
}
