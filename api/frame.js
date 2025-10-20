// api/frame.js  vercel serverless function  commonjs  zero deps

async function getTop3FromUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return []

  // Upstash REST: ZREVRANGE leaderboard 0 2 WITHSCORES
  const resp = await fetch(`${url}/zrevrange/leaderboard/0/2/withscores`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!resp.ok) return []

  // Upstash REST may return either a flat array or { result: [...] }
  const raw = await resp.json()
  const arr = Array.isArray(raw) ? raw : raw?.result
  if (!Array.isArray(arr)) return []

  const pairs = []
  for (let i = 0; i < arr.length; i += 2) {
    const name = String(arr[i] ?? '')
    const score = Number(arr[i + 1] ?? 0)
    if (name) pairs.push([name, score])
  }
  return pairs.slice(0, 3)
}

function send(res, obj, status = 200) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(obj)
  }
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

module.exports = async function handler(req, res) {
  try {
    const host =
      req && req.headers && req.headers.host
        ? `https://${req.headers.host}`
        : 'https://farcasterbird.vercel.app'

    const url = new URL((req && req.url) || '/api/frame', host)
    const action = url.searchParams.get('action') || 'home'

    // الشاشة ديال البداية
    if (action === 'home') {
      let top3 = []
      try {
        top3 = await getTop3FromUpstash()
      } catch {}

      const text =
        top3.length === 0
          ? 'No scores yet'
          : top3.map(([username, score], i) => `${i + 1}. ${username} - ${score}`).join('\n')

      return send(res, {
        version: 'vNext',
        content: {
          title: 'Farcaster Bird',
          image: 'https://placehold.co/1200x630/png?text=Farcaster+Bird',
          text: `🏆 Top 3 Players\n${text}`,
          buttons: [{ label: '▶️ Play', action: 'post', target: '/api/frame?action=start' }],
        },
      })
    }

    // عندما يضغط على Play → ندخلو للـ mini.html
    if (action === 'start') {
      return send(res, {
        version: 'vNext',
        content: {
          title: 'Farcaster Bird — Play',
          url: `${host}/mini.html`,
          layout: 'mini-app',
        },
      })
    }

    return send(res, { version: 'vNext', content: { text: 'Unknown action' } })
  } catch (err) {
    console.error('Frame error:', err)
    return send(res, { version: 'vNext', content: { text: 'Server error ⚠️' } }, 500)
  }
}
