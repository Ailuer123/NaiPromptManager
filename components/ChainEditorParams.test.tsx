// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
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
    expect(screen.getByText('角色坐标区')).toBeInTheDocument();
    expect(screen.getByLabelText('步数')).toBeInTheDocument();
    expect(screen.getByLabelText('采样器')).toBeInTheDocument();
    expect(screen.getByLabelText('CFG Scale')).toBeInTheDocument();
    expect(screen.getByLabelText('CFG Rescale')).toBeInTheDocument();
    expect(screen.getByLabelText('种子')).toBeInTheDocument();
    expect(screen.getByLabelText('UC Preset')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '画质增强' })).toBeInTheDocument();
  });
});
