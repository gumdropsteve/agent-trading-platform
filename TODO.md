# TODO

Each of these is bigger than a quick change. The beta ships without them; the UI shows them as "coming soon" or disabled.

## Go live (small, do first)
- [x] Referral code: `ASH-LEAF-85`, the Stable code of the platform's Baum wallet (0xa776…D66f). Don't re-roll it in Stable, or every link breaks
- [x] Baum-side support: `atp-` deep links, the partner-keyed `GET /api/leaderboard`, range-aware PnL, and API keys requiring a confirmed email
- [ ] Fund the platform's Baum wallet with BAUM and some ETH, confirm an email with `/email`, run `/apikey new`, then set the `BAUM_API_KEY` Actions secret
- [ ] Confirm the production bot username (`VITE_BAUM_BOT`)
- [ ] Pick the final name and a custom domain for Pages ("Agent Arena" is a working name)

## Token
- [ ] Launch the platform token on Baum, then set the `TOKEN_SYMBOL` and `TOKEN_ADDRESS` repo variables (see the README). The site is ready for it.

## Boosts (100k tokens burned per hour)
- [x] On-chain burn flow: a tagged transfer to the dead address, sent from the agent page (`src/lib/wallet.ts`)
- [x] Indexer: the Pages job turns burns into `boostedUntil` per agent every 10 minutes (`scripts/fetch-token.mjs`)
- [ ] Credit boosts from smart wallets: a small BoostBurner contract that emits `Boosted(agent, amount)`
- [ ] Vault boosts, once vaults exist (today a boost is per agent)

## Vaults
- [ ] Design doc: custody (an ERC-4626 vault, a Safe module, or a Baum-managed wallet), how the agent trades vault funds, withdrawals, and when the performance fee is charged
- [ ] Opening fee: min(1M tokens, $100 of the token)
- [ ] Platform share of vault fees: 30% when the depositor found the vault on the platform, 10% when they came from the operator's link (`?via=`). Attribution is client-side today (`src/lib/attribution.ts`); the source has to travel with the deposit on-chain.
- [ ] Audit before real deposits

## Fee router
- [ ] Collect platform revenue: the Baum referral share, vault fee shares, and swap bps
- [ ] Split it: 50% buys back and burns the token, 10% buys back for a weekly prize to the top 3 strategies, 10% buys back for stakers, 30% to the treasury (`FEE_SPLIT` in `src/config.ts`)
- [x] Snapshot the weekly top 3 on the 7d board (Monday 00:00 UTC, `data/winners.json`)
- [ ] Pay the weekly top 3 automatically

## Staking and voting (optional)
- [ ] Stake to earn the stakers' share, and maybe vote on featured agents or fees. Decide after launch.

## Swap page (+10 bps)
- [ ] Baum partner swap API: API key, quote, and an unsigned transaction with a partner fee
- [ ] Wire up `src/pages/Swap.tsx` with a wallet connection (wagmi/viem)

## Copy trading
- [ ] Baum: follow a platform agent the same way users already follow fomo traders and politicians. The `atp-copy-…` link should then start following directly.

## Agents
- [ ] Register existing (non-Baum) agents: prove ownership with a signed message, index the wallet's trades (agent-trading-dashboard's replay pipeline does this for Solana), and list it
- [x] Yield: wallets on Baum's top-LPs board are listed under Yield with LP stats
- [x] Auto-sort traders into categories (Baum's `classifyTrader`)
- [ ] Owners pick their own category, name, description and avatar; snipers (needs first-buy timing in Baum's tally)
- [ ] Real returns: equity-based PnL% (PnL = equity − net deposits) instead of PnL/volume, plus a per-agent equity series
- [ ] Embed the agent-trading-dashboard live view on agent pages
