/**
 * 弹窗管理器
 * 统一的弹窗展示与控制中心
 */
import gufengStyles from '../styles/gufeng.module.css';

import React, { useState, useEffect } from 'react';

// 业务组件
import MilitaryPanel from './business/MilitaryPanel';
import BattlePanel from './business/BattlePanel';
import DungeonPanel from './business/DungeonPanel';
import DefensePanel from './business/DefensePanel';
import HelpPanel from './popups/HelpPanel';
import SigninPanel from './business/SigninPanel';
import DailyPanel from './business/DailyPanel';
import NotificationPanel from './popups/NotificationPanel';
import HeroPanel from './business/HeroPanel';
import ArenaPanel from './popups/ArenaPanel';
import MallPanel from './popups/MallPanel';
import MailPanel from './popups/MailPanel';
import RankPanel from './popups/RankPanel';
import MapPanel from './popups/MapPanel';

// 弹窗组件
import BuildingDetailPanel from './popups/BuildingDetailPanel';
import BuildingSelectPanel from './popups/BuildingSelectPanel';

import { getApiBase, getAuthHeaders } from '../utils/api';
import { cityApi } from '../services/api/cityApi';

// 全局弹窗状态
interface PopupState {
  id: string;
  title: string;
  content: React.ReactNode;
}

export const popupManager = {
  currentPopup: null as PopupState | null,
  listeners: [] as ((popup: PopupState | null) => void)[],

  subscribe(listener: (popup: PopupState | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  show(id: string, title: string, content: React.ReactNode) {
    this.currentPopup = { id, title, content };
    this.listeners.forEach(l => l(this.currentPopup));
  },

  hide() {
    this.currentPopup = null;
    this.listeners.forEach(l => l(null));
  }
};

// 建筑建造面板组件
const BuildingBuildPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [position, setPosition] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/game/building/list`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          setBuildings(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch buildings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuildings();
  }, []);

  const handleBuild = async () => {
    if (!selectedBuilding) {
      setMessage('请选择要建造的建筑');
      return;
    }
    setMessage('');
    try {
      const res = await fetch(`${getApiBase()}/api/game/building/build`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ configId: selectedBuilding.id, position, cityId: 1 })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('建造成功！');
        setTimeout(() => onClose(), 1000);
      } else {
        setMessage(data.message || '建造失败');
      }
    } catch (err) {
      setMessage('建造失败');
    }
  };

  if (loading) return <LoadingPanel message="加载中..." />;

  return (
    <div style={{ color: '#000', maxWidth: '500px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label>选择位置 (1-16): </label>
        <select 
          value={position} 
          onChange={(e) => setPosition(Number(e.target.value))}
          style={{ padding: '5px', minWidth: '100px' }}
        >
          {[...Array(16)].map((_, i) => (
            <option key={i + 1} value={i + 1}>位置 {i + 1}</option>
          ))}
        </select>
      </div>

      <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #ccc' }}>
        {buildings.map((b) => (
          <div 
            key={b.id}
            onClick={() => setSelectedBuilding(b)}
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
              background: selectedBuilding?.id === b.id ? '#e0f7fa' : '#f9f9f9'
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>{b.name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{b.desc}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>Lv.1-{b.maxLevel}</div>
          </div>
        ))}
      </div>

      {message && <p style={{ color: message.includes('成功') ? 'green' : 'red', margin: '10px 0' }}>{message}</p>}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
        <button 
          onClick={handleBuild}
          disabled={!selectedBuilding}
          style={{ 
            padding: '8px 25px', 
            background: selectedBuilding ? '#4CAF50' : '#ccc', 
            color: '#fff', border: 'none', cursor: selectedBuilding ? 'pointer' : 'not-allowed'
          }}
        >
          建造
        </button>
        <button 
          onClick={onClose}
          style={{ padding: '8px 25px', background: '#666', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          关闭
        </button>
      </div>
    </div>
  );
};

// 通用加载组件
const LoadingPanel: React.FC<{ message?: string }> = ({ message = '加载中...' }) => (
  <div style={{ color: '#000', textAlign: 'center', padding: '20px' }}>
    <p>{message}</p>
  </div>
);

// 消息列表组件
const MessageListPanel: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState<number | undefined>(undefined);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 邮件类型
  const mailTypes = [
    { id: undefined, name: '全部' },
    { id: 0, name: '新邮件' },
    { id: 1, name: '系统' },
    { id: 2, name: '战报' },
    { id: 3, name: '消息' },
    { id: 4, name: '交易' },
  ];

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setMessage(null);
      
      try {
        let url = `${getApiBase()}/api/mail/list`;
        if (currentType !== undefined) url += `?type=${currentType}`;
        
        const res = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        
        if (data.success) {
          setMessages(data.data || []);
        } else {
          setMessage(data.message || '加载失败');
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        // 使用模拟数据
        setMessages([
          { id: 1, MailType: 1, MailFrom: '系统', Title: '欢迎', Content: '欢迎来到剑侠情缘', ReadTag: 0, DateTime: new Date().toISOString() },
          { id: 2, MailType: 2, MailFrom: '系统', Title: '战报', Content: '战斗胜利', ReadTag: 1, DateTime: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [currentType]);

  const handleDelete = async (mailId: number) => {
    if (!confirm('确定要删除这封邮件吗？')) return;
    
    setDeleting(mailId);
    setMessage(null);
    
    try {
      const res = await fetch(`${getApiBase()}/api/mail/${mailId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => prev.filter(m => m.id !== mailId));
        setMessage('删除成功');
      } else {
        setMessage(data.message || '删除失败');
      }
    } catch (err) {
      console.error('Failed to delete mail:', err);
      setMessage('删除失败');
    } finally {
      setDeleting(null);
    }
  };

  // 获取邮件类型名称
  const getMailTypeName = (type: number) => {
    const names: Record<number, string> = { 0: '新邮件', 1: '系统', 2: '战报', 3: '消息', 4: '交易' };
    return names[type] || '未知';
  };

  if (loading) return <LoadingPanel message="加载中..." />;

  return (
    <div style={{ color: '#000', maxHeight: '400px', overflow: 'auto' }}>
      {/* 邮件类型筛选 */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {mailTypes.map((type) => (
          <button
            key={type.id ?? 99}
            onClick={() => setCurrentType(type.id)}
            style={{
              padding: '4px 12px',
              background: currentType === type.id ? '#4CAF50' : '#f0f0f0',
              color: currentType === type.id ? '#fff' : '#333',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* 消息提示 */}
      {message && (
        <div style={{ 
          padding: '8px', 
          marginBottom: '10px',
          borderRadius: '4px',
          background: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          fontSize: '12px'
        }}>
          {message}
        </div>
      )}

      {messages.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>暂无消息</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {messages.map((msg: any) => (
            <li key={msg.id} style={{ 
              padding: '10px', 
              borderBottom: '1px solid #eee',
              background: msg.ReadTag === 0 ? '#fff' : '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    {msg.ReadTag === 0 && (
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: '#f44336' 
                      }}></span>
                    )}
                    <span style={{ 
                      color: msg.MailType === 1 ? '#9D080D' : '#35c235',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}>
                      [{getMailTypeName(msg.MailType)}]
                    </span>
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      {msg.MailFrom}
                    </span>
                  </div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {msg.Title || '无标题'}
                  </div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>
                    {msg.Content || msg.content || ''}
                  </div>
                  <div style={{ color: '#999', fontSize: '10px' }}>
                    {msg.DateTime || msg.created_at || new Date().toLocaleString()}
                    {msg.HasAttachment === 1 && (
                      <span style={{ marginLeft: '10px', color: '#f39c12' }}>📎 有附件</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(msg.id)}
                  disabled={deleting === msg.id}
                  style={{ 
                    padding: '4px 10px',
                    background: deleting === msg.id ? '#ccc' : '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: deleting === msg.id ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    marginLeft: '10px'
                  }}
                >
                  {deleting === msg.id ? '删除中...' : '删除'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// 任务列表组件
const TaskListPanel: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/task/list`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          setTasks(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleClaim = async (taskId: number) => {
    setClaiming(taskId);
    try {
      const res = await fetch(`${getApiBase()}/api/task/claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ taskId })
      });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, claimed: true } : t));
      }
    } catch (err) {
      console.error('Failed to claim task:', err);
    } finally {
      setClaiming(null);
    }
  };

  if (loading) return <LoadingPanel message="加载任务中..." />;

  return (
    <div style={{ color: '#000', maxHeight: '400px', overflow: 'auto' }}>
      {tasks.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>暂无任务</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {tasks.map((task: any) => (
            <li key={task.id} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{task.Name || task.name || '任务'}</div>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>
                    {task.Desc || task.desc || '任务描述'}
                  </div>
                  <div style={{ color: '#999', fontSize: '10px', marginTop: '3px' }}>
                    进度: {task.progress || 0}/{task.target || 100}
                  </div>
                </div>
                <div>
                  {task.claimed ? (
                    <span style={{ color: '#999', fontSize: '12px' }}>已领取</span>
                  ) : task.Status === 1 || task.completed ? (
                    <button 
                      onClick={() => handleClaim(task.id)}
                      disabled={claiming === task.id}
                      style={{ 
                        padding: '5px 15px',
                        background: claiming === task.id ? '#ccc' : '#4CAF50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: claiming === task.id ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {claiming === task.id ? '领取中...' : '领取奖励'}
                    </button>
                  ) : (
                    <span style={{ color: '#666', fontSize: '12px' }}>进行中</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// 市场面板组件
const MarketPanel: React.FC = () => {
  const [amount, setAmount] = useState(100);
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState('');

  const resources = [
    { id: 'food', name: '粮食', icon: '/jx/Web/img/4/3.gif' },
    { id: 'money', name: '银两', icon: '/jx/Web/img/4/2.gif' },
    { id: 'population', name: '人口', icon: '/jx/Web/img/4/1.gif' },
  ];

  const handleTrade = async (resourceId: string) => {
    if (amount <= 0) {
      setMessage('请输入有效数量');
      return;
    }
    setLoading(resourceId);
    setMessage('');
    try {
      const res = await fetch(`${getApiBase()}/api/market/trade`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ resourceType: resourceId, amount, action })
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'buy') {
          setMessage(`成功买入 ${amount} ${(Array.isArray(resources) ? resources : []).find(r => r.id === resourceId)?.name}！消耗 ${data.data.cost} 银两`);
        } else {
          setMessage(`成功卖出 ${amount} ${(Array.isArray(resources) ? resources : []).find(r => r.id === resourceId)?.name}！获得 ${data.data.earned} 银两`);
        }
      } else {
        setMessage(data.message || '交易失败');
      }
    } catch (err) {
      setMessage('交易失败');
    } finally {
      setLoading('');
    }
  };

  return (
    <div style={{ color: '#000' }}>
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={() => setAction('buy')}
          style={{ 
            padding: '5px 20px', 
            background: action === 'buy' ? '#4CAF50' : '#ccc',
            color: '#fff', border: 'none', marginRight: '10px', cursor: 'pointer'
          }}
        >
          买入
        </button>
        <button 
          onClick={() => setAction('sell')}
          style={{ 
            padding: '5px 20px', 
            background: action === 'sell' ? '#f44336' : '#ccc',
            color: '#fff', border: 'none', cursor: 'pointer'
          }}
        >
          卖出
        </button>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>数量: </label>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
          style={{ width: '100px', padding: '5px' }}
        />
      </div>

      {resources.map((res) => (
        <div 
          key={res.id}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '12px',
            borderBottom: '1px solid #eee',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: '#f9f9f9'
          }}
          onClick={() => loading ? null : handleTrade(res.id)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={res.icon} alt={res.name} width="20" height="20" />
            <span>{res.name}</span>
          </span>
          <span style={{ color: '#666' }}>
            {loading === res.id ? '交易中...' : (action === 'buy' ? '买入' : '卖出')}
          </span>
        </div>
      ))}
      
      {message && <p style={{ color: message.includes('成功') ? 'green' : 'red', marginTop: '10px', textAlign: 'center' }}>{message}</p>}
    </div>
  );
};


// 内政页面组件
const PoliticsPanel: React.FC = () => {
  const [heroes, setHeroes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [heroRes, itemRes] = await Promise.all([
          fetch(`${getApiBase()}/api/game/hero/list`, {
            method: 'POST',
            headers: getAuthHeaders(),
          }),
          fetch(`${getApiBase()}/api/item/list`, {
            method: 'POST',
            headers: getAuthHeaders(),
          }),
        ]);
        const heroData = await heroRes.json();
        const itemData = await itemRes.json();
        if (heroData.success) setHeroes(heroData.data || []);
        if (itemData.success) setItems(itemData.data || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingPanel message="加载中..." />;

  return (
    <div style={{ color: '#000' }}>
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => popupManager.show('build', '【建造建筑】', <BuildingBuildPanel onClose={() => popupManager.hide()} />)}
          style={{ 
            padding: '8px 20px', 
            background: '#4CAF50', 
            color: '#fff', 
            border: 'none', 
            cursor: 'pointer',
            borderRadius: '3px'
          }}
        >
          🏗️ 建造建筑
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>我的武将</h4>
        {heroes.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center' }}>暂无武将</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {heroes.map((hero: any) => (
              <div key={hero.id} style={{ 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                background: '#f9f9f9',
                minWidth: '100px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 'bold' }}>{hero.name || '武将'}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Lv.{hero.level || 1}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>战力: {hero.power || 0}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>背包物品</h4>
        {items.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center' }}>暂无物品</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {items.map((item: any) => (
              <div key={item.id} style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                background: '#f9f9f9'
              }}>
                <span>{item.name || '物品'}</span>
                <span style={{ color: '#999', fontSize: '12px', marginLeft: '5px' }}>x{item.count || 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 军事页面组件 - 使用真实实现
const MilitaryPanelWrapper: React.FC = () => {
  return <MilitaryPanel walletAddress="" onClose={() => popupManager.hide()} />;
};

// 其他页面组件
const OtherPanel: React.FC = () => {
  return (
    <div style={{ color: '#000', textAlign: 'center', padding: '20px' }}>
      <p style={{ fontSize: '48px', marginBottom: '10px' }}>📋</p>
      <p style={{ fontSize: '18px', marginBottom: '10px' }}>更多功能</p>
      <p style={{ color: '#666' }}>设置、系统、活动</p>
      <p style={{ color: '#999', fontSize: '12px', marginTop: '20px' }}>功能开发中...</p>
    </div>
  );
};

// 页面名称映射
export const PAGE_NAMES: Record<string, string> = {
  'p_1': '内政',
  'p_2': '军事',
  'p_3': '副本',
  'p_4': '城防',
  'p_5': '武将',
  'p_6': '军械',
  'p_7': '其他',
  'p_8': '消息',
  'p_9': '市场',
  'p_10': '任务',
  'p_11': '排行',
  'p_12': '竞技',
  'pp_2': '城防战',
  'pp_6': '攻城战',
  'map': '世界地图',
};

// 打开页面
export function openPage(pageId: string) {
  const pageName = PAGE_NAMES[pageId] || '未知页面';
  
  let content: React.ReactNode;
  
  switch (pageId) {
    case 'p_1': // 内政
    case 'politics':
      content = <PoliticsPanel />;
      break;
    case 'p_2': // 军事
    case 'military':
      content = <MilitaryPanelWrapper />;
      break;
    case 'p_3': // 副本
    case 'dungeon':
      content = <DungeonPanel cityId={1} onClose={() => popupManager.hide()} />;
      break;
    case 'p_4': // 城防
    case 'defense':
      content = <DefensePanel walletAddress="" cityId={1} cityMoney={3000} onClose={() => popupManager.hide()} />;
      break;
    case 'p_5': // 武将
    case 'battle':
    case 'hero':
      content = <HeroPanel cityId={1} onClose={() => popupManager.hide()} />;
      break;
    case 'p_6': // 军械
    case 'p_7': // 其他
    case 'other':
      content = <OtherPanel />;
      break;
    case 'p_8': // 消息
    case 'mail':
      content = <MessageListPanel />;
      break;
    case 'p_9': // 市场
    case 'market':
      content = <MarketPanel />;
      break;
    case 'p_10': // 任务
    case 'task':
      content = <TaskListPanel />;
      break;
    case 'p_11': // 排行
    case 'rank':
      content = <RankPanel onClose={() => popupManager.hide()} />;
      break;
    case 'p_12': // 竞技
    case 'arena':
      content = <ArenaPanel />;
      break;
    case 'pp_2': // 城防战
    case 'pp_6': // 攻城战
      content = <DefensePanel walletAddress="" cityId={1} cityMoney={3000} onClose={() => popupManager.hide()} />;
      break;
    case 'map': // 世界地图
      content = <MapPanel onClose={() => popupManager.hide()} />;
      break;
    default:
      content = (
        <div style={{ color: '#000', textAlign: 'center', padding: '20px' }}>
          <p style={{ fontSize: '48px', marginBottom: '10px' }}>🚧</p>
          <p>【{pageName}】</p>
          <p style={{ color: '#666', fontSize: '12px' }}>此功能正在开发中...</p>
        </div>
      );
  }
  
  popupManager.show(
    `page_${pageId}`,
    `【${pageName}】`,
    content
  );
}

// 打开建筑详情
// readonly: true - 只读模式（仅显示建筑信息，用于右侧树形菜单的"查看详情"）
//           false - 完整模式（显示操作按钮：升级/拆除）
export function openBuilding(
  building: { id?: number; Name: string; Level: number; Position: number; ConfigID?: number; State?: number; EffectValue?: number; CostMoney?: number; CostFood?: number; CostMen?: number }, 
  cityInfo?: any,
  onUpdate?: (updatedData: { building?: any; resources?: any }) => void,
  readonly: boolean = false
) {
  // 只读模式不执行任何操作
  if (readonly) {
    popupManager.show(
      `building_${building.Position}_readonly`,
      `【${building.Name}】Lv.${building.Level}`,
      <BuildingDetailPanel 
        building={building} 
        cityInfo={cityInfo}
        onClose={() => popupManager.hide()}
        mode="readonly"
      />
    );
    return;
  }

  const handleLevelUp = async () => {
    const buildingId =  building.id || building.Position;
    const res = await fetch(`${getApiBase()}/api/game/building/${buildingId}/upgrade`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || data.message || '升级失败');
    }
    
    // 通过回调更新状态
    if (onUpdate && data.data) {
      onUpdate({
        building: {
          ...building,
          Level: data.data.level
        },
        resources: {
          money: data.data.remainMoney,
          food: data.data.remainFood,
          population: data.data.remainMen
        }
      });
    }
    
    // 关闭弹窗
    popupManager.hide();
    return data.data;
  };

  const handleDemolish = async () => {
    const buildingId =  building.id || building.Position;
    const res = await fetch(`${getApiBase()}/api/game/building/${buildingId}/demolish`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || data.message || '拆除失败');
    }
    
    // 通过回调更新状态
    if (onUpdate) {
      onUpdate({ building: null }); // 建筑被拆除
    }
    
    // 关闭弹窗
    popupManager.hide();
    return data.data;
  };

  popupManager.show(
    `building_${building.Position}`,
    `【${building.Name}】Lv.${building.Level}`,
    <BuildingDetailPanel 
      building={building} 
      cityInfo={cityInfo}
      onClose={() => popupManager.hide()}
      onLevelUp={handleLevelUp}
      onDemolish={handleDemolish}
      mode="full"
    />
  );
}

// 打开建筑选择面板（空地建造）
export function openBuildingSelect(
  position: number,
  cityInfo?: any,
  onUpdate?: () => void
) {
  // 先获取可建造建筑列表
  cityApi.getAvailableBuildings(1, position).then((result) => {
    if (result.success && result.data.buildings.length > 0) {
      const handleBuild = async (buildingId: number) => {
        const buildResult = await cityApi.buildBuilding(1, buildingId, position);
        if (buildResult.success) {
          // 建造成功，刷新建筑列表
          if (onUpdate) {
            onUpdate();
          }
          popupManager.hide();
        } else {
          throw new Error(buildResult.error || '建造失败');
        }
      };

      popupManager.show(
        `building_select_${position}`,
        `【选择建筑】位置 ${position}`,
        <BuildingSelectPanel
          position={position}
          availableBuildings={result.data.buildings}
          cityInfo={cityInfo}
          onClose={() => popupManager.hide()}
          onBuild={handleBuild}
        />
      );
    } else {
      showMessage('该位置暂无可建造的建筑', 'warning');
    }
  }).catch((err) => {
    console.error('获取可建造建筑失败:', err);
    showMessage('获取可建造建筑失败', 'error');
  });
}

// 消息提示面板组件（替代alert）
const MessagePanel: React.FC<{ message: string; type?: 'info' | 'warning' | 'success' | 'error'; onClose: () => void }> = ({ 
  message, 
  type = 'info',
  onClose 
}) => {
  const bgColors = {
    info: '#d1ecf1',
    warning: '#fff3cd',
    success: '#d4edda',
    error: '#f8d7da'
  };
  const textColors = {
    info: '#0c5460',
    warning: '#856404',
    success: '#155724',
    error: '#721c24'
  };
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌'
  };

  return (
    <div style={{ 
      color: textColors[type], 
      textAlign: 'center', 
      padding: '20px',
      background: bgColors[type],
      borderRadius: '4px',
      border: `1px solid ${textColors[type]}`
    }}>
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>{icons[type]}</div>
      <div style={{ marginBottom: '15px' }}>{message}</div>
      <button 
        onClick={onClose}
        style={{ 
          padding: '6px 25px', 
          background: '#6c757d', 
          color: '#fff', 
          border: 'none', 
          cursor: 'pointer',
          borderRadius: '3px'
        }}
      >
        确定
      </button>
    </div>
  );
};

// 显示消息提示（替代alert）
export function showMessage(message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') {
  popupManager.show(
    'message_tip',
    '【提示】',
    <MessagePanel message={message} type={type} onClose={() => popupManager.hide()} />
  );
}

// 打开武将面板
export function openHero() {
  popupManager.show('hero', '【武将】', <HeroPanel cityId={1} onClose={() => popupManager.hide()} />);
}

// 打开商城面板
export function openMall() {
  popupManager.show('mall', '【商城】', <MallPanel />);
}

// 打开帮助面板
export function openHelp() {
  popupManager.show('help', '【帮助中心】', <HelpPanel onClose={() => popupManager.hide()} />);
}

// 打开签到面板
export function openSignin() {
  popupManager.show('signin', '【每日签到】', <SigninPanel onClose={() => popupManager.hide()} />);
}

// 打开每日任务面板
export function openDaily() {
  popupManager.show('daily', '【每日任务】', <DailyPanel onClose={() => popupManager.hide()} />);
}

// 打开消息面板
export function openNotification() {
  popupManager.show('notification', '【消息中心】', <NotificationPanel onClose={() => popupManager.hide()} />);
}

// 全局函数挂载
if (typeof window !== 'undefined') {
  (window as any).ShowPopup = popupManager.show.bind(popupManager);
  (window as any).HidePopup = popupManager.hide.bind(popupManager);
  (window as any).OpenPage = openPage;
  (window as any).OpenBuilding = openBuilding;
  (window as any).OpenBuildingSelect = openBuildingSelect;
  (window as any).OpenMall = openMall;
  (window as any).OpenHero = openHero;
  (window as any).OpenHelp = openHelp;
  (window as any).OpenSignin = openSignin;
  (window as any).OpenDaily = openDaily;
  (window as any).OpenNotification = openNotification;
  (window as any).ShowMessage = showMessage;
}

// 弹窗组件
const PopupManagerComponent: React.FC = () => {
  const [popup, setPopup] = React.useState<PopupState | null>(null);

  React.useEffect(() => {
    return popupManager.subscribe(setPopup);
  }, []);

  if (!popup) return null;

  return (
    <div 
      className="overlay show" 
      style={{ 
        display: 'block', 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          popupManager.hide();
        }
      }}
    >
      <div 
        className="popup show"
        style={{ 
          display: 'block', 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          minWidth: '400px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          background: '#E9E9E9',
          border: '1px solid #B0B0B0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ 
          padding: '10px', 
          borderBottom: '1px solid #B0B0B0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f0f0f0',
        }}>
          <span style={{ fontWeight: 'bold', color: '#000' }}>{popup.title}</span>
          <a 
            onClick={() => popupManager.hide()}
            style={{ 
              cursor: 'pointer', 
              fontSize: '24px',
              textDecoration: 'none',
              color: '#000',
              lineHeight: '1',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '3px',
            }}
          >
            &times;
          </a>
        </div>
        <div className="popupBody" style={{ padding: '15px', maxHeight: 'calc(90vh - 50px)', overflow: 'auto' }}>
          {popup.content}
        </div>
      </div>
    </div>
  );
};

export default PopupManagerComponent;
