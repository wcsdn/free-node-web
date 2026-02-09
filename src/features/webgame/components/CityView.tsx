/**
 * CityView - 主城界面
 * 原则：移动端优先，响应式设计
 */
import React, { useEffect } from 'react';
import { ResourceBar, GameCard, GameButton } from '@/shared/components/game';
import { useCity } from '../hooks/useCity';
import './panel-styles.css';

interface CityViewProps {
  walletAddress: string;
  cityId?: number;
}

export const CityView: React.FC<CityViewProps> = ({ 
  walletAddress, 
  cityId 
}) => {
  const { city, buildings, loading, error, collect } = useCity(cityId);

  useEffect(() => {
    // 数据由 useCity hook 自动加载
  }, [walletAddress, cityId]);

  const getBuildingIcon = (configId: number): string => {
    const icons: Record<number, string> = {
      1: '🏛️', 2: '🏠', 3: '💰', 4: '🌾', 5: '⚔️',
    };
    return icons[configId] || '🏗️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-slate-500">LOADING...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <GameButton onClick={() => window.location.reload()}>
            重试
          </GameButton>
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">暂无城市</p>
          <GameButton>创建城市</GameButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-400 tracking-wider uppercase">
          CITY VIEW
        </h1>
      </div>

      {/* 资源栏 */}
      <ResourceBar
        resources={[
          { type: 'money', value: city.money },
          { type: 'food', value: city.food },
          { type: 'population', value: city.population },
        ]}
        onCollect={collect}
        showCollect
      />

      {/* 城市信息 */}
      <GameCard title={city.name} className="mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">城市ID:</span>
            <span className="text-slate-300">{city.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">繁荣度:</span>
            <span className="text-emerald-400">{city.prosperity || 0}</span>
          </div>
        </div>
      </GameCard>

      {/* 建筑列表 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-emerald-400">建筑列表</h2>
          <span className="text-sm text-slate-500">{buildings.length} 个建筑</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {buildings.map((building) => (
            <div
              key={building.id}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 transition-all text-center"
            >
              <div className="text-3xl mb-2">{getBuildingIcon(building.configId)}</div>
              <div className="text-sm text-slate-300 truncate">
                Building {building.configId}
              </div>
              <div className="text-xs text-emerald-400 mt-1">Lv.{building.level}</div>
            </div>
          ))}
          {buildings.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
              暂无建筑
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CityView;
