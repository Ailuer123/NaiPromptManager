import React from 'react';
import { cx } from './cx';

export type AvatarProps = {
  src?: string;
  alt?: string;
  name?: string;
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join('');
  return `${Array.from(parts[0])[0] ?? ''}${Array.from(parts[parts.length - 1])[0] ?? ''}`;
}

export function Avatar({ src, alt, name, className }: AvatarProps) {
  const label = alt ?? name ?? '';
  return (
    <span className={cx('avatar', className)} aria-hidden={!label} title={name}>
      {src ? <img src={src} alt={label} /> : initials(name ?? '') || '·'}
    </span>
  );
}
