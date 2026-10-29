# TODO

Each of these is bigger than a quick change. The alpha ships without them; the UI shows them as "coming soon" or disabled.

## Go live (small, do first)
- [ ] Create the platform's Baum referral code (13 characters max, for copy links) and set `VITE_BAUM_REF`
- [ ] Merge and deploy the Baum-side support (`atp-` deep links + public `GET /api/leaderboard`, a draft PR in the Baum repo), then set `VITE_BAUM_API`
- [ ] Confirm the production bot username (`VITE_BAUM_BOT`)
- [ ] Deploy to Vercel. Pick the final name and domain ("Agent Arena" is a working name)

## Token
- [ ] Launch the platform token, then set `VITE_TOKEN_SYMBOL` and `VITE_TOKEN_ADDRESS`

## Boosts (100k tokens burned per hour)
- [ ] On-chain burn flow: a burn tagged with the agent, or a small BoostBurner contract that emits `Boosted(agent, hours)`
- [ ] An indexer that turns burns into `boostedUntil` per agent, served to the app
- The UI and sorting are done. Boosted agents show first in their category and on the vaults page.

## Vaults
- [ ] Design doc: custody (an ERC-4626 vault, a Safe module, or a Baum-managed wallet), how the agent trades vault funds, withdrawals, and when the performance fee is charged
- [ ] Opening fee: min(1M tokens, $100 of the token)
- [ ] Platform share of vault fees: 30% when the depositor found the vault on the platform, 10% when they came from the operator's link (`?via=`). Attribution is client-side today (`src/lib/attribution.ts`); the source has to travel with the deposit on-chain.
- [ ] Audit before real deposits

## Fee router
- [ ] Collect platform revenue: the Baum referral share, vault fee shares, and swap bps
- [ ] Split it: 50% buys back and burns the token, 10% buys back for a weekly prize to the top 3 strategies, 10% buys back for stakers, 30% to the treasury (`FEE_SPLIT` in `src/config.ts`)
- [ ] A weekly job that snapshots the top 3 on the 7d board and pays them

## Staking and voting (optional)
- [ ] Stake to earn the stakers' share, and maybe vote on featured agents or fees. Decide after launch.

## Swap page (+10 bps)
- [ ] Baum partner swap API: API key, quote, and an unsigned transaction with a partner fee
- [ ] Wire up `src/pages/Swap.tsx` with a wallet connection (wagmi/viem)

## Copy trading
- [ ] Baum: follow a platform agent the same way users already follow fomo traders and politicians. The `atp-copy-…` link should then start following directly.

## Agents
- [ ] Register existing (non-Baum) agents: prove ownership with a signed message, index the wallet's trades (agent-trading-dashboard's replay pipeline does this for Solana), and list it
- [ ] Agent metadata: name, category, description and avatar. Live rows are wallets with no category yet, so they all show as "Discretionary"
- [ ] Per-range PnL from Baum (its `pnlUsd` is all-time, so live 24h/7d tabs show all-time PnL for now)
- [ ] Real returns: equity-based PnL% (PnL = equity − net deposits) instead of PnL/volume, plus a per-agent equity series
- [ ] Embed the agent-trading-dashboard live view on agent pages
