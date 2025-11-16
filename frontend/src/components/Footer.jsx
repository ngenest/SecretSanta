import CodeBoxxLogo from '../assets/codeboxx_logo_wtBlue.png';

export default function Footer({ onTermsClick }) {
  return (
    <footer className="app-footer" aria-label="Application footer">
      <div className="footer-power">
        <div className="footer-glow" aria-hidden="true" />
        <span className="footer-text">
          <span className="footer-text__prefix">Powered by</span>
        </span>
        <img
          src={CodeBoxxLogo}
          alt="CodeBoxx logo"
          className="footer-logo"
          loading="lazy"
        />
      </div>
      <button type="button" className="footer-link" onClick={onTermsClick}>
        Terms &amp; Conditions
      </button>
    </footer>
  );
}
