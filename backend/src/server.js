import express from 'express';
import cors from 'cors';
import { scrapeLeetCode } from './services/scraping/leetcode.scraper.js';
import { fetchCodeforcesStats } from './services/scraping/codeforces.scraper.js';
import { fetchCodeChefStats } from './services/scraping/codechef.scraper.js';
import { normalizeCodeforces } from './services/normalization/codeforces.normalizer.js';
import { normalizeCodeChef } from './services/normalization/codechef.normalizer.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/leetcode/:username', async (req, res) => {
  try {
    const data = await scrapeLeetCode(req.params.username);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/codeforces/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const raw = await fetchCodeforcesStats(username);
    const normalized = normalizeCodeforces({ ...raw, username });
    res.json({ success: true, data: normalized });
  } catch (error) {
    let status = 500;
    if (error.message === "Invalid username") status = 400;
    if (error.message === "User not found") status = 404;
    if (error.message === "Rate limited") status = 429;
    res.status(status).json({ success: false, error: error.message });
  }
});

app.get('/api/codechef/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const raw = await fetchCodeChefStats(username);
    const normalized = normalizeCodeChef({ ...raw, username });
    res.json({ success: true, data: normalized });
  } catch (error) {
    let status = 500;
    if (error.message === "Invalid username") status = 400;
    if (error.message === "User not found") status = 404;
    if (error.message === "Rate limited") status = 429;
    res.status(status).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
