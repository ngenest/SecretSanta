import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

// CRITICAL: These must come BEFORE routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://secretsantadraws.com', 'https://www.secretsantadraws.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// ALL API ROUTES MUST BE HERE (before static file serving)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Secret Santa API is running' });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is reachable' });
});

app.post('/api/draws', (req, res) => {
  console.log('POST /api/draws called with:', req.body);
  try {
    // Your draw logic here
    res.json({ success: true, drawId: '123', message: 'Draw completed successfully' });
  } catch (error: any) {
    console.error('Draw error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete draw' });
  }
});

// Serve frontend static files - MUST BE LAST
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
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