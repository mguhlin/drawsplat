import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function Dialog({ children, isOpen, onClose, title }: DialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="dialog"
        role="dialog"
      >
        <header className="dialog-header">
          <h2 id="dialog-title">{title}</h2>
          <button
            aria-label="Close dialog"
            className="dialog-close"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={24} />
          </button>
        </header>
        <div className="dialog-body">{children}</div>
      </section>
    </div>
  );
}
