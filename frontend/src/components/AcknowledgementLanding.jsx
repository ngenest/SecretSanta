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

  const eventTypeLabel = ackData.eventTypeLabel || resolveEventTypeLabel(ackData.exchangeType, ackData.otherGroupType);
  const formattedDate = formatDate(ackData.eventDate);

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
        <h1 className="ack-greeting">Thank you, {ackData.giverName || 'Secret Santa'}! 🎄</h1>
        <p className="ack-intro">
          At the present time, nobody else but you knows who you were matched with.
          Keep the magic alive, keep it a secret!
        </p>
        <p className="ack-callout">Your draw has been confirmed.</p>
        <p className="ack-neon">{ackData.receiverName} is going to be so happy with your gift!</p>
        <section className="ack-details">
          <p>
            <strong>Event:</strong> {ackData.eventName}
          </p>
          <p>
            <strong>Date:</strong> {formattedDate}
          </p>
          <p>
            <strong>Event type:</strong> {eventTypeLabel}
          </p>
        </section>
        <p className="ack-footer">
          Now go get this unforgettable present and contact your organizer if there is any problem with the draw.
        </p>
        <button type="button" className="ack-close-button" onClick={handleClose}>
          Close this magical tab
        </button>
      </main>
    </div>
  );
}
