import { buildThemeVars, type ThemeMode, type ThemeVars } from './buildThemeVars';
import { DEFAULT_THEME_ID, themeById, type ThemeId } from './palettes';

export const THEME_ID_STORAGE_KEY = 'nai_atelier_theme';
export const THEME_MODE_STORAGE_KEY = 'nai_theme';

function getLocalStorage(): Storage | null {
  try {
    return (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

export function resolveMode(mode: string | null | undefined): ThemeMode {
  return mode === 'dark' ? 'dark' : 'light';
}

export function readStoredTheme(): { themeId: ThemeId; mode: ThemeMode } {
  let saved: string = DEFAULT_THEME_ID;
  let mode: ThemeMode = 'light';
  try {
    const storage = getLocalStorage();
    if (storage) {
      saved = storage.getItem(THEME_ID_STORAGE_KEY) || DEFAULT_THEME_ID;
      mode = resolveMode(storage.getItem(THEME_MODE_STORAGE_KEY));
    }
  } catch {
    // private mode / missing storage
  }
  return { themeId: themeById(saved).id, mode };
}

function persistThemeId(themeId: ThemeId) {
  try {
    getLocalStorage()?.setItem(THEME_ID_STORAGE_KEY, themeId);
  } catch {
    // ignore quota / private mode
  }
}

export function applyTheme(id: string, mode: ThemeMode): ThemeVars {
  const theme = themeById(id);
  const resolvedMode = resolveMode(mode);
  const vars = buildThemeVars(theme.colors, resolvedMode);
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
