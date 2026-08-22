// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearApiKey, getApiKey, isApiKeyRemembered } from '../../services/apiKeyStore';
import { ApiKeyBadge, ApiKeyFields, ApiKeySheet } from './ApiKeyFields';

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

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
  vi.stubGlobal('sessionStorage', makeStorage());
  clearApiKey();
});

afterEach(() => {
  cleanup();
  clearApiKey();
  vi.unstubAllGlobals();
});

describe('ApiKeyFields', () => {
  it('保存密钥写入 apiKeyStore，本机记住才落 localStorage', async () => {
    const user = userEvent.setup();
    render(<ApiKeyFields />);

    await user.type(screen.getByLabelText('NAI API Key'), 'pst-guest');
    await user.click(screen.getByRole('button', { name: '保存密钥' }));

    expect(getApiKey()).toBe('pst-guest');
    expect(isApiKeyRemembered()).toBe(false);
    expect(screen.getByText('仅本次会话有效')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '本机记住' }));
    await user.click(screen.getByRole('button', { name: '保存密钥' }));

    expect(isApiKeyRemembered()).toBe(true);
    expect(localStorage.getItem('nai_api_key')).toBe('pst-guest');
  });
});

describe('ApiKeyBadge + ApiKeySheet', () => {
  it('点击未配置徽标打开密钥面板，不依赖 admin 路由', async () => {
    const user = userEvent.setup();

    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <ApiKeyBadge configured={false} onClick={() => setOpen(true)} />
          <ApiKeySheet open={open} onClose={() => setOpen(false)} />
        </>
      );
    }

    render(<Host />);
    expect(screen.queryByRole('dialog', { name: 'API Key' })).toBeNull();

    await user.click(screen.getByRole('button', { name: '未配置' }));
    expect(screen.getByRole('dialog', { name: 'API Key' })).toHaveClass('open');
    expect(screen.getByLabelText('NAI API Key')).toBeInTheDocument();
  });
});
