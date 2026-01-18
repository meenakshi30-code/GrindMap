import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { securityHeaders } from './middlewares/security.middleware.js';
import { requestLogger, securityMonitor } from './middlewares/logging.middleware.js';
import { sanitizeInput } from './middlewares/validation.middleware.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';

// Import routes
import scrapeRoutes from './routes/scrape.routes.js';
import authRoutes from './routes/auth.routes.js';

// Import constants
import { HTTP_STATUS, ENVIRONMENTS } from './constants/app.constants.js';

const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;

// Security middleware (applied first)
app.use(securityHeaders);
app.use(requestLogger);
app.use(securityMonitor);

// Rate limiting
app.use(generalLimiter);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization
app.use(sanitizeInput);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API routes
app.use('/api/scrape', scrapeRoutes);
app.use('/api/auth', authRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'GrindMap API v1.0',
    documentation: '/api/docs',
    endpoints: {
      scraping: '/api/scrape',
      authentication: '/api/auth',
      health: '/health',
    },
  });
});

// 404 handler for undefined routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Global error handlers for unhandled promises and exceptions
process.on('unhandledRejection', (err) => {
  console.error('🚨 Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;