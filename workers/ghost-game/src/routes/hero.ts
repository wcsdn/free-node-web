/**
 * Hero Routes - 武将接口
 * 使用 Service 层
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { heroService } from '../services';
import skillsConfig from '../config/skills.json';
import itemsConfig from '../config/items.json';
import heroesConfig from '../config/heroes.json';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 格式化武将信息为 C# HeroInfo 结构
function formatHeroInfo(h: any, walletAddress: string) {
  return {
    ID: h.id,
    Name: h.name,
    Level: h.level,
    Sex: h.sex || 1,
    Junta: h.junta || 1,
    Icon: h.icon || '/hero/1.gif',
    Image: h.image || '/hero/1.png',
    PortraitIndex: h.portrait_index || 1,
    AbilityIndex: h.ability_index || 1,
    CityID: h.city_id,
    UserName: walletAddress,
    Training: h.training || 0,
    DefencePos: h.defence_pos || -1,
    PrenticeNum: h.prentice_num || 0,
    HeroType: h.hero_type || 0,
    Quality: h.quality || 1,
    ExpCount: h.exp || 0,
    NoSkillReason: 0,
    PropertyCounteract: [0,0,0,0,0],
    WuXing: h.wu_xing || 1,
    UpTraining: h.up_training || 10,
    AutoExpGold: 0,
    AutoExpCount: 0,
    AutoExpResFood: 0,
    AutoExpResMoney: 0,
    AutoExpResMen: 0,
    AutoExpNum: 0,
    State: h.state || 0,
    CorpsID: h.corps_id || 0,
    LevelExp: h.exp || 0,
    Attack: h.attack || 10,
    Defence: h.defense || 5,
    CrushBlow: h.crush_blow || 0,
    Dodge: h.dodge || 0,
    MaxPrenticeNum: 5,
    AttackRange: h.attack_range || 1,
    MoveRange: h.move_range || 3,
    ResumeCostTime: 0,
    ResumeCostGold: 0,
    TrainCostMoney: 100,
    TrainCostFood: 100,
    TrainCostMen: 10,
    TrainCostGold: 0,
    TrainCostTime: 3600,
    ConscriptionCostMoney: 200,
    ConscriptionCostFood: 200,
    ConscriptionCostMen: 20,
    ConscriptionCostGold: 0,
    ConscriptionCostTime: 7200,
    FastTrainCostMoney: 50,
    FastTrainCostFood: 50,
    FastTrainCostMen: 5,
    FastTrainCostGold: 10,
    FastTrainCostTime: 0,
    FastConscriptionCostMoney: 100,
    FastConscriptionCostFood: 100,
    FastConscriptionCostMen: 10,
    FastConscriptionCostGold: 20,
    FastConscriptionCostTime: 0,
    SkillList: [],
    ItemList: [],
  };
}

// ==================== Helper Functions ====================

// SkillInfo interface for hero skills (参考 C# SkillInfo)
interface SkillInfo {
  ID: number;
  HeroID: number;
  SkillLevel: number;
  EXP: number;
  StaticIndex: number;
  Name: string;
  Type: number;
  Des: string;
  Probability: number;
  EffID: number;
  EffValue: number;
  EffRange: number;
  NeedItemType: number;
}

// ItemInfo interface for hero equipped items (参考 C# ItemInfo)
interface ItemInfo {
  ID: number;
  Name: string;
  ItemType: number;
  Des: string;
  Level: number;
  Quality: number;
  Price: number;
  UseType: number;
  UseLevel: number;
  UseSex: number;
  UseUnion: number;
  HitPoint: number;
  Durability: number;
  Attack: number;
  Defence: number;
  FR: number;
  LR: number;
  CR: number;
  DR: number;
  SellMoney: number;
  SellFood: number;
  Image: string;
  Icon: string;
  StaticIndex: number;
  State: number;
  UserName: string;
  CityID: number;
}

/**
 * 获取英雄的技能列表
 * @param db D1Database
 * @param heroId 英雄ID
 * @param heroLevel 英雄等级（用于计算技能属性）
 */
async function getHeroSkillList(db: D1Database, heroId: number, heroLevel: number): Promise<SkillInfo[]> {
  const skills = (skillsConfig as Record<string, any>);
  
  // 查询 hero_skills 表获取英雄的技能
  const skillRows = await db.prepare(`
    SELECT hs.*, sc.name, sc.type, sc.typeText as type_name, sc.description, 
           sc.probability, sc.upProbability, sc.effID, sc.effectValue, 
           sc.upEffectValue, sc.effectRange, sc.needItemType
    FROM hero_skills hs
    LEFT JOIN skills_config sc ON hs.static_index = sc.id
    WHERE hs.hero_id = ?
    ORDER BY hs.id
  `).bind(heroId).all() as any;

  const result: SkillInfo[] = [];
  for (const row of (skillRows.results || [])) {
    // 优先使用 skills.json 中的数据，skills_config 表仅用于扩展字段
    let skillData: any = null;
    const staticIndex = row.static_index as number;
    
    if (skills[staticIndex]) {
      // 优先从 skills.json 获取基础配置
      skillData = { ...skills[staticIndex] };
      // 如果 skills_config 有额外字段，进行覆盖
      if (row.name) {
        skillData.name = row.name;
        skillData.description = row.description || skillData.description;
        skillData.probability = row.probability ?? skillData.probability;
        skillData.effID = row.effID ?? skillData.effID;
        skillData.effectValue = row.effectValue ?? skillData.effectValue;
      }
    } else if (row.name) {
      // 从 skills_config 表获取（无 JSON 时）
      skillData = {
        id: row.static_index,
        name: row.name,
        type: row.type || 1,
        description: row.description || '',
        probability: row.probability || 100,
        effID: row.effID || 1,
        effectValue: row.effectValue || 0,
        effectRange: row.effectRange || 1,
        needItemType: row.needItemType || 0,
      };
    }
    
    if (!skillData) continue;
    
    const skillLevel = row.skill_level || 1;
    const exp = row.exp || 1;
    
    result.push({
      ID: row.static_index,
      HeroID: heroId,
      SkillLevel: skillLevel,
      EXP: exp,
      StaticIndex: staticIndex,
      Name: skillData.name || `技能${staticIndex}`,
      Type: skillData.type || 1,
      Des: skillData.description || '',
      Probability: Math.floor((skillData.probability || 100) + (skillData.upProbability || 0) * (heroLevel - 1) * 0.01),
      EffID: skillData.effID || 1,
      EffValue: Math.floor((skillData.effectValue || 0) * skillLevel),
      EffRange: skillData.effectRange || 1,
      NeedItemType: skillData.needItemType || 0,
    });
  }
  
  return result;
}

/**
 * 获取英雄的装备列表
 * @param db D1Database
 * @param heroId 英雄ID
 */
async function getHeroItemList(db: D1Database, heroId: number): Promise<ItemInfo[]> {
  const items = (itemsConfig as any).Item || [];
  
  // 查询 items 表获取英雄的装备
  const itemRows = await db.prepare(`
    SELECT i.*, ic.Name, ic.Type, ic.Des, ic.Icon, ic.Price,
           ic.EffectType, ic.EffectValue
    FROM items i
    LEFT JOIN items_config ic ON i.config_id = ic.ID
    WHERE i.hero_id = ? AND i.equipped = 1
    ORDER BY i.id
  `).bind(heroId).all() as any;

  const result: ItemInfo[] = [];
  for (const row of (itemRows.results || [])) {
    // 优先使用 items.json 中的数据，items_config 表仅用于扩展字段
    let itemData: any = null;
    const configId = row.config_id;
    
    // 先从 items.json 查找
    itemData = items.find((i: any) => i.Index === configId || i.ID === configId);
    
    if (!itemData && row.Name) {
      // 从 items_config 表获取（无 JSON 时）
      itemData = {
        Index: configId,
        Name: row.Name,
        Type: row.Type || 1,
        Des: row.Des || '',
        Icon: row.Icon || '',
        Price: row.Price || 0,
        Attack: row.EffectType === 1 ? (row.EffectValue || 0) : 0,
        Defence: row.EffectType === 2 ? (row.EffectValue || 0) : 0,
        Level: 1,
        Quality: 1,
        UseType: 1,
        UseLevel: 1,
        UseSex: 0,
        UseUnion: 0,
        HitPoint: 100,
        SellMoney: 0,
        SellFood: 0,
        FR: 0, LR: 0, CR: 0, DR: 0,
        Image: row.Icon || '',
      };
    } else if (itemData && row.Name) {
      // JSON有数据，但用数据库字段覆盖
      itemData.Name = row.Name;
      itemData.Des = row.Des || itemData.Des;
      itemData.Icon = row.Icon || itemData.Icon;
      itemData.Price = row.Price || itemData.Price;
    }
    
    if (!itemData) continue;
    
    result.push({
      ID: row.id,
      Name: itemData.Name || `物品${configId}`,
      ItemType: itemData.Type || 1,
      Des: itemData.Des || '',
      Level: itemData.Level || 1,
      Quality: itemData.Quality || 1,
      Price: itemData.Price || 0,
      UseType: itemData.UseType || 1,
      UseLevel: itemData.UseLevel || 1,
      UseSex: itemData.UseSex || 0,
      UseUnion: itemData.UseUnion || 0,
      HitPoint: itemData.HitPoint || 100,
      Durability: row.durability ?? itemData.HitPoint ?? 100,
      Attack: itemData.Attack || 0,
      Defence: itemData.Defence || 0,
      FR: itemData.FR || 0,
      LR: itemData.LR || 0,
      CR: itemData.CR || 0,
      DR: itemData.DR || 0,
      SellMoney: itemData.SellMoney || 0,
      SellFood: itemData.SellFood || 0,
      Image: itemData.Image || itemData.Icon || '',
      Icon: itemData.Icon || '',
      StaticIndex: configId,
      State: row.state || 0,
      UserName: row.wallet_address || '',
      CityID: row.city_id || 0,
    });
  }
  
  return result;
}

// GetCityHero - POST /hero/list
// C# 签名: public HeroInfo[] GetCityHero(int cityID)
// 返回: HeroInfo[] (数组，不是对象)
app.post('/list', async (c) => {
  try {
    const walletAddress = await verifyWalletAuth(c);
    if (!walletAddress) return error(c, 'Unauthorized', 401);

    const db = c.env.DB;
    if (!db) return error(c, 'Database not configured', 503);

    // 支持 city_id 和 cityId 参数 (与前端一致)
    const body = await c.req.json<{ city_id?: number; cityId?: number }>();
    const city_id = body.city_id ?? body.cityId;

    // C# 逻辑: GetHero(userName, cityID) 排除 state=6 (未雇佣)
    // 支持 city_id 过滤，如果不传则返回所有城市的武将
    let query = 'SELECT * FROM heroes WHERE wallet_address = ? AND state != 6';
    const params: any[] = [walletAddress];
    
    if (city_id !== undefined) {
      query += ' AND city_id = ?';
      params.push(city_id);
    }
    
    query += ' ORDER BY level DESC, quality DESC';
    
    const heroes = await db.prepare(query).bind(...params).all();

    // 如果没有武将，返回包含 ID=-1 的数组 (C# 约定)
    if (!heroes.results || heroes.results.length === 0) {
      console.log('[/hero/list] No heroes found, returning [{ID:-1}]');
      return success(c, [{ ID: -1 }]);
    }

    // 批量查询所有武将的技能和装备
    const heroIds = (heroes.results || []).map((h: any) => h.id);
    
    // 批量获取技能列表
    let skillsMap = new Map<number, any[]>();
    if (heroIds.length > 0) {
      const placeholders = heroIds.map(() => '?').join(', ');
      const allSkills = await db.prepare(`
        SELECT hs.*, sc.name, sc.type, sc.description, 
               sc.probability, sc.upProbability, sc.effID, sc.effectValue, 
               sc.upEffectValue, sc.effectRange, sc.needItemType
        FROM hero_skills hs
        LEFT JOIN skills_config sc ON hs.static_index = sc.id
        WHERE hs.hero_id IN (${placeholders})
        ORDER BY hs.hero_id, hs.id
      `).bind(...heroIds).all() as any;
      
      for (const skill of (allSkills.results || [])) {
        const hid = skill.hero_id;
        if (!skillsMap.has(hid)) skillsMap.set(hid, []);
        skillsMap.get(hid)!.push(skill);
      }
    }
    
    // 批量获取装备列表
    let itemsMap = new Map<number, any[]>();
    if (heroIds.length > 0) {
      const placeholders = heroIds.map(() => '?').join(', ');
      const allItems = await db.prepare(`
        SELECT i.*, ic.Name, ic.Type, ic.Des, ic.Icon, ic.Price,
               ic.EffectType, ic.EffectValue
        FROM items i
        LEFT JOIN items_config ic ON i.config_id = ic.ID
        WHERE i.hero_id IN (${placeholders}) AND i.equipped = 1
        ORDER BY i.hero_id, i.id
      `).bind(...heroIds).all() as any;
      
      for (const item of (allItems.results || [])) {
        const hid = item.hero_id;
        if (!itemsMap.has(hid)) itemsMap.set(hid, []);
        itemsMap.get(hid)!.push(item);
      }
    }

    // 格式化为 C# HeroInfo 结构
    const skillsData = (skillsConfig as Record<string, any>);
    const itemsData = (itemsConfig as any).Item || [];
    
    const heroList = (heroes.results || []).map((h: any) => {
      const heroId = h.id;
      const heroLevel = h.level || 1;
      
      // 获取该武将的技能列表
      const heroSkillRows = skillsMap.get(heroId) || [];
      const SkillList = heroSkillRows.map((row: any) => {
        let skillData: any = null;
        const staticIndex = row.static_index;
        
        if (row.name) {
          skillData = {
            id: staticIndex,
            name: row.name,
            type: row.type || 1,
            description: row.description || '',
            probability: row.probability || 100,
            upProbability: row.upProbability || 0,
            effID: row.effID || 1,
            effectValue: row.effectValue || 0,
            effectRange: row.effectRange || 1,
            needItemType: row.needItemType || 0,
          };
        } else if (skillsData[staticIndex]) {
          skillData = skillsData[staticIndex];
        }
        
        if (!skillData) {
          return {
            ID: staticIndex,
            HeroID: heroId,
            SkillLevel: row.skill_level || 1,
            EXP: row.exp || 1,
            StaticIndex: staticIndex,
            Name: `技能${staticIndex}`,
            Type: 1,
            Des: '',
            Probability: 100,
            EffID: 1,
            EffValue: 0,
            EffRange: 1,
            NeedItemType: 0,
          };
        }
        
        const skillLevel = row.skill_level || 1;
        return {
          ID: staticIndex,
          HeroID: heroId,
          SkillLevel: skillLevel,
          EXP: row.exp || 1,
          StaticIndex: staticIndex,
          Name: skillData.name || `技能${staticIndex}`,
          Type: skillData.type || 1,
          Des: skillData.description || '',
          Probability: Math.floor((skillData.probability || 100) + (skillData.upProbability || 0) * (heroLevel - 1) * 0.01),
          EffID: skillData.effID || 1,
          EffValue: Math.floor((skillData.effectValue || 0) * skillLevel),
          EffRange: skillData.effectRange || 1,
          NeedItemType: skillData.needItemType || 0,
        };
      });
      
      // 获取该武将的装备列表
      const heroItemRows = itemsMap.get(heroId) || [];
      const ItemList = heroItemRows.map((row: any) => {
        const configId = row.config_id;
        let itemData: any = null;
        
        if (row.Name) {
          itemData = {
            Index: configId,
            Name: row.Name,
            Type: row.Type || 1,
            Des: row.Des || '',
            Icon: row.Icon || '',
            Image: row.Icon || '',
            Price: row.Price || 0,
            Attack: row.EffectType === 1 ? (row.EffectValue || 0) : 0,
            Defence: row.EffectType === 2 ? (row.EffectValue || 0) : 0,
            Level: 1,
            Quality: 1,
            UseType: 1,
            UseLevel: 1,
            UseSex: 0,
            UseUnion: 0,
            HitPoint: 100,
            SellMoney: 0,
            SellFood: 0,
            FR: 0, LR: 0, CR: 0, DR: 0,
          };
        } else {
          itemData = itemsData.find((i: any) => i.Index === configId || i.ID === configId);
        }
        
        if (!itemData) {
          itemData = {};
        }
        
        return {
          ID: row.id,
          Name: itemData.Name || `物品${configId}`,
          ItemType: itemData.Type || 1,
          Des: itemData.Des || '',
          Level: itemData.Level || 1,
          Quality: itemData.Quality || 1,
          Price: itemData.Price || 0,
          UseType: itemData.UseType || 1,
          UseLevel: itemData.UseLevel || 1,
          UseSex: itemData.UseSex || 0,
          UseUnion: itemData.UseUnion || 0,
          HitPoint: itemData.HitPoint || 100,
          Durability: row.durability ?? itemData.HitPoint ?? 100,
          Attack: itemData.Attack || 0,
          Defence: itemData.Defence || 0,
          FR: itemData.FR || 0,
          LR: itemData.LR || 0,
          CR: itemData.CR || 0,
          DR: itemData.DR || 0,
          SellMoney: itemData.SellMoney || 0,
          SellFood: itemData.SellFood || 0,
          Image: itemData.Image || itemData.Icon || '',
          Icon: itemData.Icon || '',
          StaticIndex: configId,
          State: row.state || 0,
          UserName: row.wallet_address || '',
          CityID: row.city_id || 0,
        };
      });
      
      return {
        // 核心字段 (C# 驼峰命名)
        ID: h.id,
        Name: h.name,
        Level: h.level,
        Sex: h.sex || 1,
        Junta: h.junta || 1,
        Icon: h.icon || '/hero/1.gif',
        Image: h.image || '/hero/1.png',
        PortraitIndex: h.portrait_index || 1,
        AbilityIndex: h.ability_index || 1,
        CityID: h.city_id,
        UserName: walletAddress,
        Training: h.training || 0,
        DefencePos: h.defence_pos || -1,
        PrenticeNum: h.prentice_num || 0,
        HeroType: h.hero_type || 0,
        Quality: h.quality || 1,
        ExpCount: h.exp || 0,
        NoSkillReason: 0,
        PropertyCounteract: [0,0,0,0,0],
        WuXing: h.wu_xing || 1,
        UpTraining: h.up_training || 10,
        AutoExpGold: 0,
        AutoExpCount: 0,
        AutoExpResFood: 0,
        AutoExpResMoney: 0,
        AutoExpResMen: 0,
        AutoExpNum: 0,
        State: h.state || 0,
        CorpsID: h.corps_id || 0,
        LevelExp: h.exp || 0,
        Attack: h.attack || 10,
        Defence: h.defense || 5,
        CrushBlow: h.crush_blow || 0,
        Dodge: h.dodge || 0,
        MaxPrenticeNum: 5,
        AttackRange: h.attack_range || 1,
        MoveRange: h.move_range || 3,
        ResumeCostTime: 0,
        ResumeCostGold: 0,
        // 训练/招募成本
        TrainCostMoney: 100,
        TrainCostFood: 100,
        TrainCostMen: 10,
        TrainCostGold: 0,
        TrainCostTime: 3600,
        ConscriptionCostMoney: 200,
        ConscriptionCostFood: 200,
        ConscriptionCostMen: 20,
        ConscriptionCostGold: 0,
        ConscriptionCostTime: 7200,
        FastTrainCostMoney: 50,
        FastTrainCostFood: 50,
        FastTrainCostMen: 5,
        FastTrainCostGold: 10,
        FastTrainCostTime: 0,
        FastConscriptionCostMoney: 100,
        FastConscriptionCostFood: 100,
        FastConscriptionCostMen: 10,
        FastConscriptionCostGold: 20,
        FastConscriptionCostTime: 0,
        // 技能和装备列表
        SkillList,
        ItemList,
      };
    });

    return success(c, heroList);
  } catch (err: any) {
    return c.json({ success: false, error: err.message, stack: err.stack, name: err.name });
  }
});

// GetHeroByID - POST /hero/detail
// C# 签名: public HeroInfo GetHeroByID(int cityID, int heroID)
// 返回: HeroInfo (单个对象，不是数组)
app.post('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // 支持 city_id, hero_id (与前端一致)
  const { city_id, hero_id } = await c.req.json<{ city_id?: number; hero_id?: number }>();
  if (!hero_id) return error(c, 'hero_id is required');

  try {
    // C# 逻辑: GetHeroByID(userName, cityID, heroID)
    const hero = await db.prepare(`
      SELECT * FROM heroes 
      WHERE id = ? AND wallet_address = ? AND city_id = ?
    `).bind(hero_id, walletAddress, city_id).first();

    if (!hero) {
      return error(c, 'Hero not found', 404);
    }

    // 格式化为 C# HeroInfo 结构
    const h = hero as any;
    const heroLevel = h.level || 1;
    
    // 获取技能和装备列表
    const SkillList = await getHeroSkillList(db, h.id, heroLevel);
    const ItemList = await getHeroItemList(db, h.id);
    
    const heroInfo = {
      ID: h.id,
      Name: h.name,
      Level: h.level,
      Sex: h.sex || 1,
      Junta: h.junta || 1,
      Icon: h.icon || '/hero/1.gif',
      Image: h.image || '/hero/1.png',
      PortraitIndex: h.portrait_index || 1,
      AbilityIndex: h.ability_index || 1,
      CityID: h.city_id,
      UserName: walletAddress,
      Training: h.training || 0,
      DefencePos: h.defence_pos || -1,
      PrenticeNum: h.prentice_num || 0,
      HeroType: h.hero_type || 0,
      Quality: h.quality || 1,
      ExpCount: h.exp || 0,
      NoSkillReason: 0,
      PropertyCounteract: [0,0,0,0,0],
      WuXing: h.wu_xing || 1,
      UpTraining: h.up_training || 10,
      AutoExpGold: 0,
      AutoExpCount: 0,
      AutoExpResFood: 0,
      AutoExpResMoney: 0,
      AutoExpResMen: 0,
      AutoExpNum: 0,
      State: h.state || 0,
      CorpsID: h.corps_id || 0,
      LevelExp: h.exp || 0,
      Attack: h.attack || 10,
      Defence: h.defense || 5,
      CrushBlow: h.crush_blow || 0,
      Dodge: h.dodge || 0,
      MaxPrenticeNum: 5,
      AttackRange: h.attack_range || 1,
      MoveRange: h.move_range || 3,
      ResumeCostTime: 0,
      ResumeCostGold: 0,
      TrainCostMoney: 100,
      TrainCostFood: 100,
      TrainCostMen: 10,
      TrainCostGold: 0,
      TrainCostTime: 3600,
      ConscriptionCostMoney: 200,
      ConscriptionCostFood: 200,
      ConscriptionCostMen: 20,
      ConscriptionCostGold: 0,
      ConscriptionCostTime: 7200,
      FastTrainCostMoney: 50,
      FastTrainCostFood: 50,
      FastTrainCostMen: 5,
      FastTrainCostGold: 10,
      FastTrainCostTime: 0,
      FastConscriptionCostMoney: 100,
      FastConscriptionCostFood: 100,
      FastConscriptionCostMen: 10,
      FastConscriptionCostGold: 20,
      FastConscriptionCostTime: 0,
      SkillList,
      ItemList,
    };

    return success(c, heroInfo);
  } catch (err: any) {
    return error(c, err.message || 'Failed to get hero');
  }
});

// 招募武将
app.post('/recruit', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // C#: AddHero(userName, cityID, objID) - objID 是建筑槽位索引
  const { city_id, obj_id } = await c.req.json<{ city_id?: number; obj_id?: number }>();
  if (!city_id || !obj_id) return error(c, 'city_id and obj_id are required');

  const result = await heroService.recruit(db, walletAddress, city_id, obj_id);
  const r = result as any;
  if (!r.success) {
    return error(c, r.error || 'Failed to recruit hero', 500);
  }

  // 获取新创建的武将信息并返回
  const hero = await db.prepare(`
    SELECT * FROM heroes WHERE id = ?
  `).bind(r.heroId).first();

  if (!hero) {
    return error(c, 'Failed to get created hero', 500);
  }

  const h = hero as any;
  
  // 获取技能和装备列表
  const SkillList = await getHeroSkillList(db, h.id, h.level || 1);
  const ItemList = await getHeroItemList(db, h.id);
  
  return success(c, {
    ID: h.id,
    Name: h.name,
    Level: h.level,
    Sex: h.sex || 1,
    Junta: h.junta || 1,
    Icon: h.icon || '/hero/1.gif',
    Image: h.image || '/hero/1.png',
    PortraitIndex: h.portrait_index || 1,
    AbilityIndex: h.ability_index || 1,
    CityID: h.city_id,
    UserName: walletAddress,
    Training: h.training || 0,
    DefencePos: h.defence_pos || -1,
    PrenticeNum: h.prentice_num || 0,
    HeroType: h.hero_type || 0,
    Quality: h.quality || 1,
    ExpCount: h.exp || 0,
    NoSkillReason: 0,
    PropertyCounteract: [0,0,0,0,0],
    WuXing: h.wu_xing || 1,
    UpTraining: h.up_training || 10,
    AutoExpGold: 0,
    AutoExpCount: 0,
    AutoExpResFood: 0,
    AutoExpResMoney: 0,
    AutoExpResMen: 0,
    AutoExpNum: 0,
    State: h.state || 0,
    CorpsID: h.corps_id || 0,
    LevelExp: h.exp || 0,
    Attack: h.attack || 10,
    Defence: h.defense || 5,
    CrushBlow: h.crush_blow || 0,
    Dodge: h.dodge || 0,
    MaxPrenticeNum: 5,
    AttackRange: h.attack_range || 1,
    MoveRange: h.move_range || 3,
    ResumeCostTime: 0,
    ResumeCostGold: 0,
    TrainCostMoney: 100,
    TrainCostFood: 100,
    TrainCostMen: 10,
    TrainCostGold: 0,
    TrainCostTime: 3600,
    ConscriptionCostMoney: 200,
    ConscriptionCostFood: 200,
    ConscriptionCostMen: 20,
    ConscriptionCostGold: 0,
    ConscriptionCostTime: 7200,
    FastTrainCostMoney: 50,
    FastTrainCostFood: 50,
    FastTrainCostMen: 5,
    FastTrainCostGold: 10,
    FastTrainCostTime: 0,
    FastConscriptionCostMoney: 100,
    FastConscriptionCostFood: 100,
    FastConscriptionCostMen: 10,
    FastConscriptionCostGold: 20,
    FastConscriptionCostTime: 0,
    SkillList,
    ItemList,
  });
});

// 升级武将
app.post('/levelup', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id, city_id } = await c.req.json<{ hero_id?: number; city_id?: number }>();
  if (!hero_id) return error(c, 'hero_id is required');

  const result = await heroService.levelUp(db, walletAddress, hero_id);
  const r = result as any;
  if (!r.success) {
    return error(c, r.error || 'Failed to level up hero', 500);
  }

  return success(c, { newLevel: r.newLevel, expConsumed: r.expConsumed });
});

// 训练武将
app.post('/:heroId/train', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const heroId = parseInt(c.req.param('heroId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id } = await c.req.json<{ city_id?: number }>();
  if (!city_id) return error(c, 'city_id is required');

  const result = await heroService.train(db, walletAddress, city_id, heroId);
  const r = result as any;
  if (!r.success) {
    return error(c, r.error || 'Failed to train hero', 500);
  }

  return success(c, { trainingGain: r.trainingGain, newTraining: r.newTraining });
});

// 升级武将 (带heroId路径)
app.post('/:heroId/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const heroId = parseInt(c.req.param('heroId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await heroService.levelUp(db, walletAddress, heroId);
  const r = result as any;
  if (!r.success) {
    return error(c, r.error || 'Failed to upgrade hero', 500);
  }

  return success(c, { newLevel: r.newLevel, expConsumed: r.expConsumed });
});


// GetCityHero - GET /hero/list
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const cityId = city_id ? parseInt(city_id) : undefined;
    const result = await heroService.getList(db, walletAddress, { cityId });
    // getList returns { heroes: [], total: 0, page, pageSize }
    return success(c, result.heroes);
  } catch (err: any) {
    return error(c, err.message || 'Failed to get heroes');
  }
});

// GetHeroByID - GET /hero/detail
app.get('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!hero_id) return error(c, 'hero_id is required');
    
    const hero = await heroService.getDetail(db, parseInt(hero_id));
    if (!hero) {
      return error(c, 'Hero not found', 404);
    }

    return success(c, hero);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCanEenageHero - POST /hero/can-engage
// C# 签名: public HeroInfo[] GetCanEenageHero(int cityID, int union)
// 前端发送: city_id, building_type (building_type 对应 junta/union)
app.post('/can-engage', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, building_type, cityID } = await c.req.json();
  const cityId = city_id || cityID;

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // C# 逻辑: GetHeroByUnionBuilding - 获取待雇佣武将 (state=6, 按junta过滤)
    // building_type (junta) > 0 才过滤，否则返回所有待雇佣武将
    let query = `SELECT * FROM heroes WHERE wallet_address = ? AND city_id = ? AND state = 6`;
    const params: any[] = [walletAddress, cityId];

    if (building_type && building_type > 0) {
      query += ` AND junta = ?`;
      params.push(building_type);
    }

    query += ` ORDER BY quality DESC, level DESC`;

    const heroes = await db.prepare(query).bind(...params).all();

    // C# 约定: 没有可用武将时返回 [{ ID: -1 }]
    if (!heroes.results || heroes.results.length === 0) {
      return success(c, [{ ID: -1 }]);
    }

    // 格式化为 HeroInfo 数组
    const heroList = (heroes.results || []).map((h: any) => formatHeroInfo(h, walletAddress));
    return success(c, heroList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCanUseHero - POST /hero/can-use
// C# 签名: public HeroInfo[] GetCanUseHero(int cityID, int level, int sex, int junta)
// 前端发送: city_id, level, sex, union (union 对应 junta)
app.post('/can-use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, level, sex, union, cityID } = await c.req.json();
  const cityId = city_id || cityID;
  const filterLevel = parseInt(level) || 0;
  const filterSex = parseInt(sex) || 0;  // 0 = 不过滤
  const filterJunta = parseInt(union) || 0;  // 0 = 不过滤

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // C# 逻辑: GetItemHero - 获取可用武将 (state != 6, level >= level, sex过滤, junta过滤, CorpsID == 0)
    let query = `SELECT * FROM heroes WHERE wallet_address = ? AND city_id = ? AND state != 6`;
    const params: any[] = [walletAddress, cityId];

    if (filterLevel > 0) {
      query += ` AND level >= ?`;
      params.push(filterLevel);
    }

    if (filterSex > 0) {
      query += ` AND sex = ?`;
      params.push(filterSex);
    }

    if (filterJunta > 0) {
      query += ` AND junta = ?`;
      params.push(filterJunta);
    }

    // 必须不在帮派 (CorpsID == 0)
    query += ` AND (corps_id = 0 OR corps_id IS NULL)`;

    query += ` ORDER BY quality DESC, level DESC`;

    const heroes = await db.prepare(query).bind(...params).all();

    // C# 约定: 没有可用武将时返回 [{ ID: -1 }]
    if (!heroes.results || heroes.results.length === 0) {
      return success(c, [{ ID: -1 }]);
    }

    // 格式化为 HeroInfo 数组
    const heroList = (heroes.results || []).map((h: any) => formatHeroInfo(h, walletAddress));
    return success(c, heroList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// EngageHero - POST /hero/engage
// C#: public int EngageHero(int cityID, int heroID) 返回 0=成功
app.post('/engage', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { cityID, heroID, city_id, hero_id } = await c.req.json();
  const heroId = heroID || hero_id;
  const cityId = cityID || city_id;

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 1. 检查武将是否存在且处于可雇佣状态 (state=6为待雇佣)
    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();
    if (!hero) return c.json({ success: false, code: 105, message: '武将不存在' });
    if (hero.state !== 6) return c.json({ success: false, code: -1, message: '武将不在可雇佣状态' });

    // 2. 检查城市是否存在及资源
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityId, walletAddress).first();
    if (!city) return c.json({ success: false, code: -1, message: '城市不存在' });

    // 3. 检查当前武将数量 (state!=6表示已雇佣或训练中，state=6表示待雇佣)
    // 与heroService.getList保持一致: state != 6
    const heroCount: any = await db.prepare(`
      SELECT COUNT(*) as cnt FROM heroes WHERE wallet_address = ? AND state != 6
    `).bind(walletAddress).first();
    const maxHeroNum = 5;
    if ((heroCount?.cnt || 0) >= maxHeroNum) {
      return c.json({ success: false, code: 30135, message: '武将已达上限' });
    }

    // 4. 获取雇佣成本 (从heroes.json的Ability数组读取)
    // C#: XmlData.HeroAbility[heroSingle.AbilityIndex].EngageCostMoney/Men/Food/Gold
    const abilityIndex = hero.static_index || hero.config_id || 1;
    const abilityData = (heroesConfig.Ability || []).find((a: any) => a.Index === abilityIndex);
    const baseCost = abilityData || { EngageCostMoney: 40, EngageCostFood: 40, EngageCostMen: 1, EngageCostGold: 0 };
    const level = hero.level || 1;
    const engageCost = {
      money: (baseCost.EngageCostMoney || 40) * level,
      men: (baseCost.EngageCostMen || 1) * level,
      food: (baseCost.EngageCostFood || 40) * level,
      gold: baseCost.EngageCostGold || 0
    };

    // 5. 检查资源是否足够
    if ((city.money || 0) < engageCost.money) {
      return c.json({ success: false, code: -1, message: '铜钱不足' });
    }
    if ((city.population || 0) < engageCost.men) {
      return c.json({ success: false, code: -1, message: '人口不足' });
    }
    if ((city.food || 0) < engageCost.food) {
      return c.json({ success: false, code: -1, message: '粮食不足' });
    }

    // 6. 使用事务保证原子性 (防止竞态)
    const result = await db.prepare(`
      UPDATE cities SET
        money = money - ?,
        population = population - ?,
        food = food - ?
      WHERE id = ? AND wallet_address = ? AND money >= ? AND population >= ? AND food >= ?
    `).bind(engageCost.money, engageCost.men, engageCost.food, cityId, walletAddress, engageCost.money, engageCost.men, engageCost.food).run();

    if (!result.success || (result.meta?.changes || 0) === 0) {
      return c.json({ success: false, code: -1, message: '资源不足或状态已变化' });
    }

    // 7. 更新武将状态为已雇佣 (state=1为驻守)
    await db.prepare(`
      UPDATE heroes SET state = 1, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ? AND state = 6
    `).bind(heroId, walletAddress).run();

    return c.json({ success: true, code: 0, message: '雇佣成功' });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// FireTheHero - POST /hero/fire
// C#: public int FireTheHero(int cityID, int heroID) 返回 0=成功
app.post('/fire', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id, cityID, heroID } = await c.req.json();
  const heroId = hero_id || heroID;
  const cityId = city_id || cityID;

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 1. 检查武将是否存在
    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();
    if (!hero) return c.json({ success: false, code: 105, message: '武将不存在' });

    // 2. 检查武将状态 (state: 0=空闲, 1=驻守, 2=预备, 3=训练, 4=战斗, 8=重伤)
    // C#: IsHeroBattleState - 不能解雇战斗中的武将
    const battleStates = [4, 5, 6]; // 战斗中相关状态
    if (battleStates.includes(hero.state)) {
      return c.json({ success: false, code: 30158, message: '武将正在战斗中，无法解雇' });
    }

    // 3. 检查是否有装备 (C#: 如果有装备不能解雇)
    // 注意：items表有wallet_address字段，必须校验所有权
    const equippedItems: any = await db.prepare(`
      SELECT COUNT(*) as cnt FROM items WHERE hero_id = ? AND equipped = 1 AND wallet_address = ?
    `).bind(heroId, walletAddress).first();
    if ((equippedItems?.cnt || 0) > 0) {
      return c.json({ success: false, code: -2, message: '请先卸下武将装备' });
    }

    // 4. 清理相关的训练/驻守事件 (time_events)
    await db.prepare(`
      DELETE FROM time_events WHERE object_id = ? AND object_type = 4 AND wallet_address = ?
    `).bind(heroId, walletAddress).run();

    // 5. 删除武将
    await db.prepare(`
      DELETE FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).run();

    return c.json({ success: true, code: 0, message: '解雇成功' });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// UpdateHeroName - POST /hero/name
// C#: public int UpdateHeroName(int cityID, int heroID, string name) 返回 0=成功
app.post('/name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id, name } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    if (!name || name.length < 2 || name.length > 10) {
      return c.json({ success: false, code: 1, message: '武将名称必须为2-10个字符' });
    }

    await db.prepare(`
      UPDATE heroes SET name = ?, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(name, hero_id, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// AddHeroEvent - POST /hero/event
// C#: public int AddHeroEvent(int cityID, int actionType, int objType, int objID, int subjoin) 返回 0=成功
app.post('/event', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { cityID, actionType, objType, objID, subjoin, city_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 武将事件处理
    // actionType: 1=训练, 2=升级, 3=装备, 4=卸载装备
    switch (actionType) {
      case 1: // 训练
        await db.prepare(`
          UPDATE heroes SET exp = exp + 50, updated_at = datetime('now')
          WHERE id = ? AND wallet_address = ?
        `).bind(objID, walletAddress).run();
        break;
      case 2: // 升级
        await db.prepare(`
          UPDATE heroes SET level = level + 1, exp = 0, updated_at = datetime('now')
          WHERE id = ? AND wallet_address = ?
        `).bind(objID, walletAddress).run();
        break;
      case 3: // 装备
      case 4: // 卸载装备
        // 装备系统由 Item 模块处理
        break;
    }

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// AddHeroEventEx - POST /hero/event-ex
// C#: public int AddHeroEventEx(int cityID, int actionType, int objType, int objID, int subjoin, bool flag) 返回 0=成功
app.post('/event-ex', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { cityID, actionType, objType, objID, subjoin, flag, city_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 扩展事件处理 (与 AddHeroEvent 类似,但支持更多参数)
    switch (actionType) {
      case 1: // 训练
        const trainExp = subjoin || 50;
        await db.prepare(`
          UPDATE heroes SET exp = exp + ?, updated_at = datetime('now')
          WHERE id = ? AND wallet_address = ?
        `).bind(trainExp, objID, walletAddress).run();
        break;
      case 2: // 升级
        await db.prepare(`
          UPDATE heroes SET level = level + 1, exp = 0, updated_at = datetime('now')
          WHERE id = ? AND wallet_address = ?
        `).bind(objID, walletAddress).run();
        break;
    }

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// FireCanEenageHero - POST /hero/fire-can-engage
// C#: public int FireCanEenageHero(int cityID, int heroID) 返回 0=成功
app.post('/fire-can-engage', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 解雇可雇佣的武将 (将武将状态改为空闲)
    await db.prepare(`
      UPDATE heroes SET state = 0, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// GetUserHeros - GET /hero/user-heroes
// C# 签名: public ArenaWinnerInfo[] GetUserHeros(int npcPos)
// 前端发送: pos (npc位置)
// 注意: C# 返回 ArenaWinnerInfo[] (竞技场排行榜数据), 不是武将列表
// 目前简化处理: 返回武将列表数组 (格式化为 HeroInfo[])
app.get('/user-heroes', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos, username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 前端实际发送的是 pos (npcPos), 不是 username
    // 如果有 username 用 username 查，否则用 pos 查
    let walletAddr = walletAddress;
    
    if (username) {
      const user = await db.prepare(`
        SELECT wallet_address FROM characters WHERE name = ?
      `).bind(username).first();
      if (user) {
        walletAddr = (user as any).wallet_address;
      }
    }

    const heroes = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ?
      ORDER BY quality DESC, level DESC
    `).bind(walletAddr).all();

    // C# 约定: 没有数据时返回空数组
    if (!heroes.results || heroes.results.length === 0) {
      return success(c, []);
    }

    // 返回数组 (不是 { heroes: [], count: N })
    const heroList = (heroes.results || []).map((h: any) => formatHeroInfo(h, walletAddr));
    return success(c, heroList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeroCount - GET /hero/count
app.get('/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).first();

    // C# 语义: GetHeroCount() 返回页数 = (武将总数/20) + 1 (最大250页)
    // 前端 Taxis.js 用 result.value 作为 MaxPlayerPage
    const totalHeroes = (result as any)?.count || 0;
    const pageCount = Math.min(Math.ceil(totalHeroes / 20) + 1, 250);
    return c.json({ success: true, value: pageCount });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeroAutoExpBreak - GET /hero/auto-exp-break
app.get('/auto-exp-break', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, heroID, city_id, hero_id } = c.req.query();
  const cityId = cityID || city_id;
  const heroId = heroID || hero_id;

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取武将自动升级突破信息
    const hero = await db.prepare(`
      SELECT level, exp FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) {
      return error(c, '武将不存在');
    }

    const currentLevel = (hero as any).level;
    const currentExp = (hero as any).exp;
    const nextLevelExp = currentLevel * 100;
    const canBreak = currentExp >= nextLevelExp;

    return success(c, {
      heroId: heroID,
      level: currentLevel,
      exp: currentExp,
      nextLevelExp,
      canBreak,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetAutoExpPercent - GET /hero/auto-exp-percent
app.get('/auto-exp-percent', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取所有武将的平均经验百分比
    const heroes = await db.prepare(`
      SELECT level, exp FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).all();

    if (!heroes.results || heroes.results.length === 0) {
      return success(c, { percent: 0 });
    }

    let totalPercent = 0;
    for (const hero of heroes.results) {
      const h = hero as any;
      const nextLevelExp = h.level * 100;
      const percent = Math.min(100, (h.exp / nextLevelExp) * 100);
      totalPercent += percent;
    }

    const avgPercent = Math.floor(totalPercent / heroes.results.length);

    return success(c, {
      percent: avgPercent,
      heroCount: heroes.results.length,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetExpPer - GET /hero/exp-percent
app.get('/exp-percent', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { hero_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const hero = await db.prepare(`
      SELECT level, exp FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return error(c, '武将不存在');
    }

    // 计算经验百分比 (简化公式: 下一级需要 level * 100 经验)
    const currentLevel = (hero as any).level;
    const currentExp = (hero as any).exp;
    const nextLevelExp = currentLevel * 100;
    const percent = Math.min(100, Math.floor((currentExp / nextLevelExp) * 100));

    return success(c, {
      heroId: hero_id,
      level: currentLevel,
      exp: currentExp,
      nextLevelExp,
      percent,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// HeroFastHealth - POST /hero/fast-health
// C#: public int HeroFastHealth(int cityID, int heroID) 返回 0=成功
app.post('/fast-health', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 快速恢复武将生命值
    await db.prepare(`
      UPDATE heroes SET hp = max_hp, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// SetHeroDefence - POST /hero/set-defence
// C#: public int SetHeroDefence(int cityID, int heroID, int defencePos) 返回 0=成功
app.post('/set-defence', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id, defence_pos } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 设置武将到城防位置
    // 这里简化处理,实际应该更新 defence 表
    await db.prepare(`
      UPDATE heroes SET state = 2, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// DebusHeroEquip - POST /hero/unequip
// C#: public int DebusHeroEquip(int cityID, int heroID) 返回 0=成功
app.post('/unequip', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { cityID, heroID, city_id, hero_id } = await c.req.json();
  const heroId = heroID || hero_id;

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 卸载武将装备 (将装备的 hero_id 设为 null)
    await db.prepare(`
      UPDATE items SET hero_id = NULL, equipped = 0, updated_at = datetime('now')
      WHERE hero_id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// HeroExpToItem - POST /hero/exp-to-item
// C#: public int HeroExpToItem(int cityID, int heroID, int itemID) 返回 0=成功
app.post('/exp-to-item', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 将武将经验转换为物品
    const hero = await db.prepare(`
      SELECT exp FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return c.json({ success: false, code: 1, message: '武将不存在' });
    }

    const exp = (hero as any).exp;
    if (exp < 100) {
      return c.json({ success: false, code: 2, message: '经验不足' });
    }

    // 扣除经验
    await db.prepare(`
      UPDATE heroes SET exp = exp - 100, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    // 添加物品 (简化处理)
    await db.prepare(`
      INSERT INTO items (wallet_address, type, config_id, count, source, created_at)
      VALUES (?, 'consumable', ?, 1, 'hero_exp', datetime('now'))
    `).bind(walletAddress, item_id).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// GetHeroBySkillLevel - GET /hero/by-skill-level
app.get('/by-skill-level', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, skill_level } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 根据技能等级获取武将 (简化处理,实际应该关联 skills 表)
    const heroes = await db.prepare(`
      SELECT * FROM heroes 
      WHERE wallet_address = ? AND city_id = ?
      ORDER BY quality DESC, level DESC
    `).bind(walletAddress, city_id).all();

    return success(c, heroes.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetPerSistEffectFlags - GET /hero/persist-effect-flags
app.get('/persist-effect-flags', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取持续效果标记 (简化处理)
    // 实际应该查询 persist_effects 表
    return success(c, {
      effects: [],
      count: 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
