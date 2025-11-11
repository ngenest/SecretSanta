export const API_BASE_URL = import.meta.env.PROD
  ? '/api' // Production: relative path on same domain
  : 'http://localhost:4000/api'; // Development: backend default port
