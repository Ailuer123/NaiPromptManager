export const FONT_SCALE_STORAGE_KEY = 'nai_font_scale';

export type FontScaleId = 'sm' | 'md' | 'lg' | 'xl';

export const FONT_SCALE_OPTIONS = [
  { id: 'sm', label: '小号 Aa', factor: 0.88 },
  { id: 'md', label: '标准 Aa', factor: 1 },
  { id: 'lg', label: '中号 Aa', factor: 1.12 },
  { id: 'xl', label: '大号 Aa', factor: 1.24 },
] as const;

export const DEFAULT_FONT_SCALE: FontScaleId = 'md';

function getLocalStorage(): Storage | null {
  try {
    return (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

export function parseFontScale(raw: string | null | undefined): FontScaleId {
  if (raw === 'sm' || raw === 'lg' || raw === 'xl') return raw;
  return DEFAULT_FONT_SCALE;
}

export function fontScaleFactor(id: FontScaleId): number {
  const match = FONT_SCALE_OPTIONS.find((opt) => opt.id === id);
  return match ? match.factor : 1;
}

export function readStoredFontScale(): FontScaleId {
  try {
    return parseFontScale(getLocalStorage()?.getItem(FONT_SCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_FONT_SCALE;
  }
}

export function persistFontScale(id: FontScaleId) {
  try {
    getLocalStorage()?.setItem(FONT_SCALE_STORAGE_KEY, parseFontScale(id));
  } catch {
    // ignore quota / private mode
  }
}

export function applyFontScale(id: FontScaleId) {
  const resolved = parseFontScale(id);
  persistFontScale(resolved);
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--font-scale', String(fontScaleFactor(resolved)));
  root.setAttribute('data-font-scale', resolved);
}
