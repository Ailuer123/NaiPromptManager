import { buildThemeVars, type ThemeMode, type ThemeVars } from './buildThemeVars';
import { DEFAULT_THEME_ID, themeById, type ThemeId } from './palettes';

export const THEME_ID_STORAGE_KEY = 'nai_atelier_theme';
export const THEME_MODE_STORAGE_KEY = 'nai_theme';

export function resolveMode(mode: string | null | undefined): ThemeMode {
  return mode === 'dark' ? 'dark' : 'light';
}

export function readStoredTheme(): { themeId: ThemeId; mode: ThemeMode } {
  let saved: string = DEFAULT_THEME_ID;
  let mode: ThemeMode = 'light';
  try {
    if (typeof localStorage !== 'undefined') {
      saved = localStorage.getItem(THEME_ID_STORAGE_KEY) || DEFAULT_THEME_ID;
      mode = resolveMode(localStorage.getItem(THEME_MODE_STORAGE_KEY));
    }
  } catch {
    // private mode / missing storage
  }
  return { themeId: themeById(saved).id, mode };
}

function persistTheme(themeId: ThemeId, mode: ThemeMode) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(THEME_ID_STORAGE_KEY, themeId);
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore quota / private mode
  }
}

export function applyTheme(id: string, mode: ThemeMode): ThemeVars {
  const theme = themeById(id);
  const resolvedMode = resolveMode(mode);
  const vars = buildThemeVars(theme.colors, resolvedMode);
  persistTheme(theme.id, resolvedMode);

  if (typeof document === 'undefined') return vars;

  const root = document.documentElement;
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-mode', resolvedMode);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  return vars;
}
