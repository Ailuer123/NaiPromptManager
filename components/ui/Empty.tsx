import React from 'react';
import { cx } from './cx';

export type EmptyProps = {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function Empty({ icon, title, description, action, className }: EmptyProps) {
  return (
    <div className={cx('empty', className)}>
      {icon != null && <div className="icon">{icon}</div>}
      {title != null && <h3>{title}</h3>}
      {description != null && <p>{description}</p>}
      {action != null && <div className="empty-action">{action}</div>}
    </div>
  );
}
