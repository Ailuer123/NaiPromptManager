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
    const discord = screen.getByRole('button', { name: /使用 Discord/ });
    expect(discord).toBeInTheDocument();
    expect(discord.querySelector('svg.icon-fill')).toBeTruthy();
    expect(screen.getByText('— 或使用账号密码登录 —')).toBeInTheDocument();
    expect(screen.getByLabelText(/用户名/)).toBeInTheDocument();
    expect(screen.queryByLabelText('游客口令')).toBeNull();
    expect(screen.queryByText('Discord 登录尚未配置')).toBeNull();
    expect(screen.queryByRole('button', { name: '选择主题配色' })).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: '外观' })).toBeNull();
  });

  it('未配置 Discord 时彻底收起 Discord 区域', () => {
    render(<Host discordEnabled={false} />);
    expect(screen.queryByRole('button', { name: /使用 Discord/ })).toBeNull();
    expect(screen.queryByText('Discord 登录尚未配置')).toBeNull();
    expect(screen.queryByText(/或使用账号密码登录/)).toBeNull();
    expect(screen.queryByText(/请使用账号密码/)).toBeNull();
    expect(screen.getByLabelText(/用户名/)).toBeInTheDocument();
  });

  it('标语下有三个亮点胶囊', () => {
    render(<Host />);
    const pills = [...document.querySelectorAll('.lp-pill')].map((el) => el.textContent);
    expect(pills).toEqual(['模块化串编排', '画师军火库', '端侧无损压缩']);
    expect(document.querySelector('.lp-highlights')?.previousElementSibling).toHaveTextContent(
      '把散落的灵感，收成可再咏的咒语',
    );
  });

  it('登录错误槽位常驻，避免卡片跳变', () => {
    const { rerender } = render(<Host />);
    const slot = document.querySelector('.auth-error-slot');
    expect(slot).toBeTruthy();
    expect(slot?.textContent?.trim()).toBe('');

    rerender(
      <ThemeProvider>
        <Landing
          loginUser=""
          loginPass=""
          loginError="用户名或密码错误"
          onLoginUserChange={() => {}}
          onLoginPassChange={() => {}}
          onSubmit={(e) => e.preventDefault()}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText('用户名或密码错误')).toHaveClass('auth-error');
    expect(document.querySelector('.auth-error-slot')).toContainElement(
      screen.getByText('用户名或密码错误'),
    );
  });

  it('符文矩阵落在 size 容器内，深电流挂在 BrandMark 上', () => {
    render(<Host />);
    const svg = screen.getByRole('img', { name: '符文矩阵' });
    const box = svg.closest('.size-14');
    expect(box).toBeTruthy();
    expect(box).not.toHaveClass('motion-deep-stream');
    expect(svg.closest('.brand-mark')).toHaveClass('motion-deep-stream', 'w-full', 'h-full');
    expect(svg).toHaveClass('w-full', 'h-full');
    expect(svg.querySelector('.glyph-trace')).toBeTruthy();
    expect(svg.querySelector('.ring-outer')).toBeTruthy();
  });

  it('SPELLCRAFT 用 pixel 字体，中文主标与登录标题用 display 字体', () => {
    render(<Host />);
    expect(document.querySelector('.font-pixel')).toHaveTextContent(/SPELLCRAFT/);
    expect(screen.getByRole('heading', { name: '咒语构建终端' })).toHaveClass('font-display');
    expect(screen.getByRole('heading', { name: '终端登录' })).toHaveClass('font-display');
  });

  it('提交走传入的 onSubmit，不自造登录', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<Host onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/用户名/), 'admin');
    await user.type(screen.getByLabelText(/密码/), 'secret');
    await user.click(screen.getByRole('button', { name: '进入终端' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
