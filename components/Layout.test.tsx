// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function renderLayout(user: User, onNavigate = vi.fn(), onLogout = vi.fn(), hideNav = false) {
  return {
    onNavigate,
    onLogout,
    ...render(
      <ThemeProvider>
        <Layout
          currentView="list"
          currentUser={user}
          onNavigate={onNavigate}
          onLogout={onLogout}
          hideNav={hideNav}
        >
          <div>看板内容</div>
        </Layout>
      </ThemeProvider>,
    ),
  };
}

describe('Layout', () => {
  it('游客更多菜单没有设置，点外部关闭', async () => {
    const user = userEvent.setup();
    const { onLogout } = renderLayout(guest);

    expect(screen.queryByRole('button', { name: '设置与管理' })).toBeNull();

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

  it('登录用户更多菜单含设置，存储条为 meter', async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderLayout(member);

    expect(screen.getByRole('button', { name: '设置与管理' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '生图实验室' })).toBeInTheDocument();

    const meter = screen.getByRole('meter', { name: '存储配额' });
    expect(meter).toHaveAttribute('aria-valuenow', String(126 * 1024 * 1024));

    await user.click(screen.getByRole('button', { name: '更多' }));
    await user.click(screen.getByRole('menuitem', { name: '设置' }));
    expect(onNavigate).toHaveBeenCalledWith('admin');
  });

  it('hideNav 时不渲染底栏与更多', () => {
    renderLayout(member, vi.fn(), vi.fn(), true);
    expect(screen.queryByRole('navigation', { name: '移动导航' })).toBeNull();
    expect(screen.queryByRole('button', { name: '更多' })).toBeNull();
  });
});
