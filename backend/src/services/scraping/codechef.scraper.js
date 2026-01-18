export async function fetchCodeChefStats(username) {
  try {
    // Placeholder implementation
    return {
      platform: 'CODECHEF',
      username,
      data: {
        rating: 0,
        problemsSolved: 0
      }
    };
  } catch (error) {
    throw new Error('Failed to fetch CodeChef data');
  }
}