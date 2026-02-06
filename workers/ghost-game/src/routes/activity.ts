/**
 * 活动路由 - D1数据库版本
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

// 根路径 - 获取活动列表
app.get('/', async (c) => {
  const activities = [
    { id: 1, name: '每日签到', description: '登录领取奖励', reward: '100金币', status: 'active' },
    { id: 2, name: '新手引导', description: '完成新手任务', reward: '500金币', status: 'active' },
    { id: 3, name: '副本挑战', description: '通关副本获得奖励', reward: '大量经验', status: 'active' },
    { id: 4, name: '竞技场', description: '挑战其他玩家', reward: '排名奖励', status: 'active' },
    { id: 5, name: '军团战', description: '参与军团活动', reward: '军团贡献', status: 'active' },
  ];

  return success(c, activities);
});

// 领取活动奖励
app.post('/:id/claim', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, { message: 'Reward claimed' });
});

export default app;
