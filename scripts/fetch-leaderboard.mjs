// Fetches Baum's paid leaderboards (traders, and top LPs for the Yield category) at build time and writes it next to the site as
// static JSON, so the Baum partner key lives only in the GitHub Actions secret and
// visitors never spend credits. Runs from the Pages workflow every 10 minutes, but
// pays for the trader boards only about every 30 (like slugs.run's cache).
//
//   BAUM_API_KEY=... node scripts/fetch-leaderboard.mjs dist
//
// If a fetch fails (no key, 402 out of credits, Baum down), it keeps the copy the
// live site already serves, so a bad run never blanks the board. With neither, it
// writes nothing and the site shows its sample agents.

import { mkdir, writeFile } from 'node:fs/promises'

const out = process.argv[2] ?? 'dist'
const api = process.env.BAUM_API ?? 'https://baumai.xyz'
const key = process.env.BAUM_API_KEY
const live = process.env.SITE_URL // e.g. https://gumdropsteve.github.io/agent-trading-platform/

await mkdir(`${out}/data`, { recursive: true })
const fresh = {} // trader boards Baum answered this run, by range

// The LP board (the Yield category) changes slowly: fetched once an hour and on
// pushes or manual runs, and carried over from the live site in between.
const lpDue = process.env.GITHUB_EVENT_NAME !== 'schedule' || new Date().getUTCMinutes() < 10
// The trader boards: fetched once the live copy's Baum snapshot is 25 minutes old.
// Baum's snapshot is up to 10 minutes old when fetched, so that is about every 30
// minutes. Going by the copy's age, not the clock, survives GitHub's late crons.
const TRADERS_EVERY = 25 * 60_000
const liveAt = live
  ? await fetch(new URL('data/leaderboard-24h.json', live)).then((r) => (r.ok ? r.json() : null)).then((d) => d?.updatedAt).catch(() => null)
  : null
const tradersDue = process.env.GITHUB_EVENT_NAME !== 'schedule' || !liveAt || Date.now() - liveAt >= TRADERS_EVERY
const boards = [
  ...['24h', '7d', 'all'].map((range) => ({ board: 'traders', range, file: `leaderboard-${range}.json`, skip: !tradersDue })),
  ...['24h', '7d', 'all'].map((range) => ({ board: 'lps', range, file: `lps-${range}.json`, skip: !lpDue })),
]

for (const { board, range, file, skip } of boards) {
  let body = null
  if (key && !skip) {
    const res = await fetch(`${api}/api/leaderboard?board=${board}&range=${range}`, {
      headers: { authorization: `Bearer ${key}` },
    }).catch(() => null)
    if (res?.ok) {
      body = await res.text()
      if (board === 'traders') fresh[range] = body
    } else console.warn(`${board} ${range}: Baum answered ${res?.status ?? 'nothing'}${res ? ` ${await res.text()}` : ''}`)
    const credits = res?.headers.get('x-baum-credits')
    if (credits) console.log(`credits left: ${credits}`)
  }
  if (!body && live) {
    const prev = await fetch(new URL(`data/${file}`, live)).catch(() => null)
    if (prev?.ok) {
      body = await prev.text()
      if (!skip) console.warn(`${board} ${range}: kept the live site's copy`)
    }
  }
  if (body) await writeFile(`${out}/data/${file}`, body)
  else console.warn(`${board} ${range}: no data${board === 'traders' ? '; the site will show sample agents' : ''}`)
}

// The weekly prize: the first run after Monday 00:00 UTC records the 7d board's top 3
// by PnL as last week's winners, in data/winners.json. History is carried forward
// from the live site's copy, like the token scan.
const DAY = 86_400_000
const monday = (t) => {
  const d = new Date(t)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - ((d.getUTCDay() + 6) % 7) * DAY
}
const thisWeek = monday(Date.now())
const prevWinners = live
  ? await fetch(new URL('data/winners.json', live)).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  : null
// First run: start counting from this week; the first winners are recorded next Monday.
const winners = prevWinners ?? { snapshotWeek: thisWeek, weeks: [] }
if (thisWeek > winners.snapshotWeek && fresh['7d']) {
  const top = JSON.parse(fresh['7d']).rows
    .filter((r) => r.pnlUsd > 0)
    .sort((a, b) => b.pnlUsd - a.pnlUsd)
    .slice(0, 3)
    .map(({ wallet, username, pnlUsd, volumeUsd, trades }) => ({ wallet, username, pnlUsd, volumeUsd, trades }))
  winners.weeks.unshift({ weekStart: thisWeek - 7 * DAY, weekEnd: thisWeek, top })
  winners.snapshotWeek = thisWeek
  console.log(`winners: recorded the week ending ${new Date(thisWeek).toISOString().slice(0, 10)}`)
}
await writeFile(`${out}/data/winners.json`, JSON.stringify(winners))
