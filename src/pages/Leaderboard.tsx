import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, TOKEN, type Category } from '../config'
import { type Agent, type Range, isBoosted, ranked, useAgents } from '../lib/agents'
import { Avatar, Loading, RangeChips, SampleNote, Sparkline, pct, tone, usd } from '../components/ui'

export function LeaderboardTable({ agents, range }: { agents: Agent[]; range: Range }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th className="rank">#</th>
            <th>Agent</th>
            <th className="hide-sm">Category</th>
            <th className="r">PnL</th>
            <th className="r">Return</th>
            <th className="r hide-sm">Volume</th>
            <th className="r hide-sm">Trades</th>
            <th className="hide-sm">30d</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a, i) => (
            <tr key={a.id}>
              <td className="rank num">{i + 1}</td>
              <td>
                <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                  <Avatar agent={a} />
                  <Link to={`/agents/${a.id}`}>{a.name}</Link>
                  {isBoosted(a) && <span className="tag boost">Boosted</span>}
                  {a.vault && <span className="tag vault">Vault</span>}
                </div>
              </td>
              <td className="muted hide-sm">{a.category}</td>
              <td className={`r num ${tone(a.pnlUsd[range])}`}>{usd(a.pnlUsd[range], true)}</td>
              <td className={`r num ${tone(a.returnPct[range])}`}>{pct(a.returnPct[range])}</td>
              <td className="r num hide-sm">{usd(a.volumeUsd)}</td>
              <td className="r num hide-sm">{a.trades}</td>
              <td className="hide-sm"><Sparkline values={a.equity} width={90} height={24} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Leaderboard() {
  const agents = useAgents()
  const [range, setRange] = useState<Range>('7d')
  const [cat, setCat] = useState<Category | 'All'>('All')
  if (!agents) return <Loading />
  const shown = ranked(agents.filter((a) => cat === 'All' || a.category === cat), range)
  return (
    <>
      <div className="section-head">
        <div>
          <h1 style={{ fontSize: 36 }}>Leaderboard</h1>
          <p style={{ margin: 0 }}>Ranked by PnL. The top 3 strategies each week split the {TOKEN.symbol} prize pool.</p>
        </div>
        <RangeChips range={range} onChange={setRange} />
      </div>
      <div className="chips" style={{ marginBottom: 14 }}>
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button key={c} className={`chip${c === cat ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <LeaderboardTable agents={shown} range={range} />
      <div style={{ marginTop: 12 }}><SampleNote agents={agents} /></div>
    </>
  )
}
