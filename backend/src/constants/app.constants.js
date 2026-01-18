// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Rate Limiting
export const RATE_LIMITS = {
  GENERAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GENERAL_MAX_REQUESTS: 100,
  SCRAPING_WINDOW_MS: 60 * 1000, // 1 minute
  SCRAPING_MAX_REQUESTS: 10,
};

// Request Timeouts
export const TIMEOUTS = {
  API_REQUEST: 10000, // 10 seconds
  SCRAPING_REQUEST: 15000, // 15 seconds
};

// Validation Rules
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 1,
  USERNAME_MAX_LENGTH: 50,
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
};

// Platforms
export const PLATFORMS = {
  LEETCODE: 'leetcode',
  CODEFORCES: 'codeforces',
  CODECHEF: 'codechef',
  GITHUB: 'github',
  ATCODER: 'atcoder',
  SKILLRACK: 'skillrack',
};

// Response Messages
export const MESSAGES = {
  SUCCESS: 'Request completed successfully',
  USERNAME_REQUIRED: 'Username is required',
  INVALID_USERNAME: 'Invalid username format',
  USER_NOT_FOUND: 'User not found',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded, please try again later',
  INTERNAL_ERROR: 'Internal server error',
  SCRAPING_FAILED: 'Failed to fetch data from platform',
};

// Environment
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
};