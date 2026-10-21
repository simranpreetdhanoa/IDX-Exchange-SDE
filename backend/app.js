require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const propertiesRouter = require('./routes/properties'); // Where the route lives week 3

const app = express();

// Request logger (Week 4): prints method, URL, status code and duration for every request
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date(start).toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: error.message
    });
  }
});

// Properties routes (Week 3)
app.use('/api/properties', propertiesRouter); //Router with all /api/properties endpoints (search, detail, open houses)


// Handle 404 Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler (Week 4): last safety net for any error a route didn't catch
app.use((err, req, res, next) => {
  const status = err.status || 500;   // use the error's own status (e.g. 400), otherwise 500
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  res.status(status).json({ error: status === 500 ? 'Internal Server Error' : 'Bad request' });
});

module.exports = app;
