/**
 * 邮件 API 服务
 * 基于原项目 Mail.js 逻辑
 */
import { getApiBase, getAuthHeaders } from '../../utils/api';

// 邮件类型
export type MailType = 0 | 1 | 2 | 3 | 4; // 0=新邮件,1=系统,2=战报,3=消息,4=交易

// 邮件数据结构
export interface Mail {
  id: number;
  MailID?: number;
  MailType: MailType;
  MailFrom: string;     // 发件人
  Title: string;        // 标题
  Content: string;      // 内容
  ContentText?: string; // 纯文本内容
  ReadTag: number;      // 0=未读, 1=已读
  DateTime: string;     // 发送时间
  HasAttachment?: number; // 0=无, 1=有附件
  Attachments?: MailAttachment[];
}

// 邮件附件
export interface MailAttachment {
  id: number;
  type: number;        // 1=物品, 2=资源
  itemId?: number;
  itemName?: string;
  quantity?: number;
  money?: number;
  food?: number;
  gold?: number;
}

// 邮件列表响应
export interface MailListResponse {
  success: boolean;
  data: Mail[];
  unreadCount?: number;
  totalCount?: number;
  message?: string;
}

// 邮件详情响应
export interface MailDetailResponse {
  success: boolean;
  data: Mail;
  message?: string;
}

// 发送邮件请求
export interface SendMailRequest {
  toUser: string;       // 收件人
  title: string;        // 标题
  content: string;      // 内容
  money?: number;       // 附件银两
  food?: number;        // 附件粮食
  gold?: number;        // 附件元宝
  itemId?: number;      // 附件物品ID
  itemCount?: number;   // 附件物品数量
}

// 操作响应
export interface MailActionResponse {
  success: boolean;
  message?: string;
}

// 邮件 API
export const mailApi = {
  /**
   * 获取邮件列表
   */
  async getList(type?: MailType): Promise<MailListResponse> {
    try {
      let url = `${getApiBase()}/api/mail/list`;
      if (type !== undefined) url += `?type=${type}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch mail list:', err);
      return getMockMailList(type);
    }
  },

  /**
   * 获取邮件详情
   */
  async getDetail(mailId: number): Promise<MailDetailResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/mail/${mailId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to fetch mail detail:', err);
      return { success: false, data: {} as Mail, message: '获取邮件失败' };
    }
  },

  /**
   * 发送邮件
   */
  async send(request: SendMailRequest): Promise<MailActionResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/mail/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to send mail:', err);
      return { success: false, message: '发送失败' };
    }
  },

  /**
   * 删除邮件
   */
  async delete(mailId: number): Promise<MailActionResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/mail/${mailId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to delete mail:', err);
      return { success: false, message: '删除失败' };
    }
  },

  /**
   * 批量删除邮件
   */
  async batchDelete(mailIds: number[]): Promise<MailActionResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/mail/batch-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ids: mailIds }),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to batch delete mails:', err);
      return { success: false, message: '批量删除失败' };
    }
  },

  /**
   * 提取附件
   */
  async receiveAttachment(mailId: number): Promise<MailActionResponse> {
    try {
      const res = await fetch(`${getApiBase()}/api/mail/${mailId}/attachment`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to receive attachment:', err);
      return { success: false, message: '提取附件失败' };
    }
  },

  /**
   * 获取未读邮件数
   */
  async getUnreadCount(): Promise<{ success: boolean; count: number }> {
    try {
      const res = await fetch(`${getApiBase()}/api/mail/unread-count`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.json();
    } catch (err) {
      console.error('Failed to get unread count:', err);
      return { success: true, count: 0 };
    }
  },
};

// 邮件类型名称
export const MAIL_TYPE_NAMES: Record<MailType, string> = {
  0: '新邮件',
  1: '系统',
  2: '战报',
  3: '消息',
  4: '交易',
};

// 模拟邮件数据
function getMockMailList(type?: MailType): MailListResponse {
  const mockMails: Mail[] = [
    {
      id: 1,
      MailType: 1,
      MailFrom: '系统',
      Title: '欢迎来到剑侠情缘',
      Content: '欢迎各位大侠来到剑侠情缘！在这里你可以体验到最纯正的武侠风情，快来开始你的江湖之旅吧！',
      ReadTag: 0,
      DateTime: new Date().toISOString(),
      HasAttachment: 0,
    },
    {
      id: 2,
      MailType: 2,
      MailFrom: '系统',
      Title: '战斗胜利战报',
      Content: '恭喜！你成功击败了山贼，获得了以下奖励：\n银两 +1000\n粮食 +500',
      ReadTag: 1,
      DateTime: new Date(Date.now() - 3600000).toISOString(),
      HasAttachment: 1,
      Attachments: [
        { id: 1, type: 2, money: 1000 },
        { id: 2, type: 2, food: 500 },
      ],
    },
    {
      id: 3,
      MailType: 3,
      MailFrom: '玩家A',
      Title: '求购粮食',
      Content: '急需1000粮食，愿意出高价收购，有意者请联系。',
      ReadTag: 0,
      DateTime: new Date(Date.now() - 7200000).toISOString(),
      HasAttachment: 0,
    },
    {
      id: 4,
      MailType: 4,
      MailFrom: '玩家B',
      Title: '交易确认',
      Content: '你购买的装备已发货，请查收。',
      ReadTag: 1,
      DateTime: new Date(Date.now() - 86400000).toISOString(),
      HasAttachment: 1,
      Attachments: [
        { id: 3, type: 1, itemId: 1001, itemName: '精钢剑', quantity: 1 },
      ],
    },
  ];

  const filtered = type !== undefined
    ? mockMails.filter(m => m.MailType === type)
    : mockMails;

  return {
    success: true,
    data: filtered,
    unreadCount: filtered.filter(m => m.ReadTag === 0).length,
    totalCount: filtered.length,
  };
}

export default mailApi;
