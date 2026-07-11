import { useEffect, useState, type ReactNode } from 'react';

type SlideOverProps = {
  open: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export default function SlideOver({ open, title, eyebrow = 'ScoreFlow Coach', onClose, children, footer }: SlideOverProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return;
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 280);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div className={`slide-over-layer${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      <button className="slide-over-backdrop" type="button" aria-label="Close editor" onClick={onClose} />
      <aside className="slide-over-panel" role="dialog" aria-modal="true" aria-label={title}>
        <header className="slide-over-header">
          <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
          <button className="slide-over-close" type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="slide-over-body">{children}</div>
        {footer && <footer className="slide-over-footer">{footer}</footer>}
      </aside>
    </div>
  );
}