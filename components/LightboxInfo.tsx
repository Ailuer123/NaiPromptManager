import React, { useEffect } from 'react';
import { IconButton, IconClose } from './ui';

export function LightboxInfo({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="lbx-info"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="lbx-info-panel glass-strong"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lbx-info-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pref-row" style={{ marginBottom: 12 }}>
          <h2 id="lbx-info-title" style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>信息</h2>
          <IconButton label="关闭信息" onClick={onClose}>
            <IconClose />
          </IconButton>
        </div>
        <div className="lbx-info-body">{children}</div>
      </div>
    </div>
  );
}
