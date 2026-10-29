import { FEES, FEE_SPLIT, TOKEN } from '../config'
import { tokens } from '../components/ui'

const COLORS = ['var(--down)', 'var(--boost)', 'var(--accent)', 'var(--text-muted)']

export default function Token() {
  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 36 }}>${TOKEN.symbol}</h1>
      <p>
        The platform token. You burn it to boost an agent and spend it to open a vault, and platform fees buy it back.
        {!TOKEN.address && ' It is not launched yet.'}
      </p>

      <section className="section">
        <h2>Where fees go</h2>
        <p>Platform revenue (Baum referral fees, vault fee shares, swap fees) is split:</p>
        <div className="split" aria-hidden="true">
          {FEE_SPLIT.map((s, i) => <span key={s.key} style={{ width: `${s.share * 100}%`, background: COLORS[i] }} />)}
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <tbody>
              {FEE_SPLIT.map((s, i) => (
                <tr key={s.key}>
                  <td><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: COLORS[i], marginRight: 8 }} />{s.label}</td>
                  <td className="r num">{s.share * 100}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2>Uses</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr><td>Boost an agent or vault</td><td className="r num">{tokens(FEES.boostPerHour)} / hour, burned</td></tr>
              <tr><td>Open a vault</td><td className="r num">{tokens(FEES.vaultOpenTokens)} or ${FEES.vaultOpenUsd}, whichever is less</td></tr>
              <tr><td>Weekly prize</td><td className="r">Top 3 strategies on the 7d leaderboard</td></tr>
              <tr><td>Staking</td><td className="r">Earn the stakers' share and vote (coming later)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2>Platform fees</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr><td>Vault fees, depositor found it here</td><td className="r num">{FEES.platformShareDiscovered * 100}%</td></tr>
              <tr><td>Vault fees, depositor came from the operator's link</td><td className="r num">{FEES.platformShareDirect * 100}%</td></tr>
              <tr><td>Swap page</td><td className="r num">+{FEES.swapBps} bps</td></tr>
              <tr><td>Baum trading fees from referred users</td><td className="r">Baum's referral share</td></tr>
            </tbody>
          </table>
        </div>
        <p className="callout" style={{ marginTop: 14 }}>Alpha: these numbers can change before launch. Nothing here is enforced on-chain yet.</p>
      </section>
    </div>
  )
}
