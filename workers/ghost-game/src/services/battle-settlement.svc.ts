/**
 * Battle Settlement Service - 战斗结算服务
 * 参考 jx/BLL/Event.cs FinishFightEvent 及相关方法
 * 实现完整的战斗结算流程
 */

import type { D1Database } from '@cloudflare/workers-types';

// 战斗方信息
interface FightSideInfo {
  UserName: string;
  OtherName: string;
  CityID: number;
  OtherCityID: number;
  UserType: number;  // 1=攻方, 2=防方
  IsArena: boolean;
  Heros: HeroInfo[];
  OtherHeros: HeroInfo[];
  ArmyPower: number;
  OtherArmyPower: number;
  Defences: DefenceInfo[];
  OtherDefences: DefenceInfo[];
  IsWin: boolean;
}

// 英雄信息
interface HeroInfo {
  HeroID: number;
  HeroName: string;
  Quality: number;
  Level: number;
  Exp: number;
  Attack: number;
  Defence: number;
  HP: number;
  MaxHP: number;
  SkillExp: number;
  State: number;
  Training: number;
  Chongbai: number;
}

// 防御建筑信息
interface DefenceInfo {
  StaticIndex: number;
  Level: number;
  Count: number;
  Loss: number;
}

// 战斗摘要信息
interface FightSummaryServerInfo {
  FightTime: string;
  FightWinName: string;
  FightWinFlag: number;
  AttackPoint: number;
  DefencePoint: number;
  NoLossAttack: number;
  NoLossDefence: number;
  Heros: HeroSummaryInfo[];
  OtherHeros: HeroSummaryInfo[];
  City: CitySummaryInfo;
  OtherCity: CitySummaryInfo;
  Res: ResSummaryInfo;
  OtherRes: ResSummaryInfo;
  SkillEffects: SkillEffectInfo[];
  StatDefenceBuildList: StatDefenceBuildInfo[];
  CityBuilds: CityBuildSummaryInfo[];
  OrgResList: OrgResSummaryInfo[];
  Items: ItemSummaryInfo[];
  HeroList: HeroSummaryInfo[];
  AttackPlundInsignia: number;
  WeiWang: number;
  AttackPowerPer: number;
  DefencePowerPer: number;
  AttackPowerBattleBegin: number;
  DefencePowerBattleBegin: number;
  AttackPowerBattleEnd: number;
  DefencePowerBattleEnd: number;
  BuildDefencePower: number;
  BuildDefencePowerBattleOver: number;
  IsSkillExp: number;
}

// 英雄摘要信息
interface HeroSummaryInfo {
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
  CityPos: number;
}

// 城市摘要信息
interface CitySummaryInfo {
  Flag: string;
  UserName: string;
  CityName: string;
  CityPos: number;
  Power: number;
  PowerBattleOver: number;
}

// 资源摘要信息
interface ResSummaryInfo {
  CityName: string;
  Men: number;
  Money: number;
  Food: number;
  ItemArray: ItemSummaryInfo[];
}

// 技能效果信息
interface SkillEffectInfo {
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

// 防御建筑统计信息
interface StatDefenceBuildInfo {
  StaticIndex: number;
  DefenceCount: number;
  DefenceLoss: number;
}

// 城市建筑摘要信息
interface CityBuildSummaryInfo {
  Type: number;
  EndLevel: number;
  Index: number;
  CurrentLevel: number;
}

// 组织资源信息
interface OrgResSummaryInfo {
  CityPos: number;
  OrgResList: KeyValuePair[];
}

// 物品摘要信息
interface KeyValuePair {
  Key: string;
  Value: number;
}

// 物品摘要
interface ItemSummaryInfo {
  ItemIndex: number;
  ItemPath: string;
  IsFill: number;
  ItemType: number;
  ItemName: string;
}

// 战斗结算服务类
export class BattleSettlementService {
  constructor(private db: D1Database) {}

  /**
   * 完成战斗事件 - 主入口
   * 参考 jx/BLL/Event.cs FinishFightEvent
   */
  async finishFightEvent(
    walletAddress: string,
    cityId: number,
    eventSingle: any
  ): Promise<{ success: boolean; error?: string; summary?: FightSummaryServerInfo }> {
    try {
      // 初始化战斗信息
      const fightSingle: FightSideInfo = {
        UserName: walletAddress,
        OtherName: eventSingle.target_user || '',
        CityID: cityId,
        OtherCityID: eventSingle.target_city_id || 0,
        UserType: 1, // 攻方
        IsArena: false,
        Heros: [],
        OtherHeros: [],
        ArmyPower: 0,
        OtherArmyPower: 0,
        Defences: [],
        OtherDefences: [],
        IsWin: false,
      };

      // 初始化战斗摘要
      const fightSummarySingle: FightSummaryServerInfo = {
        FightTime: new Date().toISOString(),
        FightWinName: '',
        FightWinFlag: 0,
        AttackPoint: 0,
        DefencePoint: 0,
        NoLossAttack: 0,
        NoLossDefence: 0,
        Heros: [],
        OtherHeros: [],
        City: { Flag: '', UserName: '', CityName: '', CityPos: 0, Power: 0, PowerBattleOver: 0 },
        OtherCity: { Flag: '', UserName: '', CityName: '', CityPos: 0, Power: 0, PowerBattleOver: 0 },
        Res: { CityName: '', Men: 0, Money: 0, Food: 0, ItemArray: [] },
        OtherRes: { CityName: '', Men: 0, Money: 0, Food: 0, ItemArray: [] },
        SkillEffects: [],
        StatDefenceBuildList: [],
        CityBuilds: [],
        OrgResList: [],
        Items: [],
        HeroList: [],
        AttackPlundInsignia: 0,
        WeiWang: 0,
        AttackPowerPer: 0,
        DefencePowerPer: 0,
        AttackPowerBattleBegin: 0,
        DefencePowerBattleBegin: 0,
        AttackPowerBattleEnd: 0,
        DefencePowerBattleEnd: 0,
        BuildDefencePower: 0,
        BuildDefencePowerBattleOver: 0,
        IsSkillExp: 0,
      };

      // 1. 填充双方英雄信息
      let result = await this.fullArmyHero(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `fullArmyHero failed: ${result}` };

      // 2. 填充双方技能信息
      result = await this.fullArmySkill(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `fullArmySkill failed: ${result}` };

      // 3. 填充防御信息
      result = await this.fullArmyDefence(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `fullArmyDefence failed: ${result}` };

      // 4. 汇总双方信息
      result = await this.fullArmyAllInfo(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `fullArmyAllInfo failed: ${result}` };

      // 5. 计算战斗
      result = await this.calculateFight(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `CalculateFight failed: ${result}` };

      // 6. 计算技能经验
      result = await this.calculateHeroSkillExp(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `CalculateHeroSkillExp failed: ${result}` };

      // 7. 英雄排序
      result = await this.sortHeroByPos(walletAddress, cityId, eventSingle, fightSingle);
      if (result !== 0) return { success: false, error: `SortHeroByPos failed: ${result}` };

      // 8. 如果不是竞技场，删除事件
      if (!fightSingle.IsArena) {
        result = await this.delEspeciallyEvent(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
        if (result !== 0) return { success: false, error: `DelEspeciallyEvent failed: ${result}` };
      }

      // 9. 计算经验
      result = await this.calculateExp(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `CalculateExp failed: ${result}` };

      // 10. 英雄升级
      result = await this.calculateHeroUpdate(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `CalculateHeroUpdate failed: ${result}` };

      // 11. 计算掠夺资源
      result = await this.calculatePlunderRes(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `CalculatePlunderRes failed: ${result}` };

      // 12. 战斗获得物品
      result = await this.addItemsByFight(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `AddItemsByFight failed: ${result}` };

      // 13. 计算军团资源
      result = await this.calculateOrgRes(walletAddress, cityId, fightSingle);
      if (result !== 0) return { success: false, error: `CalculateOrgRes failed: ${result}` };

      // 14. 资源转换
      result = await this.translateOrgRes(fightSingle);
      if (result !== 0) return { success: false, error: `TranslateOrgRes failed: ${result}` };

      // 15. 计算战斗任务
      result = await this.calculateFightTask(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `CalculateFightTask failed: ${result}` };

      // 16. 计算战斗使命
      if (fightSingle.UserType !== 1) {
        result = await this.calculateFightMission(walletAddress, cityId, fightSingle);
        if (result !== 0) return { success: false, error: `CalculateFightMission failed: ${result}` };
      }

      // 17. 战勋计算
      result = await this.fightInsignia(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `FightInsignia failed: ${result}` };

      // 18. 战斗威望
      result = await this.fightWeiWang(fightSingle.OtherName, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `FightWeiWang failed: ${result}` };

      // 19. 战报信息
      result = await this.fightSummaryInfo(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `FightSummaryInfo failed: ${result}` };

      // 20. 计算溢出物品
      result = await this.calculateSpilthItem(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `CalculateSpilthItem failed: ${result}` };

      // 21. 战斗完成处理
      result = await this.calculateFighteFinish(walletAddress, cityId, eventSingle, fightSingle, fightSummarySingle);
      if (result !== 0) return { success: false, error: `CalculateFighteFinish failed: ${result}` };

      return { success: true, summary: fightSummarySingle };

    } catch (err: any) {
      console.error('[BattleSettlement] finishFightEvent error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 1. 填充双方英雄信息
   * 参考 jx/BLL/Event.cs fullArmyHero
   */
  private async fullArmyHero(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      // 获取攻方英雄列表
      const herosResult = await this.db.prepare(`
        SELECT id as HeroID, name as HeroName, quality as Quality, level as Level,
               exp as Exp, attack as Attack, defence as Defence, hp as HP,
               max_hp as MaxHP, skill_exp as SkillExp, state as State,
               training as Training, chongbai as Chongbai
        FROM heroes
        WHERE wallet_address = ? AND city_id = ? AND state IN (0, 2)
      `).bind(userName, cityId).all();
      const heros: any[] = herosResult.results || [];

      fightSingle.Heros = heros.map(h => ({
        HeroID: h.HeroID,
        HeroName: h.HeroName,
        Quality: h.Quality,
        Level: h.Level,
        Exp: h.Exp || 0,
        Attack: h.Attack,
        Defence: h.Defence,
        HP: h.HP,
        MaxHP: h.MaxHP || h.HP,
        SkillExp: h.SkillExp || 0,
        State: h.State,
        Training: h.Training || 0,
        Chongbai: h.Chongbai || 0,
      }));

      // 获取防方英雄列表
      const otherUserName = eventSingle.target_user || '';
      const otherCityId = eventSingle.target_city_id || 0;
      if (otherUserName) {
        const otherHerosResult = await this.db.prepare(`
          SELECT id as HeroID, name as HeroName, quality as Quality, level as Level,
                 exp as Exp, attack as Attack, defence as Defence, hp as HP,
                 max_hp as MaxHP, skill_exp as SkillExp, state as State,
                 training as Training, chongbai as Chongbai
          FROM heroes
          WHERE wallet_address = ? AND city_id = ? AND state IN (0, 2)
        `).bind(otherUserName, otherCityId).all();
        const otherHeros: any[] = otherHerosResult.results || [];

        fightSingle.OtherHeros = otherHeros.map(h => ({
          HeroID: h.HeroID,
          HeroName: h.HeroName,
          Quality: h.Quality,
          Level: h.Level,
          Exp: h.Exp || 0,
          Attack: h.Attack,
          Defence: h.Defence,
          HP: h.HP,
          MaxHP: h.MaxHP || h.HP,
          SkillExp: h.SkillExp || 0,
          State: h.State,
          Training: h.Training || 0,
          Chongbai: h.Chongbai || 0,
        }));
      }

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] fullArmyHero error:', err);
      return -1;
    }
  }

  /**
   * 2. 填充双方技能信息
   * 参考 jx/BLL/Event.cs fullArmySkill
   */
  private async fullArmySkill(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    // 技能信息已在Hero中或从skill_configs获取
    // 简化实现：技能效果在战斗计算时处理
    return 0;
  }

  /**
   * 3. 填充防御信息
   * 参考 jx/BLL/Event.cs fullArmyDefence
   */
  private async fullArmyDefence(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      // 获取攻方防御建筑
      const defencesResult = await this.db.prepare(`
        SELECT static_index as StaticIndex, level as Level, count as Count, loss as Loss
        FROM defence_buildings
        WHERE city_id = ?
      `).bind(cityId).all();
      const defences: any[] = defencesResult.results || [];

      fightSingle.Defences = defences.map(d => ({
        StaticIndex: d.StaticIndex,
        Level: d.Level,
        Count: d.Count || 0,
        Loss: d.Loss || 0,
      }));

      // 获取防方防御建筑
      const otherCityId = eventSingle.target_city_id || 0;
      if (otherCityId) {
        const otherDefencesResult = await this.db.prepare(`
          SELECT static_index as StaticIndex, level as Level, count as Count, loss as Loss
          FROM defence_buildings
          WHERE city_id = ?
        `).bind(otherCityId).all();
        const otherDefences: any[] = otherDefencesResult.results || [];

        fightSingle.OtherDefences = otherDefences.map(d => ({
          StaticIndex: d.StaticIndex,
          Level: d.Level,
          Count: d.Count || 0,
          Loss: d.Loss || 0,
        }));
      }

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] fullArmyDefence error:', err);
      return -1;
    }
  }

  /**
   * 4. 汇总双方信息
   * 参考 jx/BLL/Event.cs fullArmyAllInfo
   */
  private async fullArmyAllInfo(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      // 计算攻方总战力
      let totalAttack = 0;
      for (const hero of fightSingle.Heros) {
        totalAttack += hero.Attack * (hero.HP / hero.MaxHP);
      }
      for (const defence of fightSingle.Defences) {
        totalAttack += defence.Level * 10 * defence.Count;
      }
      fightSingle.ArmyPower = Math.floor(totalAttack);

      // 计算防方总战力
      let totalDefence = 0;
      for (const hero of fightSingle.OtherHeros) {
        totalDefence += hero.Attack * (hero.HP / hero.MaxHP);
      }
      for (const defence of fightSingle.OtherDefences) {
        totalDefence += defence.Level * 10 * defence.Count;
      }
      fightSingle.OtherArmyPower = Math.floor(totalDefence);

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] fullArmyAllInfo error:', err);
      return -1;
    }
  }

  /**
   * 5. 计算战斗
   * 参考 jx/BLL/Event.cs CalculateFight
   */
  private async calculateFight(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      // 根据战力判断胜负
      // C#: 战力高的获胜，考虑英雄数量、品质等因素
      const heroBonus = fightSingle.Heros.length * 10;
      const otherHeroBonus = fightSingle.OtherHeros.length * 10;

      const attackPower = fightSingle.ArmyPower + heroBonus;
      const defencePower = fightSingle.OtherArmyPower + otherHeroBonus;

      fightSummary.AttackPowerPer = attackPower / (attackPower + defencePower);
      fightSummary.DefencePowerPer = defencePower / (attackPower + defencePower);

      // 战力高的一方获胜
      if (attackPower > defencePower) {
        fightSingle.IsWin = true;
        fightSummary.FightWinName = userName;
        fightSummary.FightWinFlag = 1;
      } else {
        fightSingle.IsWin = false;
        fightSummary.FightWinName = fightSingle.OtherName;
        fightSummary.FightWinFlag = 2;
      }

      // 计算攻击点数 (战功)
      fightSummary.AttackPoint = Math.floor(attackPower / 100);
      fightSummary.DefencePoint = Math.floor(defencePower / 100);

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] CalculateFight error:', err);
      return -1;
    }
  }

  /**
   * 6. 计算英雄技能经验
   */
  private async calculateHeroSkillExp(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    // 简化：战斗后英雄获得技能经验
    const expPerHero = fightSingle.IsWin ? 50 : 25;
    for (const hero of fightSingle.Heros) {
      hero.SkillExp += expPerHero;
    }
    return 0;
  }

  /**
   * 7. 英雄排序
   */
  private async sortHeroByPos(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo
  ): Promise<number> {
    // 简化：按品质和等级排序
    fightSingle.Heros.sort((a, b) => {
      if (b.Quality !== a.Quality) return b.Quality - a.Quality;
      return b.Level - a.Level;
    });
    return 0;
  }

  /**
   * 8. 删除相关事件
   */
  private async delEspeciallyEvent(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      // 删除相关的time_events
      await this.db.prepare(`
        DELETE FROM time_events
        WHERE wallet_address = ? AND event_type = 'warfare'
          AND target_city = ?
      `).bind(userName, eventSingle.target_city).run();

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] delEspeciallyEvent error:', err);
      return -1;
    }
  }

  /**
   * 9. 计算经验
   */
  private async calculateExp(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      // 胜利方英雄获得经验
      const expPerHero = fightSingle.IsWin ? 100 : 50;
      for (const hero of fightSingle.Heros) {
        hero.Exp += expPerHero;
      }

      // 更新数据库
      for (const hero of fightSingle.Heros) {
        await this.db.prepare(`
          UPDATE heroes SET exp = ? WHERE id = ?
        `).bind(hero.Exp, hero.HeroID).run();
      }

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] calculateExp error:', err);
      return -1;
    }
  }

  /**
   * 10. 计算英雄升级
   */
  private async calculateHeroUpdate(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      for (const hero of fightSingle.Heros) {
        // 检查是否可升级 (简化: 每1000经验升1级)
        const expThreshold = hero.Level * 1000;
        while (hero.Exp >= expThreshold) {
          hero.Exp -= expThreshold;
          hero.Level += 1;
          // 更新属性
          hero.Attack = Math.floor(hero.Attack * 1.1);
          hero.Defence = Math.floor(hero.Defence * 1.1);
          hero.MaxHP = Math.floor(hero.MaxHP * 1.1);
          hero.HP = hero.MaxHP;
        }

        // 更新数据库
        await this.db.prepare(`
          UPDATE heroes SET level = ?, exp = ?, attack = ?, defence = ?,
                           max_hp = ?, hp = ?
          WHERE id = ?
        `).bind(hero.Level, hero.Exp, hero.Attack, hero.Defence, hero.MaxHP, hero.HP, hero.HeroID).run();
      }

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] calculateHeroUpdate error:', err);
      return -1;
    }
  }

  /**
   * 11. 计算掠夺资源
   */
  private async calculatePlunderRes(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      if (!fightSingle.IsWin) return 0; // 失败方不掠夺

      // 获取对方城市资源
      const otherCityId = eventSingle.target_city_id || 0;
      const otherCity: any = await this.db.prepare(`
        SELECT money, food, population FROM cities WHERE id = ?
      `).bind(otherCityId).first();

      if (!otherCity) return 0;

      // 掠夺比例 (最多30%)
      const plunderRate = 0.3;
      const plunderMoney = Math.floor((otherCity.money || 0) * plunderRate);
      const plunderFood = Math.floor((otherCity.food || 0) * plunderRate);

      // 更新摘要
      fightSummary.Res.Money = plunderMoney;
      fightSummary.Res.Food = plunderFood;
      fightSummary.Res.Men = 0;

      // 扣除对方资源
      await this.db.prepare(`
        UPDATE cities SET money = money - ?, food = food - ? WHERE id = ?
      `).bind(plunderMoney, plunderFood, otherCityId).run();

      // 增加己方资源
      await this.db.prepare(`
        UPDATE cities SET money = money + ?, food = food + ? WHERE id = ?
      `).bind(plunderMoney, plunderFood, cityId).run();

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] calculatePlunderRes error:', err);
      return -1;
    }
  }

  /**
   * 12. 战斗获得物品
   */
  private async addItemsByFight(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    // 简化: 胜利后有概率获得物品
    if (!fightSingle.IsWin) return 0;

    // 10%概率获得物品 (简化)
    if (Math.random() < 0.1) {
      // 随机物品ID 1-100
      const itemIndex = Math.floor(Math.random() * 100) + 1;
      await this.db.prepare(`
        INSERT INTO items (wallet_address, config_id, count, source)
        VALUES (?, ?, 1, 'fight_reward')
        ON CONFLICT(wallet_address, config_id) DO UPDATE SET count = count + 1
      `).bind(userName, itemIndex).run();
    }

    return 0;
  }

  /**
   * 13. 计算军团资源
   */
  private async calculateOrgRes(
    userName: string,
    cityId: number,
    fightSingle: FightSideInfo
  ): Promise<number> {
    // 简化: 军团资源计算
    return 0;
  }

  /**
   * 14. 资源转换
   */
  private async translateOrgRes(fightSingle: FightSideInfo): Promise<number> {
    // 简化: 资源转换
    return 0;
  }

  /**
   * 15. 计算战斗任务
   */
  private async calculateFightTask(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    // 简化: 任务系统在battle.ts中处理
    return 0;
  }

  /**
   * 16. 计算战斗使命
   */
  private async calculateFightMission(
    userName: string,
    cityId: number,
    fightSingle: FightSideInfo
  ): Promise<number> {
    return 0;
  }

  /**
   * 17. 战勋计算
   */
  private async fightInsignia(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      // 胜利获得战勋，失败获得一半
      const insignia = fightSingle.IsWin ? 100 : 50;
      fightSummary.AttackPlundInsignia = insignia;

      // 更新用户战勋
      await this.db.prepare(`
        UPDATE characters SET insignia = insignia + ? WHERE wallet_address = ?
      `).bind(insignia, userName).run();

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] fightInsignia error:', err);
      return -1;
    }
  }

  /**
   * 18. 战斗威望
   */
  private async fightWeiWang(
    otherUserName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      // 胜利获得威望
      if (fightSingle.IsWin) {
        const weiWang = 10;
        fightSummary.WeiWang = weiWang;

        await this.db.prepare(`
          UPDATE characters SET prestige = prestige + ? WHERE wallet_address = ?
        `).bind(weiWang, fightSingle.UserName).run();
      }
      return 0;
    } catch (err) {
      console.error('[BattleSettlement] fightWeiWang error:', err);
      return -1;
    }
  }

  /**
   * 19. 战报信息
   */
  private async fightSummaryInfo(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      // 获取城市信息
      const city: any = await this.db.prepare(`
        SELECT name as CityName, position as CityPos FROM cities WHERE id = ?
      `).bind(cityId).first();

      if (city) {
        fightSummary.City.CityName = city.CityName;
        fightSummary.City.CityPos = city.CityPos;
        fightSummary.City.UserName = userName;
        fightSummary.City.Power = fightSingle.ArmyPower;
      }

      // 填充英雄摘要
      for (const hero of fightSingle.Heros) {
        fightSummary.Heros.push({
          HeroID: hero.HeroID,
          HeroName: hero.HeroName,
          ChildrenCount: 0,
          ChildrenLoss: 0,
          TrainingCount: 0,
          TrainingLoss: 0,
          GainExp: 0,
          State: hero.State,
          HeroStatefFlag: 0,
          HeroUpdateFlag: 0,
          Quality: hero.Quality,
          CityPos: city?.CityPos || 0,
        });
      }

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] fightSummaryInfo error:', err);
      return -1;
    }
  }

  /**
   * 20. 计算溢出物品
   */
  private async calculateSpilthItem(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    // 简化: 背包溢出检查
    return 0;
  }

  /**
   * 21. 战斗完成处理
   */
  private async calculateFighteFinish(
    userName: string,
    cityId: number,
    eventSingle: any,
    fightSingle: FightSideInfo,
    fightSummary: FightSummaryServerInfo
  ): Promise<number> {
    try {
      // 清除英雄战斗状态
      for (const hero of fightSingle.Heros) {
        await this.db.prepare(`
          UPDATE heroes SET state = 0 WHERE id = ?
        `).bind(hero.HeroID).run();
      }

      // 记录战报 (如果有 battles 表)
      await this.db.prepare(`
        UPDATE battles SET
          result = ?,
          summary = ?,
          updated_at = datetime('now')
        WHERE attacker_address = ? AND defender_address = ?
          AND result IS NULL
      `).bind(
        fightSingle.IsWin ? 1 : 2,
        JSON.stringify(fightSummary),
        userName,
        fightSingle.OtherName
      ).run();

      return 0;
    } catch (err) {
      console.error('[BattleSettlement] calculateFighteFinish error:', err);
      return -1;
    }
  }
}

// 导出单例访问函数
let settlementService: BattleSettlementService | null = null;

export async function finishFightEvent(
  db: D1Database,
  walletAddress: string,
  cityId: number,
  eventSingle: any
): Promise<{ success: boolean; error?: string; summary?: FightSummaryServerInfo }> {
  if (!settlementService) {
    settlementService = new BattleSettlementService(db);
  }
  return settlementService.finishFightEvent(walletAddress, cityId, eventSingle);
}
