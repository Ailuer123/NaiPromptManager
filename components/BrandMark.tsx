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

type BrandMarkProps = {
  className?: string;
  title?: string;
};

export function BrandMark({ className, title = '符文矩阵' }: BrandMarkProps) {
  const uid = useId().replace(/:/g, '');
  const gid = `grimoire-grad-${uid}`;

  return (
    <span className={cx('brand-mark', className)}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={title}>
        <title>{title}</title>
        <defs>
          <linearGradient id={gid} x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--logo-from)" />
            <stop offset="50%" stopColor="var(--logo-mid)" />
            <stop offset="100%" stopColor="var(--logo-to)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="44" stroke="var(--logo-ring-outer)" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="50" cy="50" r="38" stroke="var(--logo-ring)" strokeWidth="1.5" />
        <path d="M50 6v6M50 88v6M6 50h6M88 50h6" stroke="var(--logo-tick)" strokeWidth="2" strokeLinecap="square" />
        <circle cx="26" cy="26" r="1.5" fill="var(--logo-star-a)" />
        <circle cx="74" cy="26" r="1.5" fill="var(--logo-star-b)" />
        <circle cx="26" cy="74" r="1.5" fill="var(--logo-star-b)" />
        <circle cx="74" cy="74" r="1.5" fill="var(--logo-star-a)" />
        <path
          d="M30 68V32h10l20 30V32h10v36H60L40 38v30H30z"
          fill={`url(#${gid})`}
          stroke="var(--logo-sheen)"
          strokeWidth="1"
        />
        <circle cx="50" cy="50" r="2.5" fill="var(--logo-core)" />
      </svg>
    </span>
  );
}
