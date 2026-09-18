import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/** Accessible modal: portal, focus trap, Escape/overlay close, body scroll lock. */
export default function Modal({ open, onClose, title, subtitle, children, size = 'lg' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
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
    document.body.style.overflow = 'hidden';
    // focus the dialog for screen readers / keyboard users
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[8vh] backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={`glass-strong card-hover w-full ${sizeClass[size]} rounded-2xl shadow-card focus:outline-none`}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line/70 px-6 py-4">
              <div className="min-w-0">
                <div className="text-lg font-bold tracking-tight">{title}</div>
                {subtitle && <div className="mt-0.5 text-sm text-muted">{subtitle}</div>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="focus-ring rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[68vh] overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
          <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
