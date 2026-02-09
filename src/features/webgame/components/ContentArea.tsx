/**
 * 主内容区域组件
 * 原则：移动端优先，简洁设计
 */
import React, { memo } from 'react';
import { GameCard } from '@/shared/components/game';

interface CityInteriorInfo {
  Area?: number;
  AreaRoom?: number;
  Child?: number;
  Bloom?: number;
  ChildRate?: number;
  Gold?: number;
  Money?: number;
  MoneyRoom?: number;
  Food?: number;
  FoodRoom?: number;
  Men?: number;
  MenRoom?: number;
  MoneySpeed?: number;
  FoodSpeed?: number;
  MenSpeed?: number;
  Level?: number;
  name?: string;
  map_image?: string;
  buildings?: BuildingData[];
}

interface BuildingData {
  id: number;
  config_id: number;
  level: number;
  position?: number;
  type?: string;
  state?: number;
}

const BUILDING_ICONS: Record<number, { icon: string; name: string; cssClass: string }> = {
  1: { icon: '/jx/Web/img/2/b/o/1.GIF', name: '聚义厅', cssClass: 'img_1_1' },
  2: { icon: '/jx/Web/img/2/b/o/2.GIF', name: '义舍', cssClass: 'img_1_2' },
  3: { icon: '/jx/Web/img/2/b/o/3.GIF', name: '农场', cssClass: 'img_1_3' },
  4: { icon: '/jx/Web/img/2/b/o/4.GIF', name: '钱庄', cssClass: 'img_1_4' },
  5: { icon: '/jx/Web/img/2/b/o/5.GIF', name: '民居', cssClass: 'img_1_5' },
  6: { icon: '/jx/Web/img/2/b/o/6.GIF', name: '仓库', cssClass: 'img_1_6' },
  7: { icon: '/jx/Web/img/2/b/o/7.GIF', name: '集市', cssClass: 'img_1_7' },
  8: { icon: '/jx/Web/img/2/b/o/8.GIF', name: '武馆', cssClass: 'img_1_8' },
  9: { icon: '/jx/Web/img/2/b/o/9.GIF', name: '校场', cssClass: 'img_1_9' },
  10: { icon: '/jx/Web/img/2/b/o/10.GIF', name: '城墙', cssClass: 'img_1_10' },
  11: { icon: '/jx/Web/img/2/b/o/11.GIF', name: '巡捕房', cssClass: 'img_1_11' },
  12: { icon: '/jx/Web/img/2/b/o/12.GIF', name: '太学', cssClass: 'img_1_12' },
  13: { icon: '/jx/Web/img/2/b/o/13.GIF', name: '客栈', cssClass: 'img_1_13' },
};

interface ContentAreaProps {
  serverInfo?: { Time?: string; O?: number; ExpPer?: number; TimePercent?: number };
  cityInteriorInfo?: CityInteriorInfo;
  notice?: string;
  walletAddress?: string;
}

const ContentArea: React.FC<ContentAreaProps> = memo(({ cityInteriorInfo }) => {
  const cityName = cityInteriorInfo?.name || '主城';
  const mapImage = cityInteriorInfo?.map_image || 'm1.JPG';
  const buildings = cityInteriorInfo?.buildings || [];

  return (
    <div id="contentarea" className="space-y-4 p-4">
      {/* 资源栏 */}
      <GameCard>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">面积:</span>
            <span className="text-slate-300">
              {cityInteriorInfo?.Area || 0}/<span className="text-slate-500">{cityInteriorInfo?.AreaRoom || 0}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">弟子:</span>
            <span className="text-slate-300">{cityInteriorInfo?.Child || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">💰</span>
            <span className="text-slate-300">
              {cityInteriorInfo?.Money || 0}/<span className="text-slate-500">{cityInteriorInfo?.MoneyRoom || 0}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">🌾</span>
            <span className="text-slate-300">
              {cityInteriorInfo?.Food || 0}/<span className="text-slate-500">{cityInteriorInfo?.FoodRoom || 0}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">👥</span>
            <span className="text-slate-300">
              {cityInteriorInfo?.Men || 0}/<span className="text-slate-500">{cityInteriorInfo?.MenRoom || 0}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">💎</span>
            <span className="text-amber-400 font-bold">{cityInteriorInfo?.Gold || 0}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">繁荣:</span>
            <span className="text-emerald-400">{cityInteriorInfo?.Bloom || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">维护:</span>
            <span className="text-slate-300">{cityInteriorInfo?.ChildRate || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">金币产:</span>
            <span className="text-amber-400">+{cityInteriorInfo?.MoneySpeed || 0}/h</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">粮食产:</span>
            <span className="text-emerald-400">+{cityInteriorInfo?.FoodSpeed || 0}/h</span>
          </div>
        </div>
      </GameCard>

      {/* 城池地图 */}
      <GameCard>
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-emerald-400">{cityName}</h2>
          <span className="text-sm text-slate-500">城市等级 {cityInteriorInfo?.Level || 1}</span>
        </div>
        <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden">
          <img 
            src={`/jx/Web/img/2/b/m/${mapImage}`} 
            alt={cityName}
            className="w-full h-full object-cover"
          />
        </div>
      </GameCard>

      {/* 建筑列表 */}
      <GameCard title="建筑列表">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {buildings.map((building: BuildingData) => {
            const configId = building.config_id || building.id;
            const iconConfig = BUILDING_ICONS[configId] || BUILDING_ICONS[1];
            return (
              <div
                key={building.id}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
              >
                <img 
                  src={iconConfig.icon} 
                  alt={iconConfig.name}
                  className="w-8 h-8 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-300 truncate">{iconConfig.name}</div>
                  <div className="text-xs text-emerald-400">Lv.{building.level}</div>
                </div>
              </div>
            );
          })}
          {buildings.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500">
              暂无建筑
            </div>
          )}
        </div>
      </GameCard>
    </div>
  );
});

ContentArea.displayName = 'ContentArea';

export default ContentArea;
