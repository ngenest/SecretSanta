import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NOTIFICATION_PAYMENT_AMOUNT_CENTS,
  NOTIFICATION_PAYMENT_CURRENCY,
  STRIPE_PUBLISHABLE_KEY,
} from '../config/payments.ts';
import { loadStripeInstance } from '../lib/stripeClient.ts';

const formatCurrency = (amountCents, currency) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format((amountCents || 0) / 100);
  } catch (error) {
    console.warn('Failed to format currency', error);
    return `$${((amountCents || 0) / 100).toFixed(2)}`;
  }
};

const buildContactSummaries = (participants = []) =>
  participants.map((participant, index) => {
    const name = participant.name?.trim() || `Participant ${index + 1}`;
    const email = participant.email?.trim();
    const phone = participant.phone?.trim();
    const hasEmail = Boolean(email);
    const hasPhone = Boolean(phone);

    if (hasEmail && hasPhone) {
      return `${name} will be contacted at ${email} and ${phone}`;
    }

    if (hasEmail) {
      return `${name} will be contacted at ${email}`;
    }

    if (hasPhone) {
      return `${name} will be contacted at ${phone}`;
    }

    return `${name} does not have contact information on file.`;
  });

const extractPaymentIntentId = (eventPayload) => {
  if (!eventPayload) {
    return '';
  }

  if (typeof eventPayload === 'string') {
    return eventPayload;
  }

  if (typeof eventPayload === 'object') {
    if (typeof eventPayload.payment_intent === 'string') {
      return eventPayload.payment_intent;
    }
    if (typeof eventPayload.paymentIntentId === 'string') {
      return eventPayload.paymentIntentId;
    }

    const nested = eventPayload.detail || eventPayload.data || eventPayload.payload;
    if (typeof nested === 'string') {
      return nested;
    }
    if (nested && typeof nested === 'object') {
      if (typeof nested.payment_intent === 'string') {
        return nested.payment_intent;
      }
      if (typeof nested.paymentIntentId === 'string') {
        return nested.paymentIntentId;
      }
    }
  }

  return '';
};

const PAYMENT_DESCRIPTION = 'Secret Santa notification delivery';

export default function PaymentScreen({
  clientSecret,
  checkoutSessionId,
  organizerName,
  organizerEmail,
  eventName,
  participants,
  onCancel,
  onSuccess,
  onError,
  onRetryNotifications,
  isSendingNotifications = false,
  notificationError = '',
  completedCheckoutSessionId = '',
  paymentIntentId = '',
}) {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const containerRef = useRef(null);
  const checkoutRef = useRef(null);
  const cancelRef = useRef(onCancel);
  const successRef = useRef(onSuccess);
  const errorRef = useRef(onError);

  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    successRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    errorRef.current = onError;
  }, [onError]);

  const displayAmount = useMemo(
    () => formatCurrency(NOTIFICATION_PAYMENT_AMOUNT_CENTS, NOTIFICATION_PAYMENT_CURRENCY),
    []
  );

  const contactSummaries = useMemo(() => buildContactSummaries(participants), [participants]);

  const paymentCompleted = Boolean(completedCheckoutSessionId);
  const canRenderCheckout = Boolean(clientSecret && checkoutSessionId && !paymentCompleted);

  useEffect(() => {
    if (paymentCompleted) {
      setStatus('complete');
    }
  }, [paymentCompleted]);

  useEffect(() => {
    if (!canRenderCheckout) {
      setErrorMessage('');
      if (!paymentCompleted) {
        setStatus('idle');
      }
      if (checkoutRef.current) {
        try {
          if (typeof checkoutRef.current.destroy === 'function') {
            checkoutRef.current.destroy();
          } else if (typeof checkoutRef.current.unmount === 'function') {
            checkoutRef.current.unmount();
          }
        } catch (error) {
          console.warn('Failed to clean up checkout instance', error);
        }
        checkoutRef.current = null;
      }
      return undefined;
    }

    let isMounted = true;
    let checkoutInstance = null;
    const listeners = [];

    const detachAll = () => {
      if (!checkoutInstance) return;
      listeners.forEach(({ type, handler }) => {
        try {
          if (typeof checkoutInstance.removeEventListener === 'function') {
            checkoutInstance.removeEventListener(type, handler);
          } else if (typeof checkoutInstance.off === 'function') {
            checkoutInstance.off(type, handler);
          }
        } catch (error) {
          console.warn('Failed to detach checkout listener', type, error);
        }
      });
    };

    const attachListener = (type, handler) => {
      if (!checkoutInstance || typeof handler !== 'function') return;
      try {
        if (typeof checkoutInstance.addEventListener === 'function') {
          checkoutInstance.addEventListener(type, handler);
          listeners.push({ type, handler });
        } else if (typeof checkoutInstance.on === 'function') {
          checkoutInstance.on(type, handler);
          listeners.push({ type, handler });
        }
      } catch (error) {
        console.warn('Failed to attach checkout listener', type, error);
      }
    };

    const initializeCheckout = async () => {
      setStatus('loading');
      setErrorMessage('');

      try {
        const stripe = await loadStripeInstance(STRIPE_PUBLISHABLE_KEY);
        if (!isMounted) {
          return;
        }

        if (!stripe || typeof stripe.initEmbeddedCheckout !== 'function') {
          throw new Error('Stripe Checkout is unavailable. Please refresh and try again.');
        }

        checkoutInstance = await stripe.initEmbeddedCheckout({ clientSecret });
        if (!isMounted) {
          if (checkoutInstance) {
            if (typeof checkoutInstance.destroy === 'function') {
              checkoutInstance.destroy();
            } else if (typeof checkoutInstance.unmount === 'function') {
              checkoutInstance.unmount();
            }
          }
          return;
        }

        checkoutRef.current = checkoutInstance;

        attachListener('ready', () => {
          if (!isMounted) return;
          setStatus('ready');
        });

        attachListener('change', () => {
          if (!isMounted) return;
          setErrorMessage('');
        });

        attachListener('submit', () => {
          if (!isMounted) return;
          setStatus('processing');
          setErrorMessage('');
        });

        attachListener('cancel', () => {
          if (!isMounted) return;
          setStatus('ready');
          cancelRef.current?.();
        });

        attachListener('error', (event) => {
          if (!isMounted) return;
          const message =
            event?.detail?.message ||
            event?.error?.message ||
            event?.message ||
            'We were unable to complete the checkout. Please try again.';
          setStatus('error');
          setErrorMessage(message);
          errorRef.current?.(message);
        });

        attachListener('complete', (event) => {
          if (!isMounted) return;
          setStatus('complete');
          const intentId = extractPaymentIntentId(event);
          successRef.current?.({
            sessionId: checkoutSessionId,
            paymentIntentId: intentId,
          });
        });

        if (!containerRef.current) {
          throw new Error('Unable to mount checkout. Please refresh and try again.');
        }

        checkoutInstance.mount(containerRef.current);
      } catch (error) {
        console.error('Failed to initialize Stripe Checkout', error);
        if (!isMounted) {
          return;
        }
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'We could not load the checkout form. Please try again.';
        setStatus('error');
        setErrorMessage(message);
        errorRef.current?.(message);
      }
    };

    initializeCheckout();

    return () => {
      isMounted = false;
      detachAll();
      if (checkoutInstance) {
        try {
          if (typeof checkoutInstance.destroy === 'function') {
            checkoutInstance.destroy();
          } else if (typeof checkoutInstance.unmount === 'function') {
            checkoutInstance.unmount();
          }
        } catch (error) {
          console.warn('Failed to clean up checkout instance', error);
        }
      }
      if (checkoutRef.current === checkoutInstance) {
        checkoutRef.current = null;
      }
    };
  }, [canRenderCheckout, clientSecret, checkoutSessionId, paymentCompleted]);

  const disableBackButton = status === 'processing';
  const showCheckoutForm = canRenderCheckout;
  const showFallback = !showCheckoutForm && !paymentCompleted;
  const showCompletion = paymentCompleted;

  return (
    <main className="screen screen-payment">
      <div className="payment-screen__container">
        <section className="payment-screen__summary">
          <h1>Express checkout for instant magic</h1>
          <p>
            A quick <strong>{displayAmount}</strong> payment keeps the holiday surprise alive. We’ll send every
            assignment as soon as your payment is confirmed.
          </p>
          {eventName?.trim() && (
            <p className="payment-screen__event">Event: {eventName.trim()}</p>
          )}
          <p>
            Billing address is all we need for your receipt. No passwords, no extra forms — just a fast, secure
            checkout powered by Stripe.
          </p>
          {contactSummaries.length > 0 && (
            <div className="payment-screen__contact">
              <h2>Planned notifications</h2>
              <ul>
                {contactSummaries.map((summary, index) => (
                  <li key={participants?.[index]?.id || index}>{summary}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="payment-screen__form" aria-live="polite">
          <div className="checkout-card">
            <header className="checkout-card__header">
              <h2>Secure checkout</h2>
              {organizerName?.trim() && (
                <p className="checkout-card__greeting">Hi {organizerName.trim()}! Let’s wrap this up.</p>
              )}
              <p className="checkout-card__lead">
                Confirm a one-time payment of <strong>{displayAmount}</strong> to deliver every Secret Santa assignment.
              </p>
              <p className="checkout-card__description">{PAYMENT_DESCRIPTION}</p>
            </header>

            {showCheckoutForm && (
              <div className="checkout-card__body">
                <div
                  className={`checkout-embed checkout-embed--${status}`}
                >
                  <div className="checkout-embed__frame" ref={containerRef} />
                  {status === 'loading' && (
                    <p className="checkout-embed__status">Setting up secure checkout…</p>
                  )}
                  {status === 'processing' && (
                    <p className="checkout-embed__status">Processing payment…</p>
                  )}
                </div>
                {(errorMessage || notificationError) && (
                  <p className="checkout-card__error" role="alert">
                    {errorMessage || notificationError}
                  </p>
                )}
                <div className="checkout-card__actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={onCancel}
                    disabled={disableBackButton}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {showFallback && (
              <div className="checkout-card__body checkout-card__body--fallback">
                <p className="checkout-card__error" role="alert">
                  {errorMessage ||
                    notificationError ||
                    'We were unable to load checkout. Please go back and try again.'}
                </p>
                <div className="checkout-card__actions">
                  <button type="button" className="secondary" onClick={onCancel}>
                    Back to draw
                  </button>
                </div>
              </div>
            )}

            {showCompletion && (
              <div className="checkout-card__body checkout-card__body--complete">
                <p className="checkout-card__success" role="status">
                  Payment confirmed! We’re preparing your notifications now.
                </p>
                {paymentIntentId && (
                  <p className="checkout-card__reference">Payment reference: {paymentIntentId}</p>
                )}
                {isSendingNotifications && (
                  <p className="checkout-card__status">Sending notifications…</p>
                )}
                {notificationError && (
                  <>
                    <p className="checkout-card__status checkout-card__status--error" role="alert">
                      {notificationError}
                    </p>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => onRetryNotifications?.(completedCheckoutSessionId, paymentIntentId)}
                      disabled={isSendingNotifications}
                    >
                      {isSendingNotifications ? 'Retrying…' : 'Retry notification delivery'}
                    </button>
                  </>
                )}
              </div>
            )}

            <footer className="checkout-card__footer">
              <p>
                Stripe handles the payment securely. Once complete, we’ll email you a receipt thanking you for organizing
                this draw with our services.
              </p>
              {organizerEmail?.trim() && (
                <p className="checkout-card__meta">Receipt will be sent to {organizerEmail.trim()}.</p>
              )}
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
