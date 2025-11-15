import aiDoneRight from '../assets/ai-done-right.gif';

function TermsCelebration() {
  return (
    <div className="terms-celebration" aria-label="AI Done Right badge">
      <img src={aiDoneRight} alt="AI Done Right badge" loading="lazy" />
    </div>
  );
}

export default function TermsContent() {
  return (
    <article className="terms-content">
      <header className="terms-hero">
        <div className="terms-hero__aurora" aria-hidden="true" />
        <div className="terms-hero__text">
          <p className="terms-hero__eyebrow">Secret Santa Magic</p>
          <h1 id="terms-overlay-title" className="terms-hero__title">
            Terms &amp; Conditions
          </h1>
          <p className="terms-hero__updated">Last Updated: November 2025</p>
        </div>
      </header>

      <section className="terms-section">
        <p>
          Welcome to <strong>Secret Santa Magic</strong> — a festive, lightweight web
          application designed to orchestrate a seamless Secret Santa gift
          exchange among individuals or couples. By accessing or using this
          application (the “App”), you acknowledge that you have read,
          understood, and agree to be bound by the following Terms &amp;
          Conditions. If you do not agree, please do not use the App.
        </p>
      </section>

      <section className="terms-section">
        <h2>1. Purpose of the Application</h2>
        <p>Secret Santa Magic is a web-based experience featuring:</p>
        <ul>
          <li>A guided three-step funnel for event entry (name, date, participant list).</li>
          <li>A draw visualization with animated participant cards, snow effects, and confetti-like transitions.</li>
          <li>A backend derangement algorithm that ensures no participant draws themselves or their spouse.</li>
          <li>Email dispatch to each participant with their final assignment.</li>
          <li>A mobile-first, accessible interface with clear focus states and compliant color contrast.</li>
        </ul>
        <p>This App is intended for entertainment, personal use, and organizational holiday gift exchanges.</p>
      </section>

      <section className="terms-section">
        <h2>2. AI-Generated Software Disclosure</h2>
        <p>
          This application has been created <strong>entirely using Artificial Intelligence</strong>,
          under full human oversight and validation. The models used to create
          and publish this application include:
        </p>
        <ul>
          <li>OpenAI GPT-5.0</li>
          <li>OpenAI GPT-5.1</li>
          <li>Anthropic Claude Sonnet 4.5</li>
          <li>Grok AI</li>
        </ul>
        <p>
          A total of <strong>35 prompts</strong> were used throughout the development,
          generation, refinement, deployment, and publishing of this application.
        </p>
        <p>
          Secret Santa Magic adheres to the principles of <strong>“AI Done Right” / #AIDoneRight</strong>,
          emphasizing transparency, responsibility, safety, and user-first design.
        </p>
      </section>

      <section className="terms-section">
        <h2>3. Payment Processing (Stripe Compliance)</h2>
        <p>
          Where applicable, payment processing is performed via <strong>Stripe</strong>, implemented
          in accordance with Stripe’s latest security, data, and PCI compliance
          requirements. All financial transactions are processed through Stripe’s
          secure infrastructure. Secret Santa Magic <strong>does not store, process, or have access</strong>
          to any credit card or payment information.
        </p>
      </section>

      <section className="terms-section">
        <h2>4. Security Verification (Google reCAPTCHA v3)</h2>
        <p>
          This App uses <strong>Google reCAPTCHA v3</strong> to prevent automated abuse and
          verify legitimate user interactions. The integration is fully compliant
          with Google’s most recent security, usage, and privacy guidelines.
        </p>
      </section>

      <section className="terms-section">
        <h2>5. No Cookies, No Storage, No Persistence</h2>
        <p>Secret Santa Magic is engineered as a <strong>zero-data-retention</strong> system:</p>
        <ul>
          <li>No cookies are required.</li>
          <li>No personal information is ever stored.</li>
          <li>No data persists at any point throughout the lifecycle of the application.</li>
        </ul>
        <p>
          Any information entered during the Secret Santa setup exists only
          temporarily in memory for the purpose of executing the draw logic and
          emailing assignments. Once the draw and dispatch are completed, <strong>all information immediately ceases to exist</strong>
          and is never saved, logged, exported, or retained in any form.
        </p>
      </section>

      <section className="terms-section">
        <h2>6. User Responsibilities</h2>
        <p>By using this App, you agree to:</p>
        <ol>
          <li>Use the App solely for lawful purposes.</li>
          <li>Provide accurate participant email addresses if you choose to send assignments by email.</li>
          <li>Not attempt to reverse-engineer, misuse, interfere with, or disrupt the App.</li>
        </ol>
        <p>
          You acknowledge and accept that the App performs automated draws based
          on your inputs. You are solely responsible for reviewing the results
          and ensuring they meet your event’s requirements.
        </p>
      </section>

      <section className="terms-section">
        <h2>7. Limitation of Liability</h2>
        <p>
          Secret Santa Magic is provided <strong>“as-is”</strong> without warranties of any kind,
          whether express or implied. To the fullest extent permitted by law:
        </p>
        <ul>
          <li>The creators of this App are <strong>not liable for any damages</strong>, losses, interruptions, or errors arising from its use.</li>
          <li>Email delivery to all participants is <strong>best-effort</strong> and may be affected by spam filters, network issues, or incorrect email entries.</li>
        </ul>
        <p>
          Your use of the App constitutes your agreement that you assume all
          risks associated with its use.
        </p>
      </section>

      <section className="terms-section">
        <h2>8. Intellectual Property</h2>
        <p>
          All branding, animations, interface elements, draw logic, and supporting
          content within Secret Santa Magic are the intellectual property of the
          creators and/or CodeBoxx, unless otherwise stated. You may not copy,
          distribute, modify, resell, or reproduce any part of the App without
          written permission.
        </p>
      </section>

      <section className="terms-section">
        <h2>9. Termination of Access</h2>
        <p>
          The developers reserve the right to modify, suspend, or discontinue the
          App or its features at any time without notice. Your continued use of
          the App following any updates to these Terms constitutes acceptance of
          the revised Terms.
        </p>
      </section>

      <section className="terms-section">
        <h2>10. Support &amp; Contact</h2>
        <p>
          For support, questions, or clarifications regarding the App or these
          Terms, you can reach the team at{' '}
          <a href="mailto:secretsanta@codeboxx.com">secretsanta@codeboxx.com</a>.
        </p>
      </section>

      <section className="terms-section">
        <h2>11. Building Your Own Magic</h2>
        <p>
          If you like what you see and want to bring similar magic to your
          organization, CodeBoxx would be delighted to help.
        </p>
        <ul>
          <li>
            <a href="mailto:info@codeboxx.com">info@codeboxx.com</a>
          </li>
          <li>
            <a href="https://solutions.codeboxx.com" target="_blank" rel="noreferrer">
              solutions.codeboxx.com
            </a>
          </li>
        </ul>
        <p>
          Speak with an <strong>AI-Native Technologist</strong> about building software that’s
          as light, elegant, and joyful as Secret Santa Magic — or explore how we
          craft large-scale, enterprise-grade platforms, just like we do for:
        </p>
        <ul className="terms-partner-list">
          <li>eBay</li>
          <li>Catalyst Group</li>
          <li>Amsale</li>
          <li>Garoy</li>
          <li>Lucky Brand</li>
          <li>Aeropostale</li>
          <li>Full Harvest</li>
          <li>Groupe Voyage Québec</li>
        </ul>
      </section>

      <section className="terms-section">
        <h2>12. Acceptance of Terms</h2>
        <p>
          <strong>By using this application, you acknowledge that you have read, understood, and accepted these Terms &amp; Conditions.</strong>
        </p>
        <p>Thank you for choosing <strong>Secret Santa Magic</strong> — where simple, safe, AI-native technology helps bring people together.</p>
      </section>

      <TermsCelebration />
    </article>
  );
}
