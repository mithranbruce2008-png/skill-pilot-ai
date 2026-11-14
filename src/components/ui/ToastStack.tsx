import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

/**
 * Accessible live-region toast stack for FPS downgrades, adaptation alerts, and status messages.
 */
export function ToastStack() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.tone === 'success'
            ? CheckCircle2
            : toast.tone === 'warning'
              ? AlertTriangle
              : toast.tone === 'danger'
                ? AlertCircle
                : Info;
        const toneColor =
          toast.tone === 'success'
            ? 'var(--sp-success)'
            : toast.tone === 'warning'
              ? 'var(--sp-warning)'
              : toast.tone === 'danger'
                ? 'var(--sp-danger)'
                : 'var(--sp-focus)';

        return (
          <div
            key={toast.id}
            role="status"
            className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg"
            style={{
              backgroundColor: 'var(--sp-surface)',
              borderColor: 'var(--sp-border)',
              color: 'var(--sp-text)',
            }}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: toneColor }} aria-hidden="true" />
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg hover:opacity-80 cursor-pointer"
              style={{ color: 'var(--sp-text-muted)' }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
