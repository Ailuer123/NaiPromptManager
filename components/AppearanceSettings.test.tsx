// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../theme';
import { AppearanceSettings } from './AppearanceSettings';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-theme-mode');
  document.documentElement.removeAttribute('data-font-scale');
});

beforeEach(() => {
  localStorage.clear();
});

describe('AppearanceSettings', () => {
  it('用当前色板卡片选择主题，不用 DEEIX 主题名', () => {
    render(
      <ThemeProvider>
        <AppearanceSettings />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: '外观' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '冷若冰霜' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '焦糖布丁' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: 'azure' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'graphite' })).toBeNull();
    expect(screen.queryByText('字体大小')).toBeNull();
    expect(screen.getByRole('button', { name: '冷若冰霜' }).querySelector('.appearance-check')).toBeTruthy();
    expect(screen.getByRole('button', { name: '冷若冰霜' }).querySelector('.appearance-tile')).toHaveClass('is-active');
    expect(screen.getByRole('button', { name: '焦糖布丁' }).querySelector('.appearance-check')).toBeNull();
  });

  it('切换主题和颜色模式', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <AppearanceSettings />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: '白桃气泡' }));
    expect(screen.getByRole('button', { name: '白桃气泡' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '白桃气泡' }).querySelector('.appearance-check')).toBeTruthy();
    expect(document.documentElement.getAttribute('data-theme')).toBe('peach');

    await user.click(screen.getByRole('button', { name: '深色' }));
    expect(screen.getByRole('button', { name: '深色' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '深色' }).querySelector('.appearance-check')).toBeTruthy();
    expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dark');

    await user.click(screen.getByRole('button', { name: '跟随系统' }));
    expect(screen.getByRole('button', { name: '跟随系统' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '跟随系统' }).querySelector('.appearance-check')).toBeTruthy();
  });
});
