export const API_BASE_URL = import.meta.env.PROD
  ? '/api'  // Production: relative path on same domain
  : 'http://localhost:8080/api';  // Development: full URL
