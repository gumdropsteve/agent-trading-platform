import { useEffect, useState } from 'react'
import { CATEGORIES, type Category } from '../config'

export type Range = '24h' | '7d' | 'all'

export type Vault = {
  tvlUsd: number
  feePct: number // operator's performance fee
  depositors: number
}

export type Agent = {
  id: string // the agent's wallet address
  name: string
  owner: string
  category: Category
  description: string
  pnlUsd: Record<Range, number>
  returnPct: Record<Range, number>
  volumeUsd: number
  trades: number
  winRate: number
  followers: number
  equity: number[] // last 30 daily equity marks, for the sparkline
  boostedUntil?: number // ms timestamp; set by burning the platform token
  vault?: Vault
  sample: boolean // true for the seeded demo agents
}

// ---- seeded sample agents (shown until a Baum leaderboard API is configured) ----

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

const NAMES = [
  'Momentum Mike', 'Degen Dolphin', 'Pelosi Shadow', 'NVDA Ladder', 'Stable Yielder', 'BAUM DCA Bot',
  'Curve Sniper', 'Grid Gremlin', 'Basis Bandit', 'Trend Turtle', 'Whale Watcher', 'Mean Reverter',
  'Pons Pioneer', 'Quiet Compounder', 'Breakout Bob', 'Funding Farmer', 'Fomo Follower', 'Delta Neutral',
  'Night Shift', 'Slow Stacker', 'Volatility Vic', 'Narrative Nate', 'Range Rider', 'Lazy Lender',
]
const CAT_FOR: Category[] = [
  'Momentum', 'Memecoins', 'Copy trading', 'Stock Tokens', 'Yield', 'DCA',
  'Memecoins', 'Market making', 'Yield', 'Momentum', 'Copy trading', 'Discretionary',
  'Memecoins', 'Yield', 'Momentum', 'Yield', 'Copy trading', 'Market making',
  'Discretionary', 'DCA', 'Discretionary', 'Memecoins', 'Market making', 'Yield',
]
const BLURB: Record<Category, string> = {
  Momentum: 'Rides ETH and majors on trend breaks, cuts losers fast.',
  Memecoins: 'Buys early on Pons bonding curves, trims into strength.',
  'Copy trading': 'Mirrors tracked wallets and politicians with a size cap.',
  'Stock Tokens': 'Limit-order ladders on Stock Tokens around earnings.',
  Yield: 'Rotates stablecoins between the best lending and LP yields.',
  DCA: 'Steady buys on a schedule with take-profit trims.',
  'Market making': 'Provides concentrated liquidity and rebalances on drift.',
  Discretionary: 'Managed by hand through Baum chat.',
}

function hex(r: () => number, n: number) {
  let s = ''
  for (let i = 0; i < n; i++) s += Math.floor(r() * 16).toString(16)
  return s
}

function sampleAgents(): Agent[] {
  const r = rng(42)
  const now = Date.now()
  return NAMES.map((name, i) => {
    const category = CAT_FOR[i]
    const start = 1000 + Math.round(r() * 49000)
    const drift = (r() - 0.35) * 0.02
    const vol = 0.01 + r() * 0.05
    const equity = [start]
    for (let d = 1; d < 30; d++) equity.push(Math.max(50, equity[d - 1] * (1 + drift + (r() - 0.5) * vol)))
    const last = equity[29]
    const ret = (from: number) => (last - from) / from
    const returnPct = { '24h': ret(equity[28]), '7d': ret(equity[22]), all: ret(equity[0]) }
    const pnlUsd = { '24h': last - equity[28], '7d': last - equity[22], all: last - equity[0] }
    return {
      id: '0x' + hex(r, 40),
      name,
      owner: '@' + name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10),
      category,
      description: BLURB[category],
      pnlUsd,
      returnPct,
      volumeUsd: Math.round(start * (5 + r() * 40)),
      trades: Math.round(20 + r() * 600),
      winRate: 0.35 + r() * 0.35,
      followers: Math.round(r() * 400),
      equity,
      boostedUntil: i % 7 === 2 ? now + 3_600_000 * (1 + Math.round(r() * 5)) : undefined,
      vault: i % 4 === 0 || i % 7 === 2
        ? { tvlUsd: Math.round(5000 + r() * 250000), feePct: [10, 15, 20][Math.floor(r() * 3)], depositors: Math.round(3 + r() * 120) }
        : undefined,
      sample: true,
    }
  })
}

// ---- live data from Baum ----

// Shape of a row from Baum's GET /api/leaderboard?board=traders. The Pages workflow
// fetches it with the paid key and publishes it as static JSON next to the site
// (scripts/fetch-leaderboard.mjs), so the key never reaches the browser.
type TraderRow = { wallet: string; username?: string; volumeUsd: number; pnlUsd: number; trades: number; tokens: number }

async function fetchBoard(range: Range): Promise<TraderRow[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/leaderboard-${range}.json`)
  if (!res.ok) throw new Error(`leaderboard: ${res.status}`)
  return (await res.json()).rows
}

async function liveAgents(): Promise<Agent[]> {
  const [day, week, all] = await Promise.all((['24h', '7d', 'all'] as Range[]).map(fetchBoard))
  const by = (rows: TraderRow[]) => new Map(rows.map((x) => [x.wallet, x]))
  const d = by(day), w = by(week)
  // Return % uses volume as the base until Baum reports equity.
  const pct = (x?: TraderRow) => (x && x.volumeUsd ? x.pnlUsd / x.volumeUsd : 0)
  return all.map((row) => ({
    id: row.wallet,
    name: row.username ? `@${row.username}` : `${row.wallet.slice(0, 6)}…${row.wallet.slice(-4)}`,
    owner: row.username ? `@${row.username}` : '',
    category: 'Discretionary',
    description: `Trades through Baum. ${row.tokens} tokens traded.`,
    pnlUsd: { '24h': d.get(row.wallet)?.pnlUsd ?? 0, '7d': w.get(row.wallet)?.pnlUsd ?? 0, all: row.pnlUsd },
    returnPct: { '24h': pct(d.get(row.wallet)), '7d': pct(w.get(row.wallet)), all: pct(row) },
    volumeUsd: row.volumeUsd,
    trades: row.trades,
    winRate: NaN,
    followers: 0,
    equity: [],
    sample: false,
  }))
}

let cache: Promise<Agent[]> | undefined

export function loadAgents(): Promise<Agent[]> {
  // No published data yet (no key, or dev): the seeded sample agents.
  cache ??= liveAgents()
    .then((agents) => (agents.length ? agents : sampleAgents()))
    .catch(() => sampleAgents())
  return cache
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[] | null>(null)
  useEffect(() => {
    loadAgents().then(setAgents)
  }, [])
  return agents
}

export const isBoosted = (a: Agent) => (a.boostedUntil ?? 0) > Date.now()

// Boosted agents first, then by PnL over the range.
export function ranked(agents: Agent[], range: Range, boostFirst = false) {
  return [...agents].sort(
    (a, b) => (boostFirst ? Number(isBoosted(b)) - Number(isBoosted(a)) : 0) || b.pnlUsd[range] - a.pnlUsd[range],
  )
}

export { CATEGORIES }
