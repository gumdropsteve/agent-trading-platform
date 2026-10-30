import { Link } from 'react-router-dom'
import { type Agent, type Range, isBoosted } from '../lib/agents'
import { baumLinks } from '../lib/baum'

export const usd = (n: number, signed = false) => {
  const s = Math.abs(n) >= 1e6 ? `$${(Math.abs(n) / 1e6).toFixed(2)}M`
    : Math.abs(n) >= 1e4 ? `$${(Math.abs(n) / 1e3).toFixed(1)}k`
    : `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return (n < 0 ? '−' : signed ? '+' : '') + s
}
export const pct = (n: number) => (Number.isFinite(n) ? `${n < 0 ? '−' : '+'}${Math.abs(n * 100).toFixed(1)}%` : '—')
export const tokens = (n: number) => n.toLocaleString('en-US')
export const CATEGORY_TIP = "Sorted automatically from this wallet's trades on Baum"
export const tone = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : '')

const HUES = [210, 160, 25, 280, 340, 45, 190, 120]
export function Avatar({ agent }: { agent: Agent }) {
  const h = HUES[parseInt(agent.id.slice(2, 4), 16) % HUES.length]
  // Unnamed wallets are named 0x1234…abcd; their initials are the hex after 0x, not "0X".
  const initials = agent.name.replace(/^0x/i, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()
  return <span className="avatar" style={{ background: `hsl(${h} 55% 45%)` }}>{initials}</span>
}

export function Sparkline({ values, width = 120, height = 32, fluid = false }: { values: number[]; width?: number; height?: number; fluid?: boolean }) {
  if (values.length < 2) return null
  const min = Math.min(...values), max = Math.max(...values)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / (max - min || 1)) * (height - 2) - 1}`)
  const up = values[values.length - 1] >= values[0]
  return (
    <svg width={fluid ? '100%' : width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke={up ? 'var(--up)' : 'var(--down)'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// `lp` shows the LP stats (fees, liquidity) instead of trading PnL, for the Yield section.
export function AgentCard({ agent, range = '7d', lp = false }: { agent: Agent; range?: Range; lp?: boolean }) {
  return (
    <Link to={`/agents/${agent.id}`} className={`card agent-card${isBoosted(agent) ? ' boosted' : ''}`}>
      <div className="agent-top">
        <div className="row" style={{ gap: 10 }}>
          <Avatar agent={agent} />
          <div>
            <div style={{ fontWeight: 600 }}>{agent.name}</div>
            <div className="row" style={{ gap: 4 }}>
              {agent.categories.map((c) => <span key={c} className="tag" title={CATEGORY_TIP}>{c}</span>)}
              {isBoosted(agent) && <span className="tag boost">Boosted</span>}
              {agent.vault && <span className="tag vault">Vault</span>}
            </div>
          </div>
        </div>
        <Sparkline values={agent.equity} width={80} height={28} />
      </div>
      <p style={{ margin: 0, fontSize: 14 }}>{agent.description}</p>
      {lp && agent.lp ? (
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className={`num ${tone(agent.lp.feesUsd[range])}`}>{usd(agent.lp.feesUsd[range], true)} <span className="muted">fees {range}</span></span>
          <span className="num muted">{usd(agent.lp.liquidityUsd)} liquidity</span>
        </div>
      ) : (
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className={`num ${tone(agent.pnlUsd[range])}`}>{usd(agent.pnlUsd[range], true)} <span className="muted">{range}</span></span>
        {Number.isFinite(agent.returnPct[range]) && <span className={`num ${tone(agent.returnPct[range])}`}>{pct(agent.returnPct[range])}</span>}
      </div>
      )}
    </Link>
  )
}

export function LaunchButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className="row">
      <a className={`btn primary${compact ? ' sm' : ''}`} href={baumLinks.launch()} target="_blank" rel="noreferrer">Launch an Agent</a>
      <a className={`btn${compact ? ' sm' : ''}`} href={baumLinks.register()} target="_blank" rel="noreferrer">Register an Agent</a>
    </div>
  )
}

export function RangeChips({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  return (
    <div className="chips" role="tablist">
      {(['24h', '7d', 'all'] as Range[]).map((r) => (
        <button key={r} role="tab" aria-selected={r === range} className={`chip${r === range ? ' on' : ''}`} onClick={() => onChange(r)}>
          {r === 'all' ? 'All time' : r}
        </button>
      ))}
    </div>
  )
}

export function SampleNote({ agents }: { agents: Agent[] }) {
  if (!agents.some((a) => a.sample)) return null
  return <p className="callout">Preview: these agents are sample data. Live Baum agents appear here once the leaderboard feed is connected.</p>
}

export function Loading() {
  return <p className="muted">Loading agents…</p>
}
