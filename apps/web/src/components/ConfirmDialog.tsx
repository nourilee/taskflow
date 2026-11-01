import { useEffect, useRef, type ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm(): void;
  onCancel(): void;
  children: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) {
      element.showModal();
      // Start on the safe choice, so pressing Enter never deletes by accident.
      cancel.current?.focus();
    }
    if (!open && element?.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      data-testid="confirm-dialog"
    >
      <h2 id="dialog-title">{title}</h2>
      {children}
      <div className="actions">
        <button
          type="button"
          className="button button-danger"
          disabled={busy}
          onClick={onConfirm}
          data-testid="confirm-delete"
        >
          {confirmLabel}
        </button>
        <button
          ref={cancel}
          type="button"
          className="button button-quiet"
          disabled={busy}
          onClick={onCancel}
          data-testid="cancel-delete"
        >
          Keep task
        </button>
      </div>
    </dialog>
  );
}
