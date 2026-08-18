import {
  darken,
  ensureContrast,
  ensureOnBg,
  lighten,
  luminance,
  mix,
  rgba,
} from './colorMath';

export type ThemeMode = 'light' | 'dark';
export type ThemeVars = Record<string, string>;

function pickAccent(colors: readonly string[]): string {
  const sorted = [...colors].sort((a, b) => luminance(a) - luminance(b));
  return sorted[0];
}

export function buildThemeVars(colors: readonly string[], mode: ThemeMode = 'light'): ThemeVars {
  const [c1, c2, c3, c4] = colors;
  const byLum = [...colors].sort((a, b) => luminance(a) - luminance(b));
  const darkest = byLum[0];
  const lightest = byLum[byLum.length - 1];
  const accent0 = pickAccent(colors);
  const midTone = byLum[Math.min(1, byLum.length - 1)];
  const soft = byLum[Math.min(2, byLum.length - 1)] || c3;
  const light = lightest;
  const dark = mode === 'dark';

  let ink = darken(mix(darkest, '#3a3630', 0.35), 0.12);
  let paper = lighten(mix(light, '#f0ebe4', 0.4), 0.12);
  if (dark) {
    paper = mix(darken(darkest, 0.68), '#141210', 0.5);
    ink = lighten(mix(light, '#f4efe8', 0.4), 0.18);
  }
  const cream = dark ? mix(paper, '#2a2622', 0.35) : lighten(paper, 0.35);
  const paperDeep = dark ? darken(paper, 0.12) : mix(light, soft, 0.28);
  let mute = mix(ink, paper, dark ? 0.38 : 0.32);
  let faint = mix(ink, paper, dark ? 0.5 : 0.46);
  mute = ensureOnBg(mute, paper, 4.5);
  faint = ensureOnBg(faint, paper, 3.5);
  const inkSoft = mix(ink, paper, 0.18);

  let btnLite = darken(accent0, 0.05);
  let btnDeep = darken(accent0, 0.25);
  const creamText = '#fffaf6';
  const liteGuard = ensureContrast(btnLite, creamText, 4.5);
  btnLite = liteGuard.bg;
  const deepGuard = ensureContrast(btnDeep, liteGuard.fg, 4.5);
  btnDeep = deepGuard.bg;
  const btnFg = liteGuard.fg;
  const accent = btnLite;

  const g = (a: string, b: string, c: string) =>
    `linear-gradient(155deg, ${a} 0%, ${b} 48%, ${c} 100%)`;

  return {
    '--c1': c1,
    '--c2': c2,
    '--c3': c3,
    '--c4': c4,
    '--ink': ink,
    '--ink-soft': inkSoft,
    '--mute': mute,
    '--faint': faint,
    '--line': rgba(ink, dark ? 0.18 : 0.12),
    '--line-strong': rgba(ink, dark ? 0.32 : 0.24),
    '--paper': paper,
    '--paper-deep': paperDeep,
    '--cream': cream,
    '--blush': c2,
    '--sage': c3,
    '--clay': c1,
    '--mist': c4,
    '--mauve': c2,
    '--olive': c3,
    '--accent': accent,
    '--accent-2': darken(accent, 0.12),
    '--accent-soft': lighten(accent, 0.28),
    '--accent-light': lighten(accent, 0.45),
    '--accent-wash': rgba(accent, dark ? 0.28 : 0.16),
    '--ok': mix(accent, '#6d8762', 0.45),
    '--glass': rgba(cream, dark ? 0.42 : 0.52),
    '--glass-strong': rgba(cream, dark ? 0.62 : 0.72),
    '--glass-tint': rgba(soft, 0.18),
    '--glass-dark': rgba(ink, 0.55),
    '--sh-1': `0 8px 24px -16px ${rgba(ink, 0.28)}, 0 1px 2px ${rgba(ink, 0.06)}`,
    '--sh-2': `0 24px 48px -28px ${rgba(ink, 0.32)}, 0 4px 14px -8px ${rgba(ink, 0.14)}`,
    '--btn-fg': btnFg,
    '--btn-grad': `linear-gradient(135deg, ${btnLite} 0%, ${btnDeep} 100%)`,
    '--btn-sh': `0 10px 20px -10px ${rgba(accent, 0.5)}`,
    '--mark-grad': `linear-gradient(135deg, ${lighten(c4, 0.1)} 0%, ${soft} 45%, ${midTone} 100%)`,
    '--avatar-grad': `linear-gradient(135deg, ${btnLite}, ${btnDeep})`,
    '--chip-active': rgba(accent, 0.16),
    '--bar-grad': `linear-gradient(90deg, ${btnLite}, ${btnDeep})`,
    '--atm-base': dark
      ? `linear-gradient(165deg, ${paper} 0%, ${mix(paper, c4, 0.18)} 40%, ${mix(paper, c2, 0.16)} 100%)`
      : `linear-gradient(165deg, ${cream} 0%, ${lighten(c4, 0.25)} 36%, ${lighten(c3, 0.22)} 70%, ${lighten(c2, 0.28)} 100%)`,
    '--atm-1': dark ? mix(c3, paper, 0.55) : lighten(c3, 0.15),
    '--atm-2': dark ? mix(c2, paper, 0.55) : lighten(c2, 0.1),
    '--atm-3': dark ? mix(c4, paper, 0.55) : lighten(c4, 0.12),
    '--atm-4': soft,
    '--canvas-grad': `linear-gradient(155deg, ${lighten(c4, 0.08)} 0%, ${c3} 40%, ${c2} 72%, ${c1} 100%)`,
    '--focus-ring': darken(accent, 0.12),
    '--selection': rgba(accent, 0.32),
    '--g1': g(c4, c3, c2),
    '--g2': g(c3, c2, c1),
    '--g3': g(c2, c3, c4),
    '--g4': g(c1, c2, c3),
    '--g5': g(c3, c4, c2),
    '--g6': g(c2, c4, c1),
    '--seg-base': mix(c1, cream, 0.78),
    '--seg-pre': mix(c3, cream, 0.76),
    '--seg-subject': mix(c2, cream, 0.76),
    '--seg-post': mix(c4, cream, 0.76),
    '--seg-neg': mix('#b07a72', cream, 0.82),
  };
}
