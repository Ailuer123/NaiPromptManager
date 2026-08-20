// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../theme';
import { ModeSwitch, nextThemePreference } from './ModeSwitch';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mq = {
    matches,
    media: '(max-width: 899px)',
    onchange: null,
    addEventListener: (_type: string, fn: (event: MediaQueryListEvent) => void) => {
      listeners.add(fn);
    },
    removeEventListener: (_type: string, fn: (event: MediaQueryListEvent) => void) => {
      listeners.delete(fn);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  };
  vi.stubGlobal('matchMedia', vi.fn(() => mq));
  return mq;
}

describe('ModeSwitch', () => {
  it('桌面是亮/暗/随设备三段 radio', () => {
    stubMatchMedia(false);
    render(
      <ThemeProvider>
        <ModeSwitch />
      </ThemeProvider>,
    );
    expect(screen.getByRole('radiogroup', { name: '外观' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '亮色' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '暗色' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '随设备' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /外观：/ })).toBeNull();
  });

  it('窄屏收成单按钮，点击按亮→暗→随设备循环', async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ModeSwitch />
      </ThemeProvider>,
    );
    expect(screen.queryByRole('radiogroup')).toBeNull();
    const btn = screen.getByRole('button', { name: '外观：亮色，点击切换为暗色' });
    await user.click(btn);
    expect(screen.getByRole('button', { name: '外观：暗色，点击切换为随设备' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /外观：暗色/ }));
    expect(screen.getByRole('button', { name: '外观：随设备，点击切换为亮色' })).toBeInTheDocument();
  });

  it('循环顺序固定', () => {
    expect(nextThemePreference('light')).toBe('dark');
    expect(nextThemePreference('dark')).toBe('system');
    expect(nextThemePreference('system')).toBe('light');
  });
});
