import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { OrganizeServiceExtension, ORGANIZE_ROLES, ORGANIZE_LEVEL_CONFIG } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) { return c.json({ success: true, data }); }
function error(c: any, msg: string) { return c.json({ success: false, error: msg }); }

// 创建军团
app.post('/create', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { name, intro } = await c.req.json();
  const result = await new OrganizeServiceExtension(db).createOrganize(wallet, name, intro);
  if (!result.success) return error(c, result.error);
  return success(c, result);
});

// 申请加入
app.post('/apply', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { org_name } = await c.req.json();
  const result = await new OrganizeServiceExtension(db).applyJoin(wallet, org_name);
  return success(c, result);
});

// 审批申请
app.post('/approve', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { applicant_wallet, approve } = await c.req.json();
  const result = await new OrganizeServiceExtension(db).approveApplication(wallet, applicant_wallet, approve);
  return success(c, result);
});

// 任命职位
app.post('/set-role', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { target_wallet, role_id } = await c.req.json();
  const result = await new OrganizeServiceExtension(db).setRole(wallet, target_wallet, role_id);
  return success(c, result);
});

// 踢出成员
app.post('/kick', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { target_wallet } = await c.req.json();
  const result = await new OrganizeServiceExtension(db).kickMember(wallet, target_wallet);
  return success(c, result);
});

// 退出军团
app.post('/quit', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new OrganizeServiceExtension(db).quitOrganize(wallet);
  return success(c, result);
});

// 解散军团
app.post('/disband', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new OrganizeServiceExtension(db).disbandOrganize(wallet);
  if (!result.success) return error(c, result.error);
  return success(c, result);
});

// 我的军团
app.get('/my', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new OrganizeServiceExtension(db).getMyOrganize(wallet);
  return success(c, result);
});

// 军团列表
app.get('/list', async (c) => {
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { page, page_size, keyword } = c.req.query();
  const result = await new OrganizeServiceExtension(db).getOrganizeList(
    parseInt(page || '1'), parseInt(page_size || '10'), keyword
  );
  return success(c, result);
});

// 成员列表
app.get('/members', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new OrganizeServiceExtension(db).getMemberList(wallet);
  return success(c, result);
});

// 贡献资源
app.post('/contribute', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { res_type, amount } = await c.req.json();
  const result = await new OrganizeServiceExtension(db).contribute(wallet, res_type, amount);
  return success(c, result);
});

// 军团商店
app.get('/shop', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new OrganizeServiceExtension(db).getShopList(wallet);
  return success(c, result);
});

// 购买商店物品
app.post('/shop/buy', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { item_id } = await c.req.json();
  const result = await new OrganizeServiceExtension(db).buyShopItem(wallet, item_id);
  if (!result.success) return error(c, result.error);
  return success(c, result);
});

// 修改公告
app.post('/notice', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { notice } = await c.req.json();
  const result = await new OrganizeServiceExtension(db).setNotice(wallet, notice);
  return success(c, result);
});

export default app;
