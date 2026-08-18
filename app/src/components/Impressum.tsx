import { useEffect } from 'react';
import impressumContent from '../data/impressum.json';

interface ImpressumProps {
  onClose: () => void;
}

export default function Impressum({ onClose }: ImpressumProps) {
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
        aria-labelledby="impressum-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="impressum__header">
          <h2 id="impressum-title" className="impressum__title">
            {impressumContent.title}
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

        {impressumContent.sections.map((section) => (
          <section key={section.heading} className="impressum__section">
            <h3>{section.heading}</h3>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}

        <footer className="impressum__footer">
          <a
            href={impressumContent.oeawImpressumUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Impressum der ÖAW
          </a>
        </footer>
      </aside>
    </div>
  );
}
