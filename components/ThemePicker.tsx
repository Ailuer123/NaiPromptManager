import React, { useId, useState } from 'react';
import { THEME_CATALOG, themeById, useTheme } from '../theme';
import { cx } from './ui/cx';
import { Sheet } from './ui/Sheet';
import { Switch } from './ui/Toggle';

type ThemePickerProps = {
  compact?: boolean;
  side?: boolean;
  className?: string;
};

function Swatches({ colors }: { colors: readonly string[] }) {
  return (
    <span className="swatches" aria-hidden="true">
      {colors.map((color) => (
        <i key={color} style={{ background: color }} />
      ))}
    </span>
  );
}

export function ThemePicker({ compact, side, className }: ThemePickerProps) {
  const { themeId, setTheme, mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const darkId = useId();
  const current = themeById(themeId);

  return (
    <>
      <button
        type="button"
        className={cx('theme-picker-btn', 'surface', compact && 'compact', side && 'side', className)}
        onClick={() => setOpen(true)}
        aria-label="选择主题配色"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Swatches colors={current.colors} />
        <span className="tname">{current.name}</span>
        <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="主题配色">
        <div className="setting-row" style={{ paddingTop: 0 }}>
          <label className="s-label" htmlFor={darkId} style={{ cursor: 'pointer' }}>
            暗色模式
            <small>刷新后仍保留</small>
          </label>
          <Switch
            id={darkId}
            checked={mode === 'dark'}
            onCheckedChange={(on) => setMode(on ? 'dark' : 'light')}
          />
        </div>
        <div className="palette-grid">
          {THEME_CATALOG.map((theme) => {
            const active = theme.id === themeId;
            return (
              <button
                key={theme.id}
                type="button"
                className={cx('palette-card', active && 'active')}
                aria-pressed={active}
                onClick={() => setTheme(theme.id)}
              >
                <span className="pname">{theme.name}</span>
                <span className="peng">{theme.eng}</span>
                <span className="pdots" aria-hidden="true">
                  {theme.colors.map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
