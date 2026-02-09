/**
 * BuildingPanel - 建筑面板
 * 原则：移动端优先，响应式设计
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';

interface Building {
  id: number;
  configId: number;
  name: string;
  type: string;
  level: number;
  position: number;
  state: number;
  upgradeTime?: number;
  maxLevel?: number;
}

interface BuildingPanelProps {
  walletAddress: string;
  cityId?: number;
}

// 建筑图标映射
const BUILDING_ICONS: Record<number, string> = {
  1: '🏛️', // 聚义厅
  2: '🏠', // 民居
  3: '💰', // 银库
  4: '🌾', // 粮仓
  5: '⚔️', // 校场
  101: '🧱', // 城墙
  102: '🏹', // 箭塔
};

// 建筑类型名称
const TYPE_NAMES: Record<string, string> = {
  interior: '内政',
  defense: '防御',
};

export const BuildingPanel: React.FC<BuildingPanelProps> = ({ walletAddress, cityId = 1 }) => {
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 加载建筑数据
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const res = await fetch(`http://localhost:8788/api/game/city/building-list/${cityId}`, {
          method: 'POST',
          headers: { 'X-Wallet-Auth': walletAddress || '' },
        });
        const data = await res.json();
        
        if (data.success && data.data) {
          setBuildings(data.data);
        }
      } catch (err) {
        console.error('Failed to load buildings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadBuildings();
  }, [walletAddress, cityId]);

  // 点击建筑
  const handleBuildingClick = (building: Building) => {
    setSelectedBuilding(building);
    setShowUpgradeModal(true);
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-emerald-400 font-mono text-lg animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  // 统计数据
  const stats = {
    total: buildings.length,
    idle: buildings.filter(b => b.state === 0).length,
    totalLevel: buildings.reduce((sum, b) => sum + b.level, 0),
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-emerald-400 
                     tracking-wider uppercase">
        BUILDINGS
      </h1>

      {/* 建筑概览 */}
      <GameCard title="建筑概览" className="mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">{stats.total}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">总建筑</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">{stats.idle}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">空闲中</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">{stats.totalLevel}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">总等级</div>
          </div>
        </div>
      </GameCard>

      {/* 建筑列表标题 */}
      <div className="flex items-center gap-3 mb-4 text-emerald-400 font-mono text-base uppercase tracking-wider">
        <span>建筑列表</span>
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
      </div>

      {/* 建筑网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {buildings.map((building) => (
          <div
            key={building.id}
            className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 cursor-pointer
                     hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10
                     transition-all duration-200 active:scale-95"
            onClick={() => handleBuildingClick(building)}
          >
            {/* 头部 */}
            <div className="flex justify-between items-start mb-2">
              <span className="text-2xl">{BUILDING_ICONS[building.configId] || '🏗️'}</span>
              <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-700/50 rounded">
                {TYPE_NAMES[building.type] || building.type}
              </span>
            </div>

            {/* 名称 */}
            <div className="text-emerald-400 font-mono text-sm truncate mb-2">
              {building.name}
            </div>

            {/* 等级和状态 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                Lv.{building.level}
              </span>
              {building.state === 1 && (
                <span className="text-xs text-amber-400 animate-pulse">
                  建造中...
                </span>
              )}
            </div>

            {/* 位置 */}
            <div className="text-xs text-slate-500">
              位置: {building.position}
            </div>
          </div>
        ))}
      </div>

      {/* 升级弹窗 */}
      <GameModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={selectedBuilding?.name || '建筑升级'}
        size="small"
      >
        {selectedBuilding && (
          <div className="space-y-4">
            {/* 头部信息 */}
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
              <span className="text-4xl">{BUILDING_ICONS[selectedBuilding.configId] || '🏗️'}</span>
              <div>
                <h3 className="text-emerald-400 font-semibold">{selectedBuilding.name}</h3>
                <p className="text-slate-500 text-sm">当前等级: Lv.{selectedBuilding.level}</p>
              </div>
            </div>

            {/* 升级需求 */}
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <h4 className="text-slate-400 text-sm uppercase mb-3">升级需求</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">💰 银两</span>
                  <span className="text-emerald-400">{selectedBuilding.level * 500}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">🌾 粮草</span>
                  <span className="text-emerald-400">{selectedBuilding.level * 300}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">⏱️ 时间</span>
                  <span className="text-emerald-400">{selectedBuilding.level * 60}秒</span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <GameButton 
              fullWidth
              disabled={selectedBuilding.level >= (selectedBuilding.maxLevel || 10)}
              className={selectedBuilding.level >= (selectedBuilding.maxLevel || 10) ? 'opacity-50' : ''}
            >
              {selectedBuilding.level >= (selectedBuilding.maxLevel || 10) 
                ? '已满级' 
                : '开始升级'}
            </GameButton>
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default BuildingPanel;
