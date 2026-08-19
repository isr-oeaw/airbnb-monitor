import { useEffect } from 'react';
import methodologyContent from '../data/methodology.json';

interface MethodologyProps {
  onClose: () => void;
}

export default function Methodology({ onClose }: MethodologyProps) {
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
        aria-labelledby="methodology-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="impressum__header">
          <h2 id="methodology-title" className="impressum__title">
            {methodologyContent.title}
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

        {methodologyContent.sections.map((section) => (
          <section key={section.heading} className="impressum__section">
            <h3>{section.heading}</h3>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </aside>
    </div>
  );
}
