import { describe, expect, it } from 'vitest';
import { isV5Model, NAI_MODELS, resolveNaiModel, withTransparentTags } from './naiModels';

describe('naiModels', () => {
  it('旧 Chain 缺 model 时保持 V4.5', () => {
    expect(resolveNaiModel({})).toBe(NAI_MODELS.V4_5_FULL);
    expect(isV5Model({})).toBe(false);
    expect(isV5Model({ model: NAI_MODELS.V5_FULL })).toBe(true);
  });

  it('透明标签幂等追加', () => {
    expect(withTransparentTags('1girl')).toBe('1girl, transparent background, has alpha');
    expect(withTransparentTags('1girl, transparent background')).toBe('1girl, transparent background');
  });
});
