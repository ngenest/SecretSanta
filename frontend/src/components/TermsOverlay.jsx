import { useEffect, useRef } from 'react';
import TermsContent from './TermsContent.jsx';

export default function TermsOverlay({ isOpen, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="terms-overlay" role="dialog" aria-modal="true" aria-labelledby="terms-overlay-title">
      <div className="terms-overlay__backdrop" aria-hidden="true" />
      <div className="terms-overlay__content">
        <button
          type="button"
          className="terms-overlay__close"
          onClick={onClose}
          aria-label="Close Terms and Conditions"
          ref={closeButtonRef}
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className="terms-scroll">
          <TermsContent />
        </div>
        <div className="terms-actions">
          <button type="button" className="terms-button terms-button--primary" onClick={onClose}>
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}
