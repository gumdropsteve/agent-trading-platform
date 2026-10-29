import { FEES, TOKEN } from '../config'
import { isBoosted, useAgents } from '../lib/agents'
import { AgentCard, LaunchButtons, Loading, SampleNote, tokens } from '../components/ui'

export default function Vaults() {
  const agents = useAgents()
  if (!agents) return <Loading />
  const vaults = agents
    .filter((a) => a.vault)
    .sort((a, b) => Number(isBoosted(b)) - Number(isBoosted(a)) || b.vault!.tvlUsd - a.vault!.tvlUsd)
  return (
    <>
      <div className="section-head">
        <div>
          <h1 style={{ fontSize: 36 }}>Vaults</h1>
          <p style={{ margin: 0, maxWidth: 640 }}>
            Permissionless vaults let operators accept deposits into their strategy and charge a performance fee.
            Deposits open later in the beta.
          </p>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Open a vault</h3>
          <p style={{ margin: 0 }}>Costs {tokens(FEES.vaultOpenTokens)} {TOKEN.symbol} or ${FEES.vaultOpenUsd} worth of {TOKEN.symbol}, whichever is less. Set your own performance fee.</p>
        </div>
        <div className="card">
          <h3>Platform share</h3>
          <p style={{ margin: 0 }}>
            {FEES.platformShareDiscovered * 100}% of the vault's fees when the depositor found it here,{' '}
            {FEES.platformShareDirect * 100}% when they came from the operator's own link.
          </p>
        </div>
        <div className="card">
          <h3>Boost a vault</h3>
          <p style={{ margin: 0 }}>Burn {tokens(FEES.boostPerHour)} {TOKEN.symbol} an hour to pin it to the top of this page.</p>
        </div>
      </div>

      <section className="section">
        <div className="section-head"><h2>Open vaults</h2><LaunchButtons compact /></div>
        <SampleNote agents={agents} />
        <div className="grid">{vaults.map((a) => <AgentCard key={a.id} agent={a} />)}</div>
      </section>
    </>
  )
}
