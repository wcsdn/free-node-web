/**
 * 建筑面板组件
 */
import React, { useEffect, useState } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import { gameApi } from '../../services/gameApi';
import { BuildingInfo } from '../../services/api/cityApi';
import styles from '../../styles/jxMain.module.css';

interface BuildingConfig {
  name: string;
  type: number;
  maxLevel: number;
  desc?: string;
  levelInfo?: {
    effectValue: number;
    costMoney: number;
    costFood: number;
    costPeople: number;
    costTime: number;
  };
}

type Building = BuildingInfo & { config?: BuildingConfig };


interface BuildingPanelProps {
  cityId: number;
  onClose: () => void;
}

const BUILDING_CONFIGS = [
  { id: 1, name: '聚义厅', type: 1, maxLevel: 10, desc: '主建筑,决定其他建筑等级上限' },
  { id: 2, name: '民心设施', type: 1, maxLevel: 10, desc: '提升城市繁荣度' },
  { id: 3, name: '钱庄', type: 1, maxLevel: 10, desc: '产出铜钱' },
  { id: 4, name: '农场', type: 1, maxLevel: 10, desc: '产出粮食' },
  { id: 5, name: '民居', type: 1, maxLevel: 10, desc: '增加人口上限' },
  { id: 6, name: '箭塔', type: 2, maxLevel: 10, desc: '防御建筑' },
  { id: 7, name: '城墙', type: 2, maxLevel: 10, desc: '防御建筑' },
];

const BuildingPanel: React.FC<BuildingPanelProps> = ({ cityId, onClose }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showBuildModal, setShowBuildModal] = useState(false);

  useEffect(() => {
    loadBuildings();
  }, [cityId]);

  const loadBuildings = async () => {
    setLoading(true);
    try {
      const res = await gameApi.getBuildingList(cityId);
      if (res.success) {
        setBuildings(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load buildings:', err);
    }
    setLoading(false);
  };

  const handleBuild = async (configId: number, position: number) => {
    setMessage('');
    try {
      const res = await gameApi.buildBuilding(cityId, configId, position);
      if (res.success) {
        setMessage('建造成功!');
        setShowBuildModal(false);
        loadBuildings();
      } else {
        setMessage(res.error || '建造失败');
      }
    } catch (err) {
      setMessage('建造失败');
    }
  };

  const handleUpgrade = async (building: Building) => {
    setMessage('');
    try {
      const res = await gameApi.upgradeBuilding(building.ID);
      if (res.success) {
        setMessage(`${building.config?.name} 升级到 ${res.data?.Level} 级!`);
        loadBuildings();
      } else {
        setMessage(res.error || '升级失败');
      }
    } catch (err) {
      setMessage('升级失败');
    }
  };

  // 获取可用位置 (1-10)
  const usedPositions = buildings.map(b => b.Position);
  const availablePositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(p => !usedPositions.includes(p));

  return (
    <div className={gufengStyles.popupPanel}>
      <div className={gufengStyles.popupHeader}>
        <span>建筑系统</span>
        <button className={gufengStyles.closeBtn} onClick={onClose}>×</button>
      </div>
      
      <div className={gufengStyles.popupContent}>
        {/* 消息 */}
        {message && <div className={gufengStyles.message}>{message}</div>}

        {/* 建造按钮 */}
        <div className={gufengStyles.buildAction}>
          <button 
            onClick={() => setShowBuildModal(true)}
            disabled={availablePositions.length === 0}
            className={gufengStyles.buildBtn}
          >
            建造建筑 ({availablePositions.length} 个空位)
          </button>
        </div>

        {/* 建筑列表 */}
        <div className={gufengStyles.buildingList}>
          <h4>已建造建筑</h4>
          {loading ? (
            <div className={gufengStyles.loading}>加载中...</div>
          ) : buildings.length === 0 ? (
            <div className={gufengStyles.empty}>暂无建筑</div>
          ) : (
            <div className={gufengStyles.buildingGrid}>
              {buildings.map(building => (
                <div 
                  key={building.ID}
                  className={`${gufengStyles.buildingCard} ${selectedBuilding?.ID === building.ID ? gufengStyles.selected : ''}`}
                  onClick={() => setSelectedBuilding(building)}
                >
                  <div className={gufengStyles.buildingName}>
                    {building.config?.name || `建筑${building.ConfigID}`}
                  </div>
                  <div className={gufengStyles.buildingLevel}>
                    等级: {building.Level}/{building.config?.maxLevel || 10}
                  </div>
                  <div className={gufengStyles.buildingEffect}>
                    效果: {building.config?.levelInfo?.effectValue || 0}
                  </div>
                  <div className={gufengStyles.buildingType}>
                    {building.config?.type === 1 ? '内政' : '防御'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 建筑详情 */}
        {selectedBuilding && selectedBuilding.config && (
          <div className={gufengStyles.buildingDetail}>
            <h4>{selectedBuilding.config.name} - 详情</h4>
            <div className={gufengStyles.buildingDetailInfo}>
              <div>当前等级: {selectedBuilding.Level}</div>
              <div>效果值: {selectedBuilding.config.levelInfo?.effectValue || 0}</div>
              <div>最大等级: {selectedBuilding.config.maxLevel}</div>
            </div>
            {selectedBuilding.Level < selectedBuilding.config.maxLevel && (
              <div className={gufengStyles.buildingUpgrade}>
                <div>升级需求:</div>
                <div>铜钱: {selectedBuilding.config.levelInfo?.costMoney || 0}</div>
                <div>粮食: {selectedBuilding.config.levelInfo?.costFood || 0}</div>
                <div>人口: {selectedBuilding.config.levelInfo?.costPeople || 0}</div>
                <button 
                  onClick={() => handleUpgrade(selectedBuilding)}
                  className={gufengStyles.upgradeBtn}
                >
                  升级
                </button>
              </div>
            )}
          </div>
        )}

        {/* 建造弹窗 */}
        {showBuildModal && (
          <div className={gufengStyles.modal}>
            <div className={gufengStyles.modalContent}>
              <h4>选择要建造的建筑</h4>
              <div className={gufengStyles.buildOptions}>
                {BUILDING_CONFIGS.map(config => (
                  <div key={config.id} className={gufengStyles.buildOption}>
                    <div className={gufengStyles.buildOptionName}>{config.name}</div>
                    <div className={gufengStyles.buildOptionDesc}>{config.desc}</div>
                    <div className={gufengStyles.buildOptionType}>
                      {config.type === 1 ? '内政' : '防御'} | 最高{config.maxLevel}级
                    </div>
                    <select 
                      className={gufengStyles.positionSelect}
                      onChange={(e) => {
                        const pos = parseInt(e.target.value);
                        if (pos > 0) {
                          handleBuild(config.id, pos);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">选择位置</option>
                      {availablePositions.map(pos => (
                        <option key={pos} value={pos}>位置 {pos}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowBuildModal(false)}
                className={gufengStyles.cancelBtn}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingPanel;
