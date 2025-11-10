import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://secretsantadraws.com', 'https://www.secretsantadraws.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Secret Santa API is running' });
});

app.post('/api/draws', (req, res) => {
  try {
    console.log('Draw request received:', req.body);
    // Your draw logic here
    res.json({ success: true, message: 'Draw completed' });
  } catch (error) {
    console.error('Draw error:', error);
    res.status(500).json({ error: 'Failed to complete draw' });
  }
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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = parseInt(process.env.PORT || '8080', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});