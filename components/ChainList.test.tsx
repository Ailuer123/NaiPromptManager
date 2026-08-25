// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PromptChain } from '../types';
import { FeedbackProvider } from './ui/Feedback';
import { ChainList } from './ChainList';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

function makeChain(partial: Partial<PromptChain> & Pick<PromptChain, 'id' | 'name' | 'type'>): PromptChain {
  return {
    userId: 'u1',
    username: 'kira',
    description: '',
    tags: [],
    basePrompt: 'base',
    negativePrompt: 'lowres',
    modules: [],
    params: { width: 832, height: 1216, steps: 28, scale: 5, sampler: 'k_euler_ancestral' },
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  };
}

function renderList(
  overrides: Partial<React.ComponentProps<typeof ChainList>> = {},
) {
  const onTypeChange = vi.fn();
  const onCreate = vi.fn();
  const onSelect = vi.fn();
  const onDelete = vi.fn();
  const onRefresh = vi.fn();
  const notify = vi.fn();

  const result = render(
    <FeedbackProvider>
    <ChainList
      chains={[
        makeChain({ id: 's1', name: '雾霾玫瑰', type: 'style', isPrivate: true }),
        makeChain({ id: 'c1', name: '角色乙', type: 'character', guestHidden: true }),
      ]}
      type="style"
      onTypeChange={onTypeChange}
      onCreate={onCreate}
      onSelect={onSelect}
      onDelete={onDelete}
      onRefresh={onRefresh}
      isLoading={false}
      notify={notify}
      {...overrides}
    />
    </FeedbackProvider>,
  );

  return { onTypeChange, onCreate, onSelect, onDelete, onRefresh, notify, ...result };
}

describe('ChainList', () => {
  it('Seg 切换类型时调用 onTypeChange，内部仍按 type 过滤', async () => {
    const user = userEvent.setup();
    const { onTypeChange } = renderList();

    expect(screen.getByRole('tab', { name: /画师串/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('link', { name: /雾霾玫瑰/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /角色乙/ })).toBeNull();

    await user.click(screen.getByRole('tab', { name: /角色串/ }));
    expect(onTypeChange).toHaveBeenCalledTimes(1);
    expect(onTypeChange).toHaveBeenCalledWith('character');
    expect(screen.getByRole('tab', { name: /画师串/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('link', { name: /角色乙/ })).toBeNull();
  });

  it('卡片标题是拉伸链接，根节点不是 button；保留私人/游客标记', () => {
    const { container, rerender, onTypeChange, onCreate, onSelect, onDelete, onRefresh, notify } = renderList();

    const root = container.querySelector('article.card');
    expect(root).toBeTruthy();
    expect(root).not.toHaveAttribute('role', 'button');
    expect(screen.queryByRole('button', { name: '雾霾玫瑰' })).toBeNull();

    const link = screen.getByRole('link', { name: '雾霾玫瑰' });
    expect(link).toHaveClass('card-link');
    const privateFlag = within(root as HTMLElement).getByLabelText('私人串');
    expect(privateFlag).toHaveClass('board-flag', 'is-private');
    expect(privateFlag.closest('.board-cover-box')).toBeTruthy();
    expect(privateFlag.closest('.card-media')).toBeTruthy();

    rerender(
      <ChainList
        chains={[
          makeChain({ id: 's1', name: '雾霾玫瑰', type: 'style', isPrivate: true }),
          makeChain({ id: 'c1', name: '角色乙', type: 'character', guestHidden: true }),
        ]}
        type="character"
        onTypeChange={onTypeChange}
        onCreate={onCreate}
        onSelect={onSelect}
        onDelete={onDelete}
        onRefresh={onRefresh}
        isLoading={false}
        notify={notify}
      />,
    );

    const charLink = screen.getByRole('link', { name: '角色乙' });
    expect(charLink).toHaveClass('card-link');
    const charCard = container.querySelector('article.card');
    const hiddenFlag = within(charCard as HTMLElement).getByLabelText('游客不可见');
    expect(hiddenFlag).toHaveClass('board-flag', 'is-hidden');
    expect(hiddenFlag.closest('.board-cover-box')).toBeTruthy();
    expect(hiddenFlag.closest('.card-media')).toBeTruthy();
    expect(charCard).not.toHaveAttribute('role', 'button');
  });

  it('卡片右上角标明 V4.5 或 V5，并通过类名区分颜色', () => {
    const { container, rerender, onTypeChange, onCreate, onSelect, onDelete, onRefresh, notify } = renderList({
      chains: [
        makeChain({
          id: 's1',
          name: '默认V45串',
          type: 'style',
          params: { width: 832, height: 1216, steps: 28, scale: 5, sampler: 'k_euler_ancestral' },
        }),
      ],
    });

    const badgeV45 = container.querySelector('.board-model-badge');
    expect(badgeV45).toBeTruthy();
    expect(badgeV45).toHaveTextContent('V4.5');
    expect(badgeV45).toHaveClass('is-v45');
    expect(badgeV45).toHaveAttribute('aria-label', '模型版本：V4.5');
    expect(badgeV45?.closest('.board-cover-box')).toBeTruthy();

    rerender(
      <ChainList
        chains={[
          makeChain({
            id: 's2',
            name: '全新V5串',
            type: 'style',
            params: { width: 832, height: 1216, steps: 28, scale: 5, sampler: 'k_euler_ancestral', model: 'nai-diffusion-5-full' },
          }),
        ]}
        type="style"
        onTypeChange={onTypeChange}
        onCreate={onCreate}
        onSelect={onSelect}
        onDelete={onDelete}
        onRefresh={onRefresh}
        isLoading={false}
        notify={notify}
      />,
    );

    const badgeV5 = container.querySelector('.board-model-badge');
    expect(badgeV5).toBeTruthy();
    expect(badgeV5).toHaveTextContent('V5');
    expect(badgeV5).toHaveClass('is-v5');
    expect(badgeV5).toHaveAttribute('aria-label', '模型版本：V5');
  });

  it('更多按钮打开复制/删除，不进入编辑', async () => {
    const user = userEvent.setup();
    const { onSelect, onDelete } = renderList();

    await user.click(screen.getByRole('button', { name: '更多 雾霾玫瑰' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '雾霾玫瑰' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '复制' }));
    expect(screen.getByRole('button', { name: '复制选中组合' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: '更多 雾霾玫瑰' }));
    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirmDlg = await screen.findByRole('alertdialog', { name: '确认删除?' });
    await user.click(within(confirmDlg).getByRole('button', { name: '删除' }));
    expect(onDelete).toHaveBeenCalledWith('s1');
  });

  it('桌面可一键复制编译后的 Prompt', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const { notify } = renderList({
      chains: [
        makeChain({
          id: 's1',
          name: '雾霾玫瑰',
          type: 'style',
          basePrompt: 'artist:foo',
          variableValues: { subject: '1girl' },
        }),
      ],
    });

    await user.click(screen.getByRole('button', { name: '复制 雾霾玫瑰 Prompt' }));
    expect(writeText).toHaveBeenCalledWith('artist:foo, 1girl');
    expect(notify).toHaveBeenCalledWith('已复制 Prompt');
  });

  it('无封面卡片用串名哈希铺莫兰迪底纹', () => {
    const { container } = renderList();
    const ph = container.querySelector('.board-ph') as HTMLElement;
    expect(ph).toBeTruthy();
    expect(ph.style.getPropertyValue('--ph-grad')).toMatch(/^var\(--g[1-6]\)$/);
    expect(ph.style.getPropertyValue('--ph-spot')).toMatch(/^var\(--c[1-4]\)$/);
    expect(ph.style.getPropertyValue('--ph-spot-x')).toMatch(/%$/);
    expect(ph.getAttribute('aria-hidden')).toBe('true');
  });

  it('空态使用 Empty；游客没有新建', () => {
    renderList({ chains: [], isGuest: true });
    expect(screen.getByRole('heading', { name: '还没有这类串' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '新建串' })).toBeNull();
  });

  it('长标题仍能点进编辑，搜索会藏掉不匹配的串', async () => {
    const user = userEvent.setup();
    const longName = '这是一个非常非常非常非常非常非常非常长的画师串名称用来压测标题溢出';
    const { onSelect } = renderList({
      chains: [
        makeChain({ id: 's1', name: longName, type: 'style' }),
        makeChain({ id: 's2', name: '短名串', type: 'style' }),
      ],
    });

    expect(screen.getByRole('button', { name: `更多 ${longName}` })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: longName }));
    expect(onSelect).toHaveBeenCalledWith('s1');

    await user.type(screen.getByRole('searchbox', { name: '搜索串' }), '短名');
    expect(screen.getByRole('link', { name: '短名串' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: longName })).toBeNull();
  });
});
