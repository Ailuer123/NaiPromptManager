// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { FeedbackProvider, useFeedback } from './Feedback';

afterEach(cleanup);

function Host() {
  const { toast, confirm } = useFeedback();
  return (
    <div>
      <button type="button" onClick={() => toast('已保存', 'success')}>成功提示</button>
      <button type="button" onClick={() => toast('失败了', 'error')}>错误提示</button>
      <button
        type="button"
        onClick={async () => {
          const ok = await confirm({ title: '确认删除?', confirmLabel: '删除', tone: 'danger' });
          toast(ok ? '已确认' : '已取消', ok ? 'success' : 'info');
        }}
      >
        打开确认
      </button>
    </div>
  );
}

function renderHost() {
  return render(
    <FeedbackProvider>
      <Host />
    </FeedbackProvider>,
  );
}

describe('Feedback', () => {
  it('成功/错误用 toast，不阻断页面', async () => {
    const user = userEvent.setup();
    renderHost();
    await user.click(screen.getByRole('button', { name: '成功提示' }));
    expect(screen.getByRole('status')).toHaveTextContent('已保存');
    await user.click(screen.getByRole('button', { name: '错误提示' }));
    expect(screen.getByRole('alert')).toHaveTextContent('失败了');
    expect(screen.getByRole('button', { name: '成功提示' })).toBeEnabled();
  });

  it('确认框可取消或确认，点遮罩关闭', async () => {
    const user = userEvent.setup();
    renderHost();
    await user.click(screen.getByRole('button', { name: '打开确认' }));
    const dialog = screen.getByRole('alertdialog', { name: '确认删除?' });
    await user.click(within(dialog).getByRole('button', { name: '取消' }));
    expect(screen.getByText('已取消')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '打开确认' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '删除' }));
    expect(screen.getByText('已确认')).toBeInTheDocument();
  });
});
