/**
 * MailPanel - 邮件面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';

interface Mail {
  id: number;
  sender: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
  hasAttachment: boolean;
}

interface MailPanelProps {
  walletAddress: string;
}

// 模拟数据
const MOCK_MAILS: Mail[] = [
  { id: 1, sender: '系统', title: '欢迎加入', content: '欢迎来到剑侠情缘！', time: '2026-02-08', read: false, hasAttachment: true },
  { id: 2, sender: '系统', title: '每日奖励', content: '您的每日登录奖励已发放。', time: '2026-02-07', read: true, hasAttachment: false },
];

export const MailPanel: React.FC<MailPanelProps> = () => {
  const [mails, setMails] = useState<Mail[]>(MOCK_MAILS);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const markAsRead = (id: number) => {
    setMails(mails.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const openMail = (mail: Mail) => {
    setSelectedMail(mail);
    setShowDetail(true);
    markAsRead(mail.id);
  };

  const deleteMail = (id: number) => {
    setMails(mails.filter(m => m.id !== id));
    setShowDetail(false);
    setSelectedMail(null);
  };

  const receiveAttachment = (_id: number) => {
    alert('领取附件成功！');
  };

  const stats = {
    total: mails.length,
    unread: mails.filter(m => !m.read).length,
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-emerald-400 
                     tracking-wider uppercase">
        MAIL
      </h1>

      {/* 邮件统计 */}
      <GameCard title="邮件箱" className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">{stats.total}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">总数</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-amber-400">{stats.unread}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">未读</div>
          </div>
        </div>
      </GameCard>

      {/* 邮件列表 */}
      {mails.length > 0 ? (
        <div className="space-y-2">
          {mails.map((mail) => (
            <div
              key={mail.id}
              onClick={() => openMail(mail)}
              className={`
                flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all duration-200
                ${mail.read 
                  ? 'bg-slate-800/30 border border-slate-700/50' 
                  : 'bg-slate-800/60 border border-slate-700 hover:border-emerald-500/50'
                }
                ${mail.hasAttachment ? 'border-l-2 border-l-emerald-500' : ''}
              `}
            >
              {/* 图标 */}
              <div className="text-2xl flex-shrink-0">
                {mail.hasAttachment ? '📎' : '📧'}
              </div>

              {/* 邮件信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-medium truncate ${mail.read ? 'text-slate-400' : 'text-emerald-400'}`}>
                    {mail.title}
                  </span>
                  <span className="text-xs text-slate-500 flex-shrink-0">{mail.time}</span>
                </div>
                <div className="text-sm text-slate-500 truncate mt-0.5">
                  {mail.sender}
                </div>
              </div>

              {/* 未读标记 */}
              {!mail.read && (
                <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* 空状态 */
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-slate-500">暂无邮件</p>
        </div>
      )}

      {/* 邮件详情弹窗 */}
      <GameModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="邮件详情"
        size="small"
      >
        {selectedMail && (
          <div className="space-y-4">
            {/* 头部 */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
              <span className="text-3xl">{selectedMail.hasAttachment ? '📎' : '📧'}</span>
              <div>
                <h3 className="text-emerald-400 font-semibold">{selectedMail.title}</h3>
                <p className="text-slate-500 text-sm">
                  来自: {selectedMail.sender} · {selectedMail.time}
                </p>
              </div>
            </div>

            {/* 内容 */}
            <div className="p-3 bg-slate-800/50 rounded-lg text-slate-300 text-sm">
              {selectedMail.content}
            </div>

            {/* 附件 */}
            {selectedMail.hasAttachment && (
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <span className="text-slate-400">📎 附件</span>
                <GameButton size="small" onClick={() => receiveAttachment(selectedMail.id)}>
                  领取
                </GameButton>
              </div>
            )}

            {/* 操作 */}
            <GameButton 
              variant="danger" 
              fullWidth 
              onClick={() => deleteMail(selectedMail.id)}
            >
              删除邮件
            </GameButton>
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default MailPanel;
