// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NAIParams } from '../types';
import { ChainEditorParams } from './ChainEditorParams';

afterEach(cleanup);

const params: NAIParams = {
  width: 832,
  height: 1216,
  steps: 28,
  scale: 5,
  sampler: 'k_euler_ancestral',
  ucPreset: 4,
  qualityToggle: true,
};

describe('ChainEditorParams', () => {
  it('参数配置含构图与采样，多角色单独成组，没有负面与预设', () => {
    render(
      <ChainEditorParams
        params={params}
        setParams={vi.fn()}
        canEdit
        markChange={vi.fn()}
        compositionBody={<p>角色坐标区</p>}
      />,
    );

    const multi = screen.getByRole('button', { name: '多角色' });
    const paramsFold = screen.getByRole('button', { name: '参数配置' });
    expect(multi).toBeInTheDocument();
    expect(paramsFold).toBeInTheDocument();
    expect(multi.compareDocumentPosition(paramsFold) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('button', { name: '负面与预设' })).toBeNull();
    expect(screen.queryByRole('button', { name: '采样与质量' })).toBeNull();
    expect(screen.getByText('构图')).toBeInTheDocument();
    const modelLabel = screen.getByText('模型');
    const composition = screen.getByText('构图');
    expect(modelLabel.compareDocumentPosition(composition) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('角色坐标区')).toBeInTheDocument();
    expect(screen.getByLabelText('步数')).toBeInTheDocument();
    expect(screen.getByLabelText('采样器')).toBeInTheDocument();
    expect(screen.getByLabelText('CFG Scale')).toBeInTheDocument();
    expect(screen.getByLabelText('CFG Rescale')).toBeInTheDocument();
    expect(screen.getByLabelText('种子')).toBeInTheDocument();
    expect(screen.getByLabelText('UC Preset')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '画质增强' })).toBeInTheDocument();
    expect(screen.getByText('模型')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'V5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '透明' })).toBeEnabled();
    expect(screen.getByText('透明背景')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '透明模式说明' })).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(screen.queryByRole('button', { name: '流式预览' })).toBeNull();
  });

  it('点击透明模式问号显示说明', async () => {
    const user = userEvent.setup();
    render(
      <ChainEditorParams
        params={{ ...params, model: 'nai-diffusion-5-full', transparent: true }}
        setParams={vi.fn()}
        canEdit
        markChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '透明模式说明' }));
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveClass('help-tip-card');
    expect(tip).toHaveTextContent('Straight（直通）');
    expect(tip).toHaveTextContent('Premultiplied（预乘）');
  });

  it('V5 才允许透明背景，切回 V4.5 会关掉透明；V4.5 点击透明会提示', async () => {
    const setParams = vi.fn();
    const notify = vi.fn();
    const { rerender } = render(
      <ChainEditorParams
        params={{ ...params, model: 'nai-diffusion-5-full', transparent: true }}
        setParams={setParams}
        canEdit
        markChange={vi.fn()}
        notify={notify}
      />,
    );
    expect(screen.getByRole('button', { name: '透明' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Straight' })).toBeInTheDocument();
    screen.getByRole('button', { name: 'V4.5' }).click();
    expect(setParams).toHaveBeenCalledWith(expect.objectContaining({
      model: 'nai-diffusion-4-5-full',
      transparent: false,
    }));

    rerender(
      <ChainEditorParams
        params={{ ...params, model: 'nai-diffusion-4-5-full' }}
        setParams={setParams}
        canEdit
        markChange={vi.fn()}
        notify={notify}
      />,
    );
    setParams.mockClear();
    screen.getByRole('button', { name: '透明' }).click();
    expect(notify).toHaveBeenCalledWith('透明背景仅 V5 支持，请先切换模型', 'warning');
    expect(setParams).not.toHaveBeenCalled();
  });
});
