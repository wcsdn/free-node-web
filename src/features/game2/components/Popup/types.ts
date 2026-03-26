/**
 * Popup - 弹框系统类型定义
 * 
 * 注意：PopupType 枚举定义在 PopupType.ts 中（使用数字值，对应原有游戏逻辑）
 * 此文件定义扩展的字符串类型弹框
 */

/** 弹框类型 Key（字符串类型，用于新的统一弹框系统） */
export enum PopupKind {
  /** 确认对话框 */
  Confirm = 'confirm',
  /** 提示信息 */
  Alert = 'alert',
  /** 奖励领取 */
  Reward = 'reward',
  /** 道具详情 */
  ItemDetail = 'itemDetail',
  /** 英雄详情 */
  HeroDetail = 'heroDetail',
  /** 建筑信息 */
  BuildingInfo = 'buildingInfo',
  /** 战斗结果 */
  BattleResult = 'battleResult',
  /** 商店购买确认 */
  ShopConfirm = 'shopConfirm',
  /** 资源不足提示 */
  ResourceShortage = 'resourceShortage',
  /** 通用信息展示 */
  Info = 'info',
}

/** 弹框基础属性 */
export interface BasePopupProps {
  /** 弹框唯一标识 */
  id?: string;
  /** 弹框类型 */
  type: PopupKind;
  /** 传递给弹框的数据 */
  data?: any;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认回调 */
  onConfirm?: (data?: any) => void;
  /** 是否显示 */
  open?: boolean;
}

/** 确认弹框数据 */
export interface ConfirmPopupData {
  /** 标题 */
  title?: string;
  /** 消息内容 */
  message?: string | React.ReactNode;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认按钮类型 */
  confirmVariant?: 'primary' | 'danger' | 'success';
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 是否在确认后自动关闭 */
  autoClose?: boolean;
}

/** 奖励弹框数据 */
export interface RewardPopupData {
  /** 奖励类型 */
  rewardType?: 'gold' | 'food' | 'wood' | 'stone' | 'iron' | 'gem' | 'item' | 'hero';
  /** 奖励名称 */
  rewardName?: string;
  /** 奖励数量 */
  rewardAmount?: number;
  /** 奖励图片 */
  rewardIcon?: string;
  /** 描述文字 */
  description?: string;
  /** 弹框标题 */
  title?: string;
  /** 确认按钮文字 */
  confirmText?: string;
}

/** 道具详情数据 */
export interface ItemDetailPopupData {
  /** 道具ID */
  itemId: number;
  /** 道具名称 */
  name: string;
  /** 道具图标 */
  icon?: string;
  /** 道具品质 */
  quality?: 'white' | 'green' | 'blue' | 'purple' | 'orange';
  /** 道具描述 */
  description?: string;
  /** 道具数量 */
  count?: number;
  /** 道具属性 */
  attributes?: Array<{ key: string; value: string | number }>;
  /** 是否可出售 */
  canSell?: boolean;
  /** 出售价格 */
  sellPrice?: number;
  /** 是否可使用 */
  canUse?: boolean;
}

/** 英雄详情数据 */
export interface HeroDetailPopupData {
  /** 英雄ID */
  heroId: number;
  /** 英雄名称 */
  name: string;
  /** 英雄图标 */
  icon?: string;
  /** 英雄品质 */
  quality?: 'white' | 'green' | 'blue' | 'purple' | 'orange';
  /** 英雄等级 */
  level?: number;
  /** 英雄属性 */
  attributes?: {
    attack: number;
    defense: number;
    health: number;
    speed: number;
  };
  /** 技能列表 */
  skills?: Array<{ id: number; name: string; description: string }>;
  /** 是否在驻守 */
  isDefending?: boolean;
}

/** 战斗结果数据 */
export interface BattleResultPopupData {
  /** 是否胜利 */
  victory: boolean;
  /** 获得经验 */
  expGained?: number;
  /** 获得资源 */
  resourcesGained?: {
    gold?: number;
    food?: number;
    wood?: number;
    stone?: number;
    iron?: number;
  };
  /** 获得物品 */
  itemsGained?: Array<{ id: number; name: string; count: number }>;
  /** 战损报告 */
  casualties?: {
    troops: number;
    wounded: number;
  };
}

/** 弹框配置项 */
export interface PopupConfig {
  /** 弹框类型 */
  type: PopupKind;
  /** 弹框数据 */
  data?: any;
  /** 关闭回调 */
  onClose?: () => void;
  /** 确认回调 */
  onConfirm?: (data?: any) => void;
  /** 优先级，数字越大优先级越高 */
  priority?: number;
}

/** 弹框实例 */
export interface PopupInstance {
  /** 唯一标识 */
  id: string;
  /** 弹框配置 */
  config: PopupConfig;
}

/** PopupManager 实例接口 */
export interface PopupManagerInterface {
  /** 显示弹框 */
  show: (config: PopupConfig) => string;
  /** 关闭弹框 */
  close: (id?: string) => void;
  /** 关闭所有弹框 */
  closeAll: () => void;
  /** 获取当前显示的弹框 */
  getActivePopups: () => PopupInstance[];
  /** 更新弹框数据 */
  update: (id: string, data: any) => void;
}
