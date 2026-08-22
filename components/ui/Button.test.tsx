// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './Button';

afterEach(cleanup);

describe('Button', () => {
  it('primary 占用主按钮 class，其它变体不抢渐变', () => {
    const { rerender } = render(<Button>保存</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn', 'btn-primary');

    rerender(<Button variant="secondary">次要</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    expect(screen.getByRole('button')).not.toHaveClass('btn-primary');

    rerender(<Button variant="ghost">幽灵</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-ghost');

    rerender(<Button variant="danger">删除</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });

  it('loading 显示进度条并禁用', () => {
    const { rerender } = render(<Button loading>生成</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('is-busy');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('.gen-meter')).toBeTruthy();
    expect(btn.querySelector('.gen-meter')).not.toHaveClass('is-determinate');

    rerender(<Button loading progress={0.4}>生成</Button>);
    const meter = screen.getByRole('button').querySelector('.gen-meter') as HTMLElement;
    expect(meter).toHaveClass('is-determinate');
    expect(meter.style.width).toBe('40%');
  });
});
