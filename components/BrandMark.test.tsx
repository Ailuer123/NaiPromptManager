// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { applyFavicon, BrandMark, grimoireSvgMarkup } from './BrandMark';

afterEach(cleanup);

describe('BrandMark', () => {
  it('输出 viewBox 0 0 100 100 的符文矩阵', () => {
    render(<BrandMark />);
    const svg = screen.getByRole('img', { name: '符文矩阵' });
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
    expect(svg.querySelector('linearGradient')).toBeTruthy();
    expect(svg.querySelector('path[d="M30 68V32h10l20 30V32h10v36H60L40 38v30H30z"]')).toBeTruthy();
  });

  it('同页两枚 LOGO 的渐变 id 不冲突', () => {
    render(
      <>
        <BrandMark />
        <BrandMark />
      </>,
    );
    const ids = [...document.querySelectorAll('.brand-mark linearGradient')].map((el) => el.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});

describe('grimoireSvgMarkup', () => {
  it('保持 100×100 viewBox，亮暗色板不同', () => {
    const light = grimoireSvgMarkup('light');
    const dark = grimoireSvgMarkup('dark');
    expect(light).toContain('viewBox="0 0 100 100"');
    expect(light).toContain('#4F46E5');
    expect(dark).toContain('#38BDF8');
    expect(dark).toContain('#EC4899');
  });

  it('applyFavicon 把标签页图标换成当前模式', () => {
    applyFavicon('dark');
    const href = document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ?? '';
    expect(decodeURIComponent(href)).toContain('#38BDF8');
    applyFavicon('light');
    const next = document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ?? '';
    expect(decodeURIComponent(next)).toContain('#4F46E5');
  });
});
