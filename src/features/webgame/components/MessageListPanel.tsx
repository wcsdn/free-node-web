/**
 * 消息面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect, memo } from 'react';
import { getApiBase, getAuthHeaders } from '../utils/api';
import { GameButton } from '@/shared/components/game';

const MAIL_TYPES = {
  0: { name: '新邮件', color: '#f44336' },
  1: { name: '系统', color: '#9D080D' },
  2: { name: '战报', color: '#35c235' },
  3: { name: '消息', color: '#666' },
  4: { name: '交易', color: '#f99608' },
};

interface Mail {
  id: number;
  mail_type: number;
  from_name: string;
  title: string;
  content: string;
  read_tag: number;
  has_attachment: number;
  attachment_data?: string;
  created_at: string;
}

interface MailListResponse {
  success: boolean;
  data: {
    mails: Mail[];
    unread_count: number;
    total: number;
  };
  error?: string;
}

interface MessagePanelProps {
  onClose: () => void;
}

const MessagePanel: React.FC<MessagePanelProps> = memo(({ onClose }) => {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<number | undefined>(undefined);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMails = async (type?: number) => {
    setLoading(true);
    setMessage(null);
    setSelectedMail(null);
    
    try {
      const url = type !== undefined 
        ? `${getApiBase()}/api/mail/list?type=${type}`
        : `${getApiBase()}/api/mail/list`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data: MailListResponse = await res.json();
      
      if (data.success) {
        setMails(data.data.mails || []);
        setUnreadCount(data.data.unread_count || 0);
      } else {
        setMessage(data.error || '加载邮件失败');
      }
    } catch (err) {
      console.error('Failed to load mails:', err);
      setMessage('加载邮件失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMails(activeType);
  }, [activeType]);

  const handleDelete = async (mailId: number) => {
    setMessage(null);
    try {
      const res = await fetch(`${getApiBase()}/api/mail/${mailId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage('删除成功');
        setSelectedMail(null);
        fetchMails(activeType);
      } else {
        setMessage(data.error || '删除失败');
      }
    } catch (err) {
      setMessage('删除失败');
    }
  };

  const handleClaimAttachment = async (mailId: number) => {
    setMessage(null);
    try {
      const res = await fetch(`${getApiBase()}/api/mail/${mailId}/claim`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      
      if (data.success) {
        const result = data.data || {};
        let msg = '领取成功！';
        if (result.gold) msg += ` ${result.gold}金币`;
        setMessage(msg);
        fetchMails(activeType);
      } else {
        setMessage(data.error || '领取失败');
      }
    } catch (err) {
      setMessage('领取失败');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `今天 ${date.toLocaleTimeString()}`;
    } else if (days === 1) {
      return `昨天 ${date.toLocaleTimeString()}`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const mailTypes = [
    { id: undefined, name: '全部' },
    { id: 0, name: '新邮件' },
    { id: 1, name: '系统' },
    { id: 2, name: '战报' },
    { id: 3, name: '消息' },
    { id: 4, name: '交易' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden max-h-[90vh]">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            📨 消息中心
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className="mx-4 mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm border border-emerald-500/30">
            {message}
          </div>
        )}

        {/* 邮件类型筛选 */}
        <div className="flex gap-2 p-4 border-b border-slate-700 overflow-x-auto">
          {mailTypes.map((type) => (
            <button
              key={type.id ?? 99}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeType === type.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
              }`}
              onClick={() => setActiveType(type.id)}
            >
              {type.name}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex max-h-[60vh]">
          {/* 邮件列表 */}
          <div className="w-1/3 border-r border-slate-700 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                加载中...
              </div>
            ) : mails.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                暂无邮件
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {mails.map((mail) => {
                  const typeInfo = MAIL_TYPES[mail.mail_type as keyof typeof MAIL_TYPES] || { name: '未知', color: '#666' };
                  return (
                    <button
                      key={mail.id}
                      className={`w-full p-4 text-left transition-all ${
                        selectedMail?.id === mail.id
                          ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                          : mail.read_tag === 0
                            ? 'bg-slate-800/30'
                            : 'hover:bg-slate-800/50'
                      }`}
                      onClick={() => setSelectedMail(mail)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="text-xs"
                          style={{ color: typeInfo.color }}
                        >
                          [{typeInfo.name}]
                        </span>
                        {mail.read_tag === 0 && (
                          <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                        )}
                      </div>
                      <div className={`text-sm truncate ${mail.read_tag === 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                        {mail.title}
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                        <span className="truncate max-w-20">{mail.from_name}</span>
                        <span>{formatDate(mail.created_at)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 邮件详情 */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedMail ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="text-sm"
                      style={{ color: MAIL_TYPES[selectedMail.mail_type as keyof typeof MAIL_TYPES]?.color || '#666' }}
                    >
                      [{MAIL_TYPES[selectedMail.mail_type as keyof typeof MAIL_TYPES]?.name || '未知'}]
                    </span>
                    <h3 className="text-lg font-bold text-slate-200">{selectedMail.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>来自: {selectedMail.from_name}</span>
                    <span>{formatDate(selectedMail.created_at)}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-slate-300 whitespace-pre-wrap">{selectedMail.content}</p>
                </div>

                {selectedMail.has_attachment === 1 && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
                    <span className="text-amber-400">📎 附件</span>
                    <GameButton size="sm" onClick={() => handleClaimAttachment(selectedMail.id)}>
                      领取附件
                    </GameButton>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-slate-700">
                  <GameButton variant="red" size="sm" onClick={() => handleDelete(selectedMail.id)}>
                    删除
                  </GameButton>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                选择一封邮件查看详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MessagePanel.displayName = 'MessagePanel';

export default MessagePanel;
