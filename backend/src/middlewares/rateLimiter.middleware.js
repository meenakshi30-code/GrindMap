import rateLimit from 'express-rate-limit';

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limit for scraping endpoints
const scrapingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    error: {
      message: 'Rate limit exceeded for scraping endpoints',
      retryAfter: '1 minute'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + ':' + req.params.username; // IP + username combination
  }
});

export { generalLimiter, scrapingLimiter };