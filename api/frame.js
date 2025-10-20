import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const action = searchParams.get("action") || "home";

  if (action === "start") {
    return res.status(200).json({
      version: "vNext",
      content: {
        title: "Farcaster Bird — Play",
        url: "https://farcasterbird.vercel.app/index.html",
        layout: "mini-app"
      }
    });
  }

  const top3 = (await redis.zrevrange("leaderboard", 0, 2, { withScores: true })) || [];
  const text = top3.length === 0
    ? "No scores yet"
    : top3.map(([username, score], i) => `${i + 1}. ${username} — ${score}`).join("\n");

  return res.status(200).json({
    version: "vNext",
    content: {
      title: "Farcaster Bird",
      image: "https://placehold.co/600x400?text=Farcaster+Bird",
      text: `🏆 Top 3 Players\n${text}`,
      buttons: [
        { label: "▶️ Play", action: "post", target: "/api/frame?action=start" },
        { label: "Refresh", action: "post", target: "/api/frame?action=home" }
      ]
    }
  });
}
