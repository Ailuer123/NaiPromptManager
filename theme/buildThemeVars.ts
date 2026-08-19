import {
  darken,
  ensureContrast,
  ensureOnBg,
  luminance,
  mix,
  pickHueAccent,
  rgba,
} from './colorMath';

export type ThemeMode = 'light' | 'dark';
export type ThemeVars = Record<string, string>;

export function buildThemeVars(colors: readonly string[], mode: ThemeMode = 'light'): ThemeVars {
  const [c1, c2, c3, c4] = colors;
  const byLum = [...colors].sort((a, b) => luminance(a) - luminance(b));
  const darkest = byLum[0];
  const lightest = byLum[byLum.length - 1];
  const nextLight = byLum[Math.max(0, byLum.length - 2)];
  const nextDark = byLum[Math.min(1, byLum.length - 1)];
  const hue = pickHueAccent(colors);
  const deep = darkest === hue ? darken(hue, 0.16) : darkest;
  const dark = mode === 'dark';

  let paper = mix(lightest, nextLight, 0.24);
  let cream = mix(lightest, '#ffffff', 0.22);
  let paperDeep = mix(paper, nextLight, 0.42);
  let ink = deep;

  if (dark) {
    paper = mix(darken(deep, 0.38), '#0c1016', 0.32);
    cream = mix(paper, nextDark, 0.16);
    paperDeep = darken(paper, 0.1);
    ink = mix(lightest, '#f3f6fb', 0.18);
  }

  ink = ensureOnBg(ink, paper, 4.5);
  const inkSoft = mix(ink, paper, 0.14);
  let mute = mix(ink, hue, 0.22);
  mute = mix(mute, paper, dark ? 0.28 : 0.22);
  let faint = mix(ink, paper, dark ? 0.46 : 0.4);
  mute = ensureOnBg(mute, paper, 4.5);
  faint = ensureOnBg(faint, paper, 3.5);

  const accent = hue;
  const accent2 = ensureOnBg(deep, paper, 4.5);
  const creamText = '#fffaf6';
  const btnGuard = ensureContrast(deep, creamText, 4.5);
  const btnFace = btnGuard.bg;
  const btnFg = btnGuard.fg;
  const btnLite = ensureContrast(mix(accent, btnFace, 0.42), btnFg, 4.5).bg;

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
    '--line': rgba(deep, dark ? 0.28 : 0.16),
    '--line-strong': rgba(deep, dark ? 0.42 : 0.28),
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
    '--accent-2': accent2,
    '--accent-soft': mix(accent, cream, 0.42),
    '--accent-light': mix(accent, cream, 0.68),
    '--accent-wash': rgba(accent, dark ? 0.32 : 0.22),
    '--ok': mix(c3, '#5d8a55', 0.35),
    '--glass': rgba(mix(cream, c4, dark ? 0.28 : 0.42), dark ? 0.42 : 0.64),
    '--glass-strong': rgba(mix(cream, c3, dark ? 0.22 : 0.34), dark ? 0.6 : 0.84),
    '--glass-tint': rgba(accent, 0.18),
    '--glass-dark': rgba(deep, 0.55),
    '--sh-1': `0 8px 24px -16px ${rgba(deep, 0.32)}, 0 1px 2px ${rgba(deep, 0.08)}`,
    '--sh-2': `0 24px 48px -28px ${rgba(deep, 0.36)}, 0 4px 14px -8px ${rgba(deep, 0.16)}`,
    '--btn-fg': btnFg,
    '--btn-grad': `linear-gradient(160deg, ${btnLite} 0%, ${btnFace} 100%)`,
    '--btn-sh': `0 10px 20px -10px ${rgba(deep, 0.5)}`,
    '--mark-grad': `linear-gradient(145deg, ${accent} 0%, ${deep} 100%)`,
    '--avatar-grad': `linear-gradient(145deg, ${accent}, ${deep})`,
    '--chip-active': rgba(accent, 0.22),
    '--bar-grad': `linear-gradient(90deg, ${accent}, ${deep})`,
    '--atm-base': dark
      ? `linear-gradient(165deg, ${paper} 0%, ${mix(paper, c2, 0.28)} 48%, ${mix(paper, c3, 0.22)} 100%)`
      : `linear-gradient(165deg, ${cream} 0%, ${mix(c4, c3, 0.35)} 42%, ${mix(c3, c2, 0.28)} 100%)`,
    '--atm-1': dark ? mix(c2, paper, 0.4) : c3,
    '--atm-2': dark ? mix(c3, paper, 0.35) : c2,
    '--atm-3': dark ? mix(c4, paper, 0.4) : mix(c2, c4, 0.35),
    '--atm-4': dark ? mix(accent, paper, 0.3) : mix(c2, c3, 0.4),
    '--canvas-grad': `linear-gradient(155deg, ${mix(c4, c3, 0.3)} 0%, ${mix(c3, c2, 0.45)} 100%)`,
    '--focus-ring': accent2,
    '--selection': rgba(accent, 0.34),
    '--g1': g(c4, c3, c2),
    '--g2': g(c3, c2, c1),
    '--g3': g(c2, c3, c4),
    '--g4': g(c1, c2, c3),
    '--g5': g(c3, c4, c2),
    '--g6': g(c2, c4, c1),
    '--seg-base': mix(c1, cream, 0.72),
    '--seg-pre': mix(c3, cream, 0.68),
    '--seg-subject': mix(c2, cream, 0.66),
    '--seg-post': mix(c4, cream, 0.7),
    '--seg-neg': mix('#b07a72', cream, 0.82),
  };
}
