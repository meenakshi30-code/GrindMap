import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { scrapeLeetCode } from './services/scraping/leetcode.scraper.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { securityHeaders } from './middlewares/security.middleware.js';
import { requestLogger, securityMonitor } from './middlewares/logging.middleware.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { AppError } from './utils/appError.js';

import { fetchCodeforcesStats } from './services/scraping/codeforces.scraper.js';
import { fetchCodeChefStats } from './services/scraping/codechef.scraper.js';
import { normalizeCodeforces } from './services/normalization/codeforces.normalizer.js';
import { normalizeCodeChef } from './services/normalization/codechef.normalizer.js';

import { backpressureManager } from './utils/backpressure.util.js';
import { rateLimiter } from './utils/rateLimiter.util.js';
import { memoryMonitor } from './middlewares/memory.middleware.js';
import { validate, sanitize } from './middlewares/validation.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { tracingMiddleware } from './middlewares/tracing.middleware.js';
import { withTrace } from './utils/serviceTracer.util.js';
import { traceRoutes } from './routes/trace.routes.js';
import { gracefulShutdown } from './utils/shutdown.util.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(requestLogger);
app.use(securityMonitor);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.get('/api/leetcode/:username', asyncHandler(async (req, res) => {
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

/**
 * ----------------------------
 * LeetCode API (Upstream)
 * ----------------------------
 */
app.get(
  "/api/leetcode/:username",
  validate({ username: { required: true, type: "username" } }),
  async (req, res) => {
    try {
      const data = await backpressureManager.process(() =>
        withTrace(req.traceId, "leetcode.scrape", () =>
          scrapeLeetCode(req.params.username),
        ),
      );
      res.json({ data, traceId: req.traceId });
    } catch (error) {
      if (
        error.message.includes("Circuit breaker") ||
        error.message.includes("Queue full")
      ) {
        res.status(503).json({ error: error.message, traceId: req.traceId });
      } else {
        res.status(500).json({ error: error.message, traceId: req.traceId });
      }
    }
  },
);

/**
 * ----------------------------
 * Codeforces API (Your feature)
 * ----------------------------
 */
app.get(
  "/api/codeforces/:username",
  validate({ username: { required: true, type: "username" } }),
  async (req, res) => {
    try {
      const username = req.params.username;

      const raw = await backpressureManager.process(() =>
        withTrace(req.traceId, "codeforces.scrape", () =>
          fetchCodeforcesStats(username),
        ),
      );

      const normalized = normalizeCodeforces({ ...raw, username });

      res.json({ success: true, data: normalized, traceId: req.traceId });
    } catch (error) {
      let status = 500;
      if (error.message === "Invalid username") status = 400;
      if (error.message === "User not found") status = 404;
      if (error.message === "Rate limited") status = 429;

      res
        .status(status)
        .json({ success: false, error: error.message, traceId: req.traceId });
    }
  },
);

/**
 * ----------------------------
 * CodeChef API (Your feature)
 * ----------------------------
 */
app.get(
  "/api/codechef/:username",
  validate({ username: { required: true, type: "username" } }),
  async (req, res) => {
    try {
      const username = req.params.username;

      const raw = await backpressureManager.process(() =>
        withTrace(req.traceId, "codechef.scrape", () =>
          fetchCodeChefStats(username),
        ),
      );

      const normalized = normalizeCodeChef({ ...raw, username });

      res.json({ success: true, data: normalized, traceId: req.traceId });
    } catch (error) {
      let status = 500;
      if (error.message === "Invalid username") status = 400;
      if (error.message === "User not found") status = 404;
      if (error.message === "Rate limited") status = 429;

      res
        .status(status)
        .json({ success: false, error: error.message, traceId: req.traceId });
    }
  },
);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

gracefulShutdown(server);
