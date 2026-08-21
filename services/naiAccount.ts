import { OPUS_V5_IMAGES_PER_PERCENT } from './naiModels';

export interface NaiUsage {
  percent: number;
  isNegative: boolean;
  timeUntilNextPercent: number;
}

export interface NaiSubscription {
  tier: number;
  active: boolean;
  anlas: number;
  usage?: NaiUsage;
}

export interface BatteryEstimate {
  remainingImages: number;
  refillPctPerDay: number;
  refillImagesPerDay: number;
}

export function parseSubscription(raw: Record<string, unknown>): NaiSubscription {
  const steps = (raw.trainingStepsLeft ?? {}) as Record<string, unknown>;
  const fixed = Number(steps.fixedTrainingStepsLeft) || 0;
  const purchased = Number(steps.purchasedTrainingSteps) || 0;
  const usageRaw = raw.usage as Record<string, unknown> | undefined;
  const usage = usageRaw && typeof usageRaw.percent === 'number'
    ? {
      percent: usageRaw.percent,
      isNegative: Boolean(usageRaw.isNegative),
      timeUntilNextPercent: Number(usageRaw.timeUntilNextPercent) || 0,
    }
    : undefined;
  return {
    tier: Number(raw.tier) || 0,
    active: Boolean(raw.active),
    anlas: fixed + purchased,
    usage,
  };
}

export function estimateBattery(usage: NaiUsage): BatteryEstimate {
  const remainingImages = Math.round(usage.percent * OPUS_V5_IMAGES_PER_PERCENT);
  const refillPctPerDay = usage.timeUntilNextPercent > 0 ? 86400 / usage.timeUntilNextPercent : 0;
  return {
    remainingImages,
    refillPctPerDay,
    refillImagesPerDay: Math.round(Math.round(refillPctPerDay) * OPUS_V5_IMAGES_PER_PERCENT),
  };
}
