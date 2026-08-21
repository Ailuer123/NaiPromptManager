import React, { useEffect, useState } from 'react';
import { estimateBattery } from '../services/naiAccount';
import { getNaiSubscription, subscribeNaiAccount } from '../services/naiAccountStore';

export const BatteryBar: React.FC = () => {
  const [percent, setPercent] = useState<number | null>(null);
  const [negative, setNegative] = useState(false);
  const [tip, setTip] = useState('');

  useEffect(() => {
    const sync = () => {
      const usage = getNaiSubscription()?.usage;
      if (!usage) {
        setPercent(null);
        setTip('');
        return;
      }
      const est = estimateBattery(usage);
      setPercent(usage.percent);
      setNegative(usage.isNegative || usage.percent <= 0);
      const refill = Math.round(est.refillPctPerDay);
      setTip(
        [
          'Opus 含 V5 普通分辨率、≤28 steps 的免费次数。额度有限、随时间自动回复；用尽后可花 Anlas 继续。',
          `${usage.percent}% 剩余（约 ${est.remainingImages} 张）`,
          `当前回复速度 ${refill}%/天（约 ${est.refillImagesPerDay} 张）`,
        ].join('\n'),
      );
    };
    const unsub = subscribeNaiAccount(sync);
    sync();
    return unsub;
  }, []);

  if (percent === null) return null;
  const fill = Math.max(0, Math.min(100, percent));
  const empty = negative || fill <= 0;

  return (
    <div className="battery-bar" title={tip}>
      <span className="battery-bar-label">V5 电量</span>
      <div
        className={`bar${empty ? ' hot' : fill < 15 ? ' warn' : ''}`}
        role="meter"
        aria-label="V5 电量"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fill}
        aria-valuetext={tip.replace(/\n/g, ' ')}
      >
        <i style={{ width: `${empty ? 0 : fill}%` }} />
      </div>
      <span className="battery-bar-pct">{empty ? 'Anlas' : `${fill}%`}</span>
    </div>
  );
};
