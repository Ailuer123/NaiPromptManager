import React from 'react';
import { cx } from './cx';

export type PanelProps = {
  title?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function Panel({ title, meta, className, children }: PanelProps) {
  return (
    <section className={cx('panel', 'surface', className)}>
      {(title != null || meta != null) && (
        <div className="panel-title">
          {title != null && <h2>{title}</h2>}
          {meta != null && <span className="meta">{meta}</span>}
        </div>
      )}
      {children}
    </section>
  );
}
