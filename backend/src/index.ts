import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://secretsantadraws.com', 'https://www.secretsantadraws.com']
    : '*',
  credentials: true
}));

app.use(express.json());

// API routes MUST come before static file serving
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Secret Santa API is running' });
});

app.post('/api/draws', (req, res) => {
  // Create a new Secret Santa draw
});

app.get('/api/draws/:id', (req, res) => {
  // Get draw details
});

app.post('/api/draws/:id/participants', (req, res) => {
  // Add participants to a draw
});

app.post('/api/draws/:id/execute', (req, res) => {
  // Execute the draw and send notifications
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Handle client-side routing - must be LAST
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Development fallback
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Secret Santa API',
      version: '1.0.0',
      endpoints: { health: '/api/health' }
    });
  });
}

const PORT = parseInt(process.env.PORT || '8080', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});