/**
 * Game Route - 游戏状态路由 (重构版)
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

// 获取服务器状态
app.get('/status', async (c) => {
  return success(c, { online: true, version: '1.0.0' });
});

// 获取用户信息 (自动注册)
app.get('/user-info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取角色
    let character: any = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!character) {
      const name = `玩家_${walletAddress.substring(2, 8)}`;
      await db.prepare(`
        INSERT INTO characters (wallet_address, name, level, exp, gold, vip_level)
        VALUES (?, ?, 1, 0, 1000, 0)
      `).bind(walletAddress, name).run();

      character = { name, level: 1, gold: 1000, vip_level: 0 };
    }

    // 获取城市
    const cities = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id
    `).bind(walletAddress).all();

    if (cities.results?.length === 0) {
      const cityName = '主城';
      await db.prepare(`
        INSERT INTO cities (wallet_address, name, position, prosperity, money, food, population)
        VALUES (?, ?, ?, 100, 3000, 3000, 300)
      `).bind(walletAddress, cityName, Math.floor(Math.random() * 100) + 1).run();
    }

    const cityList = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id
    `).bind(walletAddress).all();

    return success(c, {
      character: {
        name: character.name,
        level: character.level,
        gold: character.gold,
      },
      cities: cityList.results || [],
    });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
