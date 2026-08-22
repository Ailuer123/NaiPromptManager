import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './cx';

export type HelpTipProps = {
  label: string;
  children: React.ReactNode;
};

const VIEW_PAD = 16;

function clampCard(mark: DOMRect, cardHeight: number) {
  const width = Math.min(280, window.innerWidth - VIEW_PAD * 2);
  let left = mark.right - width;
  left = Math.max(VIEW_PAD, Math.min(left, window.innerWidth - VIEW_PAD - width));
  let top = mark.bottom + 8;
  if (top + cardHeight > window.innerHeight - VIEW_PAD) {
    top = Math.max(VIEW_PAD, mark.top - 8 - cardHeight);
  }
  return { top, left, width };
}

export function HelpTip({ label, children }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const place = useCallback(() => {
    const mark = wrapRef.current?.getBoundingClientRect();
    if (!mark) return;
    const height = cardRef.current?.offsetHeight || 160;
    setCoords(clampCard(mark, height));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || cardRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className={cx('help-tip', open && 'is-open')} ref={wrapRef}>
      <button
        type="button"
        className="help-tip-mark"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={cardRef}
          className="help-tip-card is-open"
          role="tooltip"
          style={coords ? { top: coords.top, left: coords.left, width: coords.width } : { visibility: 'hidden' }}
        >
          {children}
        </div>,
        document.body,
      )}
    </span>
  );
}
