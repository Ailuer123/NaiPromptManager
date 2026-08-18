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
    <div className={cx('collapse', 'surface', open && 'open', className)}>
      <div className="collapse-head-row">
        <button
          type="button"
          className="collapse-head"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          <span className="collapse-head-main">
            {title}
            {meta != null && <span className="meta">{meta}</span>}
          </span>
          <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {extra != null && <div className="collapse-head-extra">{extra}</div>}
      </div>
      <div id={panelId} className="collapse-body" aria-hidden={!open}>
        {children}
      </div>
    </div>
  );
}
