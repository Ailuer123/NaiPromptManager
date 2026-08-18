import { describe, expect, it } from 'vitest';
import { THEME_CATALOG } from './palettes';
import { buildThemeVars } from './buildThemeVars';
import { contrastRatio, relLuminance } from './colorMath';

const AA = 4.5;
const FAINT_MIN = 3.5;
const LIGHT_IDS = ['peach', 'nainai'] as const;

function hexStops(value: string): string[] {
  return value.match(/#[0-9a-fA-F]{6}/g) ?? [];
}

function brightest(hexes: string[]): string {
  return hexes.reduce((a, b) => (relLuminance(a) >= relLuminance(b) ? a : b));
}

function assertButtonFace(vars: Record<string, string>) {
  const stops = hexStops(vars['--btn-grad']);
  expect(stops.length).toBeGreaterThanOrEqual(2);
  expect(contrastRatio(brightest(stops), vars['--btn-fg'])).toBeGreaterThanOrEqual(AA);
}

describe('THEME_CATALOG', () => {
  it('有 17 套色板且默认 oz', () => {
    expect(THEME_CATALOG).toHaveLength(17);
    expect(THEME_CATALOG.map((t) => t.id)).toEqual([
      'yunding', 'lianrong', 'bingshuang', 'naika', 'nainai',
      'wumei', 'oz', 'emerald', 'mizhi', 'peach', 'cheese',
      'ximei', 'jihan', 'jiaotang', 'provence', 'cappuccino', 'luan',
    ]);
  });
});

describe('buildThemeVars contrast guard', () => {
  it.each(LIGHT_IDS)('%s 亮色板按钮最亮端对 --btn-fg ≥ 4.5', (id) => {
    const palette = THEME_CATALOG.find((t) => t.id === id);
    expect(palette).toBeDefined();
    assertButtonFace(buildThemeVars(palette!.colors, 'light'));
  });

  it('oz 默认 mute 对 paper ≥ 4.5', () => {
    const oz = THEME_CATALOG.find((t) => t.id === 'oz')!;
    const vars = buildThemeVars(oz.colors, 'light');
    expect(contrastRatio(vars['--mute'], vars['--paper'])).toBeGreaterThanOrEqual(AA);
  });

  describe.each(THEME_CATALOG)('$id $name', (palette) => {
    const light = buildThemeVars(palette.colors, 'light');
    const dark = buildThemeVars(palette.colors, 'dark');

    it('light：按钮最亮端 / mute / faint 过门槛', () => {
      assertButtonFace(light);
      expect(contrastRatio(light['--mute'], light['--paper'])).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(light['--faint'], light['--paper'])).toBeGreaterThanOrEqual(FAINT_MIN);
      expect(relLuminance(light['--paper'])).toBeGreaterThan(relLuminance(light['--ink']));
    });

    it('dark：ink 与 paper 对调后仍过门槛', () => {
      assertButtonFace(dark);
      expect(contrastRatio(dark['--mute'], dark['--paper'])).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(dark['--faint'], dark['--paper'])).toBeGreaterThanOrEqual(FAINT_MIN);
      expect(contrastRatio(dark['--ink'], dark['--paper'])).toBeGreaterThanOrEqual(AA);
      expect(relLuminance(dark['--ink'])).toBeGreaterThan(relLuminance(dark['--paper']));
    });

    it('导出 --g1…--g6 为 CSS 渐变字符串', () => {
      for (const key of ['--g1', '--g2', '--g3', '--g4', '--g5', '--g6'] as const) {
        expect(light[key]).toMatch(/^linear-gradient\(/);
        expect(dark[key]).toMatch(/^linear-gradient\(/);
      }
    });
  });
});
