// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Card } from './Card';

afterEach(cleanup);

describe('Card', () => {
  it('根节点不是 button；标题是拉伸链接', () => {
    const onOpen = vi.fn();
    const { container } = render(
      <Card title="雾霾玫瑰" onOpen={onOpen} extra={<button type="button">更多</button>}>
        副文
      </Card>,
    );

    const root = container.querySelector('article.card');
    expect(root).toBeTruthy();
    expect(root).not.toHaveAttribute('role', 'button');
    expect(screen.queryByRole('button', { name: '雾霾玫瑰' })).toBeNull();

    const link = screen.getByRole('link', { name: '雾霾玫瑰' });
    expect(link).toHaveClass('card-link');
    expect(screen.getByRole('button', { name: '更多' })).toBeTruthy();
  });
});
