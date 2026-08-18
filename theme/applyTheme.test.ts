import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  THEME_ID_STORAGE_KEY,
  THEME_MODE_STORAGE_KEY,
  applyTheme,
  readStoredTheme,
} from './applyTheme';

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

describe('applyTheme storage contract', () => {
  const g = globalThis as typeof globalThis & { localStorage?: Storage };

  beforeEach(() => {
    g.localStorage = createMemoryStorage();
  });

  afterEach(() => {
    delete g.localStorage;
  });

  it('缺省为 oz + light', () => {
    expect(readStoredTheme()).toEqual({ themeId: 'oz', mode: 'light' });
  });

  it('readStoredTheme 读取 nai_atelier_theme + nai_theme', () => {
    g.localStorage!.setItem(THEME_ID_STORAGE_KEY, 'peach');
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'dark');
    expect(readStoredTheme()).toEqual({ themeId: 'peach', mode: 'dark' });
  });

  it('未知色板 id 回落到 oz', () => {
    g.localStorage!.setItem(THEME_ID_STORAGE_KEY, 'not-a-palette');
    expect(readStoredTheme().themeId).toBe('oz');
  });

  it("nai_theme 只有 'dark' 才是暗色", () => {
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'DARK');
    expect(readStoredTheme().mode).toBe('light');
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'light');
    expect(readStoredTheme().mode).toBe('light');
    g.localStorage!.removeItem(THEME_MODE_STORAGE_KEY);
    expect(readStoredTheme().mode).toBe('light');
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'dark');
    expect(readStoredTheme().mode).toBe('dark');
  });

  it('applyTheme 只写 nai_atelier_theme，不改 nai_theme', () => {
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'dark');
    applyTheme('nainai', 'light');
    expect(g.localStorage!.getItem(THEME_ID_STORAGE_KEY)).toBe('nainai');
    expect(g.localStorage!.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark');
  });

  it('applyTheme 未知 id 写入 oz，且不创建 nai_theme', () => {
    applyTheme('not-a-palette', 'dark');
    expect(g.localStorage!.getItem(THEME_ID_STORAGE_KEY)).toBe('oz');
    expect(g.localStorage!.getItem(THEME_MODE_STORAGE_KEY)).toBeNull();
  });
});
