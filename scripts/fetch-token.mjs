// Reads the platform token off Robinhood Chain at build time and writes data/token.json
// next to the site: its price (from Baum's launchpad), how much has been burned, and
// which agents are boosted. Runs from the Pages workflow every 10 minutes, after
// fetch-leaderboard.mjs.
//
//   TOKEN_ADDRESS=0x... node scripts/fetch-token.mjs dist
//
// A boost is a plain ERC-20 transfer to the dead address with the agent's wallet
// appended to the calldata (see src/lib/wallet.ts). Token contracts ignore trailing
// calldata, so the transfer is an ordinary burn; this script reads the tag back off
// each burn's transaction. Burns with no tag still count toward the burned total,
// and so do burns through the token's own burn() (a Transfer to 0x0 that lowers
// totalSupply), which never touch the dead address.
//
// It scans incrementally: the previous run's file on the live site says which block
// it reached. Without a token address it writes nothing and the site keeps its
// "not launched yet" state.

import { mkdir, writeFile } from 'node:fs/promises'

const out = process.argv[2] ?? 'dist'
const token = (process.env.TOKEN_ADDRESS ?? '').toLowerCase()
const rpc = process.env.RPC_URL || 'https://rpc.mainnet.chain.robinhood.com'
const api = process.env.BAUM_API ?? 'https://baumai.xyz'
const live = process.env.SITE_URL
const startBlock = Number(process.env.TOKEN_START_BLOCK || 0)

// Keep in step with src/config.ts and src/lib/wallet.ts.
const BOOST_PER_HOUR = 100_000
const DEAD = '0x000000000000000000000000000000000000dead'
const TAG = '41545042' // "ATPB", then the agent's 20-byte address
const TRANSFER = '0xa9059cbb'
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const ZERO = '0x' + '0'.repeat(64)
// Robinhood Chain allows 10M blocks per eth_getLogs when each filter position has one value.
const SPAN = 10_000_000
const RECENT = 25

if (!/^0x[0-9a-f]{40}$/.test(token)) {
  console.log('token: no TOKEN_ADDRESS; skipping')
  process.exit(0)
}

let id = 0
async function call(method, params) {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
  })
  const body = await res.json()
  if (body.error) throw new Error(`${method}: ${body.error.message}`)
  return body.result
}
const pad = (addr) => addr.slice(2).padStart(64, '0')
const read = (data) => call('eth_call', [{ to: token, data }, 'latest']).then(BigInt)

async function price() {
  // Baum prices tokens launched through it: on the curve directly, after graduation
  // from the last trade. Null when it can't, and the site falls back to token-only prices.
  const post = (path, body) =>
    fetch(`${api}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  const m = (await post('/api/launch/market', { tokens: [token] }))?.markets?.[token]
  if (m?.state === 'curve' && m.pairUsd) {
    return { priceUsd: Number(m.price) * m.pairUsd, marketCapUsd: (Number(m.marketCap) / 10 ** m.decimals) * m.pairUsd, state: 'curve' }
  }
  const h = (await post('/api/launch/trades', { token }))?.history
  const last = h?.points?.at(-1)
  if (last && h.pairUsd) return { priceUsd: last.price * h.pairUsd, marketCapUsd: null, state: m?.state ?? 'unknown' }
  return { priceUsd: null, marketCapUsd: null, state: m?.state ?? 'unknown' }
}

const prev = live
  ? await fetch(new URL('data/token.json', live)).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  : null
const state = prev?.address === token
  ? prev
  : { address: token, scannedTo: startBlock - 1, boosts: {}, recentBoosts: [], boostBurned: 0, supplyBurned: 0 }
// Files from before supply burns were counted: rescan from the start once to pick them up.
if (state.supplyBurned === undefined) Object.assign(state, { scannedTo: startBlock - 1, boosts: {}, recentBoosts: [], boostBurned: 0, supplyBurned: 0 })

await mkdir(`${out}/data`, { recursive: true })
try {
  const decimals = Number(await read('0x313ce567'))
  const unit = 10 ** decimals
  const head = Number(await call('eth_blockNumber', []))
  const blockTime = new Map()
  async function timeOf(n) {
    if (!blockTime.has(n)) blockTime.set(n, Number((await call('eth_getBlockByNumber', ['0x' + n.toString(16), false])).timestamp) * 1000)
    return blockTime.get(n)
  }

  for (let from = state.scannedTo + 1; from <= head; from += SPAN) {
    const to = Math.min(head, from + SPAN - 1)
    const logs = await call('eth_getLogs', [{
      address: token,
      fromBlock: '0x' + from.toString(16),
      toBlock: '0x' + to.toString(16),
      topics: [TRANSFER_TOPIC, null, '0x' + pad(DEAD)],
    }])
    const burns = await call('eth_getLogs', [{
      address: token,
      fromBlock: '0x' + from.toString(16),
      toBlock: '0x' + to.toString(16),
      topics: [TRANSFER_TOPIC, null, ZERO],
    }])
    for (const log of burns) state.supplyBurned += Number(BigInt(log.data)) / unit
    for (const log of logs) {
      const tx = await call('eth_getTransactionByHash', [log.transactionHash])
      const input = (tx?.input ?? '').toLowerCase()
      // Only a direct transfer from the booster's wallet carries the tag where we can read it.
      if (tx?.to?.toLowerCase() !== token || !input.startsWith(TRANSFER) || input.slice(138, 146) !== TAG) continue
      const agent = '0x' + input.slice(146, 186)
      const amount = Number(BigInt(log.data)) / unit
      const at = await timeOf(Number(log.blockNumber))
      // Boosts stack: a burn during an active boost extends it.
      const until = Math.max(state.boosts[agent] ?? 0, at) + (amount / BOOST_PER_HOUR) * 3_600_000
      state.boosts[agent] = Math.round(until)
      state.boostBurned += amount
      state.recentBoosts.unshift({ tx: log.transactionHash, agent, from: tx.from.toLowerCase(), amount, at })
    }
    state.scannedTo = to
  }

  const now = Date.now()
  const [supply, dead] = await Promise.all([read('0x18160ddd'), read('0x70a08231' + pad(DEAD))])
  const result = {
    address: token,
    decimals,
    ...(await price()),
    totalSupply: Number(supply) / unit,
    burned: Number(dead) / unit + state.supplyBurned,
    supplyBurned: state.supplyBurned,
    boostBurned: state.boostBurned,
    boosts: Object.fromEntries(Object.entries(state.boosts).filter(([, until]) => until > now - 86_400_000)),
    recentBoosts: state.recentBoosts.slice(0, RECENT),
    scannedTo: state.scannedTo,
    updatedAt: now,
  }

  await writeFile(`${out}/data/token.json`, JSON.stringify(result))
  console.log(`token: price ${result.priceUsd ?? 'unknown'}, burned ${result.burned}, ${Object.keys(result.boosts).length} boosts, scanned to ${head}`)
} catch (err) {
  // The RPC failed partway: serve the last good copy rather than drop boosts from the site.
  console.warn(`token: ${err.message}`)
  if (prev) {
    await writeFile(`${out}/data/token.json`, JSON.stringify(prev))
    console.warn("token: kept the live site's copy")
  }
}
