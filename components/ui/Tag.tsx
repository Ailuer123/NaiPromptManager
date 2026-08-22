import React from 'react';
import { cx } from './cx';

export type TagTone = 'default' | 'sage' | 'mist' | 'mauve' | 'warn';

export type TagProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: TagTone;
};

export function Tag({ tone = 'default', className, ...props }: TagProps) {
  return <span className={cx('tag', tone !== 'default' && tone, className)} {...props} />;
}
