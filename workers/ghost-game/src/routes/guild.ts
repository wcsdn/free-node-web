/**
 * 帮派系统路由
 * 实现帮派创建、成员管理、捐献等功能
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
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
app.post('/create', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, name, intro } = await c.req.json();;
  if (!name || name.length < 2 || name.length > 10) {
    return error(c, '帮派名称必须为2-10个字符');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const existingMember: any = await db.prepare(`
      SELECT guild_id FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existingMember) {
      return error(c, '您已加入其他帮派，无法创建');
    }

    const existingName: any = await db.prepare(`
      SELECT id FROM guilds WHERE name = ?
    `).bind(name).first();

    if (existingName) {
      return error(c, '帮派名称已被占用');
    }

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
        MaxMembership: 50,
        OfficialNumber: 5,
        Affiche: guild.notice || '',
        Intro: guild.notice || '',
      },
      MyMember: {
        UID: guildMember.id,
        UserName: walletAddress,
        Privilege: guildMember.role === 'leader' ? 5 : guildMember.role === 'officer' ? 3 : 1,
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

    // 创建申请记录表（如果不存在）
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS guild_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id INTEGER NOT NULL,
        wallet_address TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(guild_id, wallet_address)
      )
    `).run();

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

// GetMyOrgResInfo - GET /guild/my-resource
app.get('/my-resource', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const member: any = await db.prepare(`
      SELECT guild_id FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) {
      return success(c, { guildId: null, resources: null });
    }

    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(member.guild_id).first();

    return success(c, {
      guildId: member.guild_id,
      guildName: guild?.name || '',
      resources: { money: 0, food: 0, men: 0 },
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

    return success(c, {
      guildId: targetGuildId,
      guildName: guild?.name || '',
      resources: { money: 0, food: 0, men: 0 },
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
// func_type: 1=踢人, 2=审批通过, 3=审批拒绝
app.post('/boss-func', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, func_type, target_username } = await c.req.json();
  if (!guild_id || !func_type) return error(c, '参数不完整');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查是否是帮主
    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guild_id).first();

    if (!guild) return error(c, '帮派不存在', 404);

    if (guild.leader_address !== walletAddress) {
      return error(c, '只有帮主才能执行此操作', 403);
    }

    const funcType = parseInt(func_type);

    if (funcType === 1) {
      // 踢人
      if (!target_username) return error(c, '请提供目标用户名');
      if (target_username === walletAddress) return error(c, '不能踢出自己');

      const target: any = await db.prepare(`
        SELECT * FROM guild_members
        WHERE guild_id = ? AND wallet_address = ?
      `).bind(guild_id, target_username).first();

      if (!target) return error(c, '目标成员不在帮派中');

      if (target.role === 'leader') {
        return error(c, '不能踢出帮主，请先转让帮主');
      }

      await db.prepare(`
        DELETE FROM guild_members WHERE guild_id = ? AND wallet_address = ?
      `).bind(guild_id, target_username).run();

      await db.prepare(`
        UPDATE guilds SET member_count = member_count - 1 WHERE id = ?
      `).bind(guild_id).run();

      return success(c, { message: '已踢出成员' });

    } else if (funcType === 2) {
      // 审批通过
      if (!target_username) return error(c, '请提供申请人地址');

      const app: any = await db.prepare(`
        SELECT * FROM guild_applications
        WHERE guild_id = ? AND wallet_address = ? AND status = 'pending'
      `).bind(guild_id, target_username).first();

      if (!app) return error(c, '没有待处理的申请');

      if (guild.member_count >= 50) {
        return error(c, '帮派已满员');
      }

      // 更新申请状态
      await db.prepare(`
        UPDATE guild_applications SET status = 'approved' WHERE id = ?
      `).bind(app.id).run();

      // 添加到帮派
      await db.prepare(`
        INSERT INTO guild_members (guild_id, wallet_address, role, contribution)
        VALUES (?, ?, 'member', 0)
      `).bind(guild_id, target_username).run();

      await db.prepare(`
        UPDATE guilds SET member_count = member_count + 1 WHERE id = ?
      `).bind(guild_id).run();

      return success(c, { message: '已批准加入申请' });

    } else if (funcType === 3) {
      // 审批拒绝
      if (!target_username) return error(c, '请提供申请人地址');

      await db.prepare(`
        UPDATE guild_applications SET status = 'rejected'
        WHERE guild_id = ? AND wallet_address = ? AND status = 'pending'
      `).bind(guild_id, target_username).run();

      return success(c, { message: '已拒绝申请' });

    } else {
      return error(c, '未知的操作类型');
    }
  } catch (err: any) {
    return error(c, err.message);
  }
});

// Promotion - POST /guild/promotion（升职：副帮主）
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

    if (target.role === 'leader') {
      return error(c, '该成员已是帮主');
    }

    // 检查副帮主数量（最多5个）
    if (target.role !== 'officer') {
      const officerCount: any = await db.prepare(`
        SELECT COUNT(*) as count FROM guild_members
        WHERE guild_id = ? AND role = 'officer'
      `).bind(guild_id).first();

      if ((officerCount as any).count >= 5) {
        return error(c, '副帮主数量已达上限（5人）');
      }
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

// Abdication - POST /guild/abdication（转让帮主）
app.post('/abdication', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, heir_name } = await c.req.json();
  if (!guild_id || !heir_name) return error(c, '参数不完整');

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

    if (heir_name === walletAddress) {
      return error(c, '不能转让给自己');
    }

    const heir: any = await db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, heir_name).first();

    if (!heir) return error(c, '继承人不存在或不在帮派中');

    // 转让帮主
    await db.prepare(`
      UPDATE guild_members SET role = 'member'
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
app.post('/buy-resource', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { resID, resNum } = await c.req.json();
  if (!resID || !resNum || resNum <= 0) {
    return error(c, '参数不完整或数值无效');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取玩家的帮派
    const member: any = await db.prepare(`
      SELECT gm.*, g.name as guild_name
      FROM guild_members gm
      JOIN guilds g ON gm.guild_id = g.id
      WHERE gm.wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) return error(c, '您还没有加入帮派');

    // 获取城市资源
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, '您还没有城市');

    // 金币价格（每单位100金币）
    const price = resNum * 100;

    // 检查金币是否足够
    if ((city as any).money < price) {
      return error(c, `金币不足，需要${price}金币`);
    }

    // 扣除金币，添加资源到帮派
    await db.prepare(`
      UPDATE cities SET money = money - ? WHERE wallet_address = ?
    `).bind(price, walletAddress).run();

    // 更新帮派资源
    const resourceField = resID === 'money' ? 'schlep_money' :
                         resID === 'food' ? 'schlep_food' : 'schlep_men';

    await db.prepare(`
      UPDATE corps_system SET ${resourceField} = ${resourceField} + ? WHERE id = ?
    `).bind(resNum, member.guild_id).run();

    return success(c, {
      message: `成功购买${resNum}个${resID}`,
      cost: price,
      resource: resID,
      amount: resNum,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ContributeRes - POST /guild/contribute（捐献，与 /donate 类似）
app.post('/contribute', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { guild_id, resource_type, amount } = await c.req.json();
  if (!guild_id || !resource_type || !amount || amount <= 0) {
    return error(c, '参数不完整或数值无效');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const member: any = await db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guild_id, walletAddress).first();

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

    if (guild.leader_address !== walletAddress) {
      return error(c, '只有帮主才能升级帮派', 403);
    }

    const currentLevel = guild.level || 1;
    const maxLevel = 10;
    if (currentLevel >= maxLevel) {
      return error(c, '帮派已达到最高等级');
    }

    // 升级费用：每级 1000 金币
    const upgradeCost = currentLevel * 1000;

    const city: any = await db.prepare(`
      SELECT money FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city || city.money < upgradeCost) {
      return error(c, `金币不足，升级需要 ${upgradeCost} 金币`);
    }

    // 扣除金币
    await db.prepare(`
      UPDATE cities SET money = money - ? WHERE wallet_address = ?
    `).bind(upgradeCost, walletAddress).run();

    // 升级帮派
    await db.prepare(`
      UPDATE guilds SET level = level + 1 WHERE id = ?
    `).bind(guild_id).run();

    return success(c, {
      message: `帮派升级成功，当前等级 ${currentLevel + 1}`,
      newLevel: currentLevel + 1,
      cost: upgradeCost,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpgradeFameLevel - POST /guild/upgrade-fame 升级名望
app.post('/upgrade-fame', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取玩家名望等级
    const fameLevel: any = await db.prepare(`
      SELECT fame_level FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const currentLevel = (fameLevel as any)?.fame_level || 0;

    // 名望升级配置（每级所需金币）
    const upgradeCost = (currentLevel + 1) * 1000;

    // 检查金币是否足够
    const city: any = await db.prepare(`
      SELECT money FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, '您还没有城市');

    if ((city as any).money < upgradeCost) {
      return error(c, `金币不足，需要${upgradeCost}金币`);
    }

    // 扣除金币，升级名望
    await db.prepare(`
      UPDATE cities SET money = money - ? WHERE wallet_address = ?
    `).bind(upgradeCost, walletAddress).run();

    await db.prepare(`
      UPDATE characters SET fame_level = fame_level + 1 WHERE wallet_address = ?
    `).bind(walletAddress).run();

    return success(c, {
      message: `名望升级成功，当前等级 ${currentLevel + 1}`,
      newLevel: currentLevel + 1,
      cost: upgradeCost,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpgradePrestigeLevel - POST /guild/upgrade-prestige 升级声望
app.post('/upgrade-prestige', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取玩家声望等级
    const prestigeLevel: any = await db.prepare(`
      SELECT prestige_level FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const currentLevel = (prestigeLevel as any)?.prestige_level || 0;

    // 声望升级配置（每级所需金币）
    const upgradeCost = (currentLevel + 1) * 2000;

    // 检查金币是否足够
    const city: any = await db.prepare(`
      SELECT money FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, '您还没有城市');

    if ((city as any).money < upgradeCost) {
      return error(c, `金币不足，需要${upgradeCost}金币`);
    }

    // 扣除金币，升级声望
    await db.prepare(`
      UPDATE cities SET money = money - ? WHERE wallet_address = ?
    `).bind(upgradeCost, walletAddress).run();

    await db.prepare(`
      UPDATE characters SET prestige_level = prestige_level + 1 WHERE wallet_address = ?
    `).bind(walletAddress).run();

    return success(c, {
      message: `声望升级成功，当前等级 ${currentLevel + 1}`,
      newLevel: currentLevel + 1,
      cost: upgradeCost,
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