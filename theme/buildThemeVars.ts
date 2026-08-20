import {
  contrastRatio,
  darken,
  ensureContrast,
  ensureOnBg,
  lighten,
  luminance,
  mix,
  pickHueAccent,
  relLuminance,
  rgba,
} from './colorMath';

function ensureBgForText(bg: string, fg: string, min: number): string {
  if (contrastRatio(fg, bg) >= min) return bg;
  const lightenBg = relLuminance(fg) < relLuminance(bg);
  for (let t = 0.04; t <= 0.85; t += 0.04) {
    const next = lightenBg ? lighten(bg, t) : darken(bg, t);
    if (contrastRatio(fg, next) >= min) return next;
  }
  return lightenBg ? lighten(bg, 0.72) : darken(bg, 0.72);
}

export type ThemeMode = 'light' | 'dark';
export type ThemeVars = Record<string, string>;
export type BuildThemeOpts = { flat?: boolean };

export function buildThemeVars(
  colors: readonly string[],
  mode: ThemeMode = 'light',
  opts: BuildThemeOpts = {},
): ThemeVars {
  const [c1, c2, c3, c4] = colors;
  const byLum = [...colors].sort((a, b) => luminance(a) - luminance(b));
  const darkest = byLum[0];
  const lightest = byLum[byLum.length - 1];
  const nextLight = byLum[Math.max(0, byLum.length - 2)];
  const hue = pickHueAccent(colors);
  const deep = darkest === hue ? darken(hue, 0.16) : darkest;
  const dark = mode === 'dark';
  const flat = !!opts.flat;

  let paper = mix(lightest, nextLight, 0.24);
  let cream = mix(lightest, '#ffffff', 0.22);
  let paperDeep = mix(paper, nextLight, 0.42);
  let ink = deep;

  if (flat && !dark) {
    paper = '#ffffff';
    cream = '#ffffff';
    paperDeep = '#f3f4f6';
    ink = '#111827';
  } else if (flat && dark) {
    paper = '#111827';
    cream = '#1f2937';
    paperDeep = '#030712';
    ink = '#e5e7eb';
  } else if (dark) {
    paper = mix(darken(deep, 0.58), darken(hue, 0.7), 0.38);
    cream = mix(paper, hue, 0.1);
    paperDeep = darken(paper, 0.12);
    ink = mix(lighten(hue, 0.52), mix(lightest, '#efe8df', 0.4), 0.38);
  }

  ink = ensureOnBg(ink, paper, dark ? 5.5 : 4.5);
  const inkSoft = mix(ink, paper, dark ? 0.08 : 0.14);
  let mute = mix(ink, hue, dark ? 0.16 : 0.22);
  mute = mix(mute, paper, dark ? 0.12 : 0.22);
  let faint = mix(ink, paper, dark ? 0.34 : 0.4);
  mute = ensureOnBg(mute, paper, 4.5);
  faint = ensureOnBg(faint, paper, 3.5);

  const accent = hue;
  const accent2 = ensureOnBg(dark ? mix(hue, lightest, 0.18) : deep, paper, 4.5);
  const creamText = '#fffaf6';
  const brightFace = mix(accent, cream, dark ? 0.12 : 0.2);
  const useInkOnWash = contrastRatio(brightFace, creamText) < 4.5;
  const btnGuard = useInkOnWash
    ? ensureContrast(mix(accent, cream, dark ? 0.36 : 0.26), ink, 4.5)
    : { bg: brightFace, fg: creamText };
  const btnFace = btnGuard.bg;
  const btnFg = btnGuard.fg;
  const liteTry = mix(btnFace, cream, 0.14);
  const btnLite = contrastRatio(liteTry, btnFg) >= 4.5 ? liteTry : btnFace;

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
    '--glass': rgba(mix(cream, dark ? hue : c4, dark ? 0.1 : 0.42), dark ? 0.55 : 0.64),
    '--glass-strong': rgba(mix(cream, dark ? deep : c3, dark ? 0.16 : 0.34), dark ? 0.76 : 0.84),
    '--glass-tint': rgba(accent, 0.18),
    '--glass-dark': rgba(deep, 0.55),
    '--sh-1': `0 8px 24px -16px ${rgba(deep, 0.32)}, 0 1px 2px ${rgba(deep, 0.08)}`,
    '--sh-2': `0 24px 48px -28px ${rgba(deep, 0.36)}, 0 4px 14px -8px ${rgba(deep, 0.16)}`,
    '--btn-fg': btnFg,
    '--btn-grad': `linear-gradient(160deg, ${btnLite} 0%, ${btnFace} 100%)`,
    '--btn-sh': `0 10px 20px -10px ${rgba(accent, 0.42)}`,
    '--mark-grad': `linear-gradient(145deg, ${accent} 0%, ${deep} 100%)`,
    '--avatar-grad': `linear-gradient(145deg, ${accent}, ${deep})`,
    '--chip-active': rgba(accent, 0.22),
    '--bar-grad': `linear-gradient(90deg, ${accent}, ${deep})`,
    '--atm-base': flat
      ? paper
      : dark
        ? `linear-gradient(165deg, ${paper} 0%, ${mix(paper, hue, 0.07)} 52%, ${paper} 100%)`
        : `linear-gradient(165deg, ${cream} 0%, ${mix(c4, c3, 0.35)} 42%, ${mix(c3, c2, 0.28)} 100%)`,
    '--atm-1': flat ? paper : dark ? mix(hue, paper, 0.84) : c3,
    '--atm-2': flat ? paper : dark ? mix(c2, paper, 0.88) : c2,
    '--atm-3': flat ? paper : dark ? mix(c3, paper, 0.9) : mix(c2, c4, 0.35),
    '--atm-4': flat ? paper : dark ? mix(c4, paper, 0.92) : mix(c2, c3, 0.4),
    '--canvas-grad': flat
      ? (dark ? `linear-gradient(155deg, ${cream} 0%, ${paper} 100%)` : 'linear-gradient(155deg, #f3f4f6 0%, #e5e7eb 100%)')
      : `linear-gradient(155deg, ${mix(c4, c3, 0.3)} 0%, ${mix(c3, c2, 0.45)} 100%)`,
    '--focus-ring': dark ? mix(hue, lightest, 0.12) : accent2,
    '--selection': rgba(accent, 0.34),
    '--g1': g(c4, c3, c2),
    '--g2': g(c3, c2, c1),
    '--g3': g(c2, c3, c4),
    '--g4': g(c1, c2, c3),
    '--g5': g(c3, c4, c2),
    '--g6': g(c2, c4, c1),
    '--seg-base': ensureBgForText(mix(c1, cream, dark ? 0.55 : 0.72), ink, 4.5),
    '--seg-pre': ensureBgForText(mix(c3, cream, dark ? 0.52 : 0.68), ink, 4.5),
    '--seg-subject': ensureBgForText(mix(c2, cream, dark ? 0.5 : 0.66), ink, 4.5),
    '--seg-post': ensureBgForText(mix(c4, cream, dark ? 0.54 : 0.7), ink, 4.5),
    '--seg-neg': ensureBgForText(mix('#c45c58', cream, dark ? 0.58 : 0.82), ink, 4.5),
  };
}
