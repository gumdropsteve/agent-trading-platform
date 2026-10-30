import { useEffect, useState } from 'react'
import { CATEGORIES, type Category } from '../config'
import { loadToken } from './token'

export type Range = '24h' | '7d' | 'all'

export type Vault = {
  tvlUsd: number
  feePct: number // operator's performance fee
  depositors: number
}

// A wallet's liquidity-provision stats, from Baum's top-LPs board.
export type LpStats = {
  feesUsd: Record<Range, number> // fees earned in the range, at today's prices
  liquidityUsd: number // open positions' value now
  feeAprPercent: number | null // last week's fees annualised; null under a minimum size
  positions: number
  pools: string[]
}

export type Agent = {
  id: string // the agent's wallet address
  name: string
  owner: string
  category: Category // the one shown first
  categories: Category[] // every category it's listed in (an LP that also trades is in two)
  trader: boolean // has trading stats (PnL, volume); false for a wallet only on the LP board
  lp?: LpStats
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
      categories: [category],
      trader: true,
      sample: true,
    }
  })
}

// ---- live data from Baum ----

// Shape of a row from Baum's GET /api/leaderboard?board=traders. The Pages workflow
// fetches it with the paid key and publishes it as static JSON next to the site
// (scripts/fetch-leaderboard.mjs), so the key never reaches the browser.
type TraderRow = { wallet: string; username?: string; volumeUsd: number; pnlUsd: number; trades: number; tokens: number }
type LpRow = { wallet: string; username?: string; feesUsd: number; liquidityUsd: number; feeAprPercent: number | null; positions: number; pools: string[] }

// When Baum last snapshotted the trader board the site is showing (ms), for the "updated" note.
let updatedAt: number | null = null
export const boardUpdatedAt = () => updatedAt

async function fetchBoard<T>(file: string): Promise<T[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${file}.json`)
  if (!res.ok) throw new Error(`${file}: ${res.status}`)
  const body = await res.json()
  if (file === 'leaderboard-all' && typeof body.updatedAt === 'number') updatedAt = body.updatedAt
  return body.rows
}

const RANGES: Range[] = ['24h', '7d', 'all']
const shortName = (wallet: string, username?: string) => (username ? `@${username}` : `${wallet.slice(0, 6)}…${wallet.slice(-4)}`)

async function liveAgents(): Promise<Agent[]> {
  const [day, week, all] = await Promise.all(RANGES.map((r) => fetchBoard<TraderRow>(`leaderboard-${r}`)))
  // The LP board is optional: without it there's simply no Yield section.
  const [lpDay, lpWeek, lpAll] = await Promise.all(RANGES.map((r) => fetchBoard<LpRow>(`lps-${r}`).catch(() => [] as LpRow[])))
  const by = <T extends { wallet: string }>(rows: T[]) => new Map(rows.map((x) => [x.wallet.toLowerCase(), x]))
  const d = by(day), w = by(week)
  const traders: Agent[] = all.map((row) => ({
    id: row.wallet,
    name: shortName(row.wallet, row.username),
    owner: row.username ? `@${row.username}` : '',
    category: 'Discretionary',
    categories: ['Discretionary'],
    trader: true,
    description: `Trades through Baum. ${row.tokens} ${row.tokens === 1 ? 'token' : 'tokens'} traded.`,
    pnlUsd: { '24h': d.get(row.wallet.toLowerCase())?.pnlUsd ?? 0, '7d': w.get(row.wallet.toLowerCase())?.pnlUsd ?? 0, all: row.pnlUsd },
    // No return % until Baum reports equity: PnL over volume reads +100% for a single buy that went up.
    returnPct: { '24h': NaN, '7d': NaN, all: NaN },
    volumeUsd: row.volumeUsd,
    trades: row.trades,
    winRate: NaN,
    followers: 0,
    equity: [],
    sample: false,
  }))

  // Wallets on Baum's top-LPs board go in Yield with their LP stats. One that also
  // trades keeps its trading stats under Discretionary and is listed in both.
  const byId = new Map(traders.map((a) => [a.id.toLowerCase(), a]))
  const ld = by(lpDay), lw = by(lpWeek)
  for (const row of lpAll) {
    const key = row.wallet.toLowerCase()
    const lp: LpStats = {
      feesUsd: { '24h': ld.get(key)?.feesUsd ?? 0, '7d': lw.get(key)?.feesUsd ?? 0, all: row.feesUsd },
      liquidityUsd: row.liquidityUsd,
      feeAprPercent: row.feeAprPercent,
      positions: row.positions,
      pools: row.pools,
    }
    const known = byId.get(key)
    if (known) {
      known.lp = lp
      known.categories.push('Yield')
      continue
    }
    traders.push({
      id: row.wallet,
      name: shortName(row.wallet, row.username),
      owner: row.username ? `@${row.username}` : '',
      category: 'Yield',
      categories: ['Yield'],
      trader: false,
      lp,
      description: `Provides liquidity through Baum${row.pools.length ? ` in ${row.pools.slice(0, 3).join(', ')}` : ''}.`,
      pnlUsd: { '24h': 0, '7d': 0, all: 0 },
      returnPct: { '24h': NaN, '7d': NaN, all: NaN },
      volumeUsd: 0,
      trades: 0,
      winRate: NaN,
      followers: 0,
      equity: [],
      sample: false,
    })
  }
  return traders
}

let cache: Promise<Agent[]> | undefined

export function loadAgents(): Promise<Agent[]> {
  // No published data yet (no key, or dev): the seeded sample agents.
  cache ??= Promise.all([
    liveAgents()
      .then((agents) => (agents.length ? agents : sampleAgents()))
      .catch(() => sampleAgents()),
    loadToken(),
  ]).then(([agents, token]) => {
    // Live agents are boosted by on-chain burns; sample agents keep their seeded boosts.
    if (token) for (const a of agents) if (!a.sample) a.boostedUntil = token.boosts[a.id.toLowerCase()]
    return agents
  })
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

export const inCategory = (a: Agent, cat: Category) => a.categories.includes(cat)

// Yield is ranked by LP fees when there are LP stats; everything else by trading PnL.
export const byFees = (agents: Agent[]) => agents.some((a) => a.lp)

// Boosted agents first, then by PnL (or LP fees, for Yield) over the range.
export function ranked(agents: Agent[], range: Range, boostFirst = false, fees = false) {
  const score = (a: Agent) => (fees ? a.lp?.feesUsd[range] ?? -Infinity : a.pnlUsd[range])
  return [...agents].sort(
    (a, b) => (boostFirst ? Number(isBoosted(b)) - Number(isBoosted(a)) : 0) || score(b) - score(a),
  )
}

export { CATEGORIES }
