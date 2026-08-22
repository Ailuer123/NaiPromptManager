import React, { useId } from 'react';
import { cx } from './cx';

export type FieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
};

function injectId(children: React.ReactNode, id: string): React.ReactNode {
  if (!React.isValidElement<{ id?: string }>(children)) return children;
  if (children.props.id) return children;
  return React.cloneElement(children, { id });
}

export function Field({ label, hint, error, htmlFor, className, children }: FieldProps) {
  const uid = useId();
  const id = htmlFor ?? uid;

  return (
    <div className={cx('field', className)}>
      {label != null && <label htmlFor={id}>{label}</label>}
      {injectId(children, id)}
      {error != null && <span className="hint is-error">{error}</span>}
      {error == null && hint != null && <span className="hint">{hint}</span>}
    </div>
  );
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cx('input', className)} {...props} />;
});

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cx('select', className)} {...props}>
      {children}
    </select>
  );
});

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cx('textarea', className)} {...props} />;
});
