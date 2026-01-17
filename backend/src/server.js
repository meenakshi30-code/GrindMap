import express from 'express';
import cors from 'cors';
import { scrapeLeetCode } from './services/scraping/leetcode.scraper.js';
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

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(tracingMiddleware);
app.use(sanitize);
app.use(rateLimiter(20, 60000));
app.use(memoryMonitor);

// Trace routes
traceRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = backpressureManager.getStats();
  res.json({ status: 'ok', traceId: req.traceId, ...stats });
});

app.get('/api/leetcode/:username', 
  validate({ username: { required: true, type: 'username' } }),
  async (req, res) => {
    try {
      const data = await backpressureManager.process(() => 
        withTrace(req.traceId, 'leetcode.scrape', () => 
          scrapeLeetCode(req.params.username)
        )
      );
      res.json({ data, traceId: req.traceId });
    } catch (error) {
      if (error.message.includes('Circuit breaker') || error.message.includes('Queue full')) {
        res.status(503).json({ error: error.message, traceId: req.traceId });
      } else {
        res.status(500).json({ error: error.message, traceId: req.traceId });
      }
    }
  }
);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

gracefulShutdown(server);
