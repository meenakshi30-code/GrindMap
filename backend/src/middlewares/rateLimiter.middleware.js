import rateLimit from 'express-rate-limit';
import { RATE_LIMITS, HTTP_STATUS, MESSAGES } from '../constants/app.constants.js';

/**
 * General API rate limiter for all endpoints
 * Prevents abuse while allowing normal usage
 */
const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL_WINDOW_MS,
  max: RATE_LIMITS.GENERAL_MAX_REQUESTS,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT_EXCEEDED,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
});

/**
 * Strict rate limiter for resource-intensive scraping endpoints
 * Prevents server overload and respects external API limits
 */
const scrapingLimiter = rateLimit({
  windowMs: RATE_LIMITS.SCRAPING_WINDOW_MS,
  max: RATE_LIMITS.SCRAPING_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Rate limit exceeded for scraping endpoints',
    errorCode: 'SCRAPING_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  keyGenerator: (req) => {
    // Combine IP and username for more granular rate limiting
    return `${req.ip}:${req.params.username || 'anonymous'}`;
  }
});

export { generalLimiter, scrapingLimiter };