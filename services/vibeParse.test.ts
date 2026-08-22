import { describe, expect, it } from 'vitest';
import { parseVibeFileContent } from './vibeParse';

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

describe('parseVibeFileContent groups', () => {
  it('vibebundle / vibes[] 解析成单个 Vibe 组，而不是拆成多条', () => {
    const first = makeSingleVibe();
    const second = makeSingleVibe();
    Object.assign(first, { id: 'id-a' });
    Object.assign(second, {
      id: 'id-b',
      thumbnail: 'SECOND_THUMBNAIL',
      comment: JSON.stringify({ strength: 0.3, information_extracted: 0.7 }),
      importInfo: { ...second.importInfo, strength: 0.3 },
    });

    const [preset] = parseVibeFileContent(
      JSON.stringify({
        identifier: 'novelai-vibe-transfer-bundle',
        version: 1,
        vibes: [first, second],
      }),
      '雪夜灯.naiv4vibebundle.json',
    );

    expect(preset.name).toBe('雪夜灯');
    expect(preset.members).toHaveLength(2);
    expect(preset.members?.map(member => member.id)).toEqual(['id-a', 'id-b']);
    expect(preset.members?.[1].thumbnailUrl).toContain('SECOND_THUMBNAIL');
    expect(preset.members?.[1].defaultStrength).toBe(0.3);
  });

  it('json 里只有一个 vibe 时仍按单项导入', () => {
    const [preset] = parseVibeFileContent(
      JSON.stringify({ vibes: [Object.assign(makeSingleVibe(), { id: 'only' })] }),
      '单条.json',
    );
    expect(preset.members).toBeUndefined();
    expect(preset.id).toBe('only');
    expect(preset.name).toBe('单条');
  });
});
