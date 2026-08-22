// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isApproxScaleOne,
  lockMobileViewport,
  resetDocumentScroll,
  resetViewportZoom,
  VIEWPORT_CONTENT,
} from './viewportLock';

function stubViewport(scale: number, offsetTop = 0) {
  const listeners = new Map<string, Set<EventListener>>();
  const visualViewport = {
    scale,
    offsetTop,
    offsetLeft: 0,
    addEventListener: (type: string, fn: EventListener) => {
      const set = listeners.get(type) ?? new Set();
      set.add(fn);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, fn: EventListener) => {
      listeners.get(type)?.delete(fn);
    },
    dispatch(type: string) {
      listeners.get(type)?.forEach((fn) => fn(new Event(type)));
    },
  };
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: visualViewport });
  return visualViewport;
}

describe('viewportLock', () => {
  beforeEach(() => {
    document.head.innerHTML = `<meta name="viewport" content="${VIEWPORT_CONTENT}" />`;
    window.scrollTo = vi.fn();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scale 接近 1 才算复位', () => {
    expect(isApproxScaleOne(1)).toBe(true);
    expect(isApproxScaleOne(1.01)).toBe(true);
    expect(isApproxScaleOne(1.2)).toBe(false);
  });

  it('复位滚动写到 window 和根节点', () => {
    document.documentElement.scrollTop = 40;
    document.body.scrollTop = 12;
    resetDocumentScroll();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.scrollTop).toBe(0);
  });

  it('短暂加上 maximum-scale 再恢复，用来清掉输入框自动放大', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    resetViewportZoom();
    const meta = document.querySelector('meta[name="viewport"]');
    expect(meta?.getAttribute('content')).toBe(VIEWPORT_CONTENT);
    expect(raf).toHaveBeenCalled();
  });

  it('scale=1 的 visualViewport scroll 会把文档滚回顶部', () => {
    const vv = stubViewport(1, 80);
    document.documentElement.scrollTop = 80;
    const unlock = lockMobileViewport();
    vv.dispatch('scroll');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    unlock();
  });

  it('仍处于放大时不抢滚动，避免和捏合手势打架', () => {
    const vv = stubViewport(1.25, 40);
    const unlock = lockMobileViewport();
    vi.mocked(window.scrollTo).mockClear();
    document.documentElement.scrollTop = 40;
    vv.dispatch('scroll');
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(document.documentElement.scrollTop).toBe(40);
    unlock();
  });
});
