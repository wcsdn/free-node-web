/**
 * WebGame 组件导出
 * 模块化目录结构:
 * - common/: 公共原子组件
 * - business/: 业务功能组件
 * - popups/: 弹窗组件
 */

// ==================== 核心组件 (Core) ====================
export { default as GameCanvas } from './GameCanvas';
export { default as GameControl } from './GameControl';
export { default as HeroList } from './HeroList';
export { default as JxWeb } from './JxWeb';
export { default as JxModules } from './JxModules';
export { default as LeftPanel } from './LeftPanel';
export { default as RightPanel } from './RightPanel';
export { default as ContentArea } from './ContentArea';
export { default as PopupManager } from './PopupManager';
export { default as JxPopup } from './Popup';

// ==================== 公共组件 (Common) ====================
export { default as BasicPopup } from './common/BasicPopup';
export { default as Tips } from './common/Tips';
export { default as Overlay } from './common/Overlay';

// ==================== 业务组件 (Business) ====================
export { default as BattlePanel } from './business/BattlePanel';
export { default as CityPanel } from './business/CityPanel';
export { default as CorpsPanel } from './business/CorpsPanel';
export { default as ItemPanel } from './business/ItemPanel';
export { default as GuildPanel } from './business/GuildPanel';
export { default as TechnicPanel } from './business/TechnicPanel';
export { default as DefencePanel } from './business/DefencePanel';
export { default as SkillLearnPanel } from './popups/SkillLearnPanel';
export { default as ChatPanel } from './business/ChatPanel';
export { default as TaskPanel } from './business/TaskPanel';
export { default as MailPanel } from './business/MailPanel';
export { default as RankingPanel } from './business/RankingPanel';
export { default as MarketPanel } from './business/MarketPanel';
export { default as MallPanel } from './business/MallPanel';
export { default as UnionPanel } from './business/UnionPanel';
export { default as ArenaPanel } from './business/ArenaPanel';
export { default as SkillPanel } from './business/SkillPanel';
export { default as BuildingPanel } from './business/BuildingPanel';

// ==================== 弹窗组件 (Popups) ====================
export { default as HelpPanel } from './popups/HelpPanel';
export { default as SigninPanel } from './business/SigninPanel';
export { default as DailyPanel } from './business/DailyPanel';
export { default as NotificationPanel } from './popups/NotificationPanel';
export { default as GiftPanel } from './popups/GiftPanel';
export { default as LoginPanel } from './popups/LoginPanel';
export { default as NewCharacterPanel } from './popups/NewCharacterPanel';
export { default as WaitingPanel } from './popups/WaitingPanel';
export { default as ErrorPanel } from './popups/ErrorPanel';
export { default as MessageListPanel } from './popups/MessageListPanel';
export { default as TaskListPanel } from './popups/TaskListPanel';

// ==================== 弹窗子组件 (Popup Parts) ====================
export { default as BuildingSelectPanel } from './popups/BuildingSelectPanel';
export { default as BuildingDetailPanel } from './popups/BuildingDetailPanel';
export { default as DefensePanel } from './business/DefensePanel';
export { default as DungeonPanel } from './business/DungeonPanel';
export { default as MilitaryPanel } from './business/MilitaryPanel';
export { default as ShopPanel } from './business/ShopPanel';
