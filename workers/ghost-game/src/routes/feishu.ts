/**
 * 飞书 Webhook 路由
 * 处理飞书消息收发，转发到 OpenClaw 会话
 */

import { Hono } from 'hono';
import type { Env } from '../types';

const feishuRoutes = new Hono<{ Bindings: Env }>();

// 配置
const GATEWAY_URL = 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = '62612b78da176ac6c9ee21d3c6937547b48fb04a67346857';

// 消息缓存（用于回复）
const messageCache = new Map<string, { openId: string; content: string; time: number }>();

// 解析飞书消息内容
function parseFeishuContent(content: string): string {
  try {
    const decoded = atob(content);
    const parsed = JSON.parse(decoded);
    return parsed.text || parsed.content || content;
  } catch {
    return content;
  }
}

// 发送消息到 OpenClaw 主会话
async function sendToOpenClaw(senderId: string, content: string, messageId: string): Promise<boolean> {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/v1/sessions/main/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        content: `[飞书消息] ${content}`,
      }),
    });
    
    if (response.ok) {
      // 缓存消息，用于回复
      messageCache.set(messageId, { openId: senderId, content, time: Date.now() });
      console.log(`✅ 消息已转发: ${messageId}`);
      return true;
    }
    console.error(`❌ 转发失败: ${response.statusText}`);
    return false;
  } catch (err) {
    console.error(`❌ 转发异常: ${err}`);
    return false;
  }
}

// 验证飞书签名
async function verifySignature(body: string, timestamp: string, signature: string, appSecret: string): Promise<boolean> {
  if (!appSecret || !signature) return true;
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signStr = timestamp + body;
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signStr));
    const expected = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature === expected;
  } catch {
    return false;
  }
}

// Webhook 事件接收
feishuRoutes.post('/webhook', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.text();
    const timestamp = c.req.header('X-Lark-Request-Timestamp') || '';
    const signature = c.req.header('X-Lark-Signature') || '';
    const appSecret = c.env.FEISHU_APP_SECRET || '';
    
    // 验证签名
    if (!await verifySignature(body, timestamp, signature, appSecret)) {
      console.log('⚠️ 签名验证失败');
      return c.json({ success: false, error: 'Invalid signature' }, 401);
    }
    
    const event = JSON.parse(body);
    
    // URL 验证
    if (event.type === 'url_verification') {
      console.log('🔐 URL 验证');
      return c.json({ challenge: event.challenge });
    }
    
    // 心跳
    if (event.type === 'ping') {
      return c.json({ success: true });
    }
    
    // 消息事件
    if (event.event?.message) {
      const message = event.event.message;
      const senderId = event.event.sender?.open_id || event.event.sender?.user_id || 'unknown';
      const messageType = message.message_type;
      const messageContent = messageType === 'text' 
        ? parseFeishuContent(message.content || '')
        : `[${messageType}]`;
      
      
      console.log('📨 === 收到飞书消息 ===');
      console.log(`   消息ID: ${message.message_id}`);
      console.log(`   发送者: ${senderId}`);
      console.log(`   类型: ${messageType}`);
      console.log(`   内容: ${messageContent}`);
      console.log(`   耗时: ${Date.now() - startTime}ms`);
      
      // 转发到 OpenClaw
      await sendToOpenClaw(senderId, messageContent, message.message_id);
      
      return c.json({ success: true, messageId: message.message_id });
    }
    
    return c.json({ success: true });
  } catch (err) {
    console.error(`❌ 处理错误: ${err}`);
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

// 发送消息给飞书用户
feishuRoutes.post('/send', async (c) => {
  try {
    const { open_id, content, msg_type = 'text' } = await c.req.json();
    
    if (!open_id || !content) {
      return c.json({ success: false, error: '缺少 open_id 或 content' }, 400);
    }
    
    const appId = c.env.FEISHU_APP_ID;
    const appSecret = c.env.FEISHU_APP_SECRET;
    
    if (!appId || !appSecret) {
      return c.json({ success: false, error: '飞书配置不完整' }, 500);
    }
    
    // 获取 access_token
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    
    const tokenData: any = await tokenRes.json();
    if (!tokenData.tenant_access_token) {
      return c.json({ success: false, error: '获取 token 失败' }, 500);
    }
    
    // 发送消息
    const contentEncoded = msg_type === 'text' 
      ? JSON.stringify({ text: content })
      : JSON.stringify(content);
    
    const sendRes = await fetch('https://open.feishu.cn/open-apis/im/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.tenant_access_token}`,
      },
      body: JSON.stringify({
        receive_id_type: 'open_id',
        receive_id: open_id,
        msg_type: msg_type,
        content: contentEncoded,
      }),
    });
    
    const sendData: any = await sendRes.json();
    
    if (sendData.code === 0) {
      console.log(`✅ 消息已发送: ${sendData.data.message_id}`);
      return c.json({ success: true, messageId: sendData.data.message_id });
    }
    
    console.error(`❌ 发送失败: ${sendData.msg}`);
    return c.json({ success: false, error: sendData.msg }, 500);
  } catch (err) {
    console.error(`❌ 发送异常: ${err}`);
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

// 回复飞书消息（根据消息ID）
feishuRoutes.post('/reply/:messageId', async (c) => {
  try {
    const messageId = c.req.param('messageId');
    const { content } = await c.req.json();
    
    if (!content) {
      return c.json({ success: false, error: '缺少 content' }, 400);
    }
    
    // 从缓存获取原消息
    const originalMsg = messageCache.get(messageId);
    if (!originalMsg) {
      return c.json({ success: false, error: '消息不存在或已过期' }, 404);
    }
    
    // 发送回复
    const result = await sendToOpenClaw(originalMsg.openId, `回复: ${content}`, `reply_${messageId}`);
    
    return c.json({ success: result, originalMsg });
  } catch (err) {
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

// 获取用户信息
feishuRoutes.get('/user/:openId', async (c) => {
  try {
    const openId = c.req.param('openId');
    const appId = c.env.FEISHU_APP_ID;
    const appSecret = c.env.FEISHU_APP_SECRET;
    
    if (!appId || !appSecret) {
      return c.json({ success: false, error: '飞书配置不完整' }, 500);
    }
    
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    
    const tokenData: any = await tokenRes.json();
    if (!tokenData.tenant_access_token) {
      return c.json({ success: false, error: '获取 token 失败' }, 500);
    }
    
    const userRes = await fetch(
      `https://open.feishu.cn/open-apis/contact/v3/users/${openId}`,
      { headers: { 'Authorization': `Bearer ${tokenData.tenant_access_token}` } }
    );
    
    const userData: any = await userRes.json();
    
    if (userData.code === 0) {
      return c.json({ success: true, user: userData.data?.user });
    }
    
    return c.json({ success: false, error: userData.msg }, 500);
  } catch (err) {
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

// 健康检查
feishuRoutes.get('/health', async (c) => {
  return c.json({ 
    status: 'ok', 
    service: 'feishu-webhook',
    uptime: Date.now()
  });
});

export default feishuRoutes;
