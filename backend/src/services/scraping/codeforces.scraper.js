import axios from 'axios';

export async function fetchCodeforcesStats(username) {
  try {
    const response = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`, {
      timeout: 10000
    });
    
    return {
      platform: 'CODEFORCES',
      username,
      data: response.data.result[0] || {}
    };
  } catch (error) {
    throw new Error('Failed to fetch Codeforces data');
  }
}