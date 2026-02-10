/**
 * 帮派面板组件
 */
import React, { useState, useEffect, memo } from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import styles from '../../styles/GuildPanel.module.css';
import { getApiBase } from '../../utils/api';

interface Guild {
  id: number;
  name: string;
  level: number;
  leader_address: string;
  notice: string;
  member_count: number;
  members?: GuildMember[];
}

interface GuildMember {
  id: number;
  wallet_address: string;
  role: string;
  contribution: number;
  joined_at: string;
  character_name?: string;
}

interface GuildPanelProps {
  walletAddress: string;
}

const GuildPanel: React.FC<GuildPanelProps> = memo(({ walletAddress }) => {
  const { language } = useLanguage();
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [guildList, setGuildList] = useState<Guild[]>([]);
  const [createMode, setCreateMode] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createNotice, setCreateNotice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);


  const i18n = {
    title: language === 'en' ? 'Guild' : '帮派',
    myGuild: language === 'en' ? 'My Guild' : '我的帮派',
    guildList: language === 'en' ? 'Guild List' : '帮派列表',
    create: language === 'en' ? 'Create Guild' : '创建帮派',
    name: language === 'en' ? 'Name' : '名称',
    notice: language === 'en' ? 'Notice' : '公告',
    search: language === 'en' ? 'Search' : '搜索',
    join: language === 'en' ? 'Join' : '加入',
    leave: language === 'en' ? 'Leave' : '退出',
    members: language === 'en' ? 'Members' : '成员',
    contribution: language === 'en' ? 'Contribution' : '贡献',
    leader: language === 'en' ? 'Leader' : '帮主',
    elder: language === 'en' ? 'Elder' : '长老',
    member: language === 'en' ? 'Member' : '成员',
    noGuild: language === 'en' ? 'Not in a guild' : '未加入帮派',
    loading: language === 'en' ? 'Loading...' : '加载中...',
    disband: language === 'en' ? 'Disband' : '解散',
  };

  const fetchMyGuild = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/guild/my`, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        setMyGuild(data.data);
      }
    } catch (err) {
      console.error('Failed to load my guild:', err);
    }
  };

  const fetchGuildList = async () => {
    setLoading(true);
    try {
      const url = searchTerm
        ? `${getApiBase()}/api/guild/list?search=${encodeURIComponent(searchTerm)}`
        : `${getApiBase()}/api/guild/list`;
      const res = await fetch(url, {
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        setGuildList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load guild list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGuild();
    fetchGuildList();
  }, [walletAddress]);

  const createGuild = async () => {
    if (!createName.trim()) return;

    try {
      const res = await fetch(`${getApiBase()}/api/guild/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Auth': walletAddress || '',
        },
        body: JSON.stringify({ name: createName, notice: createNotice }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateMode(false);
        setCreateName('');
        setCreateNotice('');
        fetchMyGuild();
      }
    } catch (err) {
      console.error('Failed to create guild:', err);
    }
  };

  const joinGuild = async (guildId: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/guild/${guildId}/join`, {
        method: 'POST',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        fetchMyGuild();
      }
    } catch (err) {
      console.error('Failed to join guild:', err);
    }
  };

  const leaveGuild = async () => {
    if (!confirm(language === 'en' ? 'Leave guild?' : '确定离开帮派？')) return;

    try {
      const res = await fetch(`${getApiBase()}/api/guild/leave`, {
        method: 'POST',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        fetchMyGuild();
      }
    } catch (err) {
      console.error('Failed to leave guild:', err);
    }
  };

  const disbandGuild = async () => {
    if (!confirm(language === 'en' ? 'Disband guild? This cannot be undone!' : '确定解散帮派？此操作不可撤销！')) return;

    if (!myGuild) return;

    try {
      const res = await fetch(`${getApiBase()}/api/guild/${myGuild.id}`, {
        method: 'DELETE',
        headers: { 'X-Wallet-Auth': walletAddress || '' },
      });
      const data = await res.json();
      if (data.success) {
        setMyGuild(null);
      }
    } catch (err) {
      console.error('Failed to disband guild:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { text: string; color: string }> = {
      leader: { text: i18n.leader, color: '#ffd700' },
      elder: { text: i18n.elder, color: '#a855f7' },
      member: { text: i18n.member, color: '#667eea' },
    };
    return roles[role] || { text: role, color: '#888' };
  };

  if (loading && guildList.length === 0) {
    return (
      <PageLayout title={i18n.title}>
        <div className={styles.loading}>{i18n.loading}</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={i18n.title}>
      <div className={styles.container}>
        {/* 我的帮派 */}
        <div className={styles.section}>
          <h3>{i18n.myGuild}</h3>
          {myGuild ? (
            <div className={styles.myGuildCard}>
              <div className={styles.guildHeader}>
                <span className={styles.guildName}>{myGuild.name}</span>
                <span className={styles.memberCount}>👥 {myGuild.member_count}</span>
              </div>
              {myGuild.notice && (
                <div className={styles.notice}>{myGuild.notice}</div>
              )}
              <div className={styles.memberList}>
                {(myGuild.members || []).map((member) => (
                  <div key={member.id} className={styles.memberItem}>
                    <span className={styles.memberName}>
                      {member.character_name || member.wallet_address.slice(0, 8)}
                    </span>
                    <span
                      className={styles.roleBadge}
                      style={{ backgroundColor: getRoleBadge(member.role).color }}
                    >
                      {getRoleBadge(member.role).text}
                    </span>
                    <span className={styles.contribution}>
                      {member.contribution} {i18n.contribution}
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.guildActions}>
                <button className={styles.leaveBtn} onClick={leaveGuild}>
                  ↪️ {i18n.leave}
                </button>
                {myGuild.leader_address.toLowerCase() === walletAddress.toLowerCase() && (
                  <button className={styles.disbandBtn} onClick={disbandGuild}>
                    🗑️ {i18n.disband}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.noGuild}>
              <p>{i18n.noGuild}</p>
              <button className={styles.createBtn} onClick={() => setCreateMode(true)}>
                ➕ {i18n.create}
              </button>
            </div>
          )}
        </div>

        {/* 创建帮派表单 */}
        {createMode && (
          <div className={styles.createForm}>
            <h4>{i18n.create}</h4>
            <div className={styles.formGroup}>
              <label>{i18n.name}</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={language === 'en' ? '2-12 characters' : '2-12个字符'}
                maxLength={12}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{i18n.notice}</label>
              <textarea
                value={createNotice}
                onChange={(e) => setCreateNotice(e.target.value)}
                placeholder={language === 'en' ? 'Guild notice...' : '帮派公告...'}
                rows={3}
              />
            </div>
            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={() => setCreateMode(false)}>
                {language === 'en' ? 'Cancel' : '取消'}
              </button>
              <button
                className={styles.confirmBtn}
                onClick={createGuild}
                disabled={!createName.trim()}
              >
                {language === 'en' ? 'Create' : '创建'}
              </button>
            </div>
          </div>
        )}

        {/* 帮派列表 */}
        <div className={styles.section}>
          <h3>{i18n.guildList}</h3>
          <div className={styles.searchBar}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={i18n.search}
              onKeyDown={(e) => e.key === 'Enter' && fetchGuildList()}
            />
            <button onClick={fetchGuildList}>🔍</button>
          </div>
          <div className={styles.guildList}>
            {guildList.map((guild) => (
              <div key={guild.id} className={styles.guildItem}>
                <div className={styles.guildInfo}>
                  <span className={styles.guildName}>{guild.name}</span>
                  <span className={styles.memberCount}>👥 {guild.member_count}</span>
                </div>
                {myGuild?.id !== guild.id && (
                  <button
                    className={styles.joinBtn}
                    onClick={() => joinGuild(guild.id)}
                  >
                    {i18n.join}
                  </button>
                )}
              </div>
            ))}
            {guildList.length === 0 && !loading && (
              <div className={styles.empty}>No guilds found</div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
});

GuildPanel.displayName = 'GuildPanel';

export default GuildPanel;
