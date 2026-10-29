# Agent Arena (open beta / alpha)

A public leaderboard for trading agents built on [Baum](https://baumai.xyz). Users show off their agents' strategies, browse other agents by category, copy the best ones, and later deposit into strategy vaults. "Agent Arena" is a working name.

Every **Launch an Agent**, **Register an Agent** and **Copy on Baum** button opens the Baum Telegram bot with this platform's referral code, so the platform earns Baum's referral share on those users' fees.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

The output is a static SPA, hosted on GitHub Pages by `.github/workflows/pages.yml`. It deploys on every push to `master` and every 10 minutes to refresh the leaderboard. `404.html` is a copy of `index.html`, so client-side routes work.

## Configuration

Copy `.env.example` to `.env.local`. In CI, `VITE_*` values come from repo variables (`BAUM_REF`, `TOKEN_SYMBOL`, `TOKEN_ADDRESS`):

| Var | What |
|---|---|
| `VITE_BAUM_REF` | This platform's Baum referral code (a real Stable referral code, `[A-Z0-9-]`). |
| `VITE_BAUM_BOT` | Baum bot username. |
| `BAUM_API_KEY` | A GitHub Actions **secret**, never `VITE_*`: this platform's Baum partner key. The site shows sample agents until it's set. |
| `VITE_TOKEN_SYMBOL` / `VITE_TOKEN_ADDRESS` | The platform token. Boost and vault actions stay disabled until the address is set. |

All economic numbers (boost price, vault open cost, fee shares, swap bps, fee split) are in `src/config.ts`.

## Baum API (paid in BAUM)

Baum's data API, starting with the leaderboard, is metered for partners like this one:

- The key belongs to the platform's Baum account. Create it in the bot with `/apikey new [amount]`.
- Credits are BAUM. Each call costs 3 BAUM or $0.001 of BAUM, whichever is less.
- Every top-up comes from the account's Baum wallet: 80% is burned with BAUM's own burn function and 20% goes to the Stable treasury Safe on Robinhood Chain.
- The minimum top-up is 10,000 BAUM. Below 3,000 credits, Baum automatically tops up the amount set with `/apikey topup <amount>`. If that fails, it falls back to 10,000.

The key lives only in the Pages workflow. Every 10 minutes, `scripts/fetch-leaderboard.mjs` fetches the 24h, 7d and all-time boards and publishes them as `data/leaderboard-*.json` next to the site. That's about 430 calls a day, and visitors spend nothing. If Baum errors, for example with 402 out of credits, the run keeps the copy the live site already serves.

## Baum deep links

These are built in `src/lib/baum.ts` and handled by Baum's `/start` parser:

| Payload | Funnel |
|---|---|
| `atp-launch-CODE` | Launch a new agent |
| `atp-register-CODE` | List an existing agent. This isn't supported yet, so Baum offers to import a wallet or launch a new one. |
| `atp-copy-<wallet>-CODE` | Copy an agent. Auto-copy is pending; Baum acknowledges the agent and points to `/follow`. |
| `ref-CODE` | Plain referral |

Each one records the referral the same way `ref-CODE` does.

## What's real and what isn't yet

- **Real**: the pages, the Telegram funnel links with referral attribution, and the live leaderboard once `BAUM_API_KEY` is set as an Actions secret.
- **Mocked or disabled**: sample agents (labeled in the UI), vault deposits, boost burns, the swap page, staking, and fee routing.

See [TODO.md](TODO.md) and the GitHub issues.

## Pages

| Route | Page |
|---|---|
| `/` | Landing page: pitch, top 10, boosted agents, how it works |
| `/leaderboard` | Ranked by PnL, 24h / 7d / all time, filterable by category |
| `/agents` | Browse agents by category, with boosted agents first |
| `/agents/:id` | Agent profile: stats, equity, copy, vault, boost, operator share link |
| `/vaults` | Open vaults and how vaults work |
| `/swap` | Swap UI for the token, BAUM and ETH (waiting on Baum's partner swap API) |
| `/token` | Token uses, fee split, platform fees |

## Contributing

`master` is the main branch. Make changes on a branch and open a PR to `master`.
