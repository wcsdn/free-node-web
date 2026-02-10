/**
 * 军事面板组件
 * 军队管理、兵种训练、武将委任、兵力调动
 */
import React, { useEffect, useState } from 'react';
import { gameApi } from '../services/gameApi';
import styles from '../styles/jxMain.module.css';


interface Troop {
  id: number;
  city_id: number;
  city_name: string;
  type: string;
  amount: number;
  attack: number;
  defense: number;
  hero_id?: number;
}

interface TroopType {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  cost: number;
  attack: number;
  defense: number;
  trainingTime: number;
  description: string;
}

interface Hero {
  id: number;
  name: string;
  level: number;
  attack: number;
  defense: number;
  state: number;
}

interface Assignment {
  id: number;
  city_id: number;
  city_name: string;
  type: string;
  amount: number;
  attack: number;
  defense: number;
  hero_id?: number;
  hero_name?: string;
  hero_level?: number;
  hero_attack?: number;
  hero_defense?: number;
}

interface City {
  id: number;
  name: string;
}

interface MilitaryPanelProps {
  walletAddress: string;
  onClose: () => void;
}

const TROOP_ICONS: Record<string, string> = {
  infantry: '🗡️',
  archer: '🏹',
  cavalry: '🐎',
  siege: '⚙️',
};

const MilitaryPanel: React.FC<MilitaryPanelProps> = ({ onClose }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [troopTypes, setTroopTypes] = useState<TroopType[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'train' | 'assign'>('list');
  const [message, setMessage] = useState('');

  const [trainCityId, setTrainCityId] = useState<number | ''>('');
  const [trainType, setTrainType] = useState('');
  const [trainAmount, setTrainAmount] = useState(10);
  const [training, setTraining] = useState(false);

  const [assignHeroId, setAssignHeroId] = useState<number | ''>('');
  const [assignCityId, setAssignCityId] = useState<number | ''>('');
  const [assignTroopId, setAssignTroopId] = useState<number | ''>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 
        ...(localStorage.getItem('wallet-auth') ? { 'X-Wallet-Auth': localStorage.getItem('wallet-auth')! } : {})
      };
      const [assignmentsRes, configRes, citiesRes, heroesRes] = await Promise.all([
        fetch(`${getApiBase()}/api/military/assignments`, { headers }).then(r => r.json()),
        fetch(`${getApiBase()}/api/military/config`, { headers }).then(r => r.json()),
        gameApi.getCityList(),
        gameApi.getHeroList(),
      ]);

      if (assignmentsRes.success) {
        setAssignments(assignmentsRes.data?.assignments || []);
        setCities(assignmentsRes.data?.cities || []);
      }
      if (configRes.success) {
        setTroopTypes(configRes.data?.troopTypes || []);
      }
      if (heroesRes.success) {
        setHeroes(heroesRes.data?.filter((h: Hero) => h.state === 0) || []);
      }

      if (cities.length > 0 && !trainCityId) {
        setTrainCityId(cities[0].id);
        setAssignCityId(cities[0].id);
      }
    } catch (err) {
      console.error('Failed to load military data:', err);
    }
    setLoading(false);
  };

  const getConfig = (type: string) => troopTypes.find(t => t.id === type);
  const getUpgradeCost = (type: string, level: number) => {
    const config = getConfig(type);
    if (!config) return 0;
    return Math.floor(config.cost * (level + 1) * 0.5);
  };

  const handleTrain = async () => {
    if (!trainCityId || !trainType || !trainAmount || trainAmount <= 0) {
      setMessage('请填写完整信息');
      return;
    }
    setTraining(true);
    setMessage('');
    try {
      const res = await gameApi.trainTroops(Number(trainCityId), trainType, trainAmount);
      if (res.success) {
        setMessage(`训练成功！消耗银两: ${res.data?.cost || 0}`);
        loadData();
      } else {
        setMessage(res.error || '训练失败');
      }
    } catch (err) {
      setMessage('训练失败');
    }
    setTraining(false);
  };

  const handleAssignHero = async () => {
    if (!assignHeroId || !assignTroopId) {
      setMessage('请选择武将要委任的军队');
      return;
    }
    setAssigning(true);
    setMessage('');
    try {
      const res = await fetch(`${getApiBase()}/api/military/assign-hero`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('wallet-auth') ? { 'X-Wallet-Auth': localStorage.getItem('wallet-auth')! } : {})
        },
        body: JSON.stringify({ 
          heroId: assignHeroId, 
          cityId: assignCityId, 
          troopType: assignments.find(a => a.id === assignTroopId)?.type 
        }),
      }).then(r => r.json());

      if (res.success) {
        setMessage(`委任成功！${res.data?.message || ''}`);
        loadData();
        setAssignHeroId('');
        setAssignTroopId('');
      } else {
        setMessage(res.error || '委任失败');
      }
    } catch (err) {
      setMessage('委任失败');
    }
    setAssigning(false);
  };

  const handleUnassignHero = async (troopId: number) => {
    if (!confirm('确定要解除该武将的委任吗？')) return;
    try {
      const res = await fetch(`${getApiBase()}/api/military/unassign-hero`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('wallet-auth') ? { 'X-Wallet-Auth': localStorage.getItem('wallet-auth')! } : {})
        },
        body: JSON.stringify({ troopId }),
      }).then(r => r.json());
      if (res.success) {
        setMessage('解除委任成功');
        loadData();
      } else {
        setMessage(res.error || '解除失败');
      }
    } catch (err) {
      setMessage('解除失败');
    }
  };

  const handleDisband = async (troopId: number, amount: number) => {
    if (!confirm(`确定要解散 ${amount} 单位军队吗？`)) return;
    try {
      const res = await gameApi.disbandTroops(troopId, amount);
      if (res.success) {
        setMessage(`解散成功！`);
        loadData();
      } else {
        setMessage(res.error || '解散失败');
      }
    } catch (err) {
      setMessage('解散失败');
    }
  };

  const getTroopAmount = (cityId: number, type: string) => {
    return assignments.filter(a => a.city_id === cityId && a.type === type).reduce((sum, a) => sum + a.amount, 0);
  };

  const assignmentsByCity = assignments.reduce((acc, a) => {
    if (!acc[a.city_id]) {
      acc[a.city_id] = { cityName: a.city_name, troops: [] };
    }
    acc[a.city_id].troops.push(a);
    return acc;
  }, {} as Record<number, { cityName: string; troops: Assignment[] }>);

  const getIdleHeroes = (cityId: number) => heroes.filter(h => h.state === 0);
  const getAssignableTroops = () => {
    if (!assignCityId) return [];
    return assignments.filter(a => a.city_id === assignCityId && !a.hero_id);
  };

  return (
    <div className={styles.popupPanel} style={{ width: '750px' }}>
      <div className={styles.popupHeader}>
        <span>🎖️ 军事系统</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
      <div className={styles.popupContent}>
        <div className={styles.militaryTabs}>
          <button className={`${styles.militaryTab} ${activeTab === 'list' ? styles.active : ''}`} onClick={() => setActiveTab('list')}>军队列表</button>
          <button className={`${styles.militaryTab} ${activeTab === 'train' ? styles.active : ''}`} onClick={() => setActiveTab('train')}>训练军队</button>
          <button className={`${styles.militaryTab} ${activeTab === 'assign' ? styles.active : ''}`} onClick={() => setActiveTab('assign')}>武将委任</button>
        </div>
        {message && <div className={styles.message}>{message}</div>}

        {activeTab === 'list' && (
          <div className={styles.troopList}>
            {loading ? <div className={styles.loading}>加载中...</div> : assignments.length === 0 ? (
              <div className={styles.empty}><p>暂无军队</p><p style={{ color: '#666', fontSize: '12px' }}>前往「训练军队」招募士兵</p></div>
            ) : Object.entries(assignmentsByCity).map(([cityId, { cityName, troops }]) => (
              <div key={cityId} className={styles.cityTroops}>
                <div className={styles.cityTroopsHeader}>🏰 {cityName}</div>
                {troops.map(troop => (
                  <div key={troop.id} className={styles.troopCard}>
                    <div className={styles.troopIcon}>{TROOP_ICONS[troop.type] || '⚔️'}</div>
                    <div className={styles.troopInfo}>
                      <div className={styles.troopName}>
                        {getConfig(troop.type)?.name || troop.type}<span className={styles.troopAmount}> ×{troop.amount}</span>
                      </div>
                      <div className={styles.troopStats}>攻击: {troop.attack} | 防御: {troop.defense}</div>
                      {troop.hero_name && <div className={styles.troopHero}>👑 {troop.hero_name} (Lv.{troop.hero_level}) 攻+{troop.hero_attack} 防+{troop.hero_defense}</div>}
                    </div>
                    <div className={styles.troopActions}>
                      {troop.hero_id ? (
                        <button className={styles.unassignBtn} onClick={() => handleUnassignHero(troop.id)}>解除</button>
                      ) : (
                        <button className={styles.disbandBtn} onClick={() => handleDisband(troop.id, troop.amount)}>解散</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'train' && (
          <div className={styles.trainSection}>
            <div className={styles.troopTypes}>
              <h4>可训练兵种</h4>
              <div className={styles.troopTypeGrid}>
                {troopTypes.map(type => (
                  <div key={type.id} className={`${styles.troopTypeCard} ${trainType === type.id ? styles.selected : ''}`} onClick={() => setTrainType(type.id)}>
                    <div className={styles.troopTypeIcon}>{type.icon}</div>
                    <div className={styles.troopTypeName}>{type.name}</div>
                    <div className={styles.troopTypeCost}>💰 {type.cost}银两</div>
                    <div className={styles.troopTypeStats}>⚔️{type.attack} 🛡️{type.defense}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.trainForm}>
              <h4>训练配置</h4>
              <div className={styles.formRow}>
                <label>选择城市:</label>
                <select value={trainCityId} onChange={(e) => setTrainCityId(Number(e.target.value) || '')} className={styles.formSelect}>
                  {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
              </div>
              <div className={styles.formRow}>
                <label>兵种:</label>
                <select value={trainType} onChange={(e) => setTrainType(e.target.value)} className={styles.formSelect}>
                  <option value="">请选择兵种</option>
                  {troopTypes.map(type => <option key={type.id} value={type.id}>{type.icon} {type.name}</option>)}
                </select>
              </div>
              <div className={styles.formRow}>
                <label>数量:</label>
                <input type="number" value={trainAmount} onChange={(e) => setTrainAmount(Math.max(1, Number(e.target.value)))} className={styles.formInput} min={1} />
                {trainType && <span className={styles.costHint}>消耗: {trainAmount * (getConfig(trainType)?.cost || 0)} 银两</span>}
              </div>
              <button className={styles.trainBtn} onClick={handleTrain} disabled={training || !trainType || !trainCityId}>{training ? '训练中...' : '开始训练'}</button>
            </div>
          </div>
        )}

        {activeTab === 'assign' && (
          <div className={styles.assignSection}>
            <div className={styles.assignHeroes}>
              <h4>空闲武将 ({getIdleHeroes(Number(assignCityId)).length})</h4>
              <div className={styles.heroSelectList}>
                {getIdleHeroes(Number(assignCityId)).map(hero => (
                  <div key={hero.id} className={`${styles.heroSelectItem} ${assignHeroId === hero.id ? styles.selected : ''}`} onClick={() => setAssignHeroId(hero.id)}>
                    <span>{hero.name}</span>
                    <span className={styles.heroStats}>Lv.{hero.level} ⚔️{hero.attack} 🛡️{hero.defense}</span>
                  </div>
                ))}
                {getIdleHeroes(Number(assignCityId)).length === 0 && <p className={styles.emptyHint}>该城市暂无空闲武将</p>}
              </div>
            </div>
            <div className={styles.assignForm}>
              <h4>委任配置</h4>
              <div className={styles.formRow}>
                <label>选择城市:</label>
                <select value={assignCityId} onChange={(e) => { setAssignCityId(Number(e.target.value) || ''); setAssignTroopId(''); }} className={styles.formSelect}>
                  {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
              </div>
              <div className={styles.formRow}>
                <label>选择军队:</label>
                <select value={assignTroopId} onChange={(e) => setAssignTroopId(Number(e.target.value) || '')} className={styles.formSelect}>
                  <option value="">请选择要委任的军队</option>
                  {getAssignableTroops().map(troop => (
                    <option key={troop.id} value={troop.id}>
                      {TROOP_ICONS[troop.type] || '⚔️'} {getConfig(troop.type)?.name} ×{troop.amount}
                    </option>
                  ))}
                </select>
              </div>
              <button className={styles.assignBtn} onClick={handleAssignHero} disabled={assigning || !assignHeroId || !assignTroopId}>{assigning ? '委任中...' : '确认委任'}</button>
            </div>
            <div className={styles.currentAssignments}>
              <h4>当前委任</h4>
              <div className={styles.assignmentList}>
                {assignments.filter(a => a.hero_id).map(assignment => (
                  <div key={assignment.id} className={styles.assignmentItem}>
                    <span>{assignment.hero_name} → {TROOP_ICONS[assignment.type]}{assignment.type}</span>
                    <button className={styles.unassignBtn} onClick={() => handleUnassignHero(assignment.id)}>解除</button>
                  </div>
                ))}
                {assignments.filter(a => a.hero_id).length === 0 && <p className={styles.emptyHint}>暂无委任记录</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MilitaryPanel;
