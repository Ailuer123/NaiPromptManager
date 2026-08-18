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
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [guestPasscode, setGuestPasscode] = useState('');
  const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

  return (
    <ThemeProvider>
      <Landing
        isGuestMode={isGuestMode}
        onGuestModeChange={setIsGuestMode}
        loginUser={loginUser}
        loginPass={loginPass}
        guestPasscode={guestPasscode}
        loginError=""
        onLoginUserChange={setLoginUser}
        onLoginPassChange={setLoginPass}
        onGuestPasscodeChange={setGuestPasscode}
        onSubmit={onSubmit}
        {...overrides}
      />
    </ThemeProvider>
  );
}

describe('Landing', () => {
  it('展示价值句与五模块', () => {
    render(<Host />);
    expect(screen.getByRole('heading', { name: '把画师、模块与参数，编译成可复用的咒语' })).toBeInTheDocument();
    expect(screen.getByText('串看板')).toBeInTheDocument();
    expect(screen.getByText('提示词结构')).toBeInTheDocument();
    expect(screen.getByText('军火库')).toBeInTheDocument();
    expect(screen.getByText('生图实验室')).toBeInTheDocument();
    expect(screen.getByText('生成历史')).toBeInTheDocument();
  });

  it('游客 tab 切换出口令表单', async () => {
    const user = userEvent.setup();
    render(<Host />);

    expect(screen.getByLabelText('用户名')).toBeInTheDocument();
    expect(screen.queryByLabelText('游客口令')).toBeNull();

    await user.click(screen.getByRole('tab', { name: '游客参观' }));

    expect(screen.getByLabelText('游客口令')).toBeInTheDocument();
    expect(screen.queryByLabelText('用户名')).toBeNull();
    expect(screen.getByRole('button', { name: '进入参观' })).toBeInTheDocument();
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
