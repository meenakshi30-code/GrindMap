export function normalizeCodeChef(data) {
  return {
    platform: "codechef",
    username: data.username,
    stats: {
      totalSolved: data.totalSolved,
      rating: data.rating,
      rank: data.rank,
      maxRating: data.maxRating
    },
    streak: { current: 0, max: 0 },
    activity: []
  };
}