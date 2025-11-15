import TermsContent from './TermsContent.jsx';
import aiDoneRight from '../assets/AI-done-right.gif';

const redirectHome = () => {
  window.location.href = '/';
};

const closeWindow = () => {
  window.close();
  setTimeout(() => {
    redirectHome();
  }, 300);
};

export default function TermsPage() {
  return (
    <div className="terms-page">
      <div className="terms-page__aurora" aria-hidden="true" />
      <div className="terms-page__card">
        <TermsContent />
        <div className="terms-ai-done-right">
          <img src={aiDoneRight} alt="AI Done Right" />
        </div>
        <div className="terms-actions terms-actions--page">
          <button type="button" className="terms-button terms-button--secondary" onClick={closeWindow}>
            Close
          </button>
          <button type="button" className="terms-button terms-button--primary" onClick={redirectHome}>
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}
