import { buildThemeVars, type ThemeMode, type ThemeVars } from './buildThemeVars';
import { DEFAULT_THEME_ID, themeById, type ThemeId } from './palettes';

export const THEME_ID_STORAGE_KEY = 'nai_atelier_theme';
export const THEME_MODE_STORAGE_KEY = 'nai_theme';

export type ThemePreference = 'light' | 'dark' | 'system';

function getLocalStorage(): Storage | null {
  try {
    return (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

export function parsePreference(raw: string | null | undefined): ThemePreference {
  if (raw === 'dark' || raw === 'system') return raw;
  return 'light';
}

export function readSystemDark(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function subscribeSystemDark(onChange: (dark: boolean) => void): () => void {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => onChange(event.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  } catch {
    return () => {};
  }
}

export function resolveMode(
  pref: string | null | undefined,
  systemDark: boolean = readSystemDark(),
): ThemeMode {
  const preference = parsePreference(pref);
  if (preference === 'system') return systemDark ? 'dark' : 'light';
  return preference;
}

export function readStoredTheme(): { themeId: ThemeId; preference: ThemePreference; mode: ThemeMode } {
  let saved: string = DEFAULT_THEME_ID;
  let preference: ThemePreference = 'light';
  try {
    const storage = getLocalStorage();
    if (storage) {
      saved = storage.getItem(THEME_ID_STORAGE_KEY) || DEFAULT_THEME_ID;
      preference = parsePreference(storage.getItem(THEME_MODE_STORAGE_KEY));
    }
  } catch {
    // private mode / missing storage
  }
  return { themeId: themeById(saved).id, preference, mode: resolveMode(preference) };
}

function persistThemeId(themeId: ThemeId) {
  try {
    getLocalStorage()?.setItem(THEME_ID_STORAGE_KEY, themeId);
  } catch {
    // ignore quota / private mode
  }
}

/** Writer for nai_theme. applyTheme must not call this. */
export function persistMode(pref: ThemePreference) {
  try {
    getLocalStorage()?.setItem(THEME_MODE_STORAGE_KEY, parsePreference(pref));
  } catch {
    // ignore quota / private mode
  }
}

export function applyTheme(id: string, mode: ThemeMode): ThemeVars {
  const theme = themeById(id);
  const resolvedMode = mode === 'dark' ? 'dark' : 'light';
  const vars = buildThemeVars(theme.colors, resolvedMode, { flat: theme.flat });
  persistThemeId(theme.id);

  if (typeof document === 'undefined') return vars;

  const root = document.documentElement;
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-mode', resolvedMode);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  return vars;
}
