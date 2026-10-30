import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

interface BaseProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  return [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
}

function Messages({ id, error, hint }: Omit<BaseProps, 'label'>) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </>
  );
}

export function TextField({ id, label, error, hint, ...input }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy(id, error, hint)} {...input} />
      <Messages id={id} error={error} hint={hint} />
    </div>
  );
}

export function TextArea({ id, label, error, hint, ...input }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...input}
      />
      <Messages id={id} error={error} hint={hint} />
    </div>
  );
}

export function NoticeBar({ notice, onClose }: { notice: { kind: 'success' | 'error'; text: string } | null; onClose: () => void }) {
  return (
    <div role="status" aria-live="polite">
      {notice && (
        <p className={`admin-notice admin-notice--${notice.kind}`}>
          {notice.text}
          <button type="button" className="admin-notice__close" onClick={onClose} aria-label="Cerrar aviso">
            ×
          </button>
        </p>
      )}
    </div>
  );
}
