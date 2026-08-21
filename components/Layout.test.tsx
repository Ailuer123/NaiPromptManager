// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme';
import type { User } from '../types';
import { Layout } from './Layout';

afterEach(cleanup);

const guest: User = { id: 'g', username: 'visitor', role: 'guest', createdAt: 0 };
const member: User = {
  id: 'u',
  username: 'kira',
  role: 'user',
  createdAt: 0,
  storageUsage: 126 * 1024 * 1024,
  maxStorage: 300 * 1024 * 1024,
};

function PathProbe() {
  const loc = useLocation();
  return <div data-testid="path">{loc.pathname}</div>;
}

function renderLayout(user: User, onLogout = vi.fn(), initial = '/') {
  return {
    onLogout,
    ...render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[initial]}>
          <Routes>
            <Route
              path="*"
              element={(
                <Layout currentView="list" currentUser={user} onLogout={onLogout}>
                  <div>看板内容</div>
                  <PathProbe />
                </Layout>
              )}
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    ),
  };
}

async function openSidebar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '打开侧边栏' }));
}

describe('Layout', () => {
  it('移动端顶栏是侧栏开关 / LOGO / Anlas，没有底栏', async () => {
    renderLayout(guest);

    expect(screen.getByRole('button', { name: '打开侧边栏' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: '符文矩阵' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('navigation', { name: '移动导航' })).toBeNull();
    expect(screen.queryByRole('button', { name: '更多' })).toBeNull();
    expect(document.querySelector('.bottom-nav')).toBeNull();
  });

  it('打开侧栏后是毛玻璃面板，点遮罩关闭', async () => {
    const user = userEvent.setup();
    renderLayout(guest);

    await openSidebar(user);
    expect(screen.getByRole('button', { name: '打开侧边栏' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.sidebar-panel')).toHaveClass('glass-strong');
    expect(document.querySelector('.sidebar-overlay')).toHaveClass('open');

    await user.click(document.querySelector('.sidebar-overlay')!);
    expect(screen.getByRole('button', { name: '打开侧边栏' })).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.sidebar-overlay')).not.toHaveClass('open');
  });

  it('Esc 关闭侧栏并还原焦点', async () => {
    const user = userEvent.setup();
    renderLayout(guest);

    const toggle = screen.getByRole('button', { name: '打开侧边栏' });
    await user.click(toggle);
    expect(screen.getByRole('button', { name: '关闭侧边栏' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('游客侧栏含历史与设置，点外部关闭', async () => {
    const user = userEvent.setup();
    const { onLogout } = renderLayout(guest);

    expect(screen.getByRole('link', { name: '设置与管理' })).toBeInTheDocument();

    await openSidebar(user);
    expect(screen.getByRole('link', { name: '生成历史' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '设置与管理' })).toBeInTheDocument();

    await user.click(document.querySelector('.sidebar-overlay')!);
    expect(document.querySelector('.sidebar')).not.toHaveClass('open');

    await openSidebar(user);
    await user.click(screen.getByRole('button', { name: '退出登录' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('登录用户侧栏含设置，存储条为 meter，导航不整页刷新', async () => {
    const user = userEvent.setup();
    renderLayout(member);

    expect(screen.getByRole('link', { name: '设置与管理' })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('link', { name: '生图实验室' })).toHaveAttribute('href', '/lab');

    const meter = screen.getByRole('meter', { name: '存储配额' });
    expect(meter).toHaveAttribute('aria-valuenow', String(126 * 1024 * 1024));

    await openSidebar(user);
    await user.click(screen.getByRole('link', { name: '设置与管理' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/settings');
  });

  it('顶栏展示权限组并提供退出登录', async () => {
    const user = userEvent.setup();
    const vip: User = { id: 'v', username: 'nova', role: 'vip', createdAt: 0 };
    const { onLogout } = renderLayout(vip);

    expect(screen.getAllByText('VIP', { selector: '.vip-label' }).length).toBeGreaterThan(0);
    expect(screen.queryByText('VIP VIP')).toBeNull();
    expect(screen.getAllByText('nova').length).toBeGreaterThan(0);
    await openSidebar(user);
    await user.click(screen.getByRole('button', { name: '退出登录' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('顶栏和侧栏不再放常驻主题 / 深浅开关', () => {
    renderLayout(member);
    expect(screen.queryByRole('radiogroup', { name: '外观' })).toBeNull();
    expect(screen.queryByRole('button', { name: /外观：/ })).toBeNull();
    expect(screen.queryByRole('button', { name: '选择主题配色' })).toBeNull();
  });

  it('当前页导航带 active，供侧栏 Accent 指示条挂钩', () => {
    renderLayout(member);
    const current = screen.getByRole('link', { name: '串看板' });
    expect(current).toHaveClass('nav-item', 'active');
    expect(screen.getByRole('link', { name: '军火库' })).toHaveClass('nav-item');
    expect(screen.getByRole('link', { name: '军火库' })).not.toHaveClass('active');
  });

  it('配额条按 75/90 切换 warn 与 hot', () => {
    const warnUser: User = {
      ...member,
      storageUsage: 240 * 1024 * 1024,
      maxStorage: 300 * 1024 * 1024,
    };
    const { unmount } = renderLayout(warnUser);
    expect(screen.getByRole('meter', { name: '存储配额' })).toHaveClass('bar', 'warn');
    unmount();

    const hotUser: User = {
      ...member,
      storageUsage: 280 * 1024 * 1024,
      maxStorage: 300 * 1024 * 1024,
    };
    renderLayout(hotUser);
    expect(screen.getByRole('meter', { name: '存储配额' })).toHaveClass('bar', 'hot');
  });
});
