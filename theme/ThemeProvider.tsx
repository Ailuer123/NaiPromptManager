import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { applyTheme, readStoredTheme, resolveMode } from './applyTheme';
import type { ThemeMode } from './buildThemeVars';
import { themeById, type ThemeId } from './palettes';

type ThemeContextValue = {
  themeId: ThemeId;
  mode: ThemeMode;
  setTheme: (id: string) => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ApplyThemeFn = (id: string, mode?: ThemeMode) => void;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => readStoredTheme().themeId);
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredTheme().mode);

  useLayoutEffect(() => {
    applyTheme(themeId, mode);
  }, [themeId, mode]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as Window & { applyTheme?: ApplyThemeFn };
    w.applyTheme = (id, nextMode) => {
      const resolvedId = themeById(id).id;
      const resolvedMode = nextMode === undefined ? mode : resolveMode(nextMode);
      setThemeId(resolvedId);
      setModeState(resolvedMode);
    };
    return () => {
      delete w.applyTheme;
    };
  }, [mode]);

  const setTheme = useCallback((id: string) => {
    setThemeId(themeById(id).id);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(resolveMode(next));
  }, []);

  const value = useMemo(
    () => ({ themeId, mode, setTheme, setMode }),
    [themeId, mode, setTheme, setMode],
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
