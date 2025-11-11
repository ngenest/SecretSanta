const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '';

export const RECAPTCHA_SITE_KEY: string = siteKey;
export const IS_RECAPTCHA_ENABLED = Boolean(siteKey);
