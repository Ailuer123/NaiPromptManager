// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { APP_DISCORD_URL, APP_REPO_URL, APP_VERSION } from '../app/version';
import { ThemeProvider } from '../theme';
import { AboutPage } from './AboutPage';

afterEach(cleanup);

describe('AboutPage', () => {
  it('只展示版本号和仓库', () => {
    render(
      <ThemeProvider>
        <AboutPage />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: '关于' })).toBeInTheDocument();
    expect(screen.getByText(`v${APP_VERSION}`)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '产品信息' })).toBeInTheDocument();

    const repo = screen.getByRole('link', { name: /仓库/ });
    expect(repo).toHaveAttribute('href', APP_REPO_URL);
    expect(repo).toHaveAttribute('target', '_blank');
    expect(repo).toHaveTextContent('NaiPromptManager');

    const discord = screen.getByRole('link', { name: /Discord/ });
    expect(discord).toHaveAttribute('href', APP_DISCORD_URL);
    expect(discord).toHaveTextContent('社区');

    expect(screen.queryByText('官网')).toBeNull();
    expect(screen.queryByText('博客')).toBeNull();
    expect(screen.queryByText('联系与支持')).toBeNull();
    expect(screen.queryByText('当前版本')).toBeNull();
    expect(screen.queryByText('源代码')).toBeNull();
  });
});
