/**
 * 帮派面板组件
 * 从 union.js 迁移
 */
import React, { useState, useEffect, memo } from 'react';
import styles from '../styles/UnionPanel.module.css';
import {  getApiBase, getAuthHeaders } from '../utils/api';
interface UnionInfo {
  id: number;
  name: string;
  level: number;
  leader: string;
  memberCount: number;
  maxMembers: number;
  notice: string;
  fame: number;
  prestige: number;
}

interface MemberInfo {
  id: number;
  name: string;
  job: number; // 0=帮主, 1=副帮主, 2=长老, 3=成员
  level: number;
  contribution: number;
  online: boolean;
  lastActive: string;
}

interface UnionPanelProps {
  walletAddress: string;
  onClose: () => void;
}

const UnionPanel: React.FC<UnionPanelProps> = memo(({ walletAddress, onClose }) => {
  const [currentType, setCurrentType] = useState(0);
  const [loading, setLoading] = useState(true); // 0=我的帮派, 1=帮众, 2=申请者, 3=帮派列表, 4=帮派聊天, 5=物资
  const [myUnion, setMyUnion] = useState<UnionInfo | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [applicants, setApplicants] = useState<MemberInfo[]>([]);
  const [unionList, setUnionList] = useState<UnionInfo[]>([]);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUnionName, setNewUnionName] = useState('');



  // 获取认证头
  // function getAuthHeaders() {
  //   const auth = localStorage.getItem('wallet-auth');
  //   return auth ? { 'X-Wallet-Auth': auth } : {};
  // }

  // 帮派类型
//   const auth = localStorage.getItem('wallet-auth');
//   return auth ? { 'X-Wallet-Auth': auth } : walletAddress ? { 'X-Wallet-Auth': walletAddress } : {};
// };
  
  const jobNames = ['帮主', '副帮主', '长老', '成员'];
  const typeNames = ['我的帮派', '帮众列表', '申请者', '帮派列表', '帮派聊天', '帮派物资'];

  // 加载帮派数据
  const fetchUnionData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/guild/info`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setMyUnion(data.myUnion);
        setMembers(data.members || []);
        setApplicants(data.applicants || []);
        setUnionList(data.unionList || []);
        setMaxPage(data.maxPage || 1);
      }
    } catch (err) {
      console.error('Failed to load union data:', err);
      // 模拟数据
      setMyUnion({
        id: 1, name: '天下无双', level: 5, leader: '帮主A', 
        memberCount: 45, maxMembers: 50, notice: '欢迎加入本帮！', fame: 1000, prestige: 500
      });
      setMembers([
        { id: 1, name: '帮主A', job: 0, level: 88, contribution: 5000, online: true, lastActive: '在线' },
        { id: 2, name: '副帮主B', job: 1, level: 85, contribution: 4500, online: true, lastActive: '在线' },
        { id: 3, name: '长老C', job: 2, level: 80, contribution: 3000, online: false, lastActive: '2小时前' },
        { id: 4, name: '成员D', job: 3, level: 75, contribution: 2000, online: false, lastActive: '5小时前' },
        { id: 5, name: '成员E', job: 3, level: 70, contribution: 1500, online: true, lastActive: '在线' },
      ]);
      setApplicants([
        { id: 101, name: '申请者1', job: 3, level: 60, contribution: 0, online: false, lastActive: '1天前' },
        { id: 102, name: '申请者2', job: 3, level: 55, contribution: 0, online: false, lastActive: '2天前' },
      ]);
      setUnionList([
        { id: 1, name: '天下无双', level: 5, leader: '帮主A', memberCount: 45, maxMembers: 50, notice: '', fame: 1000, prestige: 500 },
        { id: 2, name: '风云再起', level: 4, leader: '帮主X', memberCount: 38, maxMembers: 40, notice: '', fame: 800, prestige: 400 },
        { id: 3, name: '江湖救急', level: 3, leader: '帮主Y', memberCount: 25, maxMembers: 30, notice: '', fame: 500, prestige: 300 },
      ]);
      setMaxPage(3);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnionData();
  }, [walletAddress]);

  // 创建帮派
  const handleCreateUnion = async () => {
    if (!newUnionName.trim()) {
      alert('请输入帮派名称');
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/api/guild/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: newUnionName }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewUnionName('');
        fetchUnionData();
        alert('帮派创建成功！');
      } else {
        alert('创建失败：' + data.message);
      }
    } catch (err) {
      alert('创建失败');
    }
  };

  // 审批申请者
  const handleApprove = async (userId: number, approve: boolean) => {
    try {
      const res = await fetch(`${getApiBase()}/api/guild/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId, approve }),
      });
      const data = await res.json();
      if (data.success) {
        setApplicants(applicants.filter(a => a.id !== userId));
        alert(approve ? '已批准申请' : '已拒绝申请');
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  // 加入帮派
  const handleJoin = async (unionId: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/guild/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ unionId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUnionData();
        alert('申请已提交，请等待审批');
      } else {
        alert('申请失败：' + data.message);
      }
    } catch (err) {
      alert('申请失败');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>帮派</h2>
        {myUnion && <span className={styles.unionName}>{myUnion.name}</span>}
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {/* 导航标签 */}
      <div className={styles.typeNav}>
        {typeNames.map((name, idx) => (
          <button
            key={idx}
            className={`${styles.typeBtn} ${currentType === idx ? styles.active : ''}`}
            onClick={() => setCurrentType(idx)}
            disabled={[1, 2, 4, 5].includes(idx) && !myUnion}
          >
            {name}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {/* 加载状态 */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingText}>正在加载...</div>
          </div>
        )}

        {/* 我的帮派 */}
        {currentType === 0 && (
          <div className={styles.myUnionPanel}>
            {myUnion ? (
              <>
                <div className={styles.unionInfo}>
                  <div className={styles.unionHeader}>
                    <div className={styles.unionIcon}>帮</div>
                    <div className={styles.unionBasic}>
                      <h3>{myUnion.name}</h3>
                      <p>等级 {myUnion.level} · {myUnion.memberCount}/{myUnion.maxMembers}人</p>
                    </div>
                  </div>
                  <div className={styles.unionStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>名望</span>
                      <span className={styles.statValue}>{myUnion.fame}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>声望</span>
                      <span className={styles.statValue}>{myUnion.prestige}</span>
                    </div>
                  </div>
                  <div className={styles.unionNotice}>
                    <h4>帮派公告</h4>
                    <p>{myUnion.notice || '暂无公告'}</p>
                  </div>
                </div>
                <div className={styles.unionActions}>
                  <button onClick={() => {}}>邀请成员</button>
                  <button onClick={() => {}}>发放福利</button>
                  <button onClick={() => {}}>帮派设置</button>
                </div>
              </>
            ) : (
              <div className={styles.noUnion}>
                <p>您还没有加入帮派</p>
                <button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>创建帮派</button>
                <button className={styles.joinBtn} onClick={() => setCurrentType(3)}>加入帮派</button>
              </div>
            )}
          </div>
        )}

        {/* 帮众列表 */}
        {currentType === 1 && myUnion && (
          <div className={styles.memberListPanel}>
            <div className={styles.memberTitle}>
              <span>职位</span>
              <span>成员</span>
              <span>等级</span>
              <span>贡献</span>
              <span>状态</span>
            </div>
            <div className={styles.memberList}>
              {members.map((member) => (
                <div key={member.id} className={styles.memberItem}>
                  <span className={styles.memberJob}>{jobNames[member.job]}</span>
                  <span className={styles.memberName}>
                    {member.name}
                    {member.online && <span className={styles.onlineDot}></span>}
                  </span>
                  <span className={styles.memberLevel}>{member.level}</span>
                  <span className={styles.memberContribution}>{member.contribution}</span>
                  <span className={styles.memberStatus}>{member.online ? '在线' : member.lastActive}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 申请者 */}
        {currentType === 2 && myUnion && (
          <div className={styles.applicantPanel}>
            <div className={styles.applicantTitle}>待审批申请 ({applicants.length})</div>
            <div className={styles.applicantList}>
              {applicants.length === 0 ? (
                <div className={styles.empty}>暂无申请</div>
              ) : (
                applicants.map((applicant) => (
                  <div key={applicant.id} className={styles.applicantItem}>
                    <div className={styles.applicantInfo}>
                      <span className={styles.applicantName}>{applicant.name}</span>
                      <span className={styles.applicantLevel}>等级 {applicant.level}</span>
                    </div>
                    <div className={styles.applicantActions}>
                      <button onClick={() => handleApprove(applicant.id, true)}>批准</button>
                      <button onClick={() => handleApprove(applicant.id, false)}>拒绝</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 帮派列表 */}
        {currentType === 3 && (
          <div className={styles.unionListPanel}>
            <div className={styles.unionListTitle}>可申请帮派</div>
            <div className={styles.unionList}>
              {unionList.map((union) => (
                <div key={union.id} className={styles.unionItem}>
                  <div className={styles.unionItemInfo}>
                    <span className={styles.unionItemName}>{union.name}</span>
                    <span className={styles.unionItemLeader}>帮主: {union.leader}</span>
                    <span className={styles.unionItemSize}>{union.memberCount}/{union.maxMembers}人</span>
                  </div>
                  <button onClick={() => handleJoin(union.id)}>申请</button>
                </div>
              ))}
            </div>
            <div className={styles.pagination}>
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>上一页</button>
              <span>{page} / {maxPage}</span>
              <button onClick={() => setPage(Math.min(maxPage, page + 1))} disabled={page === maxPage}>下一页</button>
            </div>
          </div>
        )}

        {/* 帮派聊天 */}
        {currentType === 4 && (
          <div className={styles.chatPanel}>
            <div className={styles.chatMessages}>
              <div className={styles.chatMessage}>
                <span className={styles.msgSender}>帮主A</span>
                <span className={styles.msgContent}>欢迎大家加入帮派！</span>
              </div>
              <div className={styles.chatMessage}>
                <span className={styles.msgSender}>副帮主B</span>
                <span className={styles.msgContent}>今晚8点帮战，大家准时参加！</span>
              </div>
            </div>
            <div className={styles.chatInput}>
              <input type="text" placeholder="输入消息..." />
              <button>发送</button>
            </div>
          </div>
        )}

        {/* 帮派物资 */}
        {currentType === 5 && (
          <div className={styles.resourcePanel}>
            <div className={styles.resourceTitle}>帮派物资</div>
            <div className={styles.resourceList}>
              <div className={styles.resourceItem}>
                <span>木材</span>
                <span>10000</span>
              </div>
              <div className={styles.resourceItem}>
                <span>钢材</span>
                <span>5000</span>
              </div>
              <div className={styles.resourceItem}>
                <span>粮食</span>
                <span>8000</span>
              </div>
            </div>
            <div className={styles.resourceActions}>
              <button>捐献物资</button>
              <button>申请物资</button>
            </div>
          </div>
        )}
      </div>

      {/* 创建帮派弹窗 */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>创建帮派</h3>
            <input
              type="text"
              placeholder="请输入帮派名称"
              value={newUnionName}
              onChange={(e) => setNewUnionName(e.target.value)}
              maxLength={10}
            />
            <div className={styles.modalActions}>
              <button onClick={handleCreateUnion}>创建</button>
              <button onClick={() => setShowCreateModal(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

UnionPanel.displayName = 'UnionPanel';

export default UnionPanel;
