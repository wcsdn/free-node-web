/**
 * Ghost Live - 实时在线系统
 * 基于 Durable Objects + WebSocket
 * 
 * 功能：
 * - 在线人数统计
 * - 全站广播
 */

interface Env {
  PRESENCE_ROOM: DurableObjectNamespace;
}

// ============================================
// CORS 配置
// ============================================

const ALLOWED_ORIGINS = [
  'https://free-node.xyz',
  'https://www.free-node.xyz',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)\d+\.\d+:\d+$/.test(origin)) {
    return true;
  }
  return false;
}

function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigin = isAllowedOrigin(origin) ? origin || '*' : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
    'Access-Control-Max-Age': '86400',
  };
}

// ============================================
// Durable Object: PresenceRoom
// ============================================

interface Session {
  webSocket: WebSocket;
  id: string;
  nickname: string;
  joinedAt: number;
}

interface ChatMessage {
  type: 'chat';
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
}

export class PresenceRoom {
  private sessions: Map<string, Session> = new Map();
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // WebSocket 升级
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // HTTP API
    switch (url.pathname) {
      case '/count':
        return new Response(JSON.stringify({ 
          count: this.sessions.size,
          timestamp: Date.now()
        }), {
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) }
        });

      case '/broadcast':
        if (request.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }
        return this.handleBroadcast(request, origin);

      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private handleWebSocket(request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const url = new URL(request.url);
    const nickname = url.searchParams.get('nickname') || `特工${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;

    const sessionId = crypto.randomUUID();
    const session: Session = {
      webSocket: server,
      id: sessionId,
      nickname,
      joinedAt: Date.now(),
    };

    this.state.acceptWebSocket(server);
    this.sessions.set(sessionId, session);

    // 发送欢迎消息 + 当前人数
    server.send(JSON.stringify({
      type: 'welcome',
      sessionId,
      nickname,
      count: this.sessions.size,
      timestamp: Date.now(),
    }));

    // 广播人数更新 + 加入通知
    this.broadcastCount();
    this.broadcastSystem(`${nickname} 进入了聊天室`);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(message as string);
      
      // 心跳响应
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        return;
      }

      // 聊天消息
      if (data.type === 'chat' && data.content) {
        const session = this.findSession(ws);
        if (!session) return;

        // 限制消息长度
        const content = String(data.content).slice(0, 500);
        
        // 广播聊天消息
        const chatMsg: ChatMessage = {
          type: 'chat',
          id: crypto.randomUUID(),
          nickname: session.nickname,
          content,
          timestamp: Date.now(),
        };
        this.broadcast(JSON.stringify(chatMsg));
      }
    } catch {
      // 忽略无效消息
    }
  }

  async webSocketClose(ws: WebSocket) {
    // 找到并移除断开的会话
    let leftNickname = '';
    for (const [id, session] of this.sessions) {
      if (session.webSocket === ws) {
        leftNickname = session.nickname;
        this.sessions.delete(id);
        break;
      }
    }
    // 广播人数更新 + 离开通知
    this.broadcastCount();
    if (leftNickname) {
      this.broadcastSystem(`${leftNickname} 离开了聊天室`);
    }
  }

  private findSession(ws: WebSocket): Session | null {
    for (const session of this.sessions.values()) {
      if (session.webSocket === ws) return session;
    }
    return null;
  }

  async webSocketError(ws: WebSocket) {
    await this.webSocketClose(ws);
  }

  private broadcast(message: string) {
    for (const session of this.sessions.values()) {
      try {
        session.webSocket.send(message);
      } catch {
        // 连接可能已关闭
      }
    }
  }

  private broadcastCount() {
    this.broadcast(JSON.stringify({
      type: 'count',
      count: this.sessions.size,
      timestamp: Date.now(),
    }));
  }

  private broadcastSystem(text: string) {
    this.broadcast(JSON.stringify({
      type: 'system',
      message: text,
      timestamp: Date.now(),
    }));
  }

  private async handleBroadcast(request: Request, origin: string | null): Promise<Response> {
    try {
      const body = await request.json() as { 
        message: string; 
        type?: string;
        adminKey?: string;
      };

      // TODO: 验证管理员密钥
      // if (body.adminKey !== env.ADMIN_KEY) {
      //   return new Response('Unauthorized', { status: 401 });
      // }

      const broadcast = JSON.stringify({
        type: body.type || 'announcement',
        message: body.message,
        timestamp: Date.now(),
      });

      let sent = 0;
      for (const session of this.sessions.values()) {
        try {
          session.webSocket.send(broadcast);
          sent++;
        } catch {
          // 忽略发送失败
        }
      }

      return new Response(JSON.stringify({ success: true, sent }), {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) }
      });
    } catch {
      return new Response('Invalid request', { status: 400 });
    }
  }
}

// ============================================
// Worker 入口
// ============================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
    }

    // 来源验证
    if (!isAllowedOrigin(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    // 所有请求转发到同一个 Durable Object 实例 (全站共享)
    const roomId = env.PRESENCE_ROOM.idFromName('global');
    const room = env.PRESENCE_ROOM.get(roomId);

    // 转发请求
    return room.fetch(request);
  },
};
