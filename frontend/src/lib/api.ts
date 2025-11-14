import { API_BASE_URL } from '../config/api';
import { ApiError, apiFetch } from './apiClient';

const API_URL = API_BASE_URL;

export async function createDraw(drawData: any) {
  try {
    return await apiFetch(`${API_URL}/draw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(drawData),
    });
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

interface CheckoutSessionPayload {
  batchId: string;
  eventName?: string;
  organizer?: {
    name?: string;
    email?: string;
  };
}

export async function createNotificationCheckoutSession(payload: CheckoutSessionPayload) {
  try {
    return await apiFetch(`${API_URL}/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if ([502, 503, 504].includes(error.status ?? 0)) {
        throw new Error(
          'Payment service is temporarily unavailable. Please try again in a moment.'
        );
      }
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function sendNotifications(batchId: string, checkoutSessionId: string) {
  try {
    return await apiFetch(`${API_URL}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, checkoutSessionId }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function acknowledgeAssignment(token: string) {
  try {
    return await apiFetch(`${API_URL}/acknowledgements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}
