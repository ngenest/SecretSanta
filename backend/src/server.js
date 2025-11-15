import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import path from 'path';
import fs from 'fs';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import { fileURLToPath } from 'url';
import {
  randomUUID,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash
} from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMAIL_LOGO_DATA_URI = (() => {
  const candidateAssets = [
    {
      relativePath: '../../frontend/src/assets/secret_santa_app_gift_logo.png',
      mimeType: 'image/png'
    },
    {
      relativePath: './assets/secret-santa-logo-animated.gif',
      mimeType: 'image/gif'
    }
  ];

  for (const asset of candidateAssets) {
    const resolvedPath = path.resolve(__dirname, asset.relativePath);
    try {
      const buffer = fs.readFileSync(resolvedPath);
      return `data:${asset.mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      // Continue to the next candidate while keeping a helpful breadcrumb in development.
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Unable to load email logo asset at ${resolvedPath}`, error);
      }
    }
  }

  console.warn('Unable to load any email logo asset; emails will render without a logo.');
  return '';
})();

const EMAIL_LOGO_BLOCK = EMAIL_LOGO_DATA_URI
  ? `<div style="text-align:center;margin:0 0 20px;">
        <img src="${EMAIL_LOGO_DATA_URI}" alt="Secret Santa gift logo" style="width:160px;height:auto;border-radius:20px;box-shadow:0 18px 36px rgba(18, 16, 48, 0.28);" />
     </div>`
  : '';

const renderEmailTemplate = (content) => `
  <div style="background:linear-gradient(160deg,#080d23 0%,#1a1640 55%,#0f1c3c 100%);padding:32px 16px;">
    <div style="max-width:600px;margin:0 auto;background:rgba(255,255,255,0.94);border-radius:28px;padding:32px 36px;font-family: 'Nunito', Arial, sans-serif;color:#1f2438;box-shadow:0 28px 56px rgba(10, 14, 40, 0.35);">
      ${EMAIL_LOGO_BLOCK}
      ${content}
      <p style="margin-top:28px;font-size:12px;color:#5b5e7a;text-align:center;">Sent with Secret Santa Magic 🎁</p>
    </div>
  </div>
`;

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const RECAPTCHA_SECRET =
  process.env.RECAPTCHA_SECRET_KEY ||
  process.env.GOOGLE_RECAPTCHA_SECRET_KEY ||
  process.env.RECAPTCHA_SECRET ||
  '';
const RECAPTCHA_SITE_KEY =
  process.env.RECAPTCHA_SITE_KEY ||
  process.env.GOOGLE_RECAPTCHA_SITE_KEY ||
  '';
const RECAPTCHA_PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.RECAPTCHA_PROJECT_ID ||
  '';
const RECAPTCHA_ACTION = process.env.RECAPTCHA_ACTION?.trim() || 'event_setup';
const RECAPTCHA_REQUIREMENT =
  process.env.RECAPTCHA_REQUIRED?.toLowerCase() || '';
const RECAPTCHA_MINIMUM_SCORE = (() => {
  const parsed = Number.parseFloat(process.env.RECAPTCHA_MINIMUM_SCORE ?? '0.5');
  if (Number.isFinite(parsed)) {
    if (parsed < 0) return 0;
    if (parsed > 1) return 1;
    return parsed;
  }
  return 0.5;
})();
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const isRecaptchaEnterpriseConfigured = Boolean(RECAPTCHA_SITE_KEY && RECAPTCHA_PROJECT_ID);
const isRecaptchaConfigured = Boolean(RECAPTCHA_SECRET || isRecaptchaEnterpriseConfigured);

let recaptchaEnterpriseClient = null;
let recaptchaEnterpriseParentPath = '';

const getRecaptchaEnterpriseClient = () => {
  if (!isRecaptchaEnterpriseConfigured) {
    return null;
  }

  if (recaptchaEnterpriseClient && recaptchaEnterpriseParentPath) {
    return {
      client: recaptchaEnterpriseClient,
      parent: recaptchaEnterpriseParentPath
    };
  }

  try {
    const client = new RecaptchaEnterpriseServiceClient();
    recaptchaEnterpriseClient = client;
    recaptchaEnterpriseParentPath = client.projectPath(RECAPTCHA_PROJECT_ID);
    return {
      client,
      parent: recaptchaEnterpriseParentPath
    };
  } catch (error) {
    console.error('Failed to initialize reCAPTCHA Enterprise client.', error);
    recaptchaEnterpriseClient = null;
    recaptchaEnterpriseParentPath = '';
    return null;
  }
};

const shouldRequireRecaptcha = () => {
  if (RECAPTCHA_REQUIREMENT === 'true') {
    return true;
  }

  if (!isRecaptchaConfigured) {
    return false;
  }

  return isProduction;
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.ip;
};

const verifyRecaptchaToken = async (token, remoteIp) => {
  if (!token) {
    return { success: false, message: 'Missing reCAPTCHA token.' };
  }

  if (!isRecaptchaConfigured) {
    if (isProduction) {
      console.warn('reCAPTCHA is not configured. Skipping verification in production.');
    } else {
      console.warn('Skipping reCAPTCHA verification because it is not configured.');
    }
    return { success: true, skipped: true };
  }

  try {
    if (RECAPTCHA_SECRET) {
      const params = new URLSearchParams();
      params.append('secret', RECAPTCHA_SECRET);
      params.append('response', token);
      if (remoteIp?.trim()) {
        params.append('remoteip', remoteIp.trim());
      }

      const response = await fetch(RECAPTCHA_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      if (!response.ok) {
        console.error('Failed to contact reCAPTCHA verification endpoint.', await response.text());
        return { success: false, message: 'Unable to verify reCAPTCHA token.' };
      }

      const payload = await response.json();
      if (payload.success) {
        return { success: true, payload };
      }

      return {
        success: false,
        message: 'reCAPTCHA validation failed.',
        errorCodes: payload['error-codes'] || []
      };
    }

    const clientInfo = getRecaptchaEnterpriseClient();
    if (!clientInfo) {
      console.error('reCAPTCHA Enterprise client could not be initialized.');
      return { success: false, message: 'reCAPTCHA configuration error.' };
    }

    const assessmentRequest = {
      parent: clientInfo.parent,
      assessment: {
        event: {
          token,
          siteKey: RECAPTCHA_SITE_KEY,
          expectedAction: RECAPTCHA_ACTION,
          userIpAddress: remoteIp?.trim() || undefined
        }
      }
    };

    const [assessment] = await clientInfo.client.createAssessment(assessmentRequest);

    if (!assessment.tokenProperties?.valid) {
      const invalidReason = assessment.tokenProperties?.invalidReason;
      console.error('reCAPTCHA token invalid:', invalidReason || 'unknown reason');
      return {
        success: false,
        message: 'reCAPTCHA validation failed.',
        errorCodes: invalidReason ? [invalidReason] : []
      };
    }

    const assessmentAction = assessment.tokenProperties?.action;
    if (assessmentAction && assessmentAction !== RECAPTCHA_ACTION) {
      console.error('reCAPTCHA action mismatch.', { expected: RECAPTCHA_ACTION, received: assessmentAction });
      return {
        success: false,
        message: 'reCAPTCHA validation failed.',
        errorCodes: ['ACTION_MISMATCH']
      };
    }

    const riskScore = assessment.riskAnalysis?.score ?? 0;
    if (riskScore < RECAPTCHA_MINIMUM_SCORE) {
      console.warn('reCAPTCHA score below threshold.', {
        score: riskScore,
        minimum: RECAPTCHA_MINIMUM_SCORE,
        reasons: assessment.riskAnalysis?.reasons || []
      });
      return {
        success: false,
        message: 'reCAPTCHA validation failed.',
        errorCodes: assessment.riskAnalysis?.reasons || []
      };
    }

    return {
      success: true,
      payload: assessment,
      score: riskScore,
      reasons: assessment.riskAnalysis?.reasons || []
    };
  } catch (error) {
    console.error('Unexpected error during reCAPTCHA verification.', error);
    return { success: false, message: 'reCAPTCHA verification failed.' };
  }
};

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

const buildTransport = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined
    });
  }

  return nodemailer.createTransport({ jsonTransport: true });
};

const mailTransport = buildTransport();

const buildTwilioClient = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return null;
};

const twilioClient = buildTwilioClient();

const ACK_SECRET = process.env.ACK_SECRET || process.env.ACKNOWLEDGEMENT_SECRET || 'development-secret';

const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY ||
  process.env.STRIPE_SECRET ||
  process.env.STRIPE_API_KEY ||
  '';
const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const STRIPE_TIMEOUT_MS = 15000; // 15 second timeout
const NOTIFICATION_PAYMENT_AMOUNT_CENTS = 199;
const NOTIFICATION_PAYMENT_CURRENCY = 'usd';
const isStripeConfigured = Boolean(STRIPE_SECRET_KEY);

// Log Stripe configuration status on startup
if (isStripeConfigured) {
  console.log('✓ Stripe configured');
} else {
  console.warn('⚠ Stripe not configured - payment processing unavailable');
}

const getFirstHeaderValue = (headerValue = '') => headerValue.split(',')[0]?.trim();

const normalizeAckBaseUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  if (!withoutTrailingSlash) return null;
  return withoutTrailingSlash.toLowerCase().endsWith('/acknowledgement')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/acknowledgement`;
};

const normalizeBaseUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
};

const CONFIGURED_ACK_BASE_URL = normalizeAckBaseUrl(
  process.env.ACK_BASE_URL || process.env.APP_BASE_URL
);
const DEFAULT_ACK_BASE_URL = normalizeAckBaseUrl('http://localhost:5173');

const CONFIGURED_APP_BASE_URL =
  normalizeBaseUrl(process.env.APP_BASE_URL) ||
  (CONFIGURED_ACK_BASE_URL ? CONFIGURED_ACK_BASE_URL.replace(/\/?acknowledgement$/, '') : null);
const DEFAULT_APP_BASE_URL = normalizeBaseUrl('http://localhost:5173');

const resolveAckBaseUrl = (req) => {
  if (CONFIGURED_ACK_BASE_URL) {
    return CONFIGURED_ACK_BASE_URL;
  }

  const forwardedHost = getFirstHeaderValue(req?.get?.('x-forwarded-host'));
  const forwardedProto = getFirstHeaderValue(req?.get?.('x-forwarded-proto'));
  if (forwardedHost) {
    const protocol = forwardedProto || 'https';
    const normalized = normalizeAckBaseUrl(`${protocol}://${forwardedHost}`);
    if (normalized) {
      return normalized;
    }
  }

  const originHeader = req?.get?.('origin');
  if (originHeader) {
    const normalized = normalizeAckBaseUrl(originHeader);
    if (normalized) {
      return normalized;
    }
  }

  const refererHeader = req?.get?.('referer');
  if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      const normalized = normalizeAckBaseUrl(`${refererUrl.protocol}//${refererUrl.host}`);
      if (normalized) {
        return normalized;
      }
    } catch (error) {
      // Ignore invalid referer headers
    }
  }

  const hostHeader = getFirstHeaderValue(req?.get?.('host'));
  if (hostHeader) {
    const protocol = req?.protocol || 'http';
    const normalized = normalizeAckBaseUrl(`${protocol}://${hostHeader}`);
    if (normalized) {
      return normalized;
    }
  }

  return DEFAULT_ACK_BASE_URL;
};

const resolveAppBaseUrl = (req) => {
  if (CONFIGURED_APP_BASE_URL) {
    return CONFIGURED_APP_BASE_URL;
  }

  const forwardedHost = getFirstHeaderValue(req?.get?.('x-forwarded-host'));
  const forwardedProto = getFirstHeaderValue(req?.get?.('x-forwarded-proto'));
  if (forwardedHost) {
    const protocol = forwardedProto || 'https';
    const normalized = normalizeBaseUrl(`${protocol}://${forwardedHost}`);
    if (normalized) {
      return normalized;
    }
  }

  const originHeader = req?.get?.('origin');
  if (originHeader) {
    const normalized = normalizeBaseUrl(originHeader);
    if (normalized) {
      return normalized;
    }
  }

  const refererHeader = req?.get?.('referer');
  if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      const normalized = normalizeBaseUrl(`${refererUrl.protocol}//${refererUrl.host}`);
      if (normalized) {
        return normalized;
      }
    } catch (error) {
      // Ignore invalid referer headers
    }
  }

  const hostHeader = getFirstHeaderValue(req?.get?.('host'));
  if (hostHeader) {
    const protocol = req?.protocol || 'http';
    const normalized = normalizeBaseUrl(`${protocol}://${hostHeader}`);
    if (normalized) {
      return normalized;
    }
  }

  return DEFAULT_APP_BASE_URL;
};

const ACK_KEY = createHash('sha256').update(ACK_SECRET).digest();

const acknowledgementsStore = new Map();
const pendingNotificationBatches = new Map();

const EXCHANGE_LABELS = {
  family: 'Family',
  'friends-and-family': 'Friends and Family',
  colleagues: 'Colleagues',
  neighbors: 'Neighbors',
  community: 'Community',
  other: 'Other group'
};

const getExchangeLabel = (exchangeType, otherGroupType = '') => {
  if (exchangeType === 'other') {
    return otherGroupType?.trim() || 'Other group';
  }
  return EXCHANGE_LABELS[exchangeType] || 'Secret Santa Event';
};

const escapeHtml = (unsafe = '') =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatRulesHtml = (rules = '') => escapeHtml(rules).replace(/\r?\n/g, '<br />');

const collapseWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim();

const formatRulesForSms = (rules = '') => {
  const collapsed = collapseWhitespace(rules);
  if (!collapsed) return '';
  return collapsed.length > 200 ? `${collapsed.slice(0, 197)}...` : collapsed;
};

const formatDateOnly = (value) => {
  if (!value) return 'Unknown date';
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
  if (!value) return 'Unknown date';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const formatCurrency = (amountCents, currency = 'usd') => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency
    }).format((amountCents || 0) / 100);
  } catch (error) {
    const fallback = (amountCents || 0) / 100;
    return `${currency.toUpperCase()} ${fallback.toFixed(2)}`;
  }
};

const getTwilioSenderConfig = () => {
  const { TWILIO_MESSAGING_SERVICE_SID, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_MESSAGING_SERVICE_SID && !TWILIO_FROM_NUMBER) {
    console.warn(
      'Twilio configured but no messaging service SID or from number provided. Skipping SMS send.'
    );
    return null;
  }

  return TWILIO_MESSAGING_SERVICE_SID
    ? { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID }
    : { from: TWILIO_FROM_NUMBER };
};

const createAckToken = (payload) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ACK_KEY, iv);
  const serialized = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(serialized), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
};

const decodeAckToken = (token) => {
  const buffer = Buffer.from(token, 'base64url');
  const iv = buffer.subarray(0, 12);
  const authTag = buffer.subarray(12, 28);
  const ciphertext = buffer.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', ACK_KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
};

const toStripeParams = (entries = []) => {
  const params = new URLSearchParams();
  entries.forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    const stringValue = typeof value === 'string' ? value : String(value);
    if (!stringValue.trim()) {
      return;
    }
    params.append(key, stringValue);
  });
  return params;
};

const stripeRequest = async (endpoint, { method = 'GET', body } = {}) => {
  if (!isStripeConfigured) {
    const error = new Error('Stripe is not configured.');
    error.status = 503;
    throw error;
  }

  const headers = {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    'Stripe-Version': '2023-10-16'
  };

  let requestBody;
  if (body instanceof URLSearchParams) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    requestBody = body.toString();
  } else if (typeof body === 'string') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    requestBody = body;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STRIPE_TIMEOUT_MS);

  try {
    console.log(`Stripe API: ${method} ${endpoint}`);
    const startTime = Date.now();
    
    const response = await fetch(`${STRIPE_API_BASE}${endpoint}`, {
      method,
      headers,
      body: requestBody,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    console.log(`Stripe API: ${method} ${endpoint} - ${response.status} (${duration}ms)`);

    let payload = {};
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        payload = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse Stripe response as JSON', jsonError);
        payload = {};
      }
    } else {
      const text = await response.text();
      console.error('Stripe returned non-JSON response:', text.substring(0, 200));
      const error = new Error('Stripe API returned an invalid response.');
      error.status = 502;
      throw error;
    }

    if (!response.ok) {
      const message = payload?.error?.message || 'Stripe request failed.';
      console.error('Stripe API error:', message, payload);
      const error = new Error(message);
      error.status = response.status;
      error.details = payload;
      throw error;
    }

    return payload;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`Stripe API timeout after ${STRIPE_TIMEOUT_MS}ms: ${method} ${endpoint}`);
      const timeoutError = new Error('Stripe API request timed out. Please try again.');
      timeoutError.status = 504;
      throw timeoutError;
    }
    
    if (error.cause?.code === 'ENOTFOUND' || error.cause?.code === 'ECONNREFUSED') {
      console.error('Network error connecting to Stripe:', error.cause);
      const networkError = new Error('Unable to connect to payment service. Please check your internet connection.');
      networkError.status = 503;
      throw networkError;
    }
    
    throw error;
  }
};

const createNotificationCheckoutSession = async ({
  batchId,
  eventName,
  organizer,
  returnUrl
}) => {
  const trimmedEventName = eventName?.trim() || '';
  const organizerName = organizer?.name?.trim() || '';
  const organizerEmail = organizer?.email?.trim() || '';
  const description = trimmedEventName
    ? `Secret Santa notifications for ${trimmedEventName}`
    : 'Secret Santa notifications';

  const params = toStripeParams([
    ['mode', 'payment'],
    ['ui_mode', 'embedded'],
    ['submit_type', 'pay'],
    ['return_url', returnUrl],
    ['billing_address_collection', 'required'],
    ['customer_email', organizerEmail],
    ['line_items[0][quantity]', 1],
    ['line_items[0][price_data][currency]', NOTIFICATION_PAYMENT_CURRENCY],
    ['line_items[0][price_data][unit_amount]', NOTIFICATION_PAYMENT_AMOUNT_CENTS],
    ['line_items[0][price_data][product_data][name]', description],
    ['line_items[0][price_data][product_data][description]', 'One-time notification delivery'],
    ['metadata[notificationBatchId]', batchId],
    ['metadata[eventName]', trimmedEventName],
    ['metadata[organizerName]', organizerName],
    ['metadata[organizerEmail]', organizerEmail],
    ['metadata[purpose]', 'notification_payment'],
    ['payment_intent_data[metadata[notificationBatchId]]', batchId],
    ['payment_intent_data[metadata[eventName]]', trimmedEventName],
    ['payment_intent_data[metadata[organizerName]]', organizerName],
    ['payment_intent_data[metadata[organizerEmail]]', organizerEmail],
    ['payment_intent_data[metadata[purpose]]', 'notification_payment'],
    ['payment_intent_data[receipt_email]', organizerEmail]
  ]);

  return stripeRequest('/checkout/sessions', {
    method: 'POST',
    body: params
  });
};

const retrieveCheckoutSession = async (sessionId) =>
  stripeRequest(`/checkout/sessions/${sessionId}`, { method: 'GET' });

const retrievePaymentIntent = async (paymentIntentId) =>
  stripeRequest(`/payment_intents/${paymentIntentId}`, { method: 'GET' });

const registerAcknowledgements = ({ matches, event, ackBaseUrl }) => {
  const baseUrl = normalizeAckBaseUrl(ackBaseUrl) || DEFAULT_ACK_BASE_URL;
  const {
    name: eventName,
    date: eventDate,
    exchangeType,
    otherGroupType,
    secretSantaRules = '',
    organizer = {},
    drawMode = 'couples',
    drawDate
  } = event;
  const drawDateValue = drawDate || new Date().toISOString();
  const organizerName = organizer.name?.trim() || '';
  const organizerEmail = organizer.email?.trim() || '';
  const organizerPhone = organizer.phone?.trim() || '';

  return matches.map(({ giver, receiver }) => {
    const issuedAt = new Date().toISOString();
    const tokenPayload = {
      tokenId: randomUUID(),
      eventName,
      eventDate,
      exchangeType,
      otherGroupType,
      drawMode,
      drawDate: drawDateValue,
      giverId: giver.id,
      giverName: giver.name,
      giverEmail: giver.email,
      giverPhone: giver.phone,
      receiverId: receiver.id,
      receiverName: receiver.name,
      receiverEmail: receiver.email,
      receiverPhone: receiver.phone,
      secretSantaRules,
      organizerName,
      organizerEmail,
      organizerPhone,
      issuedAt
    };
    const token = createAckToken(tokenPayload);
    const acknowledgementUrl = `${baseUrl}?payload=${encodeURIComponent(token)}`;
    acknowledgementsStore.set(token, {
      ...tokenPayload,
      acknowledged: false,
      acknowledgementUrl,
      eventTypeLabel: getExchangeLabel(exchangeType, otherGroupType),
      secretSantaRules,
      organizerName,
      organizerEmail,
      organizerPhone,
      drawDate: drawDateValue
    });
    return {
      giverId: giver.id,
      acknowledgementUrl,
      token
    };
  });
};

const validatePayload = (body) => {
  const errors = [];
  if (!body) {
    errors.push('Body required');
    return errors;
  }

  if (shouldRequireRecaptcha() && !body.recaptchaToken) {
    errors.push('reCAPTCHA token is required');
  }

  const {
    name,
    date,
    drawMode,
    couples,
    individuals,
    organizer
  } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Event name is required');
  }

  if (!date || typeof date !== 'string' || !date.trim()) {
    errors.push('Event date is required');
  }

  if (!drawMode || (drawMode !== 'couples' && drawMode !== 'individuals')) {
    errors.push('Draw mode must be either couples or individuals');
  }

  const organizerName = organizer?.name?.trim();
  const organizerEmail = organizer?.email?.trim();
  const organizerPhone = organizer?.phone?.trim();

  if (!organizerName) {
    errors.push('Organizer name is required');
  }

  if (!organizerEmail && !organizerPhone) {
    errors.push('Organizer email or phone number is required');
  }

  const emails = new Set();
  const phones = new Set();
  const ids = new Set();

  const registerParticipant = (participant, contextLabel) => {
    if (!participant?.name?.trim()) {
      errors.push(`${contextLabel} missing name`);
    }
    const email = participant?.email?.trim();
    const phone = participant?.phone?.trim();
    if (!email && !phone) {
      errors.push(`${contextLabel} must include an email or phone number`);
    }
    if (participant?.id) {
      if (ids.has(participant.id)) {
        errors.push(`Duplicate participant id detected: ${participant.id}`);
      } else {
        ids.add(participant.id);
      }
    }
    if (email) {
      const normalizedEmail = email.toLowerCase();
      if (emails.has(normalizedEmail)) {
        errors.push(`Duplicate email detected: ${email}`);
      } else {
        emails.add(normalizedEmail);
      }
    }
    if (phone) {
      const normalizedPhone = phone.replace(/\D+/g, '');
      if (phones.has(normalizedPhone)) {
        errors.push(`Duplicate phone number detected: ${phone}`);
      } else {
        phones.add(normalizedPhone);
      }
    }
  };

  if (!drawMode || drawMode === 'couples') {
    if (!Array.isArray(couples) || couples.length < 2) {
      errors.push('At least two couples are required');
    }

    couples?.forEach((couple, coupleIndex) => {
      const pair = couple?.participants;
      if (!Array.isArray(pair) || pair.length !== 2) {
        errors.push(`Couple ${coupleIndex + 1} must have two participants`);
        return;
      }
      pair.forEach((participant, participantIndex) =>
        registerParticipant(
          participant,
          `Participant ${participantIndex + 1} in couple ${coupleIndex + 1}`
        )
      );
    });
  }

  if (drawMode === 'individuals') {
    if (!Array.isArray(individuals) || individuals.length < 3) {
      errors.push('At least three participants are required for an individual draw');
    }

    individuals?.forEach((participant, index) =>
      registerParticipant(participant, `Participant ${index + 1}`)
    );
  }

  return errors;
};

const derangeParticipants = (participants, { preventSameGroup = false } = {}) => {
  const givers = participants.map((p, index) => ({ ...p, index }));
  let receivers = [...givers];
  let attempts = 0;
  const maxAttempts = 5000;

  const isValid = (giver, receiver) => {
    if (giver.index === receiver.index) return false;
    if (preventSameGroup && giver.groupId !== undefined && giver.groupId === receiver.groupId) {
      return false;
    }
    return true;
  };

  while (attempts < maxAttempts) {
    attempts += 1;
    receivers = receivers
      .map((value) => ({ sortKey: Math.random(), value }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ value }) => value);

    const matches = givers.map((giver, idx) => ({ giver, receiver: receivers[idx] }));
    if (matches.every(({ giver, receiver }) => isValid(giver, receiver))) {
      return matches.map(({ giver, receiver }) => ({ giver, receiver }));
    }
  }

  throw new Error('Unable to generate valid Secret Santa pairings after many attempts.');
};

const sendEmails = async ({
  eventName,
  eventDate,
  eventTypeLabel,
  secretSantaRules,
  assignments,
  ackLinks
}) => {
  const recipients = assignments.filter(({ giver }) => giver.email);
  if (!recipients.length) return;

  const promises = recipients.map(({ giver, receiver }) => {
    const acknowledgementUrl = ackLinks.get(giver.id);
    const safeGiverName = escapeHtml(giver.name || 'Secret Santa friend');
    const safeReceiverName = escapeHtml(receiver.name || 'your match');
    const safeEventName = escapeHtml(eventName);
    const safeEventDate = escapeHtml(eventDate);
    const safeEventTypeLabel = escapeHtml(eventTypeLabel);
    const safeAckLinkText = escapeHtml(acknowledgementUrl);
    const rulesHtml = secretSantaRules
      ? `
          <div style="margin-top:24px;padding:18px 20px;border-radius:18px;background:rgba(248,250,255,0.96);border:1px solid rgba(66,133,244,0.18);box-shadow:0 12px 24px rgba(20,24,56,0.14);">
            <h3 style="margin:0 0 12px;color:#2d7ff9;font-size:18px;">Secret Santa Rules</h3>
            <p style="margin:0;color:#344054;line-height:1.6;">${formatRulesHtml(secretSantaRules)}</p>
          </div>`
      : '';
    const rulesText = secretSantaRules
      ? `\nSecret Santa Rules:\n${secretSantaRules}\n`
      : '';
    const message = {
      from: process.env.FROM_EMAIL || 'secretsanta@example.com',
      to: giver.email,
      subject: `Secret Santa Match for ${eventName}`,
      text: `Ho ho ho! You will be gifting ${receiver.name} for ${eventName} on ${eventDate}. Event type: ${eventTypeLabel}. Keep it secret!\n\nAt the present time, nobody else but you knows who you were matched with. Keep the magic alive, keep it a secret!\n\nYou need to click the following link to confirm that you have received and accept the result of your draw:\n${acknowledgementUrl}${rulesText}`,
      html: renderEmailTemplate(`
        <div style="line-height:1.65;">
          <h2 style="margin:0 0 16px;font-size:24px;color:#c2185b;">Your Secret Santa match is here! 🎁</h2>
          <p style="margin:0 0 12px;">Hi <strong>${safeGiverName}</strong>,</p>
          <p style="margin:0 0 12px;">You're gifting <strong>${safeReceiverName}</strong> for <strong>${safeEventName}</strong> on <strong>${safeEventDate}</strong>.</p>
          <p style="margin:0 0 16px;color:#6d1b7b;"><strong>Event type:</strong> ${safeEventTypeLabel}</p>
          <p style="margin:16px 0 20px;">Keep the magic alive and your match a secret!</p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${acknowledgementUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(120deg,#ff5f6d,#f9a826);color:#fff;font-weight:700;text-decoration:none;border-radius:999px;box-shadow:0 16px 26px rgba(255,95,109,0.35);">
              Confirm your Secret Santa draw
            </a>
          </div>
          <p style="margin:12px 0 0;font-size:13px;color:#4a4f6c;">If the button doesn't work, copy and paste this link:<br/><a href="${acknowledgementUrl}" style="color:#2d89ff;word-break:break-all;">${safeAckLinkText}</a></p>
          <p style="margin:20px 0 0;">Get something merry and bright!</p>
          ${rulesHtml}
        </div>
      `)
    };

    return mailTransport.sendMail(message);
  });

  await Promise.all(promises);
};

const sendSmsMessages = async ({
  eventName,
  eventDate,
  eventTypeLabel,
  secretSantaRules,
  assignments,
  ackLinks
}) => {
  if (!twilioClient) return;

  const recipients = assignments.filter(({ giver }) => giver.phone);
  if (!recipients.length) return;

  const senderConfig = getTwilioSenderConfig();
  if (!senderConfig) {
    return;
  }

  const promises = recipients.map(({ giver, receiver }) =>
    twilioClient.messages.create({
      ...senderConfig,
      to: giver.phone,
      body: `Secret Santa: You'll be gifting ${receiver.name} for ${eventName} on ${eventDate} (${eventTypeLabel}). Keep it secret! Confirm: ${ackLinks.get(giver.id)}${
        secretSantaRules ? ` Rules: ${formatRulesForSms(secretSantaRules)}` : ''
      }`
    })
  );

  await Promise.all(promises);
};

const sendOrganizerEmailNotification = async ({
  organizer,
  eventName,
  eventDate,
  eventTypeLabel,
  drawDate,
  participant
}) => {
  const email = organizer.email?.trim();
  if (!email) return;

  const organizerName = organizer.name?.trim() || 'Organizer';
  const contactSummary = [participant.email, participant.phone]
    .map((value) => (value || '').trim())
    .filter(Boolean)
    .join(' • ');
  const formattedContacts = contactSummary || 'No additional contact information provided';

  const message = {
    from: process.env.FROM_EMAIL || 'secretsanta@example.com',
    to: email,
    subject: `Participant confirmation for ${eventName}`,
    text: `Hello ${organizerName},\n${participant.name} (${formattedContacts}) confirmed their Secret Santa match for ${eventName}.\nDraw date: ${formatDateTime(drawDate)}\nGift exchange: ${formatDateOnly(eventDate)}\nEvent type: ${eventTypeLabel}\n`,
    html: renderEmailTemplate(`
      <div style="line-height:1.65;">
        <h2 style="margin:0 0 16px;color:#c2185b;">Participant confirmation 🎉</h2>
        <p style="margin:0 0 12px;">Hello ${escapeHtml(organizerName)},</p>
        <p style="margin:0 0 12px;">
          <strong>${escapeHtml(participant.name)}</strong>
          (${escapeHtml(formattedContacts)}) confirmed their Secret Santa match for
          <strong>${escapeHtml(eventName)}</strong>.
        </p>
        <div style="margin:18px 0;padding:18px 20px;border-radius:18px;background:rgba(248,250,255,0.96);border:1px solid rgba(66,133,244,0.18);">
          <p style="margin:0 0 8px;color:#33415c;"><strong>Draw date:</strong> ${escapeHtml(formatDateTime(drawDate))}</p>
          <p style="margin:0 0 8px;color:#33415c;"><strong>Gift exchange:</strong> ${escapeHtml(formatDateOnly(eventDate))}</p>
          <p style="margin:0;color:#33415c;"><strong>Event type:</strong> ${escapeHtml(eventTypeLabel)}</p>
        </div>
        <p style="margin:16px 0 0;">Keep the festive spirit alive and reach out if anything needs your attention.</p>
      </div>
    `)
  };

  await mailTransport.sendMail(message);
};

const sendOrganizerSmsNotification = async ({
  organizer,
  eventName,
  eventDate,
  eventTypeLabel,
  drawDate,
  participant
}) => {
  if (!twilioClient) return;
  const phone = organizer.phone?.trim();
  if (!phone) return;

  const senderConfig = getTwilioSenderConfig();
  if (!senderConfig) {
    return;
  }

  const contactParts = [participant.email, participant.phone]
    .map((value) => (value || '').trim())
    .filter(Boolean);
  const contactSummary = contactParts.length ? contactParts.join(' | ') : 'no contact info';

  await twilioClient.messages.create({
    ...senderConfig,
    to: phone,
    body: collapseWhitespace(
      `Secret Santa: ${participant.name} (${contactSummary}) confirmed for ${eventName}. Draw: ${formatDateTime(
        drawDate
      )}. Exchange: ${formatDateOnly(eventDate)}. Type: ${eventTypeLabel}.`
    )
  });
};

const sendOrganizerPaymentReceipt = async ({
  email,
  name,
  eventName,
  paymentIntentId,
  amountCents,
  currency
}) => {
  const recipient = email?.trim();
  if (!recipient) {
    return;
  }

  const organizerName = name?.trim() || 'Organizer';
  const displayEventName = eventName?.trim() || 'your Secret Santa draw';
  const formattedAmount = formatCurrency(amountCents, currency || NOTIFICATION_PAYMENT_CURRENCY);

  const text = `Hi ${organizerName},\n\nThank you for organizing ${displayEventName} with Secret Santa Draws and for trusting our services.\n\nWe received your payment of ${formattedAmount}.\nPayment reference: ${paymentIntentId}\n\nParticipant notifications are now on their way.\n\nHappy gifting!\nThe Secret Santa Draws Team`;

  const html = renderEmailTemplate(`
    <div style="line-height:1.65;">
      <h2 style="margin:0 0 16px;color:#b71c1c;">Payment received</h2>
      <p style="margin:0 0 12px;">Hi ${escapeHtml(organizerName)},</p>
      <p style="margin:0 0 12px;">Thank you for organizing <strong>${escapeHtml(displayEventName)}</strong> with Secret Santa Draws and for trusting our services.</p>
      <div style="margin:20px 0;padding:18px 20px;border-radius:18px;background:rgba(248,250,255,0.96);border:1px solid rgba(255,105,135,0.2);box-shadow:0 14px 28px rgba(20,24,56,0.14);">
        <p style="margin:0 0 8px;color:#334155;"><strong>Amount received:</strong> ${escapeHtml(formattedAmount)}</p>
        <p style="margin:0;color:#334155;"><strong>Payment reference:</strong> ${escapeHtml(paymentIntentId || 'N/A')}</p>
      </div>
      <p style="margin:16px 0 0;">We&apos;re now notifying every participant with their assignments. Keep the holiday spirit glowing!</p>
      <p style="margin:24px 0 0;">With gratitude,<br/>The Secret Santa Draws Team</p>
    </div>
  `);

  const message = {
    from: process.env.FROM_EMAIL || 'secretsanta@example.com',
    to: recipient,
    subject: `Payment receipt for ${displayEventName}`,
    text,
    html
  };

  await mailTransport.sendMail(message);
};

const notifyOrganizerOfAcknowledgement = async ({
  organizer,
  eventName,
  eventDate,
  eventTypeLabel,
  drawDate,
  participant
}) => {
  const tasks = [];
  if (organizer?.email?.trim()) {
    tasks.push(
      sendOrganizerEmailNotification({
        organizer,
        eventName,
        eventDate,
        eventTypeLabel,
        drawDate,
        participant
      })
    );
  }

  if (organizer?.phone?.trim()) {
    tasks.push(
      sendOrganizerSmsNotification({
        organizer,
        eventName,
        eventDate,
        eventTypeLabel,
        drawDate,
        participant
      })
    );
  }

  if (!tasks.length) return;

  await Promise.all(tasks);
};

// API routes
app.post('/api/draw', async (req, res) => {
  const validationErrors = validatePayload(req.body);
  if (validationErrors.length) {
    return res.status(400).json({ errors: validationErrors });
  }

  const recaptchaRequired = shouldRequireRecaptcha();
  if (recaptchaRequired || req.body?.recaptchaToken) {
    const recaptchaResult = await verifyRecaptchaToken(
      req.body?.recaptchaToken,
      getClientIp(req)
    );
    if (!recaptchaResult.success) {
      const responseBody = {
        errors: [recaptchaResult.message || 'Failed to validate reCAPTCHA.']
      };
      if (recaptchaResult.errorCodes?.length) {
        responseBody.recaptcha = recaptchaResult.errorCodes;
      }
      return res.status(400).json(responseBody);
    }
  }

  const {
    name,
    date,
    drawMode,
    couples = [],
    individuals = [],
    organizer = {},
    exchangeType,
    otherGroupType,
    secretSantaRules: rawRules = ''
  } = req.body;
  const trimmedRules = rawRules?.trim() || '';
  const normalizedOrganizer = {
    name: organizer?.name?.trim() || '',
    email: organizer?.email?.trim() || '',
    phone: organizer?.phone?.trim() || ''
  };

  const participants =
    drawMode === 'individuals'
      ? individuals.map((participant) => ({
          id: participant.id || randomUUID(),
          name: participant.name?.trim() || '',
          email: participant.email?.trim() || '',
          phone: participant.phone?.trim() || ''
        }))
      : couples.flatMap((couple, coupleIndex) =>
          couple.participants.map((participant) => ({
            id: participant.id || randomUUID(),
            name: participant.name?.trim() || '',
            email: participant.email?.trim() || '',
            phone: participant.phone?.trim() || '',
            groupId: coupleIndex
          }))
        );

  try {
    const matches = derangeParticipants(participants, {
      preventSameGroup: drawMode !== 'individuals'
    });
    const drawDate = new Date().toISOString();
    const ackBaseUrl = resolveAckBaseUrl(req);
    const acknowledgementRecords = registerAcknowledgements({
      matches,
      event: {
        name,
        date,
        exchangeType,
        otherGroupType,
        secretSantaRules: trimmedRules,
        organizer: normalizedOrganizer,
        drawMode: drawMode || 'couples',
        drawDate
      },
      ackBaseUrl
    });
    const ackLinks = new Map(
      acknowledgementRecords.map((record) => [record.giverId, record.acknowledgementUrl])
    );
    const messagePayload = {
      eventName: name,
      eventDate: date,
      eventTypeLabel: getExchangeLabel(exchangeType, otherGroupType),
      secretSantaRules: trimmedRules,
      assignments: matches,
      ackLinks
    };

    const responseAssignments = matches.map(({ giver, receiver }) => ({
      giver: {
        id: giver.id,
        name: giver.name,
        email: giver.email || null,
        phone: giver.phone || null
      },
      receiver: { id: receiver.id, name: receiver.name },
      acknowledgementUrl: ackLinks.get(giver.id)
    }));

    const notificationBatchId = randomUUID();
    pendingNotificationBatches.set(notificationBatchId, {
      payload: messagePayload,
      createdAt: new Date().toISOString()
    });

    res.json({
      assignments: responseAssignments,
      drawDate,
      drawMode: drawMode || 'couples',
      notificationBatchId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate Secret Santa assignments.' });
  }
});

app.post('/api/payments/create-intent', async (req, res) => {
  if (!isStripeConfigured) {
    console.warn('Checkout session creation attempted but Stripe not configured');
    return res.status(503).json({ error: 'Payment processing is temporarily unavailable.' });
  }

  const batchId = req.body?.batchId;
  if (!batchId) {
    return res.status(400).json({ error: 'Notification batch id is required.' });
  }

  const batch = pendingNotificationBatches.get(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Notification batch not found or already processed.' });
  }

  try {
    const appBaseUrl = resolveAppBaseUrl(req);
    const returnUrl = `${appBaseUrl}/?checkout_session_id={CHECKOUT_SESSION_ID}`;

    console.log('Creating checkout session for batch:', batchId);
    const session = await createNotificationCheckoutSession({
      batchId,
      eventName: req.body?.eventName,
      organizer: req.body?.organizer || {},
      returnUrl
    });

    if (!session?.client_secret || !session?.id) {
      throw new Error('Stripe did not return a client secret.');
    }

    console.log('Checkout session created:', session.id);
    res.json({ clientSecret: session.client_secret, sessionId: session.id });
  } catch (error) {
    console.error('Failed to create checkout session', error);
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 502;
    res.status(status).json({ error: error.message || 'Unable to initialize payment.' });
  }
});

app.post('/api/notifications/send', async (req, res) => {
  const batchId = req.body?.batchId;
  if (!batchId) {
    return res.status(400).json({ error: 'Notification batch id is required.' });
  }

  const checkoutSessionId = req.body?.checkoutSessionId;
  if (!checkoutSessionId) {
    return res.status(400).json({ error: 'Checkout session id is required.' });
  }

  const batch = pendingNotificationBatches.get(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Notification batch not found or already processed.' });
  }

  if (!isStripeConfigured) {
    return res.status(503).json({ error: 'Payment processing is temporarily unavailable.' });
  }

  let session;
  try {
    session = await retrieveCheckoutSession(checkoutSessionId);
  } catch (error) {
    console.error('Failed to verify checkout session', error);
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 502;
    return res.status(status).json({ error: error.message || 'Unable to verify payment.' });
  }

  if (!session || session.object !== 'checkout.session') {
    return res.status(404).json({ error: 'Payment not found.' });
  }

  if (session.metadata?.notificationBatchId !== batchId) {
    return res.status(400).json({ error: 'Payment does not match this notification batch.' });
  }

  if (session.status !== 'complete' || session.payment_status !== 'paid') {
    return res.status(402).json({ error: 'Payment has not been completed yet.' });
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    return res.status(404).json({ error: 'Payment intent not found.' });
  }

  let paymentIntent;
  try {
    paymentIntent = await retrievePaymentIntent(paymentIntentId);
  } catch (error) {
    console.error('Failed to retrieve payment intent for receipt', error);
  }

  const paymentAmount = Number(
    session.amount_total ??
      paymentIntent?.amount_received ??
      paymentIntent?.amount ??
      0
  );

  if (!Number.isFinite(paymentAmount) || paymentAmount < NOTIFICATION_PAYMENT_AMOUNT_CENTS) {
    return res.status(400).json({ error: 'Payment amount is insufficient for notification delivery.' });
  }

  const paymentCurrency =
    (session.currency || paymentIntent?.currency || NOTIFICATION_PAYMENT_CURRENCY || '')
      .toString()
      .toLowerCase() || NOTIFICATION_PAYMENT_CURRENCY;

  if (paymentCurrency !== NOTIFICATION_PAYMENT_CURRENCY) {
    return res.status(400).json({ error: 'Unexpected payment currency.' });
  }

  try {
    await Promise.all([
      sendEmails(batch.payload),
      sendSmsMessages(batch.payload)
    ]);
  } catch (error) {
    console.error('Failed to send notifications', error);
    return res.status(500).json({ error: 'Failed to send notifications.' });
  }

  pendingNotificationBatches.delete(batchId);
  const sentAt = new Date().toISOString();

  try {
    await sendOrganizerPaymentReceipt({
      email:
        paymentIntent?.receipt_email ||
        paymentIntent?.metadata?.organizerEmail ||
        session.customer_details?.email ||
        session.customer_email,
      name: paymentIntent?.metadata?.organizerName || session.customer_details?.name,
      eventName: paymentIntent?.metadata?.eventName || session.metadata?.eventName,
      paymentIntentId,
      amountCents: paymentAmount,
      currency: paymentCurrency
    });
  } catch (error) {
    console.error('Failed to send organizer payment receipt', error);
  }

  res.json({ sentAt, checkoutSessionId, paymentIntentId });
});

app.post('/api/acknowledgements', async (req, res) => {
  const token = req.body?.token;
  if (!token) {
    return res.status(400).json({ error: 'Acknowledgement token is required.' });
  }

  try {
    const payload = decodeAckToken(token);
    const ackBaseUrl = resolveAckBaseUrl(req);
    const acknowledgementUrl = `${ackBaseUrl}?payload=${encodeURIComponent(token)}`;
    const storedRecord = acknowledgementsStore.get(token);

    const merged = {
      acknowledgementUrl,
      secretSantaRules: '',
      organizerName: '',
      organizerEmail: '',
      organizerPhone: '',
      drawMode: payload.drawMode || storedRecord?.drawMode || 'couples',
      drawDate: payload.drawDate || storedRecord?.drawDate || '',
      receiverEmail: payload.receiverEmail || storedRecord?.receiverEmail || '',
      receiverPhone: payload.receiverPhone || storedRecord?.receiverPhone || '',
      ...payload,
      ...storedRecord
    };

    merged.eventTypeLabel =
      merged.eventTypeLabel || getExchangeLabel(merged.exchangeType, merged.otherGroupType);
    merged.organizerName = merged.organizerName || '';
    merged.organizerEmail = merged.organizerEmail || '';
    merged.organizerPhone = merged.organizerPhone || '';
    merged.secretSantaRules = merged.secretSantaRules || '';
    merged.drawMode = merged.drawMode || 'couples';
    merged.drawDate = merged.drawDate || '';
    merged.receiverEmail = merged.receiverEmail || '';
    merged.receiverPhone = merged.receiverPhone || '';
    merged.issuedAt = merged.issuedAt || payload.issuedAt || '';
    merged.acknowledgementUrl = acknowledgementUrl;

    if (!merged.acknowledged) {
      merged.acknowledged = true;
      merged.acknowledgedAt = new Date().toISOString();
    }

    acknowledgementsStore.set(token, merged);

    try {
      await notifyOrganizerOfAcknowledgement({
        organizer: {
          name: merged.organizerName,
          email: merged.organizerEmail,
          phone: merged.organizerPhone
        },
        eventName: merged.eventName,
        eventDate: merged.eventDate,
        eventTypeLabel: merged.eventTypeLabel,
        drawDate: merged.drawDate,
        participant: {
          name: merged.giverName,
          email: merged.giverEmail,
          phone: merged.giverPhone
        }
      });
    } catch (notifyError) {
      console.error('Failed to notify organizer of acknowledgement', notifyError);
    }

    res.json({
      eventName: merged.eventName,
      eventDate: merged.eventDate,
      exchangeType: merged.exchangeType,
      otherGroupType: merged.otherGroupType,
      eventTypeLabel: merged.eventTypeLabel,
      drawMode: merged.drawMode,
      drawDate: merged.drawDate,
      acknowledgementUrl: merged.acknowledgementUrl,
      acknowledgedAt: merged.acknowledgedAt,
      issuedAt: merged.issuedAt,
      giverId: merged.giverId,
      giverName: merged.giverName,
      giverEmail: merged.giverEmail || '',
      giverPhone: merged.giverPhone || '',
      receiverId: merged.receiverId,
      receiverName: merged.receiverName,
      receiverEmail: merged.receiverEmail || '',
      receiverPhone: merged.receiverPhone || '',
      secretSantaRules: merged.secretSantaRules || '',
      organizer: {
        name: merged.organizerName || '',
        email: merged.organizerEmail || '',
        phone: merged.organizerPhone || ''
      }
    });
  } catch (error) {
    console.error('Failed to verify acknowledgement token', error);
    res.status(400).json({ error: 'Invalid acknowledgement token.' });
  }
});

const frontendPath = path.join(__dirname, '../../frontend/dist');

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Secret Santa backend listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});