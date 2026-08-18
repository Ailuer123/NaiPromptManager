import React from 'react';
import { cx } from './cx';

export type CardMediaRatio = 'portrait' | 'sq' | 'wide';

export type CardProps = {
  href?: string;
  onOpen?: () => void;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  media?: React.ReactNode;
  mediaRatio?: CardMediaRatio;
  sub?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

/** 标题链接 ::after 拉伸整卡；根节点禁止 role=button。 */
export function Card({
  href,
  onOpen,
  title,
  extra,
  media,
  mediaRatio = 'portrait',
  sub,
  className,
  children,
}: CardProps) {
  const clickable = !!(href || onOpen);

  const handleOpen = (e: React.MouseEvent) => {
    if (!onOpen) return;
    if (href) return;
    e.preventDefault();
    onOpen();
  };

  const titleNode = title != null ? <h3>{title}</h3> : null;

  return (
    <article className={cx('card', 'surface', clickable && 'card-click', className)}>
      {media != null && (
        <div className={cx('card-media', mediaRatio !== 'portrait' && mediaRatio)}>{media}</div>
      )}
      <div className="card-body">
        {(titleNode || extra) && (
          <div className="card-title-row">
            {clickable && titleNode ? (
              <a className="card-link" href={href ?? '#'} onClick={handleOpen}>
                {titleNode}
              </a>
            ) : (
              titleNode
            )}
            {extra}
          </div>
        )}
        {sub != null && <div className="sub">{sub}</div>}
        {children}
      </div>
    </article>
  );
}
