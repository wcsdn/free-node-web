/**
 * 全局 API - 可在任何地方调用打开各种功能
 *
 * 使用示例:
 * import { openWallet } from '@/shared/utils/globalAPI';
 *
 * // 打开钱包连接
 * openWallet();
 */

// 模态框控制
let modalController: {
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
} | null = null;

// 注册控制器（由 ModalContext 调用）
export const registerModalController = (controller: typeof modalController) => {
  modalController = controller;
};

// 全局 API
export const openWallet = () => {
  if (!modalController) {
    console.error('Modal controller not initialized');
    return;
  }
  modalController.openModal('wallet');
};

export const closeAllModals = () => {
  if (!modalController) {
    console.error('Modal controller not initialized');
    return;
  }
  modalController.closeModal();
};

// 导出类型
export type ModalType = 'wallet' | null;
