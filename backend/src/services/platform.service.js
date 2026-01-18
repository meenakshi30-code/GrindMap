import { scrapeLeetCode } from './scraping/leetcode.scraper.js';
import { fetchCodeforcesStats } from './scraping/codeforces.scraper.js';
import { fetchCodeChefStats } from './scraping/codechef.scraper.js';
import { normalizeCodeforces } from './normalization/codeforces.normalizer.js';
import { normalizeCodeChef } from './normalization/codechef.normalizer.js';
import { PLATFORMS, MESSAGES } from '../constants/app.constants.js';
import { AppError, ERROR_CODES } from '../utils/appError.js';

/**
 * Platform scraping service - handles all platform data fetching
 */
class PlatformService {
  /**
   * Fetch user data from LeetCode
   * @param {string} username - User's LeetCode username
   * @returns {Promise<Object>} Normalized user data
   */
  async fetchLeetCodeData(username) {
    try {
      const data = await scrapeLeetCode(username);
      return {
        platform: PLATFORMS.LEETCODE,
        username,
        ...data,
      };
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: LeetCode`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Fetch user data from Codeforces
   * @param {string} username - User's Codeforces username
   * @returns {Promise<Object>} Normalized user data
   */
  async fetchCodeforcesData(username) {
    try {
      const rawData = await fetchCodeforcesStats(username);
      const normalizedData = normalizeCodeforces({ ...rawData, username });
      
      return {
        platform: PLATFORMS.CODEFORCES,
        username,
        ...normalizedData,
      };
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: Codeforces`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Fetch user data from CodeChef
   * @param {string} username - User's CodeChef username
   * @returns {Promise<Object>} Normalized user data
   */
  async fetchCodeChefData(username) {
    try {
      const rawData = await fetchCodeChefStats(username);
      const normalizedData = normalizeCodeChef({ ...rawData, username });
      
      return {
        platform: PLATFORMS.CODECHEF,
        username,
        ...normalizedData,
      };
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: CodeChef`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Get supported platforms list
   * @returns {Array<string>} List of supported platforms
   */
  getSupportedPlatforms() {
    return Object.values(PLATFORMS);
  }
}

export default new PlatformService();