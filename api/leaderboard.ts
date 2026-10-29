// Server-side proxy for Baum's paid leaderboard API (Vercel function).
// The Baum partner key stays here, never in the browser. Each call to Baum costs
// credits, so responses are cached at the edge: visitors hit the cache, and Baum is
// called about once a minute per board and range. If Baum fails (e.g. 402, out of
// credits) the edge keeps serving the last good copy for up to a day (stale-if-error).

const RANGES = new Set(['24h', '7d', 'all'])
const BOARDS = new Set(['traders', 'creators', 'tokens', 'lps'])

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const range = url.searchParams.get('range') ?? '7d'
  const board = url.searchParams.get('board') ?? 'traders'
  if (!RANGES.has(range) || !BOARDS.has(board)) return json(400, { reason: 'bad-param' })

  const origin = process.env.BAUM_API
  const key = process.env.BAUM_API_KEY
  if (!origin || !key) return json(503, { reason: 'not-configured' })

  const upstream = await fetch(`${origin}/api/leaderboard?range=${range}&board=${board}`, {
    headers: { authorization: `Bearer ${key}` },
  }).catch(() => null)
  if (!upstream?.ok) {
    // Credits left is a Baum-side concern; don't leak it, just signal failure.
    return json(502, { reason: 'upstream', status: upstream?.status ?? 0 }, 'no-store')
  }
  return json(200, await upstream.json(), 'public, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400')
}

function json(status: number, body: unknown, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': cache },
  })
}
