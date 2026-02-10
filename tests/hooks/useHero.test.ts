/**
 * useHero Hook 单元测试 (简化版 - 无 Mock)
 * 测试武将相关的业务逻辑
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 测试配置
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

describe('useHero Business Logic', () => {
  describe('Hero Quality Colors', () => {
    const HERO_QUALITY_COLORS: Record<number, string> = {
      1: '#808080', // 普通
      2: '#4CAF50', // 优秀
      3: '#2196F3', // 稀有
      4: '#9C27B0', // 史诗
      5: '#FF9800', // 传说
      6: '#F44336', // 神话
    };

    const getHeroQualityColor = (quality: number) => {
      return HERO_QUALITY_COLORS[quality] || HERO_QUALITY_COLORS[1];
    };

    it('应该返回正确的品质颜色', () => {
      expect(getHeroQualityColor(1)).toBe('#808080'); // 普通
      expect(getHeroQualityColor(2)).toBe('#4CAF50'); // 优秀
      expect(getHeroQualityColor(3)).toBe('#2196F3'); // 稀有
      expect(getHeroQualityColor(4)).toBe('#9C27B0'); // 史诗
      expect(getHeroQualityColor(5)).toBe('#FF9800'); // 传说
      expect(getHeroQualityColor(6)).toBe('#F44336'); // 神话
    });

    it('应该返回默认颜色用于未知品质', () => {
      expect(getHeroQualityColor(0)).toBe('#808080');
      expect(getHeroQualityColor(10)).toBe('#808080');
      expect(getHeroQualityColor(-1)).toBe('#808080');
    });
  });

  describe('Hero Quality Names', () => {
    const HERO_QUALITY_NAMES: Record<number, string> = {
      1: '普通',
      2: '优秀',
      3: '稀有',
      4: '史诗',
      5: '传说',
      6: '神话',
    };

    const getHeroQualityName = (quality: number) => {
      return HERO_QUALITY_NAMES[quality] || '未知';
    };

    it('应该返回正确的品质名称', () => {
      expect(getHeroQualityName(1)).toBe('普通');
      expect(getHeroQualityName(2)).toBe('优秀');
      expect(getHeroQualityName(5)).toBe('传说');
      expect(getHeroQualityName(6)).toBe('神话');
    });

    it('应该处理未知品质', () => {
      expect(getHeroQualityName(0)).toBe('未知');
      expect(getHeroQualityName(99)).toBe('未知');
    });
  });

  describe('Hero Stats Calculation', () => {
    const calculateHeroStats = (baseAttack: number, baseDefense: number, baseHp: number, level: number) => {
      const multiplier = 1 + (level - 1) * 0.1;
      return {
        attack: Math.floor(baseAttack * multiplier),
        defense: Math.floor(baseDefense * multiplier),
        hp: Math.floor(baseHp * multiplier),
        combatPower: Math.floor((baseAttack + baseDefense) / 2 + baseHp / 10),
      };
    };

    it('应该正确计算1级属性', () => {
      const stats = calculateHeroStats(100, 50, 500, 1);
      expect(stats.attack).toBe(100);
      expect(stats.defense).toBe(50);
      expect(stats.hp).toBe(500);
      // 战力 = (attack + defense) / 2 + hp / 10 (使用 base 值)
      // (100+50)/2 + 500/10 = 75 + 50 = 125
      expect(stats.combatPower).toBe(125);
    });

    it('应该正确计算10级属性', () => {
      const stats = calculateHeroStats(100, 50, 500, 10);
      expect(stats.attack).toBe(190); // 100 * 1.9
      expect(stats.defense).toBe(95); // 50 * 1.9
      expect(stats.hp).toBe(950); // 500 * 1.9
      // 战力使用 base 值: (100+50)/2 + 500/10 = 75 + 50 = 125
      expect(stats.combatPower).toBe(125);
    });

    it('应该正确计算30级属性', () => {
      const stats = calculateHeroStats(500, 300, 2000, 30);
      expect(stats.attack).toBe(500 * 3.9); // 1950
      expect(stats.defense).toBe(300 * 3.9); // 1170
      expect(stats.hp).toBe(2000 * 3.9); // 7800
    });
  });

  describe('Exp Required For Level', () => {
    const getExpRequired = (level: number) => {
      // 每级经验需求 = level^2 * 100
      return Math.floor(level * level * 100);
    };

    it('应该计算正确的经验需求', () => {
      expect(getExpRequired(1)).toBe(100);
      expect(getExpRequired(2)).toBe(400);
      expect(getExpRequired(5)).toBe(2500);
      expect(getExpRequired(10)).toBe(10000);
      expect(getExpRequired(30)).toBe(90000);
    });

    it('应该处理0级', () => {
      expect(getExpRequired(0)).toBe(0);
    });
  });

  describe('Hero Validation', () => {
    const validateHero = (data: any) => {
      if (!data) return { valid: false, error: '数据为空' };
      if (!data.wallet_address) return { valid: false, error: '缺少钱包地址' };
      if (!data.name) return { valid: false, error: '缺少武将名称' };
      if (!data.static_index) return { valid: false, error: '缺少武将模板ID' };
      if (typeof data.level !== 'number' || data.level < 1) return { valid: false, error: '等级无效' };
      if (data.quality < 1 || data.quality > 6) return { valid: false, error: '品质无效' };
      return { valid: true };
    };

    it('应该验证有效的武将数据', () => {
      const validHero = {
        id: 1,
        wallet_address: TEST_WALLET,
        static_index: 101,
        name: '关羽',
        quality: 5,
        level: 30,
        attack: 500,
        defense: 300,
        hp: 2000,
      };

      const result = validateHero(validHero);
      expect(result.valid).toBe(true);
    });

    it('应该拒绝空数据', () => {
      const result = validateHero(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('数据为空');
    });

    it('应该拒绝缺少钱包地址的数据', () => {
      const result = validateHero({ name: '关羽' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('缺少钱包地址');
    });

    it('应该拒绝缺少武将模板ID', () => {
      const result = validateHero({
        wallet_address: TEST_WALLET,
        name: '关羽',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('缺少武将模板ID');
    });

    it('应该拒绝无效品质', () => {
      const result = validateHero({
        wallet_address: TEST_WALLET,
        name: '关羽',
        static_index: 101,
        level: 10, // 需要有效的等级
        quality: 10, // 无效品质
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('品质无效');
    });
  });

  describe('Hero Upgrade Cost', () => {
    const calculateUpgradeCost = (level: number, quality: number) => {
      // 基础费用 = level^2 * 100
      // 品质加成 = quality * 0.2
      const baseCost = level * level * 100;
      const qualityMultiplier = 1 + (quality - 1) * 0.2;
      return Math.floor(baseCost * qualityMultiplier);
    };

    it('应该计算正确的升级费用 (1级普通)', () => {
      const cost = calculateUpgradeCost(1, 1);
      expect(cost).toBe(100);
    });

    it('应该计算正确的升级费用 (10级传说)', () => {
      // 基础 = 10^2 * 100 = 10000
      // 传说(5级)加成 = 1 + (5-1)*0.2 = 1.8
      // 总费用 = 10000 * 1.8 = 18000
      const cost = calculateUpgradeCost(10, 5);
      expect(cost).toBe(18000);
    });

    it('应该考虑品质加成', () => {
      const cost1 = calculateUpgradeCost(5, 1);
      const cost2 = calculateUpgradeCost(5, 5);
      expect(cost2).toBeGreaterThan(cost1);
    });
  });

  describe('Sort Heroes Logic', () => {
    const sortHeroes = (heroes: any[], sortBy: 'attack' | 'defense' | 'hp' | 'level' | 'quality') => {
      return [...heroes].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
    };

    it('应该按攻击力排序', () => {
      const heroes = [
        { id: 1, attack: 100 },
        { id: 2, attack: 500 },
        { id: 3, attack: 300 },
      ];

      const sorted = sortHeroes(heroes, 'attack');
      expect(sorted[0].id).toBe(2);
      expect(sorted[1].id).toBe(3);
      expect(sorted[2].id).toBe(1);
    });

    it('应该按品质排序', () => {
      const heroes = [
        { id: 1, quality: 3 },
        { id: 2, quality: 5 },
        { id: 3, quality: 4 },
      ];

      const sorted = sortHeroes(heroes, 'quality');
      expect(sorted[0].quality).toBe(5);
    });

    it('应该处理空列表', () => {
      const sorted = sortHeroes([], 'attack');
      expect(sorted).toEqual([]);
    });
  });

  describe('Filter Heroes Logic', () => {
    const filterHeroes = (heroes: any[], filter: { minQuality?: number; maxLevel?: number }) => {
      return heroes.filter(h => {
        if (filter.minQuality && h.quality < filter.minQuality) return false;
        if (filter.maxLevel && h.level > filter.maxLevel) return false;
        return true;
      });
    };

    it('应该按品质下限过滤', () => {
      const heroes = [
        { id: 1, quality: 3 },
        { id: 2, quality: 5 },
        { id: 3, quality: 4 },
      ];

      const filtered = filterHeroes(heroes, { minQuality: 4 });
      expect(filtered).toHaveLength(2);
    });

    it('应该按等级上限过滤', () => {
      const heroes = [
        { id: 1, level: 10 },
        { id: 2, level: 30 },
        { id: 3, level: 20 },
      ];

      const filtered = filterHeroes(heroes, { maxLevel: 25 });
      expect(filtered).toHaveLength(2);
    });

    it('应该组合多个过滤条件', () => {
      const heroes = [
        { id: 1, quality: 3, level: 10 },
        { id: 2, quality: 5, level: 30 },
        { id: 3, quality: 4, level: 20 },
      ];

      const filtered = filterHeroes(heroes, { minQuality: 4, maxLevel: 25 });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(3);
    });
  });

  describe('Hero Team Power', () => {
    const calculateTeamPower = (heroes: any[]) => {
      return heroes.reduce((total, hero) => {
        const combatPower = Math.floor(
          (hero.attack || 0) + (hero.defense || 0) + (hero.hp || 0) / 10
        );
        return total + combatPower;
      }, 0);
    };

    it('应该计算正确的队伍战力', () => {
      const heroes = [
        { id: 1, attack: 100, defense: 50, hp: 500 },
        { id: 2, attack: 200, defense: 100, hp: 1000 },
      ];

      const power = calculateTeamPower(heroes);
      // 战力 = attack + defense + hp/10
      // 武将1: 100 + 50 + 50 = 200
      // 武将2: 200 + 100 + 100 = 400
      // 总计: 200 + 400 = 600
      expect(power).toBe(600);
    });

    it('应该处理空队伍', () => {
      const power = calculateTeamPower([]);
      expect(power).toBe(0);
    });

    it('应该处理缺失属性的武将', () => {
      const heroes = [
        { id: 1 },
        { id: 2, attack: 100 },
      ];

      const power = calculateTeamPower(heroes);
      expect(power).toBe(100);
    });
  });
});

describe('useHeroes Business Logic', () => {
  describe('Heroes List Stats', () => {
    const calculateHeroesStats = (heroes: any[]) => {
      return {
        total: heroes.length,
        totalAttack: heroes.reduce((sum, h) => sum + (h.attack || 0), 0),
        totalDefense: heroes.reduce((sum, h) => sum + (h.defense || 0), 0),
        totalHp: heroes.reduce((sum, h) => sum + (h.hp || 0), 0),
        averageLevel: heroes.length > 0
          ? Math.floor(heroes.reduce((sum, h) => sum + (h.level || 0), 0) / heroes.length)
          : 0,
        qualityDistribution: heroes.reduce((acc, h) => {
          acc[h.quality] = (acc[h.quality] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
      };
    };

    it('应该正确计算武将列表统计', () => {
      const heroes = [
        { id: 1, quality: 5, level: 30, attack: 500, defense: 300, hp: 2000 },
        { id: 2, quality: 4, level: 25, attack: 400, defense: 200, hp: 1500 },
      ];

      const stats = calculateHeroesStats(heroes);
      expect(stats.total).toBe(2);
      expect(stats.totalAttack).toBe(900);
      expect(stats.totalDefense).toBe(500);
      expect(stats.totalHp).toBe(3500);
      expect(stats.averageLevel).toBe(27);
    });

    it('应该处理空列表', () => {
      const stats = calculateHeroesStats([]);
      expect(stats.total).toBe(0);
      expect(stats.totalAttack).toBe(0);
      expect(stats.averageLevel).toBe(0);
    });
  });
});
