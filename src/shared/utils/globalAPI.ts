/**
 * 全局 API - 可在任何地方调用打开各种功能
 * 
 * 使用示例:
 * import { openGhostMail, openProfile, openWallet } from '@/shared/utils/globalAPI';
 * 
 * // 打开幽灵信箱
 * openGhostMail();
 * 
 * // 打开个人档案
 * openProfile();
 * 
 * // 打开钱包连接
 * openWallet();
 * 
 * // 打开指定邮件
 * openMailDetail(123);
 */

// 模态框控制
let modalController: {
  openModal: (modal: 'ghost-mail' | 'profile' | 'wallet' | 'news') => void;
  closeModal: () => void;
} | null = null;

// 路由控制
let routerController: {
  setParam: (key: string, value: string) => void;
  clearParam: (key: string) => void;
  getParam: (key: string) => string | null;
} | null = null;

// 注册控制器（由 Context 调用）
export const registerModalController = (controller: typeof modalController) => {
  modalController = controller;
};

export const registerRouterController = (controller: typeof routerController) => {
  routerController = controller;
};

// 全局 API
export const openGhostMail = () => {
  if (!modalController) {
    console.error('Modal controller not initialized');
    return;
  }
  modalController.openModal('ghost-mail');
};

export const openProfile = () => {
  if (!modalController) {
    console.error('Modal controller not initialized');
    return;
  }
  modalController.openModal('profile');
};

export const openWallet = () => {
  if (!modalController) {
    console.error('Modal controller not initialized');
    return;
  }
  modalController.openModal('wallet');
};

export const openNews = () => {
  if (!modalController) {
    console.error('Modal controller not initialized');
    return;
  }
  modalController.openModal('news');
};

export const closeAllModals = () => {
  if (!modalController) {
    console.error('Modal controller not initialized');
    return;
  }
  modalController.closeModal();
};

// 路由 API
export const openMailDetail = (mailId: number) => {
  if (!routerController) {
    console.error('Router controller not initialized');
    return;
  }
  routerController.setParam('mail', mailId.toString());
};

export const closeMailDetail = () => {
  if (!routerController) {
    console.error('Router controller not initialized');
    return;
  }
  routerController.clearParam('mail');
};

export const getRouteParam = (key: string): string | null => {
  if (!routerController) {
    console.error('Router controller not initialized');
    return null;
  }
  return routerController.getParam(key);
};

export const setRouteParam = (key: string, value: string) => {
  if (!routerController) {
    console.error('Router controller not initialized');
    return;
  }
  routerController.setParam(key, value);
};

// 导出类型
export type ModalType = 'ghost-mail' | 'profile' | 'wallet' | 'news';
