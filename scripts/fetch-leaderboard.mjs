// Fetches Baum's paid leaderboard at build time and writes it next to the site as
// static JSON, so the Baum partner key lives only in the GitHub Actions secret and
// visitors never spend credits. Runs from the Pages workflow every 10 minutes.
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

for (const range of ['24h', '7d', 'all']) {
  const file = `leaderboard-${range}.json`
  let body = null
  if (key) {
    const res = await fetch(`${api}/api/leaderboard?board=traders&range=${range}`, {
      headers: { authorization: `Bearer ${key}` },
    }).catch(() => null)
    if (res?.ok) body = await res.text()
    else console.warn(`${range}: Baum answered ${res?.status ?? 'nothing'}${res ? ` ${await res.text()}` : ''}`)
    const credits = res?.headers.get('x-baum-credits')
    if (credits) console.log(`credits left: ${credits}`)
  }
  if (!body && live) {
    const prev = await fetch(new URL(`data/${file}`, live)).catch(() => null)
    if (prev?.ok) {
      body = await prev.text()
      console.warn(`${range}: kept the live site's copy`)
    }
  }
  if (body) await writeFile(`${out}/data/${file}`, body)
  else console.warn(`${range}: no data; the site will show sample agents`)
}
