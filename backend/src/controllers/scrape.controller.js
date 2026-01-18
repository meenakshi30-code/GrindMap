import PlatformService from '../services/platform.service.js';
import { sendSuccess } from '../utils/response.helper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { MESSAGES } from '../constants/app.constants.js';

/**
 * Controller for handling platform scraping requests
 * Follows Single Responsibility Principle - only handles HTTP layer
 */
class ScrapeController {
  /**
   * Get LeetCode user statistics
   * @route GET /api/leetcode/:username
   */
  getLeetCodeStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const data = await PlatformService.fetchLeetCodeData(username);
    
    sendSuccess(res, data, `LeetCode data fetched for ${username}`);
  });

  /**
   * Get Codeforces user statistics
   * @route GET /api/codeforces/:username
   */
  getCodeforcesStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const data = await PlatformService.fetchCodeforcesData(username);
    
    sendSuccess(res, data, `Codeforces data fetched for ${username}`);
  });

  /**
   * Get CodeChef user statistics
   * @route GET /api/codechef/:username
   */
  getCodeChefStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const data = await PlatformService.fetchCodeChefData(username);
    
    sendSuccess(res, data, `CodeChef data fetched for ${username}`);
  });

  /**
   * Get list of supported platforms
   * @route GET /api/platforms
   */
  getSupportedPlatforms = asyncHandler(async (req, res) => {
    const platforms = PlatformService.getSupportedPlatforms();
    
    sendSuccess(res, { platforms }, 'Supported platforms retrieved');
  });
}

export default new ScrapeController();