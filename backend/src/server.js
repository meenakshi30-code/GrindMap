import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { scrapeLeetCode } from './services/scraping/leetcode.scraper.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { securityHeaders } from './middlewares/security.middleware.js';
import { requestLogger, securityMonitor } from './middlewares/logging.middleware.js';
import { sanitizeInput, validateUsername } from './middlewares/validation.middleware.js';
import { generalLimiter, scrapingLimiter } from './middlewares/rateLimiter.middleware.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { AppError } from './utils/appError.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(requestLogger);
app.use(securityMonitor);
app.use(securityHeaders);
app.use(generalLimiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeInput);

app.get('/api/leetcode/:username', scrapingLimiter, validateUsername, asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  if (!username || username.trim() === '') {
    throw new AppError('Username is required', 400);
  }
  
  const data = await scrapeLeetCode(username);
  
  res.json({
    success: true,
    data
  });
}));

app.use(notFound);
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
