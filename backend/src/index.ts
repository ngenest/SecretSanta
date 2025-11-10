import express from 'express';
import cors from 'cors';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://secretsantadraws.com', 'https://www.secretsantadraws.com']
    : '*',
  credentials: true
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});