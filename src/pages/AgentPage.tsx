import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { FEES, TOKEN } from '../config'
import { type Range, isBoosted, useAgents } from '../lib/agents'
import { baumLinks } from '../lib/baum'
import { depositSource, operatorLink, platformShare, recordLanding } from '../lib/attribution'
import { Avatar, Loading, RangeChips, Sparkline, pct, tokens, tone, usd } from '../components/ui'

export default function AgentPage() {
  const { id = '' } = useParams()
  const { search } = useLocation()
  const agents = useAgents()
  const [range, setRange] = useState<Range>('7d')
  const [hours, setHours] = useState(1)
  const [copied, setCopied] = useState(false)
  useEffect(() => recordLanding(id, search), [id, search])

  if (!agents) return <Loading />
  const agent = agents.find((a) => a.id.toLowerCase() === id.toLowerCase())
  if (!agent) return <p>No agent with that address. <Link to="/agents">Browse agents</Link></p>

  const share = platformShare(depositSource(agent.id))
  const tokenLive = Boolean(TOKEN.address)

  return (
    <>
      <div className="section-head">
        <div className="row" style={{ gap: 14 }}>
          <Avatar agent={agent} />
          <div>
            <h1 style={{ fontSize: 32, margin: 0 }}>{agent.name}</h1>
            <div className="row" style={{ gap: 6 }}>
              <span className="tag">{agent.category}</span>
              {isBoosted(agent) && <span className="tag boost">Boosted</span>}
              {agent.vault && <span className="tag vault">Vault</span>}
              {agent.sample && <span className="tag">Sample</span>}
              <span className="muted num" style={{ fontSize: 13 }}>{agent.id.slice(0, 10)}…{agent.id.slice(-6)}</span>
            </div>
          </div>
        </div>
        <RangeChips range={range} onChange={setRange} />
      </div>
      <p>{agent.description}</p>

      <div className="stats">
        <div className="card stat"><div className="label">PnL ({range})</div><div className={`value num ${tone(agent.pnlUsd[range])}`}>{usd(agent.pnlUsd[range], true)}</div></div>
        <div className="card stat"><div className="label">Return ({range})</div><div className={`value num ${tone(agent.returnPct[range])}`}>{pct(agent.returnPct[range])}</div></div>
        <div className="card stat"><div className="label">Volume</div><div className="value num">{usd(agent.volumeUsd)}</div></div>
        <div className="card stat"><div className="label">Trades</div><div className="value num">{agent.trades}</div></div>
        <div className="card stat"><div className="label">Win rate</div><div className="value num">{Number.isFinite(agent.winRate) ? `${Math.round(agent.winRate * 100)}%` : '—'}</div></div>
      </div>

      {agent.equity.length > 1 && (
        <div className="card section" style={{ overflow: 'hidden' }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Equity, last 30 days</div>
          <Sparkline values={agent.equity} width={1080} height={160} fluid />
        </div>
      )}

      <div className="grid section">
        <div className="card">
          <h3>Copy this agent</h3>
          <p>Baum opens in Telegram with this agent ready to copy. Auto-copy of agents is rolling out during the beta.</p>
          <a className="btn primary" href={baumLinks.copy(agent.id)} target="_blank" rel="noreferrer">Copy on Baum</a>
        </div>

        <div className="card">
          <h3>Vault</h3>
          {agent.vault ? (
            <>
              <p className="num" style={{ marginBottom: 6 }}>TVL {usd(agent.vault.tvlUsd)} · {agent.vault.depositors} depositors · {agent.vault.feePct}% performance fee</p>
              <p className="note">Of the operator's fee, the platform keeps {share * 100}% ({share === FEES.platformShareDirect ? 'you came from the operator\'s link' : 'you found it here'}).</p>
              <button className="btn" disabled>Deposit (coming soon)</button>
            </>
          ) : (
            <>
              <p>This agent doesn't take deposits. Operators open a vault for {tokens(FEES.vaultOpenTokens)} {TOKEN.symbol} or ${FEES.vaultOpenUsd} of it, whichever is less.</p>
              <Link className="btn" to="/vaults">About vaults</Link>
            </>
          )}
        </div>

        <div className="card">
          <h3>Boost</h3>
          <p>Burn {tokens(FEES.boostPerHour)} {TOKEN.symbol} an hour to feature this agent at the top of {agent.category} and on the home page.</p>
          <div className="row">
            <select value={hours} onChange={(e) => setHours(Number(e.target.value))} style={{ width: 'auto' }}>
              {[1, 6, 24, 72, 168].map((h) => <option key={h} value={h}>{h < 24 ? `${h}h` : `${h / 24}d`}</option>)}
            </select>
            <button className="btn boost" disabled={!tokenLive}>Burn {tokens(FEES.boostPerHour * hours)} {TOKEN.symbol}</button>
          </div>
          {!tokenLive && <p className="note" style={{ marginTop: 8, marginBottom: 0 }}>Opens when {TOKEN.symbol} launches.</p>}
        </div>

        <div className="card">
          <h3>Share</h3>
          <p>Your own link. Deposits through it pay the platform {FEES.platformShareDirect * 100}% of your fees instead of {FEES.platformShareDiscovered * 100}%.</p>
          <button
            className="btn"
            onClick={() => navigator.clipboard?.writeText(operatorLink(agent.id)).then(() => setCopied(true))}
          >
            {copied ? 'Copied' : 'Copy operator link'}
          </button>
        </div>
      </div>
    </>
  )
}
