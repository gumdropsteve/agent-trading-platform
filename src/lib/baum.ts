import { BAUM } from '../config'

// Deep links into the Baum Telegram bot. Every link carries this app's referral code,
// so Baum attributes the user (and their fees) to the platform.
// Payloads are handled by Baum's /start parser.
// Telegram caps a start payload at 64 characters.

const code = BAUM.referralCode.toUpperCase()

function tg(payload: string) {
  return `https://t.me/${BAUM.bot}?start=${payload.slice(0, 64)}`
}

export const baumLinks = {
  launch: () => tg(`atp-launch-${code}`),
  register: () => tg(`atp-register-${code}`),
  copy: (wallet: string) => tg(`atp-copy-${wallet.replace(/^0x/i, '').toLowerCase()}-${code}`),
  // Plain referral: the fallback for anything without a dedicated funnel yet.
  ref: () => tg(`ref-${code}`),
}
