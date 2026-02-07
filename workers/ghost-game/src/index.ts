/**
 * Ghost Game Worker
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types';

// 导入路由
import characterRoutes from './routes/character';
import cityRoutes from './routes/city';
import battleRoutes from './routes/battle';
import heroRoutes from './routes/hero';
import buildingRoutes from './routes/building';
import taskRoutes from './routes/task';
import shopRoutes from './routes/shop';
import marketRoutes from './routes/market';
import mailRoutes from './routes/mail';
import rankRoutes from './routes/rank';
import militaryRoutes from './routes/military';
import dungeonRoutes from './routes/dungeon';
import defenseRoutes from './routes/defense';
import itemRoutes from './routes/item';
import arenaRoutes from './routes/arena';
import gameRoutes from './routes/game';
import chatRoutes from './routes/chat';
import helpRoutes from './routes/help';
import signinRoutes from './routes/signin';
import dailyRoutes from './routes/daily';
import notificationRoutes from './routes/notification';
import corpsRoutes from './routes/corps';
import itemCraftRoutes from './routes/item-craft';
import corpsMemberRoutes from './routes/corps-member';
import skillRoutes from './routes/skill';
import techRoutes from './routes/tech';
import activityRoutes from './routes/activity';
import feishuRoutes from './routes/feishu';
import eventRoutes from './routes/event';
import persistEffectRoutes from './routes/persist-effect';
import festivalRoutes from './routes/festival';
import mapRoutes from './routes/map';

const app = new Hono<{ Bindings: Env }>();

// 使用 Hono 的 CORS 中间件
app.use('*', cors({
  origin: (origin) => origin || 'http://localhost:5174', // 允许所有来源
  allowHeaders: ['Content-Type', 'X-Wallet-Auth', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  maxAge: 86400,
}));

app.use('*', logger());

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'ghost-game',
    timestamp: new Date().toISOString(),
  });
});

// API 路由
app.route('/api/character', characterRoutes);
app.route('/api/user', characterRoutes);
app.route('/api/city', cityRoutes);
app.route('/api/battle', battleRoutes);
app.route('/api/hero', heroRoutes);
app.route('/api/building', buildingRoutes);
app.route('/api/task', taskRoutes);
app.route('/api/shop', shopRoutes);
app.route('/api/market', marketRoutes);
app.route('/api/mail', mailRoutes);
app.route('/api/rank', rankRoutes);
app.route('/api/military', militaryRoutes);
app.route('/api/dungeon', dungeonRoutes);
app.route('/api/defense', defenseRoutes);
app.route('/api/item', itemRoutes);
app.route('/api/arena', arenaRoutes);
app.route('/api/game', gameRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/help', helpRoutes);
app.route('/api/signin', signinRoutes);
app.route('/api/daily', dailyRoutes);
app.route('/api/notification', notificationRoutes);
// 先注册 corps-member，避免与 corps/:id 路由冲突
app.route('/api/corps/member', corpsMemberRoutes);
app.route('/api/corps', corpsRoutes);
app.route('/api/item/craft', itemCraftRoutes);
app.route('/api/skill', skillRoutes);
app.route('/api/tech', techRoutes);
app.route('/api/activity', activityRoutes);
app.route('/api/feishu', feishuRoutes);
app.route('/api/event', eventRoutes);
app.route('/api/effect', persistEffectRoutes);
app.route('/api/festival', festivalRoutes);
app.route('/api/map', mapRoutes);

// 404 处理
app.notFound((c) => {
  return c.json({ success: false, error: 'Not Found' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json({ success: false, error: 'Internal Server Error', message: err.message }, 500);
});

export default app;
