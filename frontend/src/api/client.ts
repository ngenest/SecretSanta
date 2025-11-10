const baseURL = import.meta.env.PROD 
  ? '/api' // Production: same domain
  : 'http://localhost:8080/api'; // Development: backend port