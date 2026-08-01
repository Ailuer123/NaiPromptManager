import { describe, expect, it } from 'vitest';
import type { VibeMount, VibePreset } from '../types';
import {
  clampMountStrength,
  resolveVibeMounts,
  tryAppendVibeMount,
  validateVibeMounts,
} from './vibeRules';

const preset: VibePreset = {
  id: 'vibe-1',
  name: '水彩',
  encodings: [
    { model: 'v4curated', informationExtracted: 0.4, encoding: 'CURATED_LOW' },
    { model: 'v4full', informationExtracted: 0.4, encoding: 'FULL_LOW' },
    { model: 'v4full', informationExtracted: 0.7, encoding: 'FULL_DEFAULT' },
  ],
  defaultStrength: 0.6,
  defaultInformationExtracted: 0.7,
  createdAt: 1,
  updatedAt: 1,
};

const mount = (overrides: Partial<VibeMount> = {}): VibeMount => ({
  vibeId: 'vibe-1',
  name: '水彩',
  strength: 0.6,
  informationExtracted: 0.7,
  ...overrides,
});

describe('validateVibeMounts', () => {
  it('接受空挂载', () => {
    expect(validateVibeMounts([])).toBeNull();
  });

  it('允许总 Strength 超过 1（仅软提示，不硬拦）', () => {
    expect(validateVibeMounts([
      mount({ vibeId: 'one', strength: 0.6 }),
      mount({ vibeId: 'two', strength: 0.5 }),
    ])).toBeNull();
  });

  it('阻止超过 4 个挂载', () => {
    const mounts = Array.from({ length: 5 }, (_, index) => mount({ vibeId: `${index}` }));
    expect(validateVibeMounts(mounts)).toContain('最多挂载 4 个');
  });
});

describe('tryAppendVibeMount', () => {
  it('按默认 strength 挂载，不因合计接近 1 而压缩', () => {
    const result = tryAppendVibeMount(
      [mount({ vibeId: 'one', strength: 0.7 })],
      { ...preset, id: 'vibe-2', name: '线稿', defaultStrength: 0.6 },
    );
    expect(result).toEqual({
      mounts: [
        { vibeId: 'one', name: '水彩', strength: 0.7, informationExtracted: 0.7 },
        { vibeId: 'vibe-2', name: '线稿', strength: 0.6, informationExtracted: 0.7 },
      ],
    });
  });

  it('Strength 合计已满时仍可继续挂载', () => {
    const result = tryAppendVibeMount(
      [mount({ vibeId: 'one', strength: 1 })],
      { ...preset, id: 'vibe-2', name: '线稿', defaultStrength: 0.6 },
    );
    expect(result).toEqual({
      mounts: [
        { vibeId: 'one', name: '水彩', strength: 1, informationExtracted: 0.7 },
        { vibeId: 'vibe-2', name: '线稿', strength: 0.6, informationExtracted: 0.7 },
      ],
    });
  });

  it('重复挂载时拒绝', () => {
    expect(tryAppendVibeMount([mount()], preset)).toEqual({
      error: 'Vibe「水彩」已挂载',
    });
  });
});

describe('clampMountStrength', () => {
  it('允许把某一项 strength 调到使合计超过 1，仅钳制单项 0–1', () => {
    const mounts = [
      mount({ vibeId: 'one', strength: 0.6 }),
      mount({ vibeId: 'two', name: '线稿', strength: 0.3 }),
    ];
    expect(clampMountStrength(mounts, 1, 0.9)).toBeCloseTo(0.9, 5);
    expect(clampMountStrength(mounts, 1, 1.2)).toBeCloseTo(1, 5);
    expect(clampMountStrength(mounts, 1, -0.1)).toBeCloseTo(0, 5);
  });
});

describe('resolveVibeMounts', () => {
  it('按精确 IE 档位解析并优先使用 v4full 编码', () => {
    expect(resolveVibeMounts([mount({ informationExtracted: 0.4 })], [preset])).toEqual([
      {
        vibeId: 'vibe-1',
        name: '水彩',
        strength: 0.6,
        informationExtracted: 0.4,
        encoding: 'FULL_LOW',
      },
    ]);
  });

  it('本地库缺少挂载项时拒绝生成', () => {
    expect(() => resolveVibeMounts([mount()], [])).toThrow('本地库中不存在');
  });

  it('没有精确 IE 档位时拒绝生成', () => {
    expect(() => resolveVibeMounts([mount({ informationExtracted: 0.5 })], [preset]))
      .toThrow('没有 IE 0.5 的预编码档位');
  });
});
