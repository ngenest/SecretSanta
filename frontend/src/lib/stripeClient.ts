type StripeConstructor = (key: string, options?: Record<string, unknown>) => any;
type StripeClient = ReturnType<StripeConstructor> | null;

declare global {
  interface Window {
    Stripe?: StripeConstructor;
  }
}

let stripeLoadPromise: Promise<StripeConstructor> | null = null;
let stripeInstance: StripeClient = null;

const STRIPE_JS_SRC = 'https://js.stripe.com/v3/';

const ensureStripeJsLoaded = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Stripe.js can only load in the browser.'));
  }

  if (window.Stripe) {
    return Promise.resolve(window.Stripe as unknown as StripeConstructor);
  }

  if (!stripeLoadPromise) {
    stripeLoadPromise = new Promise<StripeConstructor>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = STRIPE_JS_SRC;
      script.async = true;
      script.onload = () => {
        if (window.Stripe) {
          resolve(window.Stripe as unknown as StripeConstructor);
        } else {
          reject(new Error('Stripe.js loaded but Stripe was not found on window.'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  }

  return stripeLoadPromise;
};

export async function loadStripeInstance(publishableKey: string) {
  if (!publishableKey) {
    throw new Error('A Stripe publishable key is required to initialize payments.');
  }

  if (stripeInstance) {
    return stripeInstance;
  }

  const StripeConstructor = await ensureStripeJsLoaded();
  stripeInstance = StripeConstructor(publishableKey, {
    betas: ['express_checkout_beta_1'],
  });
  return stripeInstance;
}

export function resetStripeInstance() {
  stripeInstance = null;
  stripeLoadPromise = null;
}
