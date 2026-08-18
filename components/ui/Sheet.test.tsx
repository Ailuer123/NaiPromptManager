// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sheet } from './Sheet';

afterEach(cleanup);

function Host({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>打开</button>
      <Sheet
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="对话框"
      >
        <button type="button">第一项</button>
        <button type="button">最后一项</button>
      </Sheet>
    </>
  );
}

describe('Sheet', () => {
  it('打开后困住焦点，Esc 关闭并还原焦点', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);

    const opener = screen.getByRole('button', { name: '打开' });
    opener.focus();
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: '对话框' });
    expect(dialog).toHaveClass('open');
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(opener).toHaveFocus();
  });

  it('关闭按钮触发 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="关闭测试">
        内容
      </Sheet>,
    );
    await user.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
