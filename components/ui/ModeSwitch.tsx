import React from 'react';
import { useTheme, type ThemePreference } from '../../theme';

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

export function ModeSwitch({ className }: { className?: string }) {
  const { preference, setMode } = useTheme();

  return (
    <div className={className ? `mode-switch ${className}` : 'mode-switch'} role="radiogroup" aria-label="外观">
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
