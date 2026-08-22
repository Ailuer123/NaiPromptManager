// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { HelpTip } from './HelpTip';

afterEach(cleanup);

describe('HelpTip', () => {
  it('点击问号才显示说明，再点关闭', async () => {
    const user = userEvent.setup();
    render(
      <HelpTip label="透明模式说明">
        <span>Straight（直通）</span>
      </HelpTip>,
    );

    const mark = screen.getByRole('button', { name: '透明模式说明' });
    expect(screen.queryByRole('tooltip')).toBeNull();

    await user.click(mark);
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Straight（直通）');
    expect(tip).toHaveClass('is-open');

    await user.click(mark);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
