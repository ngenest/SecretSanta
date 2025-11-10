export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '' // Same domain as frontend
  : 'http://localhost:8080';
