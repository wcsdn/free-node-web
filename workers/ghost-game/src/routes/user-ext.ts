import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { UserServiceExtension, SIGNIN_CONFIG, VIP_CONFIG, LEVEL_CONFIG } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) { return c.json({ success: true, data }); }
function error(c: any, msg: string, status = 400) { return c.json({ success: false, error: msg }, status); }

// ========== 基础功能（已存在）==========

app.get('/signin', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new UserServiceExtension(db).getSigninInfo(wallet);
  return success(c, result);
});

app.post('/signin', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new UserServiceExtension(db).signin(wallet);
  if (!result.success) return error(c, result.error);
  return success(c, result);
});

app.get('/vip', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new UserServiceExtension(db).getVipInfo(wallet);
  return success(c, result);
});

app.get('/stats', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new UserServiceExtension(db).getUserStats(wallet);
  return success(c, result);
});

// ========== 缺失方法补充 ==========

/**
 * GetUserInfoById - 根据用户钱包地址获取完整用户信息
 * 参考 jx/BLL/User.cs GetUserInfo(userName) + Main.aspx.cs GetUserInfo()
 */
app.get('/info', async (c) => {
  const wallet = await verifyWalletAuth(c);
  if (!wallet) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'DB not configured', 503);

  try {
    // 获取用户基础信息
    const user: any = await db.prepare(`
      SELECT u.*, c.id as city_id, c.name as city_name, c.money, c.food,
             c.population, c.prosperity, c.map_image, c.position
      FROM users u
      LEFT JOIN cities c ON c.wallet_address = u.wallet_address
      WHERE u.wallet_address = ?
    `).bind(wallet).first();

    if (!user) return error(c, 'User not found', 404);

    // 获取建筑数量
    const buildings: any = await db.prepare(`
      SELECT COUNT(*) as count FROM buildings WHERE wallet_address = ?
    `).bind(wallet).first();

    // 获取武将数量
    const heroes: any = await db.prepare(`
      SELECT COUNT(*) as count FROM heroes WHERE wallet_address = ?
    `).bind(wallet).first();

    // 获取科技数量（已解锁）
    const technics: any = await db.prepare(`
      SELECT COUNT(*) as count FROM technics WHERE user_name = ? AND technic_level > 0
    `).bind(wallet).first();

    // 获取装备/物品数量
    const items: any = await db.prepare(`
      SELECT COUNT(*) as count FROM items WHERE wallet_address = ?
    `).bind(wallet).first();

    // 获取用户设置
    const settings: any = await db.prepare(`
      SELECT * FROM user_settings WHERE wallet_address = ?
    `).bind(wallet).first();

    // VIP加成
    let vipBonus = { gold: 1.0, drop: 1.0 };
    if (user.vip_level > 0) {
      const vipLevel = VIP_CONFIG.LEVELS[user.vip_level as keyof typeof VIP_CONFIG.LEVELS];
      if (vipLevel) {
        vipBonus = { gold: vipLevel.goldBonus, drop: vipLevel.dropBonus };
      }
    }

    // 保护期剩余时间
    let protectRemain = 0;
    if (user.created_at) {
      const createTime = new Date(user.created_at).getTime();
      const protectDuration = 24 * 60 * 60 * 1000; // 24小时
      const endTime = createTime + protectDuration;
      protectRemain = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    }

    // 获取帮派信息（如果有）
    const org: any = await db.prepare(`
      SELECT o.*, om.position as member_position
      FROM user_orgs o
      JOIN org_members om ON om.org_id = o.id
      WHERE om.wallet_address = ?
      LIMIT 1
    `).bind(wallet).first();

    const nextExp = LEVEL_CONFIG.EXP_TABLE[user.level] || 0;

    return success(c, {
      // 用户基础信息
      id: user.id,
      walletAddress: user.wallet_address,
      username: user.username || '',
      level: user.level || 1,
      exp: user.exp || 0,
      nextExp,
      gold: user.gold || 0,
      gems: user.diamonds || 0,
      vipLevel: user.vip_level || 0,
      vipExp: user.vip_exp || 0,
      loginDays: user.login_days || 0,
      lastLogin: user.last_login || '',
      createdAt: user.created_at || '',
      // 城市信息
      city: user.city_id ? {
        id: user.city_id,
        name: user.city_name || '',
        money: user.money || 0,
        food: user.food || 0,
        population: user.population || 0,
        prosperity: user.prosperity || 0,
        mapImage: user.map_image || '',
        position: user.position || 0,
      } : null,
      // 统计数据
      stats: {
        buildingCount: (buildings as any)?.count || 0,
        heroCount: (heroes as any)?.count || 0,
        techCount: (technics as any)?.count || 0,
        itemCount: (items as any)?.count || 0,
      },
      // VIP加成
      vipBonus,
      // 保护期
      protectRemain,
      endProtect: protectRemain > 0
        ? new Date(Date.now() + protectRemain * 1000).toISOString()
        : null,
      // 帮派
      org: org ? {
        id: org.id,
        name: org.name || '',
        level: org.level || 1,
        position: org.member_position || 0,
      } : null,
      // 用户设置
      settings: settings ? {
        notifications: settings.notifications !== 0,
        sound: settings.sound !== 0,
        music: settings.music !== 0,
        autoSkill: settings.auto_skill === 1,
        autoFight: settings.auto_fight === 1,
      } : {
        notifications: true,
        sound: true,
        music: true,
        autoSkill: false,
        autoFight: false,
      },
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * GetUserInfoById - 根据用户名查询其他用户公开信息（查看别人）
 * 参考 jx/BLL/User.cs GetUserInfo(userName) - 简化公开信息
 */
app.get('/info/:username', async (c) => {
  // 此接口无需登录（查看他人信息），但需要限制查询范围
  const targetUsername = c.req.param('username');
  if (!targetUsername) return error(c, 'Missing username', 400);

  const db = c.env.DB;
  if (!db) return error(c, 'DB not configured', 503);

  try {
    // 通过用户名查找（username 可能是 display name）
    // 先通过 wallet_address 查找（如果有）
    const user: any = await db.prepare(`
      SELECT wallet_address, username, level, vip_level, created_at
      FROM users WHERE wallet_address = ? OR username = ?
      LIMIT 1
    `).bind(targetUsername, targetUsername).first();

    if (!user) return error(c, 'User not found', 404);

    // 获取城市信息
    const city: any = await db.prepare(`
      SELECT name, prosperity, map_image, position FROM cities WHERE wallet_address = ?
    `).bind((user as any).wallet_address).first();

    // 获取帮派信息
    const org: any = await db.prepare(`
      SELECT o.name, o.level FROM user_orgs o
      JOIN org_members om ON om.org_id = o.id
      WHERE om.wallet_address = ?
      LIMIT 1
    `).bind((user as any).wallet_address).first();

    return success(c, {
      username: (user as any).username || (user as any).wallet_address,
      level: (user as any).level || 1,
      vipLevel: (user as any).vip_level || 0,
      cityName: city?.name || '',
      prosperity: city?.prosperity || 0,
      mapImage: city?.map_image || '',
      orgName: org?.name || '',
      orgLevel: org?.level || 0,
      createdAt: (user as any).created_at || '',
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * UpdateUserSetting - 更新用户设置
 * 参考 jx/BLL/User.cs 中相关用户设置逻辑
 */
app.post('/settings', async (c) => {
  const wallet = await verifyWalletAuth(c);
  if (!wallet) return error(c, 'Unauthorized', 401);

  const {
    notifications,
    sound,
    music,
    auto_skill,
    auto_fight,
    guide_step,
    title,
  } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'DB not configured', 503);

  try {
    // 检查是否存在设置记录
    const existing: any = await db.prepare(`
      SELECT id FROM user_settings WHERE wallet_address = ?
    `).bind(wallet).first();

    if (existing) {
      // 更新
      const updates: string[] = [];
      const values: any[] = [];

      if (notifications !== undefined) {
        updates.push('notifications = ?');
        values.push(notifications ? 1 : 0);
      }
      if (sound !== undefined) {
        updates.push('sound = ?');
        values.push(sound ? 1 : 0);
      }
      if (music !== undefined) {
        updates.push('music = ?');
        values.push(music ? 1 : 0);
      }
      if (auto_skill !== undefined) {
        updates.push('auto_skill = ?');
        values.push(auto_skill ? 1 : 0);
      }
      if (auto_fight !== undefined) {
        updates.push('auto_fight = ?');
        values.push(auto_fight ? 1 : 0);
      }

      if (updates.length > 0) {
        values.push(wallet);
        await db.prepare(`
          UPDATE user_settings SET ${updates.join(', ')} WHERE wallet_address = ?
        `).bind(...values).run();
      }
    } else {
      // 创建新记录
      await db.prepare(`
        INSERT INTO user_settings (
          wallet_address, notifications, sound, music, auto_skill, auto_fight
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        wallet,
        notifications ? 1 : 0,
        sound ? 1 : 0,
        music ? 1 : 0,
        auto_skill ? 1 : 0,
        auto_fight ? 1 : 0
      ).run();
    }

    // 同时可更新用户的 guide_step 和 title
    const userUpdates: string[] = [];
    const userValues: any[] = [];

    if (guide_step !== undefined) {
      userUpdates.push('guide_step = ?');
      userValues.push(guide_step);
    }
    if (title !== undefined) {
      userUpdates.push('title = ?');
      userValues.push(title);
    }

    if (userUpdates.length > 0) {
      userValues.push(wallet);
      await db.prepare(`
        UPDATE users SET ${userUpdates.join(', ')}, updated_at = datetime('now')
        WHERE wallet_address = ?
      `).bind(...userValues).run();
    }

    return success(c, {
      message: 'Settings updated successfully',
      settings: {
        notifications: notifications ?? true,
        sound: sound ?? true,
        music: music ?? true,
        autoSkill: auto_skill ?? false,
        autoFight: auto_fight ?? false,
        guideStep: guide_step,
        title,
      },
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * GetUserStatistics - 获取用户综合统计数据（扩展版）
 * 参考 jx/BLL/User.cs 中各类统计方法
 */
app.get('/statistics', async (c) => {
  const wallet = await verifyWalletAuth(c);
  if (!wallet) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'DB not configured', 503);

  try {
    const user: any = await db.prepare(`
      SELECT level, exp, gold, diamonds, vip_level, vip_exp,
             login_days, last_login, created_at
      FROM users WHERE wallet_address = ?
    `).bind(wallet).first();

    if (!user) return error(c, 'User not found', 404);

    // 城市统计
    const cityStats: any = await db.prepare(`
      SELECT COUNT(*) as city_count, SUM(money) as total_money, SUM(food) as total_food,
             SUM(population) as total_population, AVG(prosperity) as avg_prosperity
      FROM cities WHERE wallet_address = ?
    `).bind(wallet).first();

    // 建筑统计（按类型分组）
    const buildingStats: any[] = (await db.prepare(`
      SELECT type, COUNT(*) as count, MAX(level) as max_level, SUM(level) as total_levels
      FROM buildings WHERE wallet_address = ?
      GROUP BY type
    `).bind(wallet).all()).results || [];

    // 武将统计
    const heroStats: any = await db.prepare(`
      SELECT COUNT(*) as hero_count, SUM(level) as total_levels,
             AVG(level) as avg_level, SUM(exp) as total_exp,
             SUM(hp) as total_hp, SUM(atk) as total_atk
      FROM heroes WHERE wallet_address = ?
    `).bind(wallet).first();

    // 科技统计
    const techStats: any = await db.prepare(`
      SELECT COUNT(*) as tech_count, SUM(technic_level) as total_levels,
             MAX(technic_level) as max_level
      FROM technics WHERE user_name = ? AND technic_level > 0
    `).bind(wallet).first();

    // 物品统计
    const itemStats: any = await db.prepare(`
      SELECT COUNT(*) as item_count, SUM(count) as total_items
      FROM items WHERE wallet_address = ?
    `).bind(wallet).first();

    // 战斗统计
    const battleStats: any = await db.prepare(`
      SELECT COUNT(*) as battle_count,
             SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as win_count,
             SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END) as lose_count,
             SUM(damage_dealt) as total_damage_dealt,
             SUM(reward_exp) as total_exp_gained
      FROM battle_records WHERE wallet_address = ?
    `).bind(wallet).first();

    // 任务统计
    const taskStats: any = await db.prepare(`
      SELECT COUNT(*) as total_tasks,
             SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as completed_tasks,
             SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as rewarded_tasks
      FROM user_tasks WHERE wallet_address = ?
    `).bind(wallet).first();

    // 邮件统计
    const mailStats: any = await db.prepare(`
      SELECT COUNT(*) as total_mail,
             SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_mail
      FROM mails WHERE wallet_address = ?
    `).bind(wallet).first();

    // 城防统计
    const defenceStats: any = await db.prepare(`
      SELECT COUNT(*) as defence_count, SUM(defence_level) as total_levels
      FROM defences WHERE wallet_address = ?
    `).bind(wallet).first();

    const nextExp = LEVEL_CONFIG.EXP_TABLE[user.level] || 0;

    return success(c, {
      // 用户等级信息
      user: {
        level: user.level || 1,
        exp: user.exp || 0,
        nextExp,
        expProgress: Math.floor(((user.exp || 0) / nextExp) * 100),
        gold: user.gold || 0,
        diamonds: user.diamonds || 0,
        vipLevel: user.vip_level || 0,
        vipExp: user.vip_exp || 0,
        loginDays: user.login_days || 0,
        lastLogin: user.last_login || '',
        createdAt: user.created_at || '',
      },
      // 城市统计
      cities: {
        count: (cityStats as any)?.city_count || 0,
        totalMoney: (cityStats as any)?.total_money || 0,
        totalFood: (cityStats as any)?.total_food || 0,
        totalPopulation: (cityStats as any)?.total_population || 0,
        avgProsperity: Math.round((cityStats as any)?.avg_prosperity || 0),
      },
      // 建筑统计
      buildings: {
        total: buildingStats.reduce((s: number, b: any) => s + (b.count || 0), 0),
        byType: buildingStats.reduce((m: Record<string, any>, b: any) => {
          m[b.type || 'unknown'] = { count: b.count, maxLevel: b.max_level, totalLevels: b.total_levels };
          return m;
        }, {}),
      },
      // 武将统计
      heroes: {
        count: (heroStats as any)?.hero_count || 0,
        totalLevels: (heroStats as any)?.total_levels || 0,
        avgLevel: Math.round((heroStats as any)?.avg_level || 0),
        totalExp: (heroStats as any)?.total_exp || 0,
        totalHp: (heroStats as any)?.total_hp || 0,
        totalAtk: (heroStats as any)?.total_atk || 0,
      },
      // 科技统计
      technics: {
        count: (techStats as any)?.tech_count || 0,
        totalLevels: (techStats as any)?.total_levels || 0,
        maxLevel: (techStats as any)?.max_level || 0,
      },
      // 物品统计
      items: {
        types: (itemStats as any)?.item_count || 0,
        totalCount: (itemStats as any)?.total_items || 0,
      },
      // 战斗统计
      battles: {
        total: (battleStats as any)?.battle_count || 0,
        wins: (battleStats as any)?.win_count || 0,
        losses: (battleStats as any)?.lose_count || 0,
        winRate: (battleStats as any)?.battle_count > 0
          ? Math.round(((battleStats as any)?.win_count / (battleStats as any)?.battle_count) * 100)
          : 0,
        totalDamage: (battleStats as any)?.total_damage_dealt || 0,
        totalExpGained: (battleStats as any)?.total_exp_gained || 0,
      },
      // 任务统计
      tasks: {
        total: (taskStats as any)?.total_tasks || 0,
        completed: (taskStats as any)?.completed_tasks || 0,
        rewarded: (taskStats as any)?.rewarded_tasks || 0,
      },
      // 邮件统计
      mails: {
        total: (mailStats as any)?.total_mail || 0,
        unread: (mailStats as any)?.unread_mail || 0,
      },
      // 城防统计
      defences: {
        count: (defenceStats as any)?.defence_count || 0,
        totalLevels: (defenceStats as any)?.total_levels || 0,
      },
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * UpdateUserSetting - POST /user-ext/settings 兼容别名
 */
app.post('/setting', async (c) => {
  // 转发到 /settings
  const wallet = await verifyWalletAuth(c);
  if (!wallet) return error(c, 'Unauthorized', 401);

  const body = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'DB not configured', 503);

  try {
    const existing: any = await db.prepare(`
      SELECT id FROM user_settings WHERE wallet_address = ?
    `).bind(wallet).first();

    const {
      notifications = true,
      sound = true,
      music = true,
      auto_skill = false,
      auto_fight = false,
    } = body;

    if (existing) {
      await db.prepare(`
        UPDATE user_settings SET notifications=?, sound=?, music=?, auto_skill=?, auto_fight=?
        WHERE wallet_address=?
      `).bind(
        notifications ? 1 : 0,
        sound ? 1 : 0,
        music ? 1 : 0,
        auto_skill ? 1 : 0,
        auto_fight ? 1 : 0,
        wallet
      ).run();
    } else {
      await db.prepare(`
        INSERT INTO user_settings (wallet_address, notifications, sound, music, auto_skill, auto_fight)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(wallet, notifications ? 1 : 0, sound ? 1 : 0, music ? 1 : 0, auto_skill ? 1 : 0, auto_fight ? 1 : 0).run();
    }

    return success(c, { message: 'Setting saved', notifications, sound, music, autoSkill: auto_skill, autoFight: auto_fight });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * GetUserSub - 获取用户详细信息（子信息）
 * 参考 jx/BLL/User.cs GetUserSub(userName)
 */
app.get('/sub', async (c) => {
  const wallet = await verifyWalletAuth(c);
  if (!wallet) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'DB not configured', 503);

  try {
    const user: any = await db.prepare(`
      SELECT u.*, c.id as city_id, c.name as city_name, c.prosperity
      FROM users u
      LEFT JOIN cities c ON c.wallet_address = u.wallet_address
      WHERE u.wallet_address = ?
    `).bind(wallet).first();

    if (!user) return error(c, 'User not found', 404);

    // 扩展字段（如果有）
    const subInfo: any = await db.prepare(`
      SELECT * FROM user_sub_info WHERE wallet_address = ?
    `).bind(wallet).first();

    // 军衔信息（根据繁荣度计算）
    const bloom = (user as any)?.prosperity || 0;
    const title = await getTitleByBloom(bloom);

    // 排名
    const rankResult: any = await db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM users WHERE level > (SELECT level FROM users WHERE wallet_address = ?)
    `).bind(wallet).first();

    // 联盟信息
    const orgInfo: any = await db.prepare(`
      SELECT o.name, o.level, om.position
      FROM user_orgs o
      JOIN org_members om ON om.org_id = o.id
      WHERE om.wallet_address = ?
      LIMIT 1
    `).bind(wallet).first();

    return success(c, {
      walletAddress: (user as any).wallet_address,
      username: (user as any).username || '',
      cityId: (user as any).city_id || 0,
      cityName: (user as any).city_name || '',
      bloom,
      title,
      rank: (rankResult as any)?.rank || 0,
      level: (user as any).level || 1,
      exp: (user as any).exp || 0,
      gold: (user as any).gold || 0,
      diamonds: (user as any).diamonds || 0,
      vipLevel: (user as any).vip_level || 0,
      loginDays: (user as any).login_days || 0,
      lastLogin: (user as any).last_login || '',
      createdAt: (user as any).created_at || '',
      // 扩展信息（如果有）
      subInfo: subInfo ? {
        birthday: (subInfo as any).birthday || '',
        province: (subInfo as any).province || '',
        city: (subInfo as any).city || '',
        constellation: (subInfo as any).constellation || '',
        brief: (subInfo as any).brief || '',
      } : null,
      // 联盟
      dep: orgInfo ? {
        name: (orgInfo as any).name || '',
        level: (orgInfo as any).level || 0,
        position: (orgInfo as any).position || 0,
      } : null,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

/**
 * 根据繁荣度计算军衔
 */
async function getTitleByBloom(bloom: number): Promise<string> {
  if (bloom >= 10000) return '武林盟主';
  if (bloom >= 5000) return '江湖大侠';
  if (bloom >= 2000) return '一方豪杰';
  if (bloom >= 1000) return '门派掌门';
  if (bloom >= 500) return '江湖新秀';
  if (bloom >= 200) return '初入江湖';
  if (bloom >= 50) return '市井小民';
  return '无名小卒';
}

export default app;
