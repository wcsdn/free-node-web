/**
 * 帮派面板组件 (GuildPanel)
 * 帮派系统管理
 *
 * 功能：
 * - 查看我的帮派信息
 * - 帮派成员管理（踢人、任命副帮主、降职、转让帮主）
 * - 帮派捐献（金/资源/特殊资源）
 * - 帮派升级
 * - 浏览和加入其他帮派（支持申请加入和直接加入）
 * - 创建新帮派
 * - 管理加入申请（审批/拒绝）
 * - 解散帮派
 * - 帮派动态/日志
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getGuildMyInfo,
  getGuildList,
  createGuild,
  joinGuildDirect,
  applyJoinGuild,
  leaveGuild,
  getGuildMemberList,
  getGuildResource,
  upgradeGuild,
  modifyGuildIntro,
  modifyGuildAffiche,
  donateGuildResource,
  promoteMember,
  demoteMember,
  abdicateGuild,
  disbandGuild,
  guildBossFunc,
  getGuildInfo,
} from '../../services/gameApi';
import { toast } from '../common/Toast';

// ============ 类型定义 ============

interface GuildInfo {
  MyOrganize: {
    UID: number;
    OrgName: string;
    OrgLevel: number;
    Membership: number;
    MaxMembership: number;
    OfficialNumber: number;
    Affiche: string;
    Intro: string;
  } | null;
  MyMember: {
    UID: number;
    UserName: string;
    Privilege: number;
    Contribution: number;
    JoinTime: string;
  } | null;
  MyOrgEffectInfo: {
    MoneyPer: number;
    FoodPer: number;
    MenPer: number;
    AttackPer: number;
    DefencePer: number;
  };
  BossName: string | null;
}

interface GuildListItem {
  id: number;
  name: string;
  level: number;
  memberCount: number;
  notice: string;
  insignia: string;
  isFull: boolean;
}

interface GuildMember {
  uid: number;
  walletAddress: string;
  name: string;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  level: number;
  vipLevel: number;
  joinedAt: string;
  prosperity?: number;
  cityName?: string;
  cityPos?: string;
  userLevel?: number;
}

interface GuildResource {
  guildId: number;
  guildName: string;
  resources: { money: number; food: number; men: number };
}

interface GuildEvent {
  eventId: number;
  time: string;
  node: string;
  flag: number;
}

interface ApplicantItem {
  walletAddress: string;
  name: string;
  level: number;
  appliedAt: string;
}

interface GuildPanelProps {
  cityId?: number;
}

type GuildTab = 'info' | 'members' | 'donate' | 'manage';
type GuildView = 'my' | 'list' | 'create';

export const GuildPanel: React.FC<GuildPanelProps> = ({ cityId = 1 }) => {
  const [guildView, setGuildView] = useState<GuildView>('my');
  const [activeTab, setActiveTab] = useState<GuildTab>('info');
  const [myGuildInfo, setMyGuildInfo] = useState<GuildInfo | null>(null);
  const [guildList, setGuildList] = useState<GuildListItem[]>([]);
  const [memberList, setMemberList] = useState<GuildMember[]>([]);
  const [guildResource, setGuildResource] = useState<GuildResource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState<number | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isBoss, setIsBoss] = useState(false);
  const [isOfficer, setIsOfficer] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createIntro, setCreateIntro] = useState('');
  const [donateType, setDonateType] = useState<'money' | 'food' | 'population'>('money');
  const [donateAmount, setDonateAmount] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingAffiche, setEditingAffiche] = useState(false);
  const [editingIntro, setEditingIntro] = useState(false);
  const [newAffiche, setNewAffiche] = useState('');
  const [newIntro, setNewIntro] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 新增状态
  const [guildEvents, setGuildEvents] = useState<GuildEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GuildMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [applicantList, setApplicantList] = useState<ApplicantItem[]>([]);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [activeManageSubTab, setActiveManageSubTab] = useState<'main' | 'applicants'>('main');

  const getPrivilegeName = (privilege: number) => {
    switch (privilege) {
      case 5: return '帮主';
      case 3: return '副帮主';
      default: return '成员';
    }
  };

  const getPrivilegeColor = (privilege: number) => {
    switch (privilege) {
      case 5: return '#f59e0b';
      case 3: return '#a855f7';
      default: return '#6b7280';
    }
  };

  const loadMyGuildInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getGuildMyInfo();
      if (result.success && result.data) {
        setMyGuildInfo(result.data);
        const privilege = result.data.MyMember?.Privilege;
        setIsBoss(privilege === 5);
        setIsOfficer(privilege === 5 || privilege === 3);
        setNewAffiche(result.data.MyOrganize?.Affiche || '');
        setNewIntro(result.data.MyOrganize?.Intro || '');
      }
    } catch (err) {
      console.error('Failed to load guild info:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGuildList = useCallback(async (search?: string) => {
    setIsLoadingList(true);
    try {
      const result = await getGuildList(search);
      if (result.success && Array.isArray(result.data)) {
        setGuildList(result.data);
      }
    } catch (err) {
      console.error('Failed to load guild list:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const loadMemberList = useCallback(async (guildId: number) => {
    setIsLoadingMembers(true);
    try {
      const result = await getGuildMemberList(guildId, 'all', 1, 50);
      if (result.success && result.data?.members) {
        setMemberList(result.data.members);
      }
    } catch (err) {
      console.error('Failed to load member list:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  const loadGuildResource = useCallback(async (guildId: number) => {
    try {
      const result = await getGuildResource(guildId);
      if (result.success && result.data) {
        setGuildResource(result.data);
      }
    } catch (err) {
      console.error('Failed to load guild resource:', err);
    }
  }, []);

  // 加载帮派事件/日志
  const loadGuildEvents = useCallback(async (guildId: number) => {
    setIsLoadingEvents(true);
    try {
      const result = await getGuildInfo(guildId);
      if (result.success && result.data?.events) {
        setGuildEvents(result.data.events);
      } else {
        setGuildEvents([]);
      }
    } catch (err) {
      console.error('Failed to load guild events:', err);
      setGuildEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadMyGuildInfo();
  }, [loadMyGuildInfo]);

  useEffect(() => {
    if (myGuildInfo?.MyOrganize?.UID) {
      loadMemberList(myGuildInfo.MyOrganize.UID);
      loadGuildResource(myGuildInfo.MyOrganize.UID);
      loadGuildEvents(myGuildInfo.MyOrganize.UID);
    }
  }, [myGuildInfo?.MyOrganize?.UID, loadMemberList, loadGuildResource, loadGuildEvents]);

  // 处理申请加入帮派（需要审批）
  const handleApplyJoinGuild = async (guildId: number) => {
    setIsJoining(guildId);
    setMessage(null);
    try {
      const result = await applyJoinGuild(guildId, cityId);
      if (result.success) {
        toast.success(result.data?.message || '申请已提交，请等待帮主审批！');
        setMessage({ type: 'success', text: result.data?.message || '申请已提交，请等待帮主审批！' });
        setGuildList(prev => prev.map(g => g.id === guildId ? { ...g, isApplied: true } as any : g));
      } else {
        toast.error(result.error || '申请失败');
        setMessage({ type: 'error', text: result.error || '申请失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '申请失败');
      setMessage({ type: 'error', text: err.message || '申请失败' });
    } finally {
      setIsJoining(null);
    }
  };

  // 处理直接加入帮派（无需审批）
  const handleJoinGuild = async (guildId: number) => {
    setIsJoining(guildId);
    setMessage(null);
    try {
      const result = await joinGuildDirect(guildId);
      if (result.success) {
        toast.success('加入帮派成功！');
        setMessage({ type: 'success', text: '加入帮派成功！' });
        setGuildView('my');
        await loadMyGuildInfo();
      } else {
        toast.error(result.error || '加入失败');
        setMessage({ type: 'error', text: result.error || '加入失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '加入失败');
      setMessage({ type: 'error', text: err.message || '加入失败' });
    } finally {
      setIsJoining(null);
    }
  };

  // 处理创建帮派
  const handleCreateGuild = async () => {
    if (!createName || createName.length < 2 || createName.length > 10) {
      setMessage({ type: 'error', text: '帮派名称需要2-10个字符' });
      return;
    }
    setIsCreating(true);
    setMessage(null);
    try {
      const result = await createGuild(cityId, createName, createIntro);
      if (result.success) {
        toast.success('帮派创建成功！');
        setMessage({ type: 'success', text: '帮派创建成功！' });
        setGuildView('my');
        setCreateName('');
        setCreateIntro('');
        await loadMyGuildInfo();
      } else {
        toast.error(result.error || '创建失败');
        setMessage({ type: 'error', text: result.error || '创建失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '创建失败');
      setMessage({ type: 'error', text: err.message || '创建失败' });
    } finally {
      setIsCreating(false);
    }
  };

  // 处理退出帮派
  const handleLeaveGuild = async () => {
    setIsLeaving(true);
    setMessage(null);
    try {
      const result = await leaveGuild();
      if (result.success) {
        toast.success('已退出帮派');
        setMessage({ type: 'success', text: '已退出帮派' });
        setMyGuildInfo(null);
        setMemberList([]);
        setGuildResource(null);
      } else {
        toast.error(result.error || '退出失败');
        setMessage({ type: 'error', text: result.error || '退出失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '退出失败');
      setMessage({ type: 'error', text: err.message || '退出失败' });
    } finally {
      setIsLeaving(false);
    }
  };

  // 处理捐献
  const handleDonate = async () => {
    const amount = parseInt(donateAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: '请输入有效的捐献数量' });
      return;
    }
    if (!myGuildInfo?.MyOrganize?.UID) return;
    setIsDonating(true);
    setMessage(null);
    try {
      const result = await donateGuildResource(myGuildInfo.MyOrganize.UID, donateType, amount);
      if (result.success) {
        toast.success(result.data?.message || '捐献成功！');
        setMessage({ type: 'success', text: result.data?.message || '捐献成功！' });
        setDonateAmount('');
        await Promise.all([
          loadGuildResource(myGuildInfo.MyOrganize.UID),
          loadMyGuildInfo(),
        ]);
      } else {
        toast.error(result.error || '捐献失败');
        setMessage({ type: 'error', text: result.error || '捐献失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '捐献失败');
      setMessage({ type: 'error', text: err.message || '捐献失败' });
    } finally {
      setIsDonating(false);
    }
  };

  // 处理帮派升级
  const handleUpgradeGuild = async () => {
    if (!myGuildInfo?.MyOrganize?.UID) return;
    setIsUpgrading(true);
    setMessage(null);
    try {
      const result = await upgradeGuild(myGuildInfo.MyOrganize.UID);
      if (result.success) {
        toast.success(result.data?.message || '升级成功！');
        setMessage({ type: 'success', text: result.data?.message || '升级成功！' });
        await loadMyGuildInfo();
      } else {
        toast.error(result.error || '升级失败');
        setMessage({ type: 'error', text: result.error || '升级失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '升级失败');
      setMessage({ type: 'error', text: err.message || '升级失败' });
    } finally {
      setIsUpgrading(false);
    }
  };

  // 处理更新公告
  const handleUpdateAffiche = async () => {
    if (!myGuildInfo?.MyOrganize?.UID) return;
    try {
      const result = await modifyGuildAffiche(myGuildInfo.MyOrganize.UID, newAffiche);
      if (result.success) {
        toast.success('公告更新成功！');
        setMessage({ type: 'success', text: '公告更新成功！' });
        setEditingAffiche(false);
        await loadMyGuildInfo();
      } else {
        toast.error(result.error || '更新失败');
        setMessage({ type: 'error', text: result.error || '更新失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '更新失败');
      setMessage({ type: 'error', text: err.message || '更新失败' });
    }
  };

  // 处理更新简介
  const handleUpdateIntro = async () => {
    if (!myGuildInfo?.MyOrganize?.UID) return;
    try {
      const result = await modifyGuildIntro(myGuildInfo.MyOrganize.UID, newIntro);
      if (result.success) {
        toast.success('简介更新成功！');
        setMessage({ type: 'success', text: '简介更新成功！' });
        setEditingIntro(false);
        await loadMyGuildInfo();
      } else {
        toast.error(result.error || '更新失败');
        setMessage({ type: 'error', text: result.error || '更新失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '更新失败');
      setMessage({ type: 'error', text: err.message || '更新失败' });
    }
  };

  // 踢出成员
  const handleKickMember = async (member: GuildMember) => {
    if (!myGuildInfo?.MyOrganize?.UID) return;
    if (!confirm(`确定要将 ${member.name} 踢出帮派吗？`)) return;
    try {
      const result = await guildBossFunc(myGuildInfo.MyOrganize.UID, 1, member.walletAddress);
      if (result.success) {
        toast.success('已踢出成员');
        setShowMemberModal(false);
        setSelectedMember(null);
        await loadMemberList(myGuildInfo.MyOrganize.UID);
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  // 任命副帮主
  const handlePromoteToOfficer = async (member: GuildMember) => {
    if (!myGuildInfo?.MyOrganize?.UID) return;
    if (!confirm(`确定任命 ${member.name} 为副帮主吗？`)) return;
    try {
      const result = await promoteMember(myGuildInfo.MyOrganize.UID, member.walletAddress);
      if (result.success) {
        toast.success('已任命为副帮主');
        setShowMemberModal(false);
        setSelectedMember(null);
        await loadMemberList(myGuildInfo.MyOrganize.UID);
        await loadMyGuildInfo();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  // 降职为成员
  const handleDemoteToMember = async (member: GuildMember) => {
    if (!myGuildInfo?.MyOrganize?.UID) return;
    if (!confirm(`确定将 ${member.name} 降为普通成员吗？`)) return;
    try {
      const result = await demoteMember(myGuildInfo.MyOrganize.UID, member.walletAddress);
      if (result.success) {
        toast.success('已降为普通成员');
        setShowMemberModal(false);
        setSelectedMember(null);
        await loadMemberList(myGuildInfo.MyOrganize.UID);
        await loadMyGuildInfo();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  // 转让帮主
  const handleAbdicate = async (member: GuildMember) => {
    if (!myGuildInfo?.MyOrganize?.UID) return;
    if (!confirm(`确定将帮主转让给 ${member.name} 吗？转让后你将成为普通成员。`)) return;
    try {
      const result = await abdicateGuild(myGuildInfo.MyOrganize.UID, member.walletAddress);
      if (result.success) {
        toast.success('帮主已转让');
        setShowMemberModal(false);
        setSelectedMember(null);
        await loadMyGuildInfo();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  // 解散帮派
  const handleDisbandGuild = async () => {
    if (!myGuildInfo?.MyOrganize?.UID) return;
    if (!confirm(`⚠️ 确定要解散帮派吗？此操作不可恢复！`)) return;
    if (!confirm(`再次确认：解散「${myGuildInfo.MyOrganize.OrgName}」？`)) return;
    try {
      const result = await disbandGuild(myGuildInfo.MyOrganize.UID);
      if (result.success) {
        toast.success('帮派已解散');
        setMyGuildInfo(null);
        setMemberList([]);
        setGuildResource(null);
        setGuildView('my');
      } else {
        toast.error(result.error || '解散失败');
      }
    } catch (err: any) {
      toast.error(err.message || '解散失败');
    }
  };

  // 批准申请者加入
  const handleApproveApplicant = async (applicant: ApplicantItem) => {
    if (!myGuildInfo?.MyOrganize?.UID) return;
    try {
      const result = await guildBossFunc(myGuildInfo.MyOrganize.UID, 2, applicant.walletAddress);
      if (result.success) {
        toast.success(`已批准 ${applicant.name} 加入帮派`);
        await loadMemberList(myGuildInfo.MyOrganize.UID);
        setApplicantList(prev => prev.filter(a => a.walletAddress !== applicant.walletAddress));
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  // 拒绝申请者
  const handleRejectApplicant = async (applicant: ApplicantItem) => {
    if (!myGuildInfo?.MyOrganize?.UID) return;
    if (!confirm(`确定拒绝 ${applicant.name} 的加入申请吗？`)) return;
    try {
      const result = await guildBossFunc(myGuildInfo.MyOrganize.UID, 3, applicant.walletAddress);
      if (result.success) {
        toast.success('已拒绝申请');
        setApplicantList(prev => prev.filter(a => a.walletAddress !== applicant.walletAddress));
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  // 打开成员详情
  const openMemberDetail = (member: GuildMember) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const guildId = myGuildInfo?.MyOrganize?.UID;
  const guildLevel = myGuildInfo?.MyOrganize?.OrgLevel || 1;
  const upgradeCost = guildLevel * 1000;

  // ====== 成员详情模态框 ======
  const renderMemberModal = () => {
    if (!showMemberModal || !selectedMember) return null;
    const memberPrivilege = selectedMember.role === 'leader' ? 5 : selectedMember.role === 'officer' ? 3 : 1;

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }} onClick={() => { setShowMemberModal(false); setSelectedMember(null); }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '12px',
          padding: '16px',
          width: '100%',
          maxWidth: '360px',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: selectedMember.role === 'leader' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' :
                          selectedMember.role === 'officer' ? 'linear-gradient(135deg, #a855f7, #3b82f6)' :
                          'linear-gradient(135deg, #6b7280, #374151)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 'bold', color: '#fff', flexShrink: 0,
            }}>
              {selectedMember.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{selectedMember.name}</div>
              <div style={{ fontSize: '11px', color: getPrivilegeColor(memberPrivilege) }}>
                {getPrivilegeName(memberPrivilege)}
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                {selectedMember.walletAddress.slice(0, 8)}...{selectedMember.walletAddress.slice(-6)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
            {[
              { label: '等级', value: `Lv.${selectedMember.level || 0}` },
              { label: 'VIP', value: `VIP ${selectedMember.vipLevel || 0}` },
              { label: '贡献度', value: selectedMember.contribution },
              { label: '加入时间', value: selectedMember.joinedAt ? selectedMember.joinedAt.split('T')[0] : '-' },
            ].map(item => (
              <div key={item.label} style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>{item.label}</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* 管理操作（仅帮主可见） */}
          {isBoss && selectedMember.role !== 'leader' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedMember.role === 'member' && (
                <button
                  className="building-action gufeng-btn"
                  style={{ width: '100%', fontSize: '12px', padding: '8px', minHeight: '36px', background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid #a855f7' }}
                  onClick={() => handlePromoteToOfficer(selectedMember)}
                >
                  ⬆ 任命为副帮主
                </button>
              )}
              {selectedMember.role === 'officer' && (
                <button
                  className="building-action"
                  style={{ width: '100%', fontSize: '12px', padding: '8px', minHeight: '36px', background: 'rgba(107,114,128,0.2)', color: '#9ca3af', border: '1px solid #6b7280' }}
                  onClick={() => handleDemoteToMember(selectedMember)}
                >
                  ⬇ 降为普通成员
                </button>
              )}
              <button
                className="building-action"
                style={{ width: '100%', fontSize: '12px', padding: '8px', minHeight: '36px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}
                onClick={() => handleAbdicate(selectedMember)}
              >
                👑 转让帮主
              </button>
              <button
                className="building-action"
                style={{ width: '100%', fontSize: '12px', padding: '8px', minHeight: '36px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444' }}
                onClick={() => handleKickMember(selectedMember)}
              >
                🚫 踢出帮派
              </button>
            </div>
          )}
          {/* 副帮主可踢普通成员 */}
          {isOfficer && !isBoss && selectedMember.role === 'member' && (
            <button
              className="building-action"
              style={{ width: '100%', fontSize: '12px', padding: '8px', minHeight: '36px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444' }}
              onClick={() => handleKickMember(selectedMember)}
            >
              🚫 踢出帮派
            </button>
          )}

          <button
            className="building-action"
            style={{ width: '100%', fontSize: '12px', padding: '8px', minHeight: '36px', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', marginTop: '8px' }}
            onClick={() => { setShowMemberModal(false); setSelectedMember(null); }}
          >
            关闭
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-card" style={{ padding: '12px', minHeight: '100%' }}>
      {/* 标题 */}
      <div className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span>⚔️ 帮派系统</span>
        <button className="gufeng-btn" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => loadMyGuildInfo()}>
          🔄 刷新
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div style={{
          padding: '8px 12px',
          marginBottom: '10px',
          borderRadius: '6px',
          fontSize: '12px',
          background: message.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: message.type === 'success' ? '#22c55e' : '#ef4444',
          border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
        }}>
          {message.text}
        </div>
      )}

      {/* ====== 帮派概览卡（已加入） ====== */}
      {guildId && myGuildInfo?.MyOrganize && (
        <div className="dashboard-card" style={{
          padding: '12px',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(59,130,246,0.2))',
          border: '1px solid rgba(168,85,247,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>
                {myGuildInfo.MyOrganize.OrgName}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                帮主: {myGuildInfo.BossName || '未知'} | 等级: {guildLevel}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>成员</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e' }}>
                {myGuildInfo.MyOrganize.Membership}/{myGuildInfo.MyOrganize.MaxMembership}
              </div>
            </div>
          </div>
          {myGuildInfo.MyMember && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '11px' }}>
              <span style={{ color: getPrivilegeColor(myGuildInfo.MyMember.Privilege), fontWeight: 'bold' }}>
                [{getPrivilegeName(myGuildInfo.MyMember.Privilege)}]
              </span>
              <span style={{ color: '#fff' }}>贡献度: {myGuildInfo.MyMember.Contribution}</span>
            </div>
          )}
        </div>
      )}

      {/* ====== 未加入帮派 - 视图切换 ====== */}
      {!guildId && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
          {[
            { key: 'my' as GuildView, label: '🏠 我的帮派' },
            { key: 'list' as GuildView, label: '🔍 浏览帮派' },
            { key: 'create' as GuildView, label: '➕ 创建帮派' },
          ].map((tab) => (
            <button
              key={tab.key}
              className="building-action"
              style={{
                flex: 1,
                fontSize: '11px',
                padding: '8px 4px',
                minHeight: '36px',
                background: guildView === tab.key ? 'var(--primary-color, #3b82f6)' : 'rgba(255,255,255,0.05)',
                color: guildView === tab.key ? '#fff' : '#9ca3af',
              }}
              onClick={() => { setGuildView(tab.key); if (tab.key === 'list') loadGuildList(); }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ====== 已加入帮派 - Tab切换 ====== */}
      {guildId && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {[
            { key: 'info' as GuildTab, label: '🏰 概况' },
            { key: 'members' as GuildTab, label: '👥 成员' },
            { key: 'donate' as GuildTab, label: '💰 捐献' },
            { key: 'manage' as GuildTab, label: '⚙️ 管理' },
          ].map((tab) => (
            <button
              key={tab.key}
              className="building-action"
              style={{
                flex: 1,
                fontSize: '11px',
                padding: '7px 4px',
                minHeight: '36px',
                background: activeTab === tab.key ? 'var(--primary-color, #3b82f6)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.key ? '#fff' : '#9ca3af',
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ====== 未加入：我的帮派（空状态） ====== */}
      {guildView === 'my' && !guildId && (
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏛️</div>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>您还没有加入帮派</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>创建自己的帮派或加入已有帮派</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button className="building-action gufeng-btn" style={{ fontSize: '12px', padding: '8px 16px', minHeight: '36px' }} onClick={() => setGuildView('create')}>
              ➕ 创建帮派
            </button>
            <button className="building-action gufeng-btn" style={{ fontSize: '12px', padding: '8px 16px', minHeight: '36px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6' }} onClick={() => { setGuildView('list'); loadGuildList(); }}>
              🔍 浏览帮派
            </button>
          </div>
        </div>
      )}

      {/* ====== 浏览帮派列表 ====== */}
      {guildView === 'list' && !guildId && (
        <>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="搜索帮派名称..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadGuildList(searchKeyword)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '12px', minHeight: '36px', boxSizing: 'border-box' }}
            />
            <button className="building-action gufeng-btn" style={{ fontSize: '12px', padding: '8px 12px', minHeight: '36px' }} onClick={() => loadGuildList(searchKeyword)}>
              🔍
            </button>
          </div>

          {isLoadingList ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '12px' }}>加载中...</div>
          ) : guildList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {guildList.map((guild) => (
                <div key={guild.id} className="dashboard-card" style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    ⚔️
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{guild.name}</span>
                      <span style={{ fontSize: '10px', color: '#f59e0b' }}>Lv.{guild.level}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      👥 {guild.memberCount}/50 成员{guild.isFull && <span style={{ color: '#ef4444' }}> | 已满员</span>}
                    </div>
                    {guild.notice && (
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📢 {guild.notice}
                      </div>
                    )}
                  </div>
                  {guild.isFull ? (
                    <button className="building-action" style={{ fontSize: '11px', padding: '6px 10px', minHeight: '36px', background: 'rgba(255,255,255,0.05)', color: '#6b7280' }} disabled>
                      已满
                    </button>
                  ) : (
                    <button
                      className="building-action gufeng-btn"
                      style={{ fontSize: '11px', padding: '6px 10px', minHeight: '36px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid #3b82f6' }}
                      disabled={isJoining === guild.id}
                      onClick={() => handleApplyJoinGuild(guild.id)}
                    >
                      {isJoining === guild.id ? '申请中..' : '📨 申请加入'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '12px' }}>暂无帮派</div>
          )}
        </>
      )}

      {/* ====== 创建帮派 ====== */}
      {guildView === 'create' && !guildId && (
        <div className="dashboard-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '13px', color: '#fff', marginBottom: '12px', fontWeight: 'bold' }}>🏗️ 创建新帮派</div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>帮派名称 (2-10字)</label>
            <input
              type="text"
              placeholder="输入帮派名称..."
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              maxLength={10}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '12px', minHeight: '36px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>帮派简介 (可选)</label>
            <textarea
              placeholder="简单介绍一下你的帮派..."
              value={createIntro}
              onChange={(e) => setCreateIntro(e.target.value)}
              rows={3}
              maxLength={200}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="building-action" style={{ flex: 1, fontSize: '12px', padding: '10px', minHeight: '36px', background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }} onClick={() => setGuildView('my')}>返回</button>
            <button className="building-action gufeng-btn" style={{ flex: 1, fontSize: '12px', padding: '10px', minHeight: '36px', opacity: isCreating ? 0.7 : 1 }} disabled={isCreating || !createName} onClick={handleCreateGuild}>
              {isCreating ? '创建中..' : '✅ 创建帮派'}
            </button>
          </div>
        </div>
      )}

      {/* ====== Tab: 概况 ====== */}
      {activeTab === 'info' && guildId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 帮派效果 */}
          {myGuildInfo?.MyOrgEffectInfo && (
            <div className="dashboard-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>📊 帮派效果 (Lv.{guildLevel})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { label: '金币加成', value: myGuildInfo.MyOrgEffectInfo.MoneyPer },
                  { label: '粮食加成', value: myGuildInfo.MyOrgEffectInfo.FoodPer },
                  { label: '人口加成', value: myGuildInfo.MyOrgEffectInfo.MenPer },
                  { label: '攻击加成', value: myGuildInfo.MyOrgEffectInfo.AttackPer },
                  { label: '防御加成', value: myGuildInfo.MyOrgEffectInfo.DefencePer },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: 'center', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{item.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>+{item.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 公告 */}
          <div className="dashboard-card" style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>📢 帮派公告</div>
              {isOfficer && !editingAffiche && (
                <button className="building-action" style={{ fontSize: '10px', padding: '2px 8px', minHeight: '28px', color: '#3b82f6' }} onClick={() => setEditingAffiche(true)}>编辑</button>
              )}
            </div>
            {editingAffiche ? (
              <div>
                <textarea
                  value={newAffiche}
                  onChange={(e) => setNewAffiche(e.target.value)}
                  maxLength={500}
                  rows={3}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px', color: '#fff', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button className="building-action" style={{ flex: 1, fontSize: '11px', padding: '6px', minHeight: '32px' }} onClick={() => setEditingAffiche(false)}>取消</button>
                  <button className="building-action gufeng-btn" style={{ flex: 1, fontSize: '11px', padding: '6px', minHeight: '32px' }} onClick={handleUpdateAffiche}>保存</button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5' }}>
                {myGuildInfo?.MyOrganize?.Affiche || '暂无公告'}
              </div>
            )}
          </div>

          {/* 帮派资源 */}
          {guildResource && (
            <div className="dashboard-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>💰 帮派资源</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { label: '金币', value: guildResource.resources?.money || 0, icon: '💰' },
                  { label: '粮食', value: guildResource.resources?.food || 0, icon: '🌾' },
                  { label: '人口', value: guildResource.resources?.men || 0, icon: '👥' },
                ].map((item) => (
                  <div key={item.label} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '14px' }}>{item.icon}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b' }}>{item.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 帮派动态/日志 */}
          <div className="dashboard-card" style={{ padding: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>📋 帮派动态</div>
            {isLoadingEvents ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', padding: '10px' }}>加载中...</div>
            ) : guildEvents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                {guildEvents.map((event, idx) => (
                  <div key={idx} style={{
                    fontSize: '11px',
                    padding: '4px 6px',
                    background: event.flag === 1 || event.flag === 2 || event.flag === 3 ? 'rgba(168,85,247,0.1)' : 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    color: event.flag === 1 || event.flag === 2 || event.flag === 3 ? '#a855f7' : '#9ca3af',
                    lineHeight: '1.4',
                  }}>
                    <span style={{ color: '#6b7280', marginRight: '6px' }}>{event.time}</span>
                    {event.node}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '10px' }}>
                暂无帮派动态
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== Tab: 成员 ====== */}
      {activeTab === 'members' && guildId && (
        <>
          {isLoadingMembers ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '12px' }}>加载中...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto' }}>
              {memberList.map((member) => (
                <div
                  key={member.uid}
                  className="dashboard-card"
                  style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={() => openMemberDetail(member)}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: member.role === 'leader' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : member.role === 'officer' ? 'linear-gradient(135deg, #a855f7, #3b82f6)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#fff', flexShrink: 0,
                  }}>
                    {member.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '1px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{member.name}</span>
                      <span style={{ fontSize: '10px', color: getPrivilegeColor(member.role === 'leader' ? 5 : member.role === 'officer' ? 3 : 1) }}>
                        [{getPrivilegeName(member.role === 'leader' ? 5 : member.role === 'officer' ? 3 : 1)}]
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                      Lv.{member.level} | VIP {member.vipLevel} | 贡献: {member.contribution}
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>›</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ====== Tab: 捐献 ====== */}
      {activeTab === 'donate' && guildId && (
        <div className="dashboard-card" style={{ padding: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '10px' }}>💰 帮派捐献</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '10px', lineHeight: '1.5' }}>
            每捐献100资源获得1点贡献度<br/>
            <span style={{ color: '#6b7280' }}>贡献度可提升个人名望/声望等级</span>
          </div>

          {/* 资源选择 */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {[
              { key: 'money' as const, label: '💰 金币', color: '#f59e0b' },
              { key: 'food' as const, label: '🌾 粮食', color: '#22c55e' },
              { key: 'population' as const, label: '👥 人口', color: '#3b82f6' },
            ].map((item) => (
              <button
                key={item.key}
                className="building-action"
                style={{
                  flex: 1,
                  fontSize: '11px',
                  padding: '6px',
                  minHeight: '36px',
                  background: donateType === item.key ? `${item.color}30` : 'rgba(255,255,255,0.05)',
                  color: donateType === item.key ? item.color : '#9ca3af',
                  border: donateType === item.key ? `1px solid ${item.color}` : '1px solid transparent',
                }}
                onClick={() => setDonateType(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <input
              type="number"
              placeholder="输入捐献数量..."
              value={donateAmount}
              onChange={(e) => setDonateAmount(e.target.value)}
              min={1}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '8px 10px',
                color: '#fff',
                fontSize: '12px',
                minHeight: '36px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            className="building-action gufeng-btn"
            style={{ width: '100%', fontSize: '12px', padding: '10px', minHeight: '36px', opacity: isDonating ? 0.7 : 1 }}
            disabled={isDonating || !donateAmount}
            onClick={handleDonate}
          >
            {isDonating ? '捐献中..' : '✅ 确认捐献'}
          </button>
        </div>
      )}

      {/* ====== Tab: 管理 ====== */}
      {activeTab === 'manage' && guildId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 管理子Tab（仅帮主可见） */}
          {isBoss && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              {[
                { key: 'main' as const, label: '⚙️ 管理' },
                { key: 'applicants' as const, label: '📋 申请列表' },
              ].map((sub) => (
                <button
                  key={sub.key}
                  className="building-action"
                  style={{
                    flex: 1,
                    fontSize: '11px',
                    padding: '6px',
                    minHeight: '32px',
                    background: activeManageSubTab === sub.key ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.05)',
                    color: activeManageSubTab === sub.key ? '#a855f7' : '#9ca3af',
                    border: activeManageSubTab === sub.key ? '1px solid rgba(168,85,247,0.5)' : '1px solid transparent',
                  }}
                  onClick={() => setActiveManageSubTab(sub.key)}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* 申请列表 */}
          {isBoss && activeManageSubTab === 'applicants' && (
            <div className="dashboard-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>📋 待审批申请</div>
              {isLoadingApplicants ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', padding: '10px' }}>加载中...</div>
              ) : applicantList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {applicantList.map((applicant) => (
                    <div key={applicant.walletAddress} className="dashboard-card" style={{ padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{applicant.name}</div>
                          <div style={{ fontSize: '10px', color: '#6b7280' }}>Lv.{applicant.level} | {applicant.walletAddress.slice(0, 10)}...</div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="building-action gufeng-btn"
                            style={{ fontSize: '10px', padding: '4px 8px', minHeight: '28px', background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid #22c55e' }}
                            onClick={() => handleApproveApplicant(applicant)}
                          >
                            ✅ 批准
                          </button>
                          <button
                            className="building-action"
                            style={{ fontSize: '10px', padding: '4px 8px', minHeight: '28px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444' }}
                            onClick={() => handleRejectApplicant(applicant)}
                          >
                            ❌ 拒绝
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '10px' }}>
                  暂无待审批的申请
                </div>
              )}
            </div>
          )}

          {/* 主要管理内容 */}
          {(!isBoss || activeManageSubTab === 'main') && (
            <>
              {/* 升级帮派 */}
              <div className="dashboard-card" style={{ padding: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>⬆️ 帮派升级</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                  当前等级: {guildLevel} / 最大等级: 10
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                  升级费用: 💰 {upgradeCost.toLocaleString()} 金币
                </div>
                {guildLevel < 10 && isBoss && (
                  <button
                    className="building-action gufeng-btn"
                    style={{ width: '100%', fontSize: '12px', padding: '8px', minHeight: '36px', opacity: isUpgrading ? 0.7 : 1 }}
                    disabled={isUpgrading}
                    onClick={handleUpgradeGuild}
                  >
                    {isUpgrading ? '升级中..' : '⬆️ 升级帮派'}
                  </button>
                )}
                {guildLevel >= 10 && (
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#22c55e', padding: '8px' }}>
                    已达最高等级
                  </div>
                )}
                {!isBoss && guildLevel < 10 && (
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', padding: '6px' }}>
                    仅帮主可升级帮派
                  </div>
                )}
              </div>

              {/* 简介管理（副帮主以上） */}
              {isOfficer && (
                <div className="dashboard-card" style={{ padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>📝 帮派简介</div>
                  {editingIntro ? (
                    <div>
                      <textarea
                        value={newIntro}
                        onChange={(e) => setNewIntro(e.target.value)}
                        maxLength={200}
                        rows={3}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px', color: '#fff', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <button className="building-action" style={{ flex: 1, fontSize: '11px', padding: '6px', minHeight: '32px' }} onClick={() => setEditingIntro(false)}>取消</button>
                        <button className="building-action gufeng-btn" style={{ flex: 1, fontSize: '11px', padding: '6px', minHeight: '32px' }} onClick={handleUpdateIntro}>保存</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', lineHeight: '1.5' }}>
                        {myGuildInfo?.MyOrganize?.Intro || '暂无简介'}
                      </div>
                      <button className="building-action" style={{ fontSize: '11px', padding: '4px 10px', minHeight: '32px', color: '#3b82f6' }} onClick={() => setEditingIntro(true)}>
                        编辑简介
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 解散帮派（仅帮主） */}
              {isBoss && (
                <div className="dashboard-card" style={{ padding: '10px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444', marginBottom: '6px' }}>⚠️ 危险操作</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                    解散帮派将删除所有帮派数据和成员，该操作不可恢复！
                  </div>
                  <button
                    className="building-action"
                    style={{
                      width: '100%',
                      fontSize: '12px',
                      padding: '8px',
                      minHeight: '36px',
                      background: 'rgba(239,68,68,0.15)',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                    }}
                    onClick={handleDisbandGuild}
                  >
                    💥 解散帮派
                  </button>
                </div>
              )}

              {/* 退出帮派（非帮主） */}
              {!isBoss && (
                <button
                  className="building-action"
                  style={{
                    width: '100%',
                    fontSize: '12px',
                    padding: '10px',
                    minHeight: '36px',
                    background: 'rgba(239,68,68,0.1)',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                  }}
                  disabled={isLeaving}
                  onClick={handleLeaveGuild}
                >
                  {isLeaving ? '退出中..' : '📤 退出帮派'}
                </button>
              )}

              {isBoss && (
                <div className="dashboard-card" style={{ padding: '10px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                  <div style={{ fontSize: '12px', color: '#ef4444', textAlign: 'center' }}>
                    ⚠️ 帮主不能直接退出帮派<br />
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>请先禅让帮主身份或解散帮派</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && guildId && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '12px' }}>
          加载中...
        </div>
      )}

      {/* ====== 成员详情模态框 ====== */}
      {renderMemberModal()}
    </div>
  );
};