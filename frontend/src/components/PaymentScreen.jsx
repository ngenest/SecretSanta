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
    }).format(amountCents / 100);
  } catch (error) {
    console.warn('Failed to format currency', error);
    return `$${(amountCents / 100).toFixed(2)}`;
  }
};

const PAYMENT_DESCRIPTION = 'Secret Santa notification delivery';

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

export default function PaymentScreen({
  clientSecret,
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
  completedPaymentIntentId = '',
}) {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasExpressCheckout, setHasExpressCheckout] = useState(false);

  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const paymentElementRef = useRef(null);
  const expressCheckoutRef = useRef(null);

  const displayAmount = useMemo(
    () => formatCurrency(NOTIFICATION_PAYMENT_AMOUNT_CENTS, NOTIFICATION_PAYMENT_CURRENCY),
    []
  );

  const contactSummaries = useMemo(() => buildContactSummaries(participants), [participants]);

  const handleStripeError = (message) => {
    const fallback = 'We were unable to process your payment. Please try again.';
    const displayMessage = message?.trim() || fallback;
    setErrorMessage(displayMessage);
    onError?.(displayMessage);
  };

  useEffect(() => {
    if (!clientSecret || completedPaymentIntentId) {
      setIsReady(false);
      setHasExpressCheckout(false);
      setErrorMessage('');
      return undefined;
    }

    let isSubscribed = true;
    let paymentElement;
    let expressElement;

    const setupStripe = async () => {
      try {
        const stripe = await loadStripeInstance(STRIPE_PUBLISHABLE_KEY);
        if (!isSubscribed) {
          return;
        }

        if (!stripe) {
          throw new Error('Failed to load Stripe. Please check your internet connection and try again.');
        }

        stripeRef.current = stripe;
        const elements = stripe.elements({
          clientSecret,
          appearance: {
            theme: 'flat',
            variables: {
              colorPrimary: '#B71C1C',
              colorText: '#1F2937',
              borderRadius: '12px',
              fontFamily:
                '"Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            },
            rules: {
              '.Label': {
                fontWeight: '600',
              },
              '.Input': {
                padding: '14px 12px',
              },
              '.Error': {
                marginTop: '8px',
              },
              '.Tab': {
                borderRadius: '12px',
                padding: '10px 14px',
              },
              '.SubmitButton': {
                fontSize: '16px',
                fontWeight: '700',
                padding: '12px 16px',
              },
            },
          },
          fields: {
            billingDetails: {
              address: 'auto',
              email: 'never',
              name: 'never',
              phone: 'never',
            },
          },
        });

        elementsRef.current = elements;

        try {
          expressElement = elements.create('expressCheckout', {
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
            buttonHeight: 44,
            paymentMethodOrder: ['apple_pay', 'google_pay', 'link', 'paypal', 'amazon_pay'],
            walletCollections: ['apple_pay', 'google_pay', 'paypal', 'link', 'amazon_pay'],
          });

          expressElement.on('ready', () => {
            if (!isSubscribed) return;
            setHasExpressCheckout(true);
          });

          expressElement.on('confirm', async (event) => {
            setErrorMessage('');
            setIsProcessing(true);
            try {
              const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                  return_url: window.location.href,
                  receipt_email: organizerEmail || undefined,
                },
                redirect: 'if_required',
              });

              if (error) {
                event.complete('fail');
                handleStripeError(error.message);
                return;
              }

              if (paymentIntent?.status === 'succeeded') {
                event.complete('success');
                onSuccess?.(paymentIntent);
                return;
              }

              event.complete('fail');
              handleStripeError('Payment was not completed.');
            } catch (error) {
              console.error('Express checkout confirmation failed', error);
              event.complete('fail');
              const message =
                error instanceof Error && error.message.includes('JSON')
                  ? 'Payment service is temporarily unavailable. Please try again in a moment.'
                  : error instanceof Error
                  ? error.message
                  : 'Payment could not be completed.';
              handleStripeError(message);
            } finally {
              if (isSubscribed) {
                setIsProcessing(false);
              }
            }
          });
        } catch (error) {
          console.info('Express checkout not available', error);
          expressElement = null;
        }

        paymentElement = elements.create('payment', {
          layout: 'tabs',
          defaultValues: organizerEmail
            ? {
                billingDetails: {
                  email: organizerEmail,
                },
              }
            : undefined,
        });

        paymentElement.on('ready', () => {
          if (!isSubscribed) return;
          setIsReady(true);
        });

        paymentElement.on('change', () => {
          setErrorMessage('');
        });

        if (expressElement && expressCheckoutRef.current) {
          expressElement.mount(expressCheckoutRef.current);
        }

        if (paymentElementRef.current) {
          paymentElement.mount(paymentElementRef.current);
        }
      } catch (error) {
        console.error('Failed to initialize Stripe elements', error);
        if (!isSubscribed) return;
        const message =
          error instanceof Error && (error.message.includes('JSON') || error.message.includes('504'))
            ? 'Payment service is temporarily unavailable. Please check your internet connection and try again.'
            : error instanceof Error
            ? error.message
            : 'Unable to initialize the payment form.';
        handleStripeError(message);
      }
    };

    setupStripe();

    return () => {
      isSubscribed = false;
      if (paymentElement) {
        paymentElement.destroy();
      }
      if (expressElement) {
        expressElement.destroy();
      }
      elementsRef.current = null;
      stripeRef.current = null;
      setHasExpressCheckout(false);
      setIsReady(false);
    };
  }, [clientSecret, completedPaymentIntentId, organizerEmail, onError, onSuccess]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripeRef.current || !elementsRef.current) {
      handleStripeError('Payment form is not ready yet.');
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: {
          return_url: window.location.href,
          receipt_email: organizerEmail || undefined,
        },
        redirect: 'if_required',
      });

      if (error) {
        handleStripeError(error.message);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess?.(paymentIntent);
        return;
      }

      handleStripeError('Payment was not completed.');
    } catch (error) {
      console.error('Payment confirmation failed', error);
      const message =
        error instanceof Error && (error.message.includes('JSON') || error.message.includes('504'))
          ? 'Payment service is temporarily unavailable. Please try again in a moment.'
          : error instanceof Error
          ? error.message
          : 'Payment could not be completed.';
      handleStripeError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentCompleted = Boolean(completedPaymentIntentId);
  const canRenderPaymentForm = Boolean(clientSecret) && !paymentCompleted;

  return (
    <main className="screen screen-payment">
      <div className="payment-screen__container">
        <section className="payment-screen__summary">
          <h1>Matches locked in!</h1>
          <p>
            Your Secret Santa draw is ready to share. To deliver assignments to each
            participant, complete the secure payment below. We’ll send notifications as
            soon as the payment is confirmed.
          </p>
          {eventName?.trim() && (
            <p className="payment-screen__event">Event: {eventName.trim()}</p>
          )}
          {contactSummaries.length > 0 && (
            <div className="payment-screen__contact">
              <h2>How we’ll notify participants</h2>
              <ul>
                {contactSummaries.map((summary, index) => (
                  <li key={participants?.[index]?.id || index}>{summary}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section className="payment-screen__form" aria-live="polite">
          <div className="payment-modal">
            <header className="payment-modal__header">
              <h2>Secure payment required</h2>
              {organizerName?.trim() && (
                <p className="payment-modal__greeting">
                  Thank you, {organizerName.trim()}, for keeping the magic going!
                </p>
              )}
              <p>
                To send participant notifications, please confirm a one-time payment of{' '}
                <strong>{displayAmount}</strong>.
              </p>
              <p className="payment-modal__description">{PAYMENT_DESCRIPTION}</p>
            </header>

            {canRenderPaymentForm && (
              <form className="payment-modal__form" onSubmit={handleSubmit}>
                <div
                  className={`payment-modal__express${
                    hasExpressCheckout ? '' : ' payment-modal__express--inactive'
                  }`}
                  ref={expressCheckoutRef}
                  aria-hidden={!hasExpressCheckout}
                />
                {hasExpressCheckout && (
                  <div className="payment-modal__divider" aria-hidden="true">
                    <span>or pay with card</span>
                  </div>
                )}
                <div className="payment-modal__element" ref={paymentElementRef}>
                  {!isReady && <p className="payment-modal__loading">Loading payment options…</p>}
                </div>
                {(errorMessage || notificationError) && (
                  <p className="payment-modal__error" role="alert">
                    {errorMessage || notificationError}
                  </p>
                )}
                <div className="payment-modal__actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={onCancel}
                    disabled={isProcessing}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="primary"
                    disabled={isProcessing || !isReady}
                  >
                    {isProcessing ? 'Processing…' : 'Pay'}
                  </button>
                </div>
              </form>
            )}

            {!canRenderPaymentForm && !paymentCompleted && (
              <div className="payment-screen__fallback">
                <p className="payment-screen__status" role="alert">
                  {errorMessage ||
                    notificationError ||
                    'We were unable to load the payment form. Please go back and try again.'}
                </p>
                <button type="button" className="secondary" onClick={onCancel}>
                  Back to draw
                </button>
              </div>
            )}

            {paymentCompleted && (
              <div className="payment-screen__post-payment">
                <p className="payment-screen__success" role="status">
                  Payment confirmed! We’re preparing your notifications now.
                </p>
                {isSendingNotifications && (
                  <p className="payment-screen__status">Sending notifications…</p>
                )}
                {notificationError && (
                  <>
                    <p className="payment-screen__status payment-screen__status--error" role="alert">
                      {notificationError}
                    </p>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => onRetryNotifications?.(completedPaymentIntentId)}
                      disabled={isSendingNotifications}
                    >
                      {isSendingNotifications ? 'Retrying…' : 'Retry notification delivery'}
                    </button>
                  </>
                )}
              </div>
            )}

            <footer className="payment-modal__footer">
              <p>
                By completing payment, notifications will be sent to every participant and a
                receipt will be emailed to you.
              </p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
