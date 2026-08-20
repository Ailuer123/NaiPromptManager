// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_VERSION } from '../app/version';
import { STALE_GUEST_IDLE_MS } from '../config/staleUsers';
import { ThemeProvider } from '../theme';
import type { User } from '../types';
import { FeedbackProvider } from './ui/Feedback';
import { ArtistAdmin } from './ArtistAdmin';

afterEach(cleanup);

const guest: User = { id: 'g', username: 'visitor', role: 'guest', createdAt: 0 };
const admin: User = { id: 'a', username: 'admin', role: 'admin', createdAt: 0 };

function renderAdmin(user: User, usersData: User[] = []) {
  return render(
    <ThemeProvider>
      <FeedbackProvider>
        <ArtistAdmin
          currentUser={user}
          artistsData={[]}
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
});
