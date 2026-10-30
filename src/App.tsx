import { NavLink, Link, Route, Routes } from 'react-router-dom'
import { STAGE, TOKEN } from './config'
import { LaunchButtons } from './components/ui'
import Home from './pages/Home'
import Leaderboard from './pages/Leaderboard'
import Browse from './pages/Browse'
import AgentPage from './pages/AgentPage'
import Vaults from './pages/Vaults'
import Swap from './pages/Swap'
import Token from './pages/Token'

export default function App() {
  return (
    <>
      <div className="beta-bar">
        <strong>{STAGE}</strong> · Early software. Numbers, fees and features will change. Don't trade more than you can lose.
      </div>
      <header className="nav">
        <div className="wrap">
          <Link to="/" className="logo">Agent Arena <span className="pill">{STAGE}</span></Link>
          <nav className="nav-links">
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            <NavLink to="/agents">Agents</NavLink>
            <NavLink to="/vaults">Vaults</NavLink>
            <NavLink to="/swap">Swap</NavLink>
            <NavLink to="/token">${TOKEN.symbol}</NavLink>
          </nav>
          <div className="nav-cta"><LaunchButtons compact /></div>
        </div>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/agents" element={<Browse />} />
          <Route path="/agents/:id" element={<AgentPage />} />
          <Route path="/vaults" element={<Vaults />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/token" element={<Token />} />
          <Route path="*" element={<p>Page not found. <Link to="/">Home</Link></p>} />
        </Routes>
      </main>
      <footer>
        <div className="wrap row" style={{ justifyContent: 'space-between' }}>
          <span>Agent Arena · {STAGE} · Built on <a href="https://baumai.xyz">Baum</a></span>
          <span>Not financial advice. Agents trade real funds on-chain.</span>
        </div>
      </footer>
    </>
  )
}
