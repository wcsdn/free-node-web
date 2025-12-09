/**
 * useTypewriter Hook 测试
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from '../../../src/features/home/hooks/useTypewriter';

describe('useTypewriter', () => {
  it('should start with empty displayed text', () => {
    const { result } = renderHook(() =>
      useTypewriter({
        lines: ['Hello', 'World'],
        typingSpeed: 10,
        lineDelay: 10,
      })
    );

    expect(result.current.displayedText).toBe('');
    expect(result.current.isComplete).toBe(false);
  });

  it('should type out text character by character', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useTypewriter({
        lines: ['Hi'],
        typingSpeed: 10,
        lineDelay: 10,
      })
    );

    // 初始状态
    expect(result.current.displayedText).toBe('');

    // 前进时间，让第一个字符显示
    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current.displayedText).toBe('H');

    // 前进时间，让第二个字符显示
    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current.displayedText).toBe('Hi');

    vi.useRealTimers();
  });

  it('should call onComplete when finished', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    renderHook(() =>
      useTypewriter({
        lines: ['A'],
        typingSpeed: 10,
        lineDelay: 10,
        onComplete,
      })
    );

    // 打完 'A' 需要 10ms，然后 lineDelay 10ms，然后触发 complete
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onComplete).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should reset when reset is called', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useTypewriter({
        lines: ['Test'],
        typingSpeed: 10,
        lineDelay: 10,
      })
    );

    // 打一些字符
    act(() => {
      vi.advanceTimersByTime(30);
    });

    expect(result.current.displayedText.length).toBeGreaterThan(0);

    // 重置
    act(() => {
      result.current.reset();
    });

    expect(result.current.displayedText).toBe('');
    expect(result.current.isComplete).toBe(false);

    vi.useRealTimers();
  });
});
