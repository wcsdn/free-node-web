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

    // 获取成员数量
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

  const { search } = c.req.query();
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

    if (search) {
      query += ' WHERE g.name LIKE ?';
      params.push(`%${search}%`);
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

  const { name } = await c.req.json();
  if (!name || name.length < 2 || name.length > 10) {
    return error(c, '帮派名称必须为2-10个字符');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查是否已有帮派
    const existingMember: any = await db.prepare(`
      SELECT guild_id FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existingMember) {
      return error(c, '您已加入其他帮派，无法创建');
    }

    // 检查名称是否已存在
    const existingName: any = await db.prepare(`
      SELECT id FROM guilds WHERE name = ?
    `).bind(name).first();

    if (existingName) {
      return error(c, '帮派名称已被占用');
    }

    // 创建帮派
    const result = await db.prepare(`
      INSERT INTO guilds (name, leader_address, notice, member_count)
      VALUES (?, ?, '欢迎加入', 1)
    `).bind(name, walletAddress).run();

    const guildId = result.meta.last_row_id;

    // 创建者自动成为管理员
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

    // 获取成员列表
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

// 加入帮派
app.post('/:guildId/join', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const guildId = parseInt(c.req.param('guildId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查是否已有帮派
    const existingMember: any = await db.prepare(`
      SELECT guild_id FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existingMember) {
      return error(c, '您已加入其他帮派');
    }

    // 检查帮派是否存在且未满
    const guild: any = await db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guildId).first();

    if (!guild) return error(c, '帮派不存在', 404);

    if (guild.member_count >= 50) {
      return error(c, '帮派已满员');
    }

    // 加入帮派
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
    // 验证成员身份
    const member: any = await db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guildId, walletAddress).first();

    if (!member) return error(c, '您不是该帮派成员');

    // 获取城市资源
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, '您还没有城市');

    // 验证资源
    let resourceField = resource_type === 'money' ? 'money' : 
                        resource_type === 'food' ? 'food' : 'population';
    
    if ((city as any)[resourceField] < amount) {
      return error(c, `您的${resource_type}不足`);
    }

    // 扣除资源
    await db.prepare(`
      UPDATE cities SET ${resourceField} = ${resourceField} - ? WHERE wallet_address = ?
    `).bind(amount, walletAddress).run();

    // 增加贡献度 (100资源=1贡献)
    const contribution = Math.floor(amount / 100);
    
    await db.prepare(`
      UPDATE guild_members SET contribution = contribution + ? 
      WHERE guild_id = ? AND wallet_address = ?
    `).bind(contribution, guildId, walletAddress).run();

    // 帮派增加资源
    const resourceMap: Record<string, string> = {
      money: 'schlep_money',
      food: 'schlep_food',
      men: 'schlep_men',
    };

    await db.prepare(`
      UPDATE corps_system SET ${resourceMap[resource_type]} = ${resourceMap[resource_type]} + ?
      WHERE id = ?
    `).bind(amount, guildId).run();

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

export default app;
