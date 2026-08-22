import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('Deeix font stack', () => {
  it('index.html 加载 Inter / Space Grotesk / Syne / JetBrains Mono', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8');
    expect(html).toContain('family=Inter:');
    expect(html).toContain('family=JetBrains+Mono:');
    expect(html).toContain('family=Space+Grotesk:');
    expect(html).toContain('family=Syne:');
    expect(html).not.toContain('Manrope');
    expect(html).toContain("sans: ['Inter'");
    expect(html).toContain('JetBrains Mono');
    expect(html).toContain('Space Grotesk');
    expect(html).toContain('Syne');
  });

  it('全局 --font / --mono 与 display/pixel 指向同一套字体', () => {
    const css = readFileSync(resolve(root, 'index.css'), 'utf8');
    expect(css).toMatch(/--font:\s*Inter,/);
    expect(css).toMatch(/--mono:\s*"JetBrains Mono"/);
    expect(css).toMatch(/--font-display:\s*"Space Grotesk"/);
    expect(css).toMatch(/--font-pixel:\s*Syne,/);
    expect(css).not.toContain('Manrope');
    expect(css).not.toMatch(/\.motion-deep-stream\s*\{[^}]*width:\s*100%\s*!important/);
  });

  it('符文矩阵电流动效不被 reduced-motion 全局规则掐死', () => {
    const css = readFileSync(resolve(root, 'index.css'), 'utf8');
    expect(css).toMatch(/\.motion-deep-stream \.glyph-trace\s*\{[^}]*animation:\s*deepStreamLoop 9s linear infinite\s*!important/);
    expect(css).toMatch(/\.motion-deep-stream \.ring-outer\s*\{[^}]*animation:\s*spinClockwise 28s linear infinite\s*!important/);
    expect(css).toMatch(/\.motion-deep-stream \.ring-inner\s*\{[^}]*animation:\s*breatheGlow 4\.5s ease-in-out infinite alternate\s*!important/);
    expect(css).toMatch(/\.motion-deep-stream \.star-dot\s*\{[^}]*animation:\s*starGentlePulse 3s ease-in-out infinite alternate\s*!important/);
  });
});
