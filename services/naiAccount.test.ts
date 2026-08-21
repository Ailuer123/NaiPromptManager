import { describe, expect, it } from 'vitest';
import { estimateBattery, parseSubscription } from './naiAccount';

describe('parseSubscription', () => {
  it('把 trainingStepsLeft 合成 Anlas，并保留电量字段', () => {
    const sub = parseSubscription({
      tier: 3,
      active: true,
      trainingStepsLeft: { fixedTrainingStepsLeft: 9988, purchasedTrainingSteps: 12 },
      usage: { percent: 97, isNegative: false, timeUntilNextPercent: 7888 },
    });
    expect(sub).toEqual({
      tier: 3,
      active: true,
      anlas: 10000,
      usage: { percent: 97, isNegative: false, timeUntilNextPercent: 7888 },
    });
  });

  it('没有 usage 时不捏造电量', () => {
    const sub = parseSubscription({
      tier: 1,
      active: true,
      trainingStepsLeft: { fixedTrainingStepsLeft: 1000, purchasedTrainingSteps: 0 },
    });
    expect(sub.usage).toBeUndefined();
    expect(sub.anlas).toBe(1000);
  });
});

describe('estimateBattery', () => {
  it('用官网 97% / 11%/天 校准张数', () => {
    const est = estimateBattery({ percent: 97, isNegative: false, timeUntilNextPercent: 7888 });
    expect(est.remainingImages).toBe(1678);
    expect(est.refillPctPerDay).toBeCloseTo(11, 0);
    expect(est.refillImagesPerDay).toBe(190);
  });
});
