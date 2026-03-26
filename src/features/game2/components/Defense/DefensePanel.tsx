/**
 * 城防面板组件 (DefensePanel)
 * 城池防御设施管理
 *
 * 功能：
 * - 查看城防设施列表和状态
 * - 建造新的城防建筑
 * - 升级已有城防建筑
 * - 查看城墙等级和总防御力
 * - 驻守武将管理
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getDefenseInfo,
  getDefenseCount,
  getDefensePosHero,
  setHeroDefence,
  buildDefense,
  upgradeDefense,
} from '../../services/gameApi';
import { toast } from '../common/Toast';

// ============ 类型定义 ============

interface DefenseBuilding {
  id: number;
  position: number;
  state: number;
  defence_level: number;
  static_index: number;
  durability: number;
  name: string;
  icon: string;
  attack: number;
  hitpoint: number;
}

interface DefenseInfo {
  wallLevel: number;
  trapCount: number;
  defenses: DefenseBuilding[];
  totalDefense: number;
  cityId: number;
}

interface DefensePosHero {
  id: number;
  name: string;
  level: number;
  atk: number;
  def: number;
  hp: number;
  position: number;
  state: number;
}

interface DefensePanelProps {
  cityId?: number;
}

// 城防建筑配置（静态数据，对应 XmlData.DefenceBuilding）
const DEFENSE_CONFIGS: Record<number, { name: string; icon: string; desc: string; maxLevel: number }> = {
  1: { name: '箭塔', icon: '🏹', desc: '远程攻击建筑', maxLevel: 10 },
  2: { name: '滚木', icon: '🪵', desc: '近战压制建筑', maxLevel: 10 },
  3: { name: '礌石', icon: '🪨', desc: '范围伤害建筑', maxLevel: 10 },
  4: { name: '陷阱', icon: '⚡', desc: '一次性防御建筑', maxLevel: 10 },
  5: { name: '拒马', icon: '🔱', desc: '阻挡敌军前进', maxLevel: 10 },
};

export const DefensePanel: React.FC<DefensePanelProps> = ({ cityId = 1 }) => {
  // 状态
  const [defenseInfo, setDefenseInfo] = useState<DefenseInfo | null>(null);
  const [defenseCount, setDefenseCount] = useState<number>(0);
  const [defendingHeroes, setDefendingHeroes] = useState<DefensePosHero[]>([]);
  const [activeTab, setActiveTab] = useState<'buildings' | 'heroes'>('buildings');

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [isLoadingHeroes, setIsLoadingHeroes] = useState(false);

  // 操作状态
  const [isBuilding, setIsBuilding] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<number | null>(null);
  const [isSettingHero, setIsSettingHero] = useState(false);

  // 消息提示
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 建造选择
  const [selectedBuildType, setSelectedBuildType] = useState<number>(1);
  const [showBuildModal, setShowBuildModal] = useState(false);

  // 武将驻守位置选择
  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(null);
  const [showHeroModal, setShowHeroModal] = useState(false);

  // 加载城防信息
  const loadDefenseInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDefenseInfo(cityId);
      if (result.success && result.data) {
        setDefenseInfo(result.data);
      }
    } catch (err) {
      console.error('Failed to load defense info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cityId]);

  // 加载城防数量
  const loadDefenseCount = useCallback(async () => {
    setIsLoadingCount(true);
    try {
      const result = await getDefenseCount(cityId);
      if (result.success && typeof result.data === 'number') {
        setDefenseCount(result.data);
      } else if (result.success && result.data?.count !== undefined) {
        setDefenseCount(result.data.count);
      }
    } catch (err) {
      console.error('Failed to load defense count:', err);
    } finally {
      setIsLoadingCount(false);
    }
  }, [cityId]);

  // 加载驻守武将
  const loadDefendingHeroes = useCallback(async () => {
    setIsLoadingHeroes(true);
    try {
      const result = await getDefensePosHero(cityId);
      if (result.success && result.data?.heroes) {
        setDefendingHeroes(result.data.heroes);
      }
    } catch (err) {
      console.error('Failed to load defending heroes:', err);
    } finally {
      setIsLoadingHeroes(false);
    }
  }, [cityId]);

  // 初始加载
  useEffect(() => {
    loadDefenseInfo();
    loadDefenseCount();
    loadDefendingHeroes();
  }, [loadDefenseInfo, loadDefenseCount, loadDefendingHeroes]);

  // 建造城防
  const handleBuild = async () => {
    setIsBuilding(true);
    setMessage(null);
    try {
      const result = await buildDefense(selectedBuildType, 0, cityId);
      if (result.success) {
        toast.success('城防建造成功！');
        setMessage({ type: 'success', text: '城防建造成功！' });
        setShowBuildModal(false);
        await Promise.all([loadDefenseInfo(), loadDefenseCount()]);
      } else {
        toast.error(result.error || '建造失败');
        setMessage({ type: 'error', text: result.error || '建造失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '建造失败');
      setMessage({ type: 'error', text: err.message || '建造失败' });
    } finally {
      setIsBuilding(false);
    }
  };

  // 升级城防
  const handleUpgrade = async (defId: number) => {
    setIsUpgrading(defId);
    setMessage(null);
    try {
      const result = await upgradeDefense(defId);
      if (result.success) {
        toast.success('城防升级成功！');
        setMessage({ type: 'success', text: '城防升级成功！' });
        await loadDefenseInfo();
      } else {
        toast.error(result.error || '升级失败');
        setMessage({ type: 'error', text: result.error || '升级失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '升级失败');
      setMessage({ type: 'error', text: err.message || '升级失败' });
    } finally {
      setIsUpgrading(null);
    }
  };

  // 设置武将驻防
  const handleSetHeroDefence = async (heroId: number, position: number) => {
    setIsSettingHero(true);
    setMessage(null);
    try {
      const result = await setHeroDefence(heroId, position, cityId);
      if (result.success) {
        toast.success(position > 0 ? '驻防成功！' : '离防成功！');
        setMessage({ type: 'success', text: position > 0 ? '驻防成功！' : '离防成功！' });
        setShowHeroModal(false);
        setSelectedHeroId(null);
        await Promise.all([loadDefendingHeroes()]);
      } else {
        toast.error(result.error || '操作失败');
        setMessage({ type: 'error', text: result.error || '操作失败' });
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
      setMessage({ type: 'error', text: err.message || '操作失败' });
    } finally {
      setIsSettingHero(false);
    }
  };

  // 格式化时间
  const formatDurability = (durability: number) => {
    if (durability >= 100) return '#22c55e';
    if (durability >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="dashboard-card" style={{ padding: '12px', minHeight: '100%' }}>
      {/* 标题 */}
      <div className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span>🛡️ 城防中心</span>
        <button
          className="gufeng-btn"
          style={{ fontSize: '12px', padding: '4px 10px' }}
          onClick={() => {
            Promise.all([loadDefenseInfo(), loadDefenseCount(), loadDefendingHeroes()]);
            setMessage({ type: 'success', text: '已刷新' });
          }}
        >
          🔄 刷新
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '10px',
            borderRadius: '6px',
            fontSize: '12px',
            background: message.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* 城防概览 */}
      <div className="defense-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
        <div className="dashboard-card" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>城墙等级</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
            Lv.{isLoading ? '..' : (defenseInfo?.wallLevel ?? 1)}
          </div>
        </div>
        <div className="dashboard-card" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>城防数量</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
            {isLoadingCount ? '..' : defenseCount}
          </div>
        </div>
        <div className="dashboard-card" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>总防御力</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a855f7' }}>
            {isLoading ? '..' : (defenseInfo?.totalDefense ?? 0)}
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="defense-panel-tabs" style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        <button
          className={`building-action ${activeTab === 'buildings' ? 'active' : ''}`}
          style={{
            flex: 1,
            fontSize: '12px',
            padding: '8px',
            background: activeTab === 'buildings' ? 'var(--primary-color, #3b82f6)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'buildings' ? '#fff' : '#9ca3af',
          }}
          onClick={() => setActiveTab('buildings')}
        >
          🏰 城防建筑
        </button>
        <button
          className={`building-action ${activeTab === 'heroes' ? 'active' : ''}`}
          style={{
            flex: 1,
            fontSize: '12px',
            padding: '8px',
            background: activeTab === 'heroes' ? 'var(--primary-color, #3b82f6)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'heroes' ? '#fff' : '#9ca3af',
          }}
          onClick={() => setActiveTab('heroes')}
        >
          ⚔️ 驻守武将
        </button>
      </div>

      {/* 城防建筑列表 */}
      {activeTab === 'buildings' && (
        <>
          {/* 建造按钮 */}
          <button
            className="building-action gufeng-btn"
            style={{ width: '100%', marginBottom: '10px', fontSize: '12px', minHeight: '36px' }}
            onClick={() => setShowBuildModal(true)}
          >
            ➕ 建造城防
          </button>

          {/* 建筑列表 */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '12px' }}>
              加载中...
            </div>
          ) : defenseInfo?.defenses && defenseInfo.defenses.length > 0 ? (
            <div className="defense-building-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {defenseInfo.defenses.map((def) => {
                const config = DEFENSE_CONFIGS[def.static_index] || { name: '未知建筑', icon: '❓', desc: '', maxLevel: 10 };
                return (
                  <div
                    key={def.id}
                    className="dashboard-card defense-building-card"
                    style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    {/* 图标 */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                      }}
                    >
                      {config.icon}
                    </div>

                    {/* 信息 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{config.name}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'rgba(59,130,246,0.3)',
                            color: '#3b82f6',
                          }}
                        >
                          Lv.{def.defence_level}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
                        攻击: {def.attack} | 生命: {def.hitpoint}
                      </div>
                      {/* 耐久度条 */}
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${def.durability}%`,
                            height: '100%',
                            background: formatDurability(def.durability),
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    </div>

                    {/* 升级按钮 */}
                    <button
                      className="building-action gufeng-btn"
                      style={{
                        fontSize: '11px',
                        padding: '6px 10px',
                        minWidth: '50px',
                        minHeight: '36px',
                        background: def.defence_level < config.maxLevel ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                        color: def.defence_level < config.maxLevel ? '#a855f7' : '#6b7280',
                        border: def.defence_level < config.maxLevel ? '1px solid #a855f7' : '1px solid transparent',
                      }}
                      disabled={isUpgrading === def.id || def.defence_level >= config.maxLevel}
                      onClick={() => handleUpgrade(def.id)}
                    >
                      {isUpgrading === def.id ? '升级中..' : def.defence_level >= config.maxLevel ? '满级' : '⬆️ 升级'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="dashboard-card"
              style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏚️</div>
              <div>暂无城防建筑</div>
              <div style={{ fontSize: '11px', marginTop: '4px', color: '#4b5563' }}>
                点击上方「建造城防」开始布置防御
              </div>
            </div>
          )}
        </>
      )}

      {/* 驻守武将列表 */}
      {activeTab === 'heroes' && (
        <>
          {isLoadingHeroes ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '12px' }}>
              加载中...
            </div>
          ) : defendingHeroes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {defendingHeroes.map((hero) => (
                <div
                  key={hero.id}
                  className="dashboard-card defense-hero-card"
                  style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {hero.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{hero.name}</span>
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>Lv.{hero.level}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      攻:{hero.atk} 防:{hero.def} 生命:{hero.hp}
                    </div>
                    <div style={{ fontSize: '10px', color: '#22c55e', marginTop: '2px' }}>
                      📍 驻守位置: {hero.position > 0 ? hero.position : '未驻防'}
                    </div>
                  </div>
                  <button
                    className="building-action gufeng-btn"
                    style={{ fontSize: '11px', padding: '6px 10px', minHeight: '36px' }}
                    onClick={() => {
                      setSelectedHeroId(hero.id);
                      setShowHeroModal(true);
                    }}
                  >
                    {hero.position > 0 ? '📤 离防' : '⚔️ 驻防'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="dashboard-card"
              style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
              <div>暂无驻守武将</div>
              <div style={{ fontSize: '11px', marginTop: '4px', color: '#4b5563' }}>
                在校场将武将设置为城防状态即可驻守
              </div>
            </div>
          )}
        </>
      )}

      {/* 建造弹窗 */}
      {showBuildModal && (
        <div
          className="defense-modal-overlay modal-overlay"
          onClick={() => setShowBuildModal(false)}
        >
          <div
            className="defense-modal modal-container"
            style={{ maxWidth: '400px', width: '100%', padding: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-card-title" style={{ marginBottom: '12px' }}>
              🏗️ 建造城防
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {Object.entries(DEFENSE_CONFIGS).map(([type, config]) => (
                <button
                  key={type}
                  className="building-action"
                  style={{
                    padding: '10px',
                    background: selectedBuildType === Number(type) ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                    border: selectedBuildType === Number(type) ? '1px solid #3b82f6' : '1px solid transparent',
                    borderRadius: '8px',
                    textAlign: 'center',
                    minHeight: '60px',
                  }}
                  onClick={() => setSelectedBuildType(Number(type))}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{config.icon}</div>
                  <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{config.name}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{config.desc}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="building-action"
                style={{
                  flex: 1,
                  fontSize: '12px',
                  padding: '10px',
                  minHeight: '36px',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#9ca3af',
                }}
                onClick={() => setShowBuildModal(false)}
              >
                取消
              </button>
              <button
                className="building-action gufeng-btn"
                style={{
                  flex: 1,
                  fontSize: '12px',
                  padding: '10px',
                  minHeight: '36px',
                  opacity: isBuilding ? 0.7 : 1,
                }}
                disabled={isBuilding}
                onClick={handleBuild}
              >
                {isBuilding ? '建造中..' : '✅ 确认建造'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 武将驻防弹窗 */}
      {showHeroModal && selectedHeroId && (
        <div
          className="defense-modal-overlay modal-overlay"
          onClick={() => setShowHeroModal(false)}
        >
          <div
            className="defense-modal modal-container"
            style={{ maxWidth: '400px', width: '100%', padding: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-card-title" style={{ marginBottom: '12px' }}>
              ⚔️ 设置驻防
            </div>

            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
              选择驻守位置（1-100），或选择离防
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {defendingHeroes.find(h => h.id === selectedHeroId)?.position && (
                <>
                  {[1, 2, 3, 4, 5].map((pos) => (
                    <button
                      key={pos}
                      className="building-action"
                      style={{
                        fontSize: '12px',
                        padding: '8px 12px',
                        minHeight: '36px',
                        background: 'rgba(255,255,255,0.05)',
                      }}
                      onClick={() => handleSetHeroDefence(selectedHeroId, pos)}
                      disabled={isSettingHero}
                    >
                      📍 位置 {pos}
                    </button>
                  ))}
                </>
              )}
            </div>

            <button
              className="building-action"
              style={{
                width: '100%',
                fontSize: '12px',
                padding: '10px',
                minHeight: '36px',
                background: 'rgba(239,68,68,0.2)',
                color: '#ef4444',
                border: '1px solid #ef4444',
                marginBottom: '8px',
              }}
              disabled={isSettingHero}
              onClick={() => handleSetHeroDefence(selectedHeroId, -1)}
            >
              📤 离防（退出驻守）
            </button>

            <button
              className="building-action"
              style={{
                width: '100%',
                fontSize: '12px',
                padding: '10px',
                minHeight: '36px',
                background: 'rgba(255,255,255,0.05)',
                color: '#9ca3af',
              }}
              onClick={() => setShowHeroModal(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 480px) {
          .defense-panel-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
