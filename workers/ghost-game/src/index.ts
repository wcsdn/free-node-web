/**
 * Ghost Game Worker
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types';

// 导入路由 - 按字母顺序排列
import adminRoutes from './routes/admin';
import appendantNpcRoutes from './routes/appendant-npc';
import arenaRoutes from './routes/arena';
import battleRoutes from './routes/battle';
import buildingRoutes from './routes/building';
import cityExtRoutes from './routes/city-ext';
import chatRoutes from './routes/chat';
import corpsRoutes from './routes/corps';
import defenseRoutes from './routes/defense';
import effectRoutes from './routes/effect';
import eventRoutes from './routes/event';
import eventExtRoutes from './routes/event-ext';
import gameRoutes from './routes/game';
import guildRoutes from './routes/guild';
import heroRoutes from './routes/hero';
import heroExtRoutes from './routes/hero-ext';
import itemRoutes from './routes/item';
import itemExtRoutes from './routes/item-ext';
import mailRoutes from './routes/mail';
import mailExtRoutes from './routes/mail-ext';
import mapRoutes from './routes/map';
import marketRoutes from './routes/market';
import organizeExtRoutes from './routes/organize-ext';
import persistEffectExtRoutes from './routes/persist-effect-ext';
import rankRoutes from './routes/rank';
import shopRoutes from './routes/shop';
import taskRoutes from './routes/task';
import techRoutes from './routes/tech';
import userExtRoutes from './routes/user-ext';
import warfareRoutes from './routes/warfare';

const app = new Hono<{ Bindings: Env }>();

// CORS 中间件
app.use('*', cors({
  origin: (origin) => origin || '*',
  allowHeaders: ['Content-Type', 'X-Wallet-Auth', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  maxAge: 86400,
}));

// app.use('*', logger()); // 已禁用全局日志

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'ghost-game',
    timestamp: new Date().toISOString(),
  });
});

// API 路由 - 按字母顺序注册
app.route('/api/admin', adminRoutes);
app.route('/api/appendant-npc', appendantNpcRoutes);
app.route('/api/arena', arenaRoutes);
app.route('/api/battle', battleRoutes);
app.route('/api/building', buildingRoutes);
app.route('/api/city-ext', cityExtRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/corps', corpsRoutes);
app.route('/api/defense', defenseRoutes);
app.route('/api/effect', effectRoutes);
app.route('/api/event', eventRoutes);
app.route('/api/event-ext', eventExtRoutes);
app.route('/api/game', gameRoutes);
app.route('/api/guild', guildRoutes);
app.route('/api/hero', heroRoutes);
app.route('/api/hero-ext', heroExtRoutes);
app.route('/api/item', itemRoutes);
app.route('/api/item-ext', itemExtRoutes);
app.route('/api/mail', mailRoutes);
app.route('/api/mail-ext', mailExtRoutes);
app.route('/api/map', mapRoutes);
app.route('/api/market', marketRoutes);
app.route('/api/organize-ext', organizeExtRoutes);
app.route('/api/persist-effect-ext', persistEffectExtRoutes);
app.route('/api/rank', rankRoutes);
app.route('/api/shop', shopRoutes);
app.route('/api/task', taskRoutes);
app.route('/api/tech', techRoutes);
app.route('/api/user-ext', userExtRoutes);
app.route('/api/warfare', warfareRoutes);

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
