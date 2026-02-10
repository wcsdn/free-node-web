/**
 * useInterval Hook 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInterval, useTimeout, useDebounce } from '../hooks/useInterval';
import React, { useState, useEffect } from 'react';

// Mock timer
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useInterval', () => {
  it('应该在延迟后调用回调函数', () => {
    const callback = vi.fn();
    
    const { unmount } = renderHook(() => 
      useInterval(callback, 1000)
    );
    
    expect(callback).not.toHaveBeenCalled();
    
    // 快进 1 秒
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(callback).toHaveBeenCalledTimes(1);
    
    unmount();
  });

  it('当 delay 为 null 时应该暂停', () => {
    const callback = vi.fn();
    
    const { rerender, unmount } = renderHook(({ delay }) => 
      useInterval(callback, delay)
    , { initialProps: { delay: 1000 } });
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(callback).toHaveBeenCalledTimes(1);
    
    // 设置 delay 为 null
    rerender({ delay: null });
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // 回调不应该再次调用
    expect(callback).toHaveBeenCalledTimes(1);
    
    unmount();
  });

  it('应该使用最新的回调函数', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    
    const { rerender, unmount } = renderHook(({ callback }) => 
      useInterval(callback, 1000)
    , { initialProps: { callback: callback1 } });
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();
    
    // 更新回调函数
    rerender({ callback: callback2 });
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    
    unmount();
  });
});

describe('useTimeout', () => {
  it('应该在延迟后调用回调函数', () => {
    const callback = vi.fn();
    
    const { unmount } = renderHook(() => 
      useTimeout(callback, 1000)
    );
    
    expect(callback).not.toHaveBeenCalled();
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(callback).toHaveBeenCalledTimes(1);
    
    unmount();
  });
});

describe('useDebounce', () => {
  it('应该延迟更新值', () => {
    const { result, rerender, unmount } = renderHook(({ value }) => 
      useDebounce(value, 500)
    , { initialProps: { value: 'initial' } });
    
    expect(result.current).toBe('initial');
    
    // 立即更新 - 值不应该改变
    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');
    
    // 快进 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('updated');
    
    unmount();
  });

  it('应该在值稳定时返回最终值', () => {
    const { result, rerender, unmount } = renderHook(({ value }) => 
      useDebounce(value, 300)
    , { initialProps: { value: 'a' } });
    
    expect(result.current).toBe('a');
    
    // 快速更新多次
    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'd' });
    
    // 值仍然是 'a'，因为还没超过 300ms
    expect(result.current).toBe('a');
    
    // 快进到稳定点
    act(() => {
      vi.advanceTimersByTime(200);
    });
    
    // 现在应该返回 'd'
    expect(result.current).toBe('d');
    
    unmount();
  });
});

// 测试组件辅助函数
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export { TestWrapper };
