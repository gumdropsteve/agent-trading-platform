// Writes a real HTML file for every route and every listed agent, each a copy of the
// built index.html with its own title, description and share-card tags. Link previews
// (X, Telegram, Discord) don't run JavaScript, so without this every link shares as
// the home page; it also turns the SPA's 404-with-app answers into 200s.
//
//   SITE_URL=https://.../ node scripts/static-pages.mjs dist
//
// Runs after fetch-leaderboard.mjs, so agent pages exist for whoever is on the board.

import { mkdir, readFile, writeFile } from 'node:fs/promises'

const out = process.argv[2] ?? 'dist'
const site = (process.env.SITE_URL ?? '').replace(/\/?$/, '/')
const symbol = process.env.VITE_TOKEN_SYMBOL || 'AGENT'
const template = await readFile(`${out}/index.html`, 'utf8')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const money = (n) => `${n < 0 ? '−' : '+'}$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

function page(path, title, description) {
  const url = site + path
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Agent Arena" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(site)}og.png" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
  ].join('\n    ')
  return template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `    ${tags}\n  </head>`)
}

async function write(path, html) {
  const dir = path ? `${out}/${path}` : out
  await mkdir(dir, { recursive: true })
  await writeFile(`${dir}/index.html`, html)
}

const pitch = 'A public leaderboard of trading agents built on Baum. Launch an agent, climb the board, copy the best.'
const routes = [
  ['', 'Agent Arena · Show off your trading agent', pitch],
  ['leaderboard', 'Leaderboard · Agent Arena', 'Trading agents on Baum ranked by PnL over 24h, 7d and all time.'],
  ['agents', 'Browse agents · Agent Arena', 'Browse trading agents on Baum by category. Boosted agents first.'],
  ['vaults', 'Vaults · Agent Arena', 'Back a trading strategy through its vault. Operators set their own performance fee.'],
  ['swap', 'Swap · Agent Arena', `Trade ${symbol}, BAUM and ETH on Robinhood Chain.`],
  ['token', `$${symbol} · Agent Arena`, `The platform token: burn ${symbol} to boost an agent; platform fees buy it back.`],
]
for (const [path, title, description] of routes) await write(path, page(path, title, description))

// One page per agent on the board, from the boards fetch-leaderboard.mjs just wrote.
const board = async (name) => JSON.parse(await readFile(`${out}/data/${name}.json`, 'utf8').catch(() => '{"rows":[]}')).rows
const [week, all] = await Promise.all([board('leaderboard-7d'), board('leaderboard-all')])
const weekly = new Map(week.map((r) => [r.wallet, r]))
for (const row of all) {
  const name = row.username ? `@${row.username}` : `${row.wallet.slice(0, 6)}…${row.wallet.slice(-4)}`
  const w = weekly.get(row.wallet)
  const description =
    `${w ? `${money(w.pnlUsd)} this week, ` : ''}${money(row.pnlUsd)} all time on $${Math.round(row.volumeUsd).toLocaleString('en-US')} volume ` +
    `across ${row.trades} trades. Copy this agent on Baum.`
  await write(`agents/${row.wallet}`, page(`agents/${row.wallet}`, `${name} · Agent Arena`, description))
}
// LP-only wallets (the Yield category) get a page too, described by their LP stats.
const lps = await board('lps-all').catch(() => [])
const traders = new Set(all.map((r) => r.wallet.toLowerCase()))
let lpPages = 0
for (const row of lps) {
  if (traders.has(row.wallet.toLowerCase())) continue
  const name = row.username ? `@${row.username}` : `${row.wallet.slice(0, 6)}…${row.wallet.slice(-4)}`
  const description =
    `${money(row.feesUsd)} in LP fees on $${Math.round(row.liquidityUsd).toLocaleString('en-US')} of liquidity` +
    `${row.pools?.length ? ` in ${row.pools.slice(0, 3).join(', ')}` : ''}. Yield on Agent Arena.`
  await write(`agents/${row.wallet}`, page(`agents/${row.wallet}`, `${name} · Agent Arena`, description))
  lpPages++
}
console.log(`pages: ${routes.length} routes, ${all.length} agents, ${lpPages} LP-only agents`)
