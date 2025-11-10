export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  corsOrigin: process.env.NODE_ENV === 'production' 
    ? 'https://secretsantadraws.com' 
    : 'http://localhost:5173',
};