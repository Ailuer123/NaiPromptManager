// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme';
import { Landing, type LandingProps } from './Landing';

afterEach(cleanup);

function Host(overrides: Partial<LandingProps> = {}) {
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

  return (
    <ThemeProvider>
      <Landing
        loginUser={loginUser}
        loginPass={loginPass}
        loginError=""
        onLoginUserChange={setLoginUser}
        onLoginPassChange={setLoginPass}
        onSubmit={onSubmit}
        {...overrides}
      />
    </ThemeProvider>
  );
}

describe('Landing', () => {
  it('展示价值句，不渲染模块清单', () => {
    render(<Host />);
    const slogan = screen.getByRole('heading', { name: '把散落的灵感，收成可再咏的咒语' });
    expect(slogan).toBeInTheDocument();
    expect(slogan.closest('.lp-intro')).toBeTruthy();
    const stage = document.querySelector('.lp-stage');
    const intro = document.querySelector('.lp-intro');
    const login = document.querySelector('.lp-login-col');
    expect(stage?.contains(intro)).toBe(true);
    expect(stage?.contains(login)).toBe(true);
    expect(
      intro && login && !!(intro.compareDocumentPosition(login) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true);
    expect(screen.queryByText('串看板')).toBeNull();
    expect(document.querySelector('.lp-modules')).toBeNull();
  });

  it('提供 Discord 登录和账号密码', () => {
    render(<Host />);
    expect(screen.getByRole('button', { name: '使用 Discord 登录' })).toBeInTheDocument();
    expect(screen.getByText('或使用账号密码')).toBeInTheDocument();
    expect(screen.getByLabelText('用户名')).toBeInTheDocument();
    expect(screen.queryByLabelText('游客口令')).toBeNull();
    expect(screen.queryByText('Discord 登录尚未配置')).toBeNull();
  });

  it('未配置 Discord 时只提示一次，不再重复账号密码', () => {
    render(<Host discordEnabled={false} />);
    expect(screen.queryByRole('button', { name: '使用 Discord 登录' })).toBeNull();
    expect(screen.getByText('Discord 登录尚未配置')).toBeInTheDocument();
    expect(screen.queryByText('或使用账号密码')).toBeNull();
    expect(screen.queryByText(/请使用账号密码/)).toBeNull();
    expect(screen.getByLabelText('用户名')).toBeInTheDocument();
  });

  it('提交走传入的 onSubmit，不自造登录', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<Host onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('用户名'), 'admin');
    await user.type(screen.getByLabelText('密码'), 'secret');
    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
