import { describe, expect, it } from 'vitest';
import type { NAIParams, ResolvedVibe } from '../types';
import { buildGenerationPayload } from './naiPayload';

const params: NAIParams = {
  width: 832,
  height: 1216,
  steps: 28,
  scale: 5,
  sampler: 'k_euler_ancestral',
  seed: -1,
  qualityToggle: false,
  ucPreset: 4,
  cfgRescale: 0,
};

describe('buildGenerationPayload', () => {
  it('没有 Vibe 时保持旧请求且不发送 reference 字段', () => {
    const payload = buildGenerationPayload('1girl', 'bad anatomy', params);

    expect(payload.input).toBe('1girl');
    expect(payload.parameters.negative_prompt).toBe('bad anatomy');
    expect(payload.parameters.seed).toBeUndefined();
    expect(payload.parameters.reference_image_multiple).toBeUndefined();
    expect(payload.parameters.reference_strength_multiple).toBeUndefined();
    expect(payload.parameters.reference_information_extracted_multiple).toBeUndefined();
  });

  it('按挂载顺序发送双 Vibe 的编码、Strength 与 IE', () => {
    const vibes: ResolvedVibe[] = [
      {
        vibeId: 'one',
        name: '水彩',
        encoding: 'ENCODED_ONE',
        strength: 0.6,
        informationExtracted: 0.7,
      },
      {
        vibeId: 'two',
        name: '线稿',
        encoding: 'ENCODED_TWO',
        strength: 0.4,
        informationExtracted: 0.5,
      },
    ];

    const payload = buildGenerationPayload('1girl', '', params, vibes);

    expect(payload.parameters.reference_image_multiple).toEqual(['ENCODED_ONE', 'ENCODED_TWO']);
    expect(payload.parameters.reference_strength_multiple).toEqual([0.6, 0.4]);
    expect(payload.parameters.reference_information_extracted_multiple).toEqual([0.7, 0.5]);
  });

  it('保留现有角色提示、随机种子和 Variety+ 行为', () => {
    const payload = buildGenerationPayload('2girls', '', {
      ...params,
      seed: 42,
      variety: true,
      useCoords: true,
      characters: [{ id: 'a', prompt: 'girl, blue hair', x: 0.2, y: 0.5 }],
    });

    expect(payload.parameters.seed).toBe(42);
    expect(payload.parameters.skip_cfg_above_sigma).toBe(58);
    expect(payload.parameters.v4_prompt.caption.char_captions).toEqual([
      { char_caption: 'girl, blue hair', centers: [{ x: 0.2, y: 0.5 }] },
    ]);
    expect(payload.parameters.v4_negative_prompt.caption.char_captions).toEqual([
      { char_caption: '', centers: [{ x: 0.2, y: 0.5 }] },
    ]);
  });

  it('缺 model 时仍发 V4.5，V5 透明与流式写入对应字段', () => {
    const legacy = buildGenerationPayload('1girl', '', params);
    expect(legacy.model).toBe('nai-diffusion-4-5-full');
    expect(legacy.parameters.straight_alpha).toBeUndefined();
    expect(legacy.parameters.stream).toBeUndefined();

    const v5 = buildGenerationPayload('1girl', '', {
      ...params,
      model: 'nai-diffusion-5-full',
      stream: true,
      transparent: true,
      alphaMode: 'straight',
    });
    expect(v5.model).toBe('nai-diffusion-5-full');
    expect(v5.parameters.stream).toBe('sse');
    expect(v5.parameters.straight_alpha).toBe(true);
    expect(v5.parameters.tag_hint_transparent_background).toBe(true);
    expect(v5.input).toContain('transparent background');

    const premul = buildGenerationPayload('1girl', '', {
      ...params,
      model: 'nai-diffusion-5-full',
      transparent: true,
      alphaMode: 'premultiplied',
    });
    expect(premul.parameters.straight_alpha).toBe(false);

    const locked = buildGenerationPayload('1girl', '', {
      ...params,
      model: 'nai-diffusion-4-5-full',
      transparent: true,
    });
    expect(locked.parameters.straight_alpha).toBeUndefined();
    expect(locked.input).toBe('1girl');
  });
});
