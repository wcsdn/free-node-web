/**
 * 应用全局状态管理
 * 使用 Zustand 替代 Context
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'zh';

interface AppState {
  // 语言设置
  language: Language;
  setLanguage: (lang: Language) => void;

  // 音效设置
  soundEnabled: boolean;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;

  // 环境音设置
  ambientEnabled: boolean;
  toggleAmbient: () => void;
  setAmbientEnabled: (enabled: boolean) => void;

  // 性能监控
  showPerformanceMonitor: boolean;
  togglePerformanceMonitor: () => void;
  setShowPerformanceMonitor: (show: boolean) => void;

  // 首页动画状态（不持久化，只在会话中保持）
  homeAnimationComplete: boolean;
  setHomeAnimationComplete: (complete: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 语言
      language: 'zh',
      setLanguage: (lang) => set({ language: lang }),

      // 音效
      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      // 环境音
      ambientEnabled: false,
      toggleAmbient: () => set((state) => ({ ambientEnabled: !state.ambientEnabled })),
      setAmbientEnabled: (enabled) => set({ ambientEnabled: enabled }),

      // 性能监控
      showPerformanceMonitor: false,
      togglePerformanceMonitor: () => set((state) => ({ showPerformanceMonitor: !state.showPerformanceMonitor })),
      setShowPerformanceMonitor: (show) => set({ showPerformanceMonitor: show }),
    }),
    {
      name: 'app-storage',
    }
  )
);
