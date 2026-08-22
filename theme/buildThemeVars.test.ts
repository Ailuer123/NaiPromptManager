import { describe, expect, it } from 'vitest';
import { THEME_CATALOG } from './palettes';
import { buildThemeVars } from './buildThemeVars';
import { contrastRatio, hexToRgb, pickHueAccent, relLuminance } from './colorMath';

const AA = 4.5;
const FAINT_MIN = 3.5;
const LIGHT_IDS = ['peach', 'provence'] as const;

function hexStops(value: string): string[] {
  return value.match(/#[0-9a-fA-F]{6}/g) ?? [];
}

function assertButtonFace(vars: Record<string, string>) {
  const stops = hexStops(vars['--btn-grad']);
  expect(stops.length).toBeGreaterThanOrEqual(1);
  for (const stop of stops) {
    expect(contrastRatio(stop, vars['--btn-fg'])).toBeGreaterThanOrEqual(AA);
  }
}

describe('THEME_CATALOG', () => {
  it('有 8 套色板且默认冷若冰霜', () => {
    expect(THEME_CATALOG).toHaveLength(8);
    expect(THEME_CATALOG.map((t) => t.id)).toEqual([
      'bingshuang', 'emerald', 'yunding', 'ximei', 'jiaotang', 'provence', 'peach', 'classic',
    ]);
    expect(THEME_CATALOG[0].id).toBe('bingshuang');
    expect(THEME_CATALOG.find((t) => t.id === 'peach')?.name).toBe('白桃气泡');
  });
});

describe('buildThemeVars contrast guard', () => {
  it.each(LIGHT_IDS)('%s 亮色板按钮最亮端对 --btn-fg ≥ 4.5', (id) => {
    const palette = THEME_CATALOG.find((t) => t.id === id);
    expect(palette).toBeDefined();
    assertButtonFace(buildThemeVars(palette!.colors, 'light'));
  });

  it('默认冷若冰霜 mute 对 paper ≥ 4.5', () => {
    const frost = THEME_CATALOG.find((t) => t.id === 'bingshuang')!;
    const vars = buildThemeVars(frost.colors, 'light');
    expect(contrastRatio(vars['--mute'], vars['--paper'])).toBeGreaterThanOrEqual(AA);
  });

  it('白桃气泡：accent 是嫩粉，不是大红', () => {
    const peach = THEME_CATALOG.find((t) => t.id === 'peach')!;
    const vars = buildThemeVars(peach.colors, 'light');
    const accent = hexToRgb(vars['--accent']);
    const paper = hexToRgb(vars['--paper']);
    expect(accent.r).toBeGreaterThan(accent.g);
    expect(accent.b).toBeGreaterThan(accent.g);
    expect(accent.r - Math.min(accent.g, accent.b)).toBeLessThan(80);
    expect(paper.r).toBeGreaterThan(paper.b);
    expect(paper.r).toBeGreaterThan(paper.g);
  });

  it('普罗旺斯：accent 是雾薰衣草，不是褐灰', () => {
    const provence = THEME_CATALOG.find((t) => t.id === 'provence')!;
    const vars = buildThemeVars(provence.colors, 'light');
    const accent = hexToRgb(vars['--accent']);
    const paper = hexToRgb(vars['--paper']);
    expect(accent.b).toBeGreaterThan(accent.r);
    expect(accent.b).toBeGreaterThan(accent.g);
    expect(accent.b - Math.min(accent.r, accent.g)).toBeLessThan(80);
    expect(paper.b).toBeGreaterThanOrEqual(paper.r);
  });

  it('经典靛蓝：accent 走重构前 indigo，亮色纸面是白', () => {
    const classic = THEME_CATALOG.find((t) => t.id === 'classic')!;
    expect(classic.name).toBe('经典靛蓝');
    expect(classic.flat).toBe(true);
    expect(pickHueAccent(classic.colors).toLowerCase()).toBe('#4f46e5');
    const vars = buildThemeVars(classic.colors, 'light', { flat: true });
    const accent = hexToRgb(vars['--accent']);
    expect(vars['--accent'].toLowerCase()).toBe('#4f46e5');
    expect(vars['--paper'].toLowerCase()).toBe('#ffffff');
    expect(vars['--cream'].toLowerCase()).toBe('#ffffff');
    expect(vars['--atm-base'].toLowerCase()).toBe('#ffffff');
    expect(relLuminance(vars['--paper'])).toBeGreaterThan(0.95);
    expect(accent.b).toBeGreaterThan(accent.r);
    expect(accent.b).toBeGreaterThan(accent.g);
  });

  it('绿野仙踪：accent 是初音青绿，不是荧光绿', () => {
    const emerald = THEME_CATALOG.find((t) => t.id === 'emerald')!;
    const vars = buildThemeVars(emerald.colors, 'light');
    const accent = hexToRgb(vars['--accent']);
    const paper = hexToRgb(vars['--paper']);
    expect(accent.g).toBeGreaterThan(accent.r);
    expect(accent.b).toBeGreaterThan(accent.r);
    expect(Math.abs(accent.g - accent.b)).toBeLessThan(30);
    expect(Math.max(accent.r, accent.g, accent.b) - Math.min(accent.r, accent.g, accent.b)).toBeLessThan(80);
    expect(paper.g).toBeGreaterThan(paper.r);
  });

  it('冷若冰霜：paper / accent / ink 走色卡冷色，不混成暖灰', () => {
    const frost = THEME_CATALOG.find((t) => t.id === 'bingshuang')!;
    const vars = buildThemeVars(frost.colors, 'light');
    const paper = hexToRgb(vars['--paper']);
    const accent = hexToRgb(vars['--accent']);
    const ink = hexToRgb(vars['--ink']);
    expect(pickHueAccent(frost.colors).toLowerCase()).toBe('#78abcf');
    expect(vars['--accent'].toLowerCase()).toBe('#78abcf');
    expect(paper.b).toBeGreaterThan(paper.r);
    expect(accent.b).toBeGreaterThan(accent.r + 20);
    expect(ink.b).toBeGreaterThanOrEqual(ink.r);
    expect(vars['--cream']).not.toBe(vars['--paper']);
    const cream = hexToRgb(vars['--cream']);
    const paperDeep = hexToRgb(vars['--paper-deep']);
    expect(cream.b).toBeGreaterThan(cream.r);
    expect(paperDeep.b).toBeGreaterThan(paperDeep.r);
    const glass = vars['--glass'].match(/rgba\((\d+),(\d+),(\d+)/);
    expect(glass).toBeTruthy();
    expect(Number(glass![3])).toBeGreaterThan(Number(glass![1]));
    const btnStops = hexStops(vars['--btn-grad']);
    const face = hexToRgb(btnStops[btnStops.length - 1]);
    expect(face.b).toBeGreaterThanOrEqual(face.r);
  });

  it('冷若冰霜暗色：纸面够暗，焦点色不是一片浅灰', () => {
    const frost = THEME_CATALOG.find((t) => t.id === 'bingshuang')!;
    const vars = buildThemeVars(frost.colors, 'dark');
    const paper = hexToRgb(vars['--paper']);
    const ink = hexToRgb(vars['--ink']);
    const accent2 = hexToRgb(vars['--accent-2']);
    expect(relLuminance(vars['--paper'])).toBeLessThan(0.08);
    expect(paper.b).toBeGreaterThan(paper.r);
    expect(relLuminance(vars['--ink'])).toBeLessThan(0.85);
    expect(contrastRatio(vars['--ink'], vars['--paper'])).toBeGreaterThanOrEqual(5.5);
    expect(Math.max(accent2.r, accent2.g, accent2.b) - Math.min(accent2.r, accent2.g, accent2.b)).toBeGreaterThan(30);
    expect(ink.b).toBeGreaterThanOrEqual(ink.r);
    const atm = hexToRgb(vars['--atm-1']);
    expect((atm.r + atm.g + atm.b) / 3).toBeLessThan(80);
  });

  describe.each(THEME_CATALOG)('$id $name', (palette) => {
    const light = buildThemeVars(palette.colors, 'light', { flat: palette.flat });
    const dark = buildThemeVars(palette.colors, 'dark', { flat: palette.flat });

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
      expect(contrastRatio(dark['--ink'], dark['--paper'])).toBeGreaterThanOrEqual(5);
      expect(relLuminance(dark['--ink'])).toBeGreaterThan(relLuminance(dark['--paper']));
      expect(relLuminance(dark['--paper'])).toBeLessThan(0.14);
      expect(relLuminance(dark['--ink'])).toBeLessThan(0.88);
    });

    it('accent 用色卡 identity，不兑成暖灰', () => {
      expect(light['--accent'].toLowerCase()).toBe(pickHueAccent(palette.colors).toLowerCase());
      expect(dark['--accent'].toLowerCase()).toBe(pickHueAccent(palette.colors).toLowerCase());
    });

    it('导出 --g1…--g6 为 CSS 渐变字符串', () => {
      for (const key of ['--g1', '--g2', '--g3', '--g4', '--g5', '--g6'] as const) {
        expect(light[key]).toMatch(/^linear-gradient\(/);
        expect(dark[key]).toMatch(/^linear-gradient\(/);
      }
    });

    it('分段预览底对 ink ≥ 4.5', () => {
      const keys = ['--seg-base', '--seg-pre', '--seg-subject', '--seg-post', '--seg-neg'] as const;
      for (const key of keys) {
        expect(contrastRatio(light['--ink'], light[key])).toBeGreaterThanOrEqual(AA);
        expect(contrastRatio(dark['--ink'], dark[key])).toBeGreaterThanOrEqual(AA);
      }
    });
  });
});
