import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { pathFor } from '../app/paths';
import { ROLE_POLICY } from '../config/rolePolicy';
import { User } from '../types';
import { Atmosphere } from './Atmosphere';
import { BrandMark } from './BrandMark';
import { Avatar } from './ui/Avatar';
import { IconButton } from './ui/IconButton';
import { cx } from './ui/cx';

export type LayoutView =
  | 'list'
  | 'characters'
  | 'edit'
  | 'library'
  | 'inspiration'
  | 'admin'
  | 'history'
  | 'playground';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  currentUser?: User | null;
  onLogout?: () => void;
  hideNav?: boolean;
}

const PAGE_LABEL: Record<string, string> = {
  list: '串看板',
  characters: '串看板',
  edit: '串编辑器',
  library: '军火库',
  inspiration: '灵感图库',
  playground: '实验室 · 对比试跑',
  history: '生成历史',
  admin: '设置与管理',
};

const ICONS = {
  chains: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h10M4 17h14" />
    </svg>
  ),
  library: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M3 16l4.5-3.5L11 15l3-2.5L21 17" />
    </svg>
  ),
  inspiration: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  ),
  playground: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3h6l1 4H8l1-4z" />
      <path d="M8 7h8v3a4 4 0 0 1-8 0V7z" />
      <path d="M10 14v7M14 14v7" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

const CREATE_NAV: { id: LayoutView; label: string; icon: React.ReactNode }[] = [
  { id: 'list', label: '串看板', icon: ICONS.chains },
  { id: 'library', label: '军火库', icon: ICONS.library },
  { id: 'inspiration', label: '灵感图库', icon: ICONS.inspiration },
  { id: 'playground', label: '生图实验室', icon: ICONS.playground },
  { id: 'history', label: '生成历史', icon: ICONS.history },
];

const MOBILE_NAV: { id: LayoutView | '__more'; label: string; icon: React.ReactNode }[] = [
  { id: 'list', label: '串', icon: ICONS.chains },
  { id: 'library', label: '军火', icon: ICONS.library },
  { id: 'playground', label: '实验室', icon: ICONS.playground },
  { id: 'inspiration', label: '灵感', icon: ICONS.inspiration },
  { id: '__more', label: '更多', icon: ICONS.more },
];

function isNavActive(itemId: string, view: string) {
  if (itemId === 'list') return view === 'list' || view === 'characters' || view === 'edit';
  return itemId === view;
}

function formatBytes(bytes?: number) {
  if (!bytes) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  currentUser,
  onLogout,
  hideNav,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  const getMaxStorage = () => {
    if (!currentUser) return 300 * 1024 * 1024;
    if (ROLE_POLICY.isUnlimitedStorage(currentUser.role)) return Infinity;
    return currentUser.maxStorage || ROLE_POLICY.getDefaultQuota(currentUser.role) || 300 * 1024 * 1024;
  };

  const maxStorage = getMaxStorage();
  const usage = currentUser?.storageUsage || 0;
  const usagePct = maxStorage === Infinity ? 0 : Math.min(100, (usage / maxStorage) * 100);
  const showStorage = Boolean(
    currentUser && !ROLE_POLICY.isUnlimitedStorage(currentUser.role) && currentUser.role !== 'guest',
  );

  useEffect(() => {
    if (hideNav) setMoreOpen(false);
  }, [hideNav]);

  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (moreRef.current?.contains(target) || moreBtnRef.current?.contains(target)) return;
      setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [moreOpen]);

  const closeMore = () => setMoreOpen(false);

  const pageLabel = PAGE_LABEL[currentView] || '串看板';

  return (
    <div className={cx('app-shell', hideNav && 'hide-nav')}>
      <Atmosphere />

      <header className="topbar">
        <div className="topbar-inner glass">
          <div className="brand">
            <BrandMark />
            <div className="brand-text">
              <strong>NAI 终端</strong>
              <span>{pageLabel}</span>
            </div>
          </div>
          <div className="top-actions">
            {currentUser ? (
              <div className={cx('user-chip', currentUser.role === 'vip' && 'vip-badge')}>
                <Avatar name={currentUser.username[0]?.toUpperCase()} />
                <div className="meta">
                  <strong className={currentUser.role === 'vip' ? 'vip-username' : undefined}>
                    {currentUser.username}
                  </strong>
                  <span className={ROLE_POLICY.getRoleBadgeClass(currentUser.role)}>
                    {ROLE_POLICY.getRoleDisplayName(currentUser.role)}
                    {currentUser.role === 'vip' ? <i className="vip-label">VIP</i> : null}
                  </span>
                </div>
                {onLogout ? (
                  <IconButton label="退出登录" onClick={onLogout}>
                    {ICONS.logout}
                  </IconButton>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <aside className="sidebar" aria-label="主导航">
        <div className="sidebar-panel surface-strong">
          <div className="brand">
            <BrandMark />
            <div className="brand-text">
              <strong>NAI 咒语构建终端</strong>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">创作</div>
            {CREATE_NAV.map((item) => (
              <NavLink
                key={item.id}
                to={pathFor(item.id)}
                className={cx('nav-item', isNavActive(item.id, currentView) && 'active')}
                onClick={closeMore}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
            <div className="nav-section">系统</div>
            <NavLink
              to={pathFor('admin')}
              className={cx('nav-item', currentView === 'admin' && 'active')}
              onClick={closeMore}
            >
              {ICONS.admin}
              设置与管理
            </NavLink>
          </nav>

          <div className="sidebar-foot">
            {showStorage ? (
              <div className="storage">
                <div className="storage-row">
                  <span>存储配额</span>
                  <span>{formatBytes(usage)} / {formatBytes(maxStorage)}</span>
                </div>
                <div
                  className="bar"
                  role="meter"
                  aria-label="存储配额"
                  aria-valuemin={0}
                  aria-valuemax={maxStorage}
                  aria-valuenow={usage}
                  aria-valuetext={`${formatBytes(usage)} / ${formatBytes(maxStorage)}`}
                >
                  <i style={{ width: `${usagePct}%` }} />
                </div>
              </div>
            ) : null}
            {currentUser ? (
              <div className={cx('user-chip', currentUser.role === 'vip' && 'vip-badge')}>
                <Avatar name={currentUser.username[0]?.toUpperCase()} />
                <div className="meta">
                  <strong className={currentUser.role === 'vip' ? 'vip-username' : undefined}>
                    {currentUser.username}
                  </strong>
                  <span className={ROLE_POLICY.getRoleBadgeClass(currentUser.role)}>
                    {ROLE_POLICY.getRoleDisplayName(currentUser.role)}
                    {currentUser.role === 'vip' ? <i className="vip-label">VIP</i> : null}
                  </span>
                </div>
                {onLogout ? (
                  <IconButton label="退出登录" onClick={onLogout}>
                    {ICONS.logout}
                  </IconButton>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <main className="main">{children}</main>

      {!hideNav ? (
        <nav className="bottom-nav glass-strong" aria-label="移动导航">
          {MOBILE_NAV.map((item) => {
            const navId = item.id;
            if (navId === '__more') {
              return (
                <button
                  key="more"
                  type="button"
                  ref={moreBtnRef}
                  className={cx('bnav-item', 'bnav-more', moreOpen && 'active')}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  onClick={() => setMoreOpen((open) => !open)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={navId}
                to={pathFor(navId)}
                className={cx('bnav-item', isNavActive(navId, currentView) && 'active')}
                onClick={closeMore}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      ) : null}

      {moreOpen && !hideNav ? (
        <div className="more-menu glass-strong open" id="moreMenu" role="menu" ref={moreRef}>
          <NavLink to={pathFor('history')} role="menuitem" onClick={closeMore}>
            {ICONS.history}
            历史
          </NavLink>
          <NavLink to={pathFor('admin')} role="menuitem" onClick={closeMore}>
            {ICONS.admin}
            设置
          </NavLink>
          {onLogout ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMoreOpen(false);
                onLogout();
              }}
            >
              {ICONS.logout}
              退出
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
