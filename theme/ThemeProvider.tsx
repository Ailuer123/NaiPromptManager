import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import {
  applyTheme,
  persistMode,
  readStoredTheme,
  readSystemDark,
  resolveMode,
  subscribeSystemDark,
  type ThemePreference,
} from './applyTheme';
import { applyFavicon } from '../components/BrandMark';
import type { ThemeMode } from './buildThemeVars';
import {
  DEFAULT_FONT_SCALE,
  applyFontScale,
  type FontScaleId,
} from './fontScale';
import { themeById, type ThemeId } from './palettes';

type ThemeContextValue = {
  themeId: ThemeId;
  mode: ThemeMode;
  preference: ThemePreference;
  fontScale: FontScaleId;
  setTheme: (id: string) => void;
  setMode: (pref: ThemePreference) => void;
  setFontScale: (id: FontScaleId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ApplyThemeFn = (id: string, nextMode?: ThemePreference) => void;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(readStoredTheme);
  const [themeId, setThemeId] = useState(initial.themeId);
  const [preference, setPreferenceState] = useState<ThemePreference>(initial.preference);
  const [fontScale, setFontScaleState] = useState<FontScaleId>(DEFAULT_FONT_SCALE);
  const [systemDark, setSystemDark] = useState(readSystemDark);
  const mode = resolveMode(preference, systemDark);

  useLayoutEffect(() => {
    applyTheme(themeId, mode);
    persistMode(preference);
    applyFontScale(fontScale);
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.setAttribute('data-theme-pref', preference);
    applyFavicon(mode);
  }, [themeId, mode, preference, fontScale]);

  useLayoutEffect(() => {
    return subscribeSystemDark(setSystemDark);
  }, []);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as Window & { applyTheme?: ApplyThemeFn };
    w.applyTheme = (id, nextMode) => {
      const resolvedId = themeById(id).id;
      setThemeId(resolvedId);
      if (nextMode !== undefined) setPreferenceState(nextMode === 'dark' || nextMode === 'system' ? nextMode : 'light');
    };
    return () => {
      delete w.applyTheme;
    };
  }, []);

  const setTheme = useCallback((id: string) => {
    setThemeId(themeById(id).id);
  }, []);

  const setMode = useCallback((next: ThemePreference) => {
    const pref = next === 'dark' || next === 'system' ? next : 'light';
    persistMode(pref);
    setPreferenceState(pref);
  }, []);

  const setFontScale = useCallback((id: FontScaleId) => {
    applyFontScale(id);
    setFontScaleState(id);
  }, []);

  const value = useMemo(
    () => ({ themeId, mode, preference, fontScale, setTheme, setMode, setFontScale }),
    [themeId, mode, preference, fontScale, setTheme, setMode, setFontScale],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
