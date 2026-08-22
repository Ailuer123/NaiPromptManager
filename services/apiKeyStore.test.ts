import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe('apiKeyStore', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', makeStorage());
    vi.stubGlobal('sessionStorage', makeStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('本机记住写入 localStorage，本次会话只留在内存', async () => {
    const store = await import('./apiKeyStore');
    store.setApiKey('pst-session', false);
    expect(store.getApiKey()).toBe('pst-session');
    expect(localStorage.getItem('nai_api_key')).toBeNull();

    store.setApiKey('pst-remember', true);
    expect(store.getApiKey()).toBe('pst-remember');
    expect(localStorage.getItem('nai_api_key')).toBe('pst-remember');
  });

  it('clear 同时清内存和 localStorage', async () => {
    const store = await import('./apiKeyStore');
    store.setApiKey('pst-keep', true);
    store.clearApiKey();
    expect(store.getApiKey()).toBe('');
    expect(localStorage.getItem('nai_api_key')).toBeNull();
    expect(store.hasApiKey()).toBe(false);
  });

  it('hydrate 读取已记住的 localStorage key', async () => {
    localStorage.setItem('nai_api_key', 'pst-saved');
    const store = await import('./apiKeyStore');
    expect(store.getApiKey()).toBe('pst-saved');
    expect(store.isApiKeyRemembered()).toBe(true);
  });
});
