import axios from "axios";

// helper: extract numeric value safely
function extractNumber(text) {
  if (!text) return 0;
  const m = String(text).match(/[\d,]+/);
  if (!m) return 0;
  return Number(m[0].replace(/,/g, ""));
}

export async function fetchCodeChefStats(username) {
  try {
    // ----------------------------
    // 1) Try 3rd-party API first
    // ----------------------------
    const url = `https://codechef-api.vercel.app/handle/${username}`;
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    // Some users may have 0 rating or API may omit fields → do not hard-fail on rating
    if (data && (data.rating !== undefined || data.global_rank !== undefined)) {
      return {
        rating: Number(data.rating) || 0,
        maxRating: Number(data.highest_rating) || 0,
        rank: data.global_rank || "",
        totalSolved: Number(data.problem_fully_solved) || 0,
      };
    }

    // fallback trigger
    throw new Error("Third party API returned invalid payload");
  } catch (error) {
    // ----------------------------
    // 2) Fallback: scrape CodeChef profile page
    // ----------------------------
    try {
      const profileUrl = `https://www.codechef.com/users/${username}`;

      const res = await axios.get(profileUrl, {
        timeout: 15000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://www.codechef.com/",
        },
      });

      const html = res.data;

      // ✅ If CodeChef returns "Page Not Found" or similar
      if (!html || html.includes("Page Not Found")) {
        throw new Error("User not found");
      }

      // rating is usually in "rating-number"
      const ratingMatch = html.match(/rating-number[^>]*>\s*([\d,]+)/i);
      const rating = ratingMatch ? extractNumber(ratingMatch[1]) : 0;

      // total solved appears in fully/partially solved section (varies by layout)
      // We'll capture the first "Fully Solved" number if present
      const fullySolvedMatch = html.match(/Fully Solved[^<]*<\/h5>\s*<p[^>]*>\s*([\d,]+)/i);
      const totalSolved = fullySolvedMatch ? extractNumber(fullySolvedMatch[1]) : 0;

      // rank is not always easy to scrape reliably -> keep empty if missing
      const globalRankMatch = html.match(/Global Rank[^<]*<\/strong>\s*([\d,]+)/i);
      const rank = globalRankMatch ? globalRankMatch[1].trim() : "";

      return {
        rating,
        maxRating: 0, // Not easily available from HTML reliably
        rank,
        totalSolved,
      };
    } catch (fallbackErr) {
      // handle status codes properly if axios provides them
      const status = fallbackErr?.response?.status;

      if (status === 400) throw new Error("Invalid username");
      if (status === 404) throw new Error("User not found");
      if (status === 429) throw new Error("Rate limited");

      // If HTML scrape fails due to Cloudflare/captcha etc.
      throw new Error("Failed to fetch CodeChef data");
    }
  }
}
