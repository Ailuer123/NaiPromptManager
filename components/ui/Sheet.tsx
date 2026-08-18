import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './cx';
import { IconButton } from './IconButton';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => {
    if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    return true;
  });
}

export type OverlayProps = {
  open: boolean;
  onClick?: () => void;
  className?: string;
};

export function Overlay({ open, onClick, className }: OverlayProps) {
  return (
    <div
      className={cx('overlay', open && 'open', className)}
      onClick={onClick}
      aria-hidden={!open}
    />
  );
}

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function Sheet({ open, onClose, title, className, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    lastFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = getFocusable(panel);
    (focusables[0] ?? panel)?.focus();

    return () => {
      lastFocusRef.current?.focus?.();
      lastFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const rejectFocus = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement) || !panel.contains(target)) return;
      target.blur();
    };

    panel.addEventListener('focusin', rejectFocus);
    return () => panel.removeEventListener('focusin', rejectFocus);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      const nodes = getFocusable(panel);
      if (nodes.length === 0) {
        e.preventDefault();
        panel?.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <Overlay open={open} onClick={() => onCloseRef.current()} />
      <div
        ref={panelRef}
        className={cx('sheet', 'glass-strong', open && 'open', className)}
        role="dialog"
        aria-modal={open || undefined}
        aria-hidden={!open}
        aria-labelledby={title != null ? titleId : undefined}
        tabIndex={-1}
        inert={!open}
      >
        <div className="sheet-handle" />
        {(title != null) && (
          <div className="sheet-head">
            <h3 id={titleId}>{title}</h3>
            <IconButton label="关闭" onClick={() => onCloseRef.current()}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </IconButton>
          </div>
        )}
        <div className="sheet-body">{children}</div>
      </div>
    </>,
    document.body,
  );
}
