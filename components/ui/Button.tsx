import React from 'react';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** 0–1 进度；缺省为不确定进度条 */
  progress?: number;
  block?: boolean;
  icon?: boolean;
};

function meterWidth(progress?: number): string | undefined {
  if (progress == null || Number.isNaN(progress)) return undefined;
  return `${Math.min(100, Math.max(0, progress * 100))}%`;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    progress,
    block,
    icon,
    className,
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const determinate = progress != null && !Number.isNaN(progress);

  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'btn',
        `btn-${variant}`,
        size !== 'md' && `btn-${size}`,
        icon && 'btn-icon',
        block && 'btn-block',
        loading && 'is-busy',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
      {loading && (
        <span
          className={cx('gen-meter', determinate && 'is-determinate')}
          style={determinate ? { width: meterWidth(progress) } : undefined}
        />
      )}
    </button>
  );
});
