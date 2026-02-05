/**
 * 建筑详情面板组件
 */
import React, { useState } from 'react';

interface BuildingDetailPanelProps {
  building: any;
  cityInfo?: any;
  onClose: () => void;
  onLevelUp: () => void;
  onDemolish?: () => void;
}

const BuildingDetailPanel: React.FC<BuildingDetailPanelProps> = ({ 
  building, 
  cityInfo, 
  onClose, 
  onLevelUp, 
  onDemolish 
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<'levelup' | 'demolish' | null>(null);

  // 计算升级所需资源 - 从后端返回的数据中获取
  const getUpNeedResources = () => {
    if (!building) return { money: 0, food: 0, men: 0, maxLevel: 10 };
    
    // 优先使用后端返回的真实配置数据
    const money = building.upNeedMoney || building.UpNeedMoney || 0;
    const food = building.upNeedFood || building.UpNeedFood || 0;
    const men = building.upNeedMen || building.UpNeedMen || 0;
    const maxLevel = building.maxLevel || building.MaxLevel || 10;
    
    return { money, food, men, maxLevel };
  };

  const upNeed = getUpNeedResources();
  const configId = building.ConfigID || building.configId || 0;
  const buildingLevel = building.Level || building.level || 1;
  const effValue = building.effValue || building.EffValue || building.EffectValue || 0;
  const buildingName = building.Name || building.name || '未知建筑';
  
  // 主建筑（聚义厅）可以升级，但1级时不能拆除
  // 原逻辑：if(nodeObj.Index!=1 || (nodeObj.Index==1 && nodeObj.Level>1))
  const isMainHall = configId === 1;
  const canDemolish = !isMainHall || buildingLevel > 1;
  const isMaxLevel = buildingLevel >= upNeed.maxLevel;

  // 资源验证
  const currentMoney = cityInfo?.money || cityInfo?.Money || 0;
  const currentFood = cityInfo?.food || cityInfo?.Food || 0;
  const currentMen = cityInfo?.population || cityInfo?.Men || 0;
  
  const moneyEnough = currentMoney >= upNeed.money;
  const foodEnough = currentFood >= upNeed.food;
  const menEnough = currentMen >= upNeed.men;
  
  const canLevelUp = !isMaxLevel && moneyEnough && foodEnough && menEnough;

  const getLevelUpMessage = () => {
    if (isMaxLevel) return '已达到最高等级';
    
    const checks: string[] = [];
    if (!moneyEnough) checks.push(`银两不足 (${currentMoney}/${upNeed.money})`);
    if (!foodEnough) checks.push(`粮食不足 (${currentFood}/${upNeed.food})`);
    if (!menEnough) checks.push(`人口不足 (${currentMen}/${upNeed.men})`);
    
    return checks.length === 0 ? '✓ 资源充足，可以升级！' : `需要: ${checks.join(' | ')}`;
  };

  const handleAction = async () => {
    if (!action) return;
    
    if (action === 'levelup' && !canLevelUp) {
      setMessage('资源不足，无法升级');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      if (action === 'levelup') {
        await onLevelUp();
        setMessage('升级成功！');
      } else if (action === 'demolish' && onDemolish) {
        await onDemolish();
        setMessage('拆除成功！');
        setTimeout(() => onClose(), 1000);
      }
    } catch (err: any) {
      setMessage(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const levelUpMessage = getLevelUpMessage();

  return (
    <div style={{ color: '#000', minWidth: '320px' }}>
      {/* 基本信息 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px', borderBottom: '1px solid #ccc', width: '80px' }}>建筑名称</td>
            <td style={{ padding: '6px', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>{buildingName}</td>
          </tr>
          <tr>
            <td style={{ padding: '6px', borderBottom: '1px solid #ccc' }}>当前等级</td>
            <td style={{ padding: '6px', borderBottom: '1px solid #ccc' }}>
              Lv.{buildingLevel} / Lv.{upNeed.maxLevel}
              {isMaxLevel && <span style={{ color: '#f39c12', marginLeft: '8px' }}>★满级</span>}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px', borderBottom: '1px solid #ccc' }}>效果值</td>
            <td style={{ padding: '6px', borderBottom: '1px solid #ccc' }}>{effValue}</td>
          </tr>
        </tbody>
      </table>

      {/* 升级所需资源 */}
      {!isMaxLevel && (
        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '4px', padding: '10px', marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', color: '#e67e22', marginBottom: '8px', fontSize: '13px' }}>
            ⬆️ 升级所需 (Lv.{buildingLevel} → Lv.{buildingLevel + 1})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            {/* 银两 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/jx/Web/img/4/1.gif" width="16" height="16" alt="银两" />
              <span style={{ flex: 1 }}>银两</span>
              <span style={{ color: moneyEnough ? '#28a745' : '#dc3545', fontWeight: moneyEnough ? 'normal' : 'bold' }}>
                {upNeed.money}
              </span>
              <span style={{ color: '#666', marginLeft: '8px' }}>({currentMoney})</span>
              {moneyEnough ? <span style={{ color: '#28a745' }}>✓</span> : <span style={{ color: '#dc3545' }}>✗</span>}
            </div>
            {/* 粮食 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/jx/Web/img/4/2.gif" width="16" height="16" alt="粮食" />
              <span style={{ flex: 1 }}>粮食</span>
              <span style={{ color: foodEnough ? '#28a745' : '#dc3545', fontWeight: foodEnough ? 'normal' : 'bold' }}>
                {upNeed.food}
              </span>
              <span style={{ color: '#666', marginLeft: '8px' }}>({currentFood})</span>
              {foodEnough ? <span style={{ color: '#28a745' }}>✓</span> : <span style={{ color: '#dc3545' }}>✗</span>}
            </div>
            {/* 人口 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/jx/Web/img/4/3.gif" width="16" height="16" alt="人口" />
              <span style={{ flex: 1 }}>人口</span>
              <span style={{ color: menEnough ? '#28a745' : '#dc3545', fontWeight: menEnough ? 'normal' : 'bold' }}>
                {upNeed.men}
              </span>
              <span style={{ color: '#666', marginLeft: '8px' }}>({currentMen})</span>
              {menEnough ? <span style={{ color: '#28a745' }}>✓</span> : <span style={{ color: '#dc3545' }}>✗</span>}
            </div>
          </div>
        </div>
      )}
      
      {/* 状态提示 */}
      <div style={{ 
        padding: '8px 12px', 
        borderRadius: '4px', 
        marginBottom: '10px',
        background: canLevelUp ? '#d4edda' : '#fff3cd',
        color: canLevelUp ? '#155724' : '#856404',
        fontSize: '12px',
        border: canLevelUp ? '1px solid #c3e6cb' : '1px solid #ffeeba'
      }}>
        {canLevelUp ? '✓ 资源充足' : levelUpMessage}
      </div>
      
      {message && <p style={{ color: message.includes('成功') ? 'green' : 'red', margin: '10px 0' }}>{message}</p>}
      
      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
        <button 
          onClick={() => { setAction('levelup'); handleAction(); }}
          disabled={loading || isMaxLevel || !canLevelUp}
          style={{ 
            padding: '8px 20px', 
            background: (loading || isMaxLevel || !canLevelUp) ? '#ccc' : '#4CAF50', 
            color: '#fff',
            border: 'none',
            cursor: (loading || isMaxLevel || !canLevelUp) ? 'not-allowed' : 'pointer',
            borderRadius: '3px'
          }}
          title={!canLevelUp && !isMaxLevel ? levelUpMessage : ''}
        >
          {loading && action === 'levelup' ? '升级中...' : isMaxLevel ? '已满级' : '升级'}
        </button>
        {canDemolish && (
          <button 
            onClick={() => { if (confirm('确定要拆除这个建筑吗？')) { setAction('demolish'); handleAction(); }}}
            disabled={loading}
            style={{ 
              padding: '8px 20px', 
              background: loading ? '#ccc' : '#f44336', 
              color: '#fff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: '3px'
            }}
          >
            {loading && action === 'demolish' ? '拆除中...' : '拆除'}
          </button>
        )}
        <button 
          onClick={onClose}
          style={{ 
            padding: '8px 20px', 
            background: '#6c757d', 
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '3px'
          }}
        >
          关闭
        </button>
      </div>
    </div>
  );
};

export default BuildingDetailPanel;
