import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all keys starting with score:
    const keys = await redis.keys('score:*');

    const scores = [];
    for (const key of keys) {
      const username = key.replace('score:', '');
      const score = await redis.get(key);
      scores.push({ username, score: parseInt(score) });
    }

    // Sort scores DESC
    scores.sort((a, b) => b.score - a.score);

    // Top 10 only
    const top10 = scores.slice(0, 10);

    return res.status(200).json(top10);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
