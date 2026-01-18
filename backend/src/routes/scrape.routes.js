import express from 'express';
import ScrapeController from '../controllers/scrape.controller.js';
import { validateUsername } from '../middlewares/validation.middleware.js';
import { scrapingLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/scrape/leetcode/:username
 * @desc    Get LeetCode user statistics
 * @access  Public (rate limited)
 */
router.get(
  '/leetcode/:username',
  scrapingLimiter,
  validateUsername,
  ScrapeController.getLeetCodeStats
);

/**
 * @route   GET /api/scrape/codeforces/:username
 * @desc    Get Codeforces user statistics
 * @access  Public (rate limited)
 */
router.get(
  '/codeforces/:username',
  scrapingLimiter,
  validateUsername,
  ScrapeController.getCodeforcesStats
);

/**
 * @route   GET /api/scrape/codechef/:username
 * @desc    Get CodeChef user statistics
 * @access  Public (rate limited)
 */
router.get(
  '/codechef/:username',
  scrapingLimiter,
  validateUsername,
  ScrapeController.getCodeChefStats
);

/**
 * @route   GET /api/scrape/platforms
 * @desc    Get list of supported platforms
 * @access  Public
 */
router.get('/platforms', ScrapeController.getSupportedPlatforms);

export default router;