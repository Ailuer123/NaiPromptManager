// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Inspiration, NAIParams } from '../types';
import { InspirationLightbox } from './InspirationGallery';

afterEach(cleanup);

const params: NAIParams = {
  width: 832,
  height: 1216,
  steps: 28,
  scale: 5,
  sampler: 'k_euler_ancestral',
  seed: 0,
  qualityToggle: true,
  ucPreset: 4,
  variety: true,
};

const item: Inspiration = {
  id: 'insp-1',
  userId: 'u1',
  username: 'admin',
  title: '测试',
  imageUrl: '/api/assets/inspirations/demo.png',
  prompt: '1girl, pale pink long hair, purple hair ribbon',
  params,
  createdAt: 1,
};

function Host({ canEdit = true }: { canEdit?: boolean }) {
  const [lightboxImg, setLightboxImg] = useState({ item, isEditing: false });
  return (
    <InspirationLightbox
      lightboxImg={lightboxImg}
      setLightboxImg={setLightboxImg as React.Dispatch<React.SetStateAction<{ item: Inspiration; isEditing: boolean } | null>>}
      handleSaveEdit={vi.fn()}
      copyPrompt={vi.fn()}
      canEdit={() => canEdit}
      getDownloadFilename={() => 'NAI.png'}
      notify={vi.fn()}
    />
  );
}

describe('InspirationLightbox', () => {
  it('动作按钮两列排布，Prompt 不内嵌在侧栏', () => {
    render(<Host />);

    const actions = document.querySelector('.lbx-actions');
    expect(actions).toBeTruthy();
    expect(actions).toHaveClass('create-form');
    expect(screen.getByRole('button', { name: '导入到编辑器' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '复制 Prompt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '编辑详情' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '下载原图' })).toBeInTheDocument();

    expect(screen.queryByText(/pale pink long hair/)).toBeNull();
    expect(screen.queryByText('一键复制所有参数')).toBeNull();
    expect(screen.getByRole('button', { name: '信息' })).toBeInTheDocument();
  });

  it('点信息弹出整屏参数，可关闭', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.click(screen.getByRole('button', { name: '信息' }));

    const dialog = screen.getByRole('dialog', { name: '信息' });
    expect(dialog).toHaveClass('lbx-info-panel');
    expect(screen.getByText(/pale pink long hair/)).toBeInTheDocument();
    expect(screen.getByText('一键复制所有参数')).toBeInTheDocument();
    expect(screen.getByText('832 × 1216')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '关闭信息' }));
    expect(screen.queryByRole('dialog', { name: '信息' })).toBeNull();
    expect(screen.queryByText(/pale pink long hair/)).toBeNull();
  });
});
