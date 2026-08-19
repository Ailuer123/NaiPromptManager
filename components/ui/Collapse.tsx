import React, { useId, useState } from 'react';
import { cx } from './cx';

export type CollapseProps = {
  title: React.ReactNode;
  meta?: React.ReactNode;
  extra?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children?: React.ReactNode;
};

export function Collapse({
  title,
  meta,
  extra,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
}: CollapseProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = openProp ?? uncontrolled;
  const panelId = useId();

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  return (
    <div className={cx('fold', 'surface', open && 'open', className)}>
      <div className="fold-head-row">
        <button
          type="button"
          className="fold-head"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          <span className="fold-head-main">
            {title}
            {meta != null && <span className="meta">{meta}</span>}
          </span>
        </button>
        {extra != null && <div className="fold-head-extra">{extra}</div>}
        <button
          type="button"
          className="fold-chev"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? '收起' : '展开'}
          onClick={() => setOpen(!open)}
        >
          <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      <div id={panelId} className="fold-body" aria-hidden={!open}>
        {children}
      </div>
    </div>
  );
}
