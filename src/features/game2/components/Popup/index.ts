/**
 * Popup Components - 弹窗组件集合
 * 
 * 基于 PopUp.js 迁移的核心弹框组件
 */

// ============================================
// 弹窗类型枚举
// ============================================
export { PopupType } from './PopupType';
export type { PopupKind } from './types';

// ============================================
// P0 - 最常用组件
// ============================================
// 消息框
export { PopUpMessageBox } from './MessageBox';
export type { MessageBoxProps, default as MessageBox } from './MessageBox';

// 选择框（确认/取消）
export { 
  PopUpChoose, 
  PopUpChooseDemolish, 
  PopUpChooseHeroRecall, 
  PopUpChooseExit 
} from './Choose';
export type { ChooseDialogProps, ChooseHandleType, default as Choose } from './Choose';

// 物品操作（使用/购买/出售/分解）
export { PopUpAboutEquip } from './AboutEquip';
export type { AboutEquipProps, ItemInfo, EquipActionType, default as AboutEquip } from './AboutEquip';

// ============================================
// P1 - 常用组件
// ============================================
// 武将选择弹框
export { PopUpChoiceHero } from './ChoiceHero';
export type { ChoiceHeroProps, HeroInfo, default as ChoiceHero } from './ChoiceHero';

// 物品选择弹框
export { PopUpChoiceItem } from './ChoiceItem';
export type { ChoiceItemProps, ItemInfo as ChoiceItemInfo, default as ChoiceItem } from './ChoiceItem';

// 攻击/支援决策
export { PopUpAttackDecision } from './AttackDecision';
export type { AttackDecisionProps, AttackType, HeroInfo as AttackHeroInfo, SpeedType, default as AttackDecision } from './AttackDecision';

// 招募弟子
export { PopUpConscribeChild } from './ConscribeChild';
export type { ConscribeChildProps, HeroConscribeInfo, CityResourceInfo, default as ConscribeChild } from './ConscribeChild';

// ============================================
// 其他扩展组件
// ============================================
export { PopUpCancelEffect } from './CancelEffect';
export { PopUpChangeName } from './ChangeName';
export { PopUpExtendBox } from './ExtendBox';
export { PopUpGoldConsumer } from './GoldConsumer';
export { PopUpList } from './List';
export { PopUpLookAutoExp } from './LookAutoExp';
export { PopUpReadMessage } from './ReadMessage';
export { PopUpSendMessage } from './SendMessage';

// ============================================
// 基础组件
// ============================================
export { BaseModal, BaseButton, ConfirmModal, AlertModal } from './BaseModal';
export type { 
  BaseModalProps, 
  BaseButtonProps, 
  ConfirmModalProps, 
  AlertModalProps 
} from './BaseModal';

// ============================================
// 弹窗管理器
// ============================================
export {
  PopupProvider,
  usePopupManager,
  popupFactory,
  popup,
  setGlobalPopupManager,
  getGlobalPopupManager,
} from './PopupManager';
export type { PopupProviderProps } from './PopupManager';
export type { PopupConfig, PopupInstance, PopupManagerInterface } from './types';

// ============================================
// 类型导出
// ============================================
export type {
  BasePopupProps,
  ConfirmPopupData,
  RewardPopupData,
  ItemDetailPopupData,
  HeroDetailPopupData,
  BattleResultPopupData,
} from './types';
