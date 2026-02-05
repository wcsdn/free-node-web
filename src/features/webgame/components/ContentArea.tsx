/**
 * 主内容区域组件
 * 完全参照原版 Main.aspx contentarea 部分
 */
import React, { memo } from 'react';
import styles from '../styles/jxMain.module.css';

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

// 建筑图标配置（原版路径）
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
    <div id="contentarea" className={styles.contentArea}>
      {/* 导航栏 - 原版结构 */}
      <div id="mainnav" className={styles.mainNav}>
        <ul>
          <li id="nav_1"><a id="p_1" className="nav_a_1" href="#"></a></li>
          <li id="nav_2"><a id="p_2" className="nav_a_2" href="#"></a></li>
          <li id="nav_3"><a id="p_3" className="nav_a_3" href="#"></a></li>
          <li id="nav_4"><a id="p_4" className="nav_a_4" href="#"></a></li>
          <li id="nav_5"><a id="p_5" className="nav_a_5" href="#"></a></li>
          <li id="nav_6"><a id="p_6" className="nav_a_6" href="#"></a></li>
          <li id="nav_7"><a id="p_7" className="nav_a_7" href="#"></a></li>
        </ul>
      </div>

      {/* 资源栏 - 原版精确布局 */}
      <div id="userres" className={styles.cityInteriorInfo}>
        <table cellSpacing="0" cellPadding="0" style={{ width: '542px', height: '30px' }}>
          <tbody>
            <tr>
              <td style={{ width: '33px' }}>面积:</td>
              <td style={{ width: '60px' }}>
                <span id="area">{cityInteriorInfo?.Area || 0}</span>/<span id="areaRoom">{cityInteriorInfo?.AreaRoom || 0}</span>
              </td>
              <td style={{ width: '33px' }}>弟子:</td>
              <td style={{ width: '26px' }}><span id="child">{cityInteriorInfo?.Child || 0}</span></td>
              <td style={{ width: '33px' }}>
                <img alt="" src="/jx/Web/img/4/1.gif" width="17" height="16" />
              </td>
              <td style={{ width: '87px' }}>
                <span id="r_money">{cityInteriorInfo?.Money || 0}</span>/<span id="moneyRoom">{cityInteriorInfo?.MoneyRoom || 0}</span>
              </td>
              <td style={{ width: '33px' }}>
                <img alt="" src="/jx/Web/img/4/2.GIF" width="16" height="17" />
              </td>
              <td style={{ width: '87px' }}>
                <span id="r_food">{cityInteriorInfo?.Food || 0}</span>/<span id="foodRoom">{cityInteriorInfo?.FoodRoom || 0}</span>
              </td>
              <td style={{ width: '33px' }}>
                <img alt="" src="/jx/Web/img/4/3.GIF" width="17" height="15" />
              </td>
              <td style={{ width: '77px' }}>
                <span id="r_men">{cityInteriorInfo?.Men || 0}</span>/<span id="menRoom">{cityInteriorInfo?.MenRoom || 0}</span>
              </td>
              <td style={{ width: '23px' }}>
                <a href="#"><img alt="" src="/jx/Web/img/4/4.gif" width="21" height="14" /></a>
              </td>
              <td style={{ width: '34px' }}><span id="r_gold">{cityInteriorInfo?.Gold || 0}</span></td>
            </tr>
            <tr>
              <td>繁荣:</td>
              <td><span id="bloom">{cityInteriorInfo?.Bloom || 0}</span></td>
              <td>维护:</td>
              <td><span id="childRate">{cityInteriorInfo?.ChildRate || 0}</span></td>
              <td>产量:</td>
              <td><span id="moneySpeed">{cityInteriorInfo?.MoneySpeed || 0}</span>/小时</td>
              <td>产量:</td>
              <td><span id="foodSpeed">{cityInteriorInfo?.FoodSpeed || 0}</span>/小时</td>
              <td>产量:</td>
              <td><span id="menSpeed">{cityInteriorInfo?.MenSpeed || 0}</span>/小时</td>
              <td colSpan={2}>&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 城池地图 - 原版 #mainpic */}
      <div id="mainpic" className={styles.mainPic}>
        {/* 城池名称 */}
        <div className={styles.cityTitle}>{cityName}</div>
        
        {/* 城池图片 - 从服务器返回的 map_image 字段获取 */}
        <div className={styles.cityImageContainer}>
          <img 
            src={`/jx/Web/img/2/b/m/${mapImage}`} 
            alt={cityName} 
            className={styles.cityImg} 
          />
        </div>
        
        {/* 建筑图标 - 从服务器返回的 buildings 数组获取 */}
        {buildings.map((building: BuildingData) => {
          const configId = building.config_id || building.id;
          const iconConfig = BUILDING_ICONS[configId] || BUILDING_ICONS[1];
          
          return (
            <div
              key={building.id}
              className={`${styles.buildingIcon} ${iconConfig.cssClass}`}
              title={iconConfig.name}
            >
              <img 
                src={iconConfig.icon} 
                alt={iconConfig.name}
              />
            </div>
          );
        })}
        
        {/* 建筑列表面板 */}
        <div className={styles.buildingsPanel}>
          <div className={styles.buildingsTitle}>建筑列表</div>
          <ul className={styles.buildingsList}>
            {buildings.map((b: BuildingData) => {
              const configId = b.config_id || b.id;
              const iconConfig = BUILDING_ICONS[configId] || BUILDING_ICONS[1];
              return (
                <li key={b.id} className={styles.buildingItem}>
                  <img 
                    src={iconConfig.icon} 
                    alt="" 
                    style={{ width: '14px', height: '14px', marginRight: '4px', imageRendering: 'pixelated' }}
                  />
                  <span>{iconConfig.name}</span>
                  <span className={styles.buildingLevel}>Lv{b.level}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
});

ContentArea.displayName = 'ContentArea';

export default ContentArea;
