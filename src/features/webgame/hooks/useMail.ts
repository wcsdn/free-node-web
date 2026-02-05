/**
 * 邮件 Hook
 * React Hook for mail functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { mailApi, Mail, MailType, MAIL_TYPE_NAMES, SendMailRequest } from '../services/api/mailApi';

// 邮件 Hook
export function useMail() {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<MailType | undefined>(undefined);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [operating, setOperating] = useState<number | null>(null);

  // 加载邮件列表
  const loadMails = useCallback(async (type?: MailType) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await mailApi.getList(type);
      if (res.success) {
        setMails(res.data);
        setUnreadCount(res.unreadCount || 0);
        setTotalCount(res.totalCount || 0);
      } else {
        setError(res.message || '加载邮件失败');
      }
    } catch (err) {
      console.error('Failed to load mails:', err);
      setError('加载邮件失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 切换类型
  const changeType = useCallback((type?: MailType) => {
    setCurrentType(type);
    setSelectedMail(null);
    loadMails(type);
  }, [loadMails]);

  // 选择邮件
  const selectMail = useCallback(async (mail: Mail) => {
    setSelectedMail(mail);
    // 标记为已读
    if (mail.ReadTag === 0) {
      // 这里可以调用标记已读API
    }
  }, []);

  // 删除邮件
  const deleteMail = useCallback(async (mailId: number) => {
    setOperating(mailId);
    
    try {
      const res = await mailApi.delete(mailId);
      if (res.success) {
        setMails(prev => prev.filter(m => m.id !== mailId));
        setSelectedMail(null);
        return { success: true };
      } else {
        return { success: false, message: res.message || '删除失败' };
      }
    } catch (err) {
      console.error('Failed to delete mail:', err);
      return { success: false, message: '删除失败' };
    } finally {
      setOperating(null);
    }
  }, []);

  // 提取附件
  const receiveAttachment = useCallback(async (mailId: number) => {
    setOperating(mailId);
    
    try {
      const res = await mailApi.receiveAttachment(mailId);
      if (res.success) {
        // 更新邮件状态
        setMails(prev => prev.map(m => 
          m.id === mailId ? { ...m, HasAttachment: 0, Attachments: [] } : m
        ));
        return { success: true, message: '附件提取成功' };
      } else {
        return { success: false, message: res.message || '提取附件失败' };
      }
    } catch (err) {
      console.error('Failed to receive attachment:', err);
      return { success: false, message: '提取附件失败' };
    } finally {
      setOperating(null);
    }
  }, []);

  // 发送邮件
  const sendMail = useCallback(async (request: SendMailRequest) => {
    setOperating(0);
    
    try {
      const res = await mailApi.send(request);
      if (res.success) {
        return { success: true, message: '邮件已发送' };
      } else {
        return { success: false, message: res.message || '发送失败' };
      }
    } catch (err) {
      console.error('Failed to send mail:', err);
      return { success: false, message: '发送失败' };
    } finally {
      setOperating(null);
    }
  }, []);

  // 加载未读数
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await mailApi.getUnreadCount();
      if (res.success) {
        setUnreadCount(res.count);
      }
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadMails();
    loadUnreadCount();
  }, []);

  return {
    mails,
    loading,
    error,
    currentType,
    selectedMail,
    unreadCount,
    totalCount,
    operating,
    loadMails,
    changeType,
    selectMail,
    deleteMail,
    receiveAttachment,
    sendMail,
    loadUnreadCount,
    refresh: () => loadMails(currentType),
  };
}

// 邮件类型配置
export const MAIL_TYPES: { id: MailType | undefined; name: string }[] = [
  { id: undefined, name: '全部' },
  { id: 0, name: '新邮件' },
  { id: 1, name: '系统' },
  { id: 2, name: '战报' },
  { id: 3, name: '消息' },
  { id: 4, name: '交易' },
];
