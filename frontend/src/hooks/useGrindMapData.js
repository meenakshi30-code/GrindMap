import { useState } from "react";
import { PLATFORMS } from "../utils/platforms";

export const useGrindMapData = () => {
  const [usernames, setUsernames] = useState({
    leetcode: "",
    codeforces: "",
    codechef: "",
  });

  const [platformData, setPlatformData] = useState({
    leetcode: null,
    codeforces: null,
    codechef: null,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setUsernames((prev) => ({ ...prev, [key]: value }));
  };

  const fetchPlatformData = async (plat) => {
    const username = usernames[plat.key]?.trim();
    if (!username) {
      return { key: plat.key, data: null };
    }

    try {
      let data = null;
      if (plat.key === "leetcode") {
        const res = await fetch(
          `http://localhost:5000/api/leetcode/${username}`,
        );
        const result = await res.json();
        if (result.data) {
          data = result.data;
        } else {
          data = { error: "User not found" };
        }
      } else if (plat.key === "codeforces") {
        const infoRes = await fetch(
          `https://codeforces.com/api/user.info?handles=${username}`,
        );
        const info = await infoRes.json();
        if (info.status === "OK") {
          const rating = info.result[0].rating || 0;
          const rank = info.result[0].rank || "unrated";

          const statusRes = await fetch(
            `https://codeforces.com/api/user.status?handle=${username}`,
          );
          const status = await statusRes.json();
          const solved = new Set(
            status.result
              ?.filter((s) => s.verdict === "OK")
              .map((s) => `${s.problem.contestId}-${s.problem.index}`) || [],
          ).size;

          data = { rating, rank, solved };
        } else {
          data = { error: "User not found" };
        }
      } else if (plat.key === "codechef") {
        const res = await fetch(
          `https://codechef-api.vercel.app/handle/${username}`,
        );
        const result = await res.json();
        if (result.rating) {
          data = result;
        } else {
          data = { error: "User not found" };
        }
      }
      return { key: plat.key, data };
    } catch (err) {
      return { key: plat.key, data: { error: "Failed to fetch" } };
    }
  };

  const fetchAll = async () => {
    setLoading(true);

    // Parallel execution for better performance
    const promises = PLATFORMS.map((plat) => fetchPlatformData(plat));
    const results = await Promise.all(promises);

    const newData = results.reduce((acc, { key, data }) => {
      acc[key] = data;
      return acc;
    }, {});

    setPlatformData(newData);
    setLoading(false);
  };

  const getPlatformPercentage = (platKey) => {
    const data = platformData[platKey];
    if (!data || data.error) return 0;

    if (platKey === "leetcode") {
      return Math.round((data.totalSolved / data.totalQuestions) * 100);
    }
    if (platKey === "codeforces") {
      return data.rating ? Math.round((data.rating / 3500) * 100) : 0;
    }
    if (platKey === "codechef") {
      return data.rating ? Math.round((data.rating / 3000) * 100) : 0;
    }
    return 0;
  };

  const getHeatmapData = (calendar) => {
    if (!calendar) return [];
    return Object.entries(calendar).map(([ts, count]) => ({
      date: new Date(parseInt(ts) * 1000).toISOString().split("T")[0],
      count,
    }));
  };

  const hasSubmittedToday = (platKey) => {
    if (
      platKey === "leetcode" &&
      platformData.leetcode &&
      platformData.leetcode.submissionCalendar
    ) {
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];
      const todayKey = todayString.replace(/-/g, "");
      return platformData.leetcode.submissionCalendar[todayKey] > 0;
    }
    return false;
  };

  const totalSolved =
    (platformData.leetcode?.totalSolved || 0) +
    (platformData.codeforces?.solved || 0) +
    (platformData.codechef?.problem_fully_solved || 0);

  return {
    usernames,
    platformData,
    loading,
    totalSolved,
    handleChange,
    fetchAll,
    getPlatformPercentage,
    getHeatmapData,
    hasSubmittedToday,
  };
};
