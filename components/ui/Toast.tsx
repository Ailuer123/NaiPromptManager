import React from 'react';
import { cx } from './cx';

export type ToastTone = 'info' | 'success' | 'error' | 'warning';

export type ToastProps = {
  message: React.ReactNode;
  type?: ToastTone;
  className?: string;
};

export function ToastHost({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cx('toast-host', className)} aria-live="polite" aria-relevant="additions">
      {children}
    </div>
  );
}

export function Toast({ message, type = 'info', className }: ToastProps) {
  return (
    <div className={cx('toast', type !== 'info' && type, className)} role="status">
      {message}
    </div>
  );
}
