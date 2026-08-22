import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  THEME_ID_STORAGE_KEY,
  THEME_MODE_STORAGE_KEY,
  applyTheme,
  persistMode,
  readStoredTheme,
  resolveMode,
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

  it('缺省为 bingshuang + light', () => {
    expect(readStoredTheme()).toEqual({ themeId: 'bingshuang', preference: 'light', mode: 'light' });
  });

  it('readStoredTheme 读取 nai_atelier_theme + nai_theme', () => {
    g.localStorage!.setItem(THEME_ID_STORAGE_KEY, 'peach');
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'dark');
    expect(readStoredTheme()).toEqual({ themeId: 'peach', preference: 'dark', mode: 'dark' });
  });

  it('未知色板 id 回落到冷若冰霜', () => {
    g.localStorage!.setItem(THEME_ID_STORAGE_KEY, 'not-a-palette');
    expect(readStoredTheme().themeId).toBe('bingshuang');
    g.localStorage!.setItem(THEME_ID_STORAGE_KEY, 'oz');
    expect(readStoredTheme().themeId).toBe('bingshuang');
  });

  it("nai_theme 只有 dark / system 才不是 light", () => {
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'DARK');
    expect(readStoredTheme().preference).toBe('light');
    expect(readStoredTheme().mode).toBe('light');
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'light');
    expect(readStoredTheme().preference).toBe('light');
    g.localStorage!.removeItem(THEME_MODE_STORAGE_KEY);
    expect(readStoredTheme().preference).toBe('light');
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'dark');
    expect(readStoredTheme()).toMatchObject({ preference: 'dark', mode: 'dark' });
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'system');
    expect(readStoredTheme().preference).toBe('system');
  });

  it('system 偏好按 matchMedia 解析', () => {
    expect(resolveMode('system', true)).toBe('dark');
    expect(resolveMode('system', false)).toBe('light');
    expect(resolveMode('dark', false)).toBe('dark');
    expect(resolveMode('light', true)).toBe('light');
  });

  it('applyTheme 只写 nai_atelier_theme，不改 nai_theme', () => {
    g.localStorage!.setItem(THEME_MODE_STORAGE_KEY, 'dark');
    applyTheme('emerald', 'light');
    expect(g.localStorage!.getItem(THEME_ID_STORAGE_KEY)).toBe('emerald');
    expect(g.localStorage!.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark');
  });

  it('applyTheme 未知 id 写入冷若冰霜，且不创建 nai_theme', () => {
    applyTheme('not-a-palette', 'dark');
    expect(g.localStorage!.getItem(THEME_ID_STORAGE_KEY)).toBe('bingshuang');
    expect(g.localStorage!.getItem(THEME_MODE_STORAGE_KEY)).toBeNull();
  });

  it('persistMode 写 nai_theme，不改色板', () => {
    g.localStorage!.setItem(THEME_ID_STORAGE_KEY, 'peach');
    persistMode('dark');
    expect(g.localStorage!.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark');
    expect(g.localStorage!.getItem(THEME_ID_STORAGE_KEY)).toBe('peach');
    persistMode('light');
    expect(g.localStorage!.getItem(THEME_MODE_STORAGE_KEY)).toBe('light');
    persistMode('system');
    expect(g.localStorage!.getItem(THEME_MODE_STORAGE_KEY)).toBe('system');
    expect(g.localStorage!.getItem(THEME_ID_STORAGE_KEY)).toBe('peach');
  });
});
