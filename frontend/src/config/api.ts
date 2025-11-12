const normalizeBaseUrl = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  // Remove trailing slashes so we can append the API prefix consistently
  return trimmed.replace(/\/+$/, '');
};

const ensureApiPath = (base: string) => {
  if (!base) {
    return '/api';
  }

  return base.endsWith('/api') ? base : `${base}/api`;
};

const configuredBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

const defaultBaseUrl = import.meta.env.PROD ? '' : 'http://localhost:4000';

export const API_BASE_URL = ensureApiPath(configuredBaseUrl || defaultBaseUrl);
