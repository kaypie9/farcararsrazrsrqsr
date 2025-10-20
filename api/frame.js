import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const action = searchParams.get("action") || "home";

  // START GAME FRAME (opens mini app)
  if (action === "start") {
    return res.status(200).json({
      type: "frame",
      version: "1.0",
      imageUrl: "https://placehold.co/600x400?text=Tap+To+Start",
      buttons: [
        {
          label: "▶️ Open Game",
          action: "link",
          target: "https://farcasterbird.vercel.app/index.html"
        }
      ]
    });
  }

  // HOME / LEADERBOARD FRAME
  const top3 = (await redis.zrevrange("leaderboard", 0, 2, { withScores: true })) || [];
  const text = top3.length === 0
    ? "No scores yet"
    : top3.map(([username, score], i) => `${i + 1}. ${username} — ${score}`).join("\n");

  return res.status(200).json({
    type: "frame",
    version: "1.0",
    imageUrl: "https://placehold.co/600x400?text=Farcaster+Bird",
    text,
    buttons: [
      { label: "▶️ Play", action: "post", target: "https://farcasterbird.vercel.app/api/frame?action=start" },
      { label: "🔄 Refresh", action: "post", target: "https://farcasterbird.vercel.app/api/frame?action=home" }
    ]
  });
}
