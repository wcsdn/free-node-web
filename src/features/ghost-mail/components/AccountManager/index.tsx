/**
 * Outlook 账号管理组件
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import { useToast } from '@/shared/components/Toast/ToastContext';
import { API_ENDPOINTS } from '@/config/constants';
import Backdrop from '@/shared/components/Backdrop';
import './styles.css';

interface OutlookAccount {
  email: string;
  status: 'active' | 'suspended' | 'locked' | 'error';
  bindings: string | null;
  last_checked: number | null;
  fail_count?: number | null;
  notes: string | null;
  created_at: number;
  has_refresh_token?: boolean; // 是否有refresh_token，不返回具体值
}

type FilterStatus = 'all' | 'active' | 'suspended' | 'locked' | 'error';

const AccountManager: React.FC = () => {
  const { address } = useAccount();
  const { language } = useLanguage();
  const { playClick, playSuccess, playError, playHover } = useSoundEffect();
  const { showSuccess, showError } = useToast();
  const isZh = language === 'zh';

  const [accounts, setAccounts] = useState<OutlookAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  
  // 同步弹窗
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncText, setSyncText] = useState('');
  const [syncing, setSyncing] = useState(false);
  
  // 编辑弹窗
  const [editAccount, setEditAccount] = useState<OutlookAccount | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'active' as OutlookAccount['status'],
    bindings: '',
    notes: '',
  });

  // 加载账号列表 - 后端会验证权限
  const loadAccounts = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.GHOST_MAIL}/admin/accounts?address=${address}&filter=${filter}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.data.accounts || []);
        setTotal(data.data.total || 0);
      } else {
        showError(data.error || 'Failed to load accounts');
        setAccounts([]);
        setTotal(0);
      }
    } catch (error) {
      showError(isZh ? '网络错误' : 'Network error');
      setAccounts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [address, filter, isZh, showError]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // 切换密码显示 - 已移除，不再显示敏感信息

  // 同步账号 - 后端会验证权限
  const handleSync = async () => {
    if (!syncText.trim()) return;
    
    playClick();
    setSyncing(true);
    
    try {
      const res = await fetch(`${API_ENDPOINTS.GHOST_MAIL}/admin/sync-accounts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accounts: syncText,
          address: address
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        playSuccess();
        showSuccess(isZh 
          ? `成功导入 ${data.data.imported} 个账号` 
          : `Imported ${data.data.imported} accounts`
        );
        setShowSyncModal(false);
        setSyncText('');
        loadAccounts();
      } else {
        playError();
        showError(data.error || 'Sync failed');
      }
    } catch (err) {
      playError();
      showError(isZh ? '网络错误' : 'Network error');
    } finally {
      setSyncing(false);
    }
  };

  // 打开编辑弹窗
  const openEdit = (account: OutlookAccount) => {
    playClick();
    setEditAccount(account);
    setEditForm({
      status: account.status,
      bindings: account.bindings || '',
      notes: account.notes || '',
    });
  };

  // 保存编辑 (需要后端支持)
  const handleSaveEdit = async () => {
    if (!editAccount) return;
    playClick();
    // TODO: 调用后端 API 更新账号
    showSuccess(isZh ? '功能开发中' : 'Feature in development');
    setEditAccount(null);
  };

  // 状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00ff41';
      case 'suspended': return '#ffaa00';
      case 'locked': return '#ff0040';
      default: return '#888';
    }
  };

  // 状态文本
  const getStatusText = (status: string) => {
    if (isZh) {
      switch (status) {
        case 'active': return '正常';
        case 'suspended': return '暂停';
        case 'locked': return '锁定';
        default: return status;
      }
    }
    return status.toUpperCase();
  };

  return (
    <div className="account-manager">
      {/* 工具栏 */}
      <div className="account-toolbar">
        <div className="toolbar-left">
          <span className="account-count">
            {isZh ? `共 ${total} 个账号` : `${total} accounts`}
          </span>
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => {
              playClick();
              setFilter(e.target.value as FilterStatus);
            }}
          >
            <option value="all">{isZh ? '全部' : 'All'}</option>
            <option value="active">{isZh ? '正常' : 'Active'}</option>
            <option value="suspended">{isZh ? '暂停' : 'Suspended'}</option>
            <option value="locked">{isZh ? '锁定' : 'Locked'}</option>
            <option value="error">{isZh ? '异常' : 'Error'}</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button
            className="toolbar-btn refresh-btn"
            onClick={() => { playClick(); loadAccounts(); }}
            disabled={loading}
            onMouseEnter={playHover}
          >
            ↻ {isZh ? '刷新' : 'Refresh'}
          </button>
          <button
            className="toolbar-btn sync-btn"
            onClick={() => { playClick(); setShowSyncModal(true); }}
            onMouseEnter={playHover}
          >
            📥 {isZh ? '导入' : 'Sync'}
          </button>
        </div>
      </div>

      {/* 账号表格 */}
      <div className="account-table-wrapper">
        <table className="account-table">
          <thead>
            <tr>
              <th>{isZh ? '邮箱' : 'Email'}</th>
              <th>{isZh ? '状态' : 'Status'}</th>
              <th>{isZh ? '失败次数' : 'Failures'}</th>
              <th>{isZh ? 'Token' : 'Token'}</th>
              <th>{isZh ? '绑定' : 'Bindings'}</th>
              <th>{isZh ? '操作' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="loading-cell">
                  {isZh ? '加载中...' : 'Loading...'}
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  {isZh ? '暂无账号' : 'No accounts'}
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.email}>
                  <td className="email-cell">{account.email}</td>
                  <td>
                    <span 
                      className="status-tag"
                      style={{ 
                        color: getStatusColor(account.status),
                        borderColor: getStatusColor(account.status),
                      }}
                    >
                      {getStatusText(account.status)}
                    </span>
                  </td>
                  <td className="fail-count-cell">
                    {account.fail_count || 0}
                  </td>
                  <td className="token-cell">
                    <span className={`token-status ${account.has_refresh_token ? 'has-token' : 'no-token'}`}>
                      {account.has_refresh_token ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="bindings-cell">
                    {account.bindings || '-'}
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => openEdit(account)}
                      onMouseEnter={playHover}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 同步弹窗 */}
      {showSyncModal && (
        <>
          <Backdrop onClick={() => setShowSyncModal(false)} />
          <div className="sync-modal">
            <div className="modal-header">
              <h3>{isZh ? '批量导入账号' : 'Sync Accounts'}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSyncModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-hint">
                {isZh 
                  ? '每行一个账号，格式：email:password 或 email----password----其他' 
                  : 'One account per line: email:password or email----password----other'}
              </p>
              <textarea
                className="sync-textarea"
                value={syncText}
                onChange={(e) => setSyncText(e.target.value)}
                placeholder={isZh 
                  ? 'test@outlook.com:password123\ntest2@outlook.com----password456----recovery' 
                  : 'test@outlook.com:password123\ntest2@outlook.com----password456----recovery'}
                rows={10}
              />
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowSyncModal(false)}
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                className="confirm-btn"
                onClick={handleSync}
                disabled={syncing || !syncText.trim()}
              >
                {syncing 
                  ? (isZh ? '导入中...' : 'Syncing...') 
                  : (isZh ? '确认导入' : 'Confirm')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 编辑弹窗 */}
      {editAccount && (
        <>
          <Backdrop onClick={() => setEditAccount(null)} />
          <div className="edit-modal">
            <div className="modal-header">
              <h3>{isZh ? '编辑账号' : 'Edit Account'}</h3>
              <button 
                className="close-btn"
                onClick={() => setEditAccount(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>{isZh ? '邮箱' : 'Email'}</label>
                <input type="text" value={editAccount.email} disabled />
              </div>
              <div className="form-row">
                <label>{isZh ? '状态' : 'Status'}</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    status: e.target.value as OutlookAccount['status'] 
                  }))}
                >
                  <option value="active">{isZh ? '正常' : 'Active'}</option>
                  <option value="suspended">{isZh ? '暂停' : 'Suspended'}</option>
                  <option value="locked">{isZh ? '锁定' : 'Locked'}</option>
                </select>
              </div>
              <div className="form-row">
                <label>{isZh ? '绑定' : 'Bindings'}</label>
                <input
                  type="text"
                  value={editForm.bindings}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    bindings: e.target.value 
                  }))}
                  placeholder={isZh ? '绑定的服务' : 'Bound services'}
                />
              </div>
              <div className="form-row">
                <label>{isZh ? '备注' : 'Notes'}</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setEditAccount(null)}
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                className="confirm-btn"
                onClick={handleSaveEdit}
              >
                {isZh ? '保存' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountManager;
