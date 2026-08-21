// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LightboxInfo } from './LightboxInfo';

afterEach(cleanup);

describe('LightboxInfo', () => {
  it('关闭时不渲染，打开后可关', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <LightboxInfo open={false} onClose={onClose}>prompt body</LightboxInfo>,
    );
    expect(screen.queryByRole('dialog', { name: '信息' })).toBeNull();

    rerender(
      <LightboxInfo open onClose={onClose}>prompt body</LightboxInfo>,
    );
    expect(screen.getByRole('dialog', { name: '信息' })).toHaveTextContent('prompt body');

    await user.click(screen.getByRole('button', { name: '关闭信息' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
