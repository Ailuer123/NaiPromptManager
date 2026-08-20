// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_VERSION } from '../app/version';
import { STALE_GUEST_IDLE_MS } from '../config/staleUsers';
import { ThemeProvider } from '../theme';
import type { Artist, User } from '../types';
import { FeedbackProvider } from './ui/Feedback';
import { ArtistAdmin } from './ArtistAdmin';

afterEach(cleanup);

const guest: User = { id: 'g', username: 'visitor', role: 'guest', createdAt: 0 };
const admin: User = { id: 'a', username: 'admin', role: 'admin', createdAt: 0 };

function renderAdmin(user: User, usersData: User[] = [], artistsData: Artist[] = []) {
  return render(
    <ThemeProvider>
      <FeedbackProvider>
        <ArtistAdmin
          currentUser={user}
          artistsData={artistsData}
          usersData={usersData}
          onRefreshArtists={vi.fn(async () => {})}
          onRefreshUsers={vi.fn(async () => {})}
        />
      </FeedbackProvider>
    </ThemeProvider>,
  );
}

function settingsTabs() {
  return within(screen.getByRole('tablist', { name: '设置分区' })).getAllByRole('tab');
}

describe('ArtistAdmin tabs', () => {
  it('关于在标签最后，偏好设置顺序是账号、偏好、外观', () => {
    renderAdmin(guest);
    expect(settingsTabs().map((tab) => tab.textContent)).toEqual(['偏好设置', '关于']);
    const account = screen.getByRole('heading', { name: '账号' });
    const prefs = screen.getByRole('heading', { name: '偏好' });
    const appearance = screen.getByRole('heading', { name: '外观' });
    expect(account.compareDocumentPosition(prefs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(prefs.compareDocumentPosition(appearance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '产品信息' })).toBeNull();
  });

  it('管理员标签顺序是偏好 / 画师 / 用户 / 统计 / 关于', async () => {
    const user = userEvent.setup();
    renderAdmin(admin);
    expect(settingsTabs().map((tab) => tab.textContent)).toEqual([
      '偏好设置',
      '画师管理',
      '用户管理',
      '使用统计',
      '关于',
    ]);

    await user.click(screen.getByRole('tab', { name: '关于' }));
    expect(screen.getByRole('heading', { name: '产品信息' })).toBeInTheDocument();
    expect(screen.getByText(`v${APP_VERSION}`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /仓库/ })).toBeInTheDocument();
  });

  it('用户管理可选游客，并提供批量改回游客', async () => {
    const user = userEvent.setup();
    const alice: User = {
      id: 'u1',
      username: 'alice',
      role: 'user',
      createdAt: 1,
      lastLogin: Date.now() - STALE_GUEST_IDLE_MS - 1000,
      storageUsage: 0,
      maxStorage: 300 * 1024 * 1024,
    };
    renderAdmin(admin, [alice]);
    await user.click(screen.getByRole('tab', { name: '用户管理' }));
    const role = screen.getByRole('combobox', { name: 'alice 的角色' });
    expect(role).toHaveClass('role-select');
    expect(role).not.toHaveClass('role-pill');
    expect(within(role).getByRole('option', { name: '游客' })).toBeInTheDocument();
    expect(within(role).getByRole('option', { name: '普通用户' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '批量改回游客' })).toBeInTheDocument();
    expect(screen.getByText(/当前列表中有 1 人符合/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Discord 游客' })).toBeNull();
  });

  it('修改密码没有新密码标签，按钮和输入框并排', () => {
    renderAdmin({ id: 'm', username: 'mira', role: 'user', createdAt: 0 });
    expect(screen.queryByText('新密码', { selector: 'label' })).toBeNull();
    const input = screen.getByPlaceholderText('新密码');
    const submit = screen.getByRole('button', { name: '更新密码' });
    expect(input).toHaveAttribute('aria-label', '新密码');
    expect(input.closest('.pref-row')).toContainElement(submit);
  });

  it('关联 Discord 按钮左侧带图标，压缩标题为本地图片压缩', () => {
    renderAdmin({ id: 'm', username: 'mira', role: 'user', createdAt: 0 });
    const discord = screen.getByRole('button', { name: '关联 Discord' });
    expect(discord.querySelector('svg')).not.toBeNull();
    expect(screen.getByRole('heading', { name: '本地图片压缩' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^图片压缩$/ })).toBeNull();
  });

  it('游客不显示存储配额和修改配额', async () => {
    const user = userEvent.setup();
    const visitor: User = {
      id: 'g1',
      username: '暮春',
      role: 'guest',
      createdAt: 1,
      storageUsage: 0,
      maxStorage: 100 * 1024 * 1024,
    };
    const alice: User = {
      id: 'u1',
      username: 'alice',
      role: 'user',
      createdAt: 1,
      storageUsage: 0,
      maxStorage: 300 * 1024 * 1024,
    };
    renderAdmin(admin, [visitor, alice]);
    await user.click(screen.getByRole('tab', { name: '用户管理' }));
    const guestRow = screen.getByText('暮春').closest('tr');
    const userRow = screen.getByText('alice').closest('tr');
    expect(guestRow).toBeTruthy();
    expect(userRow).toBeTruthy();
    expect(within(guestRow as HTMLElement).getByText('无配额')).toBeInTheDocument();
    expect(within(guestRow as HTMLElement).queryByRole('button', { name: '修改配额' })).toBeNull();
    expect(within(guestRow as HTMLElement).queryByText(/MB/)).toBeNull();
    expect(within(userRow as HTMLElement).getByRole('button', { name: '修改配额' })).toBeInTheDocument();
  });

  it('画师管理用图标编辑删除，长名字截断', async () => {
    const user = userEvent.setup();
    const longName = 'very_long_artist_name_(spice!!)_that_should_ellipsis';
    renderAdmin(admin, [], [{ id: 'art1', name: longName, imageUrl: 'https://example.com/a.png' }]);
    await user.click(screen.getByRole('tab', { name: '画师管理' }));
    expect(screen.queryByRole('button', { name: '编辑' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: '删除' })).not.toBeNull();
    expect(screen.getByRole('button', { name: '编辑' })).toHaveClass('icon-btn');
    expect(screen.getByRole('button', { name: '删除' })).toHaveClass('icon-btn');
    expect(screen.queryByRole('button', { name: '编辑' })?.textContent).toBe('');
    const name = screen.getByText(longName);
    expect(name).toHaveAttribute('title', longName);
    expect(name.closest('.artist-admin-name')).toBeTruthy();
  });
});
