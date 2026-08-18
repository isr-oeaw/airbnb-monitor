import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import aboutContent from '../data/about.json';
import { getDatenschutzConsent, setDatenschutzConsent } from '../lib/searchLog';

interface AboutModalProps {
  onClose: () => void;
  onOpenDatenschutz: () => void;
}

export default function AboutModal({ onClose, onOpenDatenschutz }: AboutModalProps) {
  const [consent, setConsent] = useState(() => getDatenschutzConsent());

  const handleClose = useCallback(() => {
    setDatenschutzConsent(consent);
    onClose();
  }, [consent, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const handleConsentChange = (checked: boolean) => {
    setConsent(checked);
    setDatenschutzConsent(checked);
  };

  const handleOpenPrivacy = (event: MouseEvent) => {
    event.preventDefault();
    onOpenDatenschutz();
  };

  return (
    <div className="impressum-backdrop" onClick={handleClose} role="presentation">
      <aside
        className="impressum about-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="impressum__header">
          <h2 id="about-title" className="impressum__title">
            {aboutContent.title}
          </h2>
          <button
            type="button"
            className="impressum__close"
            onClick={handleClose}
            aria-label="Schließen"
          >
            ×
          </button>
        </header>

        {aboutContent.intro.map((paragraph) => (
          <p key={paragraph} className="about-modal__intro">
            {paragraph}
          </p>
        ))}

        {aboutContent.sections.map((section) => (
          <section key={section.heading} className="impressum__section">
            <h3>{section.heading}</h3>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}

        <section className="about-modal__consent">
          <label className="about-modal__consent-label">
            <input
              type="checkbox"
              className="about-modal__consent-checkbox"
              checked={consent}
              onChange={(e) => handleConsentChange(e.target.checked)}
            />
            <span>{aboutContent.consentLabel}</span>
          </label>
          <p className="about-modal__consent-hint">
            {aboutContent.consentHint}{' '}
            <button
              type="button"
              className="about-modal__privacy-link"
              onClick={handleOpenPrivacy}
            >
              {aboutContent.privacyLinkLabel}
            </button>
          </p>
        </section>

        <footer className="about-modal__footer">
          <button type="button" className="about-modal__cta" onClick={handleClose}>
            {aboutContent.closeLabel}
          </button>
        </footer>
      </aside>
    </div>
  );
}
