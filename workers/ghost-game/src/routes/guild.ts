/**
 * 帮派系统路由
 * 实现帮派创建、成员管理、捐献等功能
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { GUILD_CONFIG, ORG_EFFECT_CONFIG, getOrgUpgradeCost } from '../config/game-config';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// ==================== 帮派资源类型定义 (参考 jx/BLL/Organize.cs) ====================
// C# 帮派专属资源: Pearl=珍珠, Crystal=水晶, Agate=玛瑙, WBowlder=白灵石, BBowlder=黑灵石, Crusade=圣战, JadeBook=玉书
export type OrgResType = 'pearl' | 'crystal' | 'agate' | 'wbowlder' | 'bbowlder' | 'crusade' | 'jadebook';

// C# Privilege 定义: 0=试炼, 1=成员, 2=长老, 3=副帮主, 4=帮主
export type PrivilegeLevel = 0 | 1 | 2 | 3 | 4;

// C# State 定义: 0=试炼(待审批), 1=正式成员
export type MemberState = 0 | 1;

// 角色字符串转 Privilege (参考 jx/Model/DBOrgMembers.cs)
export function roleToPrivilege(role: string): PrivilegeLevel {
  switch (role) {
    case 'leader': return 4;   // 帮主
    case 'officer': return 3;  // 副帮主
    case 'elder': return 2;    // 长老
    case 'member': return 1;   // 普通成员
    default: return 0;          // 试炼成员
  }
}

// Privilege 转角色字符串
export function privilegeToRole(privilege: PrivilegeLevel): string {
  switch (privilege) {
    case 4: return 'leader';
    case 3: return 'officer';
    case 2: return 'elder';
    case 1: return 'member';
    default: return 'trial'; // 试炼成员
  }
}

// 检查成员是否是正式成员 (State = 1)
export function isFormalMember(state: number): boolean {
  return state === 1;
}

/**
 * 根据帮派等级获取成员上限 (参考 jx/Model/XmlOrgnizeEffect.cs)
 * 对应 C#: XmlData.OrgnizeEffect[OrgLevel].MemberShipNum
 */
function getOrgMemberShipNum(orgLevel: number): number {
  const entry = ORG_EFFECT_CONFIG[orgLevel];
  if (entry) return entry.memberShipNum;
  // 线性插值：每级+2
  if (orgLevel < 1) return 20;
  if (orgLevel <= 10) return 20 + (orgLevel - 1) * 2;
  return 100; // 上限
}

/**
 * 根据帮派等级获取官员数量 (参考 jx/Model/XmlOrgnizeEffect.cs)
 * 对应 C#: XmlData.OrgnizeEffect[OrgLevel].OfficialNum
 */
function getOrgOfficialNum(orgLevel: number): number {
  const entry = ORG_EFFECT_CONFIG[orgLevel];
  if (entry) return entry.officialNum;
  if (orgLevel < 1) return 1;
  if (orgLevel <= 10) return 2;
  if (orgLevel <= 20) return 3;
  if (orgLevel <= 40) return 4;
  return 5;
}

// ==================== 已实现的 API ====================

// 获取我的帮派
app.get('/my', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const guildMember: any = await db.prepare(`
      SELECT gm.*, g.name as guild_name, g.level, g.notice, g.insignia
      FROM guild_members gm
      JOIN guilds g ON gm.guild_id = g.id
      WHERE gm.wallet_address = ?
    `).bind(walletAddress).first();

    if (!guildMember) {
      return success(c, { hasGuild: false });
    }

    const memberCount: any = await db.prepare(`
      SELECT COUNT(*) as count FROM guild_members WHERE guild_id = ?
    `).bind(guildMember.guild_id).first();

    return success(c, {
      hasGuild: true,
      guild: {
        id: guildMember.guild_id,
        name: guildMember.guild_name,
        level: guildMember.level,
        notice: guildMember.notice,
        insignia: guildMember.insignia,
        memberCount: (memberCount as any).count,
      },
      role: guildMember.role,
      contribution: guildMember.contribution,
      joinedAt: guildMember.joined_at,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取帮派列表
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { search_word, page, page_size } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let query = `
      SELECT g.*, 
        (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id) as member_count,
        (SELECT wallet_address FROM guild_members WHERE guild_id = g.id AND role = 'leader') as leader_address
      FROM guilds g
    `;
    const params: any[] = [];

    if (search_word) {
      query += ' WHERE g.name LIKE ?';
      params.push(`%${search_word}%`);
    }

    query += ' ORDER BY g.level DESC, g.id ASC LIMIT 50';

    const guilds = await db.prepare(query).bind(...params).all();

    const guildList = (guilds.results || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      level: g.level,
      memberCount: g.member_count,
      notice: g.notice,
      insignia: g.insignia,
      isFull: g.member_count >= 50,
    }));

    return success(c, guildList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 创建帮派
// 参考 jx/BLL/Organize.cs CreateOrganize
app.post('/create', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, name, intro } = await c.req.json();
  if (!name || name.length < 2) {
    return error(c, '帮派名称过短');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // ============ 参考 C# Organize.CreateOrganize 的校验逻辑 ============

  // 1. 检查帮派名称非法前缀 (Mail.CheckLawlessWords 逻辑，参考 GUILD_CONFIG)
  for (const word of GUILD_CONFIG.ILLEGAL_NAME_PREFIX) {
    if (name.startsWith(word)) {
      return error(c, '帮派名称包含非法字符');
    }
  }

  // 2. 检查名称只能包含中文、英文、数字 (与 C# 逻辑一致)
  for (let i = 0; i < name.length; i++) {
    const ch = name.charCodeAt(i);
    const isLower = ch >= 97 && ch <= 122;       // a-z
    const isUpper = ch >= 65 && ch <= 90;        // A-Z
    const isDigit = ch >= 48 && ch <= 57;        // 0-9
    const isChinese = ch >= 0x4E00 && ch <= 0x9FA5;
    if (!isLower && !isUpper && !isDigit && !isChinese) {
      return error(c, '帮派名称只能包含中文、英文和数字');
    }
  }

  // 3. C# 限制帮派名称长度 <= 5 (使用 GUILD_CONFIG.NAME_MAX_LENGTH)
  if (name.length > GUILD_CONFIG.NAME_MAX_LENGTH) {
    return error(c, `帮派名称不能超过${GUILD_CONFIG.NAME_MAX_LENGTH}个字符`);
  }

  // 4. 简介长度检查 (使用 GUILD_CONFIG.INTRO_MAX_LENGTH)
  if (intro && intro.length > GUILD_CONFIG.INTRO_MAX_LENGTH) {
    return error(c, `帮派简介不能超过${GUILD_CONFIG.INTRO_MAX_LENGTH}字符`);
  }

  try {
    // 检查是否已加入帮派
    const existingMember: any = await db.prepare(`
      SELECT guild_id FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existingMember) {
      return error(c, '您已加入其他帮派，无法创建');
    }

    // 检查名称唯一性
    const existingName: any = await db.prepare(`
      SELECT id FROM guilds WHERE name = ?
    `).bind(name).first();

    if (existingName) {
      return error(c, '帮派名称已被占用');
    }

    // 5. 检查玩家城市等级 >= 8 (C#: GetUserLevelByUserName < 8 => 520)
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, '您还没有城市');

    if ((city as any).level < GUILD_CONFIG.CREATE_MIN_CITY_LEVEL) {
      return error(c, `城市等级不足${GUILD_CONFIG.CREATE_MIN_CITY_LEVEL}级，无法创建帮派`);
    }

    // 6. 检查资源是否足够 (使用 GUILD_CONFIG 配置，参考 jx/BLL/Organize.cs CreateOrganize)
    const needMoney = GUILD_CONFIG.CREATE_ORG_NEED_MONEY;
    const needGrain = GUILD_CONFIG.CREATE_ORG_NEED_GRIN;
    const needMen = GUILD_CONFIG.CREATE_ORG_NEED_MEN;

    if ((city as any).money < needMoney) {
      return error(c, `金币不足，创建帮派需要${needMoney}金币`);
    }
    if ((city as any).food < needGrain) {
      return error(c, `粮食不足，创建帮派需要${needGrain}粮食`);
    }
    if ((city as any).population < needMen) {
      return error(c, `人口不足，创建帮派需要${needMen}人口`);
    }

    // 扣除资源
    await db.prepare(`
      UPDATE cities SET money = money - ?, food = food - ?, population = population - ?
      WHERE wallet_address = ?
    `).bind(needMoney, needGrain, needMen, walletAddress).run();

    // 创建帮派
    const result = await db.prepare(`
      INSERT INTO guilds (name, leader_address, notice, member_count)
      VALUES (?, ?, '欢迎加入', 1)
    `).bind(name, walletAddress).run();

    const guildId = result.meta.last_row_id;

    await db.prepare(`
      INSERT INTO guild_members (guild_id, wallet_address, role, contribution)
      VALUES (?, ?, 'leader', 0)
    `).bind(guildId, walletAddress).run();

    return success(c, {
      id: guildId,
      name,
      message: '帮派创建成功',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetMyOrgnizeInfo - GET /guild/my-info
app.get('/my-info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let guildMember: any = null;
    let guild: any = null;

    try {
      guildMember = await db.prepare(`
        SELECT * FROM guild_members WHERE wallet_address = ?
      `).bind(walletAddress).first();

      if (guildMember) {
        guild = await db.prepare(`
          SELECT * FROM guilds WHERE id = ?
        `).bind(guildMember.guild_id).first();
      }
    } catch (dbErr) {
      console.log('[Guild] Tables not exist, returning null');
    }

    if (!guildMember || !guild) {
      return success(c, {
        MyOrganize: null,
        MyMember: null,
        MyOrgEffectInfo: null,
        BossName: null,
      });
    }

    const leader: any = await db.prepare(`
      SELECT gm.wallet_address as leader_address
      FROM guild_members gm WHERE gm.guild_id = ? AND gm.role = 'leader'
    `).bind(guild.id).first();

    const orgInfo = {
      MyOrganize: {
        UID: guild.id,
        OrgName: guild.name,
        OrgLevel: guild.level || 1,
        Membership: guild.member_count || 1,
        MaxMembership: getOrgMemberShipNum(guild.level || 1),
        OfficialNumber: getOrgOfficialNum(guild.level || 1),
        Affiche: guild.notice || '',
        Intro: guild.notice || '',
      },
      MyMember: {
        UID: guildMember.id,
        UserName: walletAddress,
        // C# Privilege: 0=试炼, 1=成员, 2=长老, 3=副帮主, 4=帮主
        Privilege: roleToPrivilege(guildMember.role),
        Contribution: guildMember.contribution || 0,
        JoinTime: guildMember.joined_at,
      },
      MyOrgEffectInfo: {
        MoneyPer: 0,
        FoodPer: 0,
        MenPer: 0,
        AttackPer: 0,
        DefencePer: 0,
      },
      BossName: leader?.leader_address ? `玩家${leader.leader_address.slice(0, 6)}` : '未知',
    };

    return success(c, orgInfo);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取帮派详情
app.get('/:guildId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const guildId = parseInt(c.req.param('guildId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guildId).first();

    if (!guild) return error(c, '帮派不存在', 404);

    const members = await db.prepare(`
      SELECT gm.*, c.level, c.vip_level
      FROM guild_members gm
      LEFT JOIN characters c ON gm.wallet_address = c.wallet_address
      WHERE gm.guild_id = ?
      ORDER BY gm.contribution DESC, gm.joined_at ASC
    `).bind(guildId).all();

    return success(c, {
      id: guild.id,
      name: guild.name,
      level: guild.level,
      notice: guild.notice,
      insignia: guild.insignia,
      memberCount: guild.member_count,
      members: (members.results || []).map((m: any) => ({
        address: m.wallet_address,
        name: m?.level ? `玩家${m.wallet_address.slice(0, 6)}` : '未知',
        role: m.role,
        contribution: m.contribution,
        joinedAt: m.joined_at,
      })),
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 加入帮派（直接加入，无需审批）
app.post('/:guildId/join', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const guildId = parseInt(c.req.param('guildId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const existingMember: any = await db.prepare(`
      SELECT guild_id FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existingMember) {
      return error(c, '您已加入其他帮派');
    }

    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guildId).first();

    if (!guild) return error(c, '帮派不存在', 404);

    if (guild.member_count >= 50) {
      return error(c, '帮派已满员');
    }

    await db.prepare(`
      INSERT INTO guild_members (guild_id, wallet_address, role, contribution)
      VALUES (?, ?, 'member', 0)
    `).bind(guildId, walletAddress).run();

    await db.prepare(`
      UPDATE guilds SET member_count = member_count + 1 WHERE id = ?
    `).bind(guildId).run();

    return success(c, {
      guildId,
      guildName: guild.name,
      message: '加入帮派成功',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 退出帮派
app.post('/leave', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const member: any = await db.prepare(`
      SELECT gm.*, g.name as guild_name
      FROM guild_members gm
      JOIN guilds g ON gm.guild_id = g.id
      WHERE gm.wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) {
      return error(c, '您未加入任何帮派');
    }

    if (member.role === 'leader') {
      return error(c, '帮主不能直接退出，请先转让帮主');
    }

    await db.prepare(`
      DELETE FROM guild_members WHERE wallet_address = ? AND guild_id = ?
    `).bind(walletAddress, member.guild_id).run();

    await db.prepare(`
      UPDATE guilds SET member_count = member_count - 1 WHERE id = ?
    `).bind(member.guild_id).run();

    return success(c, {
      message: '已退出帮派',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 帮派捐献
app.post('/:guildId/donate', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const guildId = parseInt(c.req.param('guildId'));
  const { resource_type, amount } = await c.req.json();

  if (!resource_type || !amount || amount <= 0) {
    return error(c, '请输入有效的捐献数量');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const member: any = await db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guildId, walletAddress).first();

    if (!member) return error(c, '您不是该帮派成员');

    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, '您还没有城市');

    let resourceField = resource_type === 'money' ? 'money' :
                        resource_type === 'food' ? 'food' : 'population';

    if ((city as any)[resourceField] < amount) {
      return error(c, `您的${resource_type}不足`);
    }

    await db.prepare(`
      UPDATE cities SET ${resourceField} = ${resourceField} - ? WHERE wallet_address = ?
    `).bind(amount, walletAddress).run();

    const contribution = Math.floor(amount / 100);

    await db.prepare(`
      UPDATE guild_members SET contribution = contribution + ?
      WHERE guild_id = ? AND wallet_address = ?
    `).bind(contribution, guildId, walletAddress).run();

    return success(c, {
      resourceType: resource_type,
      amount,
      contribution,
      message: `捐献成功，获得 ${contribution} 点贡献度`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ==================== 待实现的 API（完整实现）====================

// ApplyJoinUnion - POST /guild/apply（申请加入帮派，需要帮主审批）
app.post('/apply', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id } = await c.req.json();
  if (!guild_id) return error(c, '请提供帮派ID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查是否已有帮派
    const existingMember: any = await db.prepare(`
      SELECT guild_id FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existingMember) {
      return error(c, '您已加入其他帮派，无法申请');
    }

    // 检查帮派是否存在且未满
    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guild_id).first();

    if (!guild) return error(c, '帮派不存在', 404);

    if (guild.member_count >= 50) {
      return error(c, '帮派已满员');
    }

    // 检查是否有待处理的申请
    const existingApp: any = await db.prepare(`
      SELECT id, status FROM guild_applications
      WHERE guild_id = ? AND wallet_address = ? AND status = 'pending'
    `).bind(guild_id, walletAddress).first();

    if (existingApp) {
      return error(c, '您已提交过申请，请等待审批');
    }

    // 尝试插入申请（可能因 UNIQUE 约束失败）
    try {
      await db.prepare(`
        INSERT INTO guild_applications (guild_id, wallet_address, status)
        VALUES (?, ?, 'pending')
      `).bind(guild_id, walletAddress).run();
    } catch (insertErr: any) {
      if (insertErr.message.includes('UNIQUE')) {
        return error(c, '您已提交过申请，请等待审批');
      }
      throw insertErr;
    }

    return success(c, {
      guildId: guild_id,
      guildName: guild.name,
      message: '申请已提交，请等待帮主审批',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// QuitOrganize - POST /guild/quit（退出帮派）
app.post('/quit', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id } = await c.req.json();
  if (!guild_id) return error(c, '请提供帮派ID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const member: any = await db.prepare(`
      SELECT gm.*, g.name as guild_name
      FROM guild_members gm
      JOIN guilds g ON gm.guild_id = g.id
      WHERE gm.wallet_address = ? AND gm.guild_id = ?
    `).bind(walletAddress, guild_id).first();

    if (!member) {
      return error(c, '您不是该帮派成员');
    }

    if (member.role === 'leader') {
      return error(c, '帮主不能直接退出，请先转让帮主');
    }

    await db.prepare(`
      DELETE FROM guild_members WHERE wallet_address = ? AND guild_id = ?
    `).bind(walletAddress, guild_id).run();

    await db.prepare(`
      UPDATE guilds SET member_count = member_count - 1 WHERE id = ?
    `).bind(guild_id).run();

    return success(c, {
      message: '已退出帮派',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DisbandOrg - POST /guild/disband（解散帮派，仅帮主可操作）
app.post('/disband', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id } = await c.req.json();
  if (!guild_id) return error(c, '请提供帮派ID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guild_id).first();

    if (!guild) return error(c, '帮派不存在', 404);

    if (guild.leader_address !== walletAddress) {
      return error(c, '只有帮主才能解散帮派', 403);
    }

    // 删除所有成员
    await db.prepare(`
      DELETE FROM guild_members WHERE guild_id = ?
    `).bind(guild_id).run();

    // 删除待处理的申请
    await db.prepare(`
      DELETE FROM guild_applications WHERE guild_id = ?
    `).bind(guild_id).run();

    // 删除帮派
    await db.prepare(`
      DELETE FROM guilds WHERE id = ?
    `).bind(guild_id).run();

    return success(c, {
      message: '帮派已解散',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetMemberShipCountByState - GET /guild/member-count
app.get('/member-count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, state } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let targetGuildId = guild_id ? parseInt(guild_id) : null;

    if (!targetGuildId) {
      const myGuild: any = await db.prepare(`
        SELECT guild_id FROM guild_members WHERE wallet_address = ?
      `).bind(walletAddress).first();
      if (myGuild) targetGuildId = myGuild.guild_id;
    }

    if (!targetGuildId) {
      return success(c, { count: 0 });
    }

    let count: any;
    if (state && state !== 'all') {
      count = await db.prepare(`
        SELECT COUNT(*) as count FROM guild_members
        WHERE guild_id = ? AND role = ?
      `).bind(targetGuildId, state).first();
    } else {
      count = await db.prepare(`
        SELECT COUNT(*) as count FROM guild_members WHERE guild_id = ?
      `).bind(targetGuildId).first();
    }

    return success(c, { count: (count as any).count });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetMemberShipCountByStateOther - GET /guild/member-count-other
app.get('/member-count-other', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, state } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!guild_id) return error(c, '请提供帮派ID');

    let count: any;
    if (state && state !== 'all') {
      count = await db.prepare(`
        SELECT COUNT(*) as count FROM guild_members
        WHERE guild_id = ? AND role = ?
      `).bind(parseInt(guild_id), state).first();
    } else {
      count = await db.prepare(`
        SELECT COUNT(*) as count FROM guild_members WHERE guild_id = ?
      `).bind(parseInt(guild_id)).first();
    }

    return success(c, { count: (count as any).count });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetMemberShipList - GET /guild/member-list
app.get('/member-list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, member_type, page, page_size } = c.req.query();
  const pageNum = parseInt(page || '1');
  const pageSize = parseInt(page_size || '20');
  const offset = (pageNum - 1) * pageSize;

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let targetGuildId = guild_id ? parseInt(guild_id) : null;

    if (!targetGuildId) {
      const myGuild: any = await db.prepare(`
        SELECT guild_id FROM guild_members WHERE wallet_address = ?
      `).bind(walletAddress).first();
      if (myGuild) targetGuildId = myGuild.guild_id;
    }

    if (!targetGuildId) {
      return success(c, { members: [], total: 0 });
    }

    let query = `
      SELECT gm.*, c.level, c.vip_level
      FROM guild_members gm
      LEFT JOIN characters c ON gm.wallet_address = c.wallet_address
      WHERE gm.guild_id = ?
    `;
    const params: any[] = [targetGuildId];

    if (member_type && member_type !== 'all') {
      query += ' AND gm.role = ?';
      params.push(member_type);
    }

    const totalCount: any = await db.prepare(
      'SELECT COUNT(*) as count FROM guild_members WHERE guild_id = ?'
    ).bind(targetGuildId).first();

    query += ' ORDER BY gm.contribution DESC, gm.joined_at ASC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const members = await db.prepare(query).bind(...params).all();

    const memberList = (members.results || []).map((m: any) => ({
      uid: m.id,
      walletAddress: m.wallet_address,
      name: m.level ? `玩家${m.wallet_address.slice(0, 6)}` : '未知',
      role: m.role,
      contribution: m.contribution,
      level: m.level || 0,
      vipLevel: m.vip_level || 0,
      joinedAt: m.joined_at,
    }));

    return success(c, {
      members: memberList,
      total: (totalCount as any).count,
      page: pageNum,
      pageSize,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetOrganizeCount - GET /guild/count
app.get('/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result: any = await db.prepare(`
      SELECT COUNT(*) as count FROM guilds
    `).first();

    return success(c, { count: result.count });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetOrgInfo - GET /guild/info
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id } = c.req.query();
  if (!guild_id) return error(c, '请提供帮派ID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(parseInt(guild_id)).first();

    if (!guild) return error(c, '帮派不存在', 404);

    const members = await db.prepare(`
      SELECT gm.*, c.level
      FROM guild_members gm
      LEFT JOIN characters c ON gm.wallet_address = c.wallet_address
      WHERE gm.guild_id = ?
      ORDER BY gm.contribution DESC
    `).bind(parseInt(guild_id)).all();

    return success(c, {
      id: guild.id,
      name: guild.name,
      level: guild.level,
      notice: guild.notice,
      insignia: guild.insignia || '',
      memberCount: guild.member_count,
      leaderAddress: guild.leader_address,
      createdAt: guild.created_at,
      members: (members.results || []).map((m: any) => ({
        walletAddress: m.wallet_address,
        role: m.role,
        contribution: m.contribution,
        joinedAt: m.joined_at,
      })),
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetOrgNode - GET /guild/node
app.get('/node', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, event_index } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    return success(c, {
      eventIndex: parseInt(event_index || '0'),
      nodes: [],
      message: '功能开发中',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetMyOrgResInfo - GET /guild/my-resource 获取用户在帮派中的个人资源
app.get('/my-resource', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const member: any = await db.prepare(`
      SELECT * FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) {
      return success(c, { guildId: null, resources: null });
    }

    // 返回用户在帮派中的个人资源 (从 guild_members 表读取)
    return success(c, {
      guildId: member.guild_id,
      role: member.role,
      contribution: member.contribution || 0,
      resources: {
        pearl: member.pearl || 0,
        crystal: member.crystal || 0,
        agate: member.agate || 0,
        wbowlder: member.wbowlder || 0,
        bbowlder: member.bbowlder || 0,
        jadebook: member.jadebook || 0,
        crusade: member.crusade || 0,
      },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetDBOrgResource - GET /guild/resource
app.get('/resource', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let targetGuildId = guild_id ? parseInt(guild_id) : null;

    if (!targetGuildId) {
      const myGuild: any = await db.prepare(`
        SELECT guild_id FROM guild_members WHERE wallet_address = ?
      `).bind(walletAddress).first();
      if (myGuild) targetGuildId = myGuild.guild_id;
    }

    if (!targetGuildId) {
      return success(c, { guildId: null, resources: null });
    }

    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(targetGuildId).first();

    // 查询帮派公共资源 (C#: GetDBOrgResource)
    const guildRes: any = await db.prepare(`
      SELECT pearl, crystal, agate, wbowlder, bbowlder, jadebook, crusade,
             money, food, men, fame, prestige
      FROM guild_public_resources
      WHERE guild_id = ?
    `).bind(targetGuildId).first();

    return success(c, {
      guildId: targetGuildId,
      guildName: guild?.name || '',
      resources: {
        pearl: guildRes?.pearl || 0,
        crystal: guildRes?.crystal || 0,
        agate: guildRes?.agate || 0,
        wbowlder: guildRes?.wbowlder || 0,
        bbowlder: guildRes?.bbowlder || 0,
        jadebook: guildRes?.jadebook || 0,
        crusade: guildRes?.crusade || 0,
        money: guildRes?.money || 0,
        food: guildRes?.food || 0,
        men: guildRes?.men || 0,
        fame: guildRes?.fame || 0,
        prestige: guildRes?.prestige || 0,
      },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetOrgMembersRes - GET /guild/members-resource
app.get('/members-resource', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, page, page_size } = c.req.query();
  const pageNum = parseInt(page || '1');
  const pageSize = parseInt(page_size || '20');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let targetGuildId = guild_id ? parseInt(guild_id) : null;

    if (!targetGuildId) {
      const myGuild: any = await db.prepare(`
        SELECT guild_id FROM guild_members WHERE wallet_address = ?
      `).bind(walletAddress).first();
      if (myGuild) targetGuildId = myGuild.guild_id;
    }

    if (!targetGuildId) {
      return success(c, { members: [], total: 0 });
    }

    const members = await db.prepare(`
      SELECT gm.wallet_address, gm.contribution, gm.role, c.money, c.food, c.population
      FROM guild_members gm
      LEFT JOIN cities c ON gm.wallet_address = c.wallet_address
      WHERE gm.guild_id = ?
      ORDER BY gm.contribution DESC
      LIMIT ? OFFSET ?
    `).bind(targetGuildId, pageSize, (pageNum - 1) * pageSize).all();

    return success(c, {
      members: (members.results || []).map((m: any) => ({
        walletAddress: m.wallet_address,
        contribution: m.contribution,
        role: m.role,
        resources: {
          money: m.money || 0,
          food: m.food || 0,
          population: m.population || 0,
        },
      })),
      page: pageNum,
      pageSize,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ModifyOrgIntro - POST /guild/modify-intro
app.post('/modify-intro', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, intro } = await c.req.json();
  if (!guild_id) return error(c, '请提供帮派ID');
  if (!intro || intro.length > 200) return error(c, '简介长度不能超过200字符');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const member: any = await db.prepare(`
      SELECT role FROM guild_members
      WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, walletAddress).first();

    if (!member) return error(c, '您不是该帮派成员', 403);

    if (member.role !== 'leader' && member.role !== 'officer') {
      return error(c, '只有帮主和副帮主可以修改简介', 403);
    }

    await db.prepare(`
      UPDATE guilds SET notice = ? WHERE id = ?
    `).bind(intro, guild_id).run();

    return success(c, { message: '简介修改成功', intro });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ModifyOrgAffiche - POST /guild/modify-affiche
app.post('/modify-affiche', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, affiche } = await c.req.json();
  if (!guild_id) return error(c, '请提供帮派ID');
  if (!affiche || affiche.length > 500) return error(c, '公告长度不能超过500字符');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const member: any = await db.prepare(`
      SELECT role FROM guild_members
      WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, walletAddress).first();

    if (!member) return error(c, '您不是该帮派成员', 403);

    if (member.role !== 'leader' && member.role !== 'officer') {
      return error(c, '只有帮主和副帮主可以修改公告', 403);
    }

    await db.prepare(`
      UPDATE guilds SET notice = ? WHERE id = ?
    `).bind(affiche, guild_id).run();

    return success(c, { message: '公告修改成功', affiche });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// BossFunc - POST /guild/boss-func
// func_type: 0=审批通过, 1=拒绝, 2=踢人 (C# 映射)
// 参考 jx/Web/Main.aspx.cs:2905 BossFunc 和 jx/BLL/Organize.cs
// C# Privilege: 0=试炼, 1=成员, 2=长老, 3=副帮主, 4=帮主
// C# State: 0=试炼(待审批), 1=正式成员
// 角色映射: leader=帮主(4), officer=副帮主(3), elder=长老(2), member=成员(1)
app.post('/boss-func', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, func_type, target_username } = await c.req.json();
  if (!guild_id || func_type === undefined) return error(c, '参数不完整');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guild_id).first();

    if (!guild) return error(c, '帮派不存在', 404);

    // 获取调用者的成员信息
    const caller: any = await db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, walletAddress).first();

    if (!caller) return error(c, '您不是帮派成员', 403);

    const callerPrivilege = roleToPrivilege(caller.role);
    const funcType = parseInt(func_type);

    // C# 映射: 0=审批通过(JoinOrganize), 1=拒绝(RefusedJoinOrganize), 2=踢人(KickOut)
    // JoinOrganize 和 RefusedJoinOrganize 要求 Privilege > 1 (长老及以上)
    // KickOut 只允许帮主(Privilege=4)或权限更高的成员
    if (funcType === 0 || funcType === 1) {
      // 审批通过或拒绝 - 需要 Privilege > 1 (参考 C# Organize.JoinOrganize)
      // C#: if (assessorMem.Privilege <= 1) return 525;
      if (callerPrivilege <= 1) {
        return error(c, '权限不足，需要长老及以上职位', 403);
      }

      if (!target_username) return error(c, '请提供申请人地址');

      // 检查申请是否存在且为待处理状态
      const app: any = await db.prepare(`
        SELECT * FROM guild_applications
        WHERE guild_id = ? AND wallet_address = ? AND status = 'pending'
      `).bind(guild_id, target_username).first();

      if (!app) return error(c, '没有待处理的申请');

      if (funcType === 0) {
        // 审批通过 - C# Organize.JoinOrganize
        if (guild.member_count >= 50) {
          return error(c, '帮派已满员');
        }

        // C#: 检查申请者是否已经是正式成员 (proposerMem.State != 0)
        // 这里我们检查申请者是否已在 guild_members 中且是正式状态
        const existingMember: any = await db.prepare(`
          SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
        `).bind(guild_id, target_username).first();

        if (existingMember) {
          const existingState = (existingMember as any).state || 1;
          if (existingState === 1) {
            return error(c, '该成员已是正式成员');
          }
        }

        // 更新申请状态
        await db.prepare(`
          UPDATE guild_applications SET status = 'approved' WHERE id = ?
        `).bind(app.id).run();

        if (existingMember) {
          // 如果是试炼成员，转为正式成员
          await db.prepare(`
            UPDATE guild_members SET role = 'member'
            WHERE guild_id = ? AND wallet_address = ?
          `).bind(guild_id, target_username).run();
        } else {
          // 添加到帮派 (默认是正式成员)
          await db.prepare(`
            INSERT INTO guild_members (guild_id, wallet_address, role, contribution)
            VALUES (?, ?, 'member', 0)
          `).bind(guild_id, target_username).run();

          await db.prepare(`
            UPDATE guilds SET member_count = member_count + 1 WHERE id = ?
          `).bind(guild_id).run();
        }

        return success(c, { message: '已批准加入申请' });

      } else {
        // 拒绝申请 - C# Organize.RefusedJoinOrganize
        await db.prepare(`
          UPDATE guild_applications SET status = 'rejected'
          WHERE guild_id = ? AND wallet_address = ? AND status = 'pending'
        `).bind(guild_id, target_username).run();

        return success(c, { message: '已拒绝申请' });
      }

    } else if (funcType === 2) {
      // 踢人 - C# Organize.KickOut
      // C#: if (member.Privilege <= orgKicker.Privilege || member.Privilege == 1) return 525;
      // 即: officer(3)可以踢elder(2)，leader(4)可以踢所有人(除自己)
      if (callerPrivilege < 2) {
        return error(c, '权限不足，只有官员以上才能踢人', 403);
      }

      if (!target_username) return error(c, '请提供目标用户名');
      if (target_username === walletAddress) return error(c, '不能踢出自己');

      const target: any = await db.prepare(`
        SELECT * FROM guild_members
        WHERE guild_id = ? AND wallet_address = ?
      `).bind(guild_id, target_username).first();

      if (!target) return error(c, '目标成员不在帮派中');

      const targetPrivilege = roleToPrivilege(target.role);

      // C# 逻辑: 不能踢权限 <= 自己权限的人，不能踢 privilege=1 的人(试炼成员)
      // officer(3)可以踢elder(2)，leader(4)可以踢officer(3)和elder(2)
      if (targetPrivilege <= callerPrivilege) {
        return error(c, `权限不足，无法踢出该成员（您的权限:${callerPrivilege}，目标权限:${targetPrivilege}）`);
      }
      if (targetPrivilege === 1) {
        return error(c, '试炼成员不能被踢出，请等待试炼期结束');
      }

      await db.prepare(`
        DELETE FROM guild_members WHERE guild_id = ? AND wallet_address = ?
      `).bind(guild_id, target_username).run();

      await db.prepare(`
        UPDATE guilds SET member_count = member_count - 1 WHERE id = ?
      `).bind(guild_id).run();

      return success(c, { message: '已踢出成员' });

    } else {
      return error(c, '未知的操作类型，仅支持 0(审批通过)/1(拒绝)/2(踢人)');
    }
  } catch (err: any) {
    return error(c, err.message);
  }
});

// Promotion - POST /guild/promotion（升职：副帮主）
// 参考 jx/BLL/Organize.cs Promotion
// C# 要求: 目标 Privilege=1 且 State=1 才能升为副帮主
app.post('/promotion', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, deputy_name } = await c.req.json();
  if (!guild_id || !deputy_name) return error(c, '参数不完整');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guild_id).first();

    if (!guild) return error(c, '帮派不存在', 404);

    if (guild.leader_address !== walletAddress) {
      return error(c, '只有帮主才能执行此操作', 403);
    }

    const target: any = await db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, deputy_name).first();

    if (!target) return error(c, '目标成员不在帮派中');

    // C#: if (deputy.Privilege != 1 || deputy.State != 1) return 525;
    // 目标必须是 Privilege=1 (普通成员) 且 State=1 (正式成员)
    const targetPrivilege = roleToPrivilege(target.role);
    const targetState = (target as any).state || 1; // 默认为正式成员

    if (targetPrivilege !== 1) {
      return error(c, '目标必须是普通成员才能升职');
    }

    if (targetState !== 1) {
      return error(c, '目标必须是正式成员才能升职（试炼成员需先通过审批）');
    }

    // 检查官员数量上限 (参考 C# org.OfficialNumber >= org.MaxOfficialNumber)
    const officialCount: any = await db.prepare(`
      SELECT COUNT(*) as count FROM guild_members
      WHERE guild_id = ? AND role IN ('officer', 'elder')
    `).bind(guild_id).first();

    const maxOfficial = ORG_EFFECT_CONFIG[guild.level]?.officialNum || 5;
    if ((officialCount as any).count >= maxOfficial) {
      return error(c, `官员数量已达上限（${maxOfficial}人）`);
    }

    await db.prepare(`
      UPDATE guild_members SET role = 'officer'
      WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, deputy_name).run();

    return success(c, { message: '已升职为副帮主' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// Demotion - POST /guild/demotion（降职：普通成员）
app.post('/demotion', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, deputy_name } = await c.req.json();
  if (!guild_id || !deputy_name) return error(c, '参数不完整');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guild_id).first();

    if (!guild) return error(c, '帮派不存在', 404);

    if (guild.leader_address !== walletAddress) {
      return error(c, '只有帮主才能执行此操作', 403);
    }

    const target: any = await db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, deputy_name).first();

    if (!target) return error(c, '目标成员不在帮派中');

    if (target.role === 'member') {
      return error(c, '该成员已是普通成员');
    }

    if (target.role === 'leader') {
      return error(c, '不能降职帮主');
    }

    await db.prepare(`
      UPDATE guild_members SET role = 'member'
      WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, deputy_name).run();

    return success(c, { message: '已降为普通成员' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// Abdication - POST /guild/abdication（转让帮主/副帮主放弃职位）
// 参考 jx/BLL/Organize.cs Abdication
// C# 两种情况:
// 1. 帮主转让 (Privilege=4): 转让给副帮主，帮主降为副帮主
// 2. 副帮主放弃职位 (Privilege=3): 副帮主降为成员
app.post('/abdication', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, heir_name } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取当前成员的权限
    const caller: any = await db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, walletAddress).first();

    if (!caller) return error(c, '您不是帮派成员', 403);

    const callerPrivilege = roleToPrivilege(caller.role);

    // 情况1: 副帮主放弃职位 (Privilege=3 -> 1)
    if (callerPrivilege === 3 && !heir_name) {
      // 副帮主主动放弃职位，降为成员
      await db.prepare(`
        UPDATE guild_members SET role = 'member'
        WHERE guild_id = ? AND wallet_address = ?
      `).bind(guild_id, walletAddress).run();

      return success(c, { message: '已放弃副帮主职位，现在是普通成员' });
    }

    // 情况2: 帮主转让帮主 (Privilege=4)
    if (guild_id) {
      const guild: any = await db.prepare(`
        SELECT * FROM guilds WHERE id = ?
      `).bind(guild_id).first();

      if (!guild) return error(c, '帮派不存在', 404);

      if (guild.leader_address !== walletAddress) {
        return error(c, '只有帮主才能转让帮主', 403);
      }

      if (!heir_name) return error(c, '请指定继承人');

      if (heir_name === walletAddress) {
        return error(c, '不能转让给自己');
      }

      const heir: any = await db.prepare(`
        SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
      `).bind(guild_id, heir_name).first();

      if (!heir) return error(c, '继承人不存在或不在帮派中');

      const heirPrivilege = roleToPrivilege(heir.role);
      // 继承人必须是副帮主 (Privilege = 3)
      if (heirPrivilege !== 3) {
        return error(c, '只有副帮主才能被转让帮主');
      }

      // 转让帮主 (C#: Abdication)
      await db.prepare(`
        UPDATE guild_members SET role = 'officer'
        WHERE guild_id = ? AND wallet_address = ?
      `).bind(guild_id, walletAddress).run();

      await db.prepare(`
        UPDATE guild_members SET role = 'leader'
        WHERE guild_id = ? AND wallet_address = ?
      `).bind(guild_id, heir_name).run();

      await db.prepare(`
        UPDATE guilds SET leader_address = ? WHERE id = ?
      `).bind(heir_name, guild_id).run();

      return success(c, { message: '帮主已转让' });
    }

    return error(c, '参数不完整');
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSDUserPrestige - GET /guild/user-prestige
app.get('/user-prestige', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { prestige_level } = c.req.query();
  const level = parseInt(prestige_level || '1');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    return success(c, {
      prestigeLevel: level,
      prestigeValue: level * 100,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSDUserFame - GET /guild/user-fame
app.get('/user-fame', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { fame_level } = c.req.query();
  const level = parseInt(fame_level || '1');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    return success(c, {
      fameLevel: level,
      fameValue: level * 50,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSDOrgEffectByLevel - GET /guild/effect-by-level
app.get('/effect-by-level', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_level } = c.req.query();
  const level = parseInt(guild_level || '1');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    return success(c, {
      guildLevel: level,
      MoneyPer: level * 2,
      FoodPer: level * 2,
      MenPer: level * 1,
      AttackPer: level * 3,
      DefencePer: level * 3,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ListMessage - GET /guild/chat/messages
app.get('/chat/messages', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const start_num = parseInt(c.req.query('start_num') || '0');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let guildMember: any = null;

    try {
      guildMember = await db.prepare(`
        SELECT guild_id FROM guild_members WHERE wallet_address = ?
      `).bind(walletAddress).first();
    } catch (dbErr) {
      console.log('[Guild] Tables not exist');
    }

    if (!guildMember) {
      return success(c, []);
    }

    // 查询该帮派的聊天消息（频道格式: guild_{guild_id}）
    const channel = `guild_${guildMember.guild_id}`;
    const messages = await db.prepare(`
      SELECT * FROM chat_messages
      WHERE channel = ?
      ORDER BY id DESC
      LIMIT 50 OFFSET ?
    `).bind(channel, start_num).all();

    return success(c, messages.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// IsBoss - GET /guild/is-boss
app.get('/is-boss', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let targetGuildId = guild_id ? parseInt(guild_id) : null;

    if (!targetGuildId) {
      const myGuild: any = await db.prepare(`
        SELECT guild_id FROM guild_members WHERE wallet_address = ?
      `).bind(walletAddress).first();
      if (myGuild) targetGuildId = myGuild.guild_id;
    }

    if (!targetGuildId) {
      return success(c, { isBoss: false, guildId: null });
    }

    const guild: any = await db.prepare(`
      SELECT leader_address FROM guilds WHERE id = ?
    `).bind(targetGuildId).first();

    return success(c, {
      isBoss: guild?.leader_address === walletAddress,
      guildId: targetGuildId,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// BuyOrgRes - POST /guild/buy-resource 购买帮派资源
// 参考 jx/BLL/Organize.cs BuyOrgRes
// C# 逻辑: 扣除用户金币 -> 添加到用户个人帮派资源 (UserOrganizeRes)
app.post('/buy-resource', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { resID, resNum } = await c.req.json();
  if (!resID || !resNum || resNum <= 0) {
    return error(c, '参数不完整或数值无效');
  }

  // 验证资源类型 (1-7 对应 pearl/crystal/agate/wbowlder/bbowlder/jadebook/crusade)
  const resNameMap: Record<string, string> = {
    '1': 'pearl', '2': 'crystal', '3': 'agate',
    '4': 'wbowlder', '5': 'bbowlder', '6': 'jadebook', '7': 'crusade'
  };
  const resourceField = resNameMap[resID];
  if (!resourceField) {
    return error(c, `无效的资源ID，支持: 1-7 (pearl/crystal/agate/wbowlder/bbowlder/jadebook/crusade)`);
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取玩家的帮派成员信息
    const member: any = await db.prepare(`
      SELECT * FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) return error(c, '您还没有加入帮派');

    // 获取城市资源 (用于扣金币)
    const city: any = await db.prepare(`
      SELECT money FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, '您还没有城市');

    // 从配置读取金币换算比率 (C#: OrganizeAccess.OrgResConvertToGold)
    const GOLD_PER_RES = 100; // 每单位资源100金币
    const price = resNum * GOLD_PER_RES;

    // 检查金币是否足够
    if ((city as any).money < price) {
      return error(c, `金币不足，需要${price}金币，当前${(city as any).money}金币`);
    }

    // 扣除金币
    await db.prepare(`
      UPDATE cities SET money = money - ? WHERE wallet_address = ?
    `).bind(price, walletAddress).run();

    // 添加资源到用户的帮派资源 (guild_members 表)
    await db.prepare(`
      UPDATE guild_members SET ${resourceField} = COALESCE(${resourceField}, 0) + ? WHERE wallet_address = ?
    `).bind(resNum, walletAddress).run();

    return success(c, {
      message: `成功购买${resNum}个${resourceField}`,
      cost: price,
      resource: resourceField,
      amount: resNum,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ContributeRes - POST /guild/contribute（捐献帮派专属资源）
// 参考 jx/BLL/Organize.cs ContributeRes
// C# 支持捐献 7 种帮派专属资源: Pearl, Crystal, Agate, WBowlder, BBowlder, Crusade, JadeBook
app.post('/contribute', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, resource_type, amount } = await c.req.json();
  if (!guild_id || !resource_type || !amount || amount <= 0) {
    return error(c, '参数不完整或数值无效');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // 验证资源类型 (参考 C# OrgResName)
  const validResTypes = ['pearl', 'crystal', 'agate', 'wbowlder', 'bbowlder', 'crusade', 'jadebook', 'money', 'food', 'population'];
  if (!validResTypes.includes(resource_type)) {
    return error(c, `无效的资源类型，支持: ${validResTypes.join(', ')}`);
  }

  try {
    const member: any = await db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, walletAddress).first();

    if (!member) return error(c, '您不是该帮派成员');

    // C# 帮派专属资源捐献 (资源在 guild_members 表的对应字段)
    if (validResTypes.slice(0, 7).includes(resource_type)) {
      // 检查用户该资源数量 (从 guild_members 表读取)
      const userRes = (member as any)[resource_type] || 0;
      if (userRes < amount) {
        return error(c, `您的${resource_type}不足，当前: ${userRes}`);
      }

      // 扣除用户资源 (更新 guild_members 表)
      await db.prepare(`
        UPDATE guild_members SET ${resource_type} = ${resource_type} - ? WHERE guild_id = ? AND wallet_address = ?
      `).bind(amount, guild_id, walletAddress).run();

      // 添加到帮派公共资源表 (C# 是添加到 OrgResource)
      await db.prepare(`
        INSERT INTO guild_public_resources (guild_id, ${resource_type})
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET ${resource_type} = COALESCE(guild_public_resources.${resource_type}, 0) + ?
      `).bind(guild_id, amount, amount).run();

      // 增加贡献度
      await db.prepare(`
        UPDATE guild_members SET contribution = contribution + ? WHERE guild_id = ? AND wallet_address = ?
      `).bind(amount, guild_id, walletAddress).run();

      return success(c, {
        resourceType: resource_type,
        amount,
        contribution: amount,
        message: `捐献成功，${resource_type} +${amount}，贡献 +${amount}`,
      });
    }

    // 原有的一般资源捐献 (money, food, population)
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, '您还没有城市');

    let resourceField = resource_type === 'money' ? 'money' :
                        resource_type === 'food' ? 'food' : 'population';

    if ((city as any)[resourceField] < amount) {
      return error(c, `您的${resource_type}不足`);
    }

    await db.prepare(`
      UPDATE cities SET ${resourceField} = ${resourceField} - ? WHERE wallet_address = ?
    `).bind(amount, walletAddress).run();

    // C#: 一般资源捐献也会增加贡献度
    const contribution = Math.floor(amount / 100);

    await db.prepare(`
      UPDATE guild_members SET contribution = contribution + ?
      WHERE guild_id = ? AND wallet_address = ?
    `).bind(contribution, guild_id, walletAddress).run();

    return success(c, {
      resourceType: resource_type,
      amount,
      contribution,
      message: `捐献成功，获得 ${contribution} 点贡献度`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// OrganizeUpgrade - POST /guild/upgrade
// 参考 jx/BLL/Organize.cs OrganizeUpgrade
// C# 消耗帮派专属资源: Pearl, Crystal, Agate, WBowlder, BBowlder, JadeBook
app.post('/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id } = await c.req.json();
  if (!guild_id) return error(c, '请提供帮派ID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guild_id).first();

    if (!guild) return error(c, '帮派不存在', 404);

    // C#: if (member.Privilege < 3) return 520;
    // 只有副帮主及以上 (Privilege >= 3) 才能升级帮派
    const member: any = await db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, walletAddress).first();

    if (!member) return error(c, '您不是帮派成员', 403);

    const memberPrivilege = roleToPrivilege(member.role);
    if (memberPrivilege < 3) {
      return error(c, '只有副帮主及以上职位才能升级帮派', 403);
    }

    const currentLevel = guild.level || 1;
    const maxLevel = 10;
    if (currentLevel >= maxLevel) {
      return error(c, '帮派已达到最高等级');
    }

    // 从配置表读取升级消耗 (参考 C# OrganizeAccess.GetSDOrgEffectByLevel)
    const upgradeCost = getOrgUpgradeCost(currentLevel + 1);

    // 获取帮派资源 (如果没有表或字段，使用 guilds 表的扩展字段)
    const guildRes: any = await db.prepare(`
      SELECT pearl, crystal, agate, wbowlder, bbowlder, jadebook
      FROM guild_resources WHERE guild_id = ?
    `).bind(guild_id).first();

    // 如果帮派资源表不存在，检查 guilds 表的字段
    const resFromGuild = !guildRes ? await db.prepare(`
      SELECT 
        COALESCE(pearl, 0) as pearl,
        COALESCE(crystal, 0) as crystal,
        COALESCE(agate, 0) as agate,
        COALESCE(wbowlder, 0) as wbowlder,
        COALESCE(bbowlder, 0) as bbowlder,
        COALESCE(jadebook, 0) as jadebook
      FROM guilds WHERE id = ?
    `).bind(guild_id).first() : null;

    const res = guildRes || resFromGuild;

    if (!res) {
      return error(c, '帮派资源数据不存在');
    }

    // C# 资源检查: Pearl < NeedPearl => 532, Crystal < NeedCrystal => 533, etc.
    if ((res.pearl || 0) < upgradeCost.needPearl) {
      return error(c, `珍珠(Pearl)不足，升级需要 ${upgradeCost.needPearl} 珍珠`);
    }
    if ((res.crystal || 0) < upgradeCost.needCrystal) {
      return error(c, `水晶(Crystal)不足，升级需要 ${upgradeCost.needCrystal} 水晶`);
    }
    if ((res.agate || 0) < upgradeCost.needAgate) {
      return error(c, `玛瑙(Agate)不足，升级需要 ${upgradeCost.needAgate} 玛瑙`);
    }
    if ((res.wbowlder || 0) < upgradeCost.needWBowlder) {
      return error(c, `白灵石(WBowlder)不足，升级需要 ${upgradeCost.needWBowlder} 白灵石`);
    }
    if ((res.bbowlder || 0) < upgradeCost.needBBowlder) {
      return error(c, `黑灵石(BBowlder)不足，升级需要 ${upgradeCost.needBBowlder} 黑灵石`);
    }
    if ((res.jadebook || 0) < upgradeCost.needJadeBook) {
      return error(c, `玉书(JadeBook)不足，升级需要 ${upgradeCost.needJadeBook} 玉书`);
    }

    // 扣除帮派资源
    if (guildRes) {
      // 更新 guild_resources 表
      await db.prepare(`
        UPDATE guild_resources SET 
          pearl = pearl - ?,
          crystal = crystal - ?,
          agate = agate - ?,
          wbowlder = wbowlder - ?,
          bbowlder = bbowlder - ?,
          jadebook = jadebook - ?
        WHERE guild_id = ?
      `).bind(upgradeCost.needPearl, upgradeCost.needCrystal, upgradeCost.needAgate, upgradeCost.needWBowlder, upgradeCost.needBBowlder, upgradeCost.needJadeBook, guild_id).run();
    } else {
      // 更新 guilds 表的字段
      await db.prepare(`
        UPDATE guilds SET 
          pearl = pearl - ?,
          crystal = crystal - ?,
          agate = agate - ?,
          wbowlder = wbowlder - ?,
          bbowlder = bbowlder - ?,
          jadebook = jadebook - ?
        WHERE id = ?
      `).bind(upgradeCost.needPearl, upgradeCost.needCrystal, upgradeCost.needAgate, upgradeCost.needWBowlder, upgradeCost.needBBowlder, upgradeCost.needJadeBook, guild_id).run();
    }

    // 升级帮派
    await db.prepare(`
      UPDATE guilds SET level = level + 1 WHERE id = ?
    `).bind(guild_id).run();

    return success(c, {
      message: `帮派升级成功，当前等级 ${currentLevel + 1}`,
      newLevel: currentLevel + 1,
      cost: {
        pearl: upgradeCost.needPearl,
        crystal: upgradeCost.needCrystal,
        agate: upgradeCost.needAgate,
        wbowlder: upgradeCost.needWBowlder,
        bbowlder: upgradeCost.needBBowlder,
        jadebook: upgradeCost.needJadeBook,
      },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpgradeFameLevel - POST /guild/upgrade-fame 升级名望
// 参考 jx/BLL/Organize.cs UpgradeFameLevel
// C# 消耗 JadeBook 和 Fame 值
app.post('/upgrade-fame', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取玩家的帮派成员信息和名望
    const member: any = await db.prepare(`
      SELECT gm.*, c.fame, c.fame_level
      FROM guild_members gm
      LEFT JOIN characters c ON gm.wallet_address = c.wallet_address
      WHERE gm.wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) return error(c, '您还没有加入帮派');

    const currentFame = (member as any).fame || 0;
    const currentFameLevel = (member as any).fame_level || 0;

    // 获取名望升级配置 (参考 C# OrganizeAccess.GetSDUserFame)
    // 每级需要更多的 JadeBook 和 Fame 值
    const nextLevel = currentFameLevel + 1;
    const needJadeBook = nextLevel * 50;
    const needFame = nextLevel * 100;

    // C#: int offsetJadeBook = orgRes.JadeBook - need.NeedJadeBook;
    //     int offsetFame = orgRes.Fame - need.NeedFame;
    //     if (offsetJadeBook < 0) return 537; // JadeBook 不足
    //     if (offsetFame < 0) return 540;     // Fame 不足

    if ((member as any).jadebook < needJadeBook) {
      return error(c, `玉书(JadeBook)不足，需要 ${needJadeBook} 玉书`);
    }

    if (currentFame < needFame) {
      return error(c, `名望值不足，需要 ${needFame} 名望值，您当前有 ${currentFame} 名望值`);
    }

    // 扣除帮派资源并升级
    await db.prepare(`
      UPDATE guild_members SET jadebook = jadebook - ? WHERE wallet_address = ?
    `).bind(needJadeBook, walletAddress).run();

    await db.prepare(`
      UPDATE characters SET fame_level = fame_level + 1, fame = fame - ? WHERE wallet_address = ?
    `).bind(needFame, walletAddress).run();

    return success(c, {
      message: `名望升级成功，当前等级 ${nextLevel}`,
      newLevel: nextLevel,
      cost: {
        jadebook: needJadeBook,
        fame: needFame,
      },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpgradePrestigeLevel - POST /guild/upgrade-prestige 升级声望
// 参考 jx/BLL/Organize.cs UpgradePrestigeLevel
// C# 消耗 JadeBook 和 Prestige 值
app.post('/upgrade-prestige', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取玩家的帮派成员信息和声望
    const member: any = await db.prepare(`
      SELECT gm.*, c.prestige, c.prestige_level
      FROM guild_members gm
      LEFT JOIN characters c ON gm.wallet_address = c.wallet_address
      WHERE gm.wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) return error(c, '您还没有加入帮派');

    const currentPrestige = (member as any).prestige || 0;
    const currentPrestigeLevel = (member as any).prestige_level || 0;

    // 获取声望升级配置 (参考 C# OrganizeAccess.GetSDUserPrestige)
    // 每级需要更多的 JadeBook 和 Prestige 值
    const nextLevel = currentPrestigeLevel + 1;
    const needJadeBook = nextLevel * 100; // 声望升级消耗更多玉书
    const needPrestige = nextLevel * 200;

    // C#: int offsetJadeBook = orgRes.JadeBook - need.NeedJadeBook;
    //     int offsetPrestige = orgRes.Prestige - need.NeedPrestige;
    //     if (offsetJadeBook < 0) return 537; // JadeBook 不足
    //     if (offsetPrestige < 0) return 540; // Prestige 不足

    if ((member as any).jadebook < needJadeBook) {
      return error(c, `玉书(JadeBook)不足，需要 ${needJadeBook} 玉书`);
    }

    if (currentPrestige < needPrestige) {
      return error(c, `声望值不足，需要 ${needPrestige} 声望值，您当前有 ${currentPrestige} 声望值`);
    }

    // 扣除帮派资源并升级
    await db.prepare(`
      UPDATE guild_members SET jadebook = jadebook - ? WHERE wallet_address = ?
    `).bind(needJadeBook, walletAddress).run();

    await db.prepare(`
      UPDATE characters SET prestige_level = prestige_level + 1, prestige = prestige - ? WHERE wallet_address = ?
    `).bind(needPrestige, walletAddress).run();

    return success(c, {
      message: `声望升级成功，当前等级 ${nextLevel}`,
      newLevel: nextLevel,
      cost: {
        jadebook: needJadeBook,
        prestige: needPrestige,
      },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetUnionNum - GET /guild/union-count
app.get('/union-count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result: any = await db.prepare(`
      SELECT COUNT(*) as count FROM guilds
    `).first();

    return success(c, { count: result.count });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;