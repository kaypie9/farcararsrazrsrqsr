import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { username, score } = JSON.parse(req.body);

    if (!username || score === undefined) {
      return res.status(400).json({ error: 'username and score are required' });
    }

    // Save highest score per user
    const key = `score:${username}`;
    const current = await redis.get(key);

    if (!current || score > parseInt(current)) {
      await redis.set(key, score);
    }

    return res.status(200).json({ message: 'Score saved!', bestScore: Math.max(score, current || 0) });
  } catch (error) {
    console.error('Error saving score:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
