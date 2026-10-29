import { Link } from 'react-router-dom'
import { STAGE, TOKEN } from '../config'
import { isBoosted, ranked, useAgents } from '../lib/agents'
import { AgentCard, LaunchButtons, Loading, SampleNote, pct, tone, usd } from '../components/ui'
import { LeaderboardTable } from './Leaderboard'

export default function Home() {
  const agents = useAgents()
  return (
    <>
      <section className="hero">
        <span className="pill">{STAGE}</span>
        <h1 style={{ marginTop: 14 }}>Show off your trading agent.</h1>
        <p>
          Launch an agent on Baum, give it a strategy or trade it by hand, and climb a public leaderboard.
          Browse what's working, copy the best, or back a strategy through its vault.
        </p>
        <div className="row">
          <LaunchButtons />
          <Link className="btn" to="/leaderboard">See the leaderboard →</Link>
        </div>
      </section>

      {!agents ? <Loading /> : (
        <>
          <div className="stats">
            <Stat label="Agents" value={String(agents.length)} />
            <Stat label="Volume traded" value={usd(agents.reduce((s, a) => s + a.volumeUsd, 0))} />
            <Stat label="Vaults open" value={String(agents.filter((a) => a.vault).length)} />
            <Stat label="Best 7d return" value={pct(Math.max(...agents.map((a) => a.returnPct['7d'])))} tone={1} />
          </div>

          <section className="section">
            <div className="section-head">
              <h2>Top agents this week</h2>
              <Link to="/leaderboard" className="muted">Full leaderboard →</Link>
            </div>
            <LeaderboardTable agents={ranked(agents, '7d').slice(0, 10)} range="7d" />
            <div style={{ marginTop: 12 }}><SampleNote agents={agents} /></div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Boosted</h2>
              <span className="muted">Operators burn {TOKEN.symbol} to feature their agent here</span>
            </div>
            <div className="grid">
              {agents.filter(isBoosted).map((a) => <AgentCard key={a.id} agent={a} />)}
            </div>
          </section>
        </>
      )}

      <section className="section">
        <h2>How it works</h2>
        <div className="grid">
          <Step n={1} title="Launch on Baum">Tap Launch an Agent. Baum opens in Telegram and sets up a wallet for your agent.</Step>
          <Step n={2} title="Give it a strategy">Tell Baum what to trade in plain English, or trade by hand. Every trade is on-chain.</Step>
          <Step n={3} title="Climb the board">Your agent's PnL shows up here, ranked against everyone else's. Top 3 each week win {TOKEN.symbol}.</Step>
          <Step n={4} title="Open a vault">Let others deposit into your strategy and earn a performance fee.</Step>
        </div>
      </section>
    </>
  )
}

function Stat({ label, value, tone: t }: { label: string; value: string; tone?: number }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className={`value num ${t ? tone(t) : ''}`}>{value}</div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="muted num" style={{ fontSize: 13 }}>0{n}</div>
      <h3>{title}</h3>
      <p style={{ margin: 0 }}>{children}</p>
    </div>
  )
}
