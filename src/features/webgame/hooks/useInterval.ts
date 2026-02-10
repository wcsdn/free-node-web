/**
 * 定时器 Hook
 * 安全且可控制的定时器实现
 */
import { useCallback, useEffect, useRef } from 'react';

/**
 * 设置定时器的回调函数类型
 */
type IntervalCallback = () => void;

/**
 * useInterval - 安全的 setInterval Hook
 * 
 * @param callback - 定时执行的回调函数
 * @param delay - 定时间隔（毫秒），为 null 时暂停
 * 
 * @example
 * // 每秒更新
 * useInterval(() => setCount(c => c + 1), 1000);
 * 
 * // 暂停定时器
 * useInterval(callback, null);
 */
export function useInterval(callback: IntervalCallback, delay: number | null): void {
  const savedCallback = useRef<IntervalCallback | null>(null);

  // 保存最新的回调函数
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 设置定时器
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => {
      savedCallback.current?.();
    }, delay);

    // 清理定时器
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * useTimeout - 安全的 setTimeout Hook
 * 
 * @param callback - 超时后执行的回调函数
 * @param delay - 超时时间（毫秒）
 * 
 * @example
 * useTimeout(() => console.log('超时了'), 5000);
 */
export function useTimeout(callback: IntervalCallback, delay: number): void {
  const savedCallback = useRef<IntervalCallback | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => {
      savedCallback.current?.();
    }, delay);

    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * useDebounce - 防抖 Hook
 * 
 * @param value - 需要防抖的值
 * @param delay - 延迟时间（毫秒）
 * 
 * @example
 * const debouncedValue = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useThrottle - 节流 Hook
 * 
 * @param callback - 需要节流的回调函数
 * @param limit - 节流时间间隔（毫秒）
 * 
 * @example
 * const throttledFunction = useThrottle(() => {
 *   console.log('每秒最多执行一次');
 * }, 1000);
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const lastRan = useRef<number>(Date.now());

  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRan.current >= limit) {
      callback(...args);
      lastRan.current = Date.now();
    }
  }, [callback, limit]) as T;
}

// 导入 useState
import { useState } from 'react';
