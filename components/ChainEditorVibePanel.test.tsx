// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NAIParams, VibeMount, VibePreset } from '../types';
import { VibeLibrary } from '../services/vibeLibrary';
import { ChainEditorVibePanel } from './ChainEditorVibePanel';

afterEach(cleanup);

const baseParams: NAIParams = {
  width: 832,
  height: 1216,
  steps: 28,
  scale: 5,
  sampler: 'k_euler_ancestral',
};

const makePreset = (id: string): VibePreset => ({
  id,
  name: id,
  encodings: [
    { model: 'v4full', informationExtracted: 0.4, encoding: `${id}_LOW` },
    { model: 'v4full', informationExtracted: 0.7, encoding: `${id}_DEFAULT` },
  ],
  defaultStrength: 0.6,
  defaultInformationExtracted: 0.7,
  createdAt: 1,
  updatedAt: 1,
});

const Host = ({
  library,
  initialMounts = [],
  canEdit = true,
}: {
  library: VibeLibrary;
  initialMounts?: VibeMount[];
  canEdit?: boolean;
}) => {
  const [params, setParams] = useState<NAIParams>({ ...baseParams, vibes: initialMounts });
  return (
    <>
      <ChainEditorVibePanel
        params={params}
        setParams={setParams}
        canEdit={canEdit}
        markChange={vi.fn()}
        notify={vi.fn()}
        library={library}
      />
      <output data-testid="params-state">{JSON.stringify(params)}</output>
    </>
  );
};

describe('ChainEditorVibePanel', () => {
  it('导入文件后写入本地库、自动挂载并允许切换参数', async () => {
    const user = userEvent.setup();
    const library = new VibeLibrary(`NAI_Vibe_UI_${crypto.randomUUID()}`);
    render(<Host library={library} />);

    const file = new File([JSON.stringify({
      identifier: 'novelai-vibe-transfer',
      thumbnail: 'THUMB',
      comment: JSON.stringify({ strength: 0.6, information_extracted: 0.7 }),
      encodings: {
        v4full: {
          low: { encoding: 'LOW', params: { information_extracted: 0.4 } },
          normal: { encoding: 'NORMAL', params: { information_extracted: 0.7 } },
        },
      },
    })], '水彩.naiv4vibe', { type: 'application/json' });

    await user.upload(screen.getByLabelText('导入 Vibe 文件'), file);

    expect(await screen.findByText('水彩')).toBeInTheDocument();
    await expect.poll(() => library.list()).toHaveLength(1);
    expect(screen.getByTestId('params-state')).toHaveTextContent('"strength":0.6');

    fireEvent.change(screen.getByLabelText('水彩 Strength'), { target: { value: '0.4' } });
    await user.selectOptions(screen.getByLabelText('水彩 Information Extracted'), '0.4');

    await waitFor(() => {
      expect(screen.getByTestId('params-state')).toHaveTextContent('"strength":0.4');
      expect(screen.getByTestId('params-state')).toHaveTextContent('"informationExtracted":0.4');
    });
  });

  it('Strength 合计超限时展示阻断提示', async () => {
    const library = new VibeLibrary(`NAI_Vibe_UI_${crypto.randomUUID()}`);
    await library.put(makePreset('水彩'));
    await library.put(makePreset('线稿'));

    render(<Host
      library={library}
      initialMounts={[
        { vibeId: '水彩', name: '水彩', strength: 0.7, informationExtracted: 0.7 },
        { vibeId: '线稿', name: '线稿', strength: 0.5, informationExtracted: 0.7 },
      ]}
    />);

    expect(await screen.findByText(/Strength 合计不能超过 1/)).toBeInTheDocument();
  });

  it('连续导入默认 strength 时自动压到合计不超过 1', async () => {
    const user = userEvent.setup();
    const library = new VibeLibrary(`NAI_Vibe_UI_${crypto.randomUUID()}`);
    render(<Host library={library} />);

    const makeFile = (name: string, id: string) => new File([JSON.stringify({
      id,
      identifier: 'novelai-vibe-transfer',
      comment: JSON.stringify({ strength: 0.6, information_extracted: 0.7 }),
      encodings: {
        v4full: {
          normal: { encoding: `${id}_ENC`, params: { information_extracted: 0.7 } },
        },
      },
    })], name, { type: 'application/json' });

    await user.upload(screen.getByLabelText('导入 Vibe 文件'), makeFile('水彩.naiv4vibe', 'id-a'));
    expect(await screen.findByText('水彩')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('导入 Vibe 文件'), makeFile('线稿.naiv4vibe', 'id-b'));
    expect(await screen.findByText('线稿')).toBeInTheDocument();

    await waitFor(() => {
      const state = JSON.parse(screen.getByTestId('params-state').textContent || '{}');
      const total = (state.vibes || []).reduce((sum: number, item: { strength: number }) => sum + item.strength, 0);
      expect(total).toBeLessThanOrEqual(1 + 1e-6);
      expect(state.vibes).toHaveLength(2);
      expect(state.vibes[1].strength).toBeCloseTo(0.4, 5);
    });
  });

  it('本地库缺失时禁用参数控件', async () => {
    const library = new VibeLibrary(`NAI_Vibe_UI_${crypto.randomUUID()}`);

    render(<Host
      library={library}
      initialMounts={[
        { vibeId: 'missing', name: '失踪', strength: 0.6, informationExtracted: 0.7 },
      ]}
    />);

    expect(await screen.findByText(/本地库中已不存在/)).toBeInTheDocument();
    expect(screen.getByLabelText('失踪 Strength')).toBeDisabled();
    expect(screen.getByLabelText('失踪 Information Extracted')).toBeDisabled();
  });

  it('从挂载列表移除时保留本地库内容', async () => {
    const user = userEvent.setup();
    const library = new VibeLibrary(`NAI_Vibe_UI_${crypto.randomUUID()}`);
    await library.put(makePreset('水彩'));

    render(<Host
      library={library}
      initialMounts={[
        { vibeId: '水彩', name: '水彩', strength: 0.6, informationExtracted: 0.7 },
      ]}
    />);

    await user.click(await screen.findByRole('button', { name: '移除水彩' }));

    expect(screen.getByTestId('params-state')).toHaveTextContent('"vibes":[]');
    await expect.poll(() => library.list()).toHaveLength(1);
  });

  it('可从本地库挂载，并在删除库项时同步移除挂载', async () => {
    const user = userEvent.setup();
    const library = new VibeLibrary(`NAI_Vibe_UI_${crypto.randomUUID()}`);
    await library.put(makePreset('水彩'));
    vi.stubGlobal('confirm', () => true);

    render(<Host library={library} />);
    await user.click(screen.getByRole('button', { name: '本地库' }));
    await user.click(await screen.findByRole('button', { name: '挂载' }));

    expect(screen.getByTestId('params-state')).toHaveTextContent('"vibeId":"水彩"');

    await user.click(screen.getByRole('button', { name: '删除水彩' }));

    await waitFor(() => expect(screen.getByTestId('params-state')).toHaveTextContent('"vibes":[]'));
    await expect.poll(() => library.list()).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('只读 Chain 仅展示挂载并禁用所有编辑入口', async () => {
    const library = new VibeLibrary(`NAI_Vibe_UI_${crypto.randomUUID()}`);
    await library.put(makePreset('水彩'));

    render(<Host
      library={library}
      canEdit={false}
      initialMounts={[
        { vibeId: '水彩', name: '水彩', strength: 0.6, informationExtracted: 0.7 },
      ]}
    />);

    expect(await screen.findByText('水彩')).toBeInTheDocument();
    expect(screen.queryByLabelText('导入 Vibe 文件')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '本地库' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '移除水彩' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('水彩 Strength')).toBeDisabled();
    expect(screen.getByLabelText('水彩 Information Extracted')).toBeDisabled();
  });
});
