import React from 'react';
import { cx } from './cx';

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: 'sm' | 'md';
  danger?: boolean;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', danger, className, type = 'button', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('icon-btn', size === 'sm' && 'sm', danger && 'danger', className)}
      aria-label={label}
      title={props.title ?? label}
      {...props}
    >
      {children}
    </button>
  );
});
