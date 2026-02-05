/**
 * 建筑选择面板 - 点击空地时显示可建造的建筑列表
 */
import React, { useState } from 'react';

interface BuildingOption {
  id: number;
  name: string;
  icon: string;
  level: number;
  costMoney: number;
  costFood: number;
  costMen: number;
  description: string;
  canBuild?: boolean;
  requirementText?: string;
}

interface BuildingSelectPanelProps {
  position: number;
  availableBuildings: BuildingOption[];
  cityInfo?: any;
  onClose: () => void;
  onBuild: (buildingId: number) => void;
}

const BuildingSelectPanel: React.FC<BuildingSelectPanelProps> = ({
  position,
  availableBuildings,
  cityInfo,
  onClose,
  onBuild
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const currentMoney = cityInfo?.money || cityInfo?.Money || 0;
  const currentFood = cityInfo?.food || cityInfo?.Food || 0;
  const currentMen = cityInfo?.population || cityInfo?.Men || 0;

  // 如果只有一个建筑，自动选中
  React.useEffect(() => {
    if (availableBuildings.length === 1 && !selectedBuilding) {
      setSelectedBuilding(availableBuildings[0]);
    }
  }, [availableBuildings, selectedBuilding]);

  const handleBuild = async () => {
    if (!selectedBuilding) {
      setMessage('请先选择要建造的建筑');
      return;
    }

    // 检查前置条件
    if (selectedBuilding.canBuild === false) {
      setMessage(selectedBuilding.requirementText || '不满足建造条件');
      return;
    }

    const moneyEnough = currentMoney >= selectedBuilding.costMoney;
    const foodEnough = currentFood >= selectedBuilding.costFood;
    const menEnough = currentMen >= selectedBuilding.costMen;

    if (!moneyEnough || !foodEnough || !menEnough) {
      setMessage('资源不足，无法建造');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await onBuild(selectedBuilding.id);
      setMessage('建造成功！');
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setMessage(err.message || '建造失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: '#000', minWidth: '400px', maxHeight: '600px', overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#e67e22' }}>选择建筑 - 位置 {position}</h3>

      {/* 建筑列表 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
        {availableBuildings.map((building) => {
          const moneyEnough = currentMoney >= building.costMoney;
          const foodEnough = currentFood >= building.costFood;
          const menEnough = currentMen >= building.costMen;
          const resourceEnough = moneyEnough && foodEnough && menEnough;
          const canBuild = building.canBuild !== false && resourceEnough;
          const isSelected = selectedBuilding?.id === building.id;

          return (
            <div
              key={building.id}
              onClick={() => setSelectedBuilding(building)}
              style={{
                border: isSelected ? '2px solid #4CAF50' : '1px solid #ddd',
                borderRadius: '4px',
                padding: '10px',
                cursor: 'pointer',
                background: isSelected ? '#e8f5e9' : '#fff',
                opacity: canBuild ? 1 : 0.6
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <img 
                  src={`/jx/Web/img/${building.icon}`} 
                  alt={building.name} 
                  style={{ width: '32px', height: '32px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/jx/Web/img/2/b/o/1.gif';
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{building.name}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Lv.{building.level}</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                {building.description}
              </div>
              {building.canBuild === false && building.requirementText && (
                <div style={{ fontSize: '11px', color: '#dc3545', marginBottom: '6px', fontWeight: 'bold' }}>
                  ⚠️ {building.requirementText}
                </div>
              )}
              <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ color: moneyEnough ? '#28a745' : '#dc3545' }}>
                  💰 {building.costMoney}
                </div>
                <div style={{ color: foodEnough ? '#28a745' : '#dc3545' }}>
                  🌾 {building.costFood}
                </div>
                <div style={{ color: menEnough ? '#28a745' : '#dc3545' }}>
                  👥 {building.costMen}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 选中建筑的详细信息 */}
      {selectedBuilding && (
        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '4px', padding: '12px', marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#e67e22' }}>
            {selectedBuilding.name} - 建造所需
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/jx/Web/img/4/1.gif" width="16" height="16" alt="银两" />
              <span style={{ flex: 1 }}>银两</span>
              <span style={{ color: currentMoney >= selectedBuilding.costMoney ? '#28a745' : '#dc3545' }}>
                {selectedBuilding.costMoney}
              </span>
              <span style={{ color: '#666' }}>({currentMoney})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/jx/Web/img/4/2.gif" width="16" height="16" alt="粮食" />
              <span style={{ flex: 1 }}>粮食</span>
              <span style={{ color: currentFood >= selectedBuilding.costFood ? '#28a745' : '#dc3545' }}>
                {selectedBuilding.costFood}
              </span>
              <span style={{ color: '#666' }}>({currentFood})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/jx/Web/img/4/3.gif" width="16" height="16" alt="人口" />
              <span style={{ flex: 1 }}>人口</span>
              <span style={{ color: currentMen >= selectedBuilding.costMen ? '#28a745' : '#dc3545' }}>
                {selectedBuilding.costMen}
              </span>
              <span style={{ color: '#666' }}>({currentMen})</span>
            </div>
          </div>
        </div>
      )}

      {message && (
        <p style={{ color: message.includes('成功') ? 'green' : 'red', margin: '10px 0', textAlign: 'center' }}>
          {message}
        </p>
      )}

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={handleBuild}
          disabled={loading || !selectedBuilding}
          style={{
            padding: '8px 20px',
            background: (loading || !selectedBuilding) ? '#ccc' : '#4CAF50',
            color: '#fff',
            border: 'none',
            cursor: (loading || !selectedBuilding) ? 'not-allowed' : 'pointer',
            borderRadius: '3px'
          }}
        >
          {loading ? '建造中...' : '建造'}
        </button>
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
          取消
        </button>
      </div>
    </div>
  );
};

export default BuildingSelectPanel;
