import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<unknown> | null = null;

export const loadStripeInstance = async (publishableKey: string) => {
  if (!publishableKey) {
    throw new Error('Stripe publishable key is required');
  }

  if (stripePromise) {
    return stripePromise;
  }

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Stripe loading timed out')), 10000);
    });

    stripePromise = Promise.race([
      loadStripe(publishableKey),
      timeoutPromise
    ]);

    const stripe = await stripePromise;
    
    if (!stripe) {
      stripePromise = null;
      throw new Error('Failed to initialize Stripe');
    }

    return stripe;
  } catch (error) {
    stripePromise = null;
    console.error('Stripe initialization error:', error);
    throw error;
  }
};
