/**
 * 邮件面板
 */
import React, { useState, useEffect, useCallback } from 'react';
import type { MailData, MailDetail, ApiResponse } from '../../types';

interface MailPanelProps {
  walletAddress?: string;
}

type MailTab = 'inbox' | 'sent' | 'system' | 'unread';

interface MailListResponse {
  mails: MailData[];
  total: number;
  page: number;
}

export const MailPanel: React.FC<MailPanelProps> = ({ walletAddress }) => {
  const [activeTab, setActiveTab] = useState<MailTab>('inbox');
  const [mails, setMails] = useState<MailData[]>([]);
  const [selectedMail, setSelectedMail] = useState<MailDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showSendModal, setShowSendModal] = useState(false);
  
  // 发送邮件表单状态
  const [sendForm, setSendForm] = useState({
    to_user: '',
    title: '',
    content: '',
  });
  
  // 分页大小
  const pageSize = 20;

  // 获取邮件列表
  const fetchMails = useCallback(async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      let url = `/api/mail/list?page=${page}&pageSize=${pageSize}`;
      
      // 根据标签筛选
      switch (activeTab) {
        case 'unread':
          // 未读邮件需要前端过滤
          url = `/api/mail/list?page=1&pageSize=100`;
          break;
        case 'sent':
          // 发送的邮件暂用全部列表
          break;
        case 'system':
          url = `/api/mail/by-type?mail_type=0&page=${page}&pageSize=${pageSize}`;
          break;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${walletAddress}`,
        },
      });
      
      const result: ApiResponse<MailListResponse> = await response.json();
      
      if (result.success && result.data) {
        let mailList = result.data.mails || [];
        
        // 未读筛选
        if (activeTab === 'unread') {
          mailList = mailList.filter((m: MailData) => !m.read);
        }
        
        setMails(mailList);
        setTotal(result.data.total || 0);
      }
    } catch (err) {
      console.error('获取邮件列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, page, activeTab]);

  useEffect(() => {
    fetchMails();
  }, [fetchMails]);

  // 获取邮件详情
  const fetchMailDetail = async (mailId: number) => {
    try {
      const response = await fetch(`/api/mail/detail?mail_id=${mailId}`, {
        headers: {
          'Authorization': `Bearer ${walletAddress}`,
        },
      });
      
      const result: ApiResponse<MailDetail> = await response.json();
      
      if (result.success && result.data) {
        setSelectedMail(result.data);
        // 更新列表中的已读状态
        setMails(prev => prev.map(m => 
          m.id === mailId ? { ...m, read: true } : m
        ));
      }
    } catch (err) {
      console.error('获取邮件详情失败:', err);
    }
  };

  // 发送邮件
  const handleSendMail = async () => {
    if (!walletAddress || !sendForm.to_user || !sendForm.title || !sendForm.content) {
      alert('请填写完整信息');
      return;
    }

    try {
      const response = await fetch('/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletAddress}`,
        },
        body: JSON.stringify({
          junta: sendForm.to_user,
          title: sendForm.title,
          message: sendForm.content,
        }),
      });

      const result: ApiResponse<{ mailId: number }> = await response.json();
      
      if (result.success) {
        alert('邮件发送成功');
        setShowSendModal(false);
        setSendForm({ to_user: '', title: '', content: '' });
        // 切换到已发送标签并刷新
        setActiveTab('sent');
      } else {
        alert(result.error || '发送失败');
      }
    } catch (err) {
      console.error('发送邮件失败:', err);
      alert('发送失败，请重试');
    }
  };

  // 删除邮件
  const handleDeleteMail = async (mailId: number) => {
    if (!confirm('确定要删除这封邮件吗？')) return;

    try {
      const response = await fetch('/api/mail/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletAddress}`,
        },
        body: JSON.stringify({ mail_ids: [mailId] }),
      });

      const result: ApiResponse<{ deletedCount: number }> = await response.json();
      
      if (result.success) {
        setMails(prev => prev.filter(m => m.id !== mailId));
        if (selectedMail?.id === mailId) {
          setSelectedMail(null);
        }
        alert('邮件已删除');
      } else {
        alert(result.error || '删除失败');
      }
    } catch (err) {
      console.error('删除邮件失败:', err);
      alert('删除失败，请重试');
    }
  };

  // 格式化时间
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  // 获取邮件类型标签
  const getMailTypeLabel = (type: number) => {
    switch (type) {
      case 0: return '系统';
      case 1: return '玩家';
      case 2: return '战报';
      default: return '邮件';
    }
  };

  // 获取邮件类型颜色
  const getMailTypeColor = (type: number) => {
    switch (type) {
      case 0: return '#f59e0b';
      case 1: return '#3b82f6';
      case 2: return '#ef4444';
      default: return '#8b5cf6';
    }
  };

  // 统计未读数
  const unreadCount = mails.filter(m => !m.read).length;

  return (
    <div className="mail-panel">
      {/* 标签页 */}
      <div className="mail-tabs">
        <button 
          className={`mail-tab ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          📬 收件箱
        </button>
        <button 
          className={`mail-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          ✈️ 已发送
        </button>
        <button 
          className={`mail-tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          📢 系统公告
        </button>
        <button 
          className={`mail-tab ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          🔔 未读邮件 {unreadCount > 0 && <span className="mail-badge">{unreadCount}</span>}
        </button>
      </div>

      <div className="mail-container">
        {/* 邮件列表 */}
        <div className="mail-list">
          <div className="mail-list-header">
            <span>邮件列表</span>
            <button 
              className="mail-action-btn compose"
              onClick={() => setShowSendModal(true)}
            >
              ✏️ 写邮件
            </button>
          </div>

          {loading ? (
            <div className="mail-loading">加载中...</div>
          ) : mails.length === 0 ? (
            <div className="mail-empty">
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
              <div>暂无邮件</div>
            </div>
          ) : (
            <div className="mail-items">
              {mails.map(mail => (
                <div 
                  key={mail.id}
                  className={`mail-item ${!mail.read ? 'unread' : ''} ${selectedMail?.id === mail.id ? 'selected' : ''}`}
                  onClick={() => fetchMailDetail(mail.id)}
                >
                  <div className="mail-item-type" style={{ background: getMailTypeColor(mail.type) }}>
                    {getMailTypeLabel(mail.type)}
                  </div>
                  <div className="mail-item-content">
                    <div className="mail-item-header">
                      <span className="mail-item-from">
                        {mail.type === 0 ? '系统' : mail.from_user || '未知玩家'}
                      </span>
                      <span className="mail-item-time">{formatDate(mail.created_at)}</span>
                    </div>
                    <div className="mail-item-title">{mail.title}</div>
                    <div className="mail-item-preview">
                      {mail.content?.substring(0, 50) || '暂无内容'}...
                    </div>
                  </div>
                  {!mail.read && <div className="mail-unread-dot"></div>}
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {total > pageSize && (
            <div className="mail-pagination">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                上一页
              </button>
              <span>{page} / {Math.ceil(total / pageSize)}</span>
              <button 
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </div>

        {/* 邮件详情 */}
        <div className="mail-detail">
          {selectedMail ? (
            <>
              <div className="mail-detail-header">
                <div className="mail-detail-type" style={{ background: getMailTypeColor(selectedMail.type) }}>
                  {getMailTypeLabel(selectedMail.type)}
                </div>
                <h2 className="mail-detail-title">{selectedMail.title}</h2>
                <div className="mail-detail-meta">
                  <span>发件人：{selectedMail.type === 0 ? '系统' : selectedMail.from_user || '未知玩家'}</span>
                  <span>{formatDate(selectedMail.created_at)}</span>
                </div>
              </div>
              
              <div className="mail-detail-content">
                {selectedMail.content}
              </div>

              {/* 附件区域 */}
              {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                <div className="mail-attachments">
                  <div className="mail-attachments-title">📎 附件</div>
                  {selectedMail.attachments.map((att: any, idx: number) => (
                    <div key={idx} className="mail-attachment-item">
                      <span>{att.name || `附件${idx + 1}`}</span>
                      {!selectedMail.claimed && (
                        <button className="mail-claim-btn">领取</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mail-detail-actions">
                {selectedMail.type === 1 && (
                  <button 
                    className="mail-action-btn reply"
                    onClick={() => {
                      setSendForm({
                        to_user: selectedMail.from_user || '',
                        title: `回复: ${selectedMail.title}`,
                        content: '',
                      });
                      setShowSendModal(true);
                    }}
                  >
                    ↩️ 回复
                  </button>
                )}
                <button 
                  className="mail-action-btn delete"
                  onClick={() => handleDeleteMail(selectedMail.id)}
                >
                  🗑️ 删除
                </button>
              </div>
            </>
          ) : (
            <div className="mail-detail-empty">
              <div style={{ fontSize: '64px', marginBottom: '15px' }}>📧</div>
              <div style={{ color: '#666' }}>请选择一封邮件查看详情</div>
            </div>
          )}
        </div>
      </div>

      {/* 发送邮件弹窗 */}
      {showSendModal && (
        <div className="mail-modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="mail-modal" onClick={e => e.stopPropagation()}>
            <div className="mail-modal-header">
              <h3>✏️ 发送邮件</h3>
              <button className="mail-modal-close" onClick={() => setShowSendModal(false)}>×</button>
            </div>
            <div className="mail-modal-body">
              <div className="mail-form-group">
                <label>收件人地址</label>
                <input
                  type="text"
                  value={sendForm.to_user}
                  onChange={e => setSendForm(f => ({ ...f, to_user: e.target.value }))}
                  placeholder="输入玩家钱包地址"
                />
              </div>
              <div className="mail-form-group">
                <label>邮件主题</label>
                <input
                  type="text"
                  value={sendForm.title}
                  onChange={e => setSendForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="输入邮件主题"
                />
              </div>
              <div className="mail-form-group">
                <label>邮件内容</label>
                <textarea
                  value={sendForm.content}
                  onChange={e => setSendForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="输入邮件内容"
                  rows={8}
                />
              </div>
            </div>
            <div className="mail-modal-footer">
              <button className="mail-btn cancel" onClick={() => setShowSendModal(false)}>
                取消
              </button>
              <button className="mail-btn send" onClick={handleSendMail}>
                发送邮件
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailPanel;
