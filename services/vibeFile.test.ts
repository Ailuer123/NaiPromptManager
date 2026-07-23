import { describe, expect, it } from 'vitest';
import { parseVibeFileContent } from './vibeFile';

const makeSingleVibe = () => ({
  identifier: 'novelai-vibe-transfer',
  image: 'ORIGINAL_IMAGE',
  thumbnail: 'THUMBNAIL_IMAGE',
  comment: JSON.stringify({
    strength: 0.65,
    information_extracted: 0.7,
  }),
  importInfo: {
    model: 'nai-diffusion-4-full',
    strength: 0.65,
    information_extracted: 0.7,
  },
  encodings: {
    v4full: {
      low: {
        encoding: 'ENCODED_LOW',
        params: { information_extracted: 0.4 },
      },
      default: {
        encoding: 'ENCODED_DEFAULT',
        params: { information_extracted: 0.7 },
      },
    },
  },
});

describe('parseVibeFileContent', () => {
  it('解析单个 Vibe 及全部 Information Extracted 档位', () => {
    const [preset] = parseVibeFileContent(
      JSON.stringify(makeSingleVibe()),
      '水彩风格.naiv4vibe',
    );

    expect(preset.name).toBe('水彩风格');
    expect(preset.sourceFilename).toBe('水彩风格.naiv4vibe');
    expect(preset.thumbnailUrl).toBe('data:image/png;base64,THUMBNAIL_IMAGE');
    expect(preset.defaultStrength).toBe(0.65);
    expect(preset.defaultInformationExtracted).toBe(0.7);
    expect(preset.encodings).toEqual([
      {
        model: 'v4full',
        informationExtracted: 0.4,
        encoding: 'ENCODED_LOW',
      },
      {
        model: 'v4full',
        informationExtracted: 0.7,
        encoding: 'ENCODED_DEFAULT',
      },
    ]);
  });

  it('解析 vibes 数组形式的 bundle', () => {
    const first = makeSingleVibe();
    const second = makeSingleVibe();
    second.thumbnail = 'SECOND_THUMBNAIL';
    second.importInfo.strength = 0.3;

    const presets = parseVibeFileContent(
      JSON.stringify({ vibes: [first, second] }),
      '组合.naiv4vibebundle',
    );

    expect(presets).toHaveLength(2);
    expect(presets[0].name).toBe('组合 1');
    expect(presets[1].name).toBe('组合 2');
    expect(presets[1].thumbnailUrl).toContain('SECOND_THUMBNAIL');
  });

  it('拒绝 identifier 不匹配的文件', () => {
    const value = makeSingleVibe();
    value.identifier = 'unknown-format';

    expect(() => parseVibeFileContent(JSON.stringify(value), '错误.naiv4vibe'))
      .toThrow('不是受支持的 NovelAI Vibe 文件');
  });

  it('拒绝没有有效 encoding 的文件', () => {
    const value = makeSingleVibe();
    value.encodings.v4full = {
      broken: {
        encoding: '',
        params: { information_extracted: 0.7 },
      },
    } as unknown as typeof value.encodings.v4full;

    expect(() => parseVibeFileContent(JSON.stringify(value), '空.naiv4vibe'))
      .toThrow('没有可用的预编码 Vibe');
  });

  it('拒绝无法解析的 JSON', () => {
    expect(() => parseVibeFileContent('{bad json', '损坏.naiv4vibe'))
      .toThrow('无法解析 Vibe 文件');
  });

  it('拒绝过大的文件内容', () => {
    expect(() => parseVibeFileContent('x'.repeat(8 * 1024 * 1024 + 1), '巨大.naiv4vibe'))
      .toThrow('Vibe 文件过大');
  });

  it('使用官方 id，并把导入默认 IE 对齐到目标模型的最近真实档位', () => {
    const value = makeSingleVibe();
    value.thumbnail = '';
    value.image = '/9j/JPEG_IMAGE';
    value.importInfo.information_extracted = 0.61;
    value.encodings = {
      v4curated: {
        curated: { encoding: 'CURATED', params: { information_extracted: 0.5 } },
      },
      v4full: {
        full: { encoding: 'FULL', params: { information_extracted: 0.6 } },
      },
    } as unknown as typeof value.encodings;
    Object.assign(value, { id: 'official-stable-id' });

    const [preset] = parseVibeFileContent(JSON.stringify(value), '真实样例.naiv4vibe');

    expect(preset.id).toBe('official-stable-id');
    expect(preset.defaultInformationExtracted).toBe(0.6);
    expect(preset.thumbnailUrl).toBe('data:image/jpeg;base64,/9j/JPEG_IMAGE');
  });
});
