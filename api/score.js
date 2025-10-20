import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => (data += chunk));
      req.on("end", () => resolve(JSON.parse(data || "{}")));
      req.on("error", reject);
    });

    const { username, score } = body;

    if (!username || typeof score !== "number") {
      return res.status(400).json({ error: "username and numeric score required" });
    }

    await redis.zadd("leaderboard", {
      member: username,
      score: score,
      mode: "MAX", // يسجل فقط أعلى Score لكل لاعب
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
