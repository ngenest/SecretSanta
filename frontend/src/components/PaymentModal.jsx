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

export default function PaymentModal({
  clientSecret,
  onClose,
  onSuccess,
  onError,
  organizerName,
  organizerEmail,
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

  const handleStripeError = (message) => {
    const fallback = 'We were unable to process your payment. Please try again.';
    const displayMessage = message?.trim() || fallback;
    setErrorMessage(displayMessage);
    onError?.(displayMessage);
  };

  useEffect(() => {
    let isSubscribed = true;
    let paymentElement;
    let expressElement;

    const setupStripe = async () => {
      if (!clientSecret) {
        setErrorMessage('We were unable to start the payment process.');
        return;
      }

      try {
        const stripe = await loadStripeInstance(STRIPE_PUBLISHABLE_KEY);
        if (!isSubscribed) {
          return;
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
              fontFamily: '"Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
            handleStripeError(
              error instanceof Error ? error.message : 'Payment could not be completed.'
            );
          } finally {
            if (isSubscribed) {
              setIsProcessing(false);
            }
          }
        });

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

        if (expressCheckoutRef.current) {
          expressElement.mount(expressCheckoutRef.current);
        }

        if (paymentElementRef.current) {
          paymentElement.mount(paymentElementRef.current);
        }

      } catch (error) {
        console.error('Failed to initialize Stripe elements', error);
        if (!isSubscribed) return;
        handleStripeError(
          error instanceof Error ? error.message : 'Unable to initialize the payment form.'
        );
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
  }, [clientSecret, organizerEmail, onError, onSuccess]);

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
      handleStripeError(error instanceof Error ? error.message : undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-modal-backdrop" role="dialog" aria-modal="true">
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
        <form className="payment-modal__form" onSubmit={handleSubmit}>
          {hasExpressCheckout && (
            <>
              <div className="payment-modal__express" ref={expressCheckoutRef} />
              <div className="payment-modal__divider" aria-hidden="true">
                <span>or pay with card</span>
              </div>
            </>
          )}
          <div className="payment-modal__element" ref={paymentElementRef}>
            {!isReady && <p className="payment-modal__loading">Loading payment options…</p>}
          </div>
          {errorMessage && (
            <p className="payment-modal__error" role="alert">
              {errorMessage}
            </p>
          )}
          <div className="payment-modal__actions">
            <button type="button" className="secondary" onClick={onClose} disabled={isProcessing}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={isProcessing || !isReady}>
              {isProcessing ? 'Processing…' : 'Pay'}
            </button>
          </div>
        </form>
        <footer className="payment-modal__footer">
          <p>
            By completing payment, notifications will be sent to every participant and a
            receipt will be emailed to you.
          </p>
        </footer>
      </div>
    </div>
  );
}
