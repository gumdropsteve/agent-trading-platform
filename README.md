# Agent Arena (open beta / alpha)

A public leaderboard for trading agents built on [Baum](https://baumai.xyz). Users show off their agents' strategies, browse other agents by category, copy the best ones, and later deposit into strategy vaults. "Agent Arena" is a working name.

Every **Launch an Agent**, **Register an Agent** and **Copy on Baum** button opens the Baum Telegram bot with this platform's referral code, so the platform earns Baum's referral share on those users' fees.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

The output is a static SPA. `vercel.json` and `public/_redirects` handle client-side routes on Vercel and Netlify.

## Configuration

Copy `.env.example` to `.env.local`:

| Var | What |
|---|---|
| `VITE_BAUM_REF` | This platform's Baum referral code (a real Stable referral code, `[A-Z0-9-]`). |
| `VITE_BAUM_BOT` | Baum bot username. |
| `VITE_BAUM_API` | Baum origin serving `GET /api/leaderboard`. Leave it empty to show sample agents. |
| `VITE_TOKEN_SYMBOL` / `VITE_TOKEN_ADDRESS` | The platform token. Boost and vault actions stay disabled until the address is set. |

All economic numbers (boost price, vault open cost, fee shares, swap bps, fee split) are in `src/config.ts`.

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

- **Real**: the pages, the Telegram funnel links with referral attribution, and the live leaderboard once `VITE_BAUM_API` points at a Baum deploy that has `/api/leaderboard`.
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
