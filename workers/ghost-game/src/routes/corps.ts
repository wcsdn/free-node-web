/**
 * 军团系统 API
 * 军团管理、武将分配、出征召回、支援战斗
 * 参考原项目 jx/BLL/Corps.cs 实现
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 军团状态 (参考原项目 CorpsInfo.State)
// 0-驻守, 1-攻击, 2-支援, 3-返回中
const CORPS_STATE = {
  GARRISON: 0,
  ATTACK: 1,
  SUPPORT: 2,
  RETURNING: 3,
};

function getCorpsStateText(state: number): string {
  switch (state) {
    case CORPS_STATE.GARRISON: return '驻守';
    case CORPS_STATE.ATTACK: return '攻击';
    case CORPS_STATE.SUPPORT: return '支援';
    case CORPS_STATE.RETURNING: return '返回中';
    default: return '未知';
  }
}

// 军团阵型配置
const CORPS_FORMATIONS = [
  { id: 0, name: '鱼鳞阵', attack: 1.0, defense: 0.9 },
  { id: 1, name: '锋矢阵', attack: 1.2, defense: 0.7 },
  { id: 2, name: '鹤翼阵', attack: 0.9, defense: 1.1 },
  { id: 3, name: '八卦阵', attack: 0.8, defense: 1.3 },
];

// 获取军团列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    const corps = await db.prepare(`
      SELECT 
        c.*,
        ci.name as city_name,
        (SELECT COUNT(*) FROM corps_heroes ch WHERE ch.corps_id = c.id) as hero_count
      FROM corps_system c
      JOIN cities ci ON c.city_id = ci.id
      WHERE c.leader_id = ?
      ORDER BY c.created_at DESC
    `).bind(walletAddress).all();

    const corpsList = (corps.results || []).map((corpsItem: any) => ({
      id: corpsItem.id,
      name: corpsItem.name,
      cityId: corpsItem.city_id,
      state: corpsItem.state || 0,
      stateText: getCorpsStateText(corpsItem.state || 0),
      targetPosition: corpsItem.target_position,
      arriveTime: corpsItem.arrive_time,
      formation: corpsItem.formation || 0,
      schlepMoney: corpsItem.schlep_money || 0,
      schlepFood: corpsItem.schlep_food || 0,
      schlepMen: corpsItem.schlep_men || 0,
      insignia: corpsItem.insignia || 0,
      cityName: corpsItem.city_name,
      heroCount: corpsItem.hero_count,
    }));

    return success(c, corpsList);
  } catch (err: any) {
    console.error('Get corps list error:', err);
    return error(c, err.message || '获取军团列表失败');
  }
});

// 创建军团
app.post('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { name, cityId, formation } = await c.req.json();
  
  if (!name || name.length < 2 || name.length > 10) {
    return error(c, '军团名称必须为2-10个字符');
  }
  if (!cityId) return error(c, '请选择城市');

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    const city: any = await db.prepare(`
      SELECT id, LOWER(wallet_address) as wallet_addr FROM cities WHERE id = ?
    `).bind(cityId).first();

    if (!city) return error(c, '城市不存在');
    if (city.wallet_addr !== walletAddress.toLowerCase()) {
      return error(c, '城市不存在或无权限');
    }

    const existingCorps = await db.prepare(`
      SELECT id FROM corps_system WHERE leader_id = ?
    `).bind(walletAddress).first();

    if (existingCorps) return error(c, '每位玩家只能创建一个军团');

    const result = await db.prepare(`
      INSERT INTO corps_system (name, leader_id, city_id, level, exp, notice, member_count, 
        state, formation, schlep_money, schlep_food, schlep_men, insignia,
        target_position, arrive_time)
      VALUES (?, ?, ?, 1, 0, '欢迎加入！', 1,
        0, ?, 0, 0, 0, 0, 0, NULL)
    `).bind(name, walletAddress, cityId, formation || 0).run();

    const corpsId = result.meta.last_row_id;

    await db.prepare(`
      INSERT INTO corps_members (corps_id, wallet_address, role, contribution)
      VALUES (?, ?, 'leader', 0)
    `).bind(corpsId, walletAddress).run();

    return success(c, {
      id: corpsId,
      name,
      cityId,
      state: CORPS_STATE.GARRISON,
      stateText: '驻守',
      formation: formation || 0,
      heroCount: 0,
    });
  } catch (err: any) {
    console.error('Create corps error:', err);
    return error(c, err.message || '创建军团失败');
  }
});

// 解散军团
app.delete('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const corpsId = parseInt(c.req.param('id'));
  if (!corpsId) return error(c, 'Invalid corps ID');

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    const corps = await db.prepare(`
      SELECT * FROM corps_system WHERE id = ? AND leader_id = ?
    `).bind(corpsId, walletAddress).first();

    if (!corps) return error(c, '军团不存在或无权限');

    if ((corps as any).state !== CORPS_STATE.GARRISON) {
      return error(c, '行军中的军团不能解散');
    }

    await db.prepare(`
      UPDATE heroes SET state = 0 WHERE id IN (
        SELECT hero_id FROM corps_heroes WHERE corps_id = ?
      )
    `).bind(corpsId).run();

    await db.prepare(`DELETE FROM corps_heroes WHERE corps_id = ?`).bind(corpsId).run();
    await db.prepare(`DELETE FROM corps_members WHERE corps_id = ?`).bind(corpsId).run();
    await db.prepare(`DELETE FROM corps_system WHERE id = ?`).bind(corpsId).run();

    return success(c, { message: '军团已解散' });
  } catch (err: any) {
    console.error('Disband corps error:', err);
    return error(c, err.message || '解散军团失败');
  }
});

// 获取军团详情
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const idParam = c.req.param('id');
  // 保留路径不匹配，返回404让其他路由处理
  if (idParam === 'member' || idParam === 'config' || idParam === 'formation' || isNaN(parseInt(idParam))) {
    return c.json({ success: false, error: 'Not Found' }, 404);
  }
  
  const corpsId = parseInt(idParam);

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    const corps = await db.prepare(`
      SELECT c.*, ci.name as city_name
      FROM corps_system c
      JOIN cities ci ON c.city_id = ci.id
      WHERE c.id = ?
    `).bind(corpsId).first();

    if (!corps) return error(c, '军团不存在');

    const corpsAny = corps as any;
    const formationId = corpsAny.formation || 0;

    const heroes = await db.prepare(`
      SELECT h.*, ch.position
      FROM heroes h
      JOIN corps_heroes ch ON h.id = ch.hero_id
      WHERE ch.corps_id = ?
      ORDER BY ch.position
    `).bind(corpsId).all();

    let totalHp = 0, totalAttack = 0, totalDefense = 0;
    (heroes.results || []).forEach((h: any) => {
      totalHp += h.hp || 0;
      totalAttack += h.attack || 0;
      totalDefense += h.defense || 0;
    });

    return success(c, {
      id: corpsAny.id,
      name: corpsAny.name,
      cityId: corpsAny.city_id,
      cityName: corpsAny.city_name,
      state: corpsAny.state || 0,
      stateText: getCorpsStateText(corpsAny.state || 0),
      targetPosition: corpsAny.target_position,
      arriveTime: corpsAny.arrive_time,
      formation: formationId,
      formationInfo: CORPS_FORMATIONS[formationId],
      schlepMoney: corpsAny.schlep_money || 0,
      schlepFood: corpsAny.schlep_food || 0,
      schlepMen: corpsAny.schlep_men || 0,
      insignia: corpsAny.insignia || 0,
      level: corpsAny.level,
      exp: corpsAny.exp,
      heroes: heroes.results || [],
      totalHp,
      totalAttack,
      totalDefense,
    });
  } catch (err: any) {
    console.error('Get corps detail error:', err);
    return error(c, err.message || '获取军团详情失败');
  }
});

// 修改军团阵型
app.post('/:id/formation', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const corpsId = parseInt(c.req.param('id'));
  const { formationId } = await c.req.json();
  
  if (!corpsId) return error(c, 'Invalid corps ID');
  if (formationId < 0 || formationId >= CORPS_FORMATIONS.length) {
    return error(c, '无效的阵型');
  }

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    const corps = await db.prepare(`
      SELECT * FROM corps_system WHERE id = ? AND leader_id = ?
    `).bind(corpsId, walletAddress).first();

    if (!corps) return error(c, '军团不存在或无权限');

    if ((corps as any).state !== CORPS_STATE.GARRISON) {
      return error(c, '只有驻守状态才能修改阵型');
    }

    await db.prepare(`
      UPDATE corps_system SET formation = ? WHERE id = ?
    `).bind(formationId, corpsId).run();

    return success(c, {
      formation: formationId,
      formationInfo: CORPS_FORMATIONS[formationId],
      message: '阵型修改成功',
    });
  } catch (err: any) {
    console.error('Set formation error:', err);
    return error(c, err.message || '修改阵型失败');
  }
});

// 出征 (攻击/支援)
app.post('/:id/march', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const corpsId = parseInt(c.req.param('id'));
  const { targetPosition, type, schlepMoney, schlepFood, schlepMen } = await c.req.json();
  
  if (!corpsId) return error(c, 'Invalid corps ID');
  if (!targetPosition && targetPosition !== 0) return error(c, '请选择目标位置');

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    const corps = await db.prepare(`
      SELECT cs.*, ci.position as city_pos
      FROM corps_system cs
      JOIN cities ci ON cs.city_id = ci.id
      WHERE cs.id = ? AND cs.leader_id = ?
    `).bind(corpsId, walletAddress).first();

    if (!corps) return error(c, '军团不存在或无权限');

    const corpsAny = corps as any;
    if (corpsAny.state !== CORPS_STATE.GARRISON) {
      return error(c, '军团已经在行军中');
    }

    const heroCount = await db.prepare(`
      SELECT COUNT(*) as count FROM corps_heroes WHERE corps_id = ?
    `).bind(corpsId).first();

    if (!heroCount || (heroCount as any).count === 0) {
      return error(c, '军团没有武将，无法出征');
    }

    const distance = Math.abs(targetPosition - corpsAny.city_pos);
    const travelTime = Math.max(10, distance * 10);
    const arriveTime = new Date(Date.now() + travelTime * 1000).toISOString();

    const marchType = type === 'support' ? CORPS_STATE.SUPPORT : CORPS_STATE.ATTACK;

    await db.prepare(`
      UPDATE corps_system 
      SET state = ?, target_position = ?, arrive_time = ?,
          schlep_money = ?, schlep_food = ?, schlep_men = ?
      WHERE id = ?
    `).bind(
      marchType, 
      targetPosition, 
      arriveTime,
      schlepMoney || 0,
      schlepFood || 0,
      schlepMen || 0,
      corpsId
    ).run();

    await db.prepare(`
      UPDATE heroes SET state = 1 WHERE id IN (
        SELECT hero_id FROM corps_heroes WHERE corps_id = ?
      )
    `).bind(corpsId).run();

    return success(c, {
      state: marchType,
      stateText: marchType === CORPS_STATE.ATTACK ? '攻击' : '支援',
      targetPosition,
      arriveTime,
      travelTime,
      message: `${marchType === CORPS_STATE.ATTACK ? '攻击' : '支援'}${targetPosition}，预计${travelTime}秒到达`,
    });
  } catch (err: any) {
    console.error('March error:', err);
    return error(c, err.message || '出征失败');
  }
});

// 召回
app.post('/:id/recall', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const corpsId = parseInt(c.req.param('id'));
  if (!corpsId) return error(c, 'Invalid corps ID');

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    const corps = await db.prepare(`
      SELECT cs.*, ci.position as city_pos
      FROM corps_system cs
      JOIN cities ci ON cs.city_id = ci.id
      WHERE cs.id = ? AND cs.leader_id = ?
    `).bind(corpsId, walletAddress).first();

    if (!corps) return error(c, '军团不存在或无权限');

    const corpsAny = corps as any;
    if (corpsAny.state === CORPS_STATE.GARRISON) {
      return error(c, '军团已在驻守状态');
    }

    const distance = Math.abs((corpsAny.target_position || 0) - corpsAny.city_pos);
    const returnTime = Math.max(10, distance * 10);
    const arriveTime = new Date(Date.now() + returnTime * 1000).toISOString();

    await db.prepare(`
      UPDATE corps_system 
      SET state = ?, target_position = ?, arrive_time = ?
      WHERE id = ?
    `).bind(CORPS_STATE.RETURNING, corpsAny.city_id, arriveTime, corpsId).run();

    return success(c, {
      state: CORPS_STATE.RETURNING,
      stateText: '返回中',
      targetPosition: corpsAny.city_id,
      arriveTime,
      travelTime: returnTime,
      message: `召回中，预计${returnTime}秒后返回`,
    });
  } catch (err: any) {
    console.error('Recall error:', err);
    return error(c, err.message || '召回失败');
  }
});

// 军团战斗结算
app.post('/:id/battle-result', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const corpsId = parseInt(c.req.param('id'));
  const { win, gainedInsignia, gainedExp, gainedResources } = await c.req.json();
  
  if (!corpsId) return error(c, 'Invalid corps ID');

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    const corps = await db.prepare(`
      SELECT * FROM corps_system WHERE id = ? AND leader_id = ?
    `).bind(corpsId, walletAddress).first();

    if (!corps) return error(c, '军团不存在或无权限');

    await db.prepare(`
      UPDATE corps_system 
      SET insignia = insignia + ?, exp = exp + ?,
          schlep_money = schlep_money + ?,
          schlep_food = schlep_food + ?,
          schlep_men = schlep_men + ?
      WHERE id = ?
    `).bind(
      gainedInsignia || 0,
      gainedExp || 0,
      gainedResources?.money || 0,
      gainedResources?.food || 0,
      gainedResources?.men || 0,
      corpsId
    ).run();

    if (win && gainedExp > 0) {
      await db.prepare(`
        UPDATE heroes SET exp = exp + ? WHERE id IN (
          SELECT hero_id FROM corps_heroes WHERE corps_id = ?
        )
      `).bind(Math.floor((gainedExp || 0) / 2), corpsId).run();
    }

    return success(c, { message: '战斗结算完成' });
  } catch (err: any) {
    console.error('Battle result error:', err);
    return error(c, err.message || '结算失败');
  }
});

// 获取阵型列表
app.get('/config/formations', async (c) => {
  return success(c, CORPS_FORMATIONS);
});

// 获取军团武将
app.get('/:id/heroes', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const corpsId = parseInt(c.req.param('id'));
  if (!corpsId) return error(c, 'Invalid corps ID');

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    const heroes = await db.prepare(`
      SELECT h.*, ch.position, ch.status as corps_status
      FROM heroes h
      JOIN corps_heroes ch ON h.id = ch.hero_id
      WHERE ch.corps_id = ?
      ORDER BY ch.position
    `).bind(corpsId).all();

    return success(c, heroes.results || []);
  } catch (err: any) {
    console.error('Get corps heroes error:', err);
    return error(c, err.message || '获取军团武将失败');
  }
});

// 添加武将到军团
app.post('/:id/add-hero', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const corpsId = parseInt(c.req.param('id'));
  const { heroId } = await c.req.json();
  
  if (!corpsId || !heroId) return error(c, 'Invalid parameters');

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    const corps = await db.prepare(`
      SELECT * FROM corps_system WHERE id = ? AND leader_id = ?
    `).bind(corpsId, walletAddress).first();

    if (!corps) return error(c, '军团不存在或无权限');

    if ((corps as any).state !== CORPS_STATE.GARRISON) {
      return error(c, '只有驻守状态才能添加武将');
    }

    const hero = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) return error(c, '武将不存在');
    if ((hero as any).state !== 0) return error(c, '武将正在忙碌中');

    const existing = await db.prepare(`
      SELECT * FROM corps_heroes WHERE hero_id = ?
    `).bind(heroId).first();

    if (existing) return error(c, '武将已在军团中');

    const count = await db.prepare(`
      SELECT COUNT(*) as count FROM corps_heroes WHERE corps_id = ?
    `).bind(corpsId).first();

    const maxHeroes = 5;
    if (count && (count as any).count >= maxHeroes) {
      return error(c, `军团最多${maxHeroes}名武将`);
    }

    await db.prepare(`
      INSERT INTO corps_heroes (corps_id, hero_id, status, position)
      VALUES (?, ?, 0, ?)
    `).bind(corpsId, heroId, (count as any)?.count || 0).run();

    await db.prepare(`UPDATE heroes SET state = 1 WHERE id = ?`).bind(heroId).run();

    return success(c, { message: '武将已添加' });
  } catch (err: any) {
    console.error('Add hero error:', err);
    return error(c, err.message || '添加失败');
  }
});

// 从军团移除武将
app.post('/:id/remove-hero', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const corpsId = parseInt(c.req.param('id'));
  const { heroId } = await c.req.json();
  
  if (!corpsId || !heroId) return error(c, 'Invalid parameters');

  const db = c.env.DB;
  if (!db) return error(c, '数据库未配置', 503);

  try {
    await db.prepare(`
      DELETE FROM corps_heroes WHERE corps_id = ? AND hero_id = ?
    `).bind(corpsId, heroId).run();

    await db.prepare(`UPDATE heroes SET state = 0 WHERE id = ?`).bind(heroId).run();

    return success(c, { message: '武将已移除' });
  } catch (err: any) {
    console.error('Remove hero error:', err);
    return error(c, err.message || '移除失败');
  }
});

export default app;
