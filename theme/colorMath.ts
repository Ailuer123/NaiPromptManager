export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}

export function darken(hex: string, t: number): string {
  return mix(hex, '#000000', t);
}

export function lighten(hex: string, t: number): string {
  return mix(hex, '#ffffff', t);
}

/** Naive sRGB luminance — used only to sort swatches, not for WCAG contrast. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Channel spread. Higher = more identity color, lower = gray. */
export function chroma(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

/** Identity hue: most chromatic swatch that is not near-white paper. */
export function pickHueAccent(colors: readonly string[]): string {
  const pool = colors.filter((c) => luminance(c) < 0.85);
  const src = pool.length > 0 ? pool : colors;
  return [...src].sort((a, b) => chroma(b) - chroma(a))[0];
}

export function relLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: string, b: string): number {
  const L1 = relLuminance(a);
  const L2 = relLuminance(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

export function ensureContrast(bg: string, fg: string, min: number): { bg: string; fg: string } {
  if (contrastRatio(bg, fg) >= min) return { bg, fg };
  for (let t = 0.04; t <= 0.72; t += 0.04) {
    const face = darken(bg, t);
    if (contrastRatio(face, fg) >= min) return { bg: face, fg };
  }
  const inkFg = '#2e2b27';
  for (let t = 0.08; t <= 0.7; t += 0.08) {
    const light = lighten(bg, t);
    if (contrastRatio(light, inkFg) >= min) return { bg: light, fg: inkFg };
  }
  return { bg: darken(bg, 0.55), fg: '#fffaf6' };
}

export function ensureOnBg(fg: string, bg: string, min: number): string {
  if (contrastRatio(fg, bg) >= min) return fg;
  for (let t = 0.05; t <= 0.85; t += 0.05) {
    const d = darken(fg, t);
    if (contrastRatio(d, bg) >= min) return d;
  }
  for (let t = 0.05; t <= 0.85; t += 0.05) {
    const l = lighten(fg, t);
    if (contrastRatio(l, bg) >= min) return l;
  }
  return darken(fg, 0.7);
}

export function rgba(hex: string, a: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
