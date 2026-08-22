// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SaveAsChainSheet } from './SaveAsChainSheet';

afterEach(cleanup);

describe('SaveAsChainSheet', () => {
  it('空名称不能创建；填名称后带上描述和类型提交', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(<SaveAsChainSheet open onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.getByRole('dialog', { name: '新建串' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('例如：新预设'), '雾霾玫瑰');
    await user.type(screen.getByPlaceholderText('描述这个预设的用途...'), '实验室存档');
    await user.click(screen.getByRole('tab', { name: '角色串' }));
    await user.click(screen.getByRole('button', { name: '创建' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('雾霾玫瑰', '实验室存档', 'character');
  });
});
