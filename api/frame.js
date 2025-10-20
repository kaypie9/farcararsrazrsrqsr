import { Redis } from '@upstash/redis'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

export default async function handler(req, res) {
  try {
    const base = req.headers?.host
      ? https://${req.headers.host}
      : 'https://farcasterbird.vercel.app/'

    const url = new URL(req.url ?? '/api/frame', base)
    const action = url.searchParams.get('action') ?? 'home'

    // home screen
    if (action === 'home') {
      let top3 = []
      if (redis) {
        try {
          const z = await redis.zrevrange('leaderboard', 0, 2, { withScores: true })
          top3 = Array.isArray(z) ? z : []
        } catch {}
      }

      const text =
        top3.length === 0
          ? 'No scores yet'
          : top3.map(([username, score], i) => ${i + 1}. ${username} - ${score}).join('\n')

      res.setHeader('Content-Type', 'application/json')
      return res.status(200).json({
        version: 'vNext',
        content: {
          title: 'Farcaster Bird',
          image: ${base}/og.png,
          text: 🏆 Top 3 Players\n${text},
          buttons: [{ label: '▶️ Play', action: 'post', target: '/api/frame?action=start' }],
        },
      })
    }

    // start the mini app
    if (action === 'start') {
      res.setHeader('Content-Type', 'application/json')
      return res.status(200).json({
        version: 'vNext',
        content: {
          title: 'Farcaster Bird — Play',
          url: ${base}/mini.html,
          layout: 'mini-app',
        },
      })
    }

    res.setHeader('Content-Type', 'application/json')
    return res.status(200).json({
      version: 'vNext',
      content: { text: 'Unknown action' },
    })
  } catch (err) {
    console.error('Frame error:', err)
    res.setHeader('Content-Type', 'application/json')
    return res.status(500).json({
      version: 'vNext',
      content: { text: 'Server error ⚠️' },
    })
  }
}
