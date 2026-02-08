/**
 * Ghost Game - Seed Data Generator (TypeScript)
 * Generates seed data for testing cities, heroes, items, and battles
 */

export interface SeedConfig {
  testWallets: string[];
  citiesPerWallet: number;
  heroesPerCity: number;
  itemsPerWallet: number;
}

const DEFAULT_CONFIG: SeedConfig = {
  testWallets: [
    '0xtest123456789abcdef123456789abcdef12',
    '0xtest23456789abcdef123456789abcdef123',
    '0xtest3456789abcdef123456789abcdef1234',
  ],
  citiesPerWallet: 2,
  heroesPerCity: 3,
  itemsPerWallet: 10,
};

export const HERO_CONFIGS = [
  { Name: '天王弟子', BaseHp: 100, BaseAtk: 50, BaseDef: 35 },
  { Name: '少林弟子', BaseHp: 120, BaseAtk: 45, Defense: 45 },
  { Name: '丐帮弟子', BaseHp: 90, BaseAtk: 55, BaseDef: 30 },
  { Name: '唐门弟子', BaseHp: 80, BaseAtk: 60, BaseDef: 25 },
  { Name: '逍遥弟子', BaseHp: 85, BaseAtk: 52, BaseDef: 32 },
];

export const ITEM_CONFIGS = [
  { ID: 1, Name: '生命药水', Type: 1, EffectType: 1, EffectValue: 100 },
  { ID: 2, Name: '经验丹', Type: 1, EffectType: 2, EffectValue: 500 },
  { ID: 3, Name: '金币袋', Type: 1, EffectType: 3, EffectValue: 1000 },
  { ID: 101, Name: '初级材料', Type: 2 },
  { ID: 102, Name: '中级材料', Type: 2 },
  { ID: 201, Name: '精良武器', Type: 3 },
];

export const BUILDING_CONFIGS = [
  { ID: 1, Name: '聚义厅', Type: 'interior' as const, Level: 5 },
  { ID: 2, Name: '民居', Type: 'interior' as const, Level: 3 },
  { ID: 3, Name: '银库', Type: 'interior' as const, Level: 4 },
  { ID: 4, Name: '粮仓', Type: 'interior' as const, Level: 2 },
  { ID: 5, Name: '校场', Type: 'interior' as const, Level: 1 },
  { ID: 101, Name: '城墙', Type: 'defense' as const, Level: 3 },
  { ID: 102, Name: '箭塔', Type: 'defense' as const, Level: 2 },
];

export function generateSeedSQL(config: SeedConfig = DEFAULT_CONFIG): string {
  const { testWallets, citiesPerWallet, heroesPerCity, itemsPerWallet } = config;
  
  let sql = `-- Ghost Game - Comprehensive Seed Data\n`;
  sql += `-- Generated at: ${new Date().toISOString()}\n\n`;
  
  // Characters
  sql += `-- ===========================================\n`;
  sql += `-- 1. TEST CHARACTERS\n`;
  sql += `-- ===========================================\n`;
  
  testWallets.forEach((wallet, index) => {
    const level = 5 + index * 5;
    const exp = level * 500;
    const gold = 20000 + index * 30000;
    const name = `测试玩家${index + 1}`;
    
    sql += `INSERT OR IGNORE INTO characters (wallet_address, name, level, exp, gold, vip_level)\n`;
    sql += `VALUES ('${wallet}', '${name}', ${level}, ${exp}, ${gold}, ${index});\n`;
  });
  
  sql += `\n`;
  
  // Cities
  sql += `-- ===========================================\n`;
  sql += `-- 2. TEST CITIES\n`;
  sql += `-- ===========================================\n`;
  
  testWallets.forEach((wallet, walletIndex) => {
    for (let cityIndex = 1; cityIndex <= citiesPerWallet; cityIndex++) {
      const cityId = walletIndex * citiesPerWallet + cityIndex;
      const name = cityIndex === 1 ? '主城' : `分城${cityIndex}`;
      const position = cityId;
      const prosperity = 50 + cityIndex * 25;
      const money = 20000 + cityIndex * 10000;
      const food = 20000 + cityIndex * 10000;
      const population = 300 + cityIndex * 200;
      const moneyRate = 80 + cityIndex * 20;
      const foodRate = 80 + cityIndex * 20;
      const populationRate = 50 + cityIndex * 25;
      
      sql += `INSERT OR IGNORE INTO cities (id, wallet_address, name, position, prosperity, money, food, population, money_rate, food_rate, population_rate)\n`;
      sql += `VALUES (${cityId}, '${wallet}', '${name}', ${position}, ${prosperity}, ${money}, ${food}, ${population}, ${moneyRate}, ${foodRate}, ${populationRate});\n`;
    }
  });
  
  sql += `\n`;
  
  // Buildings
  sql += `-- ===========================================\n`;
  sql += `-- 3. TEST BUILDINGS\n`;
  sql += `-- ===========================================\n`;
  
  let buildingId = 1;
  testWallets.forEach((wallet, walletIndex) => {
    for (let cityIndex = 1; cityIndex <= citiesPerWallet; cityIndex++) {
      const cityId = walletIndex * citiesPerWallet + cityIndex;
      
      // Main interior buildings
      BUILDING_CONFIGS.slice(0, 5).forEach((building, idx) => {
        const level = Math.min(building.Level, 2 + cityIndex);
        sql += `INSERT OR IGNORE INTO buildings (id, city_id, type, level, position, state, config_id)\n`;
        sql += `VALUES (${buildingId}, ${cityId}, '${building.Type}', ${level}, ${idx + 1}, 0, ${building.ID});\n`;
        buildingId++;
      });
    }
  });
  
  sql += `\n`;
  
  // Heroes
  sql += `-- ===========================================\n`;
  sql += `-- 4. TEST HEROES\n`;
  sql += `-- ===========================================\n`;
  
  let heroId = 1;
  testWallets.forEach((wallet, walletIndex) => {
    for (let cityIndex = 1; cityIndex <= citiesPerWallet; cityIndex++) {
      const cityId = walletIndex * citiesPerWallet + cityIndex;
      
      for (let heroIndex = 0; heroIndex < heroesPerCity; heroIndex++) {
        const heroConfig = HERO_CONFIGS[heroIndex % HERO_CONFIGS.length];
        const level = 3 + heroIndex + walletIndex;
        const quality = Math.min(4, 1 + Math.floor(level / 3));
        const hp = heroConfig.BaseHp * level * (1 + quality * 0.1);
        const attack = (heroConfig.BaseAtk || 40) * level * (1 + quality * 0.1);
        const defense = (heroConfig.BaseDef || 25) * level * (1 + quality * 0.1);
        const state = heroIndex === heroesPerCity - 1 ? 1 : 0; // Last hero guards
        
        sql += `INSERT OR IGNORE INTO heroes (id, wallet_address, city_id, name, level, exp, quality, hp, max_hp, attack, defense, config_id, state)\n`;
        sql += `VALUES (${heroId}, '${wallet}', ${cityId}, '${heroConfig.Name}', ${level}, ${level * 100}, ${quality}, ${Math.floor(hp)}, ${Math.floor(hp)}, ${Math.floor(attack)}, ${Math.floor(defense)}, ${heroIndex + 1}, ${state});\n`;
        heroId++;
      }
    }
  });
  
  sql += `\n`;
  
  // Items
  sql += `-- ===========================================\n`;
  sql += `-- 5. TEST ITEMS\n`;
  sql += `-- ===========================================\n`;
  
  let itemId = 1;
  testWallets.forEach((wallet) => {
    ITEM_CONFIGS.forEach((item, idx) => {
      const count = Math.floor(Math.random() * 20) + 5;
      const type = item.Type === 1 ? 'consumable' : item.Type === 2 ? 'material' : 'equipment';
      
      sql += `INSERT OR IGNORE INTO items (id, wallet_address, type, config_id, count, source)\n`;
      sql += `VALUES (${itemId}, '${wallet}', '${type}', ${item.ID}, ${count}, 'system');\n`;
      itemId++;
    });
  });
  
  sql += `\n`;
  
  // Battles
  sql += `-- ===========================================\n`;
  sql += `-- 6. TEST BATTLES\n`;
  sql += `-- ===========================================\n`;
  
  sql += `INSERT OR IGNORE INTO battles (attacker_address, defender_address, battle_type, result, report, reward_exp, reward_gold)\n`;
  sql += `VALUES \n`;
  sql += `('${testWallets[0]}', '${testWallets[1]}', 'pvp', 'win', '{"rounds": 5}', 500, 1000),\n`;
  sql += `('${testWallets[0]}', 'dungeon_1', 'pve', 'win', '{"rounds": 3}', 300, 500),\n`;
  sql += `('${testWallets[2]}', '${testWallets[0]}', 'pvp', 'loss', '{"rounds": 7}', 200, 400);\n`;
  
  return sql;
}

export function getTestWallet(index: number = 0): string {
  return DEFAULT_CONFIG.testWallets[index] || DEFAULT_CONFIG.testWallets[0];
}

export function getAllTestWallets(): string[] {
  return DEFAULT_CONFIG.testWallets;
}

export default {
  config: DEFAULT_CONFIG,
  heroConfigs: HERO_CONFIGS,
  itemConfigs: ITEM_CONFIGS,
  buildingConfigs: BUILDING_CONFIGS,
  generateSeedSQL,
  getTestWallet,
  getAllTestWallets,
};
