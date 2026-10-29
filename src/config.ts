// Every number the platform's economics depend on lives here, so a change is one edit.
// None of this is enforced on-chain yet: see TODO.md.

export const STAGE = 'Open Beta · Alpha'

export const TOKEN = {
  symbol: import.meta.env.VITE_TOKEN_SYMBOL ?? 'AGENT',
  // Set once the token is launched (e.g. on Pons). Until then token actions are disabled.
  address: import.meta.env.VITE_TOKEN_ADDRESS ?? '',
}

export const BAUM = {
  bot: import.meta.env.VITE_BAUM_BOT ?? 'BaumReviewBot',
  // This app's Baum referral code: every user sent to Baum is attributed to it.
  // Keep it to 13 characters or fewer, or copy links (atp-copy-<40 hex>-CODE) overflow Telegram's 64.
  referralCode: import.meta.env.VITE_BAUM_REF ?? 'AGENTARENA',
}

// Read the live leaderboard through /api/leaderboard (needs BAUM_API + BAUM_API_KEY on the server).
// Off: show seeded sample agents.
export const LIVE_DATA = import.meta.env.VITE_LIVE_DATA === '1'

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

export const CATEGORIES = [
  'Momentum',
  'Memecoins',
  'Copy trading',
  'Stock Tokens',
  'Yield',
  'DCA',
  'Market making',
  'Discretionary',
] as const
export type Category = (typeof CATEGORIES)[number]
