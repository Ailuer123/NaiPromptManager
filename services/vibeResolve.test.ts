import { describe, expect, it } from 'vitest';
import type { VibePreset } from '../types';
import { isVibeGroup, resolveVibeMounts } from './vibeResolve';

const member = (id: string, encoding: string, ie = 0.7): NonNullable<VibePreset['members']>[number] => ({
  id,
  name: id,
  encodings: [{ model: 'v4full', informationExtracted: ie, encoding }],
  defaultStrength: 0.5,
  defaultInformationExtracted: ie,
});

const group: VibePreset = {
  id: 'grp',
  name: '组合',
  encodings: [{ model: 'v4full', informationExtracted: 0.7, encoding: 'FIRST' }],
  members: [member('a', 'ENC_A', 0.4), member('b', 'ENC_B', 0.7)],
  defaultStrength: 0.6,
  defaultInformationExtracted: 0.4,
  createdAt: 1,
  updatedAt: 1,
};

describe('resolveVibeMounts groups', () => {
  it('识别 Vibe 组', () => {
    expect(isVibeGroup(group)).toBe(true);
    expect(isVibeGroup({ ...group, members: undefined })).toBe(false);
  });

  it('挂载组时按组成员展开编码，Strength 用组滑条', () => {
    expect(resolveVibeMounts(
      [{ vibeId: 'grp', name: '组合', strength: 0.8, informationExtracted: 0.4 }],
      [group],
    )).toEqual([
      { vibeId: 'grp::a', name: 'a', strength: 0.8, informationExtracted: 0.4, encoding: 'ENC_A' },
      { vibeId: 'grp::b', name: 'b', strength: 0.8, informationExtracted: 0.7, encoding: 'ENC_B' },
    ]);
  });
});
