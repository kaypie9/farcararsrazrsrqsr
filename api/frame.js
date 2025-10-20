// api/frame.js
async function getTop3FromUpstash() {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return [];

    const resp = await fetch(`${url}/zrevrange/leaderboard/0/2/withscores`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!resp.ok) return [];
    const data = await resp.json();
    const arr = Array.isArray(data) ? data : data?.result;
    if (!Array.isArray(arr)) return [];

    const pairs = [];
    for (let i = 0; i < arr.length; i += 2) {
      const name = String(arr[i] ?? '');
      const score = Number(arr[i + 1] ?? 0);
      if (name) pairs.push([name, score]);
    }
    return pairs.slice(0, 3);
  } catch {
    return [];
  }
}

module.exports = async function handler(req, res) {
  try {
    const host = req.headers?.host
      ? `https://${req.headers.host}`
      : 'https://farcasterbird.vercel.app';

    const url = new URL(req.url, `${host}/api/frame`);
    const action = url.searchParams.get("action") || "home";

    // HOME SCREEN
    if (action === "home") {
      const top3 = await getTop3FromUpstash();
      const text = top3.length === 0
        ? "No scores yet"
        : top3.map(([u, s], i) => `${i + 1}. ${u} - ${s}`).join("\n");

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({
        version: "vNext",
        content: {
          title: "Farcaster Bird",
          image: `${host}/og.png`,
          text: `🏆 Top 3 Players\n${text}`,
          buttons: [{ label: "▶️ Play", action: "post", target: "/api/frame?action=start" }]
        }
      });
    }

    // START GAME = open mini iframe
    if (action === "start") {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({
        version: "vNext",
        content: {
          title: "Farcaster Bird — Play",
          url: `${host}/mini.html`,
          layout: "mini-app"
        }
      });
    }

    // DEFAULT
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      version: "vNext",
      content: { text: "Unknown action" }
    });

  } catch (err) {
    console.error("frame error", err);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      version: "vNext",
      content: { text: "Server error" }
    });
  }
}
