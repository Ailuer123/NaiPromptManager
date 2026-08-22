import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from './Button';
import { cx } from './cx';
import { IconCheck, IconClose, IconInfo, IconWarn } from './glyphs';
import { Overlay } from './Sheet';
import { ToastHost } from './Toast';
import { Portal } from './Portal';

export type ToastTone = 'info' | 'success' | 'error' | 'warning';

export type ConfirmTone = 'default' | 'danger';

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
  leaving?: boolean;
};

type FeedbackContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const TOAST_MS = 3600;
const TOAST_EXIT_MS = 220;
const MAX_TOASTS = 3;

const TOAST_ICONS: Record<ToastTone, React.ReactNode> = {
  info: <IconInfo />,
  success: <IconCheck />,
  error: <IconWarn />,
  warning: <IconWarn />,
};

function normalizeConfirm(options: ConfirmOptions | string): ConfirmOptions {
  if (typeof options === 'string') return { title: options };
  return options;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const idRef = useRef(0);
  const waiterRef = useRef<{ resolve: (value: boolean) => void } | null>(null);
  const timersRef = useRef<Map<number, number>>(new Map());

  const dismissToast = useCallback((id: number) => {
    const timers = timersRef.current;
    const pending = timers.get(id);
    if (pending) {
      window.clearTimeout(pending);
      timers.delete(id);
    }
    setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
    const exit = window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
      timers.delete(id);
    }, TOAST_EXIT_MS);
    timers.set(id, exit);
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => {
      const next = [...prev.filter((item) => !item.leaving), { id, message, tone }];
      return next.slice(-MAX_TOASTS);
    });
    const hide = window.setTimeout(() => dismissToast(id), TOAST_MS);
    timersRef.current.set(id, hide);
  }, [dismissToast]);

  const finishConfirm = useCallback((value: boolean) => {
    waiterRef.current?.resolve(value);
    waiterRef.current = null;
    setDialogOpen(false);
  }, []);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    if (waiterRef.current) waiterRef.current.resolve(false);
    return new Promise<boolean>((resolve) => {
      waiterRef.current = { resolve };
      setDialog(normalizeConfirm(options));
      setDialogOpen(true);
    });
  }, []);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
    waiterRef.current?.resolve(false);
    waiterRef.current = null;
  }, []);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Portal>
        <ToastHost>
          {toasts.map((item) => (
            <div
              key={item.id}
              className={cx('toast', item.tone !== 'info' && item.tone, item.leaving && 'is-leaving')}
              role={item.tone === 'error' ? 'alert' : 'status'}
            >
              <span className="toast-icon" aria-hidden="true">{TOAST_ICONS[item.tone]}</span>
              <span className="toast-body">{item.message}</span>
              <button
                type="button"
                className="toast-x"
                aria-label="关闭通知"
                onClick={() => dismissToast(item.id)}
              >
                <IconClose />
              </button>
            </div>
          ))}
        </ToastHost>
        <ConfirmDialog
          open={dialogOpen && dialog != null}
          options={dialog}
          onCancel={() => finishConfirm(false)}
          onConfirm={() => finishConfirm(true)}
        />
      </Portal>
    </FeedbackContext.Provider>
  );
}

function ConfirmDialog({
  open,
  options,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  options: ConfirmOptions | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  const onConfirmRef = useRef(onConfirm);
  onCancelRef.current = onCancel;
  onConfirmRef.current = onConfirm;

  const tone = options?.tone === 'danger' ? 'danger' : 'default';
  const confirmLabel = options?.confirmLabel ?? '确认';
  const cancelLabel = options?.cancelLabel ?? '取消';

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const preferred = panel?.querySelector<HTMLElement>(
      tone === 'danger' ? '[data-dialog-cancel]' : '[data-dialog-confirm]',
    );
    (preferred ?? panel)?.focus();
  }, [open, tone]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const nodes = [...panel.querySelectorAll<HTMLElement>('button:not([disabled])')];
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (typeof document === 'undefined') return null;

  return (
    <>
      <Overlay open={open} className="dialog-overlay" onClick={() => onCancelRef.current()} />
      <div
        className={cx('dialog-root', open && 'open')}
        aria-hidden={!open}
        onClick={(e) => {
          if (e.target === e.currentTarget) onCancelRef.current();
        }}
      >
        <div
          ref={panelRef}
          className={cx('dialog', 'surface-strong', tone === 'danger' && 'is-danger')}
          role="alertdialog"
          aria-modal={open || undefined}
          aria-labelledby={options ? titleId : undefined}
          aria-describedby={options?.description ? descId : undefined}
          tabIndex={-1}
          inert={!open}
        >
          <div className={cx('dialog-icon', tone === 'danger' && 'is-danger')} aria-hidden="true">
            {tone === 'danger' ? <IconWarn /> : <IconInfo />}
          </div>
          {options ? <h3 id={titleId}>{options.title}</h3> : null}
          {options?.description ? (
            <p id={descId} className="dialog-desc">{options.description}</p>
          ) : null}
          <div className="dialog-actions">
            <Button type="button" variant="ghost" data-dialog-cancel onClick={() => onCancelRef.current()}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={tone === 'danger' ? 'danger' : 'primary'}
              data-dialog-confirm
              onClick={() => onConfirmRef.current()}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (ctx) return ctx;
  const isTest = typeof process !== 'undefined' && Boolean(process.env.VITEST);
  if (isTest) {
    return {
      toast: () => {},
      confirm: async (options) => {
        const title = typeof options === 'string' ? options : options.title;
        return window.confirm(title);
      },
    };
  }
  throw new Error('useFeedback must be used within FeedbackProvider');
}
