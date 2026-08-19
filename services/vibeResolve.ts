import type { ResolvedVibe, VibeMount, VibePreset } from '../types';
import {
  resolveVibeMounts as resolveSingleMounts,
} from './vibeRules';

export {
  clampMountStrength,
  getMaxStrengthForMount,
  getVibeStrengthTotal,
  isVibeStrengthOverRecommended,
  MAX_MOUNTED_VIBES,
  tryAppendVibeMount,
  validateVibeMounts,
} from './vibeRules';

/** 官方 Image API 最多 16 条 reference。组展开后仍受此限制。 */
export const MAX_REFERENCE_VIBES = 16;

export const isVibeGroup = (preset: VibePreset | undefined): boolean => (
  Array.isArray(preset?.members) && (preset?.members?.length ?? 0) > 0
);

export const resolveVibeMounts = (
  mounts: VibeMount[],
  presets: VibePreset[],
): ResolvedVibe[] => {
  const presetsById = new Map(presets.map(preset => [preset.id, preset]));
  const expandedMounts: VibeMount[] = [];
  const expandedPresets: VibePreset[] = [];

  for (const mount of mounts) {
    const preset = presetsById.get(mount.vibeId);
    if (isVibeGroup(preset) && preset) {
      for (const member of preset.members ?? []) {
        const memberId = `${preset.id}::${member.id}`;
        expandedPresets.push({
          id: memberId,
          name: member.name,
          thumbnailUrl: member.thumbnailUrl,
          encodings: member.encodings,
          defaultStrength: member.defaultStrength,
          defaultInformationExtracted: member.defaultInformationExtracted,
          sourceFilename: preset.sourceFilename,
          createdAt: preset.createdAt,
          updatedAt: preset.updatedAt,
        });
        expandedMounts.push({
          vibeId: memberId,
          name: member.name,
          strength: mount.strength,
          informationExtracted: member.defaultInformationExtracted,
        });
      }
      continue;
    }
    if (preset) expandedPresets.push(preset);
    expandedMounts.push(mount);
  }

  const resolved = resolveSingleMounts(expandedMounts, expandedPresets);
  if (resolved.length > MAX_REFERENCE_VIBES) {
    throw new Error(`Vibe 组展开后超过 ${MAX_REFERENCE_VIBES} 条参考`);
  }
  return resolved;
};
