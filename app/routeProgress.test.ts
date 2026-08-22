import { afterEach, describe, expect, it, vi } from 'vitest';
import { doneRouteProgress, startRouteProgress, subscribeRouteProgress } from './routeProgress';

afterEach(() => {
  vi.useRealTimers();
  doneRouteProgress();
});

describe('routeProgress', () => {
  it('start 后 active，done 后先到 100 再关掉', () => {
    vi.useFakeTimers();
    const seen: Array<{ active: boolean; width: number }> = [];
    const stop = subscribeRouteProgress((active, width) => seen.push({ active, width }));
    startRouteProgress();
    expect(seen.at(-1)?.active).toBe(true);
    expect(seen.at(-1)?.width ?? 0).toBeGreaterThan(0);
    doneRouteProgress();
    expect(seen.at(-1)?.width).toBe(100);
    vi.advanceTimersByTime(300);
    expect(seen.at(-1)).toEqual({ active: false, width: 0 });
    stop();
  });
});
