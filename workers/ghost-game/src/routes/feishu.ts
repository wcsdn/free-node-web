/**
 * Feishu Route - 飞书 Webhook 路由 (重构版)
 */
import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

// 发送消息到 OpenClaw
async function sendToOpenClaw(c: any, content: string): Promise<boolean> {
  try {
    const GATEWAY_URL = c.env.GATEWAY_URL || 'http://127.0.0.1:18789';
    const GATEWAY_TOKEN = c.env.GATEWAY_TOKEN || '';

    const res = await fetch(`${GATEWAY_URL}/api/v1/sessions/main/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({ content: `[飞书] ${content}` }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

// 飞书事件回调
app.post('/event', async (c) => {
  const body = await c.req.json();

  // 处理消息事件
  if (body.event?.message) {
    const msg = body.event.message;
    const content = msg.content || msg.text || '';
    await sendToOpenClaw(c, content);
  }

  return success(c, { message: 'Received' });
});

// 飞书消息回调
app.post('/message', async (c) => {
  const body = await c.req.json();
  const content = body.content || '';

  await sendToOpenClaw(c, content);

  return success(c, { message: 'Forwarded' });
});

export default app;
