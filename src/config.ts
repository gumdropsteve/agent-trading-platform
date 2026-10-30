// Every number the platform's economics depend on lives here, so a change is one edit.
// Env values use || so an empty variable (as CI passes an unset one) keeps the default.
// None of this is enforced on-chain yet: see TODO.md.

export const STAGE = 'Beta'

export const TOKEN = {
  symbol: import.meta.env.VITE_TOKEN_SYMBOL || 'AGENT',
  // Set once the token is launched on Baum (Pons, Robinhood Chain). Until then token actions are disabled.
  address: import.meta.env.VITE_TOKEN_ADDRESS || '',
}

// Where the token lives.
export const CHAIN = {
  id: 4663,
  name: 'Robinhood Chain',
  rpc: 'https://rpc.mainnet.chain.robinhood.com',
  explorer: 'https://robinhoodchain.blockscout.com',
}

export const BAUM = {
  bot: import.meta.env.VITE_BAUM_BOT || 'BaumReviewBot',
  // This app's Baum referral code: every user sent to Baum is attributed to it.
  // Keep it to 13 characters or fewer, or copy links (atp-copy-<40 hex>-CODE) overflow Telegram's 64.
  referralCode: import.meta.env.VITE_BAUM_REF || 'ASH-LEAF-85',
}

export const FEES = {
  // Burned to boost a listing to the top of its category and the vaults page.
  boostPerHour: 100_000,
  // Opening a vault costs whichever is less.
  vaultOpenTokens: 1_000_000,
  vaultOpenUsd: 100,
  // Platform share of a vault's fees, by how the depositor found it.
  platformShareDiscovered: 0.3, // found through this platform's promotion
  platformShareDirect: 0.1, // came from an outside link or the vault operator
  // Added on top of Baum's swap fee on this app's swap page.
  swapBps: 10,
}

// Where platform fee revenue goes. Shares must sum to 1.
export const FEE_SPLIT = [
  { key: 'burn', label: 'Buy back & burn', share: 0.5 },
  { key: 'top3', label: 'Weekly prize: top 3 strategies', share: 0.1 },
  { key: 'stakers', label: 'Stakers', share: 0.1 },
  { key: 'treasury', label: 'Treasury & operations', share: 0.3 },
] as const

// Traders are sorted by Baum from their on-chain trades (classifyTrader in Baum's
// leaderboard): Creators, BAUM traders, Memecoins, Flippers, Holders, Discretionary.
// Yield comes from Baum's top-LPs board; Copy trading from agents with a copy strategy.
export const CATEGORIES = [
  'Memecoins',
  'Flippers',
  'Holders',
  'BAUM traders',
  'Creators',
  'Yield',
  'Copy trading',
  'Discretionary',
] as const
export type Category = (typeof CATEGORIES)[number]
