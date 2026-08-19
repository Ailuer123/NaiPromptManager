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

function renderLayout(user: User, onLogout = vi.fn(), hideNav = false, initial = '/') {
  return {
    onLogout,
    ...render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[initial]}>
          <Routes>
            <Route
              path="*"
              element={(
                <Layout currentView="list" currentUser={user} onLogout={onLogout} hideNav={hideNav}>
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

describe('Layout', () => {
  it('游客更多菜单没有设置，点外部关闭', async () => {
    const user = userEvent.setup();
    const { onLogout } = renderLayout(guest);

    expect(screen.queryByRole('link', { name: '设置与管理' })).toBeNull();

    await user.click(screen.getByRole('button', { name: '更多' }));
    expect(screen.getByRole('menuitem', { name: '历史' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: '设置' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: '实验室' })).toBeNull();

    await user.click(screen.getByText('看板内容'));
    expect(screen.queryByRole('menu')).toBeNull();

    await user.click(screen.getByRole('button', { name: '更多' }));
    await user.click(screen.getByRole('menuitem', { name: '退出' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('登录用户更多菜单含设置，存储条为 meter，导航不整页刷新', async () => {
    const user = userEvent.setup();
    renderLayout(member);

    expect(screen.getByRole('link', { name: '设置与管理' })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('link', { name: '生图实验室' })).toHaveAttribute('href', '/lab');

    const meter = screen.getByRole('meter', { name: '存储配额' });
    expect(meter).toHaveAttribute('aria-valuenow', String(126 * 1024 * 1024));

    await user.click(screen.getByRole('button', { name: '更多' }));
    await user.click(screen.getByRole('menuitem', { name: '设置' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/settings');
  });

  it('hideNav 时不渲染底栏与更多', () => {
    renderLayout(member, vi.fn(), true);
    expect(screen.queryByRole('navigation', { name: '移动导航' })).toBeNull();
    expect(screen.queryByRole('button', { name: '更多' })).toBeNull();
  });

  it('外观开关是亮/暗/随设备的图标 radio', () => {
    renderLayout(member);
    const groups = screen.getAllByRole('radiogroup', { name: '外观' });
    expect(groups.length).toBeGreaterThan(0);
    expect(screen.getAllByRole('radio', { name: '亮色' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('radio', { name: '暗色' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('radio', { name: '随设备' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('radio', { name: '亮色' })[0]).toHaveAttribute('aria-checked', 'true');
  });
});
