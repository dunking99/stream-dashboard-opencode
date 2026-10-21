import { useEffect, useRef } from 'react';
import SitesBar from './SitesBar';

export default function SitesDrawer({ open, onClose }) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close sites panel" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sites"
        className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-line bg-ink-900 p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-100">Sites</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">Browser-only notes. These do not drive extraction yet.</p>
          </div>
          <button type="button" onClick={onClose} className="btn" aria-label="Close sites panel" autoFocus>Close</button>
        </div>
        <SitesBar />
      </aside>
    </div>
  );
}
