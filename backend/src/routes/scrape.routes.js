import express from 'express';
import ScrapeController from '../controllers/scrape.controller.js';
import { validateUsername } from '../middlewares/validation.middleware.js';
import { scrapingLimiter } from '../middlewares/rateLimiter.middleware.js';
import { cacheMiddleware } from '../middlewares/cache.middleware.js';
import { auditLogger } from '../middlewares/audit.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/scrape/leetcode/:username
 * @desc    Get LeetCode user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/leetcode/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_LEETCODE_STATS'),
  cacheMiddleware(300), // 5 minutes cache
  ScrapeController.getLeetCodeStats
);

/**
 * @route   GET /api/scrape/codeforces/:username
 * @desc    Get Codeforces user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/codeforces/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_CODEFORCES_STATS'),
  cacheMiddleware(600), // 10 minutes cache
  ScrapeController.getCodeforcesStats
);

/**
 * @route   GET /api/scrape/codechef/:username
 * @desc    Get CodeChef user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/codechef/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_CODECHEF_STATS'),
  cacheMiddleware(600), // 10 minutes cache
  ScrapeController.getCodeChefStats
);

/**
 * @route   GET /api/scrape/platforms
 * @desc    Get list of supported platforms
 * @access  Public (cached)
 */
router.get(
  '/platforms', 
  cacheMiddleware(3600), // 1 hour cache
  ScrapeController.getSupportedPlatforms
);

export default router;