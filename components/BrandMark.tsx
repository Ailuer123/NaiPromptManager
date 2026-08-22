import React, { useId } from 'react';
import type { ThemeMode } from '../theme/buildThemeVars';
import { cx } from './ui/cx';

const FAVICON_COLORS: Record<ThemeMode, Record<string, string>> = {
  light: {
    from: '#0284C7',
    mid: '#4F46E5',
    to: '#DB2777',
    ring: 'rgba(79,70,229,0.38)',
    ringOuter: 'rgba(79,70,229,0.22)',
    tick: '#4F46E5',
    starA: '#DB2777',
    starB: '#0284C7',
    sheen: 'rgba(255,255,255,0.55)',
    core: '#FFFFFF',
  },
  dark: {
    from: '#38BDF8',
    mid: '#818CF8',
    to: '#EC4899',
    ring: 'rgba(129,140,248,0.4)',
    ringOuter: 'rgba(129,140,248,0.25)',
    tick: '#818CF8',
    starA: '#EC4899',
    starB: '#38BDF8',
    sheen: 'rgba(255,255,255,0.4)',
    core: '#FFFFFF',
  },
};

/** Standalone markup for favicon (cannot inherit page CSS variables). */
export function grimoireSvgMarkup(mode: ThemeMode, gradientId = 'grimoire-grad'): string {
  const c = FAVICON_COLORS[mode];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">`,
    `<defs><linearGradient id="${gradientId}" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">`,
    `<stop offset="0%" stop-color="${c.from}"/>`,
    `<stop offset="50%" stop-color="${c.mid}"/>`,
    `<stop offset="100%" stop-color="${c.to}"/>`,
    `</linearGradient></defs>`,
    `<circle cx="50" cy="50" r="44" stroke="${c.ringOuter}" stroke-width="1" stroke-dasharray="2 4"/>`,
    `<circle cx="50" cy="50" r="38" stroke="${c.ring}" stroke-width="1.5"/>`,
    `<path d="M50 6v6M50 88v6M6 50h6M88 50h6" stroke="${c.tick}" stroke-width="2" stroke-linecap="square"/>`,
    `<circle cx="26" cy="26" r="1.5" fill="${c.starA}"/>`,
    `<circle cx="74" cy="26" r="1.5" fill="${c.starB}"/>`,
    `<circle cx="26" cy="74" r="1.5" fill="${c.starB}"/>`,
    `<circle cx="74" cy="74" r="1.5" fill="${c.starA}"/>`,
    `<path d="M30 68V32h10l20 30V32h10v36H60L40 38v30H30z" fill="url(#${gradientId})" stroke="${c.sheen}" stroke-width="1"/>`,
    `<circle cx="50" cy="50" r="2.5" fill="${c.core}"/>`,
    `</svg>`,
  ].join('');
}

export function applyFavicon(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = `data:image/svg+xml,${encodeURIComponent(grimoireSvgMarkup(mode))}`;
}

export type BrandMarkProps = {
  className?: string;
  title?: string;
  animated?: boolean;
};

export function BrandMark({ className, title = '符文矩阵', animated = false }: BrandMarkProps) {
  const uid = useId().replace(/:/g, '');
  const gid = `grimoire-grad-${uid}`;

  return (
    <span className={cx('brand-mark', animated && 'motion-deep-stream', className)}>
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={title}>
        <title>{title}</title>
        {animated ? (
          <>
            {/* 外环虚线 (28s 极慢旋转) */}
            <circle className="ring-outer" cx="50" cy="50" r="44" stroke="rgba(129,140,248,0.35)" strokeWidth="1.2" />
            {/* 内环 (呼吸微光) */}
            <circle className="ring-inner" cx="50" cy="50" r="38" stroke="#38BDF8" strokeWidth="1.5" />
            {/* 四向十字刻度 */}
            <path d="M50 6v6M50 88v6M6 50h6M88 50h6" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="square" />
            {/* 四角星点 (微光脉冲) */}
            <circle className="star-dot" cx="26" cy="26" r="1.8" fill="#EC4899" />
            <circle className="star-dot" cx="74" cy="26" r="1.8" fill="#38BDF8" />
            <circle className="star-dot" cx="26" cy="74" r="1.8" fill="#38BDF8" />
            <circle className="star-dot" cx="74" cy="74" r="1.8" fill="#EC4899" />
            {/* N 字静态深邃暗底 (保证发光电流在暗底上高对比度巡航) */}
            <path d="M30 68V32h10l20 30V32h10v36H60L40 38v30H30z" fill="#0c1220" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {/* 慢速平稳电流光流 (9s 周期) */}
            <path
              className="glyph-trace"
              d="M30 68V32h10l20 30V32h10v36H60L40 38v30H30z"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* 核心恒星原点 */}
            <circle cx="50" cy="50" r="2.5" fill="#FFFFFF" />
          </>
        ) : (
          <>
            <defs>
              <linearGradient id={gid} x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="var(--logo-from, #38BDF8)" />
                <stop offset="50%" stopColor="var(--logo-mid, #818CF8)" />
                <stop offset="100%" stopColor="var(--logo-to, #EC4899)" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" stroke="var(--logo-ring-outer, rgba(129,140,248,0.3))" strokeWidth="1" strokeDasharray="2 4" />
            <circle cx="50" cy="50" r="38" stroke="var(--logo-ring, rgba(129,140,248,0.5))" strokeWidth="1.5" />
            <path d="M50 6v6M50 88v6M6 50h6M88 50h6" stroke="var(--logo-tick, #818CF8)" strokeWidth="2" strokeLinecap="square" />
            <circle cx="26" cy="26" r="1.5" fill="var(--logo-star-a, #EC4899)" />
            <circle cx="74" cy="26" r="1.5" fill="var(--logo-star-b, #38BDF8)" />
            <circle cx="26" cy="74" r="1.5" fill="var(--logo-star-b, #38BDF8)" />
            <circle cx="74" cy="74" r="1.5" fill="var(--logo-star-a, #EC4899)" />
            <path
              d="M30 68V32h10l20 30V32h10v36H60L40 38v30H30z"
              fill={`url(#${gid})`}
              stroke="var(--logo-sheen, rgba(255,255,255,0.45))"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="2.5" fill="var(--logo-core, #FFFFFF)" />
          </>
        )}
      </svg>
    </span>
  );
}
