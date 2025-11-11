const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '';
const action = import.meta.env.VITE_RECAPTCHA_ACTION?.trim() || 'event_setup';
const ttlSecondsRaw = import.meta.env.VITE_RECAPTCHA_TOKEN_TTL_SECONDS;

const parsedTtlSeconds = Number.parseInt(ttlSecondsRaw ?? '', 10);
const tokenTtlSeconds = Number.isFinite(parsedTtlSeconds) && parsedTtlSeconds > 0
  ? parsedTtlSeconds
  : 110;

const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const isLocalhost =
  Boolean(hostname && LOCALHOST_HOSTNAMES.has(hostname)) || hostname.endsWith('.localhost');

export const RECAPTCHA_SITE_KEY: string = siteKey;
export const IS_RECAPTCHA_ENABLED = Boolean(siteKey) && !isLocalhost;
export const RECAPTCHA_ACTION = action;
export const RECAPTCHA_TOKEN_TTL_MS = tokenTtlSeconds * 1000;
