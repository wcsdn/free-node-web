/**
 * 帮助路由
 */
import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

// 根路径 - 获取帮助分类
app.get('/', async (c) => {
  const categories = [
    { id: 1, name: '新手引导', icon: 'guide', sortOrder: 1 },
    { id: 2, name: '游戏玩法', icon: 'gameplay', sortOrder: 2 },
    { id: 3, name: '武将系统', icon: 'hero', sortOrder: 3 },
    { id: 4, name: '建筑系统', icon: 'building', sortOrder: 4 },
    { id: 5, name: '战斗系统', icon: 'battle', sortOrder: 5 },
    { id: 6, name: '军团系统', icon: 'corps', sortOrder: 6 },
  ];

  return success(c, categories);
});

// 获取分类下的文章
app.get('/category/:id', async (c) => {
  const articles = [
    { id: 1, title: '如何创建角色', content: '首次登录会自动创建角色...' },
    { id: 2, title: '如何招募武将', content: '在武将界面消耗金币即可招募...' },
    { id: 3, title: '如何建造建筑', content: '在城市界面选择建造功能...' },
  ];

  return success(c, articles);
});

// 获取文章详情
app.get('/article/:id', async (c) => {
  return success(c, {
    id: 1,
    title: '新手引导',
    content: '欢迎来到剑侠情缘！这是新手引导...',
    categoryId: 1,
  });
});

export default app;
