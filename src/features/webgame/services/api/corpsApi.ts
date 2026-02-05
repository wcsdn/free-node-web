/**
 * 军团/聊天 API 服务
 */
import { getApiBase, getAuthHeaders } from '../../utils/api';

// 聊天频道
export type ChatChannel = 'world' | 'corps' | 'private' | 'system';

// 聊天消息
export interface ChatMessage {
  id: number;
  channel: ChatChannel;
  sender: string;
  senderName: string;
  content: string;
  createdAt: string;
  isSelf?: boolean;
}

// 军团信息
export interface CorpsInfo {
  id: string;
  name: string;
  level: number;
  memberCount: number;
  maxMembers: number;
  leader: string;
  notice?: string;
  createTime?: string;
}

// 军团成员
export interface CorpsMember {
  id: string;
  name: string;
  level: number;
  position: 'leader' | 'elder' | 'member';
  joinTime: string;
  contribution?: number;
}

// 消息列表响应
export interface MessageListResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    hasMore: boolean;
    lastId?: number;
  };
  message?: string;
}

// 发送消息请求
export interface SendMessageRequest {
  channel: ChatChannel;
  content: string;
  toUser?: string; // 私聊时指定
}

// 军团 API
export const corpsApi = {
  /**
   * 获取聊天消息
   */
  async getMessages(
    channel: ChatChannel,
    lastId: number = 0,
    limit: number = 20
  ): Promise<MessageListResponse> {
    try {
      const res = await fetch(
        `${getApiBase()}/api/chat/messages?channel=${channel}&lastId=${lastId}&limit=${limit}`,
        { method: 'GET', headers: getAuthHeaders() }
      );
      return res.json();
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      return getMockMessages(channel);
    }
  },

  /**
   * 发送消息
   */
  async sendMessage(request: SendMessageRequest): Promise<{ success: boolean; data?: ChatMessage; message?: string }> {
    try {
      const res = await fetch(`${getApiBase()}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to send message:', err);
      return { success: false, message: '发送失败' };
    }
  },

  /**
   * 获取军团信息
   */
  async getCorpsInfo(): Promise<{ success: boolean; data?: CorpsInfo }> {
    try {
      const res = await fetch(`${getApiBase()}/api/corps/info`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch corps info:', err);
      return { success: false };
    }
  },

  /**
   * 获取军团成员列表
   */
  async getMembers(): Promise<{ success: boolean; data: CorpsMember[] }> {
    try {
      const res = await fetch(`${getApiBase()}/api/corps/members`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch members:', err);
      return { success: true, data: getMockMembers() };
    }
  },

  /**
   * 创建军团
   */
  async createCorps(name: string): Promise<{ success: boolean; data?: { corpsId: string }; message?: string }> {
    try {
      const res = await fetch(`${getApiBase()}/api/corps/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name }),
      });
      return res.json();
    } catch (err) {
      return { success: false, message: '创建失败' };
    }
  },

  /**
   * 加入军团
   */
  async joinCorps(corpsId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${getApiBase()}/api/corps/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ corpsId }),
      });
      return res.json();
    } catch (err) {
      return { success: false, message: '加入失败' };
    }
  },

  /**
   * 退出军团
   */
  async leaveCorps(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${getApiBase()}/api/corps/leave`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      return { success: false, message: '退出失败' };
    }
  },
};

// 聊天频道配置
export const CHAT_CHANNELS = [
  { id: 'world', name: '世界', icon: '🌍', color: '#4CAF50' },
  { id: 'corps', name: '军团', icon: '🏯', color: '#FF9800' },
  { id: 'private', name: '私聊', icon: '💬', color: '#2196F3' },
  { id: 'system', name: '系统', icon: '📢', color: '#9C27B0' },
];

// 模拟聊天消息
function getMockMessages(channel: ChatChannel): MessageListResponse {
  const messages: ChatMessage[] = [];
  const senders = ['玩家A', '玩家B', '玩家C', '玩家D'];
  const contents = [
    '大家好！',
    '有人一起组队吗？',
    '出售大量资源，价格优惠',
    '求购粮食，高价收',
    '组队副本，来的MM',
    '帮派招人，福利多多',
  ];
  
  for (let i = 0; i < 10; i++) {
    messages.push({
      id: i + 1,
      channel,
      sender: `sender_${i}`,
      senderName: senders[i % senders.length],
      content: contents[i % contents.length],
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
    });
  }
  
  return { success: true, data: { messages, hasMore: true, lastId: 10 } };
}

// 模拟军团成员
function getMockMembers(): CorpsMember[] {
  return [
    { id: '1', name: '帮主·小明', level: 50, position: 'leader', joinTime: '2025-01-01', contribution: 10000 },
    { id: '2', name: '副帮主·小红', level: 48, position: 'elder', joinTime: '2025-01-15', contribution: 8000 },
    { id: '3', name: '成员·小刚', level: 45, position: 'member', joinTime: '2025-02-01', contribution: 5000 },
    { id: '4', name: '成员·小芳', level: 42, position: 'member', joinTime: '2025-02-15', contribution: 3000 },
    { id: '5', name: '成员·小龙', level: 40, position: 'member', joinTime: '2025-03-01', contribution: 2000 },
  ];
}

export default corpsApi;
