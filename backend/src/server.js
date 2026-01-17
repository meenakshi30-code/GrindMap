import express from 'express';
import cors from 'cors';
import { scrapeLeetCode } from './services/scraping/leetcode.scraper.js';
import { backpressureManager } from './utils/backpressure.util.js';
import { rateLimiter } from './utils/rateLimiter.util.js';
import { memoryMonitor } from './middlewares/memory.middleware.js';

const app = express();
const PORT = process.env.PORT || 5001

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimiter(20, 60000)); // 20 requests per minute
app.use(memoryMonitor);

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = backpressureManager.getStats();
  res.json({ status: 'ok', ...stats });
});

app.get('/api/leetcode/:username', async (req, res) => {
  try {
    const data = await backpressureManager.process(() => 
      scrapeLeetCode(req.params.username)
    );
    res.json(data);
  } catch (error) {
    if (error.message.includes('Circuit breaker') || error.message.includes('Queue full')) {
      res.status(503).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

import { gracefulShutdown } from './utils/shutdown.util.js';

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

gracefulShutdown(server);
