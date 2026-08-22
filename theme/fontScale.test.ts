// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_FONT_SCALE,
  FONT_SCALE_STORAGE_KEY,
  applyFontScale,
  fontScaleFactor,
  parseFontScale,
  persistFontScale,
  readStoredFontScale,
} from './fontScale';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

describe('fontScale', () => {
  const g = globalThis as typeof globalThis & { localStorage?: Storage };

  beforeEach(() => {
    g.localStorage = createMemoryStorage();
  });

  afterEach(() => {
    delete g.localStorage;
    if (typeof document !== 'undefined') {
      document.documentElement.style.removeProperty('--font-scale');
      document.documentElement.removeAttribute('data-font-scale');
    }
  });

  it('未知值回落到标准', () => {
    expect(parseFontScale(null)).toBe(DEFAULT_FONT_SCALE);
    expect(parseFontScale('huge')).toBe('md');
    expect(parseFontScale('sm')).toBe('sm');
    expect(parseFontScale('xl')).toBe('xl');
  });

  it('readStoredFontScale 读取 nai_font_scale', () => {
    expect(readStoredFontScale()).toBe('md');
    g.localStorage!.setItem(FONT_SCALE_STORAGE_KEY, 'lg');
    expect(readStoredFontScale()).toBe('lg');
  });

  it('persistFontScale 只写字号键', () => {
    persistFontScale('xl');
    expect(g.localStorage!.getItem(FONT_SCALE_STORAGE_KEY)).toBe('xl');
  });

  it('applyFontScale 写入 CSS 变量与 data 属性', () => {
    applyFontScale('sm');
    expect(g.localStorage!.getItem(FONT_SCALE_STORAGE_KEY)).toBe('sm');
    expect(document.documentElement.getAttribute('data-font-scale')).toBe('sm');
    expect(document.documentElement.style.getPropertyValue('--font-scale')).toBe(String(fontScaleFactor('sm')));
  });
});
