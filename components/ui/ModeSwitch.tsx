import React, { useEffect, useState } from 'react';
import { useTheme, type ThemePreference } from '../../theme';
import { cx } from './cx';

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: React.ReactNode }> = [
  {
    value: 'light',
    label: '亮色',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: '暗色',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 14.6A7 7 0 1 1 9.4 7 5.5 5.5 0 0 0 17 14.6z" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: '随设备',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
];

const COMPACT_MQ = '(max-width: 899px)';

export function nextThemePreference(pref: ThemePreference): ThemePreference {
  if (pref === 'light') return 'dark';
  if (pref === 'dark') return 'system';
  return 'light';
}

function readCompactAppearance(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia(COMPACT_MQ).matches;
  } catch {
    return false;
  }
}

function useCompactAppearance(): boolean {
  const [compact, setCompact] = useState(readCompactAppearance);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(COMPACT_MQ);
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return compact;
}

export function ModeSwitch({ className }: { className?: string }) {
  const { preference, setMode } = useTheme();
  const compact = useCompactAppearance();
  const current = OPTIONS.find((opt) => opt.value === preference) ?? OPTIONS[0];
  const next = OPTIONS.find((opt) => opt.value === nextThemePreference(preference)) ?? OPTIONS[1];

  if (compact) {
    return (
      <button
        type="button"
        className={cx('mode-switch-btn', className)}
        aria-label={`外观：${current.label}，点击切换为${next.label}`}
        title={`外观：${current.label}`}
        onClick={() => setMode(next.value)}
      >
        {current.icon}
      </button>
    );
  }

  return (
    <div className={cx('mode-switch', className)} role="radiogroup" aria-label="外观">
      {OPTIONS.map((opt) => {
        const checked = preference === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={opt.label}
            className={checked ? 'active' : undefined}
            onClick={() => setMode(opt.value)}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
