import type { ResolvedVibe, VibeMount, VibePreset } from '../types';

export const MAX_MOUNTED_VIBES = 4;
const EPSILON = 1e-6;

/** 收敛浮点误差到 3 位小数（不钳制上下界，供合计校验使用）。 */
const quantize = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 1000) / 1000;
};

/** 把 strength 限制在 0–1，并收敛浮点误差。 */
const clampUnit = (value: number): number => Math.min(1, Math.max(0, quantize(value)));

export const getVibeStrengthTotal = (mounts: VibeMount[]): number => (
  quantize(mounts.reduce((total, mount) => total + mount.strength, 0))
);

/** Strength 合计是否超出建议值 1（软提示，不阻断）。 */
export const isVibeStrengthOverRecommended = (mounts: VibeMount[]): boolean => (
  getVibeStrengthTotal(mounts) > 1 + EPSILON
);

/** 单项 Strength 上限始终为 1（合计不再硬性封顶）。 */
export const getMaxStrengthForMount = (_mounts: VibeMount[], _index: number): number => 1;

/** 把某一项 strength 钳到 0–1，不再按合计剩余额度压缩。 */
export const clampMountStrength = (
  _mounts: VibeMount[],
  _index: number,
  strength: number,
): number => clampUnit(strength);

/** 尝试把 preset 挂到现有列表；失败返回错误文案，成功返回新列表。 */
export const tryAppendVibeMount = (
  mounts: VibeMount[],
  preset: VibePreset,
): { mounts: VibeMount[] } | { error: string } => {
  if (mounts.some(mount => mount.vibeId === preset.id)) {
    return { error: `Vibe「${preset.name}」已挂载` };
  }
  if (mounts.length >= MAX_MOUNTED_VIBES) {
    return { error: `最多挂载 ${MAX_MOUNTED_VIBES} 个 Vibe` };
  }

  const nextMount: VibeMount = {
    vibeId: preset.id,
    name: preset.name,
    strength: clampUnit(preset.defaultStrength),
    informationExtracted: preset.defaultInformationExtracted,
  };
  const nextMounts = [...mounts, nextMount];
  const validationError = validateVibeMounts(nextMounts);
  if (validationError) return { error: validationError };
  return { mounts: nextMounts };
};

/** 硬校验：数量与单项范围；Strength 合计 > 1 仅作 UI 提示，不在此拦截。 */
export const validateVibeMounts = (mounts: VibeMount[]): string | null => {
  if (mounts.length > MAX_MOUNTED_VIBES) {
    return `最多挂载 ${MAX_MOUNTED_VIBES} 个 Vibe`;
  }

  for (const mount of mounts) {
    if (!Number.isFinite(mount.strength) || mount.strength < 0 || mount.strength > 1) {
      return `Vibe「${mount.name}」的 Strength 必须在 0 到 1 之间`;
    }
    if (
      !Number.isFinite(mount.informationExtracted)
      || mount.informationExtracted < 0
      || mount.informationExtracted > 1
    ) {
      return `Vibe「${mount.name}」的 IE 必须在 0 到 1 之间`;
    }
  }

  return null;
};

export const resolveVibeMounts = (
  mounts: VibeMount[],
  presets: VibePreset[],
): ResolvedVibe[] => {
  const validationError = validateVibeMounts(mounts);
  if (validationError) throw new Error(validationError);

  const presetsById = new Map(presets.map(preset => [preset.id, preset]));
  return mounts.map((mount) => {
    const preset = presetsById.get(mount.vibeId);
    if (!preset) {
      throw new Error(`本地库中不存在 Vibe「${mount.name}」，请重新导入`);
    }

    const candidates = preset.encodings.filter(encoding => (
      Math.abs(encoding.informationExtracted - mount.informationExtracted) < EPSILON
    ));
    const selected = candidates.find(encoding => encoding.model.toLowerCase() === 'v4full')
      ?? candidates[0];
    if (!selected) {
      throw new Error(`Vibe「${mount.name}」没有 IE ${mount.informationExtracted} 的预编码档位`);
    }

    return {
      vibeId: mount.vibeId,
      name: mount.name,
      strength: mount.strength,
      informationExtracted: mount.informationExtracted,
      encoding: selected.encoding,
    };
  });
};
