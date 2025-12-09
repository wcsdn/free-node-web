/**
 * 性能监控工具
 */

import { env } from '@/config/env';

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * 标记开始时间
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * 测量耗时
   */
  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    
    if (env.features.enableDebug) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * 监控组件渲染
   */
  logRender(componentName: string): void {
    if (env.features.enableDebug) {
      console.log(`[Render] ${componentName} rendered at ${new Date().toISOString()}`);
    }
  }

  /**
   * 获取 Web Vitals
   */
  getWebVitals(): void {
    if (typeof window === 'undefined') return;

    // FCP - First Contentful Paint
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcp) {
      console.log(`[Web Vitals] FCP: ${fcp.startTime.toFixed(2)}ms`);
    }

    // LCP - Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log(`[Web Vitals] LCP: ${lastEntry.startTime.toFixed(2)}ms`);
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    // FID - First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log(`[Web Vitals] FID: ${entry.processingStart - entry.startTime}ms`);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  }
}

export const perfMonitor = new PerformanceMonitor();

// 自动记录 Web Vitals（仅开发环境）
if (env.isDev) {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        perfMonitor.getWebVitals();
      }, 0);
    });
  }
}
