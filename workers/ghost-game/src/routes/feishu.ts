/**
 * 飞书 Webhook 路由
 */

import { Hono } from 'hono';
import type { Env } from '../types';

const feishuRoutes = new Hono<{ Bindings: Env }>();

// 解析飞书消息内容（Web 环境兼容）
function parseFeishuContent(content: string): any {
  try {
    // 使用 atob 解码 base64
    const decoded = atob(content);
    return JSON.parse(decoded);
  } catch {
    return { text: content };
  }
}

// 使用 Web Crypto API 验证签名
async function verifyFeishuSignature(body: string, timestamp: string, signature: string, appSecret: string): Promise<boolean> {
  if (!appSecret || !signature) return false;
  
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
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === expectedSignature;
}

// 发送消息到 OpenClaw 会话
async function sendToOpenClaw(senderId: string, content: string, messageId: string) {
  try {
    const GATEWAY_URL = 'http://127.0.0.1:18789';
    const GATEWAY_TOKEN = '62612b78da176ac6c9ee21d3c6937547b48fb04a67346857';
    
    const response = await fetch(`${GATEWAY_URL}/api/v1/sessions/main/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        content: `[飞书] 用户 ${senderId}: ${content}`,
      }),
    });
    
    if (response.ok) {
      console.log('消息已转发到 OpenClaw');
      return true;
    }
  } catch (err) {
    console.error('转发消息失败:', err);
  }
  return false;
}

// Webhook 事件接收
feishuRoutes.post('/webhook', async (c) => {
  try {
    const body = await c.req.text();
    const timestamp = c.req.header('X-Lark-Request-Timestamp') || '';
    const signature = c.req.header('X-Lark-Signature') || '';
    
    // 获取 App Secret
    const appSecret = c.env.FEISHU_APP_SECRET || '';
    
    // 验证签名（可选，生产环境建议开启）
    // if (!await verifyFeishuSignature(body, timestamp, signature, appSecret)) {
    //   console.log('签名验证失败');
    //   return c.json({ success: false, error: 'Invalid signature' }, 401);
    // }
    
    const event = JSON.parse(body);
    
    // 处理 URL 验证
    if (event.type === 'url_verification') {
      console.log('飞书 URL 验证请求');
      return c.json({
        challenge: event.challenge
      });
    }
    
    // 处理心跳事件
    if (event.type === 'ping') {
      console.log('收到飞书心跳');
      return c.json({ success: true });
    }
    
    // 处理消息事件
    if (event.event && event.event.message) {
      const message = event.event.message;
      const senderId = event.event.sender?.open_id || event.event.sender?.user_id || 'unknown';
      const messageId = message.message_id;
      const messageType = message.message_type;
      
      // 解析消息内容
      let messageContent = '';
      if (messageType === 'text') {
        const parsedContent = parseFeishuContent(message.content || '');
        messageContent = parsedContent.text || parsedContent.content || message.content || '';
      } else {
        messageContent = `[${messageType}] ${message.content || ''}`;
      }
      
      console.log('=== 收到飞书消息 ===');
      console.log('消息ID:', messageId);
      console.log('发送者ID:', senderId);
      console.log('消息类型:', messageType);
      console.log('消息内容:', messageContent);
      console.log('时间:', new Date().toISOString());
      
      // 转发消息到 OpenClaw
      await sendToOpenClaw(senderId, messageContent, messageId);
      
      return c.json({ success: true, messageId });
    }
    
    return c.json({ success: true });
  } catch (err) {
    console.error('飞书 webhook 处理错误:', err);
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

// 发送消息给飞书用户
feishuRoutes.post('/send', async (c) => {
  try {
    const { open_id, content } = await c.req.json();
    
    if (!open_id || !content) {
      return c.json({ success: false, error: '缺少 open_id 或 content' }, 400);
    }
    
    const appId = c.env.FEISHU_APP_ID || '';
    const appSecret = c.env.FEISHU_APP_SECRET || '';
    
    if (!appId || !appSecret) {
      return c.json({ success: false, error: '飞书配置不完整' }, 500);
    }
    
    // 获取 tenant_access_token
    const tokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    
    const tokenData: any = await tokenResponse.json();
    if (!tokenData.tenant_access_token) {
      return c.json({ success: false, error: '获取 token 失败' }, 500);
    }
    
    const accessToken = tokenData.tenant_access_token;
    
    // 发送消息
    const sendResponse = await fetch('https://open.feishu.cn/open-apis/im/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        receive_id_type: 'open_id',
        receive_id: open_id,
        msg_type: 'text',
        content: JSON.stringify({ text: content }),
      }),
    });
    
    const sendData: any = await sendResponse.json();
    
    if (sendData.code === 0) {
      return c.json({ success: true, messageId: sendData.data.message_id });
    } else {
      return c.json({ success: false, error: sendData.msg }, 500);
    }
  } catch (err) {
    console.error('发送飞书消息失败:', err);
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

export default feishuRoutes;
