import React, { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { pathFor } from '../app/paths';
import { ROLE_POLICY } from '../config/rolePolicy';
import { User } from '../types';
import { AnlasChip } from './NaiAnlasChip';
import { Atmosphere } from './Atmosphere';
import { BrandMark } from './BrandMark';
import { Avatar } from './ui/Avatar';
import { IconButton } from './ui/IconButton';
import { Overlay } from './ui/Sheet';
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
}

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
  sidebar: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
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
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const sidebarId = useId();

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

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [currentView]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      wasOpen.current = true;
      closeRef.current?.focus();
      return;
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      toggleRef.current?.focus();
    }
  }, [sidebarOpen]);

  return (
    <div className={cx('app-shell', sidebarOpen && 'sidebar-open')}>
      <Atmosphere />

      <header className="topbar">
        <div className="topbar-inner glass">
          <div className="topbar-start">
            <IconButton
              ref={toggleRef}
              label="打开侧边栏"
              aria-expanded={sidebarOpen}
              aria-controls={sidebarId}
              onClick={() => setSidebarOpen(true)}
            >
              {ICONS.sidebar}
            </IconButton>
          </div>
          <div className="topbar-brand">
            <BrandMark />
          </div>
          <div className="topbar-end">
            <AnlasChip compact />
          </div>
        </div>
      </header>

      <Overlay
        open={sidebarOpen}
        onClick={closeSidebar}
        className="sidebar-overlay"
      />

      <aside
        id={sidebarId}
        className={cx('sidebar', sidebarOpen && 'open')}
        aria-label="主导航"
      >
        <div className="sidebar-panel glass-strong">
          <div className="brand">
            <BrandMark />
            <div className="brand-text">
              <strong>NAI 咒语构建终端</strong>
            </div>
            <IconButton
              ref={closeRef}
              className="sidebar-close"
              label="关闭侧边栏"
              onClick={closeSidebar}
            >
              {ICONS.close}
            </IconButton>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">创作</div>
            {CREATE_NAV.map((item) => (
              <NavLink
                key={item.id}
                to={pathFor(item.id)}
                className={cx('nav-item', isNavActive(item.id, currentView) && 'active')}
                onClick={closeSidebar}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
            <div className="nav-section">系统</div>
            <NavLink
              to={pathFor('admin')}
              className={cx('nav-item', currentView === 'admin' && 'active')}
              onClick={closeSidebar}
            >
              {ICONS.admin}
              设置与管理
            </NavLink>
          </nav>

          <div className="sidebar-foot">
            <AnlasChip />
            {showStorage ? (
              <div className="storage">
                <div className="storage-row">
                  <span>存储配额</span>
                  <span>{formatBytes(usage)} / {formatBytes(maxStorage)}</span>
                </div>
                <div
                  className={cx('bar', usagePct >= 90 ? 'hot' : usagePct >= 75 && 'warn')}
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
                  {currentUser.role === 'vip' ? (
                    <span className="vip-label">VIP</span>
                  ) : (
                    <span className={ROLE_POLICY.getRoleBadgeClass(currentUser.role)}>
                      {ROLE_POLICY.getRoleDisplayName(currentUser.role)}
                    </span>
                  )}
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
    </div>
  );
};
