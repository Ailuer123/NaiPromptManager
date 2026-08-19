// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NAIParams } from '../types';
import { VibeLibrary } from '../services/vibeLibrary';
import { ChainEditorVibePanel } from './ChainEditorVibePanel';

afterEach(cleanup);

const Host = ({ library }: { library: VibeLibrary }) => {
  const [params, setParams] = useState<NAIParams>({
    width: 832, height: 1216, steps: 28, scale: 5, sampler: 'k_euler_ancestral', vibes: [],
  });
  return (
    <>
      <ChainEditorVibePanel
        params={params}
        setParams={setParams}
        canEdit
        markChange={vi.fn()}
        notify={vi.fn()}
        library={library}
      />
      <output data-testid="params-state">{JSON.stringify(params)}</output>
    </>
  );
};

const vibe = (id: string, encoding: string) => ({
  id,
  identifier: 'novelai-vibe-transfer',
  comment: JSON.stringify({ strength: 0.6, information_extracted: 0.7 }),
  encodings: {
    v4full: { normal: { encoding, params: { information_extracted: 0.7 } } },
  },
});

describe('ChainEditorVibePanel vibe groups', () => {
  it('导入 vibebundle 时作为一组挂载，而不是拆成多条', async () => {
    const user = userEvent.setup();
    const library = new VibeLibrary(`NAI_Vibe_Group_${crypto.randomUUID()}`);
    render(<Host library={library} />);

    const file = new File([JSON.stringify({
      vibes: [vibe('id-a', 'ENC_A'), vibe('id-b', 'ENC_B')],
    })], '组合.naiv4vibebundle', { type: 'application/json' });

    await user.upload(screen.getByLabelText('导入 Vibe 文件'), file);

    expect(await screen.findByText('组合')).toBeInTheDocument();
    expect(screen.getByText(/组 · 2 个/)).toBeInTheDocument();
    await expect.poll(() => library.list()).toHaveLength(1);

    await waitFor(() => {
      const state = JSON.parse(screen.getByTestId('params-state').textContent || '{}');
      expect(state.vibes).toHaveLength(1);
      expect(state.vibes[0].name).toBe('组合');
    });
  });

  it('一次选择多个文件会全部写入本地库', async () => {
    const user = userEvent.setup();
    const library = new VibeLibrary(`NAI_Vibe_Multi_${crypto.randomUUID()}`);
    render(<Host library={library} />);

    const makeFile = (name: string, id: string) => new File([JSON.stringify({
      id,
      identifier: 'novelai-vibe-transfer',
      comment: JSON.stringify({ strength: 0.6, information_extracted: 0.7 }),
      encodings: { v4full: { normal: { encoding: `${id}_ENC`, params: { information_extracted: 0.7 } } } },
    })], name, { type: 'application/json' });

    await user.upload(
      screen.getByLabelText('导入 Vibe 文件'),
      [makeFile('a.naiv4vibe', 'id-a'), makeFile('b.naiv4vibe', 'id-b')],
    );

    await expect.poll(() => library.list()).toHaveLength(2);
  });

  it('本地库弹层可通过关闭按钮关掉', async () => {
    const user = userEvent.setup();
    const library = new VibeLibrary(`NAI_Vibe_Lib_${crypto.randomUUID()}`);
    render(<Host library={library} />);

    await user.click(screen.getByRole('button', { name: '本地库' }));
    expect(screen.getByRole('dialog', { name: 'Vibe 本地库' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '关闭 Vibe 本地库' }));
    expect(screen.queryByRole('dialog', { name: 'Vibe 本地库' })).not.toBeInTheDocument();
  });
});
