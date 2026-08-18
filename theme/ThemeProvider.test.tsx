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
  const { mode, themeId, setMode, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="theme">{themeId}</span>
      <button type="button" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
        切换暗色
      </button>
      <button type="button" onClick={() => setTheme('peach')}>切换色板</button>
    </div>
  );
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
});
