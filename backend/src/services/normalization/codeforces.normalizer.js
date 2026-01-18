export function normalizeCodeforces(data) {
  return {
    platform: 'codeforces',
    username: data.username,
    rating: data.data.rating || 0,
    maxRating: data.data.maxRating || 0,
    rank: data.data.rank || 'unrated'
  };
}