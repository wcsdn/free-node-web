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

  // 地球样式（态势监控）
  globeStyle: 'realistic' | 'dark';
  setGlobeStyle: (style: 'realistic' | 'dark') => void;
  toggleGlobeStyle: () => void;

  // 字母雨开关
  matrixRainEnabled: boolean;
  toggleMatrixRain: () => void;
  setMatrixRainEnabled: (enabled: boolean) => void;

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

      // 地球样式
      globeStyle: 'dark',
      setGlobeStyle: (style) => {
        set({ globeStyle: style });
        // 触发自定义事件通知 Globe 组件
        window.dispatchEvent(new CustomEvent('settings-changed', { detail: { key: 'globe-style', value: style } }));
      },
      toggleGlobeStyle: () => set((state) => {
        const newStyle = state.globeStyle === 'dark' ? 'realistic' : 'dark';
        // 触发自定义事件通知 Globe 组件
        window.dispatchEvent(new CustomEvent('settings-changed', { detail: { key: 'globe-style', value: newStyle } }));
        return { globeStyle: newStyle };
      }),

      // 字母雨开关
      matrixRainEnabled: true,
      toggleMatrixRain: () => set((state) => ({ matrixRainEnabled: !state.matrixRainEnabled })),
      setMatrixRainEnabled: (enabled) => set({ matrixRainEnabled: enabled }),

      // 首页动画状态（不持久化）
      homeAnimationComplete: false,
      setHomeAnimationComplete: (complete) => set({ homeAnimationComplete: complete }),
    }),
    {
      name: 'app-storage',
    }
  )
);
