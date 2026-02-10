/**
 * Hooks 统一导出
 * 便于外部使用
 */

// 定时器 Hooks
export {
  useInterval,
  useTimeout,
  useDebounce,
  useThrottle,
} from './useInterval';

// 弹窗管理 Hooks
export {
  usePopupManager,
  useQuickPopups,
  PopupProvider,
} from './usePopup';

// 城市 Hooks
export {
  useCity,
  useCities,
  type CityInfo,
  type BuildingInfo,
} from './useCity';

// 武将 Hooks
export {
  useHeroes,
  useHeroDetail,
  getHeroQualityColor,
  type HeroInfo,
} from './useHero';

// 战斗 Hooks
export {
  useBattle,
  useStageDetail,
  type StageInfo,
  type ArenaOpponent,
} from './useBattle';

// 现有 Hooks
export { useGameLogic } from './useGameLogic';
export { useMail } from './useMail';
export { useMall } from './useMall';
export { useMarket } from './useMarket';
export { useResources } from './useResources';
export { useTask } from './useTask';
