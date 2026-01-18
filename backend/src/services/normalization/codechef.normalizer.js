export function normalizeCodeChef(data) {
  return {
    platform: 'codechef',
    username: data.username,
    rating: data.data.rating || 0,
    problemsSolved: data.data.problemsSolved || 0
  };
}