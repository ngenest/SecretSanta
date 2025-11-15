import { useMemo, useState } from 'react';

const CODEBOXX_LOGO_CANDIDATES = [
  '/assets/codeboxx_logo_wtBlue.png',
  '/src/assets/codeboxx_logo_wtBlue.png',
  'assets/codeboxx_logo_wtBlue.png'
];

function FooterLogo() {
  const [imageSrcIndex, setImageSrcIndex] = useState(0);
  const [shouldRenderFallback, setShouldRenderFallback] = useState(false);

  const activeSrc = useMemo(
    () => CODEBOXX_LOGO_CANDIDATES[imageSrcIndex] || '',
    [imageSrcIndex]
  );

  const handleError = () => {
    setImageSrcIndex((previousIndex) => {
      const nextIndex = previousIndex + 1;

      if (nextIndex >= CODEBOXX_LOGO_CANDIDATES.length) {
        setShouldRenderFallback(true);
        return previousIndex;
      }

      return nextIndex;
    });
  };

  const handleLoad = () => {
    if (shouldRenderFallback) {
      setShouldRenderFallback(false);
    }
  };

  if (shouldRenderFallback || !activeSrc) {
    return (
      <div className="footer-logo footer-logo--fallback" aria-label="CodeBoxx logo">
        <span>CodeBoxx</span>
      </div>
    );
  }

  return (
    <img
      src={activeSrc}
      alt="CodeBoxx logo"
      className="footer-logo"
      loading="lazy"
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}

export default function Footer({ onTermsClick }) {
  return (
    <footer className="app-footer" aria-label="Application footer">
      <div className="footer-power">
        <div className="footer-glow" aria-hidden="true" />
        <FooterLogo />
        <span className="footer-text">
          <span className="footer-text__prefix">Powered by</span>
          <span className="footer-text__brand">CodeBoxx</span>
        </span>
      </div>
      <button type="button" className="footer-link" onClick={onTermsClick}>
        Terms &amp; Conditions
      </button>
    </footer>
  );
}
