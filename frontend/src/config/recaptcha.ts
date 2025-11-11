const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '';

const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const isLocalhost =
  Boolean(hostname && LOCALHOST_HOSTNAMES.has(hostname)) || hostname.endsWith('.localhost');

export const RECAPTCHA_SITE_KEY: string = siteKey;
export const IS_RECAPTCHA_ENABLED = Boolean(siteKey) && !isLocalhost;
