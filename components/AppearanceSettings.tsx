import React from 'react';
import {
  THEME_CATALOG,
  buildThemeVars,
  themeById,
  useTheme,
  type ThemePreference,
} from '../theme';
import { cx } from './ui/cx';
import { IconCheck, IconMonitor, IconMoon, IconSun } from './ui/glyphs';

const MODE_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
}> = [
  { value: 'light', label: '浅色' },
  { value: 'system', label: '跟随系统' },
  { value: 'dark', label: '深色' },
];

function ModeIcon({ value }: { value: ThemePreference }) {
  if (value === 'dark') return <IconMoon />;
  if (value === 'system') return <IconMonitor />;
  return <IconSun />;
}

function SelectedMark() {
  return (
    <span className="appearance-check" aria-hidden="true">
      <IconCheck />
    </span>
  );
}

export function AppearanceSettings() {
  const { themeId, preference, setTheme, setMode } = useTheme();
  const current = themeById(themeId);
  const lightVars = buildThemeVars(current.colors, 'light', { flat: current.flat });
  const darkVars = buildThemeVars(current.colors, 'dark', { flat: current.flat });
  const lightBg = lightVars['--cream'];
  const lightInk = lightVars['--ink'];
  const darkBg = darkVars['--cream'];
  const darkInk = darkVars['--ink'];

  return (
    <section className="settings-block">
      <div className="settings-block-head">
        <h3>外观</h3>
      </div>
      <div className="appearance-fields">
        <div className="appearance-field" role="group" aria-labelledby="appearance-theme-label">
          <div id="appearance-theme-label" className="appearance-label">主题</div>
          <div className="appearance-grid">
            {THEME_CATALOG.map((theme) => {
              const vars = buildThemeVars(theme.colors, 'light', { flat: theme.flat });
              const bg = vars['--cream'];
              const ink = vars['--ink'];
              const tagBg = vars['--paper'];
              const active = theme.id === themeId;
              return (
                <button
                  key={theme.id}
                  type="button"
                  className="appearance-choice"
                  aria-pressed={active}
                  aria-label={theme.name}
                  onClick={() => setTheme(theme.id)}
                >
                  <div
                    className={cx('appearance-tile', 'theme-preview', active && 'is-active')}
                    style={{ backgroundColor: bg }}
                  >
                    <span
                      className="theme-preview-tag"
                      style={{ backgroundColor: tagBg, color: ink }}
                    >
                      {theme.eng}
                    </span>
                    <span className="theme-preview-bars" aria-hidden="true">
                      {theme.colors.map((color) => (
                        <i key={color} style={{ backgroundColor: color }} />
                      ))}
                    </span>
                    <span
                      className="theme-preview-fade"
                      style={{ background: `linear-gradient(to top, ${bg} 42%, transparent)` }}
                    />
                    <span className="theme-preview-name" style={{ color: ink }}>
                      {theme.name}
                    </span>
                    {active ? <SelectedMark /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="appearance-field" role="group" aria-labelledby="appearance-mode-label">
          <div id="appearance-mode-label" className="appearance-label">颜色模式</div>
          <div className="appearance-grid appearance-grid-4">
            {MODE_OPTIONS.map((opt) => {
              const active = preference === opt.value;
              if (opt.value === 'system') {
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className="appearance-choice"
                    aria-pressed={active}
                    aria-label={opt.label}
                    onClick={() => setMode(opt.value)}
                  >
                    <div className={cx('appearance-tile', 'mode-preview', 'mode-system', active && 'is-active')}>
                      <span className="mode-system-pane" style={{ backgroundColor: lightBg }} />
                      <span
                        className="mode-system-pane mode-system-dark"
                        style={{ backgroundColor: darkBg }}
                      />
                      <span className="mode-system-copy" style={{ color: lightInk }}>
                        <span className="mode-system-copy-inner">
                          <ModeIcon value={opt.value} />
                          <span>{opt.label}</span>
                        </span>
                      </span>
                      <span className="mode-system-copy mode-system-copy-dark" style={{ color: darkInk }}>
                        <span className="mode-system-copy-inner">
                          <ModeIcon value={opt.value} />
                          <span>{opt.label}</span>
                        </span>
                      </span>
                      {active ? <SelectedMark /> : null}
                    </div>
                  </button>
                );
              }
              const isDark = opt.value === 'dark';
              return (
                <button
                  key={opt.value}
                  type="button"
                  className="appearance-choice"
                  aria-pressed={active}
                  aria-label={opt.label}
                  onClick={() => setMode(opt.value)}
                >
                  <div
                    className={cx('appearance-tile', 'mode-preview', active && 'is-active')}
                    style={{
                      backgroundColor: isDark ? darkBg : lightBg,
                      color: isDark ? darkInk : lightInk,
                    }}
                  >
                    <span className="mode-preview-copy">
                      <ModeIcon value={opt.value} />
                      <span>{opt.label}</span>
                    </span>
                    {active ? <SelectedMark /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
