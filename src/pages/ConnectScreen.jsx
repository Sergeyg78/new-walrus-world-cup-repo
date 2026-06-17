// Landing page — wallet connect + load existing session by blob ID
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { useState } from 'react'
import { useWalrus } from '../hooks/useWalrus'
import { emptyState, recalcStats } from '../lib/state'
import toast from 'react-hot-toast'

export function ConnectScreen({ setAppState, setBlobChain }) {
  const account           = useCurrentAccount()
  const { load, loading } = useWalrus()
  const [blobId, setBlobId] = useState('')

  // ── Start a fresh session ─────────────────────────────────────────────────
  function handleNew() {
    if (!account) {
      toast.error('Connect your Sui wallet first')
      return
    }
    setAppState(emptyState(account.address))
    setBlobChain([])
    toast.success('Fresh session started! No grudges... yet. 😈')
  }

  // ── Restore session from a Walrus blob ID ─────────────────────────────────
  async function handleLoad() {
    if (!blobId.trim()) {
      toast.error('Paste a blob ID first')
      return
    }
    try {
      const data     = await load(blobId.trim())
      const restored = recalcStats({
        ...data,
        address:   account?.address || data.address || 'unknown',
        blobChain: data.blobChain || [blobId.trim()],
      })
      setAppState(restored)
      setBlobChain(restored.blobChain)
      toast.success('Memory restored! I remember EVERYTHING. 🧠')
    } catch (err) {
      toast.error(`Could not load blob: ${err.message}`)
    }
  }

  return (
    <div className="connect-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="hero">
        <div className="hero-stripe" />
        <div className="hero-inner">
          <span className="hero-ball">⚽</span>
          <h1>WC2026 GRUDGE AGENT</h1>
          <p className="subtitle">
            Predict · Get Roasted · Hold Grudges · Never Forget
          </p>
          <div className="hero-badges">
            <span className="badge-pill usa">🇺🇸 USA 2026</span>
            <span className="badge-pill wc">⚽ 48 Teams · 104 Matches</span>
            <span className="badge-pill walrus">🌊 Walrus Mainnet</span>
            <span className="badge-pill roast">🔥 AI Roast Engine</span>
          </div>
        </div>
      </div>

      {/* ── Ticker ───────────────────────────────────────────────────────── */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          ⚽ WC2026 kicks off June 11, 2026 &nbsp;·&nbsp;
          🏟️ MetLife Stadium hosts the Final &nbsp;·&nbsp;
          🇺🇸 USA · 🇨🇦 Canada · 🇲🇽 Mexico co-hosting &nbsp;·&nbsp;
          🔥 Every wrong prediction stored on Walrus Mainnet forever &nbsp;·&nbsp;
          😤 The agent never forgets &nbsp;·&nbsp;
          🌊 Powered by @mysten/walrus TypeScript SDK &nbsp;·&nbsp;
          ⚡ Connect your Sui wallet to begin &nbsp;·&nbsp;
          🏆 48 teams competing for glory &nbsp;·&nbsp;
        </div>
      </div>

      {/* ── Feature cards ────────────────────────────────────────────────── */}
      <div className="features-grid">
        {[
          {
            icon:  '🧠',
            title: 'Persistent Memory',
            desc:  'Predictions stored as blobs on Walrus Mainnet. Your Sui wallet IS your identity — no passwords, no accounts.',
            color: '#00bcd4',
          },
          {
            icon:  '🔥',
            title: 'AI Roast Engine',
            desc:  'Claude AI roasts every wrong prediction brutally — with full receipts from your past failures going back forever.',
            color: '#f44336',
          },
          {
            icon:  '😤',
            title: 'Grudge System',
            desc:  'Every wrong call logged in a Walrus blob chain. The agent brings them up across every session. Always.',
            color: '#9c27b0',
          },
          {
            icon:  '🏆',
            title: 'Leaderboard',
            desc:  'Public rankings stored on Walrus Mainnet. Fully verifiable by anyone on WalrusScan.',
            color: '#ff9800',
          },
          {
            icon:  '📖',
            title: 'Session Replay',
            desc:  'Full timestamped history of every prediction, roast, hot take and grudge pulled from your blob chain.',
            color: '#2196f3',
          },
          {
            icon:  '🔐',
            title: 'Wallet Auth',
            desc:  'No username. No password. No PIN. Your Sui wallet address is your identity. Connect and play.',
            color: '#4caf50',
          },
        ].map(({ icon, title, desc, color }) => (
          <div
            className="feat-card"
            key={title}
            style={{ '--accent': color }}
          >
            <span className="feat-icon">{icon}</span>
            <div className="feat-title">{title}</div>
            <div className="feat-desc">{desc}</div>
          </div>
        ))}
      </div>

      {/* ── Connect + Load panel ─────────────────────────────────────────── */}
      <div className="connect-panel">

        {/* Connect wallet box */}
        <div className="connect-box">
          <h2>🔐 Connect Wallet</h2>
          <p>
            Connect your Sui wallet (Slush, Suiet, or any Sui wallet).
            Your wallet pays for Walrus storage directly — roughly 0.01 SUI per save.
          </p>
          <div className="connect-btn-wrap">
            <ConnectButton />
          </div>
          {account && (
            <div className="wallet-connected">
              <span className="dot green" />
              <span>
                {account.address.slice(0, 8)}...{account.address.slice(-6)}
              </span>
            </div>
          )}
        </div>

        <div className="or-divider">OR</div>

        {/* Load by blob ID box */}
        <div className="connect-box">
          <h2>📥 Load Existing Session</h2>
          <p>
            Have a blob ID from a previous session?
            Paste it below to restore all your predictions, grudges, and hot takes.
          </p>
          <input
            className="blob-input"
            placeholder="Paste your Walrus blob ID..."
            value={blobId}
            onChange={e => setBlobId(e.target.value)}
          />
          <button
            className="btn-primary"
            onClick={handleLoad}
            disabled={loading || !blobId.trim()}
          >
            {loading ? '⏳ Loading from Walrus...' : '📥 Load Memory'}
          </button>
        </div>

      </div>

      {/* ── Start fresh button (only shown when wallet connected) ─────────── */}
      {account && (
        <div className="start-wrap">
          <button className="btn-start" onClick={handleNew}>
            🚀 Start Fresh Session
          </button>
          <p className="hint" style={{ textAlign: 'center', marginTop: 8 }}>
            Your first save will prompt your wallet twice (register + certify on Sui)
          </p>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="footer-note">
        ⚽ WC2026 Grudge Agent · Powered by Walrus Mainnet · Built on Sui ·
        <a
          href="https://walruscan.com/mainnet"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#40c4ff', marginLeft: 6 }}
         >
          WalrusScan ↗
        </a>
      </div>

    </div>
  )
}
