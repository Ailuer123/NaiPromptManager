// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { THEME_ID_STORAGE_KEY, THEME_MODE_STORAGE_KEY } from './applyTheme';
import { ThemeProvider, useTheme } from './ThemeProvider';

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove('dark');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-theme-mode');
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

function Probe() {
  const { mode, preference, themeId, setMode, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="pref">{preference}</span>
      <span data-testid="theme">{themeId}</span>
      <button type="button" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
        切换暗色
      </button>
      <button type="button" onClick={() => setMode('system')}>随设备</button>
      <button type="button" onClick={() => setTheme('peach')}>切换色板</button>
    </div>
  );
}

function mockMatchMedia(matches: boolean, listeners: Array<(e: MediaQueryListEvent) => void> = []) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => { listeners.push(handler); },
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }),
  });
}

describe('ThemeProvider', () => {
  it('setMode 写入 nai_theme 并同步 .dark', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(screen.getByRole('button', { name: '切换暗色' }));

    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dark');
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ?? '';
    expect(decodeURIComponent(favicon)).toContain('#38BDF8');
  });

  it('setTheme 写入 nai_atelier_theme，不改 nai_theme', async () => {
    const user = userEvent.setup();
    localStorage.setItem(THEME_MODE_STORAGE_KEY, 'dark');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    await user.click(screen.getByRole('button', { name: '切换色板' }));
    expect(screen.getByTestId('theme')).toHaveTextContent('peach');
    expect(localStorage.getItem(THEME_ID_STORAGE_KEY)).toBe('peach');
    expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark');
  });

  it('system 写入 nai_theme=system，按设备解析 mode', async () => {
    const user = userEvent.setup();
    mockMatchMedia(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: '随设备' }));
    expect(screen.getByTestId('pref')).toHaveTextContent('system');
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('system');
    expect(document.documentElement.getAttribute('data-theme-pref')).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
