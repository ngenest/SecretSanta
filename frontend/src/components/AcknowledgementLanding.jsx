import { useEffect, useMemo, useState } from 'react';

const EXCHANGE_TYPE_LABELS = {
  family: 'Family',
  'friends-and-family': 'Friends and Family',
  colleagues: 'Colleagues',
  neighbors: 'Neighbors',
  community: 'Community',
  other: 'Other group'
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const formatDateTime = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const safeText = (value, fallback = '') => {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  try {
    const text = String(value);
    return text.trim() || fallback;
  } catch (error) {
    return fallback;
  }
};

const DRAW_MODE_LABELS = {
  couples: 'Couples draw',
  individuals: 'Individual draw'
};

const resolveEventTypeLabel = (exchangeType, otherGroupType) => {
  if (exchangeType === 'other') {
    return otherGroupType?.trim() || 'Other group';
  }
  return EXCHANGE_TYPE_LABELS[exchangeType] || 'Secret Santa Event';
};

export default function AcknowledgementLanding() {
  const [status, setStatus] = useState(() => {
    const search = new URLSearchParams(window.location.search);
    return search.has('payload') ? 'loading' : 'missing';
  });
  const [ackData, setAckData] = useState(null);
  const [error, setError] = useState('');

  const payload = useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    return search.get('payload');
  }, []);

  useEffect(() => {
    if (!payload) {
      setStatus('missing');
      return;
    }

    let isMounted = true;
    setStatus('loading');
    fetch('/api/acknowledgements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: payload })
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'Unable to confirm acknowledgement');
        }
        return response.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setAckData(data);
        setStatus('success');
      })
      .catch((fetchError) => {
        console.error(fetchError);
        if (!isMounted) return;
        setError(fetchError.message);
        setStatus('invalid');
      });

    return () => {
      isMounted = false;
    };
  }, [payload]);

  useEffect(() => {
    if (status === 'invalid' || status === 'missing') {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 15000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status]);

  const handleClose = () => {
    window.close();
    setTimeout(() => {
      window.location.href = '/';
    }, 250);
  };

  const handleStartNewDraw = () => {
    window.location.href = '/';
  };

  if (status === 'loading') {
    return (
      <div className="ack-landing loading-state">
        <div className="snow-spinner" aria-hidden="true" />
        <p className="loading-text">Confirming your Secret Santa draw...</p>
      </div>
    );
  }

  if (status === 'invalid' || status === 'missing') {
    return (
      <div className="ack-landing invalid-state">
        <div className="invalid-content">
          <h1>
            You have no business here, you first need to organize a Secret Santa event to be landing here.
          </h1>
          {error ? <p className="invalid-error">({error})</p> : null}
          <div className="crashed-sleigh" aria-hidden="true">
            <div className="snow-bank" />
            <div className="sleigh-body">
              <div className="sleigh-runner" />
              <div className="sleigh-runner" />
            </div>
            <div className="present-burst">
              <span />
              <span />
              <span />
            </div>
          </div>
          <p className="redirect-message">You will be redirected to start a new draw shortly...</p>
        </div>
      </div>
    );
  }

  if (!ackData) {
    return null;
  }

  const eventTypeLabel =
    ackData.eventTypeLabel || resolveEventTypeLabel(ackData.exchangeType, ackData.otherGroupType);
  const formattedEventDate = formatDate(ackData.eventDate);
  const formattedDrawDate = formatDateTime(ackData.drawDate);
  const confirmationTimestamp = formatDateTime(ackData.acknowledgedAt);
  const drawModeLabel = DRAW_MODE_LABELS[ackData.drawMode] || 'Secret Santa draw';
  const giverName = safeText(ackData.giverName, 'Secret Santa');
  const receiverName = safeText(ackData.receiverName, 'your match');
  const eventName = safeText(ackData.eventName, 'your Secret Santa event');
  const organizer = ackData.organizer || {};
  const organizerInfo = {
    name: safeText(organizer.name),
    email: safeText(organizer.email),
    phone: safeText(organizer.phone)
  };
  const hasOrganizerContact = Boolean(organizerInfo.name || organizerInfo.email || organizerInfo.phone);
  const receiverEmail = safeText(ackData.receiverEmail);
  const receiverPhone = safeText(ackData.receiverPhone);
  const receiverPhoneDial = receiverPhone ? receiverPhone.replace(/[^+\d]/g, '') : '';
  const receiverContactProvided = Boolean(receiverEmail || receiverPhone);
  const acknowledgementLink = safeText(ackData.acknowledgementUrl);
  const rulesLines = useMemo(
    () =>
      (ackData.secretSantaRules || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [ackData.secretSantaRules]
  );

  return (
    <div className="ack-landing success-state">
      <div className="festive-lights" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} className={`light-bulb bulb-${(index % 6) + 1}`} />
        ))}
      </div>
      <div className="gift-animation" aria-hidden="true">
        <div className="gift-box">
          <div className="gift-lid" />
          <div className="gift-ribbon" />
        </div>
        <div className="gift-sparkles">
          <span />
          <span />
          <span />
        </div>
      </div>
      <main className="ack-content">
        <h1 className="ack-greeting">Thank you, {giverName}! 🎄</h1>
        <p className="ack-intro">
          At the present time, nobody else but you knows who you were matched with.
          Keep the magic alive, keep it a secret!
        </p>
        <p className="ack-callout">Your draw has been confirmed.</p>
        <p className="ack-neon">{receiverName} is going to be so happy with your gift!</p>
        <section className="ack-summary">
          <div className="ack-summary-item">
            <span className="ack-summary-label">Event</span>
            <span className="ack-summary-value">{eventName}</span>
          </div>
          <div className="ack-summary-item">
            <span className="ack-summary-label">Celebration date</span>
            <span className="ack-summary-value">{formattedEventDate || 'Date to be announced'}</span>
          </div>
          <div className="ack-summary-item">
            <span className="ack-summary-label">Event type</span>
            <span className="ack-summary-value">{eventTypeLabel}</span>
          </div>
          <div className="ack-summary-item">
            <span className="ack-summary-label">Draw mode</span>
            <span className="ack-summary-value">{drawModeLabel}</span>
          </div>
          {formattedDrawDate ? (
            <div className="ack-summary-item">
              <span className="ack-summary-label">Drawn on</span>
              <span className="ack-summary-value">{formattedDrawDate}</span>
            </div>
          ) : null}
        </section>
        <section className="ack-assignment">
          <h2>Your assignment</h2>
          <p>
            You will be gifting <strong>{receiverName}</strong> this year. Keep an eye on their wish list and
            spread the cheer!
          </p>
          {receiverContactProvided ? (
            <div className="ack-assignment-details">
              {receiverEmail ? (
                <p>
                  <span>Email:</span>{' '}
                  <a href={`mailto:${receiverEmail}`}>{receiverEmail}</a>
                </p>
              ) : null}
              {receiverPhone ? (
                <p>
                  <span>Phone:</span>{' '}
                  <a href={`tel:${receiverPhoneDial}`}>{receiverPhone}</a>
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
        {rulesLines.length > 0 && (
          <section className="ack-rules">
            <h2>Secret Santa Rules</h2>
            <ul>
              {rulesLines.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </section>
        )}
        <section className="ack-meta-grid">
          <article className="ack-meta-card">
            <h3>Draw details</h3>
            <ul className="ack-meta-list">
              <li>
                <span className="ack-meta-label">Mode</span>
                <span className="ack-meta-value">{drawModeLabel}</span>
              </li>
              {formattedDrawDate ? (
                <li>
                  <span className="ack-meta-label">Draw date</span>
                  <span className="ack-meta-value">{formattedDrawDate}</span>
                </li>
              ) : null}
              {confirmationTimestamp ? (
                <li>
                  <span className="ack-meta-label">Confirmation recorded</span>
                  <span className="ack-meta-value">{confirmationTimestamp}</span>
                </li>
              ) : null}
              {acknowledgementLink ? (
                <li className="ack-meta-link">
                  <span className="ack-meta-label">Your link</span>
                  <a href={acknowledgementLink}>{acknowledgementLink}</a>
                </li>
              ) : null}
            </ul>
          </article>
          <article className="ack-meta-card">
            <h3>Organizer contact</h3>
            {hasOrganizerContact ? (
              <ul className="ack-meta-list">
                {organizerInfo.name ? (
                  <li>
                    <span className="ack-meta-label">Name</span>
                    <span className="ack-meta-value">{organizerInfo.name}</span>
                  </li>
                ) : null}
                {organizerInfo.email ? (
                  <li>
                    <span className="ack-meta-label">Email</span>
                    <a className="ack-meta-value" href={`mailto:${organizerInfo.email}`}>
                      {organizerInfo.email}
                    </a>
                  </li>
                ) : null}
                {organizerInfo.phone ? (
                  <li>
                    <span className="ack-meta-label">Phone</span>
                    <a className="ack-meta-value" href={`tel:${organizerInfo.phone.replace(/[^+\d]/g, '')}`}>
                      {organizerInfo.phone}
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="ack-meta-empty">Your organizer hasn&apos;t shared their contact details yet.</p>
            )}
          </article>
        </section>
        <p className="ack-footer">
          Need to tweak something? Reach out to your organizer if anything feels off. Ready to spread more joy?
          You can run your own Secret Santa below.
        </p>
        <div className="ack-actions">
          <button type="button" className="ack-secondary-button" onClick={handleStartNewDraw}>
            Organize your own Secret Santa
          </button>
          <button type="button" className="ack-close-button" onClick={handleClose}>
            Close this magical tab
          </button>
        </div>
      </main>
    </div>
  );
}
