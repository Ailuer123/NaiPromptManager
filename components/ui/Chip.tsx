import React from 'react';
import { cx } from './cx';

export type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  soft?: boolean;
};

/** 选中态走 --accent-wash + --accent-2，不占用主按钮渐变。 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active, soft, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('chip', active && 'active', soft && 'chip-soft', className)}
      aria-pressed={soft ? undefined : !!active}
      {...props}
    />
  );
});

export type SegOption<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  count?: React.ReactNode;
};

export type SegProps<T extends string = string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegOption<T>[];
  fill?: boolean;
  className?: string;
  'aria-label'?: string;
};

export function Seg<T extends string>({
  value,
  onChange,
  options,
  fill,
  className,
  'aria-label': ariaLabel,
}: SegProps<T>) {
  return (
    <div className={cx('seg', fill && 'seg-fill', className)} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={selected ? 'active' : undefined}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
            {opt.count != null && <span className="cnt">{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
