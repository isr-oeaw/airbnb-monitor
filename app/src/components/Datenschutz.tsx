import { useEffect } from 'react';
import datenschutzContent from '../data/datenschutz.json';

interface DatenschutzProps {
  onClose: () => void;
}

export default function Datenschutz({ onClose }: DatenschutzProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="impressum-backdrop" onClick={onClose} role="presentation">
      <aside
        className="impressum"
        role="dialog"
        aria-modal="true"
        aria-labelledby="datenschutz-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="impressum__header">
          <h2 id="datenschutz-title" className="impressum__title">
            {datenschutzContent.title}
          </h2>
          <button
            type="button"
            className="impressum__close"
            onClick={onClose}
            aria-label="Schließen"
          >
            ×
          </button>
        </header>

        {datenschutzContent.sections.map((section) => (
          <section key={section.heading} className="impressum__section">
            <h3>{section.heading}</h3>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}

        <footer className="about-modal__footer">
          <button type="button" className="about-modal__cta" onClick={onClose}>
            {datenschutzContent.closeLabel}
          </button>
        </footer>
      </aside>
    </div>
  );
}
